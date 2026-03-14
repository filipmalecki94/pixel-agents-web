#!/usr/bin/env node

import open from 'open';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { createPixelAgentsServer } from './server.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'Path to the project directory to watch',
    default: '.',
  })
  .option('port', {
    type: 'number',
    description: 'Server port',
    default: 3333,
  })
  .option('no-open', {
    type: 'boolean',
    description: 'Do not open browser automatically',
    default: false,
  })
  .parseSync();

const watchPath = path.resolve(argv.path as string);
const port = argv.port as number;
const shouldOpen = !argv['no-open'];

console.log(`
  +========================================+
  |     pixel-agents-web                   |
  |     Pixel office for Claude Code       |
  +========================================+
`);

const { httpServer } = createPixelAgentsServer({ port, watchPath });

if (shouldOpen) {
  httpServer.on('listening', () => {
    open(`http://localhost:${port}`).catch(() => {
      console.log(`Open your browser at http://localhost:${port}`);
    });
  });
}
