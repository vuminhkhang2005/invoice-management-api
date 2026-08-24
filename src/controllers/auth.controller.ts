import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response.util';
import { BadRequestError } from '../errors/appError';
import { UserRole } from '../constants/auth.constant';

export class AuthController {
  private authService: AuthService;

  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  /**
   * GET /api/auth/demo-accounts - Returns demo accounts & pre-generated JWT tokens
   */
  getDemoAccounts = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const demoAccounts = this.authService.getDemoCredentials();
    sendSuccess(res, demoAccounts, 'Demo credentials and pre-signed tokens retrieved successfully');
  };

  /**
   * POST /api/auth/login - Issues JWT token for role/email
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, role } = req.body;

      if (!email || !role) {
        throw new BadRequestError('Email and role are required for login');
      }

      if (!Object.values(UserRole).includes(role)) {
        throw new BadRequestError(`Invalid role. Valid roles: [${Object.values(UserRole).join(', ')}]`);
      }

      const token = this.authService.generateToken({
        userId: `usr-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        role: role as UserRole,
      });

      sendSuccess(
        res,
        {
          token,
          tokenType: 'Bearer',
          user: { name: name || email.split('@')[0], email, role },
        },
        'Logged in successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/me - Get current user profile
   */
  getProfile = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    sendSuccess(res, req.user || null, 'Current user profile');
  };
}
