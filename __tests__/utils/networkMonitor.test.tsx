// __tests__/utils/networkMonitor.test.tsx

jest.mock('@react-native-community/netinfo', () => {
  let state = {
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
    details: null,
  };
  let listeners: Array<(s: typeof state) => void> = [];

  return {
    fetch: jest.fn(() => Promise.resolve(state)),
    addEventListener: jest.fn((cb) => {
      listeners.push(cb);
      cb(state);
      return () => {
        listeners = listeners.filter((l) => l !== cb);
      };
    }),
    __setState: (newState: typeof state) => {
      state = newState;
      listeners.forEach((cb) => cb(state));
    },
    __reset: () => {
      state = {
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
        details: null,
      };
      listeners = [];
    },
  };
});

describe('NetworkMonitor', () => {
  beforeEach(() => {
    jest.resetModules();
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.__reset();
  });

  it('should fetch initial state', async () => {
    const networkMonitor = require('@utils/networkMonitor').default;
    const result = await networkMonitor.refresh();
    expect(result.isConnected).toBe(true);
    expect(networkMonitor.isConnected()).toBe(true);
  });

  it('should call listener on addListener', () => {
    const networkMonitor = require('@utils/networkMonitor').default;
    const listener = jest.fn();
    networkMonitor.addListener(listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isConnected: true }));
  });

  it('should remove listener', () => {
    const networkMonitor = require('@utils/networkMonitor').default;
    const listener = jest.fn();
    const remove = networkMonitor.addListener(listener);
    remove();
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.__setState({
      isConnected: false,
      type: 'cellular',
      isInternetReachable: false,
      details: null,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should notify listeners on state change', () => {
    const networkMonitor = require('@utils/networkMonitor').default;
    const listener = jest.fn();
    networkMonitor.addListener(listener);
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.__setState({
      isConnected: false,
      type: 'cellular',
      isInternetReachable: false,
      details: null,
    });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isConnected: false }));
  });

  it('should cleanup listeners', () => {
    const networkMonitor = require('@utils/networkMonitor').default;
    const listener = jest.fn();
    networkMonitor.addListener(listener);
    networkMonitor.cleanup();
    const NetInfo = require('@react-native-community/netinfo');
    NetInfo.__setState({
      isConnected: false,
      type: 'cellular',
      isInternetReachable: false,
      details: null,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
