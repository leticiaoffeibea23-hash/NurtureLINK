import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  LoginInput,
  LoginResponse,
  RefreshTokenResponse,
  RegisterInput,
} from '@nurturelink/shared';
import { AuthRepository } from '../repositories/auth.repository';

/** Parse '15m', '1h', '7d' → seconds for the expiresIn response field. */
function parseTtlSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return n;
  if (unit === 'm') return n * 60;
  if (unit === 'h') return n * 3600;
  if (unit === 'd') return n * 86400;
  return 900;
}

// ── In-memory OTP store (demo / hackathon — replace with DB table for prod) ──
interface OtpEntry {
  code: string;
  mode: 'registration' | 'password-reset';
  expiresAt: Date;
}
const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function storeOtp(phone: string, mode: OtpEntry['mode']): string {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  otpStore.set(phone, { code, mode, expiresAt });
  // In production: send SMS. In dev: log to console.
  console.log(`[OTP] ${phone} → ${code} (${mode}, expires ${expiresAt.toISOString()})`);
  return code;
}

function consumeOtp(phone: string, code: string, mode: OtpEntry['mode']): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (entry.mode !== mode) return false;
  if (entry.expiresAt < new Date()) { otpStore.delete(phone); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────

export class AuthService {
  private repo = new AuthRepository();

  async login(input: LoginInput): Promise<LoginResponse & { user: LoginResponse['user'] & { facilityName: string | null; facilityDistrict: string | null; facilityRegion: string | null } }> {
    const user = await this.repo.findByPhone(input.phone);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';
    const jwtPayload = { id: user.id, role: user.role, facilityId: user.facilityId };
    const accessToken = jwt.sign(jwtPayload, secret, { expiresIn: expiresIn as never });
    const refreshToken = await this.repo.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseTtlSeconds(expiresIn),
      user: {
        id:           user.id,
        firstName:    user.firstName,
        lastName:     user.lastName,
        otherNames:   user.otherNames ?? null,
        role:         user.role,
        facilityId:   user.facilityId,
        facilityName:     user.facility?.name ?? null,
        facilityDistrict: user.facility?.district ?? null,
        facilityRegion:   user.facility?.region ?? null,
      },
    };
  }

  async register(input: RegisterInput): Promise<{ message: string; otpCode?: string }> {
    const existing = await this.repo.findByPhone(input.phone);
    if (existing) throw Object.assign(new Error('Phone number already registered'), { status: 409 });

    const passwordHash = await bcrypt.hash(input.password, 12);
    await this.repo.createUser({
      firstName:  input.firstName,
      lastName:   input.lastName,
      otherNames: input.otherNames ?? null,
      phone:      input.phone,
      passwordHash,
      role:       input.role,
      facilityId: input.facilityId ?? null,
    });

    const code = storeOtp(input.phone, 'registration');
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      message: 'Registration successful. Check your SMS for a verification code.',
      ...(isDev ? { otpCode: code } : {}),
    };
  }

  async forgotPassword(phone: string): Promise<{ message: string; otpCode?: string }> {
    const user = await this.repo.findByPhone(phone);
    // Don't reveal whether the phone exists — same message either way.
    if (!user) return { message: 'If that number is registered, an OTP has been sent.' };

    const code = storeOtp(phone, 'password-reset');
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      message: 'If that number is registered, an OTP has been sent.',
      ...(isDev ? { otpCode: code } : {}),
    };
  }

  async verifyOtp(phone: string, code: string, mode: 'registration' | 'password-reset'): Promise<{ message: string }> {
    const valid = consumeOtp(phone, code, mode);
    if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    return { message: 'OTP verified.' };
  }

  async resendVerification(phone: string): Promise<{ message: string; otpCode?: string }> {
    const user = await this.repo.findByPhone(phone);
    if (!user) return { message: 'If that number is registered, an OTP has been sent.' };

    const code = storeOtp(phone, 'registration');
    const isDev = process.env.NODE_ENV !== 'production';
    return {
      message: 'Verification code resent.',
      ...(isDev ? { otpCode: code } : {}),
    };
  }

  async resetPassword(phone: string, code: string, password: string): Promise<{ message: string }> {
    const valid = consumeOtp(phone, code, 'password-reset');
    if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    await this.repo.updatePasswordHash(phone, passwordHash);
    return { message: 'Password reset successful.' };
  }

  async refresh(token: string): Promise<RefreshTokenResponse> {
    const stored = await this.repo.findRefreshToken(token);
    if (!stored || stored.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '15m';
    const jwtPayload = { id: stored.userId, role: stored.user.role, facilityId: stored.user.facilityId };
    const accessToken = jwt.sign(jwtPayload, secret, { expiresIn: expiresIn as never });
    return { accessToken, expiresIn: parseTtlSeconds(expiresIn) };
  }
}
