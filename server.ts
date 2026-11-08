import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

function computeCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZipArchive(files: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name.replace(/\\/g, '/'), 'utf8');
    const uncompressed = file.data;
    const compressed = zlib.deflateRawSync(uncompressed, { level: 6 });
    const crc = computeCrc32(uncompressed);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0x5421, 12); // mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // central dir signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(8, 10); // deflate
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

function collectDirectoryFiles(dirPath: string, zipPrefix: string, out: Array<{ name: string; data: Buffer }>) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = `${zipPrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      collectDirectoryFiles(fullPath, relPath, out);
    } else if (entry.isFile()) {
      out.push({ name: relPath, data: fs.readFileSync(fullPath) });
    }
  }
}

export interface RemotePlayerState {
  id: string;
  name: string;
  heroClass: 'ranger' | 'ragnar' | 'bounty' | 'assassin' | 'mage' | 'warrior' | 'sniper';
  x: number;
  y: number;
  z: number;
  rotY: number;
  hp: number;
  maxHp: number;
  shield: number;
  isCamouflaged: boolean;
  isMounted: boolean;
  isDownedScarab: boolean;
  isScoped: boolean;
  kills: number;
  score: number;
  updatedAt: number;
}

export interface RoomKillEvent {
  id: string;
  killerName: string;
  killerClass: string;
  victimName: string;
  weaponTag: string;
  isHeadshot: boolean;
  timestamp: number;
}

interface RoomState {
  id: string;
  name: string;
  players: Map<string, RemotePlayerState>;
  clients: Map<string, WebSocket>;
  killFeed: RoomKillEvent[];
}

const ROOMS = new Map<string, RoomState>();

const DEFAULT_ROOMS = [
  { id: 'karnak-prime', name: 'Sanctum of Karnak (Prime)' },
  { id: 'luxor-obelisk', name: 'Luxor Obelisk Canyon' },
  { id: 'abu-simbel', name: 'Abu Simbel Sun Court' },
];

for (const r of DEFAULT_ROOMS) {
  ROOMS.set(r.id, {
    id: r.id,
    name: r.name,
    players: new Map(),
    clients: new Map(),
    killFeed: [],
  });
}

function getOrCreateRoom(roomId: string): RoomState {
  const cleanId = (roomId || 'karnak-prime').toLowerCase().replace(/[^a-z0-9-_]/g, '');
  let room = ROOMS.get(cleanId);
  if (!room) {
    room = {
      id: cleanId,
      name: `Arena ${cleanId.toUpperCase()}`,
      players: new Map(),
      clients: new Map(),
      killFeed: [],
    };
    ROOMS.set(cleanId, room);
  }
  return room;
}

function broadcastToRoom(room: RoomState, message: unknown, excludePlayerId?: string) {
  const payload = JSON.stringify(message);
  for (const [pid, client] of room.clients.entries()) {
    if (excludePlayerId && pid === excludePlayerId) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/rooms', (_req, res) => {
    const summary = Array.from(ROOMS.values()).map((r) => ({
      id: r.id,
      name: r.name,
      playerCount: r.players.size,
      players: Array.from(r.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        heroClass: p.heroClass,
        kills: p.kills,
        score: p.score,
      })),
    }));
    res.json({ rooms: summary });
  });

  app.get('/api/download/windows-launcher', (req, res) => {
    const host = req.get('host') || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const gameUrl = `${proto}://${host}`;
    const batContent = [
      '@echo off',
      'title Khepri: Outriders of the Sun - Desktop App Launcher',
      'echo ========================================================',
      'echo   Launching Khepri: Outriders of the Sun (Desktop Mode)',
      'echo ========================================================',
      `start msedge --app="${gameUrl}" --start-maximized 2>nul || start chrome --app="${gameUrl}" --start-maximized 2>nul || start "" "${gameUrl}"`,
      'exit',
    ].join('\r\n');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="Play-Khepri-Desktop.bat"');
    res.send(Buffer.from(batContent, 'utf8'));
  });

  app.get('/api/download/project-zip', (_req, res) => {
    try {
      const files: Array<{ name: string; data: Buffer }> = [];
      const rootFolder = 'Khepri-Outriders-of-the-Sun';
      const rootFiles = [
        'package.json',
        'index.html',
        'vite.config.ts',
        'tsconfig.json',
        'server.ts',
        'metadata.json',
        '.env.example',
      ];

      for (const rf of rootFiles) {
        const full = path.join(__dirname, rf);
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          files.push({ name: `${rootFolder}/${rf}`, data: fs.readFileSync(full) });
        }
      }

      collectDirectoryFiles(path.join(__dirname, 'src'), `${rootFolder}/src`, files);
      collectDirectoryFiles(path.join(__dirname, 'public'), `${rootFolder}/public`, files);

      const startBat = [
        '@echo off',
        'title Khepri: Outriders of the Sun - Local PC Server',
        'echo ==============================================================',
        'echo   Khepri: Outriders of the Sun (100-Player Solar Royale)',
        'echo ==============================================================',
        'where node >nul 2>nul',
        'if %errorlevel% neq 0 (',
        '  echo [!] يرجى تثبيت Node.js اولا من الرابط: https://nodejs.org',
        '  echo [!] Please install Node.js LTS from https://nodejs.org first.',
        '  pause',
        '  exit /b 1',
        ')',
        'if not exist "node_modules" (',
        '  echo [*] Installing game dependencies for the first time (npm install)...',
        '  call npm install',
        ')',
        'echo [*] Starting local server and opening Desktop Game Window...',
        'start "" cmd /c "timeout /t 3 >nul & (start msedge --app=http://localhost:3000 --start-maximized 2>nul || start chrome --app=http://localhost:3000 --start-maximized 2>nul || start http://localhost:3000)"',
        'call npm run dev',
        'pause',
      ].join('\r\n');

      const startSh = [
        '#!/usr/bin/env bash',
        'set -e',
        'if [ ! -d "node_modules" ]; then',
        '  echo "Installing game dependencies..."',
        '  npm install',
        'fi',
        'echo "Starting Khepri: Outriders of the Sun on http://localhost:3000 ..."',
        'npm run dev',
      ].join('\n');

      const readmeAr = [
        '# Khepri: Outriders of the Sun (خيبري: فرسان الشمس - باتل رويال 100 مقاتل)',
        '',
        '## طريقة تشغيل اللعبة على الحاسوب (Windows / Mac / Linux):',
        '',
        '1. تأكد من تثبيت **Node.js** (الإصدار LTS) من الموقع الرسمي: https://nodejs.org',
        '2. على نظام **Windows**: اضغط مرتين على الملف **`START_GAME_WINDOWS.bat`**، وسيقوم تلقائياً بتثبيت الحزم وتشغيل اللعبة في نافذة تطبيق مستقلة.',
        '3. أو عبر موجه الأوامر (Terminal):',
        '   ```bash',
        '   npm install',
        '   npm run dev',
        '   ```',
        '   ثم افتح الرابط: http://localhost:3000',
      ].join('\r\n');

      files.push({ name: `${rootFolder}/START_GAME_WINDOWS.bat`, data: Buffer.from(startBat, 'utf8') });
      files.push({ name: `${rootFolder}/start_game.sh`, data: Buffer.from(startSh, 'utf8') });
      files.push({ name: `${rootFolder}/README_ARABIC.md`, data: Buffer.from(readmeAr, 'utf8') });

      const zipBuffer = buildZipArchive(files);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="Khepri-Outriders-of-the-Sun-PC.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let currentRoomId = 'karnak-prime';
    let currentPlayerId = '';

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (!msg || typeof msg.type !== 'string') return;

        if (msg.type === 'room:join') {
          const playerId = String(msg.playerId || `outrider-${Math.random().toString(36).slice(2, 8)}`);
          const roomId = String(msg.roomId || 'karnak-prime');

          // Remove from previous room if switching
          if (currentPlayerId && currentRoomId) {
            const prevRoom = ROOMS.get(currentRoomId);
            if (prevRoom && prevRoom.players.has(currentPlayerId)) {
              prevRoom.players.delete(currentPlayerId);
              prevRoom.clients.delete(currentPlayerId);
              broadcastToRoom(prevRoom, {
                type: 'player:left',
                playerId: currentPlayerId,
              });
            }
          }

          currentPlayerId = playerId;
          currentRoomId = roomId;
          const room = getOrCreateRoom(roomId);

          const initialPlayer: RemotePlayerState = {
            id: playerId,
            name: String(msg.name || 'Medjay Outrider').slice(0, 22),
            heroClass: msg.heroClass || 'ranger',
            x: Number(msg.x) || 0,
            y: Number(msg.y) || 0,
            z: Number(msg.z) || 18,
            rotY: Number(msg.rotY) || 0,
            hp: Number(msg.hp) || 120,
            maxHp: Number(msg.maxHp) || 120,
            shield: Number(msg.shield) || 60,
            isCamouflaged: Boolean(msg.isCamouflaged),
            isMounted: Boolean(msg.isMounted),
            isDownedScarab: Boolean(msg.isDownedScarab),
            isScoped: Boolean(msg.isScoped),
            kills: Number(msg.kills) || 0,
            score: Number(msg.score) || 0,
            updatedAt: Date.now(),
          };

          room.players.set(playerId, initialPlayer);
          room.clients.set(playerId, ws);

          // Send full room snapshot to joining client
          ws.send(
            JSON.stringify({
              type: 'room:state',
              roomId: room.id,
              roomName: room.name,
              players: Array.from(room.players.values()),
              killFeed: room.killFeed.slice(-6),
            })
          );

          // Broadcast join to other players in room
          broadcastToRoom(
            room,
            {
              type: 'player:joined',
              player: initialPlayer,
            },
            playerId
          );
          return;
        }

        const room = ROOMS.get(currentRoomId);
        if (!room || !currentPlayerId) return;

        if (msg.type === 'player:update') {
          const existing = room.players.get(currentPlayerId);
          if (!existing) return;
          const updated: RemotePlayerState = {
            ...existing,
            heroClass: msg.heroClass ?? existing.heroClass,
            x: typeof msg.x === 'number' ? msg.x : existing.x,
            y: typeof msg.y === 'number' ? msg.y : existing.y,
            z: typeof msg.z === 'number' ? msg.z : existing.z,
            rotY: typeof msg.rotY === 'number' ? msg.rotY : existing.rotY,
            hp: typeof msg.hp === 'number' ? msg.hp : existing.hp,
            maxHp: typeof msg.maxHp === 'number' ? msg.maxHp : existing.maxHp,
            shield: typeof msg.shield === 'number' ? msg.shield : existing.shield,
            isCamouflaged: typeof msg.isCamouflaged === 'boolean' ? msg.isCamouflaged : existing.isCamouflaged,
            isMounted: typeof msg.isMounted === 'boolean' ? msg.isMounted : existing.isMounted,
            isDownedScarab: typeof msg.isDownedScarab === 'boolean' ? msg.isDownedScarab : existing.isDownedScarab,
            isScoped: typeof msg.isScoped === 'boolean' ? msg.isScoped : existing.isScoped,
            kills: typeof msg.kills === 'number' ? msg.kills : existing.kills,
            score: typeof msg.score === 'number' ? msg.score : existing.score,
            updatedAt: Date.now(),
          };
          room.players.set(currentPlayerId, updated);
          broadcastToRoom(
            room,
            {
              type: 'player:updated',
              player: updated,
            },
            currentPlayerId
          );
        } else if (msg.type === 'projectile:spawn') {
          broadcastToRoom(
            room,
            {
              type: 'projectile:spawned',
              projectile: {
                id: String(msg.id || `${currentPlayerId}-${Date.now()}`),
                ownerId: currentPlayerId,
                heroClass: msg.heroClass || 'ranger',
                x: Number(msg.x) || 0,
                y: Number(msg.y) || 1.4,
                z: Number(msg.z) || 0,
                vx: Number(msg.vx) || 0,
                vy: Number(msg.vy) || 0,
                vz: Number(msg.vz) || 0,
                damage: Number(msg.damage) || 34,
                isCharged: Boolean(msg.isCharged),
              },
            },
            currentPlayerId
          );
        } else if (msg.type === 'combat:hit') {
          const targetId = String(msg.targetId || '');
          const damage = Math.max(1, Math.min(280, Number(msg.damage) || 25));
          const targetClient = room.clients.get(targetId);
          if (targetClient && targetClient.readyState === WebSocket.OPEN) {
            targetClient.send(
              JSON.stringify({
                type: 'combat:damaged',
                attackerId: currentPlayerId,
                attackerName: room.players.get(currentPlayerId)?.name || 'Outrider',
                damage,
                isHeadshot: Boolean(msg.isHeadshot),
              })
            );
          }
        } else if (msg.type === 'kill:report') {
          const eventId = String(msg.id || `${currentPlayerId}-${Date.now()}`);
          if (room.killFeed.some((k) => k.id === eventId)) return;
          const killEvent: RoomKillEvent = {
            id: eventId,
            killerName: String(msg.killerName || room.players.get(currentPlayerId)?.name || 'Medjay Outrider'),
            killerClass: String(msg.killerClass || 'ranger'),
            victimName: String(msg.victimName || 'Rival Outrider'),
            weaponTag: String(msg.weaponTag || 'Sun-Forged Greatbow'),
            isHeadshot: Boolean(msg.isHeadshot),
            timestamp: Date.now(),
          };
          room.killFeed.push(killEvent);
          if (room.killFeed.length > 15) room.killFeed.shift();
          broadcastToRoom(room, {
            type: 'kill:feed',
            event: killEvent,
          });
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      if (currentPlayerId && currentRoomId) {
        const room = ROOMS.get(currentRoomId);
        if (room && room.players.has(currentPlayerId)) {
          room.players.delete(currentPlayerId);
          room.clients.delete(currentPlayerId);
          broadcastToRoom(room, {
            type: 'player:left',
            playerId: currentPlayerId,
          });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const hmrEnabled = process.env.DISABLE_HMR !== 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrEnabled ? { server } : false,
        watch: hmrEnabled ? {} : null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Khepri Arena Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
