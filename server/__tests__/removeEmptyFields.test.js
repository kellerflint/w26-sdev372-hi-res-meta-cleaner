import { describe, it, expect } from 'vitest';
import { removeEmptyFields } from '../src/utils/objectHelpers.js';

describe('removeEmptyFields', () => {
  it('removes keys with undefined or empty string values', () => {
    const result = removeEmptyFields({ a: 'hello', b: undefined, c: '' });
    expect(result).toEqual({ a: 'hello' });
  });

  it('keeps keys with valid values including 0, false, and null', () => {
    const result = removeEmptyFields({ a: 0, b: false, c: null, d: 'text' });
    expect(result).toEqual({ a: 0, b: false, c: null, d: 'text' });
  });

  it('does not mutate the original object', () => {
    const original = { a: 'hello', b: '' };
    removeEmptyFields(original);
    expect(original).toEqual({ a: 'hello', b: '' });
  });
});
