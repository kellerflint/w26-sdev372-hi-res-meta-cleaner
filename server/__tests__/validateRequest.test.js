import { describe, it, expect, vi } from 'vitest';
import { validateCreateUser, validateFileIdsArray } from '../src/middleware/validateRequest.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('validateCreateUser', () => {
  it('calls next() when all required fields are present', () => {
    const req = { body: { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com', password: 'pass' } };
    const next = vi.fn();
    validateCreateUser(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 when email is missing', () => {
    const req = { body: { firstName: 'Jane', lastName: 'Doe', password: 'pass' } };
    const res = mockRes();
    validateCreateUser(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is missing', () => {
    const req = { body: { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com' } };
    const res = mockRes();
    validateCreateUser(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateFileIdsArray', () => {
  it('calls next() when fileIds is a non-empty array', () => {
    const req = { body: { fileIds: [1, 2, 3] } };
    const next = vi.fn();
    validateFileIdsArray(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 when fileIds is empty', () => {
    const req = { body: { fileIds: [] } };
    const res = mockRes();
    validateFileIdsArray(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
