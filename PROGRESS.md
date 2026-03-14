# PROGRESS.md — pixel-agents-web implementation status

> Updated automatically by Claude Code at the end of each stage session.
> Reference: PLAN.md for full details on each stage.

## Legend
- ✅ Done
- ⏭️ Skipped (with reason)
- 🚧 In progress / partial
- ⬜ Not started

---

## Pre-stage work

| Task | Status | Notes |
|---|---|---|
| GitHub repo created (`filipmaleckiki94/pixel-agents-web`) | ✅ | https://github.com/filipmaleckiki94/pixel-agents-web |
| Git initialized, remote set | ✅ | `main` branch |
| `.gitignore` + `README.md` initial commit | ✅ | commit `1fd4d76` |
| Original repo cloned as reference | ✅ | `/tmp/pixel-agents-src` (re-clone if missing) |
| `PLAN-CLAUDE-CODE-CONFIGS.md` deleted | ✅ | Not tracked in git |

---

## Etap 0: Setup projektu

| Step | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Git repo init | ✅ | Done in pre-stage |
| 0.2 | Directory structure (`packages/server/`, `packages/web/`) | ✅ | |
| 0.3 | Root `package.json` (npm workspaces) | ✅ | |
| 0.4 | `tsconfig.base.json` | ✅ | |
| 0.5 | `packages/server/package.json` | ✅ | |
| 0.6 | `packages/web/package.json` (copied from `webview-ui/package.json`) | ✅ | |
| 0.7 | Copy `webview-ui/public/assets/` → `packages/web/public/assets/` | ✅ | Also copied `public/fonts/` |
| — | `packages/server/tsconfig.json` | ✅ | |
| — | `packages/web/tsconfig*.json` (copied from original) | ✅ | |
| — | `packages/web/vite.config.ts` (copied + outDir fix) | ✅ | outDir: 'dist' |
| — | `packages/web/index.html` (copied) | ✅ | title: pixel-agents-web |
| — | `LICENSE` (MIT + attribution) | ✅ | |
| — | `npm install` runs clean | ✅ | 292 packages, 0 vulnerabilities; EBADENGINE warns (Node 18 vs vite ≥20) |

**Overall Etap 0:** ✅ Complete

---

## Etap 1: Przeniesienie frontendu

| Step | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Copy ~36 files verbatim from `webview-ui/src/` | ✅ | All files diff-identical with originals |
| 1.2 | Write `packages/web/src/vscodeApi.ts` (WebSocket bridge) | ✅ | Reconnects every 2s on close |
| 1.3 | Modify `packages/web/src/App.tsx` (remove terminal handlers) | ✅ | `handleSelectAgent` + `handleCloseAgent` → no-op |
| 1.4 | Asset loading strategy confirmed (server-side pngjs → WS) | ✅ | No frontend changes needed |
| 1.5 | `npm -w packages/web run build` passes clean | ✅ | tsc ✅, vite 61 modules → dist/ |
| — | Node.js upgrade (18 → 22) via nvm | ✅ | `.nvmrc` created (22); Vite 7 requires ≥20.19 |

**Overall Etap 1:** ✅ Complete

---

## Etap 2: Serwer WebSocket

| Step | Task | Status | Notes |
|---|---|---|---|
| 2.1 | `packages/server/src/messageSink.ts` (new interface) | ✅ | |
| 2.2 | Port server files (transcriptParser, timerManager, constants, types, assetLoader, layoutPersistence) | ✅ | All 6 files ported; VS Code deps removed |
| 2.3 | `packages/server/src/fileWatcher.ts` (chokidar + MessageSink) | ✅ | chokidar replaces fs.watch+watchFile+polling triple |
| 2.4 | `packages/server/src/types.ts` (rewrite, remove terminalRef) | ✅ | |
| 2.5 | `packages/server/src/agentServer.ts` (new, replaces PixelAgentsViewProvider + agentManager) | ✅ | Correct assetsDir via fileURLToPath |
| 2.6 | `packages/server/src/server.ts` (Express + WebSocketServer) | ✅ | |
| — | `npm -w packages/server run build` passes clean | ✅ | tsc 0 errors |

**Overall Etap 2:** ✅ Complete

---

## Etap 3: Integracja i testowanie

| Step | Task | Status | Notes |
|---|---|---|---|
| 3.1 | `npm run build` (full monorepo) passes | ✅ | web: 61 modules; server: tsc 0 errors; Express 5 wildcard fixed |
| 3.2 | `packages/web/vite.config.ts` verified (outDir, base: './') | ✅ | Already correct from Stage 0 |
| 3.3 | Manual E2E test: static render (office loads, no console errors) | ✅ | Minor passive event listener warnings only |
| 3.3 | Manual E2E test: Claude Code session → agent appears | ✅ | Fixed: path encoding bug (`-home-...` vs `home-...`) |
| 3.3 | Manual E2E test: multi-agent (two `claude` sessions) | ⬜ | |
| 3.3 | Manual E2E test: layout editor saves/restores | ⬜ | |
| 3.4 | Edge cases verified (missing dir, multi-tab, WS reconnect) | ⬜ | |

**Overall Etap 3:** 🚧 Core E2E working; multi-agent + layout editor pending

---

## Etap 4: CLI i dystrybucja npm

| Step | Task | Status | Notes |
|---|---|---|---|
| 4.1 | `packages/server/src/cli.ts` (yargs CLI entry point) | ✅ | Created early (needed for Stage 3 E2E) |
| 4.2 | Root `package.json` updated for npm publish (`bin`, `files`) | ⬜ | |
| 4.3 | `npx pixel-agents-web --path .` works end-to-end | ⬜ | |
| — | `README.md` updated with full docs | ⬜ | |
| — | `CONTRIBUTING.md` added | ⬜ | |
| — | Tag `v0.1.0` + GitHub Release | ⬜ | |

**Overall Etap 4:** ⬜ Not started

---

## Session log

| Date | Stage | What was done |
|---|---|---|
| 2026-03-14 | Pre-stage | Created GitHub repo, initialized git, initial commit with .gitignore + README |
| 2026-03-14 | Etap 0 | Monorepo skeleton: package.json, tsconfigs, vite config, index.html, assets copied, LICENSE, npm install clean |
| 2026-03-14 | Etap 1 | Ported React frontend: 36 verbatim files + vscodeApi.ts (WS bridge) + App.tsx patch; build clean; Node upgraded to 22 |
| 2026-03-14 | Etap 2 | Created 10 server source files; replaced all VS Code deps with MessageSink + chokidar; tsc 0 errors |
| 2026-03-14 | Etap 3 | Created cli.ts (4.1); fixed Express 5 wildcard route; full monorepo build clean; server smoke test passes (assets loaded, listening on :3333) |
