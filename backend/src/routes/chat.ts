import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { io } from '../server.js';

export const chatRouter = Router();

// GET /api/v1/chat/conversations
// Returns all conversations for the authenticated user
chatRouter.get('/conversations', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ seekerId: userId }, { recruiterId: userId }],
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          pay: true,
          payUnit: true,
        },
      },
      seeker: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      recruiter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isVerified: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const formatted = conversations.map((conv) => {
    const isSeeker = conv.seekerId === userId;
    const peer = isSeeker ? conv.recruiter : conv.seeker;
    const lastMsg = conv.messages[0] || null;

    return {
      id: conv.id,
      jobId: conv.jobId,
      jobTitle: conv.job.title,
      jobType: conv.job.type,
      peer: {
        id: peer.id,
        name: peer.name,
        email: peer.email,
        avatarUrl: peer.avatarUrl,
        isVerified: peer.isVerified,
        role: isSeeker ? 'RECRUITER' : 'SEEKER',
      },
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            text: lastMsg.text,
            senderId: lastMsg.senderId,
            createdAt: lastMsg.createdAt.toISOString(),
            isRead: lastMsg.isRead,
          }
        : null,
      updatedAt: conv.updatedAt.toISOString(),
    };
  });

  return sendSuccess(res, formatted);
});

// GET /api/v1/chat/conversations/:id/messages
// Returns full message history of a conversation
chatRouter.get(
  '/conversations/:id/messages',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const conv = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conv) {
      return sendError(res, 'NOT_FOUND', 'Conversation not found', 404);
    }

    if (conv.seekerId !== userId && conv.recruiterId !== userId) {
      return sendError(res, 'FORBIDDEN', 'Access denied to this conversation', 403);
    }

    // Mark messages from peer as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender.name,
      text: m.text,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }));

    return sendSuccess(res, formatted);
  }
);

// POST /api/v1/chat/conversations/:id/messages
// Sends a new message in the conversation
chatRouter.post(
  '/conversations/:id/messages',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { text } = req.body;
    const user = req.user!;

    if (!text || !text.trim()) {
      return sendError(res, 'VALIDATION_ERROR', 'Message text cannot be empty', 400);
    }

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!conv) {
      return sendError(res, 'NOT_FOUND', 'Conversation not found', 404);
    }

    if (conv.seekerId !== user.id && conv.recruiterId !== user.id) {
      return sendError(res, 'FORBIDDEN', 'Access denied', 403);
    }

    const recipientId = conv.seekerId === user.id ? conv.recruiterId : conv.seekerId;

    const newMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        text: text.trim(),
        isRead: false,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const formattedMessage = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      senderId: newMessage.senderId,
      senderName: user.name,
      text: newMessage.text,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt.toISOString(),
    };

    // Emit live real-time WebSocket event
    if (io) {
      io.to(id).emit('new_message', formattedMessage);
      io.to(`user_${recipientId}`).emit('message_notification', {
        conversationId: id,
        jobTitle: conv.job.title,
        senderName: user.name,
        text: newMessage.text,
      });
    }

    return sendSuccess(res, formattedMessage, 201);
  }
);

// POST /api/v1/chat/job/:jobId
// Finds or creates a chat conversation between Seeker and Recruiter for a job
chatRouter.post('/job/:jobId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const user = req.user!;
  const targetSeekerId = req.body.seekerId; // Passed if recruiter is starting the chat

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return sendError(res, 'NOT_FOUND', 'Job not found', 404);
  }

  let seekerId = '';
  let recruiterId = job.posterId;

  if (user.id === job.posterId) {
    if (!targetSeekerId) {
      return sendError(res, 'VALIDATION_ERROR', 'seekerId is required when initiating chat as recruiter', 400);
    }
    seekerId = targetSeekerId;
  } else {
    seekerId = user.id;
  }

  // Find or create conversation
  let conv = await prisma.conversation.findUnique({
    where: {
      jobId_seekerId: {
        jobId,
        seekerId,
      },
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        jobId,
        seekerId,
        recruiterId,
      },
    });
  }

  return sendSuccess(res, { conversationId: conv.id });
});
