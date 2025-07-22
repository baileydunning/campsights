import userReducer, { setUser, clearUser, UserState } from './userSlice';

describe('userSlice', () => {
  const initialState: UserState = { token: null, username: null };

  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: '' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const action = setUser({ token: 'abc123', username: 'testuser' });
    const state = userReducer(initialState, action);
    expect(state).toEqual({ token: 'abc123', username: 'testuser' });
  });

  it('should handle clearUser', () => {
    const loggedInState: UserState = { token: 'abc123', username: 'testuser' };
    const state = userReducer(loggedInState, clearUser());
    expect(state).toEqual(initialState);
  });
});
