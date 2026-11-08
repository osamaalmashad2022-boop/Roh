import { HeroClassId } from './rules';

export interface SyncedRemotePlayer {
  id: string;
  name: string;
  heroClass: HeroClassId;
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

export interface SyncedProjectileEvent {
  id: string;
  ownerId: string;
  heroClass: HeroClassId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  isCharged: boolean;
}

export interface SyncedKillFeedEvent {
  id: string;
  killerName: string;
  killerClass: string;
  victimName: string;
  weaponTag: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface MultiplayerCallbacks {
  onPlayersChange?: (players: Map<string, SyncedRemotePlayer>) => void;
  onRemoteProjectile?: (proj: SyncedProjectileEvent) => void;
  onLocalDamaged?: (payload: { attackerId: string; attackerName: string; damage: number; isHeadshot: boolean }) => void;
  onKillFeed?: (event: SyncedKillFeedEvent) => void;
  onConnectionChange?: (connected: boolean, roomId: string, onlineCount: number) => void;
}

export class ArenaMultiplayerClient {
  public readonly localPlayerId: string;
  public localName: string;
  public roomId: string;
  public remotePlayers = new Map<string, SyncedRemotePlayer>();
  private ws: WebSocket | null = null;
  private callbacks: MultiplayerCallbacks;
  private reconnectTimer: number | null = null;
  private isDisposed = false;
  private seenProjectiles = new Set<string>();
  private seenKills = new Set<string>();
  private lastEmitTime = 0;

  constructor(callbacks: MultiplayerCallbacks, initialRoom = 'karnak-prime') {
    this.localPlayerId = `medjay-${Math.random().toString(36).slice(2, 8)}`;
    const randomTag = Math.floor(10 + Math.random() * 89);
    this.localName = `Bayek-${randomTag}`;
    this.roomId = initialRoom;
    this.callbacks = callbacks;
  }

  public connect(roomId?: string, heroClass: HeroClassId = 'ranger') {
    if (roomId) this.roomId = roomId;
    if (this.isDisposed) return;

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.onopen = null;
        this.ws.close();
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.isDisposed) return;
        this.send({
          type: 'room:join',
          roomId: this.roomId,
          playerId: this.localPlayerId,
          name: this.localName,
          heroClass,
          x: 0,
          y: 0.6,
          z: 18,
          hp: 120,
          maxHp: 120,
          shield: 60,
        });
        this.notifyStatus(true);
      };

      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          this.handleMessage(msg);
        } catch {
          // Ignore invalid JSON
        }
      };

      socket.onclose = () => {
        this.notifyStatus(false);
        if (!this.isDisposed) {
          this.reconnectTimer = window.setTimeout(() => this.connect(this.roomId, heroClass), 2500);
        }
      };

      socket.onerror = () => {
        // Handled by onclose
      };
    } catch {
      this.notifyStatus(false);
    }
  }

  private handleMessage(msg: any) {
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'room:state' && Array.isArray(msg.players)) {
      this.remotePlayers.clear();
      for (const p of msg.players as SyncedRemotePlayer[]) {
        if (p.id !== this.localPlayerId) {
          this.remotePlayers.set(p.id, p);
        }
      }
      this.callbacks.onPlayersChange?.(this.remotePlayers);
      this.notifyStatus(true);
      if (Array.isArray(msg.killFeed)) {
        for (const k of msg.killFeed as SyncedKillFeedEvent[]) {
          if (!this.seenKills.has(k.id)) {
            this.seenKills.add(k.id);
            this.callbacks.onKillFeed?.(k);
          }
        }
      }
    } else if (msg.type === 'player:joined' || msg.type === 'player:updated') {
      const p = msg.player as SyncedRemotePlayer;
      if (p && p.id && p.id !== this.localPlayerId) {
        this.remotePlayers.set(p.id, p);
        this.callbacks.onPlayersChange?.(this.remotePlayers);
        this.notifyStatus(true);
      }
    } else if (msg.type === 'player:left') {
      const pid = String(msg.playerId || '');
      if (this.remotePlayers.has(pid)) {
        this.remotePlayers.delete(pid);
        this.callbacks.onPlayersChange?.(this.remotePlayers);
        this.notifyStatus(true);
      }
    } else if (msg.type === 'projectile:spawned' && msg.projectile) {
      const proj = msg.projectile as SyncedProjectileEvent;
      // Idempotency guard
      if (this.seenProjectiles.has(proj.id)) return;
      this.seenProjectiles.add(proj.id);
      if (this.seenProjectiles.size > 200) {
        const first = this.seenProjectiles.values().next().value;
        if (first) this.seenProjectiles.delete(first);
      }
      this.callbacks.onRemoteProjectile?.(proj);
    } else if (msg.type === 'combat:damaged') {
      this.callbacks.onLocalDamaged?.({
        attackerId: String(msg.attackerId || ''),
        attackerName: String(msg.attackerName || 'Rival Outrider'),
        damage: Number(msg.damage) || 24,
        isHeadshot: Boolean(msg.isHeadshot),
      });
    } else if (msg.type === 'kill:feed' && msg.event) {
      const k = msg.event as SyncedKillFeedEvent;
      if (this.seenKills.has(k.id)) return;
      this.seenKills.add(k.id);
      this.callbacks.onKillFeed?.(k);
    }
  }

  public emitPlayerState(state: Omit<SyncedRemotePlayer, 'id' | 'name' | 'updatedAt'>) {
    const now = performance.now();
    if (now - this.lastEmitTime < 55) return; // Throttle to ~18Hz
    this.lastEmitTime = now;
    this.send({
      type: 'player:update',
      ...state,
    });
  }

  public emitProjectile(proj: Omit<SyncedProjectileEvent, 'ownerId'>) {
    this.send({
      type: 'projectile:spawn',
      ...proj,
    });
  }

  public emitHit(targetId: string, damage: number, isHeadshot: boolean) {
    this.send({
      type: 'combat:hit',
      targetId,
      damage,
      isHeadshot,
    });
  }

  public emitKill(victimName: string, weaponTag: string, killerClass: string, isHeadshot: boolean) {
    const event: SyncedKillFeedEvent = {
      id: `${this.localPlayerId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      killerName: this.localName,
      killerClass,
      victimName,
      weaponTag,
      isHeadshot,
      timestamp: Date.now(),
    };
    this.seenKills.add(event.id);
    this.callbacks.onKillFeed?.(event);
    this.send({
      type: 'kill:report',
      ...event,
    });
  }

  private notifyStatus(connected: boolean) {
    this.callbacks.onConnectionChange?.(connected, this.roomId, this.remotePlayers.size + 1);
  }

  private send(payload: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public dispose() {
    this.isDisposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
    }
  }
}
