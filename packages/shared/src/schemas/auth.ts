import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'system_admin',
  'district_admin',
  'CHO',
  'nutrition_officer',
  'supervisor',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LoginSchema = z.object({
  phone:    z.string().min(10),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  firstName:  z.string().min(1, 'First name is required'),
  lastName:   z.string().min(1, 'Last name is required'),
  otherNames: z.string().optional(),
  phone:      z.string().min(10),
  password:   z.string().min(8),
  role:       z.enum(['CHO', 'supervisor']),
  facilityId: z.string().uuid().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  phone: z.string().min(10),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
  mode: z.enum(['registration', 'password-reset']),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResetPasswordSchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
  password: z.string().min(8),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const AuthUserSchema = z.object({
  id:               z.string().uuid(),
  firstName:        z.string(),
  lastName:         z.string(),
  otherNames:       z.string().nullable(),
  role:             UserRoleSchema,
  facilityId:       z.string().uuid().nullable(),
  facilityName:     z.string().nullable(),
  facilityDistrict: z.string().nullable(),
  facilityRegion:   z.string().nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),   // seconds until accessToken expires
  user: AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number().int().positive(),
});
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
