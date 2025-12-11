export const isRequired = (value: string) => {
  return value.trim() ? undefined : 'This field is required';
};

export const isEmail = (value: string) => {
  const v = value.trim();
  if (!v) return 'Email is required';

  // The maximum total length according to RFC is 254 (practical limit).
  if (v.length > 254) return 'Invalid email address';

  const parts = v.split('@');
  if (parts.length !== 2) return 'Invalid email address';

  const [local, domain] = parts;
  if (!local || !domain) return 'Invalid email address';

  // Allows common valid characters, without nested quantifiers.
  const localRegex = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/;
  // Domain: Labels separated by '.'; each label maximum 63 characters; top-level ≥ 2 characters
  const domainRegex = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

  if (!localRegex.test(local)) return 'Invalid email address';
  if (!domainRegex.test(domain)) return 'Invalid email address';

  return undefined;
};

export const isPassword = (value: string) => {
  if (!value.trim()) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};
