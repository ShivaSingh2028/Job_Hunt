import { Router, Request, Response, NextFunction } from 'express';

/**
 * Wraps an Express 4 Router so rejected Promises in async route handlers
 * are forwarded to Express's error middleware instead of crashing the server.
 */
export function createAsyncRouter(): Router {
  const router = Router();
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

  for (const method of methods) {
    const orig = (router as any)[method].bind(router);
    (router as any)[method] = (path: any, ...handlers: any[]) => {
      const wrapped = handlers.map((fn) => {
        if (typeof fn !== 'function' || fn.length >= 4) return fn;
        return (req: Request, res: Response, next: NextFunction) => {
          try {
            Promise.resolve(fn(req, res, next)).catch(next);
          } catch (err) {
            next(err);
          }
        };
      });
      return orig(path, ...wrapped);
    };
  }

  return router;
}
