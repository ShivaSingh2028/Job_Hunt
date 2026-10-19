import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  pendingItems?: any[]
) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(pendingItems ? { pendingItems } : {}),
    },
  });
}
