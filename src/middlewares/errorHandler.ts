import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/appError';
import { sendError } from '../utils/response.util';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Custom Operational AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation error', 400, formattedErrors);
    return;
  }

  // Prisma Errors
  if (err.name === 'PrismaClientInitializationError') {
    sendError(
      res,
      'Database connection failed: Cannot reach PostgreSQL server at localhost:5432. Please ensure your PostgreSQL service or Docker container is running.',
      503
    );
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      sendError(res, 'Unique constraint violation. A record with this unique field already exists.', 409);
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found in database.', 404);
      return;
    }
  }

  // Fallback 500 Internal Server Error
  console.error('Unhandled Server Error:', err);
  sendError(res, 'Internal server error', 500, process.env.NODE_ENV === 'development' ? err.stack : undefined);
}
