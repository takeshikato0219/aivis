import { store } from '@redux/store';
import { setUser } from '@redux/slices/authSlice';
import type { User } from '@api/types/authTypes';

describe('Redux store', () => {
  it('should initialize with correct state', () => {
    const state = store.getState();
    expect(state.auth).toBeDefined();
    expect(state.auth.user).toBeNull();
  });

  it('should update state when dispatching setUser', () => {
    const user: User = { id: '1', email: 'test@example.com', name: 'Test', phone: '1234567890' };
    store.dispatch(setUser(user));
    const state = store.getState();
    expect(state.auth.user).toEqual(user);
  });
});
