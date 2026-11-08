import React from 'react';
import {
  HeroClassId,
  WeaponSlotId,
  HERO_CLASSES,
  GameStateMode,
  evaluateCombatMedals,
} from '../game/rules';
import { EndOfRunSnapshot, LiveHUDTelemetry } from './ArenaCanvas';
import { PWAInstallButton } from './PWAInstallModal';

interface TitleAndModalsProps {
  gameState: GameStateMode;
  heroClass: HeroClassId;
  roomId: string;
  onlineCount: number;
  mpConnected: boolean;
  mouseSensitivity: number;
  aimAssistEnabled: boolean;
  isSandboxMode: boolean;
  showroomWeapon: WeaponSlotId;
  showroomForge: number;
  liveTelemetry: LiveHUDTelemetry;
  endSnapshot: EndOfRunSnapshot | null;
  onChangeSensitivity: (val: number) => void;
  onToggleAimAssist: () => void;
  onSelectClass: (cls: HeroClassId) => void;
  onSelectRoom: (roomId: string) => void;
  onStartGame: (sandbox?: boolean) => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onReturnToTitle: () => void;
  onRotateShowroom: (deltaYaw: number) => void;
  onSelectShowroomWeapon: (slot: WeaponSlotId) => void;
  onSelectShowroomForge: (level: number) => void;
  onTriggerShowroomPose: () => void;
}

const ARENA_ROOMS = [
  { id: 'karnak-prime', label: 'Sanctum of Karnak (Prime)' },
  { id: 'luxor-obelisk', label: 'Luxor Obelisk Canyon' },
  { id: 'abu-simbel', label: 'Abu Simbel Sun Court' },
];

export const TitleAndModals: React.FC<TitleAndModalsProps> = ({
  gameState,
  heroClass,
  roomId,
  onlineCount,
  mpConnected,
  mouseSensitivity,
  aimAssistEnabled,
  showroomWeapon,
  showroomForge,
  liveTelemetry,
  endSnapshot,
  onChangeSensitivity,
  onToggleAimAssist,
  onSelectClass,
  onSelectRoom,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onReturnToTitle,
  onRotateShowroom,
  onSelectShowroomWeapon,
  onSelectShowroomForge,
  onTriggerShowroomPose,
}) => {
  if (gameState === 'playing') return null;

  const currentSpec = HERO_CLASSES[heroClass];

  if (gameState === 'title') {
    const previewWeapon = currentSpec.weapons[showroomWeapon];
    return (
      <div
        className="fixed inset-0 z-30 flex flex-col justify-between p-4 md:p-7 pointer-events-none select-none overflow-y-auto"
        style={{
          background:
            'linear-gradient(90deg, rgba(11, 8, 5, 0.90) 0%, rgba(11, 8, 5, 0.65) 45%, rgba(11, 8, 5, 0.0) 72%)',
        }}
      >
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 my-auto w-full">
          {/* Left Hero & Class Selection Panel */}
          <div className="max-w-2xl pointer-events-auto">
            <div className="mb-1.5">
              <svg
                viewBox="0 0 640 105"
                className="w-full max-w-[460px] h-auto"
                role="img"
                aria-label="Khepri: Ride Out Heroes Egyptian Reborn"
              >
                <path
                  d="M40 34 L215 34 L235 46 L60 46 Z M600 34 L425 34 L405 46 L580 46 Z"
                  fill="#d97706"
                  opacity="0.85"
                />
                <path
                  d="M65 52 L225 52 L240 61 L85 61 Z M575 52 L415 52 L400 61 L555 61 Z"
                  fill="#10b981"
                  opacity="0.75"
                />
                <circle cx="320" cy="46" r="24" fill="#140e09" stroke="#f59e0b" strokeWidth="3" />
                <circle cx="320" cy="46" r="13" fill="#f59e0b" />
                <line x1="320" y1="12" x2="320" y2="80" stroke="#fef08a" strokeWidth="2" />
                <line x1="286" y1="46" x2="354" y2="46" stroke="#fef08a" strokeWidth="2" />
                <text
                  x="320"
                  y="96"
                  textAnchor="middle"
                  fill="#fef3c7"
                  fontFamily="Cinzel, Georgia, serif"
                  fontWeight="800"
                  fontSize="20"
                  letterSpacing="4"
                >
                  RIDE OUT HEROES · EGYPTIAN REBORN
                </text>
              </svg>
            </div>

            <h1
              className="font-display text-2xl md:text-3xl font-bold text-amber-100 tracking-wide mb-1"
              style={{ textWrap: 'balance' }}
            >
              {currentSpec.name} · {currentSpec.title}
            </h1>
            <p className="text-xs md:text-sm text-amber-200/85 mb-3 leading-relaxed max-w-xl">
              Enter the <strong className="text-amber-300 font-semibold">100-Player Solar Battle Royale (طور 100 مقاتل)</strong>{' '}
              across an expanded 135m Egyptian sanctuary with a{' '}
              <strong className="text-orange-300 font-semibold">Shrinking Solar Sandstorm</strong>,{' '}
              <strong className="text-emerald-300 font-semibold">Dual Occupational Weapons ([1] & [2])</strong>,{' '}
              and <strong className="text-amber-200 font-semibold">5 Class Skills ([Q], [E], [C], [R], [V])</strong>.
            </p>

            {/* 9 Canonical Ride Out Heroes Class Roster */}
            <div className="mb-3">
              <div className="text-xs font-mono-num uppercase tracking-wider text-amber-400/90 mb-1.5">
                SELECT RIDE OUT HERO CLASS (9 CANONICAL CLASSES · 100-PLAYER ROYALE) · ACTIVE: {currentSpec.shortLabel}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(Object.keys(HERO_CLASSES) as HeroClassId[]).map((cid) => {
                  const c = HERO_CLASSES[cid];
                  const active = heroClass === cid;
                  return (
                    <button
                      key={cid}
                      type="button"
                      data-hero-class={cid}
                      onClick={() => onSelectClass(cid)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-md'
                          : 'bg-[#16100a]/90 border-amber-500/25 text-amber-200/75 hover:border-amber-500/60 hover:text-amber-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold whitespace-nowrap truncate">{c.name}</span>
                        {(cid === 'tesla' || cid === 'claudia' || cid === 'ragnar') && (
                          <span className="px-1 py-0.5 rounded bg-teal-500/30 border border-teal-400/70 text-[9px] font-mono-num text-teal-200">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-300/95 whitespace-nowrap truncate">
                        [1] {c.primaryWeapon}
                      </div>
                      <div className="text-[10px] text-amber-300/80 whitespace-nowrap truncate">
                        [2] {c.secondaryWeapon}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Class Occupational Weapons & 5 Unique Skills */}
            <div className="p-3 rounded-lg bg-[#16100a]/90 border border-amber-500/30 mb-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-300 font-mono-num mb-2 pb-1.5 border-b border-amber-500/20">
                <span>
                  OCCUPATIONAL WEAPONS: <strong className="text-emerald-300">[1] {currentSpec.primaryWeapon}</strong> ·{' '}
                  <strong className="text-sky-300">[2] {currentSpec.secondaryWeapon}</strong>
                </span>
                <span className="text-amber-200">
                  HP {currentSpec.maxHp} · SHIELD {currentSpec.maxShield}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                <div>
                  <span className="text-amber-400 font-mono-num font-bold">[Q] {currentSpec.abilities.q.name}:</span>{' '}
                  <span className="text-amber-100/85">{currentSpec.abilities.q.roleClue}</span>
                </div>
                <div>
                  <span className="text-amber-400 font-mono-num font-bold">[E] {currentSpec.abilities.e.name}:</span>{' '}
                  <span className="text-amber-100/85">{currentSpec.abilities.e.roleClue}</span>
                </div>
                <div>
                  <span className="text-amber-400 font-mono-num font-bold">[C] {currentSpec.abilities.c.name}:</span>{' '}
                  <span className="text-amber-100/85">{currentSpec.abilities.c.roleClue}</span>
                </div>
                <div>
                  <span className="text-amber-400 font-mono-num font-bold">[R] {currentSpec.abilities.r.name}:</span>{' '}
                  <span className="text-amber-100/85">{currentSpec.abilities.r.roleClue}</span>
                </div>
              </div>
            </div>

            {/* Primary Arena Match CTA, Free Sandbox Practice Mode CTA & Room Selector */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={() => onStartGame(false)}
                className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-sm md:text-base tracking-wider transition-colors shadow-lg cursor-pointer whitespace-nowrap"
              >
                Deploy Into 100-Player Royale
              </button>

              <button
                type="button"
                data-sandbox-start="true"
                onClick={() => onStartGame(true)}
                className="px-4 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/70 text-emerald-200 font-display font-bold text-xs md:text-sm tracking-wider transition-colors cursor-pointer whitespace-nowrap"
              >
                ✦ Sandbox Practice Mode
              </button>

              <PWAInstallButton />

              <div className="flex flex-col justify-center px-3 py-1.5 rounded-lg bg-[#16100a]/90 border border-amber-500/30">
                <label htmlFor="arena-room-select" className="text-[10px] font-mono-num text-amber-400/85 uppercase">
                  REAL-TIME ARENA REALM ({mpConnected ? `${onlineCount} ONLINE` : 'READY'})
                </label>
                <select
                  id="arena-room-select"
                  value={roomId}
                  onChange={(e) => onSelectRoom(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-amber-100 focus:outline-none cursor-pointer"
                >
                  {ARENA_ROOMS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#16100a] text-amber-100">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Interactive 3D Hero & Weapon Showroom Controls Panel */}
          <div className="pointer-events-auto w-full lg:w-[320px] p-3.5 rounded-xl bg-[#140e09]/90 border border-amber-500/35 self-end lg:self-center">
            <div className="flex items-center justify-between text-[11px] font-mono-num text-amber-400 font-bold uppercase tracking-wider mb-2">
              <span>3D HERO & WEAPON SHOWROOM</span>
              <span className="text-emerald-300">FORGE LV{showroomForge}</span>
            </div>

            <div className="text-xs font-bold text-amber-100 mb-0.5">
              [{showroomWeapon}] {previewWeapon.name}
            </div>
            <div className="text-[11px] text-amber-200/75 mb-2.5">
              {previewWeapon.roleClue} · Base DMG { Math.round(previewWeapon.baseDamage * (1 + showroomForge * 0.18)) }
            </div>

            {/* Weapon Slot [1] / [2] Switcher in Showroom */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {([1, 2] as const).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onSelectShowroomWeapon(slot)}
                  className={`px-2.5 py-1.5 rounded border text-xs font-mono-num text-left transition-colors ${
                    showroomWeapon === slot
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 font-bold'
                      : 'bg-[#1b130c] border-amber-500/25 text-amber-200/75 hover:border-amber-400/60'
                  }`}
                >
                  <div className="text-[10px] text-amber-400">SLOT [{slot}]</div>
                  <div className="truncate">{currentSpec.weapons[slot].name}</div>
                </button>
              ))}
            </div>

            {/* Sanctuary Forge Tier Preview (Lv0 - Lv3) */}
            <div className="text-[10px] font-mono-num text-amber-300/85 uppercase mb-1">
              PREVIEW SANCTUARY FORGE TIER GLOW:
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2.5">
              {[0, 1, 2, 3].map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => onSelectShowroomForge(lv)}
                  className={`py-1 rounded border text-[11px] font-mono-num font-bold transition-colors ${
                    showroomForge === lv
                      ? 'bg-emerald-500 text-stone-950 border-emerald-300'
                      : 'bg-[#1b130c] border-amber-500/25 text-amber-200 hover:border-amber-400'
                  }`}
                >
                  Lv{lv}
                </button>
              ))}
            </div>

            {/* 360° Turntable Rotation & Action Pose */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRotateShowroom(-0.55)}
                className="flex-1 py-1.5 rounded bg-[#1b130c] hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono-num text-amber-200"
              >
                ⟲ Rotate
              </button>
              <button
                type="button"
                onClick={() => onRotateShowroom(0)}
                className="flex-1 py-1.5 rounded bg-[#1b130c] hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono-num text-amber-200"
              >
                ⟳ Orbit
              </button>
              <button
                type="button"
                onClick={() => onRotateShowroom(0.55)}
                className="flex-1 py-1.5 rounded bg-[#1b130c] hover:bg-amber-500/20 border border-amber-500/30 text-xs font-mono-num text-amber-200"
              >
                Rotate ⟳
              </button>
              <button
                type="button"
                onClick={onTriggerShowroomPose}
                className="px-2.5 py-1.5 rounded bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/60 text-xs font-mono-num font-bold text-amber-200"
                title="Trigger Weapon Fire & Inspect Pose"
              >
                ✦ Pose
              </button>
            </div>
          </div>
        </div>

        {/* Single Flat Borderless Inline Control Hint Line in Bottom Safe Margin */}
        <div className="text-xs font-mono-num text-amber-200/80 tracking-wide">
          WASD Move · Space Sky-Dive/Jump · 1/2 Swap Weapons · Q / E / C / R Class Skills · Z/X Potions & Disguise · F Shrine Prayer/Relics · G Forge · V Mount
        </div>
      </div>
    );
  }

  // PAUSED MODAL ('paused') WITH LIVE MATCH ANALYTICS & MEDALS
  if (gameState === 'paused') {
    const stats = liveTelemetry.analytics || {
      shotsFired: 0,
      shotsHit: 0,
      maxSingleDamage: 0,
      bestStreak: 0,
      bossesDefeated: 0,
      chestsOpened: 0,
    };
    const brLive = liveTelemetry.battleRoyale;
    const accuracyPct =
      stats.shotsFired > 0 ? Math.min(100, Math.round((stats.shotsHit / stats.shotsFired) * 100)) : 0;
    const liveMedals = evaluateCombatMedals({
      kills: liveTelemetry.kills,
      headshots: liveTelemetry.headshots,
      shotsFired: stats.shotsFired,
      shotsHit: stats.shotsHit,
      maxSingleDamage: stats.maxSingleDamage,
      bestStreak: stats.bestStreak,
      bossesDefeated: stats.bossesDefeated,
      forgeLevel: liveTelemetry.forgeLevel,
      chestsOpened: stats.chestsOpened,
      placementRank: brLive?.playerRank,
    });

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/75 select-none overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="w-full max-w-lg p-6 rounded-xl border border-amber-500/45 bg-[#140e09] text-amber-100 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 id="pause-modal-title" className="font-display text-2xl font-bold text-amber-300">
              Sanctum Match Paused
            </h2>
            {brLive && (
              <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-400/60 text-xs font-mono-num font-bold text-amber-200">
                ALIVE {brLive.aliveCount}/{brLive.totalCount} · RANK #{brLive.playerRank}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-200/75 mb-3">
            Hero: {currentSpec.name} · Weapons: {currentSpec.primaryWeapon} & {currentSpec.secondaryWeapon}
          </p>

          {/* Live Match Analytics Grid */}
          <div className="grid grid-cols-4 gap-2 mb-3 font-mono-num text-center">
            <div className="p-2 rounded bg-[#1d140c] border border-amber-500/25">
              <div className="text-[9px] text-amber-400 uppercase">ACCURACY</div>
              <div className="text-base font-bold text-emerald-300">{accuracyPct}%</div>
              <div className="text-[9px] text-amber-200/60">
                {stats.shotsHit}/{stats.shotsFired}
              </div>
            </div>
            <div className="p-2 rounded bg-[#1d140c] border border-amber-500/25">
              <div className="text-[9px] text-amber-400 uppercase">MAX HIT</div>
              <div className="text-base font-bold text-amber-200">{stats.maxSingleDamage}</div>
              <div className="text-[9px] text-amber-200/60">DMG</div>
            </div>
            <div className="p-2 rounded bg-[#1d140c] border border-amber-500/25">
              <div className="text-[9px] text-amber-400 uppercase">STREAK</div>
              <div className="text-base font-bold text-amber-300">{stats.bestStreak}x</div>
              <div className="text-[9px] text-amber-200/60">BEST</div>
            </div>
            <div className="p-2 rounded bg-[#1d140c] border border-amber-500/25">
              <div className="text-[9px] text-amber-400 uppercase">RELIQUARIES</div>
              <div className="text-base font-bold text-emerald-300">{stats.chestsOpened}</div>
              <div className="text-[9px] text-amber-200/60">BOSS: {stats.bossesDefeated}</div>
            </div>
          </div>

          {/* Live Combat Medals */}
          {liveMedals.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {liveMedals.map((m) => (
                <div
                  key={m.id}
                  className="px-2.5 py-1.5 rounded border text-xs bg-amber-500/20 border-amber-400 text-amber-100"
                >
                  <div className="font-bold text-[11px] flex items-center justify-between">
                    <span>{m.title}</span>
                    <span>★</span>
                  </div>
                  <div className="text-[10px] opacity-80 truncate">{m.description}</div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#1d140c] border border-amber-500/25 mb-4 space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-xs font-mono-num text-amber-200 mb-1">
                <span>Mouse & Camera Sensitivity (حساسية الماوس)</span>
                <span className="text-amber-400 font-bold">{mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={mouseSensitivity}
                onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-stone-800 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-500/15">
              <span className="text-xs text-amber-200">
                Magnetic Crosshair Aim Lock (مساعد التصويب)
              </span>
              <button
                type="button"
                onClick={onToggleAimAssist}
                className={`px-3 py-1 rounded text-xs font-mono-num font-bold border transition-colors ${
                  aimAssistEnabled
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
              >
                {aimAssistEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onResumeGame}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Resume Combat [Esc / P]
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRestartGame}
                className="py-2.5 px-4 rounded-lg bg-[#21170f] hover:bg-[#2c1f14] border border-amber-500/35 text-amber-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                Restart Match
              </button>
              <button
                type="button"
                onClick={onReturnToTitle}
                className="py-2.5 px-4 rounded-lg bg-transparent hover:bg-white/5 border border-amber-500/20 text-amber-200/80 text-sm transition-colors cursor-pointer"
              >
                Title Screen
              </button>
            </div>
            <div className="pt-1 flex justify-center">
              <PWAInstallButton compact />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VICTORY OR DEFEAT MODAL ('gameover') WITH FULL ANALYTICS, 100-PLAYER PLACEMENT & MEDALS
  const isVictory = endSnapshot?.outcome === 'victory';
  const shotsFired = endSnapshot?.shotsFired ?? 0;
  const shotsHit = endSnapshot?.shotsHit ?? 0;
  const endAccuracyPct = shotsFired > 0 ? Math.min(100, Math.round((shotsHit / shotsFired) * 100)) : 0;
  const maxSingleDamage = endSnapshot?.maxSingleDamage ?? 0;
  const bestStreak = endSnapshot?.bestStreak ?? 0;
  const bossesDefeated = endSnapshot?.bossesDefeated ?? 0;
  const chestsOpened = endSnapshot?.chestsOpened ?? 0;
  const forgeLevel = endSnapshot?.forgeLevel ?? 0;
  const placementRank = endSnapshot?.placementRank ?? (isVictory ? 1 : 25);
  const totalCombatants = endSnapshot?.totalCombatants ?? 100;

  const endMedals = evaluateCombatMedals({
    kills: endSnapshot?.kills ?? 0,
    headshots: endSnapshot?.headshots ?? 0,
    shotsFired,
    shotsHit,
    maxSingleDamage,
    bestStreak,
    bossesDefeated,
    forgeLevel,
    chestsOpened,
    placementRank,
  });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/80 select-none overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameover-modal-title"
        className="w-full max-w-xl p-6 rounded-xl border border-amber-500/50 bg-[#140e09] text-amber-100 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-xs font-mono-num uppercase tracking-widest text-amber-400">
            {isVictory ? 'CROWN OF KARNAK CLAIMED · #1 / 100 ROYALE' : 'FALLEN IN THE SOLAR DUNES'}
          </div>
          <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-xs font-mono-num font-bold text-amber-200">
            RANK #{placementRank} / {totalCombatants}
          </span>
        </div>
        <h2
          id="gameover-modal-title"
          className={`font-display text-3xl font-bold mb-1.5 ${
            isVictory ? 'text-amber-300' : 'text-red-400'
          }`}
        >
          {isVictory ? 'Ascendant Outrider Victory Royale' : 'Dragon Revival Shattered'}
        </h2>
        <p className="text-xs text-amber-200/80 mb-4">
          {isVictory
            ? `Your mastery of ${currentSpec.name} (${currentSpec.primaryWeapon} & ${currentSpec.secondaryWeapon}) triumphed in the 100-Player Solar Battle Royale.`
            : `Eliminated at Rank #${placementRank}/${totalCombatants} before your Baby Dragon resurrection completed.`}
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-3 font-mono-num">
          <div className="p-2.5 rounded-lg bg-[#1d140c] border border-amber-500/25">
            <div className="text-[10px] text-amber-400/80 uppercase">ELIMINATIONS</div>
            <div className="text-2xl font-bold text-amber-100 mt-0.5">
              {endSnapshot?.kills ?? 0}
              <span className="text-xs text-amber-400/70">/{endSnapshot?.targetKills ?? 10}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#1d140c] border border-amber-500/25">
            <div className="text-[10px] text-emerald-300/80 uppercase">ACCURACY / CRITS</div>
            <div className="text-2xl font-bold text-emerald-300 mt-0.5">
              {endAccuracyPct}%
              <span className="text-xs text-emerald-200/70"> ({endSnapshot?.headshots ?? 0} Crits)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#1d140c] border border-amber-500/25">
            <div className="text-[10px] text-amber-400/80 uppercase">SCORE / BEST</div>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              {endSnapshot?.score ?? 0}
              <span className="text-xs text-amber-200/60"> / {endSnapshot?.bestScore ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4 font-mono-num text-center text-xs">
          <div className="p-2 rounded bg-[#18100a] border border-amber-500/20">
            <div className="text-[9px] text-amber-400/80">MAX SINGLE HIT</div>
            <div className="font-bold text-amber-200">{maxSingleDamage} DMG</div>
          </div>
          <div className="p-2 rounded bg-[#18100a] border border-amber-500/20">
            <div className="text-[9px] text-amber-400/80">BEST STREAK</div>
            <div className="font-bold text-amber-300">{bestStreak}x</div>
          </div>
          <div className="p-2 rounded bg-[#18100a] border border-amber-500/20">
            <div className="text-[9px] text-amber-400/80">PHARAOH BOSS</div>
            <div className="font-bold text-purple-300">{bossesDefeated} SLAIN</div>
          </div>
          <div className="p-2 rounded bg-[#18100a] border border-amber-500/20">
            <div className="text-[9px] text-amber-400/80">TOTAL DAMAGE</div>
            <div className="font-bold text-emerald-300">{endSnapshot?.damageDealt ?? 0}</div>
          </div>
        </div>

        {/* Unlocked Egyptian Combat Medals */}
        {endMedals.length > 0 && (
          <div className="mb-5">
            <div className="text-[10px] font-mono-num text-amber-400 uppercase tracking-wider mb-1.5">
              SANCTUARY COMBAT HONORS & MEDALS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {endMedals.map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded border text-xs bg-amber-500/20 border-amber-400 text-amber-100"
                >
                  <div className="font-bold text-[11px] flex items-center justify-between">
                    <span className="truncate">{m.title}</span>
                    <span>★</span>
                  </div>
                  <div className="text-[9px] opacity-80 truncate">{m.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onRestartGame}
            className="flex-1 py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-display font-bold text-sm tracking-wider transition-colors cursor-pointer"
          >
            {isVictory ? 'Play Again' : 'Try Again'}
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="py-3 px-5 rounded-lg bg-[#21170f] hover:bg-[#2c1f14] border border-amber-500/30 text-amber-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};
