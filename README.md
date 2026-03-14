# pixel-agents-web

Standalone web application that visualizes Claude Code multi-agent sessions
as pixel-art office animations. Run it alongside Claude Code in any terminal —
no VS Code required.

> **Based on [pixel-agents](https://github.com/pablodelucca/pixel-agents)**
> by [Pablo De Lucca](https://github.com/pablodelucca).
> This project is a standalone web port of the original VS Code extension.
> All pixel-art assets and the rendering engine are from the original project (MIT License).

## Quick Start

```bash
npx pixel-agents-web --path ~/projects/my-project
```

Then open `http://localhost:3333` and start a Claude Code session in the watched directory.

## How It Works

1. You run `claude` in a terminal as usual
2. Claude Code writes transcript files to `~/.claude/projects/<dir>/*.jsonl`
3. pixel-agents-web watches those files and streams updates via WebSocket
4. Your browser renders the pixel-art office with animated agent characters

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--path, -p` | `.` | Project directory to watch |
| `--port` | `3333` | Server port |
| `--no-open` | `false` | Don't open browser automatically |

## Architecture

This is a standalone web app port of pixel-agents. Key changes from the original:

| Original (VS Code extension) | This project (web app) |
|---|---|
| VS Code Webview API | React app served by Express |
| `vscode.postMessage` | WebSocket (`ws` library) |
| `vscode.workspace.createFileSystemWatcher` | `chokidar` |
| `vscode.window.createTerminal` | Removed (use your own terminal) |
| VS Code Marketplace | `npx pixel-agents-web` |

## Credits

This project is a standalone web port of the
[pixel-agents VS Code extension](https://github.com/pablodelucca/pixel-agents)
by Pablo De Lucca. The rendering engine, pixel-art sprites, game logic,
and transcript parser are derived from the original codebase.

## License

MIT — see [LICENSE](LICENSE)
