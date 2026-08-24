import { AuthService } from '../../src/services/auth.service';
import { UserRole } from '../../src/constants/auth.constant';
import { AppError } from '../../src/errors/appError';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should generate and verify JWT token accurately', () => {
    const userPayload = {
      userId: 'usr-123',
      name: 'Vu Minh Khang',
      email: 'khang@invoicetech.vn',
      role: UserRole.CHIEF_ACCOUNTANT,
    };

    const token = authService.generateToken(userPayload);
    expect(typeof token).toBe('string');

    const decoded = authService.verifyToken(token);
    expect(decoded.userId).toBe(userPayload.userId);
    expect(decoded.role).toBe(UserRole.CHIEF_ACCOUNTANT);
  });

  it('should throw AppError on invalid token', () => {
    expect(() => authService.verifyToken('invalid-jwt-token')).toThrow(AppError);
  });

  it('should return demo accounts with valid signed tokens for all roles', () => {
    const demoAccounts = authService.getDemoCredentials();

    expect(demoAccounts).toHaveLength(4);
    demoAccounts.forEach((acc) => {
      expect(acc.token).toBeDefined();
      expect(acc.authHeader).toMatch(/^Bearer /);
      const verified = authService.verifyToken(acc.token);
      expect(verified.role).toBe(acc.role);
    });
  });
});
