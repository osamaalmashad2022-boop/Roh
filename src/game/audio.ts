import { HeroClassId, WeaponSlotId, AbilitySlotId } from './rules';

/**
 * 100% Procedural Web Audio API Synthesizer for Khepri: Outriders of the Sun.
 * Zero external audio dependencies; pitch-varied (±8%) weight-scaled combat feedback,
 * class-specific weapon acoustics for all 12 weapons, and procedural announcer fanfares.
 */
class ArenaAudioEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private pitchJitter(baseFreq: number, variance = 0.08): number {
    const safeBase = Number.isFinite(baseFreq) && baseFreq > 10 ? baseFreq : 220;
    return safeBase * (1 + (Math.random() * 2 - 1) * variance);
  }

  public playBowDraw() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.pitchJitter(145), now);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.16);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playBowRelease(charge: number, isScoped: boolean) {
    this.playClassWeaponFire('ranger', 1, charge, isScoped);
  }

  public playClassWeaponFire(
    heroClass: HeroClassId,
    slot: WeaponSlotId,
    rawCharge: number,
    isScoped: boolean
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const charge = Number.isFinite(rawCharge) ? Math.max(0, Math.min(1, rawCharge)) : 0.5;
    const now = ctx.currentTime;

    if (heroClass === 'ranger') {
      // Slot 1: Cross Longbow | Slot 2: Chaser Bolt
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = slot === 1 ? (charge > 0.8 || isScoped ? 'sawtooth' : 'triangle') : 'square';
      const startFreq = this.pitchJitter(slot === 1 ? (isScoped ? 590 : 390 + charge * 180) : 660);
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(slot === 1 ? 85 : 190, now + (slot === 1 ? 0.19 : 0.11));
      gain.gain.setValueAtTime(isScoped ? 0.17 : 0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (slot === 1 ? 0.21 : 0.12));
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (slot === 1 ? 0.21 : 0.12));

      const whistle = ctx.createOscillator();
      const wGain = ctx.createGain();
      whistle.type = 'sine';
      whistle.frequency.setValueAtTime(this.pitchJitter(slot === 1 ? 1360 : 1580), now);
      whistle.frequency.exponentialRampToValueAtTime(520, now + 0.15);
      wGain.gain.setValueAtTime(0.05 * (0.5 + charge * 0.5), now);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      whistle.connect(wGain).connect(ctx.destination);
      whistle.start(now);
      whistle.stop(now + 0.16);
      return;
    }

    if (heroClass === 'ragnar') {
      if (slot === 1) {
        // Slot 1: Spectral Cutlass — sharp metallic scimitar ring + air-cleaving ghostly crescent wave!
        const ring = ctx.createOscillator();
        const rGain = ctx.createGain();
        ring.type = 'triangle';
        ring.frequency.setValueAtTime(this.pitchJitter(1280 + charge * 260), now);
        ring.frequency.exponentialRampToValueAtTime(340, now + 0.19);
        rGain.gain.setValueAtTime(0.14, now);
        rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        ring.connect(rGain).connect(ctx.destination);
        ring.start(now);
        ring.stop(now + 0.2);

        const cleave = ctx.createOscillator();
        const cGain = ctx.createGain();
        cleave.type = 'sawtooth';
        cleave.frequency.setValueAtTime(this.pitchJitter(440), now);
        cleave.frequency.exponentialRampToValueAtTime(95, now + 0.17);
        cGain.gain.setValueAtTime(0.15, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        cleave.connect(cGain).connect(ctx.destination);
        cleave.start(now);
        cleave.stop(now + 0.18);
      } else {
        // Slot 2: Naval Cannon — thunderous black-powder cannon boom + deep hull shockwave!
        const cannon = ctx.createOscillator();
        const cGain = ctx.createGain();
        cannon.type = 'sawtooth';
        cannon.frequency.setValueAtTime(this.pitchJitter(145), now);
        cannon.frequency.exponentialRampToValueAtTime(28, now + 0.34);
        cGain.gain.setValueAtTime(0.26, now);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        cannon.connect(cGain).connect(ctx.destination);
        cannon.start(now);
        cannon.stop(now + 0.36);

        const sub = ctx.createOscillator();
        const sGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(88, now);
        sub.frequency.exponentialRampToValueAtTime(22, now + 0.38);
        sGain.gain.setValueAtTime(0.24, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        sub.connect(sGain).connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.4);
      }
      return;
    }

    if (heroClass === 'bounty') {
      // Slot 1: Volcano Twins Dual Revolvers | Slot 2: Double-Barreled Shotgun
      const boom = ctx.createOscillator();
      const gain = ctx.createGain();
      boom.type = 'sawtooth';
      boom.frequency.setValueAtTime(this.pitchJitter(slot === 1 ? 260 : 140), now);
      boom.frequency.exponentialRampToValueAtTime(36, now + (slot === 1 ? 0.16 : 0.28));
      gain.gain.setValueAtTime(slot === 1 ? 0.17 : 0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (slot === 1 ? 0.18 : 0.3));
      boom.connect(gain).connect(ctx.destination);
      boom.start(now);
      boom.stop(now + (slot === 1 ? 0.18 : 0.3));
      return;
    }

    if (heroClass === 'assassin') {
      // Slot 1: Bladed SMG | Slot 2: Fly Daggers
      const zip = ctx.createOscillator();
      const gain = ctx.createGain();
      zip.type = slot === 1 ? 'square' : 'sine';
      zip.frequency.setValueAtTime(this.pitchJitter(slot === 1 ? 740 : 1850), now);
      zip.frequency.exponentialRampToValueAtTime(slot === 1 ? 180 : 420, now + 0.09);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      zip.connect(gain).connect(ctx.destination);
      zip.start(now);
      zip.stop(now + 0.1);
      return;
    }

    if (heroClass === 'mage') {
      // Slot 1: Medusagazer | Slot 2: Flame Staff
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = slot === 1 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(this.pitchJitter(slot === 1 ? 880 : 210), now);
      osc.frequency.exponentialRampToValueAtTime(slot === 1 ? 440 : 65, now + 0.24);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      return;
    }

    if (heroClass === 'warrior') {
      // Slot 1: Polearm of the Raging Sea | Slot 2: Vortex Bursting
      const wave = ctx.createOscillator();
      const gain = ctx.createGain();
      wave.type = 'triangle';
      wave.frequency.setValueAtTime(this.pitchJitter(slot === 1 ? 195 : 280), now);
      wave.frequency.exponentialRampToValueAtTime(52, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);
      wave.connect(gain).connect(ctx.destination);
      wave.start(now);
      wave.stop(now + 0.27);
      return;
    }

    // Sniper Chiyo — Slot 1: Phantom Longrifle | Slot 2: Psychic Kunai
    const rail = ctx.createOscillator();
    const gain = ctx.createGain();
    rail.type = slot === 1 ? 'sawtooth' : 'triangle';
    rail.frequency.setValueAtTime(this.pitchJitter(slot === 1 ? 1120 : 940), now);
    rail.frequency.exponentialRampToValueAtTime(slot === 1 ? 110 : 360, now + (slot === 1 ? 0.22 : 0.14));
    gain.gain.setValueAtTime(slot === 1 ? 0.19 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (slot === 1 ? 0.24 : 0.15));
    rail.connect(gain).connect(ctx.destination);
    rail.start(now);
    rail.stop(now + (slot === 1 ? 0.24 : 0.15));
  }

  public playHitImpact(isCritical: boolean, isKill: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(this.pitchJitter(isCritical ? 210 : 150), now);
    thud.frequency.exponentialRampToValueAtTime(42, now + 0.14);
    thudGain.gain.setValueAtTime(isCritical ? 0.22 : 0.15, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    thud.connect(thudGain).connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.15);

    if (isCritical || isKill) {
      const freqs = isKill ? [880, 1174.66, 1760] : [987.77, 1479.98];
      freqs.forEach((f, idx) => {
        const chime = ctx.createOscillator();
        const cGain = ctx.createGain();
        chime.type = 'triangle';
        chime.frequency.setValueAtTime(this.pitchJitter(f, 0.02), now + idx * 0.035);
        cGain.gain.setValueAtTime(0.12, now + idx * 0.035);
        cGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.28);
        chime.connect(cGain).connect(ctx.destination);
        chime.start(now + idx * 0.035);
        chime.stop(now + idx * 0.035 + 0.29);
      });
    }
  }

  public playCombatAnnouncer(
    cue:
      | 'double'
      | 'triple'
      | 'quadra'
      | 'rampage'
      | 'boss_spawn'
      | 'boss_slain'
      | 'chest_open'
      | 'forge_upgrade'
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chordMap: Record<typeof cue, number[]> = {
      double: [440, 554.37, 659.25],
      triple: [493.88, 622.25, 739.99, 987.77],
      quadra: [523.25, 659.25, 783.99, 1046.5],
      rampage: [587.33, 739.99, 880, 1174.66, 1479.98],
      boss_spawn: [196.0, 185.0, 146.83, 110.0],
      boss_slain: [523.25, 659.25, 783.99, 1046.5, 1318.5],
      chest_open: [659.25, 830.61, 987.77, 1318.5],
      forge_upgrade: [440, 659.25, 880, 1318.5],
    };

    const notes = chordMap[cue];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = cue === 'boss_spawn' ? 'sawtooth' : 'triangle';
      const stepDelay = idx * 0.055;
      osc.frequency.setValueAtTime(freq, now + stepDelay);
      gain.gain.setValueAtTime(cue === 'boss_spawn' ? 0.14 : 0.11, now + stepDelay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepDelay + 0.36);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + stepDelay);
      osc.stop(now + stepDelay + 0.38);
    });
  }

  public playMirageCamouflage() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.38);
      gain.gain.setValueAtTime(0.06, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + 0.42);
    });
  }

  public playGrappleLaunch() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.22);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playMountSummon(mounted: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(mounted ? 240 : 420, now);
    osc.frequency.exponentialRampToValueAtTime(mounted ? 520 : 190, now + 0.24);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playScarabTransform(resurrected: boolean) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = resurrected ? [523.25, 659.25, 783.99, 1046.5] : [392, 311.13, 261.63];
    notes.forEach((n, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n, now + idx * 0.06);
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.36);
    });
  }

  public playEnemyTelegraph() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.32);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playPlayerHurt() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.22);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }
}

export const audioEngine = new ArenaAudioEngine();

