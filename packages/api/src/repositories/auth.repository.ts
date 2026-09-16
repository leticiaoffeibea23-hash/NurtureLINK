import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const REFRESH_TOKEN_TTL_DAYS = 7;

function sha256(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthRepository {
  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: { facility: { select: { name: true, district: true, region: true } } },
    });
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    otherNames?: string | null;
    phone: string;
    passwordHash: string;
    role: 'CHO' | 'supervisor';
    facilityId: string | null;
  }) {
    return prisma.user.create({
      data: {
        firstName:  data.firstName,
        lastName:   data.lastName,
        otherNames: data.otherNames ?? null,
        phone:      data.phone,
        passwordHash: data.passwordHash,
        role:       data.role,
        facilityId: data.facilityId,
      },
    });
  }

  async updatePasswordHash(phone: string, passwordHash: string) {
    return prisma.user.update({ where: { phone }, data: { passwordHash } });
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const tokenHash = sha256(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return token;
  }

  async findRefreshToken(token: string) {
    const tokenHash = sha256(token);
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        userId: true,
        expiresAt: true,
        user: { select: { role: true, facilityId: true } },
      },
    });
  }
}
