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
  extra?: Record<string, any> | any[]
) {
  const errorObj: Record<string, any> = { code, message };
  if (Array.isArray(extra)) {
    errorObj.pendingItems = extra;
  } else if (extra && typeof extra === 'object') {
    Object.assign(errorObj, extra);
  }
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: errorObj,
  });
}
