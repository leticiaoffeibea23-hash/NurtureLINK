import { validateEnv } from './env-validator';
import fs from 'fs';
import path from 'path';

describe('validateEnv utility', () => {
  const testEnvPath = path.resolve(__dirname, 'test.env');

  afterEach(() => {
    if (fs.existsSync(testEnvPath)) {
      fs.unlinkSync(testEnvPath);
    }
  });

  it('should pass with no warnings when .env values are valid', () => {
    fs.writeFileSync(
      testEnvPath,
      `DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="super-secret-key-12345"
PORT=3000`
    );

    const result = validateEnv(testEnvPath);
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toEqual(0);
  });

  it('should log warning for placeholder or empty values and proceed', () => {
    fs.writeFileSync(
      testEnvPath,
      `DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="change-me-in-production"
ANTHROPIC_API_KEY="sk-ant-..."
EMPTY_KEY=""`
    );

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = validateEnv(testEnvPath);

    expect(result.isValid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should log warning for invalid data types (e.g. invalid PORT) and proceed', () => {
    fs.writeFileSync(
      testEnvPath,
      `PORT=invalid_port_number`
    );

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = validateEnv(testEnvPath);

    expect(result.isValid).toBe(false);
    expect(result.warnings.some((w) => w.includes('PORT'))).toBe(true);

    consoleWarnSpy.mockRestore();
  });
});
