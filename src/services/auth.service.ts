import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET, UserRole } from '../constants/auth.constant';
import { AppError } from '../errors/appError';

export interface AuthUserPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  /**
   * Generates a signed JWT token for a user payload
   */
  generateToken(payload: AuthUserPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verifies and decodes a JWT token
   */
  verifyToken(token: string): AuthUserPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    } catch {
      throw new AppError('Invalid or expired authentication token', 401);
    }
  }

  /**
   * Generates sample pre-configured demo accounts and tokens for instant evaluator testing
   */
  getDemoCredentials() {
    const roles = [
      {
        role: UserRole.ADMIN,
        title: 'System Administrator (Full access)',
        email: 'admin@invoicetech.vn',
        name: 'Vu Minh Khang (Admin)',
      },
      {
        role: UserRole.CHIEF_ACCOUNTANT,
        title: 'Chief Accountant (Can Cancel, Replace, Issue, Analytics)',
        email: 'chief.accountant@invoicetech.vn',
        name: 'Tran Thi Truong (Chief Accountant)',
      },
      {
        role: UserRole.ACCOUNTANT,
        title: 'Accountant (Can Create Draft, Issue, Export)',
        email: 'accountant@invoicetech.vn',
        name: 'Nguyen Van Ke Toan (Accountant)',
      },
      {
        role: UserRole.AUDITOR,
        title: 'Auditor (Read-only, History, Verification, Reports)',
        email: 'auditor@invoicetech.vn',
        name: 'Le Thi Kiem Toan (Auditor)',
      },
    ];

    const demoAccounts = roles.map((user, idx) => {
      const payload: AuthUserPayload = {
        userId: `usr-demo-${idx + 1}`,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = this.generateToken(payload);
      return {
        ...user,
        userId: payload.userId,
        token,
        authHeader: `Bearer ${token}`,
      };
    });

    return demoAccounts;
  }
}
