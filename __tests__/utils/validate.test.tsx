import { isRequired, isEmail, isPassword, validateImage } from '../../src/utils/validate';
import type { Asset } from 'react-native-image-picker';

describe('isRequired', () => {
  it('returns undefined for non-empty string', () => {
    expect(isRequired('abc')).toBeUndefined();
  });

  it('returns error for empty string', () => {
    expect(isRequired('')).toBe('fieldRequired');
    expect(isRequired('   ')).toBe('fieldRequired');
  });
});

describe('isEmail', () => {
  it('returns error for empty string', () => {
    expect(isEmail('')).toBe('emailRequired');
    expect(isEmail('   ')).toBe('emailRequired');
  });

  it('returns error for invalid format', () => {
    expect(isEmail('abc')).toBe('emailInvalidFormat');
    expect(isEmail('abc@')).toBe('emailInvalidFormat');
    expect(isEmail('@domain.com')).toBe('emailInvalidFormat');
    expect(isEmail('a@b')).toBe('emailInvalidFormat');
    expect(isEmail('a@b.c')).toBe('emailInvalidFormat');
    expect(isEmail('a@b..com')).toBe('emailInvalidFormat');
    expect(isEmail('a@b.c_m')).toBe('emailInvalidFormat');
  });

  it('returns error for too long email', () => {
    const longEmail = 'a'.repeat(245) + '@example.com';
    expect(isEmail(longEmail)).toBe('emailInvalidFormat');
  });

  it('returns undefined for valid email', () => {
    expect(isEmail('test@example.com')).toBeUndefined();
    expect(isEmail('user.name+tag@sub.domain.co')).toBeUndefined();
  });
});

describe('isPassword', () => {
  it('returns error for empty string', () => {
    expect(isPassword('')).toBe('passwordRequired');
    expect(isPassword('   ')).toBe('passwordRequired');
  });

  it('returns error for short password', () => {
    expect(isPassword('12345')).toBe('passwordNotEnoughCharacters');
  });

  it('returns undefined for valid password', () => {
    expect(isPassword('Password123!')).toBeUndefined();
  });
});

describe('validateImage', () => {
  it('returns "size" if fileSize > 2MB', () => {
    const image: Asset = { fileSize: 2 * 1024 * 1024 + 1 } as Asset;
    expect(validateImage(image)).toBe('size');
  });

  it('returns "type" if type is not allowed', () => {
    const image: Asset = { fileSize: 1000, type: 'image/gif' } as Asset;
    expect(validateImage(image)).toBe('type');
  });

  it('returns null for valid jpeg', () => {
    const image: Asset = { fileSize: 1000, type: 'image/jpeg' } as Asset;
    expect(validateImage(image)).toBeNull();
  });

  it('returns null for valid heic', () => {
    const image: Asset = { fileSize: 1000, type: 'image/heic' } as Asset;
    expect(validateImage(image)).toBeNull();
  });

  it('returns null if fileSize is undefined and type is valid', () => {
    const image: Asset = { type: 'image/png' } as Asset;
    expect(validateImage(image)).toBeNull();
  });
});
