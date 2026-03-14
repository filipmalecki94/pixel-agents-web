class WebSocketBridge {
  private ws: WebSocket | null = null;
  private messageQueue: unknown[] = [];

  constructor() { this.connect(); }

  private connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      for (const msg of this.messageQueue) this.ws!.send(JSON.stringify(msg));
      this.messageQueue = [];
    };
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string);
      window.dispatchEvent(new MessageEvent('message', { data }));
    };
    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 2000);
    };
  }

  postMessage(msg: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.messageQueue.push(msg);
    }
  }
}

export const vscode = new WebSocketBridge();
