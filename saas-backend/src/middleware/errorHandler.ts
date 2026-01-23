import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: `${prismaError.meta?.target?.[0] || 'Field'} already exists`,
      });
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
    }
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};
