import { isRequired, isEmail, isPassword } from '../../src/utils/validate';

describe('isRequired', () => {
  it('returns undefined for non-empty string', () => {
    expect(isRequired('abc')).toBeUndefined();
  });

  it('returns error for empty string', () => {
    expect(isRequired('')).toBe('This field is required');
    expect(isRequired('   ')).toBe('This field is required');
  });
});

describe('isEmail', () => {
  it('returns error for empty string', () => {
    expect(isEmail('')).toBe('Email is required');
    expect(isEmail('   ')).toBe('Email is required');
  });

  it('returns error for invalid format', () => {
    expect(isEmail('abc')).toBe('Invalid email address');
    expect(isEmail('abc@')).toBe('Invalid email address');
    expect(isEmail('@domain.com')).toBe('Invalid email address');
    expect(isEmail('a@b')).toBe('Invalid email address');
    expect(isEmail('a@b.c')).toBe('Invalid email address');
    expect(isEmail('a@b..com')).toBe('Invalid email address');
    expect(isEmail('a@b.c_m')).toBe('Invalid email address');
  });

  it('returns error for too long email', () => {
    const longEmail = 'a'.repeat(245) + '@example.com';
    expect(isEmail(longEmail)).toBe('Invalid email address');
  });

  it('returns undefined for valid email', () => {
    expect(isEmail('test@example.com')).toBeUndefined();
    expect(isEmail('user.name+tag@sub.domain.co')).toBeUndefined();
  });
});

describe('isPassword', () => {
  it('returns error for empty string', () => {
    expect(isPassword('')).toBe('Password is required');
    expect(isPassword('   ')).toBe('Password is required');
  });

  it('returns error for short password', () => {
    expect(isPassword('12345')).toBe('Password must be at least 6 characters');
  });

  it('returns undefined for valid password', () => {
    expect(isPassword('123456')).toBeUndefined();
    expect(isPassword('password')).toBeUndefined();
  });
});
