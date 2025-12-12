import { store } from '@redux/store/index';
import { setUser } from '@redux/slices/authSlice';
import { User } from '@api/authService';

describe('Redux store', () => {
  it('should initialize with correct state', () => {
    const state = store.getState();
    expect(state.auth).toBeDefined();
    expect(state.auth.user).toBeNull();
  });

  it('should update state when dispatching setUser', () => {
    const user: User = { id: '1', name: 'Test', email: 'test@example.com' };
    store.dispatch(setUser(user));
    const state = store.getState();
    expect(state.auth.user).toEqual(user);
  });
});
