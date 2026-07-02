import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, ClientMessage, DeepPartial, AppSettings, TimerKind } from '@krabi/shared';

interface Ctx {
  state: AppState | null;
  connected: boolean;
  /** Décalage horloge serveur → client (serveur - client), pour les countdowns. */
  clockOffset: number;
  send: (msg: ClientMessage) => void;
  patchSettings: (patch: DeepPartial<AppSettings>) => void;
  startTimer: (kind: TimerKind, refKey: string, label: string, durationMs: number) => void;
  cancelTimer: (refKey: string) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [connected, setConnected] = useState(false);
  const offsetRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state') {
            offsetRef.current = msg.state.serverTime - Date.now();
            setState(msg.state);
          }
        } catch {
          // message illisible : ignoré
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, []);

  const send = (msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  const ctx: Ctx = {
    state,
    connected,
    clockOffset: offsetRef.current,
    send,
    patchSettings: (patch) => send({ type: 'updateSettings', patch }),
    startTimer: (kind, refKey, label, durationMs) =>
      send({ type: 'startTimer', kind, refKey, label, durationMs }),
    cancelTimer: (refKey) => send({ type: 'cancelTimer', refKey }),
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé sous <AppProvider>');
  return ctx;
}

/** Horloge locale rafraîchie ~4x/s pour animer les countdowns. */
export function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return now;
}
