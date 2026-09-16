import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten() });
    return;
  }

  const status = err.status ?? 500;
  if (status < 500) {
    // Client error (401, 403, 409, etc.) — no need to log stack
    res.status(status).json({ error: err.message });
    return;
  }

  console.error('[API Error]', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev ? { detail: err.message } : {}),
  });
}
