import { generateAccessToken, verifyAccessToken } from '../../src/utils/jwt';
import { UserRole } from '@prisma/client';

describe('JWT Utility Unit Tests', () => {
  const mockUser = {
    userId: '11111111-2222-3333-4444-555555555555',
    email: 'coordinator@pioneertrioservices.com',
    role: UserRole.COORDINATOR,
    firstName: 'Tahmid',
    lastName: 'Rahman',
  };

  it('should generate valid JWT access token and verify decoded claims', () => {
    const token = generateAccessToken(mockUser);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(mockUser.userId);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(UserRole.COORDINATOR);
    expect(decoded.iss).toBe('pioneer-trio-services');
  });

  it('should throw error on malformed token verification', () => {
    expect(() => {
      verifyAccessToken('invalid.token.structure');
    }).toThrow();
  });
});
