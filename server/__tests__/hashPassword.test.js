import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { hashPassword } from '../src/utils/hashPassword.js';

describe('hashPassword', () => {
  it('returns a hash string that is different from the original password', async () => {
    const hash = await hashPassword('password123');
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('password123');
  });

  it('produces a hash that bcrypt.compare verifies correctly', async () => {
    const hash = await hashPassword('mypassword');
    const match = await bcrypt.compare('mypassword', hash);
    expect(match).toBe(true);
  });
});
