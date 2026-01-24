import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-this';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No admin token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;

    if (decoded.type !== 'admin') {
      throw new Error('Invalid token type');
    }

    // Attach admin info to request
    // @ts-ignore
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired admin token',
    });
  }
};
