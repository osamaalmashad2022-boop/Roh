import React, { useState, useEffect } from 'react';
import {
  HeroClassId,
  WeaponSlotId,
  AbilitySlotId,
  HERO_CLASSES,
  ARENA_PLATFORMS,
  ARMOR_TIER_SPECS,
  RELIC_CATALOG,
  SANCTUARY_SHRINES,
  formatPropDisguiseLabel,
} from '../game/rules';
import { LiveHUDTelemetry } from './ArenaCanvas';
import { SyncedKillFeedEvent } from '../game/multiplayer';

interface GameHUDProps {
  telemetry: LiveHUDTelemetry;
  heroClass: HeroClassId;
  muted: boolean;
  dockCollapsed: boolean;
  mpConnected: boolean;
  roomId: string;
  onlineCount: number;
  mouseSensitivity: number;
  aimAssistEnabled: boolean;
  killFeed: SyncedKillFeedEvent[];
  onTriggerAbility: (slot: AbilitySlotId) => void;
  onTriggerDash: () => void;
  onSwapWeapon: (slot?: WeaponSlotId) => void;
  onTriggerReload: () => void;
  onTriggerInspect: () => void;
  onTriggerForge: () => void;
  onUseHealthPotion: () => void;
  onUseShieldPotionOrDisguise: () => void;
  onTriggerPrayerOrDisassemble: () => void;
  onTriggerDiveNow: () => void;
  onSelectSkyDropPin: (x: number, z: number) => void;
  onToggleScope: () => void;
  onFireQuickShot: () => void;
  onRequestMouseLock: () => void;
  onChangeSensitivity: (val: number) => void;
  onToggleAimAssist: () => void;
  onSelectClass: (cls: HeroClassId) => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onToggleDock: () => void;
  onToggleSandboxZeroCooldown: () => void;
  onTriggerSandboxMaxForge: () => void;
  onTriggerSandboxSpawnBoss: () => void;
  onTriggerSandboxSpawnChests: () => void;
  onTriggerSandboxFullRestore: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  telemetry,
  heroClass,
  muted,
  dockCollapsed,
  roomId,
  mouseSensitivity,
  aimAssistEnabled,
  killFeed,
  onTriggerAbility,
  onTriggerDash,
  onSwapWeapon,
  onTriggerReload,
  onTriggerInspect,
  onTriggerForge,
  onUseHealthPotion,
  onUseShieldPotionOrDisguise,
  onTriggerPrayerOrDisassemble,
  onTriggerDiveNow,
  onSelectSkyDropPin,
  onToggleScope,
  onFireQuickShot,
  onRequestMouseLock,
  onChangeSensitivity,
  onToggleAimAssist,
  onSelectClass,
  onToggleMute,
  onTogglePause,
  onRestart,
  onToggleDock,
  onToggleSandboxZeroCooldown,
  onTriggerSandboxMaxForge,
  onTriggerSandboxSpawnBoss,
  onTriggerSandboxSpawnChests,
  onTriggerSandboxFullRestore,
}) => {
  const [radarFullMap, setRadarFullMap] = useState<boolean>(true);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('diag') === '1';
    }
    return false;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setShowDiagnostics((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const spec = HERO_CLASSES[heroClass];
  const activeWeapon = spec.weapons[telemetry.activeWeaponSlot || 1];
  const hpRatio = Math.max(0, Math.min(1, telemetry.hp / Math.max(1, telemetry.maxHp)));
  const ghostRatio = Math.max(hpRatio, Math.min(1, telemetry.ghostHp / Math.max(1, telemetry.maxHp)));
  const shieldRatio = Math.max(0, Math.min(1, telemetry.shield / Math.max(1, telemetry.maxShield)));

  const totalPips = 6;
  const exactPips = hpRatio * totalPips;
  const bossActive = Boolean(telemetry.bossStatus?.active);
  const bossHpRatio = bossActive
    ? Math.max(0, Math.min(1, (telemetry.bossStatus?.hp || 0) / Math.max(1, telemetry.bossStatus?.maxHp || 1)))
    : 0;
  const br = telemetry.battleRoyale || {
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
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 select-none overflow-hidden"
      aria-label="In-Game Tactical HUD"
    >
      {/* Low-HP or Outside Solar Storm Critical Peripheral Vignette */}
      {(hpRatio <= 0.3 || br.isOutsideStorm) && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            background: br.isOutsideStorm
              ? 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 45%, rgba(234, 88, 12, 0.45) 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 52%, rgba(185, 28, 28, 0.42) 100%)',
          }}
        />
      )}

      {/* Stealth Camouflage Shimmer Frame */}
      {telemetry.isCamouflaged && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 70px rgba(16, 185, 129, 0.38)',
          }}
        />
      )}

      {/* 3D World-to-Screen Floating Damage Numbers */}
      {telemetry.floatingDamages &&
        telemetry.floatingDamages.map((dmg) => (
          <div
            key={dmg.id}
            className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 flex flex-col items-center font-mono-num"
            style={{
              left: `${dmg.x}px`,
              top: `${dmg.y}px`,
              opacity: dmg.opacity,
            }}
          >
            {dmg.label && (
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-200 hud-stroke whitespace-nowrap">
                {dmg.label}
              </span>
            )}
            <span
              className={`font-extrabold leading-none hud-stroke ${
                dmg.isCrit ? 'text-2xl text-amber-300' : 'text-lg text-orange-200'
              }`}
            >
              {dmg.isCrit ? `✦ ${dmg.amount}` : `-${dmg.amount}`}
            </span>
          </div>
        ))}

      {/* 3D World-to-Screen Locked Target Weak-Point Diamond */}
      {telemetry.lockedTargetScreen && telemetry.lockedTargetScreen.visible && (
        <div
          className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${telemetry.lockedTargetScreen.x}px`,
            top: `${telemetry.lockedTargetScreen.y}px`,
          }}
        >
          <svg viewBox="0 0 36 36" className="w-8 h-8" aria-hidden="true">
            <polygon
              points="18,3 33,18 18,33 3,18"
              fill="none"
              stroke="#facc15"
              strokeWidth="2.2"
            />
            <circle cx="18" cy="18" r="3" fill="#ef4444" />
          </svg>
        </div>
      )}

      {/* TOP-CENTER: 100-Player Solar Battle Royale Tracker, Shrinking Storm Bar, Pharaoh Boss & Killstreak */}
      <div className="fixed top-3 left-[43%] -translate-x-1/2 flex flex-col items-center gap-1.5 z-20 pointer-events-none">
        <div
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2.5 font-mono-num whitespace-nowrap ${
            br.isOutsideStorm
              ? 'border-red-400 bg-[#2a0c08]/95'
              : 'border-amber-500/50 bg-[#140d08]/90'
          }`}
          style={{ boxShadow: '0 6px 20px rgba(0, 0, 0, 0.7)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              ALIVE (الأحياء)
            </span>
            <span
              data-testid="hud-alive-counter"
              className="text-base font-extrabold text-amber-100 hud-stroke"
            >
              {br.aliveCount}
              <span className="text-xs text-amber-300/75">/{br.totalCount}</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-amber-500/30" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wider text-emerald-300/90">RANK</span>
            <span className="text-sm font-bold text-emerald-300">#{br.playerRank}</span>
          </div>
          <div className="h-4 w-[1px] bg-amber-500/30" />
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-bold ${
                br.isOutsideStorm
                  ? 'text-red-300'
                  : br.stormIsShrinking
                  ? 'text-orange-300'
                  : 'text-amber-300'
              }`}
            >
              {br.isOutsideStorm
                ? `⚠️ STORM -${br.stormDamagePerSec}HP/s`
                : br.stormIsShrinking
                ? `🌪 STORM SHRINKING P${br.stormPhase}`
                : `☀ SAFE ZONE P${br.stormPhase}`}
            </span>
            <span className="text-amber-100/90">
              {Math.round(br.stormRadius)}m → {br.stormTargetRadius}m ({Math.ceil(br.stormTimer)}s)
            </span>
          </div>
        </div>

        {/* Aerial Sky-Drop & Wing Gliding Interactive Banner + Hot-Drop Zone Selector */}
        {telemetry.isGliding && (
          <div
            data-testid="hud-sky-drop-banner"
            className="px-3 py-1.5 rounded-lg border border-amber-400 bg-[#1a1107]/95 flex flex-wrap items-center justify-center gap-2 font-mono-num pointer-events-auto shadow-lg"
            data-hud-interactive="true"
          >
            <span className="text-xs font-bold text-amber-300">
              🦅 SKY-DROP · ALT {telemetry.glidingAltitude ?? 18}m
              {telemetry.skyDropPin?.active
                ? ` · 📍 PIN (${Math.round(telemetry.skyDropPin.x)}, ${Math.round(telemetry.skyDropPin.z)})`
                : ' · CLICK MINIMAP TO PIN'}
            </span>
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-drop-center"
              onClick={(e) => {
                e.currentTarget.blur();
                onSelectSkyDropPin(0, 0);
              }}
              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/60 text-amber-200 text-[10px] font-bold transition-colors cursor-pointer"
            >
              📍 Center Forge
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-drop-shrine"
              onClick={(e) => {
                e.currentTarget.blur();
                const shrine = SANCTUARY_SHRINES[0];
                onSelectSkyDropPin(shrine.x, shrine.z);
              }}
              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/60 text-emerald-200 text-[10px] font-bold transition-colors cursor-pointer"
            >
              ⛩️ North Shrine
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="btn-dive-now"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerDiveNow();
              }}
              className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold transition-colors cursor-pointer"
            >
              ⚡ Dive Now [Space]
            </button>
          </div>
        )}

        {/* Interactive Sanctuary Prayer Shrine Proximity Prompt */}
        {telemetry.nearbyShrineName && !telemetry.isDownedScarab && (
          <div
            data-testid="hud-shrine-proximity"
            className="px-3.5 py-1 rounded-lg border border-emerald-400 bg-[#0d1f17]/95 flex items-center gap-2.5 font-mono-num pointer-events-auto shadow-lg"
            data-hud-interactive="true"
          >
            <span className="text-xs font-bold text-emerald-300">
              ⛩️ NEAR {telemetry.nearbyShrineName.toUpperCase()} · DISCOUNTED BLESSING (25g)
            </span>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerPrayerOrDisassemble();
              }}
              className="px-2.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Pray & Upgrade [F]
            </button>
          </div>
        )}

        {bossActive && telemetry.bossStatus && (
          <div
            className="w-[340px] sm:w-[420px] px-4 py-2 rounded-lg border border-amber-400/75"
            style={{
              background: 'rgba(18, 10, 6, 0.92)',
              boxShadow: '0 8px 28px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-mono-num mb-1">
              <span className="text-amber-300 font-bold tracking-wider uppercase">
                👑 {telemetry.bossStatus.name}
              </span>
              <span className="text-amber-100 font-bold">
                {telemetry.bossStatus.hp}/{telemetry.bossStatus.maxHp} HP
              </span>
            </div>
            <div className="relative h-2.5 w-full bg-[#0a0604] rounded overflow-hidden border border-amber-500/40">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-300 transition-all duration-150"
                style={{ width: `${bossHpRatio * 100}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono-num text-amber-200/80">
              <span>MID-MATCH WORLD BOSS EVENT</span>
              <span className="text-emerald-300">REWARD: +65 SHARDS & FREE FORGE TIER</span>
            </div>
          </div>
        )}

        {telemetry.killstreak && telemetry.killstreak.count >= 2 && telemetry.killstreak.title && (
          <div className="px-4 py-1.5 rounded-lg border border-amber-400/80 bg-[#180d06]/95 text-center shadow-lg">
            <div className="text-xs font-display font-extrabold tracking-widest text-amber-300 uppercase hud-stroke">
              🔥 {telemetry.killstreak.title} · {telemetry.killstreak.count}x STREAK
            </div>
            <div className="text-[10px] font-mono-num text-emerald-300">
              {telemetry.killstreak.arabicTitle} ({telemetry.killstreak.timer.toFixed(1)}s)
            </div>
          </div>
        )}
      </div>

      {/* Steady Aim Sniper Scope Overlay */}
      {telemetry.isScoped && (
        <div
          className="fixed inset-0 pointer-events-none flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 35%, rgba(9, 6, 4, 0.72) 78%, rgba(9, 6, 4, 0.94) 100%)',
          }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-[360px] h-[360px] opacity-90"
            aria-hidden="true"
          >
            <circle
              cx="200"
              cy="200"
              r="165"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="12 6"
            />
            <circle cx="200" cy="200" r="115" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.7" />
            <line x1="20" y1="200" x2="170" y2="200" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="230" y1="200" x2="380" y2="200" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="200" y1="20" x2="200" y2="170" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="200" y1="230" x2="200" y2="380" stroke="#f59e0b" strokeWidth="1.5" />
            <line x1="192" y1="225" x2="208" y2="225" stroke="#10b981" strokeWidth="1.5" />
            <line x1="188" y1="250" x2="212" y2="250" stroke="#10b981" strokeWidth="1.5" />
            <line x1="184" y1="275" x2="216" y2="275" stroke="#10b981" strokeWidth="1.5" />
          </svg>
          <div className="fixed top-[22%] left-1/2 -translate-x-1/2 text-xs font-mono-num tracking-widest text-amber-300 hud-stroke">
            STEADY AIM · {activeWeapon.name.toUpperCase()} · 2.5x WEAK-POINT CRIT ACTIVE
          </div>
        </div>
      )}

      {/* Exact (0, 0) Center Crosshair, Directional Hit Arcs & Bow Draw Charge Ring */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
        {/* Directional Incoming Damage Indicator Arcs around Crosshair */}
        {telemetry.hitArcs &&
          telemetry.hitArcs.map((arc) => (
            <div
              key={arc.id}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none"
              style={{
                transform: `translate(-50%, -50%) rotate(${arc.angleDeg}deg)`,
                opacity: arc.opacity,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
                <path
                  d="M 28 14 A 42 42 0 0 1 72 14"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}

        <svg viewBox="0 0 64 64" className="w-14 h-14" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r="22"
            fill="none"
            stroke="rgba(15, 11, 7, 0.75)"
            strokeWidth="3.5"
          />
          <circle
            cx="32"
            cy="32"
            r="22"
            fill="none"
            stroke={telemetry.drawCharge >= 0.65 ? '#facc15' : '#10b981'}
            strokeWidth="2.5"
            strokeDasharray={138.2}
            strokeDashoffset={138.2 * (1 - telemetry.drawCharge)}
            transform="rotate(-90 32 32)"
          />
          <path
            d="M32 14 L32 22 M32 42 L32 50 M14 32 L22 32 M42 32 L50 32"
            stroke={telemetry.lockedTargetName ? '#facc15' : '#fef08a'}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="32"
            cy="32"
            r={telemetry.isScoped ? 2.2 : 3}
            fill={telemetry.lockedTargetName ? '#ef4444' : telemetry.isCamouflaged ? '#10b981' : '#f59e0b'}
          />
        </svg>

        {telemetry.lockedTargetName && (
          <div className="mt-1 px-2.5 py-0.5 bg-[#120d08]/90 border border-amber-400/60 rounded text-[11px] font-mono-num text-amber-200 whitespace-nowrap">
            TARGET LOCK: {telemetry.lockedTargetName} · {Math.round(telemetry.lockedTargetHpRatio * 100)}% HP
          </div>
        )}

        {telemetry.lastHitBanner && (
          <div
            key={telemetry.lastHitBanner.id}
            className={`mt-2 px-3 py-1 rounded text-xs font-bold tracking-wider whitespace-nowrap hud-stroke ${
              telemetry.lastHitBanner.isCrit ? 'text-amber-300 text-sm' : 'text-emerald-300'
            }`}
          >
            {telemetry.lastHitBanner.text}
          </div>
        )}
      </div>

      {/* TOP-LEFT PERIMETER CLUSTER: Vitality Pips, Shield, Active Weapon, & Baby Dragon Revival Status */}
      <div className="fixed top-4 left-4 flex flex-col gap-2 max-w-[355px]">
        <div
          className="p-3 rounded-lg border border-amber-500/35"
          style={{
            background: 'rgba(16, 11, 7, 0.88)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div className="flex items-center justify-between gap-4 mb-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                {spec.name} {telemetry.isSandboxMode ? '· SANDBOX' : ''}
              </div>
              <div className="text-xs text-amber-100/85">
                {telemetry.isDownedScarab
                  ? telemetry.isPropDisguised
                    ? `PROP DISGUISE (${formatPropDisguiseLabel(telemetry.propDisguiseKind || 'amphora')}) · ${telemetry.scarabRemaining.toFixed(1)}s`
                    : `BABY DRAGON REVIVE · ${telemetry.scarabRemaining.toFixed(1)}s ([Q] Disguise)`
                  : telemetry.isCamouflaged
                  ? `${spec.abilities.q.name.toUpperCase()} · ${telemetry.camouflageRemaining.toFixed(1)}s`
                  : telemetry.isMounted
                  ? 'DESERT RAPTOR MOUNT (+60% SPD)'
                  : telemetry.isHighGround
                  ? `HIGH GROUND · ${telemetry.perchName || 'Vantage'} (+20% DMG)`
                  : `SLOT [${activeWeapon.slot}] ${activeWeapon.name}${
                      telemetry.forgeLevel > 0 ? ` +${telemetry.forgeLevel}` : ''
                    }`}
              </div>
            </div>
            <div className="text-right font-mono-num">
              <div className="text-[10px] uppercase tracking-wider text-amber-400/80">VITALITY</div>
              <div className="text-xl font-bold text-amber-100 leading-none hud-stroke">
                {telemetry.hp}
                <span className="text-xs text-amber-300/70">/{telemetry.maxHp}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-2" aria-label="Vitality Sockets">
            {Array.from({ length: totalPips }, (_, i) => {
              const state: 'full' | 'cracked' | 'empty' =
                exactPips >= i + 0.85 ? 'full' : exactPips >= i + 0.25 ? 'cracked' : 'empty';
              return (
                <svg key={i} viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                  <polygon
                    points="12,2 22,12 12,22 2,12"
                    fill="#140e09"
                    stroke="#78350f"
                    strokeWidth="2"
                  />
                  {state === 'full' && (
                    <>
                      <polygon points="12,4 20,12 12,20 4,12" fill="#f59e0b" />
                      <polygon points="12,5 17,12 12,12 7,12" fill="#fef08a" opacity="0.65" />
                    </>
                  )}
                  {state === 'cracked' && (
                    <>
                      <polygon points="12,4 20,12 12,20 4,12" fill="#d97706" opacity="0.7" />
                      <path d="M8 9 L13 12 L10 16" stroke="#140e09" strokeWidth="2" fill="none" />
                    </>
                  )}
                </svg>
              );
            })}
          </div>

          <div className="relative h-2.5 w-full bg-[#0a0705] rounded overflow-hidden border border-amber-900/50 mb-1.5">
            <div
              className="absolute inset-y-0 left-0 bg-red-500/70 transition-all duration-150"
              style={{ width: `${ghostRatio * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-amber-500"
              style={{ width: `${hpRatio * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono-num text-sky-300 mb-1">
            <span>SOLAR AEGIS SHIELD</span>
            <span>
              {telemetry.shield}/{telemetry.maxShield}
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-[#0a0705] rounded overflow-hidden border border-sky-900/50">
            <div
              className="absolute inset-y-0 left-0 bg-sky-400"
              style={{ width: `${shieldRatio * 100}%` }}
            />
          </div>

          <div className="mt-2 pt-1.5 border-t border-amber-500/20 flex items-center justify-between gap-2 text-[11px] font-mono-num">
            <span
              data-testid="hud-armor-badge"
              className="font-bold whitespace-nowrap"
              style={{ color: ARMOR_TIER_SPECS[telemetry.armorTier || 1].color }}
            >
              🛡️ {ARMOR_TIER_SPECS[telemetry.armorTier || 1].name} (-
              {Math.round(ARMOR_TIER_SPECS[telemetry.armorTier || 1].damageReductionRatio * 100)}%)
            </span>
            <span
              className={
                telemetry.relicReady
                  ? 'text-emerald-400 font-semibold whitespace-nowrap'
                  : 'text-amber-400 whitespace-nowrap'
              }
            >
              {telemetry.isDownedScarab
                ? `REVIVING ${telemetry.scarabRemaining.toFixed(1)}s (${(telemetry.propDisguiseKind || 'none').toUpperCase()})`
                : telemetry.teslaTurretActive
                ? `⚡ TURRET ${(telemetry.teslaTurretRemaining ?? 0).toFixed(1)}s`
                : telemetry.relicReady
                ? 'DRAGON READY'
                : `RECHARGING ${Math.ceil(telemetry.relicCooldown)}s`}
            </span>
          </div>

          {/* 6-Slot Ride Out Heroes Passive Relics Bar */}
          <div
            data-testid="hud-relics-bar"
            className="mt-1.5 pt-1.5 border-t border-amber-500/20 flex items-center justify-between gap-1 text-[10px] font-mono-num"
          >
            <span className="text-amber-300/80 uppercase font-bold">
              RELICS ({(telemetry.relics || ['sacred_ibis']).length}/6):
            </span>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {(telemetry.relics || ['sacred_ibis']).map((rid) => {
                const rSpec = RELIC_CATALOG[rid];
                if (!rSpec) return null;
                return (
                  <span
                    key={rid}
                    title={`${rSpec.name}: ${rSpec.description}`}
                    className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-200 whitespace-nowrap"
                  >
                    ✦ {rSpec.shortTag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Compact Live Loot, Relic & Armor Upgrade Feed */}
          {telemetry.lootFeed && telemetry.lootFeed.length > 0 && (
            <div
              data-testid="hud-loot-feed"
              className="mt-1.5 pt-1.5 border-t border-amber-500/20 flex flex-col gap-0.5 text-[10px] font-mono-num"
            >
              {telemetry.lootFeed.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-1 truncate"
                  style={{ color: item.color }}
                >
                  <span className="truncate font-semibold">▸ {item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Engine Self-Diagnostic Profiler (فحص الأداء والذاكرة اللحظي [F3]) */}
        {showDiagnostics && telemetry.diagnostics && (
          <div
            data-testid="hud-engine-diagnostics"
            className="p-2.5 rounded-lg border border-emerald-400/45 font-mono-num text-[10px] flex flex-col gap-1"
            style={{
              background: 'rgba(12, 16, 12, 0.92)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.65)',
            }}
          >
            <div className="flex items-center justify-between border-b border-emerald-500/25 pb-1">
              <span className="font-bold text-emerald-300 uppercase tracking-wider">
                ⚡ ENGINE DIAGNOSTICS (فحص المحرك)
              </span>
              <span
                className={`font-bold ${
                  telemetry.diagnostics.memoryHealthStatus === 'OPTIMAL'
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}
              >
                {telemetry.diagnostics.memoryHealthStatus} · 0 LEAKS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-amber-100/90 whitespace-nowrap">
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">FPS:</span>
                <span className="font-bold text-emerald-300">
                  {telemetry.diagnostics.fps} ({telemetry.diagnostics.frameTimeMs}ms)
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">STABILITY:</span>
                <span className="font-bold text-emerald-300">
                  {telemetry.diagnostics.frameStabilityPct ?? 99}% ({telemetry.diagnostics.adaptiveQualityScale ?? 1}x)
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">DRAW CALLS:</span>
                <span className="font-bold text-amber-200">{telemetry.diagnostics.drawCalls}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">TRIANGLES:</span>
                <span className="font-bold text-amber-200">{telemetry.diagnostics.triangles}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">GEO / TEX:</span>
                <span className="font-bold text-amber-200">
                  {telemetry.diagnostics.geometries}/{telemetry.diagnostics.textures}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">SPATIAL GRID:</span>
                <span className="font-bold text-emerald-300">
                  {telemetry.diagnostics.spatialGridCells ?? 0} Cells O(1)
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">LOD 0 NEAR:</span>
                <span className="font-bold text-emerald-300">
                  {telemetry.diagnostics.lodNearRigCount} Rigs (60Hz)
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-amber-300/75">LOD 1 INST:</span>
                <span className="font-bold text-sky-300">
                  {telemetry.diagnostics.lodInstancedCount} Crowd (20Hz)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Free Sandbox Practice Toolbar (Unlimited Testing Controls) */}
        {telemetry.isSandboxMode && (
          <div
            className="p-2.5 rounded-lg border border-emerald-400/50 pointer-events-auto flex flex-col gap-1.5"
            data-hud-interactive="true"
            style={{ background: 'rgba(12, 22, 16, 0.90)' }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono-num text-emerald-300 font-bold uppercase tracking-wider">
              <span>✦ FREE SANDBOX PRACTICE</span>
              <span>UNLIMITED SHARDS</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleSandboxZeroCooldown();
                }}
                className={`px-2 py-1 rounded text-[10px] font-mono-num font-bold border transition-colors ${
                  telemetry.sandboxZeroCooldown
                    ? 'bg-emerald-500 text-stone-950 border-emerald-300'
                    : 'bg-[#101c14] text-emerald-200 border-emerald-500/40 hover:border-emerald-300'
                }`}
              >
                {telemetry.sandboxZeroCooldown ? '⚡ Zero CD: ON' : '⚡ Zero CD: OFF'}
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerSandboxMaxForge();
                }}
                className="px-2 py-1 rounded text-[10px] font-mono-num font-bold bg-amber-500/20 text-amber-200 border border-amber-400/50 hover:bg-amber-500/30 transition-colors"
              >
                ⚒ Max Forge Lv3
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerSandboxSpawnBoss();
                }}
                className="px-2 py-1 rounded text-[10px] font-mono-num font-bold bg-purple-500/20 text-purple-200 border border-purple-400/50 hover:bg-purple-500/30 transition-colors"
              >
                👑 Spawn Boss [B]
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerSandboxSpawnChests();
                }}
                className="px-2 py-1 rounded text-[10px] font-mono-num font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 hover:bg-emerald-500/30 transition-colors"
              >
                💎 Respawn Chests
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerSandboxFullRestore();
                }}
                className="px-2 py-1 rounded text-[10px] font-mono-num font-bold bg-sky-500/20 text-sky-200 border border-sky-400/50 hover:bg-sky-500/30 transition-colors"
              >
                ✚ Full Restore
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOP-RIGHT PERIMETER CLUSTER: Match Scoreboard, Sanctuary Forge, Controls Quick-Tuner, & Minimap */}
      <div className="fixed top-3 right-4 flex flex-col items-end gap-2">
        <div className="flex items-start gap-2">
          <div
            className="px-3 py-1.5 rounded-lg border border-amber-500/35 flex items-center gap-3"
            style={{
              background: 'rgba(16, 11, 7, 0.88)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
            }}
          >
            <div className="text-center font-mono-num">
              <div className="text-[9px] uppercase tracking-wider text-amber-400/80">KILLS</div>
              <div className="text-lg font-bold text-amber-100 leading-none mt-0.5 hud-stroke">
                {telemetry.kills}
                <span className="text-xs text-amber-400/70">/{telemetry.targetKills}</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-amber-500/25" />
            <div className="text-center font-mono-num">
              <div className="text-[9px] uppercase tracking-wider text-emerald-300/80">SHARDS</div>
              <div className="text-lg font-bold text-emerald-300 leading-none mt-0.5 hud-stroke">
                {telemetry.magicShards}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-amber-500/25" />
            <div className="text-center font-mono-num">
              <div className="text-[9px] uppercase tracking-wider text-yellow-300/85">GOLD</div>
              <div
                data-testid="hud-gold-coins"
                className="text-lg font-bold text-yellow-300 leading-none mt-0.5 hud-stroke"
              >
                {telemetry.goldCoins ?? 60}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-amber-500/25" />
            <div className="text-center font-mono-num">
              <div className="text-[9px] uppercase tracking-wider text-amber-400/80">SCORE</div>
              <div className="text-lg font-bold text-amber-300 leading-none mt-0.5 hud-stroke">
                {telemetry.score}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto" data-hud-interactive="true">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Inspect 3D Weapon [I]"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerInspect();
              }}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                telemetry.isInspectingWeapon
                  ? 'bg-emerald-500 text-stone-950 border-emerald-300'
                  : 'bg-[#120d08]/90 text-amber-200 border-amber-500/35 hover:border-amber-400'
              }`}
              title="3D Close-Up Weapon Inspect [I]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Toggle Steady Aim Sniper Scope"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleScope();
              }}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                telemetry.isScoped
                  ? 'bg-amber-500 text-stone-950 border-amber-300'
                  : 'bg-[#120d08]/90 text-amber-200 border-amber-500/35 hover:border-amber-400'
              }`}
              title="Toggle Steady Aim Sniper Scope [Right-Click / Z]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-10 h-10 rounded-lg border border-amber-500/35 bg-[#120d08]/90 text-amber-200 hover:border-amber-400 flex items-center justify-center transition-colors"
              title="Mute / Unmute [M]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {muted ? (
                  <line x1="23" y1="9" x2="17" y2="15" />
                ) : (
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause & Controls Settings"
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              className="w-10 h-10 rounded-lg border border-amber-500/35 bg-[#120d08]/90 text-amber-200 hover:border-amber-400 flex items-center justify-center transition-colors"
              title="Pause & Match Analytics [P / Esc]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart Match"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-10 h-10 rounded-lg border border-amber-500/35 bg-[#120d08]/90 text-amber-200 hover:border-amber-400 flex items-center justify-center transition-colors"
              title="Restart Match [Backspace]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        </div>

        {/* 100-Player Radar Minimap (with Shrinking Solar Storm Ring & Zoom Toggle) + Live Controls */}
        <div
          className="p-2.5 rounded-lg border border-amber-500/30 flex items-center gap-3 pointer-events-auto"
          data-hud-interactive="true"
          style={{ background: 'rgba(16, 11, 7, 0.88)' }}
        >
          <svg
            data-testid="hud-radar-minimap"
            viewBox={radarFullMap ? '-140 -140 280 280' : '-68 -68 136 136'}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0) return;
              const span = radarFullMap ? 280 : 136;
              const half = span / 2;
              const wx = ((e.clientX - rect.left) / rect.width) * span - half;
              const wz = ((e.clientY - rect.top) / rect.height) * span - half;
              onSelectSkyDropPin(wx, wz);
            }}
            aria-label="Click on Minimap to Set Sky-Drop Landing Pin"
            className="w-24 h-24 rounded bg-[#0a0705] border border-amber-500/25 shrink-0 cursor-pointer hover:border-amber-400 transition-colors"
          >
            {/* Outer Arena Perimeter */}
            <circle cx="0" cy="0" r="135" fill="none" stroke="#451a03" strokeWidth="2" />
            {/* Next Safe Zone Target Circle */}
            <circle
              cx="0"
              cy="0"
              r={br.stormTargetRadius}
              fill="none"
              stroke="#fef08a"
              strokeWidth={radarFullMap ? '1.8' : '1.2'}
              strokeDasharray="6 4"
              opacity="0.7"
            />
            {/* Current Shrinking Solar Sandstorm Circle */}
            <circle
              cx="0"
              cy="0"
              r={br.stormRadius}
              fill="rgba(249, 115, 22, 0.05)"
              stroke="#f97316"
              strokeWidth={radarFullMap ? '2.8' : '1.8'}
            />
            {ARENA_PLATFORMS.map((pl) => (
              <circle
                key={pl.id}
                cx={pl.x}
                cy={pl.z}
                r={pl.radius}
                fill={pl.type === 'sniper_perch' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.22)'}
                stroke={pl.type === 'sniper_perch' ? '#10b981' : '#f59e0b'}
                strokeWidth="1"
              />
            ))}
            {telemetry.skyDropPin?.active && (() => {
              const pActor = telemetry.minimapActors.find((a) => a.kind === 'player');
              if (!pActor) return null;
              return (
                <line
                  x1={pActor.x}
                  y1={pActor.z}
                  x2={telemetry.skyDropPin.x}
                  y2={telemetry.skyDropPin.z}
                  stroke="#facc15"
                  strokeWidth={radarFullMap ? '2.2' : '1.5'}
                  strokeDasharray="5 3"
                />
              );
            })()}
            {telemetry.minimapActors.map((a, idx) => (
              <circle
                key={idx}
                cx={a.x}
                cy={a.z}
                r={
                  a.kind === 'boss'
                    ? radarFullMap
                      ? 7.5
                      : 5.2
                    : a.kind === 'drop_pin'
                    ? radarFullMap
                      ? 7.0
                      : 5.0
                    : a.kind === 'player'
                    ? radarFullMap
                      ? 6.2
                      : 4.2
                    : a.kind === 'shrine' || a.kind === 'turret'
                    ? radarFullMap
                      ? 5.2
                      : 3.8
                    : a.kind === 'chest'
                    ? radarFullMap
                      ? 4.8
                      : 3.5
                    : radarFullMap
                    ? 3.2
                    : 2.6
                }
                fill={
                  a.kind === 'player'
                    ? '#facc15'
                    : a.kind === 'drop_pin'
                    ? '#fef08a'
                    : a.kind === 'boss'
                    ? '#c084fc'
                    : a.kind === 'shrine'
                    ? '#2dd4bf'
                    : a.kind === 'turret'
                    ? '#38bdf8'
                    : a.kind === 'chest'
                    ? '#10b981'
                    : a.kind === 'remote'
                    ? '#38bdf8'
                    : '#ef4444'
                }
                stroke={a.kind === 'drop_pin' ? '#f97316' : 'none'}
                strokeWidth={a.kind === 'drop_pin' ? '2.2' : '0'}
              />
            ))}
          </svg>

          <div className="text-[11px] font-mono-num flex flex-col gap-1 min-w-[168px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-amber-300 font-semibold uppercase">{roomId}</span>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setRadarFullMap((prev) => !prev);
                }}
                className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-[9px] text-amber-200 hover:bg-amber-500/30 transition-colors"
                title="Toggle 100-Player Radar Zoom"
              >
                {radarFullMap ? '135m MAP' : '65m ZOOM'}
              </button>
            </div>

            <label className="flex items-center justify-between gap-2 text-[10px] text-amber-200/85">
              <span>SENSITIVITY</span>
              <span className="text-amber-300">{mouseSensitivity.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              aria-label="Mouse Sensitivity"
              min="0.3"
              max="2.5"
              step="0.1"
              value={mouseSensitivity}
              onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded cursor-pointer"
            />

            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleAimAssist();
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                  aimAssistEnabled
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                    : 'bg-stone-900 border-stone-700 text-stone-400'
                }`}
              >
                {aimAssistEnabled ? 'AIM LOCK: ON' : 'AIM LOCK: OFF'}
              </button>

              {!telemetry.isPointerLocked && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRequestMouseLock();
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 border border-amber-400/60 text-amber-200 hover:bg-amber-500/30 transition-colors"
                >
                  360° LOCK
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Contenders Leaderboard (أفضل المتصدرين من 100) */}
        {br.topContenders && br.topContenders.length > 0 && (
          <div
            data-testid="hud-top-contenders"
            className="w-[295px] px-2.5 py-2 rounded-lg border border-amber-500/30 font-mono-num"
            style={{ background: 'rgba(16, 11, 7, 0.86)' }}
          >
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-amber-400 font-bold mb-1">
              <span>🏆 TOP CONTENDERS (أفضل المتصدرين)</span>
              <span className="text-emerald-300">LOD 60FPS</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {br.topContenders.slice(0, 4).map((c, idx) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded ${
                    c.isPlayer
                      ? 'bg-amber-500/20 text-amber-200 font-bold'
                      : 'text-amber-100/85'
                  }`}
                >
                  <span className="truncate max-w-[180px]">
                    #{idx + 1} {c.name}
                  </span>
                  <span className={c.kills > 0 ? 'text-emerald-300 font-bold' : 'text-amber-300/70'}>
                    {c.kills} KILLS
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live 100-Player Kill Feed */}
        {killFeed.length > 0 && (
          <div className="flex flex-col items-end gap-1 mt-0.5">
            {killFeed.slice(-3).map((k) => (
              <div
                key={k.id}
                className="px-2.5 py-1 rounded bg-[#120d08]/85 text-[11px] text-amber-100 font-mono-num"
              >
                <span className="text-amber-400 font-semibold">{k.killerName}</span>
                <span className="mx-1.5 text-amber-500/70">·</span>
                <span className="text-emerald-300">{k.weaponTag}</span>
                {k.isHeadshot && <span className="ml-1 text-amber-300">(CRIT)</span>}
                <span className="mx-1.5 text-amber-500/70">→</span>
                <span className="text-red-300">{k.victimName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM TACTICAL DOCK (6 Heroes + Dual Occupational Weapons + Reload/Inspect + 5 Unique Skills + Forge) */}
      <div
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-auto max-w-[99vw]"
        data-hud-interactive="true"
      >
        <div className="flex items-center gap-1.5 mb-1 flex-wrap justify-center">
          {/* Instant Hero Class Switcher Bar so player can test RANGER & all 6 Ride Out Heroes live */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#140e09]/95 border border-amber-500/35">
            <span className="text-[10px] font-mono-num text-amber-400 font-bold mr-1">CLASS:</span>
            {(Object.keys(HERO_CLASSES) as HeroClassId[]).map((cid) => (
              <button
                key={cid}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectClass(cid);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono-num whitespace-nowrap transition-colors ${
                  heroClass === cid
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-amber-200/75 hover:text-amber-100 hover:bg-amber-500/15'
                }`}
              >
                {HERO_CLASSES[cid].shortLabel}
              </button>
            ))}
          </div>

          <button
            type="button"
            tabIndex={-1}
            data-testid="btn-health-potion"
            onClick={(e) => {
              e.currentTarget.blur();
              onUseHealthPotion();
            }}
            className="px-2 py-1 rounded-lg border border-emerald-500/45 bg-[#0e1a13]/95 text-[11px] font-mono-num text-emerald-200 hover:border-emerald-300 transition-colors whitespace-nowrap"
          >
            🧪 HP [{telemetry.healthPotions ?? 2}] [Z]
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="btn-shield-potion"
            onClick={(e) => {
              e.currentTarget.blur();
              onUseShieldPotionOrDisguise();
            }}
            className="px-2 py-1 rounded-lg border border-sky-500/45 bg-[#0c161e]/95 text-[11px] font-mono-num text-sky-200 hover:border-sky-300 transition-colors whitespace-nowrap"
          >
            {telemetry.isDownedScarab
              ? `🏺 Disguise (${(telemetry.propDisguiseKind || 'none').toUpperCase()}) [X]`
              : `🛡️ Shield [${telemetry.shieldPotions ?? 2}] [X]`}
          </button>

          <button
            type="button"
            tabIndex={-1}
            data-testid="btn-shrine-prayer"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerPrayerOrDisassemble();
            }}
            className="px-2 py-1 rounded-lg border border-amber-400/55 bg-[#1b1309]/95 text-[11px] font-mono-num text-amber-200 hover:border-amber-300 transition-colors whitespace-nowrap"
          >
            ⛩️ {telemetry.nearbyShrineName ? 'Shrine Pray (25g)' : 'Blessing/Relic (45g)'} [F]
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerReload();
            }}
            className="px-2 py-1 rounded-lg border border-amber-500/35 bg-[#140e09]/95 text-[11px] font-mono-num text-amber-200 hover:text-amber-100 hover:border-amber-400 transition-colors whitespace-nowrap"
          >
            ↻ Reload [Y]
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerInspect();
            }}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono-num transition-colors whitespace-nowrap ${
              telemetry.isInspectingWeapon
                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200 font-bold'
                : 'border-amber-500/35 bg-[#140e09]/95 text-amber-200 hover:text-amber-100 hover:border-amber-400'
            }`}
          >
            ✦ Inspect [I]
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerSandboxSpawnBoss();
            }}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono-num transition-colors whitespace-nowrap ${
              bossActive
                ? 'border-purple-400 bg-purple-500/25 text-purple-200 font-bold'
                : 'border-amber-500/35 bg-[#140e09]/95 text-amber-200 hover:text-amber-100 hover:border-amber-400'
            }`}
          >
            👑 Boss [B]
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Toggle Engine Self-Diagnostics [F3]"
            onClick={(e) => {
              e.currentTarget.blur();
              setShowDiagnostics((prev) => !prev);
            }}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono-num transition-colors whitespace-nowrap ${
              showDiagnostics
                ? 'border-emerald-400 bg-[#0c1a13]/95 text-emerald-300 font-bold'
                : 'border-amber-500/35 bg-[#140e09]/95 text-amber-200 hover:text-amber-100 hover:border-amber-400'
            }`}
          >
            ⚡ Profiler [F3]
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleDock();
            }}
            className="px-2.5 py-1 rounded-lg border border-amber-500/35 bg-[#140e09]/95 text-[11px] font-mono-num text-amber-300 hover:text-amber-100 transition-colors whitespace-nowrap"
          >
            {dockCollapsed ? '▴ Show Dock [H]' : '▾ Hide Dock [H]'}
          </button>
        </div>

        {!dockCollapsed && (
          <div
            className="px-2 py-1.5 rounded-xl border border-amber-500/40 flex flex-wrap lg:flex-nowrap items-center justify-center gap-1 max-w-[98vw]"
            style={{
              background: 'rgba(16, 11, 7, 0.92)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.78)',
            }}
          >
            {/* Ride Out Heroes Dual Occupational Weapon Swap ([1] Primary / [2] Secondary) */}
            <div className="flex items-center gap-1 pr-1 border-r border-amber-500/25 shrink-0">
              {([1, 2] as const).map((wSlot) => {
                const w = spec.weapons[wSlot];
                const isSelected = telemetry.activeWeaponSlot === wSlot;
                return (
                  <button
                    key={wSlot}
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      if (isSelected) {
                        onFireQuickShot();
                      } else {
                        onSwapWeapon(wSlot);
                      }
                    }}
                    className={`px-2 py-1 rounded-lg border text-left transition-colors shrink-0 max-w-[138px] ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-amber-500/25 bg-[#140e09] hover:border-amber-400/60 text-amber-200/75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono-num">
                      <span className="text-amber-400 font-bold">[{wSlot}]</span>
                      <span className={isSelected ? 'text-emerald-300 font-bold' : 'text-stone-400'}>
                        {isSelected ? 'EQUIPPED' : 'SWAP'}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold whitespace-nowrap truncate">{w.name}</div>
                    <div className="text-[9px] text-amber-200/70 whitespace-nowrap truncate">{w.roleClue}</div>
                  </button>
                );
              })}
            </div>

            {/* Sanctuary Forge [G] */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerForge();
              }}
              className={`px-2 py-1 rounded-lg border text-left transition-colors shrink-0 ${
                telemetry.magicShards >= 40 || telemetry.isSandboxMode
                  ? 'border-emerald-400/70 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100'
                  : 'border-stone-800 bg-[#0f0b07] text-stone-400 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono-num">
                <span className="text-amber-400 font-bold">[G]</span>
                <span className={telemetry.magicShards >= 40 ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
                  {telemetry.magicShards}/40
                </span>
              </div>
              <div className="text-[11px] font-semibold whitespace-nowrap">
                Forge {telemetry.forgeLevel > 0 ? `+${telemetry.forgeLevel}` : ''}
              </div>
              <div className="text-[9px] text-amber-200/70 whitespace-nowrap">Upgrade</div>
            </button>

            {/* Dune Evade Dash [Shift] */}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerDash();
              }}
              className={`px-2 py-1 rounded-lg border text-left transition-colors shrink-0 ${
                telemetry.cooldowns.dash <= 0.05
                  ? 'border-amber-500/35 bg-[#1c140d] hover:border-amber-400 text-amber-100'
                  : 'border-stone-800 bg-[#0f0b07] text-stone-400 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono-num">
                <span className="text-amber-400 font-bold">[SHIFT]</span>
                <span className={telemetry.cooldowns.dash <= 0.05 ? 'text-emerald-400' : 'text-amber-300'}>
                  {telemetry.cooldowns.dash <= 0.05 ? 'READY' : `${telemetry.cooldowns.dash.toFixed(1)}s`}
                </span>
              </div>
              <div className="text-[11px] font-semibold whitespace-nowrap">Evade</div>
              <div className="text-[9px] text-amber-200/70 whitespace-nowrap">Dash Roll</div>
            </button>

            {/* 5 Canonical Ride Out Heroes Class-Specific Abilities: [Q], [E], [C], [R], [V] */}
            {(['q', 'e', 'c', 'r', 'v'] as const).map((slot) => {
              const ab = spec.abilities[slot];
              const cd = telemetry.cooldowns[slot];
              const isReady = cd <= 0.05;
              const isActive =
                (slot === 'q' && telemetry.isCamouflaged) ||
                (slot === 'v' && telemetry.isMounted);

              return (
                <button
                  key={slot}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTriggerAbility(slot);
                  }}
                  className={`px-2 py-1 rounded-lg border text-left transition-colors shrink-0 max-w-[132px] ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                      : isReady
                      ? 'border-amber-500/35 bg-[#1c140d] hover:border-amber-400 text-amber-100'
                      : 'border-stone-800 bg-[#0f0b07] text-stone-400 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono-num">
                    <span className="text-amber-400 font-bold">[{ab.keyLabel}]</span>
                    <span className={isReady ? 'text-emerald-400' : 'text-amber-300'}>
                      {isActive ? 'ACTIVE' : isReady ? 'READY' : `${cd.toFixed(1)}s`}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold whitespace-nowrap truncate">{ab.name}</div>
                  <div className="text-[9px] text-amber-200/70 whitespace-nowrap truncate">
                    {ab.roleClue}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
