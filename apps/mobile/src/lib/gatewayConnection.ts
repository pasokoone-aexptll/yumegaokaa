// One foreground subscription. Notifications carry no user content; callers
// reload through the existing authorized APIs, including after reconnect.
type Socket = Pick<WebSocket, "onmessage" | "onclose" | "onerror" | "close">;
export function gatewayConnection(options: {
  token(): Promise<string>;
  connect(token: string): Socket;
  changed(): void;
  retryMs?: number;
}) {
  let active = false;
  let generation = 0;
  let socket: Socket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  function retry(version: number) {
    if (!active || generation !== version || timer) return;
    const delay = Math.min(
      30000,
      (options.retryMs ?? 1000) * 2 ** Math.min(failures++, 5),
    );
    timer = setTimeout(() => {
      timer = undefined;
      void open(version);
    }, delay);
  }
  async function open(version: number) {
    try {
      const token = await options.token();
      if (!active || generation !== version) return;
      const current = options.connect(token);
      socket = current;
      current.onmessage = (event) => {
        if (!active || generation !== version || socket !== current) return;
        try {
          const message = JSON.parse(String(event.data));
          if (message.type === "ready" || message.type === "changed") {
            failures = 0;
            options.changed();
          }
        } catch {
          /* Ignore malformed notifications; API refresh remains authoritative. */
        }
      };
      current.onerror = () => current.close();
      current.onclose = () => {
        if (socket !== current) return;
        socket = undefined;
        retry(version);
      };
    } catch {
      retry(version);
    }
  }
  return {
    setActive(next: boolean) {
      if (next === active) return;
      active = next;
      generation++;
      clearTimeout(timer);
      timer = undefined;
      const previous = socket;
      socket = undefined;
      previous?.close();
      if (next) void open(generation);
    },
  };
}
