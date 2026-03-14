import type { FSWatcher } from 'chokidar';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { WebSocket } from 'ws';

import {
  loadCharacterSprites,
  loadDefaultLayout,
  loadFloorTiles,
  loadFurnitureAssets,
  loadWallTiles,
} from './assetLoader.js';
import { startFileWatching, readNewLines } from './fileWatcher.js';
import { loadLayout, writeLayoutToFile } from './layoutPersistence.js';
import type { MessageSink } from './messageSink.js';
import type { AgentState } from './types.js';

export class AgentServer implements MessageSink {
  private agents = new Map<number, AgentState>();
  private nextAgentId = 1;
  private clients = new Set<WebSocket>();
  private fileWatchers = new Map<number, FSWatcher>();
  private waitingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private permissionTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private knownJsonlFiles = new Set<string>();
  private projectScanTimer: ReturnType<typeof setInterval> | null = null;
  private projectDir: string;
  private assetsDir: string;
  private settingsFile: string;
  private settings = { soundEnabled: true, agentSeats: {} as Record<string, unknown> };

  constructor(private watchPath: string) {
    // Claude Code stores transcripts in ~/.claude/projects/<encoded-path>/
    const encoded = watchPath.replace(/\//g, '-');
    this.projectDir = path.join(os.homedir(), '.claude', 'projects', encoded);

    // assetsDir points to packages/web/dist/ (sibling of packages/server/dist/)
    const serverDir = path.dirname(fileURLToPath(import.meta.url));
    this.assetsDir = path.join(serverDir, '..', '..', 'web', 'dist');

    this.settingsFile = path.join(os.homedir(), '.pixel-agents', 'settings.json');
    this.loadSettings();
  }

  /** Broadcast to all connected WebSocket clients */
  postMessage(msg: unknown): void {
    const json = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === 1 /* OPEN */) {
        client.send(json);
      }
    }
  }

  /** New WebSocket client — register and initialize */
  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    ws.on('close', () => this.clients.delete(ws));
    ws.on('message', (raw: Buffer) => {
      this.handleClientMessage(JSON.parse(raw.toString()) as Record<string, unknown>);
    });
    // Send current state to new client
    this.onWebviewReady().catch(console.error);
  }

  private handleClientMessage(msg: Record<string, unknown>): void {
    switch (msg.type) {
      case 'saveLayout':
        writeLayoutToFile(msg.layout as Record<string, unknown>);
        break;
      case 'setSoundEnabled':
        this.settings.soundEnabled = msg.enabled as boolean;
        this.saveSettings();
        break;
      case 'saveAgentSeats':
        this.settings.agentSeats = msg.seats as Record<string, unknown>;
        this.saveSettings();
        break;
      // focusAgent, closeAgent, openClaude — omitted (no terminals)
    }
  }

  private async onWebviewReady(): Promise<void> {
    this.postMessage({ type: 'settingsLoaded', soundEnabled: this.settings.soundEnabled });
    await this.loadAndSendAssets();
    this.sendLayout();
    this.sendExistingAgents();
    this.startProjectScan();
  }

  private async loadAndSendAssets(): Promise<void> {
    const furniture = await loadFurnitureAssets(this.assetsDir);
    if (furniture) {
      // sprites is Map<string, string[][]>, must convert to plain object for JSON
      const spritesObj: Record<string, string[][]> = {};
      for (const [id, data] of furniture.sprites) spritesObj[id] = data;
      this.postMessage({
        type: 'furnitureAssetsLoaded',
        catalog: furniture.catalog,
        sprites: spritesObj,
      });
    } else {
      this.postMessage({ type: 'furnitureAssetsLoaded', catalog: [], sprites: {} });
    }

    const characters = await loadCharacterSprites(this.assetsDir);
    this.postMessage({
      type: 'characterSpritesLoaded',
      characters: characters?.characters ?? [],
    });

    const floors = await loadFloorTiles(this.assetsDir);
    this.postMessage({
      type: 'floorTilesLoaded',
      sprites: floors?.sprites ?? [],
    });

    const walls = await loadWallTiles(this.assetsDir);
    this.postMessage({
      type: 'wallTilesLoaded',
      sets: walls?.sets ?? [],
    });
  }

  private sendLayout(): void {
    const defaultLayout = loadDefaultLayout(this.assetsDir);
    const layout = loadLayout(defaultLayout);
    if (layout) {
      this.postMessage({ type: 'layoutLoaded', layout });
    }
  }

  private sendExistingAgents(): void {
    for (const agent of this.agents.values()) {
      this.postMessage({ type: 'agentCreated', id: agent.id });
    }
  }

  private startProjectScan(): void {
    if (this.projectScanTimer) return;
    this.scanForNewFiles(); // Run immediately
    this.projectScanTimer = setInterval(() => this.scanForNewFiles(), 1000);
  }

  private scanForNewFiles(): void {
    if (!fs.existsSync(this.projectDir)) return;
    try {
      const files = fs
        .readdirSync(this.projectDir)
        .filter((f) => f.endsWith('.jsonl'))
        .map((f) => path.join(this.projectDir, f));
      for (const file of files) {
        if (!this.knownJsonlFiles.has(file)) {
          this.knownJsonlFiles.add(file);
          this.adoptNewAgent(file);
        }
      }
    } catch {
      /* directory may not exist yet */
    }
  }

  private adoptNewAgent(jsonlFile: string): void {
    const id = this.nextAgentId++;
    const agent: AgentState = {
      id,
      projectDir: this.projectDir,
      jsonlFile,
      fileOffset: 0,
      lineBuffer: '',
      activeToolIds: new Set(),
      activeToolStatuses: new Map(),
      activeToolNames: new Map(),
      activeSubagentToolIds: new Map(),
      activeSubagentToolNames: new Map(),
      isWaiting: false,
      permissionSent: false,
      hadToolsInTurn: false,
    };
    this.agents.set(id, agent);
    this.postMessage({ type: 'agentCreated', id });

    const watcher = startFileWatching(
      id,
      jsonlFile,
      this.agents,
      this.waitingTimers,
      this.permissionTimers,
      this,
    );
    this.fileWatchers.set(id, watcher);
    readNewLines(id, this.agents, this.waitingTimers, this.permissionTimers, this);
  }

  private loadSettings(): void {
    try {
      const raw = fs.readFileSync(this.settingsFile, 'utf-8');
      Object.assign(this.settings, JSON.parse(raw));
    } catch {
      /* no file = default settings */
    }
  }

  private saveSettings(): void {
    fs.mkdirSync(path.dirname(this.settingsFile), { recursive: true });
    fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
  }

  dispose(): void {
    if (this.projectScanTimer) clearInterval(this.projectScanTimer);
    for (const watcher of this.fileWatchers.values()) watcher.close();
  }
}
