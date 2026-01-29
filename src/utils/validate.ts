import type { Asset } from 'react-native-image-picker';

export const isRequired = (value: string) => {
  return value.trim() ? undefined : 'fieldRequired';
};

const validateEmailBasic = (email: string) => {
  // 1. Required
  if (!email) return 'emailRequired';

  // 2. Total length (RFC practical limit)
  if (email.length > 254) return 'emailInvalidFormat';

  return null;
};

const validateAtSymbol = (email: string) => {
  // 3. Exactly one "@"
  const atIndex = email.indexOf('@');
  if (atIndex === -1 || atIndex !== email.lastIndexOf('@')) {
    return 'emailInvalidFormat';
  }
  return atIndex;
};

const validateLocalPart = (local: string) => {
  // 4. Local required
  if (!local) return 'emailInvalidFormat';

  // 5. Local length
  if (local.length > 64) return 'emailInvalidFormat';

  // 6. Local format validation
  const localRegex = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
  if (!localRegex.test(local) || local.startsWith('.') || local.endsWith('.')) {
    return 'emailInvalidFormat';
  }

  return null;
};

const validateDomainParts = (domainParts: string[]) => {
  // 8. Validate each domain label
  for (const part of domainParts) {
    // label length
    if (part.length > 63) return 'emailInvalidFormat';

    // label format
    if (!/^[A-Za-z0-9-]+$/.test(part) || part.startsWith('-') || part.endsWith('-')) {
      return 'emailInvalidFormat';
    }
  }
  return null;
};

const validateTLD = (domainParts: string[]) => {
  // 9. TLD length ≥ 2
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return 'emailInvalidFormat';

  return null;
};

export const isEmail = (value: string) => {
  const v = value.trim();

  // Basic validations
  const basicError = validateEmailBasic(v);
  if (basicError) return basicError;

  // @ symbol validation
  const atIndex = validateAtSymbol(v);
  if (typeof atIndex !== 'number') return atIndex;

  // Split email parts
  const local = v.slice(0, atIndex);
  const domain = v.slice(atIndex + 1);

  // 4-6. Local part validation
  const localError = validateLocalPart(local);
  if (localError) return localError;

  // 7. Domain must contain dot
  if (!domain.includes('.')) return 'emailInvalidFormat';

  const domainParts = domain.split('.');

  // 8. Domain parts validation
  const domainError = validateDomainParts(domainParts);
  if (domainError) return domainError;

  // 9. TLD validation
  const tldError = validateTLD(domainParts);
  if (tldError) return tldError;

  return undefined;
};

export const isPasswordWifi = (value: string) => {
  if (!value.trim()) return 'passwordRequired';

  // Allow English, Japanese characters, and common password symbols
  const validPattern = /^[\w\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`ぁ-ゖ゠-ヿ一-龯]+$/;
  if (!validPattern.test(value)) {
    return 'passwordInvalidCharacters';
  }

  return undefined;
};

export const isPassword = (value: string) => {
  if (!value.trim()) return 'passwordRequired';
  if (value.length < 8 || value.length > 64) return 'passwordNotEnoughCharacters';
  if (!/[A-Za-z]/.test(value)) return 'passwordNotEnoughCharacters';
  if (!/\d/.test(value)) return 'passwordNotEnoughCharacters';
  if (!/[!@#$%^&*(),.?":{}|<>_\-[\]/`~+=;']/g.test(value)) return 'passwordNotEnoughCharacters';
  return undefined;
};

export const isPhoneNumber = (value: string) => {
  const v = value.trim();
  if (!v) return undefined;
  // Phone number: starts with 0, 11 digits total
  if (!/^0\d{10}$/.test(v)) return 'invalidPhone';
  return undefined;
};

export const isPasswordConfirm = (password: string, confirm: string) => {
  if (!confirm.trim()) return 'confirmPassword';
  if (password !== confirm) return 'passwordNotMatch';
  return undefined;
};

export const validateImage = (image: Asset | null) => {
  if (!image) {
    return undefined;
  }
  if (image.fileSize && image.fileSize > 2 * 1024 * 1024) {
    // 2MB
    return 'size';
  }
  if (
    image.type &&
    !['image/jpeg', 'image/png', 'image/jpg', 'image/heic'].includes(image.type.toLowerCase())
  ) {
    return 'type';
  }
  return null;
};

export const isName = (value: string) => {
  const v = value.trim();

  // 1. Required
  if (!v) return 'nameRequired';

  // 2. Maximum 50 characters
  if (v.length > 50) return 'nameTooLong';

  return undefined;
};
