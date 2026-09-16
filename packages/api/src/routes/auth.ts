import { Router } from 'express';
import {
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResetPasswordSchema,
} from '@nurturelink/shared';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();
export const authRouter: Router = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const body = ForgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(body.phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const body = VerifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(body.phone, body.code, body.mode);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/resend-verification', async (req, res, next) => {
  try {
    const { phone } = ForgotPasswordSchema.parse(req.body);
    const result = await authService.resendVerification(phone);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const body = ResetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(body.phone, body.code, body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const body = RefreshTokenSchema.parse(req.body);
    const result = await authService.refresh(body.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
