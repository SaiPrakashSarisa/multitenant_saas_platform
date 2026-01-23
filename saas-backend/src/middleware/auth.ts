import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request type to include user and tenant
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenantId?: string;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};

// Middleware to check if user has specific role
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};
