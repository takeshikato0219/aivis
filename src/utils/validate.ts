import type { Asset } from 'react-native-image-picker';

export const isRequired = (value: string) => {
  return value.trim() ? undefined : 'fieldRequired';
};

export const isEmail = (value: string) => {
  const v = value.trim();

  // 1. Required
  if (!v) return 'emailRequired';

  // 2. Total length (RFC practical limit)
  if (v.length > 254) return 'emailInvalidFormat';

  // 3. Exactly one "@"
  const atIndex = v.indexOf('@');
  if (atIndex === -1 || atIndex !== v.lastIndexOf('@')) {
    return 'emailInvalidFormat';
  }

  const local = v.slice(0, atIndex);
  const domain = v.slice(atIndex + 1);

  // 4. Local / Domain required
  if (!local || !domain) return 'emailInvalidFormat';

  // 5. Local length
  if (local.length > 64) return 'emailInvalidFormat';

  // 6. Local format
  // - allowed characters
  // - no leading/trailing dot
  // - no consecutive dots
  const localRegex = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
  if (!localRegex.test(local) || local.startsWith('.') || local.endsWith('.')) {
    return 'emailInvalidFormat';
  }
  // 7. Domain must contain dot
  if (!domain.includes('.')) return 'emailInvalidFormat';
  const domainParts = domain.split('.');
  // 8. Validate each domain label
  for (const part of domainParts) {
    // label length
    if (part.length > 63) return 'emailInvalidFormat';
    // label format
    if (!/^[A-Za-z0-9-]+$/.test(part) || part.startsWith('-') || part.endsWith('-')) {
      return 'emailInvalidFormat';
    }
  }
  // 9. TLD length ≥ 2
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return 'emailInvalidFormat';

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
