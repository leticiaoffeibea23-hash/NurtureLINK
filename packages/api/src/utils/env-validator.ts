import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Define Zod schema for known environment variables
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(65535))
    .or(z.number().int().min(1).max(65535))
    .optional(),
  DATABASE_URL: z
    .string()
    .refine((val) => val.startsWith('postgres://') || val.startsWith('postgresql://') || val.startsWith('file:') || val.startsWith('mysql://'), {
      message: 'Must be a valid database connection string (e.g. postgresql://...)',
    })
    .optional(),
  JWT_SECRET: z
    .string()
    .refine((val) => val !== 'change-me-in-production' && val.trim().length >= 8, {
      message: 'Should be at least 8 characters and not use default placeholder ("change-me-in-production")',
    })
    .optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().optional(),
  ANTHROPIC_API_KEY: z
    .string()
    .refine((val) => !val.startsWith('sk-ant-...') && val.trim().length > 0, {
      message: 'Must be a valid Anthropic API key, not placeholder "sk-ant-..."',
    })
    .optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  S3_ENDPOINT: z.string().url('Must be a valid URL').optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  VITE_API_URL: z.string().url('Must be a valid URL').optional(),
  CORS_ORIGIN: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface EnvValidationResult {
  isValid: boolean;
  warnings: string[];
  parsedEnv: Record<string, string>;
}

/**
 * Reads and validates environment variables from .env / process.env.
 * Logs warnings for any invalid key-value pairs without halting application execution.
 * 
 * @param envFilePath Optional custom path to .env file
 * @returns EnvValidationResult containing validity flag, warning messages, and key-values.
 */
export function validateEnv(envFilePath?: string): EnvValidationResult {
  // Load .env file into process.env if available
  let rawEnv: Record<string, string> = {};
  
  // Find the root .env file (two directories up from packages/api or root if running from root)
  const isPackagesApi = process.cwd().endsWith('packages/api');
  const defaultEnvPath = isPackagesApi
    ? path.resolve(process.cwd(), '../../.env')
    : path.resolve(process.cwd(), '.env');

  const targetPath = envFilePath || defaultEnvPath;

  if (fs.existsSync(targetPath)) {
    const fileContent = fs.readFileSync(targetPath, 'utf8');
    rawEnv = dotenv.parse(fileContent);
    // Populate process.env so Prisma and others can read it!
    for (const [key, value] of Object.entries(rawEnv)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  // Combine: process.env as base, file values take precedence
  const combinedEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      combinedEnv[key] = value;
    }
  }
  // File values override process.env so tests can supply explicit values
  Object.assign(combinedEnv, rawEnv);

  const warnings: string[] = [];

  // 1. Iterate through all keys present in .env / combined environment to check basic validity
  for (const [key, value] of Object.entries(rawEnv)) {
    if (value === undefined || value.trim() === '') {
      warnings.push(`Key "${key}" in .env has an empty or blank value.`);
    } else if (value.includes('change-me') || value.includes('sk-ant-...')) {
      warnings.push(`Key "${key}" in .env appears to use a placeholder value: "${value}".`);
    }
  }

  // 2. Validate against Zod schema rules for known variables
  const result = envSchema.safeParse(combinedEnv);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      const message = issue.message;
      const warningMsg = `Invalid environment variable "${field}": ${message}`;
      if (!warnings.includes(warningMsg)) {
        warnings.push(warningMsg);
      }
    }
  }

  // Log warnings if any invalid key-value pairs were found
  if (warnings.length > 0) {
    console.warn(`\n[ENV WARNING] Found ${warnings.length} environment configuration warning(s):`);
    warnings.forEach((warn) => console.warn(`  ⚠️  ${warn}`));
    console.warn('[ENV WARNING] Continuing execution despite invalid .env values...\n');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    parsedEnv: combinedEnv,
  };
}
