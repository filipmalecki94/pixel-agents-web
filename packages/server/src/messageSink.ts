/**
 * Abstraction replacing vscode.Webview.postMessage().
 * Server uses WebSocket; tests can use a mock.
 */
export interface MessageSink {
  postMessage(msg: unknown): void;
}
