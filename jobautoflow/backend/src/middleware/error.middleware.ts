/**
 * Global Error Handler Middleware
 * Centralized error handling for all API routes
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: any[];
  stack?: string;
}

export const errorHandler = (
  err: Error | ApiError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let errors: any[] | undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    errors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ERROR';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        code = 'CONSTRAINT_ERROR';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
    }
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    code = 'VALIDATION_ERROR';
  }
  // Handle custom API errors
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
  }
  // Handle standard errors
  else if (err instanceof Error) {
    message = err.message;
  }

  // Log error
  logger.error({
    message: err.message,
    statusCode,
    code,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
    stack: err.stack,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
  };

  if (errors) {
    errorResponse.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
