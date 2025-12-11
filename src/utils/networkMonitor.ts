import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

type NetworkListener = (state: NetInfoState) => void;

class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<NetworkListener> = new Set();
  private currentState: NetInfoState | null = null;
  private netInfoUnsubscribe: NetInfoSubscription | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private initialize(): void {
    NetInfo.fetch()
      .then((state) => {
        this.currentState = state;
      })
      .catch(() => {});

    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const previousState = this.currentState;
      this.currentState = state;

      const hasChanged =
        previousState?.isConnected !== state.isConnected || previousState?.type !== state.type;

      if (hasChanged || !previousState) {
        this.listeners.forEach((listener) => {
          try {
            listener(state);
          } catch {}
        });
      }
    });
  }

  public addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    if (this.currentState) {
      try {
        listener(this.currentState);
      } catch {}
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  public isConnected(): boolean {
    return this.currentState?.isConnected ?? true;
  }

  public getState(): NetInfoState | null {
    return this.currentState;
  }

  public async refresh(): Promise<NetInfoState> {
    const state = await NetInfo.fetch();
    this.currentState = state;

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {}
    });

    return state;
  }

  public cleanup(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    this.listeners.clear();
  }
}

const networkMonitor = NetworkMonitor.getInstance();

export default networkMonitor;
