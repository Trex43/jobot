/**
 * Request Middleware
 * Adds unique request ID for tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: any;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};
