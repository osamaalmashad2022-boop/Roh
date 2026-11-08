import { useState, useEffect, useRef, useCallback } from 'react';
import { HeroClassId, WeaponSlotId, GameStateMode } from './game/rules';
import {
  ArenaCanvas,
  LiveHUDTelemetry,
  EndOfRunSnapshot,
  ArenaControlActions,
} from './components/ArenaCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleAndModals } from './components/TitleAndModals';
import { audioEngine } from './game/audio';
import { SyncedKillFeedEvent } from './game/multiplayer';

const INITIAL_TELEMETRY: LiveHUDTelemetry = {
  hp: 120,
  maxHp: 120,
  ghostHp: 120,
  shield: 60,
  maxShield: 60,
  activeWeaponSlot: 1,
  magicShards: 40,
  forgeLevel: 0,
  drawCharge: 0,
  isScoped: false,
  isPointerLocked: false,
  isCamouflaged: false,
  camouflageRemaining: 0,
  isMounted: false,
  isDownedScarab: false,
  isPropDisguised: false,
  scarabRemaining: 0,
  relicReady: true,
  relicCooldown: 0,
  isHighGround: false,
  perchName: null,
  cooldowns: { q: 0, e: 0, c: 0, r: 0, v: 0, dash: 0 },
  kills: 0,
  targetKills: 10,
  headshots: 0,
  score: 0,
  bestScore: 0,
  wave: 1,
  damageDealt: 0,
  matchTime: 0,
  lastHitBanner: null,
  lockedTargetName: null,
  lockedTargetHpRatio: 0,
  lockedTargetScreen: null,
  minimapActors: [],
  floatingDamages: [],
  hitArcs: [],
  killstreak: {
    count: 0,
    best: 0,
    timer: 0,
    title: '',
    arabicTitle: '',
  },
  bossStatus: {
    active: false,
    name: 'Khepri Colossus · Solar Pharaoh',
    hp: 0,
    maxHp: 340,
  },
  isSandboxMode: false,
  sandboxZeroCooldown: false,
  analytics: {
    shotsFired: 0,
    shotsHit: 0,
    maxSingleDamage: 0,
    bestStreak: 0,
    bossesDefeated: 0,
    chestsOpened: 0,
  },
  battleRoyale: {
    aliveCount: 100,
    totalCount: 100,
    playerRank: 100,
    stormPhase: 1,
    stormIsShrinking: false,
    stormTimer: 16,
    stormRadius: 130,
    stormTargetRadius: 95,
    stormDamagePerSec: 4,
    isOutsideStorm: false,
    lodNearRigCount: 14,
    lodInstancedCount: 85,
    topContenders: [],
  },
};

export default function App() {
  const [gameState, setGameState] = useState<GameStateMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('sandbox') === '1';
    }
    return false;
  });

  const [heroClass, setHeroClass] = useState<HeroClassId>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const raw = (params.get('hero') || params.get('class') || '').toLowerCase();
      if (
        raw === 'ranger' ||
        raw === 'ragnar' ||
        raw === 'bounty' ||
        raw === 'assassin' ||
        raw === 'mage' ||
        raw === 'warrior' ||
        raw === 'sniper' ||
        raw === 'tesla' ||
        raw === 'claudia'
      ) {
        return raw;
      }
    }
    return 'ranger';
  });
  const [roomId, setRoomId] = useState<string>('karnak-prime');
  const [muted, setMuted] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [mouseSensitivity, setMouseSensitivity] = useState<number>(1.0);
  const [aimAssistEnabled, setAimAssistEnabled] = useState<boolean>(true);
  const [showroomWeapon, setShowroomWeapon] = useState<WeaponSlotId>(1);
  const [showroomForge, setShowroomForge] = useState<number>(0);
  const [telemetry, setTelemetry] = useState<LiveHUDTelemetry>(INITIAL_TELEMETRY);
  const [endSnapshot, setEndSnapshot] = useState<EndOfRunSnapshot | null>(null);
  const [killFeed, setKillFeed] = useState<SyncedKillFeedEvent[]>([]);
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; roomId: string; count: number }>({
    connected: false,
    roomId: 'karnak-prime',
    count: 1,
  });

  const actionsRef = useRef<ArenaControlActions | null>(null);

  useEffect(() => {
    document.body.dataset.state = gameState;
    if (gameState !== 'playing') {
      document.exitPointerLock?.();
    }
  }, [gameState]);

  const startGame = useCallback((sandboxFlag?: boolean) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (typeof sandboxFlag === 'boolean') {
      setIsSandboxMode(sandboxFlag);
    }
    setTimeout(() => {
      actionsRef.current?.resetMatch();
      if (sandboxFlag) {
        actionsRef.current?.triggerSandboxFullRestore();
      }
    }, 0);
    setEndSnapshot(null);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleMatchEnd = useCallback((snapshot: EndOfRunSnapshot) => {
    setEndSnapshot(snapshot);
    document.body.dataset.state = 'gameover';
    setGameState('gameover');
  }, []);

  const handleKillFeed = useCallback((event: SyncedKillFeedEvent) => {
    setKillFeed((prev) => {
      if (prev.some((e) => e.id === event.id)) return prev;
      return [...prev.slice(-5), event];
    });
  }, []);

  const handleMultiplayerStatus = useCallback(
    (connected: boolean, rId: string, onlineCount: number) => {
      setMpStatus({ connected, roomId: rId, count: onlineCount });
    },
    []
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        startGame(false);
        return;
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      } else if (e.code === 'KeyM') {
        audioEngine.muted = !audioEngine.muted;
        setMuted(audioEngine.muted);
      } else if (e.code === 'KeyH' && gameState === 'playing') {
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'Backspace' && gameState === 'playing') {
        actionsRef.current?.resetMatch();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, startGame]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0d0906]">
      <ArenaCanvas
        gameState={gameState}
        heroClass={heroClass}
        roomId={roomId}
        mouseSensitivity={mouseSensitivity}
        aimAssistEnabled={aimAssistEnabled}
        isSandboxMode={isSandboxMode}
        onHUDUpdate={setTelemetry}
        onMatchEnd={handleMatchEnd}
        onKillFeed={handleKillFeed}
        onMultiplayerStatus={handleMultiplayerStatus}
        actionsRef={actionsRef}
      />

      {gameState === 'playing' && (
        <GameHUD
          telemetry={telemetry}
          heroClass={heroClass}
          muted={muted}
          dockCollapsed={dockCollapsed}
          mpConnected={mpStatus.connected}
          roomId={mpStatus.roomId}
          onlineCount={mpStatus.count}
          mouseSensitivity={mouseSensitivity}
          aimAssistEnabled={aimAssistEnabled}
          killFeed={killFeed}
          onTriggerAbility={(slot) => actionsRef.current?.triggerAbility(slot)}
          onTriggerDash={() => actionsRef.current?.triggerDash()}
          onSwapWeapon={(slot) => actionsRef.current?.swapWeapon(slot)}
          onTriggerReload={() => actionsRef.current?.triggerReload()}
          onTriggerInspect={() => actionsRef.current?.triggerInspect()}
          onTriggerForge={() => actionsRef.current?.triggerForge()}
          onUseHealthPotion={() => actionsRef.current?.useHealthPotion()}
          onUseShieldPotionOrDisguise={() => actionsRef.current?.useShieldPotionOrDisguise()}
          onTriggerPrayerOrDisassemble={() => actionsRef.current?.triggerPrayerOrDisassemble()}
          onTriggerDiveNow={() => actionsRef.current?.triggerDiveNow()}
          onSelectSkyDropPin={(x, z) => actionsRef.current?.setSkyDropPin(x, z)}
          onToggleScope={() => actionsRef.current?.toggleScope()}
          onFireQuickShot={() => actionsRef.current?.fireQuickShot()}
          onRequestMouseLock={() => actionsRef.current?.requestMouseLock()}
          onChangeSensitivity={setMouseSensitivity}
          onToggleAimAssist={() => setAimAssistEnabled((prev) => !prev)}
          onSelectClass={(cls) => setHeroClass(cls)}
          onToggleMute={() => {
            audioEngine.muted = !audioEngine.muted;
            setMuted(audioEngine.muted);
          }}
          onTogglePause={() => setGameState('paused')}
          onRestart={() => actionsRef.current?.resetMatch()}
          onToggleDock={() => setDockCollapsed((prev) => !prev)}
          onToggleSandboxZeroCooldown={() => actionsRef.current?.toggleSandboxZeroCooldown()}
          onTriggerSandboxMaxForge={() => actionsRef.current?.triggerSandboxMaxForge()}
          onTriggerSandboxSpawnBoss={() => actionsRef.current?.triggerSandboxSpawnBoss()}
          onTriggerSandboxSpawnChests={() => actionsRef.current?.triggerSandboxSpawnChests()}
          onTriggerSandboxFullRestore={() => actionsRef.current?.triggerSandboxFullRestore()}
        />
      )}

      <TitleAndModals
        gameState={gameState}
        heroClass={heroClass}
        roomId={roomId}
        onlineCount={mpStatus.count}
        mpConnected={mpStatus.connected}
        mouseSensitivity={mouseSensitivity}
        aimAssistEnabled={aimAssistEnabled}
        isSandboxMode={isSandboxMode}
        showroomWeapon={showroomWeapon}
        showroomForge={showroomForge}
        liveTelemetry={telemetry}
        endSnapshot={endSnapshot}
        onChangeSensitivity={setMouseSensitivity}
        onToggleAimAssist={() => setAimAssistEnabled((prev) => !prev)}
        onSelectClass={(cls) => setHeroClass(cls)}
        onSelectRoom={(r) => setRoomId(r)}
        onStartGame={(sandbox) => startGame(sandbox)}
        onResumeGame={() => setGameState('playing')}
        onRestartGame={() => startGame(isSandboxMode)}
        onReturnToTitle={() => {
          document.body.dataset.state = 'title';
          setGameState('title');
        }}
        onRotateShowroom={(deltaYaw) => actionsRef.current?.rotateShowroom(deltaYaw)}
        onSelectShowroomWeapon={(slot) => {
          setShowroomWeapon(slot);
          actionsRef.current?.setShowroomWeapon(slot);
        }}
        onSelectShowroomForge={(lv) => {
          setShowroomForge(lv);
          actionsRef.current?.setShowroomForge(lv);
        }}
        onTriggerShowroomPose={() => actionsRef.current?.triggerShowroomPose()}
      />
    </main>
  );
}
