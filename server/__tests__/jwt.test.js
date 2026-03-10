import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../src/utils/jwt.js';

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

describe('JWT utilities', () => {
  it('generateAccessToken returns a JWT-formatted string', () => {
    const token = generateAccessToken(1);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('generateAccessToken encodes the correct user_id in the payload', () => {
    const token = generateAccessToken(42);
    const payload = verifyAccessToken(token);
    expect(payload.user_id).toBe(42);
  });

  it('verifyAccessToken returns the payload for a valid token', () => {
    const token = generateAccessToken(5);
    const decoded = verifyAccessToken(token);
    expect(decoded.user_id).toBe(5);
  });

  it('verifyAccessToken throws for an invalid token string', () => {
    expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
  });

  it('verifyRefreshToken throws when given an access token (wrong secret)', () => {
    const accessToken = generateAccessToken(1);
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
