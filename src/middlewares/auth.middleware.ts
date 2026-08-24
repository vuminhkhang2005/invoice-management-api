import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/auth.constant';
import { AppError } from '../errors/appError';
import { AuthService, AuthUserPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

const authService = new AuthService();

/**
 * Middleware to verify JWT Bearer token
 */
export function authenticate(required = false) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (required) {
        throw new AppError('Authentication required. Missing Bearer token in Authorization header.', 401);
      }
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const user = authService.verifyToken(token);
      req.user = user;
      next();
    } catch (err) {
      if (required) {
        next(err);
      } else {
        next();
      }
    }
  };
}

/**
 * Middleware to authorize specified UserRoles
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required. Please provide a valid Bearer token.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
}
