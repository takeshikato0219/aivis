import { useState, useCallback } from 'react';

type ValidateFn = (value: string) => string | undefined;

interface Options {
  validateFn?: ValidateFn;
  initialValue?: string;
}

export function useInput(options?: Options) {
  const { validateFn, initialValue = '' } = options || {};
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);

  //When the user changes the input, clear the error and validation if desired.
  const handleChange = useCallback(
    (text: string) => {
      setValue(text);
      if (error) setError(undefined);
      if (validateFn) setError(validateFn(text));
    },
    [error, validateFn]
  );

  // Call this when validation is needed (for example, before submitting a form).
  const validate = useCallback(() => {
    if (validateFn) {
      const err = validateFn(value);
      setError(err);
      return !err;
    }
    return true;
  }, [value, validateFn]);

  const reset = () => {
    setValue('');
    setError(undefined);
  };

  return {
    value,
    setValue,
    error,
    setError,
    handleChange,
    validate,
    reset,
  };
}
