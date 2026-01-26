import {
  isRequired,
  isEmail,
  isPassword,
  isPhoneNumber,
  isPasswordConfirm,
  validateImage,
  isName,
} from '../../src/utils/validate';
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

  it('returns error for multiple @ symbols', () => {
    expect(isEmail('test@example@domain.com')).toBe('emailInvalidFormat');
    expect(isEmail('test@@domain.com')).toBe('emailInvalidFormat');
  });

  it('returns error for local part too long', () => {
    const longLocal = 'a'.repeat(65) + '@example.com';
    expect(isEmail(longLocal)).toBe('emailInvalidFormat');
  });

  it('returns error for invalid local part format', () => {
    expect(isEmail('.test@example.com')).toBe('emailInvalidFormat');
    expect(isEmail('test.@example.com')).toBe('emailInvalidFormat');
    expect(isEmail('test..test@example.com')).toBe('emailInvalidFormat');
    expect(isEmail('test(test)@example.com')).toBe('emailInvalidFormat');
  });

  it('returns error for domain without dot', () => {
    expect(isEmail('test@domain')).toBe('emailInvalidFormat');
    expect(isEmail('test@domaincom')).toBe('emailInvalidFormat');
  });

  it('returns error for TLD too short', () => {
    expect(isEmail('test@example.c')).toBe('emailInvalidFormat');
    expect(isEmail('test@example.')).toBe('emailInvalidFormat');
  });

  it('returns error for domain labels starting or ending with hyphens', () => {
    expect(isEmail('test@-example.com')).toBe('emailInvalidFormat');
    expect(isEmail('test@example-.com')).toBe('emailInvalidFormat');
    expect(isEmail('test@exam-ple-.com')).toBe('emailInvalidFormat');
  });

  it('returns error for domain labels too long', () => {
    const longLabel = 'a'.repeat(64) + '.com';
    expect(isEmail(`test@${longLabel}`)).toBe('emailInvalidFormat');
  });

  it('returns error for invalid domain characters', () => {
    expect(isEmail('test@example_.com')).toBe('emailInvalidFormat');
    expect(isEmail('test@exam ple.com')).toBe('emailInvalidFormat');
  });

  it('returns undefined for valid email', () => {
    expect(isEmail('test@example.com')).toBeUndefined();
    expect(isEmail('user.name+tag@sub.domain.co')).toBeUndefined();
    expect(isEmail('test.email@domain.co.uk')).toBeUndefined();
    expect(isEmail('123@example.com')).toBeUndefined();
    expect(isEmail('test-email@domain.com')).toBeUndefined();
    expect(isEmail('test_email@domain.com')).toBeUndefined();
  });

  it('handles whitespace trimming', () => {
    expect(isEmail(' test@example.com ')).toBeUndefined();
    expect(isEmail('  test@example.com  ')).toBeUndefined();
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

  it('returns error for passwords without letters', () => {
    expect(isPassword('12345678!')).toBe('passwordNotEnoughCharacters');
    expect(isPassword('!@#$%^&*()')).toBe('passwordNotEnoughCharacters');
  });

  it('returns error for passwords without numbers', () => {
    expect(isPassword('Password!')).toBe('passwordNotEnoughCharacters');
    expect(isPassword('ABCDEFGH!')).toBe('passwordNotEnoughCharacters');
  });

  it('returns error for passwords without special characters', () => {
    expect(isPassword('Password123')).toBe('passwordNotEnoughCharacters');
    expect(isPassword('password123')).toBe('passwordNotEnoughCharacters');
  });

  it('accepts passwords up to 64 characters', () => {
    const maxPassword = 'A1!' + 'a'.repeat(60); // Total = 64
    expect(isPassword(maxPassword)).toBeUndefined();
  });

  it('returns undefined for valid password', () => {
    expect(isPassword('Password123!')).toBeUndefined();
    expect(isPassword('Abc123!@#')).toBeUndefined();
    expect(isPassword('P4$$w0rd!')).toBeUndefined();
  });

  it('accepts various special characters', () => {
    expect(isPassword('Pass123!')).toBeUndefined();
    expect(isPassword('Pass123@')).toBeUndefined();
    expect(isPassword('Pass123#')).toBeUndefined();
    expect(isPassword('Pass123$')).toBeUndefined();
    expect(isPassword('Pass123%')).toBeUndefined();
    expect(isPassword('Pass123^')).toBeUndefined();
    expect(isPassword('Pass123&')).toBeUndefined();
    expect(isPassword('Pass123*')).toBeUndefined();
    expect(isPassword('Pass123(')).toBeUndefined();
    expect(isPassword('Pass123)')).toBeUndefined();
    expect(isPassword('Pass123-')).toBeUndefined();
    expect(isPassword('Pass123_')).toBeUndefined();
    expect(isPassword('Pass123=')).toBeUndefined();
    expect(isPassword('Pass123+')).toBeUndefined();
    expect(isPassword('Pass123[')).toBeUndefined();
    expect(isPassword('Pass123]')).toBeUndefined();
    expect(isPassword('Pass123{')).toBeUndefined();
    expect(isPassword('Pass123}')).toBeUndefined();
    expect(isPassword('Pass123|')).toBeUndefined();
    expect(isPassword('Pass123:')).toBeUndefined();
    expect(isPassword('Pass123;')).toBeUndefined();
    expect(isPassword("Pass123'")).toBeUndefined();
    expect(isPassword('Pass123"')).toBeUndefined();
    expect(isPassword('Pass123<')).toBeUndefined();
    expect(isPassword('Pass123>')).toBeUndefined();
    expect(isPassword('Pass123,')).toBeUndefined();
    expect(isPassword('Pass123.')).toBeUndefined();
    expect(isPassword('Pass123?')).toBeUndefined();
    expect(isPassword('Pass123/')).toBeUndefined();
    expect(isPassword('Pass123`')).toBeUndefined();
    expect(isPassword('Pass123~')).toBeUndefined();
  });
});

describe('isPhoneNumber', () => {
  it('returns undefined for empty string (optional field)', () => {
    expect(isPhoneNumber('')).toBeUndefined();
    expect(isPhoneNumber('   ')).toBeUndefined();
  });

  it('returns "invalidPhone" for phone numbers not starting with 0', () => {
    expect(isPhoneNumber('12345678901')).toBe('invalidPhone');
    expect(isPhoneNumber('91234567890')).toBe('invalidPhone');
  });

  it('returns "invalidPhone" for phone numbers too short', () => {
    expect(isPhoneNumber('0123456789')).toBe('invalidPhone'); // 10 digits
    expect(isPhoneNumber('012345678')).toBe('invalidPhone'); // 9 digits
  });

  it('returns "invalidPhone" for phone numbers too long', () => {
    expect(isPhoneNumber('012345678901')).toBe('invalidPhone'); // 12 digits
    expect(isPhoneNumber('0123456789012')).toBe('invalidPhone'); // 13 digits
  });

  it('returns "invalidPhone" for phone numbers with non-digit characters', () => {
    expect(isPhoneNumber('0123456789a')).toBe('invalidPhone');
    expect(isPhoneNumber('0123456789-')).toBe('invalidPhone');
    expect(isPhoneNumber('0123456789 ')).toBe('invalidPhone');
  });

  it('returns undefined for valid phone numbers', () => {
    expect(isPhoneNumber('01234567890')).toBeUndefined();
    expect(isPhoneNumber('09876543210')).toBeUndefined();
    expect(isPhoneNumber('09123456789')).toBeUndefined();
  });

  it('accepts phone numbers with leading/trailing spaces (trimmed)', () => {
    expect(isPhoneNumber(' 01234567890')).toBeUndefined();
    expect(isPhoneNumber('01234567890 ')).toBeUndefined();
    expect(isPhoneNumber(' 01234567890 ')).toBeUndefined();
  });
});

describe('isPasswordConfirm', () => {
  it('returns "confirmPassword" for empty confirm password', () => {
    expect(isPasswordConfirm('password123', '')).toBe('confirmPassword');
    expect(isPasswordConfirm('password123', '   ')).toBe('confirmPassword');
  });

  it('returns "passwordNotMatch" when passwords do not match', () => {
    expect(isPasswordConfirm('password123', 'password124')).toBe('passwordNotMatch');
    expect(isPasswordConfirm('Password123!', 'password123!')).toBe('passwordNotMatch');
    expect(isPasswordConfirm('abc', 'def')).toBe('passwordNotMatch');
  });

  it('returns undefined when passwords match', () => {
    expect(isPasswordConfirm('password123', 'password123')).toBeUndefined();
    expect(isPasswordConfirm('Password123!', 'Password123!')).toBeUndefined();
    expect(isPasswordConfirm('abc123!@#', 'abc123!@#')).toBeUndefined();
  });

  it('returns "passwordNotMatch" when passwords have different whitespace', () => {
    expect(isPasswordConfirm('password123', ' password123 ')).toBe('passwordNotMatch');
    expect(isPasswordConfirm(' password123 ', 'password123')).toBe('passwordNotMatch');
  });
});

describe('isName', () => {
  it('returns "nameRequired" for empty string', () => {
    expect(isName('')).toBe('nameRequired');
    expect(isName('   ')).toBe('nameRequired');
  });

  it('returns "nameTooLong" for names longer than 50 characters', () => {
    const longName = 'a'.repeat(51);
    expect(isName(longName)).toBe('nameTooLong');
    expect(isName('a'.repeat(100))).toBe('nameTooLong');
  });

  it('returns undefined for valid names (1-50 characters)', () => {
    expect(isName('John')).toBeUndefined();
    expect(isName('John Doe')).toBeUndefined();
    expect(isName('a')).toBeUndefined();
    expect(isName('a'.repeat(50))).toBeUndefined();
  });

  it('returns undefined for names with exactly 50 characters', () => {
    expect(isName('a'.repeat(50))).toBeUndefined();
  });

  it('returns "nameTooLong" for names with 51 characters', () => {
    expect(isName('a'.repeat(51))).toBe('nameTooLong');
  });

  it('handles names with leading/trailing whitespace', () => {
    expect(isName(' John ')).toBeUndefined(); // Should trim and validate
    expect(isName('   John   ')).toBeUndefined();
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

  it('accepts case insensitive file types', () => {
    expect(validateImage({ fileSize: 1000, type: 'IMAGE/JPEG' } as Asset)).toBeNull();
    expect(validateImage({ fileSize: 1000, type: 'Image/Png' } as Asset)).toBeNull();
    expect(validateImage({ fileSize: 1000, type: 'image/JPG' } as Asset)).toBeNull();
    expect(validateImage({ fileSize: 1000, type: 'image/HEIC' } as Asset)).toBeNull();
  });

  it('returns "type" for unsupported image types', () => {
    expect(validateImage({ fileSize: 1000, type: 'image/bmp' } as Asset)).toBe('type');
    expect(validateImage({ fileSize: 1000, type: 'image/tiff' } as Asset)).toBe('type');
    expect(validateImage({ fileSize: 1000, type: 'image/webp' } as Asset)).toBe('type');
  });

  it('returns undefined for null image', () => {
    expect(validateImage(null)).toBeUndefined();
  });

  it('returns null for valid image without type check (when type is undefined)', () => {
    const image: Asset = { fileSize: 1000 } as Asset;
    expect(validateImage(image)).toBeNull();
  });
});
