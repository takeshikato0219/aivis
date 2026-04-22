import { renderHook, act } from '@testing-library/react-native';
import { useInput } from '@hooks/useInput';

describe('useInput hook', () => {
  it('initializes with provided initialValue and no error', () => {
    const { result } = renderHook(() => useInput({ initialValue: 'hello' }));
    expect(result.current.value).toBe('hello');
    expect(result.current.error).toBeUndefined();
  });

  it('handleChange updates value and clears/updates error using validateFn', () => {
    const validateFn = jest.fn((v: string) => (v.length < 3 ? 'too short' : undefined));
    const { result } = renderHook(() => useInput({ validateFn }));

    // cause an error first
    act(() => {
      result.current.validate();
    });
    expect(result.current.error).toBe('too short');

    // change to a valid value
    act(() => {
      result.current.handleChange('abcd');
    });

    expect(result.current.value).toBe('abcd');
    expect(validateFn).toHaveBeenLastCalledWith('abcd');
    expect(result.current.error).toBeUndefined();
  });

  it('validate returns boolean and sets error accordingly', () => {
    const validateFn = (v: string) => (v === 'ok' ? undefined : 'bad');
    const { result } = renderHook(() => useInput({ validateFn, initialValue: 'no' }));

    let ok: boolean | undefined;
    act(() => {
      ok = result.current.validate();
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('bad');

    act(() => {
      result.current.setValue('ok');
    });

    act(() => {
      ok = result.current.validate();
    });
    expect(ok).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('reset clears value and error', () => {
    const { result } = renderHook(() => useInput({ initialValue: 'start' }));

    act(() => {
      result.current.setValue('changed');
      result.current.setError('err');
    });
    expect(result.current.value).toBe('changed');
    expect(result.current.error).toBe('err');

    act(() => {
      result.current.reset();
    });
    expect(result.current.value).toBe('');
    expect(result.current.error).toBeUndefined();
  });

  it('validate returns true when no validateFn provided', () => {
    const { result } = renderHook(() => useInput({ initialValue: 'test' }));

    let ok: boolean | undefined;
    act(() => {
      ok = result.current.validate();
    });
    expect(ok).toBe(true);
    expect(result.current.error).toBeUndefined();
  });
});
