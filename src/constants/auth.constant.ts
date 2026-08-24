export enum UserRole {
  ADMIN = 'ADMIN',
  CHIEF_ACCOUNTANT = 'CHIEF_ACCOUNTANT',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR',
}

export const JWT_SECRET = process.env.JWT_SECRET || 'invoice-mgmt-jwt-secret-key-2026-enterprise';
export const JWT_EXPIRES_IN = '24h';
