/**
 * Auth service tests — login + refresh token flows.
 *
 * Critical paths:
 * - Invalid PIN returns 401 (no token leak)
 * - Valid PIN returns access + refresh tokens with expiresIn
 * - Expired refresh token returns 401
 */

import { AuthService } from '../auth.service';
import bcrypt from 'bcrypt';

// ── Mock the repository ───────────────────────────────────────────────────────

jest.mock('../../repositories/auth.repository', () => {
  return {
    AuthRepository: jest.fn().mockImplementation(() => ({
      findByPhone: jest.fn(),
      createRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
    })),
  };
});

// JWT_SECRET must be set before importing the service
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.JWT_EXPIRES_IN = '15m';

import { AuthRepository } from '../../repositories/auth.repository';

const mockRepo = new (AuthRepository as jest.MockedClass<typeof AuthRepository>)();

describe('AuthService', () => {
  let svc: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new AuthService();
    (svc as unknown as { repo: typeof mockRepo })['repo'] = mockRepo;
  });

  describe('login', () => {
    const CORRECT_PIN = '1234';

    async function makeUser(pin: string) {
      const passwordHash = await bcrypt.hash(pin, 10);
      return {
        id: 'user-uuid-0000-0000-0000-000000000001',
        name: 'Yakubu Lute',
        role: 'CHO' as const,
        facilityId: 'facility-uuid-0000-0000-0000-000000000001',
        passwordHash,
        phone: '+233244000001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    it('returns access and refresh tokens on correct PIN', async () => {
      const user = await makeUser(CORRECT_PIN);
      (mockRepo.findByPhone as jest.Mock).mockResolvedValue(user);
      (mockRepo.createRefreshToken as jest.Mock).mockResolvedValue('refresh-token-uuid');

      const result = await svc.login({ phone: user.phone, pin: CORRECT_PIN });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBe('refresh-token-uuid');
      expect(result.expiresIn).toBe(900); // 15m → 900 seconds
      expect(result.user.id).toBe(user.id);
      expect(result.user.role).toBe('CHO');
    });

    it('throws 401 on wrong PIN', async () => {
      const user = await makeUser(CORRECT_PIN);
      (mockRepo.findByPhone as jest.Mock).mockResolvedValue(user);

      await expect(svc.login({ phone: user.phone, pin: '9999' })).rejects.toMatchObject({
        status: 401,
      });
      expect(mockRepo.createRefreshToken).not.toHaveBeenCalled();
    });

    it('throws 401 when user not found', async () => {
      (mockRepo.findByPhone as jest.Mock).mockResolvedValue(null);

      await expect(svc.login({ phone: '+233000000000', pin: '1234' })).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe('refresh', () => {
    it('returns a new access token for a valid, unexpired refresh token', async () => {
      (mockRepo.findRefreshToken as jest.Mock).mockResolvedValue({
        userId: 'user-uuid-0000-0000-0000-000000000001',
        expiresAt: new Date(Date.now() + 60_000), // 1 min in the future
        user: { role: 'CHO', facilityId: 'facility-id' },
      });

      const result = await svc.refresh('valid-refresh-token');

      expect(result.accessToken).toBeTruthy();
      expect(result.expiresIn).toBe(900);
    });

    it('throws 401 when refresh token is expired', async () => {
      (mockRepo.findRefreshToken as jest.Mock).mockResolvedValue({
        userId: 'user-uuid',
        expiresAt: new Date(Date.now() - 1000), // 1 sec in the past
        user: { role: 'CHO', facilityId: null },
      });

      await expect(svc.refresh('expired-token')).rejects.toMatchObject({ status: 401 });
    });

    it('throws 401 when refresh token is not found', async () => {
      (mockRepo.findRefreshToken as jest.Mock).mockResolvedValue(null);

      await expect(svc.refresh('unknown-token')).rejects.toMatchObject({ status: 401 });
    });
  });
});
