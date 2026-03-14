# Contributing to pixel-agents-web

## Origin

This project is a standalone web port of
[pixel-agents](https://github.com/pablodelucca/pixel-agents) (VS Code extension)
by Pablo De Lucca. The rendering engine, sprites, and transcript parser
come from the original project.

## Development Setup

```bash
git clone https://github.com/filipmaleckiki94/pixel-agents-web
cd pixel-agents-web
npm install
npm run dev
```

Then open `http://localhost:5173` (Vite dev server) and run
`node packages/server/dist/cli.js --path .` separately.

## Commit Convention

Conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring
- `docs:` — documentation
- `chore:` — build, deps, CI

## Guidelines

- TypeScript strict mode everywhere
- OOP patterns for server-side code (classes, proper encapsulation)
- Preserve compatibility with the original JSONL transcript format
