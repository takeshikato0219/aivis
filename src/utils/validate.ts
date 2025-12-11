export const isRequired = (value: string) => {
  return value.trim() ? undefined : 'This field is required';
};

export const isEmail = (value: string) => {
  if (!value.trim()) return 'Email is required';
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? undefined : 'Invalid email address';
};

export const isPassword = (value: string) => {
  if (!value.trim()) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};
