export type HeroClassId = 'ranger' | 'ragnar' | 'bounty' | 'assassin' | 'mage' | 'warrior' | 'sniper';

export type GameStateMode = 'title' | 'playing' | 'paused' | 'gameover';

export type EnemyPolicyType = 'kiter_sniper' | 'charger_vanguard' | 'orbiter_assassin' | 'area_weaver';

export type WeaponSlotId = 1 | 2;

export type AbilitySlotId = 'q' | 'e' | 'c' | 'r' | 'v';

export interface WeaponSpec {
  slot: WeaponSlotId;
  name: string;
  arabicName: string;
  roleClue: string;
  baseDamage: number;
  projectileSpeed: number;
  fireCooldown: number;
  burstCount: number;
  spreadAngle: number;
  projectileColor: number;
  explosiveRadius?: number;
  appliesBurn?: boolean;
  appliesStun?: boolean;
}

export interface AbilitySpec {
  id: AbilitySlotId;
  keyLabel: string;
  name: string;
  arabicName: string;
  roleClue: string;
  cooldown: number;
  duration?: number;
}

export interface HeroClassSpec {
  id: HeroClassId;
  shortLabel: string;
  name: string;
  canonicalHero: string;
  title: string;
  tagline: string;
  maxHp: number;
  maxShield: number;
  baseSpeed: number;
  primaryWeapon: string;
  secondaryWeapon: string;
  primaryRoleClue: string;
  weapons: Record<WeaponSlotId, WeaponSpec>;
  baseDamage: number;
  projectileSpeed: number;
  fireCooldown: number;
  canScope: boolean;
  accentColor: string;
  secondaryColor: string;
  abilities: Record<AbilitySlotId, AbilitySpec>;
}

export const HERO_CLASSES: Record<HeroClassId, HeroClassSpec> = {
  ranger: {
    id: 'ranger',
    shortLabel: 'RANGER',
    name: 'RANGER · Robin',
    canonicalHero: 'Robin (Greenwood Ranger · قناص الصحراء)',
    title: 'Precision Longbow Sniper & Camouflage Specialist',
    tagline:
      'Wields the Cross Longbow [1] and 3-shot Chaser Bolt [2]. Masters Raven Shade stealth, Dazing Arrow stun, Elvish Trap root, and Hunter Orb + Steady Aim.',
    maxHp: 120,
    maxShield: 60,
    baseSpeed: 10.8,
    primaryWeapon: 'Cross Longbow',
    secondaryWeapon: 'Chaser Bolt',
    primaryRoleClue: 'Steady Aim Sniper · 2.5x Weak-Point Crit',
    weapons: {
      1: {
        slot: 1,
        name: 'Cross Longbow',
        arabicName: 'قوس الصقر الطويل (Cross Longbow)',
        roleClue: 'High-Velocity Sniper Bow · 2.5x Weak-Point Crit',
        baseDamage: 40,
        projectileSpeed: 76,
        fireCooldown: 0.42,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0x10b981,
      },
      2: {
        slot: 2,
        name: 'Chaser Bolt',
        arabicName: 'قوس الصيد الثلاثي (Chaser Bolt)',
        roleClue: 'Rapid 3-Bolt Tracking Burst · Low Recoil',
        baseDamage: 18,
        projectileSpeed: 65,
        fireCooldown: 0.27,
        burstCount: 3,
        spreadAngle: 0.042,
        projectileColor: 0x38bdf8,
      },
    },
    baseDamage: 40,
    projectileSpeed: 76,
    fireCooldown: 0.42,
    canScope: true,
    accentColor: '#10b981',
    secondaryColor: '#f59e0b',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: 'Raven Shade',
        arabicName: 'طيف الغراب (Raven Shade)',
        roleClue: 'Invisibility + Shade Decoy + 60% Ambush Crit',
        cooldown: 8.5,
        duration: 4.5,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Dazing Arrow',
        arabicName: 'سهم الصعق والوثب (Dazing Arrow)',
        roleClue: 'Fires Shock Stun Arrow (2.8s Stun) + Backflip Vault',
        cooldown: 6.5,
        duration: 0.5,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Elvish Trap',
        arabicName: 'الفخ الخفي (Elvish Trap)',
        roleClue: 'Deploys Root Snare Trap that Immobilizes Enemies',
        cooldown: 9.0,
        duration: 6.0,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Hunter Orb & Steady Aim',
        arabicName: 'كرة الصياد والتصويب الثابت (Hunter Orb)',
        roleClue: 'Reveals & Marks All Rivals (+30% DMG) + Rapid Draw',
        cooldown: 11.0,
        duration: 6.0,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },

  ragnar: {
    id: 'ragnar',
    shortLabel: 'RAGNAR',
    name: 'RAGNAR · Pirate King',
    canonicalHero: 'Ragnar (Cursed Ghost Pirate · قرصان الأشباح الملعون)',
    title: 'Spectral Cutlass Slash Waves & Heavy Naval Cannon',
    tagline:
      'Wields the Spectral Cutlass [1] firing ranged crescent slash waves (3-wave wide arc on charge/Forge!) and Naval Cannon [2] blazing explosive cannonballs. Commands Sea Ward Bulwark Shield [Q], Corsair Surge [E], Wave Vortex [C], and Ghost Fleet Broadside [R].',
    maxHp: 145,
    maxShield: 85,
    baseSpeed: 10.6,
    primaryWeapon: 'Spectral Cutlass',
    secondaryWeapon: 'Naval Cannon',
    primaryRoleClue: 'Crescent Slash Waves & Explosive Naval Cannon',
    weapons: {
      1: {
        slot: 1,
        name: 'Spectral Cutlass',
        arabicName: 'سيف القرصان القاطع عن بُعد (Spectral Cutlass)',
        roleClue: 'Ranged Crescent Slash Waves · 3-Wave Wide Arc on Charge/Forge',
        baseDamage: 42,
        projectileSpeed: 68,
        fireCooldown: 0.36,
        burstCount: 1,
        spreadAngle: 0.085,
        projectileColor: 0x2dd4bf,
      },
      2: {
        slot: 2,
        name: 'Naval Cannon',
        arabicName: 'مدفع الأسطول المحمول (Naval Cannon)',
        roleClue: 'Blazing Explosive Cannonball · 4.8m Blast Crater + Burn',
        baseDamage: 56,
        projectileSpeed: 52,
        fireCooldown: 0.62,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0xf97316,
        explosiveRadius: 4.8,
        appliesBurn: true,
      },
    },
    baseDamage: 42,
    projectileSpeed: 68,
    fireCooldown: 0.36,
    canScope: true,
    accentColor: '#2dd4bf',
    secondaryColor: '#facc15',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: 'Sea Ward · Bulwark Shield',
        arabicName: 'الدرع المنبثق الأمامي (Bulwark Shield)',
        roleClue: '3D Forward Pop-Up Bulwark Shield (+75 Shield & 60% Damage Reduction)',
        cooldown: 9.0,
        duration: 5.0,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Corsair Surge',
        arabicName: 'فورة القرصان والشفاء (Corsair Surge)',
        roleClue: 'Restores +60 HP + Surges Move Speed (+50%) & Attack Rate (+45%)',
        cooldown: 8.5,
        duration: 5.0,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Wave Vortex',
        arabicName: 'دوامة الأمواج الساحقة (Wave Vortex)',
        roleClue: 'Deploys Cursed Whirlpool Trap Pulling & Draining Enemies',
        cooldown: 10.5,
        duration: 5.5,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Ghost Fleet Broadside',
        arabicName: 'قصف أسطول الأشباح (Fleet Broadside)',
        roleClue: 'Unleashes 5 Cutlass Crescent Waves + 3 Explosive Cannonballs!',
        cooldown: 13.0,
        duration: 5.0,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },

  bounty: {
    id: 'bounty',
    shortLabel: 'WHITE',
    name: 'WHITE · Bounty Hunter',
    canonicalHero: 'White (Bounty Hunter · صياد الجوائز)',
    title: 'Dual Revolvers, Shotgun & Sticky Bomb Outlaw',
    tagline:
      'Wields Volcano Twins [1] incendiary dual pistols and Double-Barreled Shotgun [2]. Uses Vintage Wine heal, Sticky Bomb explosion, and Adversity Reload.',
    maxHp: 135,
    maxShield: 65,
    baseSpeed: 10.4,
    primaryWeapon: 'Volcano Twins',
    secondaryWeapon: 'Double-Barreled Shotgun',
    primaryRoleClue: 'Dual Incendiary Pistols · Burn Stack',
    weapons: {
      1: {
        slot: 1,
        name: 'Volcano Twins',
        arabicName: 'مسدسات البركان المزدوجة (Volcano Twins)',
        roleClue: 'Twin Incendiary Bullets · Ignites Target',
        baseDamage: 22,
        projectileSpeed: 70,
        fireCooldown: 0.28,
        burstCount: 2,
        spreadAngle: 0.025,
        projectileColor: 0xf97316,
        appliesBurn: true,
      },
      2: {
        slot: 2,
        name: 'Double-Barreled Shotgun',
        arabicName: 'بندقية الصيد المزدوجة (Shotgun)',
        roleClue: '5-Pellet Heavy Buckshot · Close Knockback',
        baseDamage: 14,
        projectileSpeed: 56,
        fireCooldown: 0.52,
        burstCount: 5,
        spreadAngle: 0.085,
        projectileColor: 0xfacc15,
      },
    },
    baseDamage: 22,
    projectileSpeed: 70,
    fireCooldown: 0.28,
    canScope: true,
    accentColor: '#f97316',
    secondaryColor: '#facc15',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: 'Vintage Wine',
        arabicName: 'شراب القوة (Vintage Wine)',
        roleClue: 'Instantly Restores +55 HP & +30 Shield + Speed Buff',
        cooldown: 9.0,
        duration: 4.5,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Mercy Extrication',
        arabicName: 'القفزة التكتيكية (Mercy Extrication)',
        roleClue: 'Tactical Dodge Leap + Adversity Reload Reset',
        cooldown: 6.0,
        duration: 0.4,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Sticky Bomb',
        arabicName: 'القنبلة اللاصقة (Sticky Bomb)',
        roleClue: 'Throws Explosive Sticky Bomb (55 AoE DMG + Burn)',
        cooldown: 8.5,
        duration: 1.5,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Hunter Orb Bounty',
        arabicName: 'كرة الصياد والانتقام (Hunter Orb)',
        roleClue: 'Marks All Rivals for +35% Bounty Crit Damage',
        cooldown: 11.0,
        duration: 6.0,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },

  assassin: {
    id: 'assassin',
    shortLabel: 'HASAN-E',
    name: 'HASAN-E · Assassin',
    canonicalHero: 'Hasan-e (Dancing Assassin · القاتل الراقص)',
    title: 'Bladed SMG & Fly Daggers Melee/Ranged Assassin',
    tagline:
      'Wields Bladed SMG [1] and fan-thrown Fly Daggers [2]. Executes Shadow Lurk stealth, Whirl Dance 360° slash, Paralyzer stun, and Flurry Blade storm.',
    maxHp: 115,
    maxShield: 55,
    baseSpeed: 11.8,
    primaryWeapon: 'Bladed SMG',
    secondaryWeapon: 'Fly Daggers',
    primaryRoleClue: 'Rapid 3-Round SMG · Close Shred',
    weapons: {
      1: {
        slot: 1,
        name: 'Bladed SMG',
        arabicName: 'رشاش النصال (Bladed SMG)',
        roleClue: 'Ultra-Fast 3-Round Burst SMG',
        baseDamage: 15,
        projectileSpeed: 64,
        fireCooldown: 0.21,
        burstCount: 3,
        spreadAngle: 0.045,
        projectileColor: 0xa855f7,
      },
      2: {
        slot: 2,
        name: 'Fly Daggers',
        arabicName: 'الخناجر الطائرة (Fly Daggers)',
        roleClue: 'Precision Throwing Blades · High Crit',
        baseDamage: 32,
        projectileSpeed: 72,
        fireCooldown: 0.34,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0xec4899,
      },
    },
    baseDamage: 15,
    projectileSpeed: 64,
    fireCooldown: 0.21,
    canScope: true,
    accentColor: '#a855f7',
    secondaryColor: '#ec4899',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: 'Shadow Lurk',
        arabicName: 'التخفي الظلي (Shadow Lurk)',
        roleClue: 'Shadow Invisibility (+55% Speed) + +75% Backstab',
        cooldown: 8.0,
        duration: 4.0,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Whirl Dance & Assault',
        arabicName: 'رقصة النصال والاندفاع (Whirl Dance)',
        roleClue: 'Dashes Through Target + 360° Spinning Blade Slash (48 DMG)',
        cooldown: 5.5,
        duration: 0.35,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Paralyzer',
        arabicName: 'خنجر الشلل (Paralyzer)',
        roleClue: 'Paralyzes & Freezes Target for 3.0s + Armor Shred',
        cooldown: 9.0,
        duration: 3.0,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Flurry Blade',
        arabicName: 'عاصفة النصال (Flurry Blade)',
        roleClue: 'Unleashes 6 Homing Spectral Blades at Nearby Rivals',
        cooldown: 10.5,
        duration: 1.5,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },

  mage: {
    id: 'mage',
    shortLabel: 'LILITH',
    name: 'LILITH · Dark Succubus',
    canonicalHero: 'Lilith (Dark Succubus · ساحرة الظلام)',
    title: 'Medusagazer Petrifier & Flame Staff Pyromancer',
    tagline:
      'Wields Medusagazer [1] petrifying beam and explosive Flame Staff [2]. Masters Dark Mirage blink, Night Wings flight, Shade Array vortex, and Shadow Storm.',
    maxHp: 125,
    maxShield: 75,
    baseSpeed: 10.2,
    primaryWeapon: 'Medusagazer',
    secondaryWeapon: 'Flame Staff',
    primaryRoleClue: 'Petrifying Gaze Bolt · Stuns on Hit',
    weapons: {
      1: {
        slot: 1,
        name: 'Medusagazer',
        arabicName: 'عصا ميدوسا المتحجرة (Medusagazer)',
        roleClue: 'Petrifying Laser Bolt · Slows & Stuns Rivals',
        baseDamage: 34,
        projectileSpeed: 68,
        fireCooldown: 0.38,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0xc084fc,
        appliesStun: true,
      },
      2: {
        slot: 2,
        name: 'Flame Staff',
        arabicName: 'صولجان اللهب المتفجر (Flame Staff)',
        roleClue: 'Explosive Solar Fireball · 4.5m Splash Burn',
        baseDamage: 44,
        projectileSpeed: 52,
        fireCooldown: 0.56,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0xf97316,
        explosiveRadius: 4.5,
        appliesBurn: true,
      },
    },
    baseDamage: 34,
    projectileSpeed: 68,
    fireCooldown: 0.38,
    canScope: true,
    accentColor: '#c084fc',
    secondaryColor: '#f97316',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: 'Dark Mirage & Spirit Ward',
        arabicName: 'السراب المظلم ودرع الروح (Dark Mirage)',
        roleClue: 'Instant 9m Blink Teleport + Restores +60 Shield Barrier',
        cooldown: 8.5,
        duration: 3.5,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Night Wings',
        arabicName: 'أجنحة الليل (Night Wings)',
        roleClue: 'Soars High Into the Sky for Aerial Bombardment',
        cooldown: 7.0,
        duration: 2.8,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Shade Array',
        arabicName: 'مصفوفة الظلال (Shade Array)',
        roleClue: 'Pulls Rivals Into Dark Vortex & Drains HP to Lilith',
        cooldown: 9.5,
        duration: 4.5,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Shadow Storm',
        arabicName: 'عاصفة الظلال (Shadow Storm)',
        roleClue: 'Calls Down Cataclysmic Lightning on All Nearby Rivals (60 DMG)',
        cooldown: 11.5,
        duration: 2.0,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },

  warrior: {
    id: 'warrior',
    shortLabel: 'ATLAS',
    name: 'ATLAS · Raging King',
    canonicalHero: 'Atlas (King of the Raging Sea · ملك البحار)',
    title: 'Polearm of the Raging Sea & Tidal Juggernaut',
    tagline:
      'Wields Polearm of the Raging Sea [1] and Vortex Bursting [2]. Commands Water Curse shield, Water Trajectory wave charge, and Flood Trap geyser.',
    maxHp: 175,
    maxShield: 90,
    baseSpeed: 9.5,
    primaryWeapon: 'Polearm of the Raging Sea',
    secondaryWeapon: 'Vortex Bursting',
    primaryRoleClue: 'Heavy Piercing Trident · High Impact',
    weapons: {
      1: {
        slot: 1,
        name: 'Polearm of the Raging Sea',
        arabicName: 'رمح البحر الهائج (Raging Polearm)',
        roleClue: 'Heavy Tidal Spear · High Cleave Damage',
        baseDamage: 44,
        projectileSpeed: 58,
        fireCooldown: 0.52,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0x0ea5e9,
      },
      2: {
        slot: 2,
        name: 'Vortex Bursting',
        arabicName: 'انفجار الدوامة الثلاثي (Vortex Bursting)',
        roleClue: '3-Wave Crashing Tidal Spread',
        baseDamage: 20,
        projectileSpeed: 52,
        fireCooldown: 0.36,
        burstCount: 3,
        spreadAngle: 0.06,
        projectileColor: 0x38bdf8,
      },
    },
    baseDamage: 44,
    projectileSpeed: 58,
    fireCooldown: 0.52,
    canScope: false,
    accentColor: '#0ea5e9',
    secondaryColor: '#eab308',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: "Water's Curse",
        arabicName: 'درع لعنة الماء (Water Curse)',
        roleClue: 'Grants +65 Tidal Shield + Damages & Slows Nearby Enemies',
        cooldown: 9.0,
        duration: 4.5,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Water Trajectory',
        arabicName: 'مسار الموج الصادم (Water Trajectory)',
        roleClue: 'Surges Forward on a Tidal Wave, Ramming Enemies (45 DMG)',
        cooldown: 6.5,
        duration: 0.45,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Flood Trap',
        arabicName: 'فخ الطوفان (Flood Trap)',
        roleClue: 'Erupts Whirlpool Geyser that Knocks Up & Traps Enemies',
        cooldown: 9.0,
        duration: 5.0,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Water Spear Cataclysm',
        arabicName: 'رمح الطوفان الملكي (Water Spear)',
        roleClue: 'Slams Giant Tidal Spear for 65 AoE Shockwave DMG',
        cooldown: 11.0,
        duration: 1.5,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },

  sniper: {
    id: 'sniper',
    shortLabel: 'CHIYO',
    name: 'CHIYO · Ghost Huntress',
    canonicalHero: 'Chiyo (Ghost Huntress · صيادة الأطياف)',
    title: 'Phantom Sniper Rifle & Psychic Homing Specialist',
    tagline:
      'Wields Phantom Longrifle [1] and 3-shot Psychic Kunai [2]. Commands Spectral Walk clone heal, Stealth Getaway vault, Psychic Shock, and Homing Salvo.',
    maxHp: 120,
    maxShield: 65,
    baseSpeed: 10.6,
    primaryWeapon: 'Phantom Longrifle',
    secondaryWeapon: 'Psychic Kunai',
    primaryRoleClue: 'Hitscan-Speed Sniper · 2.6x Crit',
    weapons: {
      1: {
        slot: 1,
        name: 'Phantom Longrifle',
        arabicName: 'بندقية الطيف القناصة (Phantom Rifle)',
        roleClue: 'Ultra-Fast Sniper Rifle · Piercing Crit',
        baseDamage: 42,
        projectileSpeed: 88,
        fireCooldown: 0.46,
        burstCount: 1,
        spreadAngle: 0,
        projectileColor: 0x38bdf8,
      },
      2: {
        slot: 2,
        name: 'Psychic Kunai',
        arabicName: 'الكوناي النفسي المتتبع (Psychic Kunai)',
        roleClue: '3-Kunai Homing Volley · Tracks Targets',
        baseDamage: 17,
        projectileSpeed: 64,
        fireCooldown: 0.29,
        burstCount: 3,
        spreadAngle: 0.04,
        projectileColor: 0x22d3ee,
      },
    },
    baseDamage: 42,
    projectileSpeed: 88,
    fireCooldown: 0.46,
    canScope: true,
    accentColor: '#38bdf8',
    secondaryColor: '#f59e0b',
    abilities: {
      q: {
        id: 'q',
        keyLabel: 'Q',
        name: 'Spectral Walk',
        arabicName: 'المشية الطيفية (Spectral Walk)',
        roleClue: 'Stealth Sprint + Spawns Phantom Clone + Heals +35 HP',
        cooldown: 8.5,
        duration: 4.5,
      },
      e: {
        id: 'e',
        keyLabel: 'E',
        name: 'Stealth Getaway',
        arabicName: 'الهروب الخفي (Stealth Getaway)',
        roleClue: 'Cleanses Debuffs + +25 Shield + Grapple to Sniper Perch',
        cooldown: 6.5,
        duration: 0.48,
      },
      c: {
        id: 'c',
        keyLabel: 'C',
        name: 'Psychic Shock',
        arabicName: 'الصدمة النفسية المتفجرة (Psychic Shock)',
        roleClue: 'Detonates Psychic Plasma Blast on Target (48 AoE DMG)',
        cooldown: 8.5,
        duration: 2.0,
      },
      r: {
        id: 'r',
        keyLabel: 'R',
        name: 'Psychic Targeting Salvo',
        arabicName: 'الرشقة المتتبعة وحقل التخفي (Psychic Targeting)',
        roleClue: 'Fires 6 Homing Psychic Missiles + Stealth Field',
        cooldown: 11.0,
        duration: 4.0,
      },
      v: {
        id: 'v',
        keyLabel: 'V',
        name: 'Desert Raptor Mount',
        arabicName: 'استدعاء المطية (Ride Out Mount)',
        roleClue: 'Summon Dinosaur Courser · +60% Sprint Speed',
        cooldown: 2.0,
      },
    },
  },
};

export interface ArenaPlatform {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  height: number;
  type: 'sniper_perch' | 'temple_dais' | 'ruin_arch' | 'obelisk_base';
}

export const ARENA_PLATFORMS: ArenaPlatform[] = [
  { id: 'dais-center', name: 'Sanctuary Forge of Khepri', x: 0, z: 0, radius: 7.5, height: 0.6, type: 'temple_dais' },
  { id: 'perch-north', name: 'North Horus Vantage', x: -18, z: -22, radius: 4.8, height: 4.8, type: 'sniper_perch' },
  { id: 'perch-east', name: 'East Karnak Arch', x: 24, z: -14, radius: 4.8, height: 5.2, type: 'sniper_perch' },
  { id: 'perch-south', name: 'South Luxor Colonnade', x: 18, z: 22, radius: 4.8, height: 4.6, type: 'sniper_perch' },
  { id: 'perch-west', name: 'West Anubis Watchtower', x: -24, z: 15, radius: 4.8, height: 5.0, type: 'sniper_perch' },
  { id: 'obelisk-nw', name: 'Obelisk of Thoth', x: -32, z: -32, radius: 2.4, height: 18.0, type: 'obelisk_base' },
  { id: 'obelisk-ne', name: 'Obelisk of Ra', x: 32, z: -32, radius: 2.4, height: 18.0, type: 'obelisk_base' },
  { id: 'obelisk-se', name: 'Obelisk of Isis', x: 32, z: 32, radius: 2.4, height: 18.0, type: 'obelisk_base' },
  { id: 'obelisk-sw', name: 'Obelisk of Osiris', x: -32, z: 32, radius: 2.4, height: 18.0, type: 'obelisk_base' },
  // Outer 100-Player Battle Royale Sector Landmarks
  { id: 'perch-outer-n', name: 'Outer Sun Spire North', x: 0, z: -64, radius: 5.2, height: 5.6, type: 'sniper_perch' },
  { id: 'perch-outer-s', name: 'Outer Mirage Bastion South', x: 0, z: 64, radius: 5.2, height: 5.4, type: 'sniper_perch' },
  { id: 'perch-outer-e', name: 'Outer Red Sea Citadel East', x: 64, z: 0, radius: 5.2, height: 5.6, type: 'sniper_perch' },
  { id: 'perch-outer-w', name: 'Outer Sobek Watch West', x: -64, z: 0, radius: 5.2, height: 5.4, type: 'sniper_perch' },
  { id: 'obelisk-outer-nw', name: 'Outer Pillar of Amun', x: -58, z: -58, radius: 2.8, height: 21.0, type: 'obelisk_base' },
  { id: 'obelisk-outer-ne', name: 'Outer Pillar of Sekhmet', x: 58, z: -58, radius: 2.8, height: 21.0, type: 'obelisk_base' },
  { id: 'obelisk-outer-se', name: 'Outer Pillar of Bastet', x: 58, z: 58, radius: 2.8, height: 21.0, type: 'obelisk_base' },
  { id: 'obelisk-outer-sw', name: 'Outer Pillar of Ptah', x: -58, z: 58, radius: 2.8, height: 21.0, type: 'obelisk_base' },
];

export const ARENA_RADIUS = 135;

export function groundHeightAt(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  const centerFlatten = Math.min(1, Math.max(0, (dist - 10) / 28));
  const wave1 = Math.sin(x * 0.055 + z * 0.038) * 0.65;
  const wave2 = Math.cos(z * 0.07 - x * 0.045) * 0.45;
  const clampedDist = Math.min(dist, 145);
  const perimeterRise = clampedDist > 112 ? Math.pow((clampedDist - 112) / 22, 1.45) * 3.2 : 0;
  return (wave1 + wave2) * centerFlatten + perimeterRise;
}

export function getEffectiveSurfaceHeight(x: number, z: number, currentY: number): {
  groundY: number;
  isHighGround: boolean;
  perchName: string | null;
} {
  const baseGround = groundHeightAt(x, z);
  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'obelisk_base') continue;
    const d = Math.hypot(x - plat.x, z - plat.z);
    if (d <= plat.radius) {
      const topY = baseGround + plat.height;
      if (plat.height <= 1.2 || currentY >= topY - 1.8) {
        return {
          groundY: topY,
          isHighGround: plat.height >= 3.5,
          perchName: plat.height >= 3.5 ? plat.name : null,
        };
      }
    }
  }
  return {
    groundY: baseGround,
    isHighGround: baseGround >= 2.8,
    perchName: baseGround >= 2.8 ? 'Dune Ridge' : null,
  };
}

export function findBestGrappleTarget(
  playerX: number,
  playerZ: number,
  aimDirX: number,
  aimDirZ: number
): { x: number; y: number; z: number; perchName: string } {
  const perches = ARENA_PLATFORMS.filter((p) => p.type === 'sniper_perch');
  let bestScore = -Infinity;
  let chosen = perches[0];

  const len = Math.hypot(aimDirX, aimDirZ) || 1;
  const nx = aimDirX / len;
  const nz = aimDirZ / len;

  for (const perch of perches) {
    const dx = perch.x - playerX;
    const dz = perch.z - playerZ;
    const dist = Math.hypot(dx, dz);
    if (dist < 3.5) continue;
    const dot = (dx / dist) * nx + (dz / dist) * nz;
    const distScore = 1 - Math.min(dist, 55) / 70;
    const score = dot * 2.0 + distScore;
    if (score > bestScore) {
      bestScore = score;
      chosen = perch;
    }
  }

  const groundY = groundHeightAt(chosen.x, chosen.z) + chosen.height;
  return {
    x: chosen.x,
    y: groundY,
    z: chosen.z,
    perchName: chosen.name,
  };
}

export interface SniperShotParams {
  baseDamage: number;
  drawCharge: number;
  isScoped: boolean;
  isHeadshot: boolean;
  isCamouflagedAmbush: boolean;
  isHighGround: boolean;
  isTargetSnared: boolean;
  forgeLevel?: number;
}

export interface SniperShotResult {
  finalDamage: number;
  isCritical: boolean;
  multiplier: number;
  tags: string[];
}

export function calculatePrecisionShotDamage(params: SniperShotParams): SniperShotResult {
  const chargeFactor = 0.65 + Math.min(1, Math.max(0, params.drawCharge)) * 0.75;
  let multiplier = chargeFactor;
  const tags: string[] = [];

  if (params.isScoped) {
    multiplier *= 1.2;
    tags.push('STEADY AIM');
  }
  if (params.isHighGround) {
    multiplier *= 1.2;
    tags.push('HIGH GROUND +20%');
  }
  if (params.isCamouflagedAmbush) {
    multiplier *= 1.6;
    tags.push('RAVEN SHADE AMBUSH +60%');
  }
  if (params.isTargetSnared) {
    multiplier *= 1.3;
    tags.push('HUNTER ORB & TRAP +30%');
  }
  if (params.forgeLevel && params.forgeLevel > 0) {
    multiplier *= 1 + params.forgeLevel * 0.18;
    tags.push(`FORGED LV${params.forgeLevel}`);
  }
  if (params.isHeadshot) {
    multiplier *= 2.0;
    tags.push('WEAK-POINT CRIT');
  }

  const finalDamage = Math.round(params.baseDamage * multiplier);
  const isCritical = params.isHeadshot || params.isCamouflagedAmbush || params.drawCharge >= 0.92;

  return {
    finalDamage,
    isCritical,
    multiplier: Number(multiplier.toFixed(2)),
    tags,
  };
}

export interface ScarabRelicState {
  isDownedScarab: boolean;
  scarabTimer: number;
  scarabMaxDuration: number;
  relicReady: boolean;
  relicCooldown: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
}

export function applyDamageWithScarabRelic(
  state: ScarabRelicState,
  incomingDamage: number
): {
  nextState: ScarabRelicState;
  enteredScarab: boolean;
  eliminated: boolean;
} {
  const next = { ...state };
  let remaining = Math.max(0, incomingDamage);

  if (next.isDownedScarab) {
    next.hp = Math.max(0, next.hp - remaining);
    if (next.hp <= 0) {
      return { nextState: next, enteredScarab: false, eliminated: true };
    }
    return { nextState: next, enteredScarab: false, eliminated: false };
  }

  if (next.shield > 0) {
    const absorbed = Math.min(next.shield, remaining);
    next.shield -= absorbed;
    remaining -= absorbed;
  }

  next.hp = Math.max(0, next.hp - remaining);

  if (next.hp <= 0) {
    if (next.relicReady) {
      next.isDownedScarab = true;
      next.relicReady = false;
      next.relicCooldown = 42;
      next.scarabMaxDuration = 6.0;
      next.scarabTimer = 6.0;
      next.hp = 70;
      next.shield = 0;
      return { nextState: next, enteredScarab: true, eliminated: false };
    }
    return { nextState: next, enteredScarab: false, eliminated: true };
  }

  return { nextState: next, enteredScarab: false, eliminated: false };
}

export function tickScarabRelic(
  state: ScarabRelicState,
  dt: number
): {
  nextState: ScarabRelicState;
  resurrected: boolean;
} {
  const next = { ...state };

  if (!next.isDownedScarab) {
    if (!next.relicReady && next.relicCooldown > 0) {
      next.relicCooldown = Math.max(0, next.relicCooldown - dt);
      if (next.relicCooldown === 0) {
        next.relicReady = true;
      }
    }
    return { nextState: next, resurrected: false };
  }

  next.scarabTimer = Math.max(0, next.scarabTimer - dt);
  if (next.scarabTimer === 0 && next.hp > 0) {
    next.isDownedScarab = false;
    next.hp = Math.round(next.maxHp * 0.65);
    next.shield = Math.round(next.maxShield * 0.6);
    return { nextState: next, resurrected: true };
  }

  return { nextState: next, resurrected: false };
}

export interface EnemyIntent {
  vx: number;
  vz: number;
  shouldStartWindup: boolean;
  preferredRange: number;
}

export function computeEnemyPolicyIntent(params: {
  policy: EnemyPolicyType;
  enemyX: number;
  enemyZ: number;
  targetX: number;
  targetZ: number;
  speed: number;
  strafeSign: number;
  attackCooldown: number;
  canAcquireAttackToken: boolean;
}): EnemyIntent {
  const dx = params.targetX - params.enemyX;
  const dz = params.targetZ - params.enemyZ;
  const dist = Math.hypot(dx, dz) || 0.001;
  const dirX = dx / dist;
  const dirZ = dz / dist;
  const perpX = -dirZ * params.strafeSign;
  const perpZ = dirX * params.strafeSign;

  let vx = 0;
  let vz = 0;
  let preferredRange = 18;
  let inAttackWindow = false;

  switch (params.policy) {
    case 'kiter_sniper': {
      preferredRange = 26;
      if (dist < 16) {
        vx = (-dirX * 0.85 + perpX * 0.35) * params.speed;
        vz = (-dirZ * 0.85 + perpZ * 0.35) * params.speed;
      } else if (dist > 32) {
        vx = (dirX * 0.8 + perpX * 0.3) * params.speed;
        vz = (dirZ * 0.8 + perpZ * 0.3) * params.speed;
      } else {
        vx = perpX * 0.55 * params.speed;
        vz = perpZ * 0.55 * params.speed;
      }
      inAttackWindow = dist >= 10 && dist <= 42;
      break;
    }

    case 'charger_vanguard': {
      preferredRange = 7;
      if (dist > 6.5) {
        vx = dirX * params.speed * 1.12;
        vz = dirZ * params.speed * 1.12;
      } else {
        vx = perpX * params.speed * 0.4;
        vz = perpZ * params.speed * 0.4;
      }
      inAttackWindow = dist <= 15;
      break;
    }

    case 'orbiter_assassin': {
      preferredRange = 12;
      const radialPush = dist > 14 ? 0.55 : dist < 8 ? -0.45 : 0.05;
      vx = (dirX * radialPush + perpX * 0.95) * params.speed * 1.15;
      vz = (dirZ * radialPush + perpZ * 0.95) * params.speed * 1.15;
      inAttackWindow = dist <= 22;
      break;
    }

    case 'area_weaver': {
      preferredRange = 19;
      const radialAdjust = dist > 23 ? 0.65 : dist < 13 ? -0.6 : 0;
      vx = (dirX * radialAdjust + perpX * 0.75) * params.speed;
      vz = (dirZ * radialAdjust + perpZ * 0.75) * params.speed;
      inAttackWindow = dist >= 8 && dist <= 32;
      break;
    }
  }

  const shouldStartWindup =
    inAttackWindow && params.attackCooldown <= 0 && params.canAcquireAttackToken;

  return {
    vx,
    vz,
    shouldStartWindup,
    preferredRange,
  };
}

export function computeCameraRelativeMovement(
  forwardInput: number,
  rightInput: number,
  camYaw: number
): { moveDirX: number; moveDirZ: number; isMoving: boolean } {
  const len = Math.hypot(forwardInput, rightInput);
  if (len < 0.001) {
    return { moveDirX: 0, moveDirZ: 0, isMoving: false };
  }
  const nf = forwardInput / len;
  const nr = rightInput / len;

  const fwdX = Math.sin(camYaw);
  const fwdZ = Math.cos(camYaw);
  const rightX = -Math.cos(camYaw);
  const rightZ = Math.sin(camYaw);

  const moveDirX = fwdX * nf + rightX * nr;
  const moveDirZ = fwdZ * nf + rightZ * nr;
  return {
    moveDirX,
    moveDirZ,
    isMoving: true,
  };
}

export function computeAimRayDirection(
  camYaw: number,
  camPitch: number
): { dirX: number; dirY: number; dirZ: number } {
  const clampedPitch = Math.max(-0.85, Math.min(0.85, camPitch));
  const cosPitch = Math.cos(clampedPitch);
  return {
    dirX: Math.sin(camYaw) * cosPitch,
    dirY: Math.sin(clampedPitch),
    dirZ: Math.cos(camYaw) * cosPitch,
  };
}

/**
 * Resolves horizontal actor collision against solid Obelisk bases and Sniper Perch stone pillars
 * when the actor is below the perch deck height.
 */
export function resolveObstacleCollision(
  x: number,
  z: number,
  actorY: number,
  actorRadius = 0.75
): { x: number; z: number; collided: boolean } {
  let outX = x;
  let outZ = z;
  let collided = false;

  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'temple_dais') continue;
    const baseG = groundHeightAt(plat.x, plat.z);
    const topY = baseG + plat.height;

    // If actor is already standing on top of the sniper perch, don't push them off the pillar
    if (plat.type === 'sniper_perch' && actorY >= topY - 1.5) {
      continue;
    }

    const obstacleRadius =
      plat.type === 'obelisk_base' ? plat.radius * 0.95 : plat.radius * 0.86;
    const minDist = obstacleRadius + actorRadius;
    const dx = outX - plat.x;
    const dz = outZ - plat.z;
    const dist = Math.hypot(dx, dz);

    if (dist < minDist) {
      const nx = dist > 0.0001 ? dx / dist : 1;
      const nz = dist > 0.0001 ? dz / dist : 0;
      outX = plat.x + nx * minDist;
      outZ = plat.z + nz * minDist;
      collided = true;
    }
  }

  return { x: outX, z: outZ, collided };
}

/**
 * Checks whether a 3D projectile at (x, y, z) hits a solid Obelisk or Sniper Perch column.
 */
export function checkProjectileObstacleHit(
  x: number,
  y: number,
  z: number
): { hit: boolean; obstacleName: string | null } {
  for (const plat of ARENA_PLATFORMS) {
    if (plat.type === 'temple_dais') continue;
    const baseG = groundHeightAt(plat.x, plat.z);
    const topY = baseG + plat.height;
    if (y > topY || y < baseG - 0.5) continue;

    const hitRadius =
      plat.type === 'obelisk_base' ? plat.radius * 0.85 : plat.radius * 0.82;
    const dist = Math.hypot(x - plat.x, z - plat.z);
    if (dist <= hitRadius) {
      return { hit: true, obstacleName: plat.name };
    }
  }
  return { hit: false, obstacleName: null };
}

export interface KillstreakTierInfo {
  streak: number;
  timer: number;
  title: string;
  arabicTitle: string;
  speedBonusRatio: number;
  damageBonusRatio: number;
  announcerCue: 'none' | 'double' | 'triple' | 'quadra' | 'rampage';
}

export function evaluateKillstreak(newStreak: number): KillstreakTierInfo {
  if (newStreak <= 1) {
    return {
      streak: newStreak,
      timer: 7.5,
      title: 'FIRST BLOOD',
      arabicTitle: 'الإصابة القاتلة الأولى',
      speedBonusRatio: 0,
      damageBonusRatio: 0,
      announcerCue: 'none',
    };
  }
  if (newStreak === 2) {
    return {
      streak: 2,
      timer: 8.0,
      title: 'DOUBLE KILL · TWIN HORUS STRIKE',
      arabicTitle: 'قتل مزدوج · ضربة حورس الثنائية',
      speedBonusRatio: 0.06,
      damageBonusRatio: 0.08,
      announcerCue: 'double',
    };
  }
  if (newStreak === 3) {
    return {
      streak: 3,
      timer: 8.5,
      title: 'TRIPLE KILL · SOLAR TRIAD',
      arabicTitle: 'قتل ثلاثي · ثالوث الشمس',
      speedBonusRatio: 0.1,
      damageBonusRatio: 0.14,
      announcerCue: 'triple',
    };
  }
  if (newStreak === 4) {
    return {
      streak: 4,
      timer: 9.0,
      title: 'QUADRA KILL · WRATH OF KARNAK',
      arabicTitle: 'قتل رباعي · غضب الكرنك',
      speedBonusRatio: 0.14,
      damageBonusRatio: 0.2,
      announcerCue: 'quadra',
    };
  }
  return {
    streak: newStreak,
    timer: 10.0,
    title: `PHARAOH RAMPAGE (${newStreak}x GODLIKE)`,
    arabicTitle: `هيمنة فرعونية مطلقة (${newStreak}x)`,
    speedBonusRatio: 0.18,
    damageBonusRatio: 0.25,
    announcerCue: 'rampage',
  };
}

/**
 * Computes relative screen-space angle (in degrees, where 0° is top/ahead, +90° is right, -90° is left, ±180° is behind)
 * for directional hit indicator arcs around the center crosshair.
 */
export function computeDirectionalDamageAngleDeg(
  playerX: number,
  playerZ: number,
  camYaw: number,
  attackerX: number,
  attackerZ: number
): number {
  const dx = attackerX - playerX;
  const dz = attackerZ - playerZ;
  if (Math.hypot(dx, dz) < 0.001) return 0;

  // Forward vector in world space is (sin(camYaw), cos(camYaw))
  // Right vector in world space is (-cos(camYaw), sin(camYaw))
  const fwdX = Math.sin(camYaw);
  const fwdZ = Math.cos(camYaw);
  const rightX = -Math.cos(camYaw);
  const rightZ = Math.sin(camYaw);

  const forwardDot = dx * fwdX + dz * fwdZ;
  const rightDot = dx * rightX + dz * rightZ;

  const angleRad = Math.atan2(rightDot, forwardDot);
  return (angleRad * 180) / Math.PI;
}

export interface CombatMedal {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  color: string;
}

export function evaluateCombatMedals(stats: {
  kills: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  maxSingleDamage: number;
  bestStreak: number;
  forgeLevel: number;
  bossesDefeated: number;
  chestsOpened: number;
  placementRank?: number;
}): CombatMedal[] {
  const medals: CombatMedal[] = [];
  const accuracy = stats.shotsFired > 0 ? stats.shotsHit / stats.shotsFired : 0;

  if (stats.placementRank !== undefined && stats.placementRank <= 5) {
    medals.push({
      id: 'solar_royale_champion',
      title: stats.placementRank === 1 ? '#1 / 100 Solar Champion' : `Top #${stats.placementRank} / 100 Survivor`,
      arabicTitle: stats.placementRank === 1 ? 'بطل الـ 100 مقاتل (#1)' : `من أفضل ${stats.placementRank} ناجين`,
      description:
        stats.placementRank === 1
          ? 'Outlasted all 99 rival Outriders in the 100-Player Battle Royale'
          : `Reached Rank #${stats.placementRank} out of 100 Outriders`,
      color: '#facc15',
    });
  }
  if (stats.headshots >= 3 || (stats.shotsFired >= 4 && accuracy >= 0.55)) {
    medals.push({
      id: 'horus_eye',
      title: 'Eye of Horus Sharpshooter',
      arabicTitle: 'عين حورس القناصة',
      description: 'High precision weak-point mastery',
      color: '#10b981',
    });
  }
  if (stats.bestStreak >= 3) {
    medals.push({
      id: 'solar_rampage',
      title: 'Solar Rampage Warlord',
      arabicTitle: 'سيد السلاسل القتالية',
      description: `Achieved a ${stats.bestStreak}x multi-kill streak`,
      color: '#f59e0b',
    });
  }
  if (stats.bossesDefeated >= 1) {
    medals.push({
      id: 'pharaoh_slayer',
      title: 'Colossus Pharaoh Slayer',
      arabicTitle: 'قاهر الحارس الفرعوني',
      description: 'Defeated the Solar Pharaoh Colossus Boss',
      color: '#facc15',
    });
  }
  if (stats.forgeLevel >= 2) {
    medals.push({
      id: 'forge_artisan',
      title: 'Sanctuary Forge Sovereign',
      arabicTitle: 'سيد حدادة خيبري',
      description: `Forged occupational weapons to Lv${stats.forgeLevel}`,
      color: '#38bdf8',
    });
  }
  if (stats.maxSingleDamage >= 85) {
    medals.push({
      id: 'high_caliber',
      title: 'Apex Caliber Executioner',
      arabicTitle: 'الضربة القاضية العظمى',
      description: `Dealt ${stats.maxSingleDamage} DMG in a single hit`,
      color: '#ec4899',
    });
  }
  if (stats.chestsOpened >= 1) {
    medals.push({
      id: 'relic_seeker',
      title: 'Golden Scarab Seeker',
      arabicTitle: 'صائد الكنوز الأسطورية',
      description: `Claimed ${stats.chestsOpened} Golden Reliquary Chests`,
      color: '#eab308',
    });
  }
  return medals;
}

// ============================================================================
// 100-PLAYER BATTLE ROYALE & SHRINKING SOLAR SANDSTORM RULES
// ============================================================================

export const TOTAL_BR_COMBATANTS = 100;

export interface SolarStormPhaseSpec {
  phase: number;
  name: string;
  arabicName: string;
  waitDuration: number;
  shrinkDuration: number;
  startRadius: number;
  targetRadius: number;
  damagePerSec: number;
}

export const SOLAR_STORM_PHASES: SolarStormPhaseSpec[] = [
  {
    phase: 1,
    name: 'PHASE 1 · OUTER DUNES',
    arabicName: 'المرحلة 1 · الكثبان الخارجية',
    waitDuration: 14,
    shrinkDuration: 22,
    startRadius: 130,
    targetRadius: 95,
    damagePerSec: 4,
  },
  {
    phase: 2,
    name: 'PHASE 2 · OBELISK RING',
    arabicName: 'المرحلة 2 · حلقة المسلات',
    waitDuration: 12,
    shrinkDuration: 20,
    startRadius: 95,
    targetRadius: 68,
    damagePerSec: 8,
  },
  {
    phase: 3,
    name: 'PHASE 3 · INNER COLONNADE',
    arabicName: 'المرحلة 3 · بهو الأعمدة',
    waitDuration: 10,
    shrinkDuration: 18,
    startRadius: 68,
    targetRadius: 44,
    damagePerSec: 14,
  },
  {
    phase: 4,
    name: 'PHASE 4 · KARNAK COURTYARD',
    arabicName: 'المرحلة 4 · ساحة الكرنك',
    waitDuration: 8,
    shrinkDuration: 16,
    startRadius: 44,
    targetRadius: 24,
    damagePerSec: 22,
  },
  {
    phase: 5,
    name: 'PHASE 5 · SOLAR SANCTUM',
    arabicName: 'المرحلة 5 · قلب المعبد المقدس',
    waitDuration: 6,
    shrinkDuration: 16,
    startRadius: 24,
    targetRadius: 10,
    damagePerSec: 35,
  },
];

export interface SolarStormState {
  phase: number;
  isShrinking: boolean;
  phaseTimer: number;
  currentRadius: number;
  targetRadius: number;
  damagePerSec: number;
  phaseName: string;
  arabicPhaseName: string;
}

export function computeSolarStormState(matchTimeSec: number): SolarStormState {
  let elapsed = Math.max(0, matchTimeSec);
  for (const p of SOLAR_STORM_PHASES) {
    if (elapsed < p.waitDuration) {
      return {
        phase: p.phase,
        isShrinking: false,
        phaseTimer: p.waitDuration - elapsed,
        currentRadius: p.startRadius,
        targetRadius: p.targetRadius,
        damagePerSec: p.damagePerSec,
        phaseName: p.name,
        arabicPhaseName: p.arabicName,
      };
    }
    elapsed -= p.waitDuration;

    if (elapsed < p.shrinkDuration) {
      const ratio = elapsed / p.shrinkDuration;
      const curRadius = p.startRadius + (p.targetRadius - p.startRadius) * ratio;
      return {
        phase: p.phase,
        isShrinking: true,
        phaseTimer: p.shrinkDuration - elapsed,
        currentRadius: Number(curRadius.toFixed(1)),
        targetRadius: p.targetRadius,
        damagePerSec: p.damagePerSec,
        phaseName: p.name,
        arabicPhaseName: p.arabicName,
      };
    }
    elapsed -= p.shrinkDuration;
  }

  const last = SOLAR_STORM_PHASES[SOLAR_STORM_PHASES.length - 1];
  return {
    phase: last.phase,
    isShrinking: false,
    phaseTimer: 0,
    currentRadius: last.targetRadius,
    targetRadius: last.targetRadius,
    damagePerSec: last.damagePerSec,
    phaseName: 'FINAL SANCTUM SHOWDOWN',
    arabicPhaseName: 'الحسم النهائي في قلب المعبد',
  };
}

export function computeBattleRoyaleRank(aliveRivalsCount: number, playerEliminated: boolean): number {
  const clampedRivals = Math.max(0, Math.min(TOTAL_BR_COMBATANTS - 1, aliveRivalsCount));
  return playerEliminated ? clampedRivals + 1 : clampedRivals + 1;
}

/**
 * Evaluates true 100-Player Battle Royale last-man-standing victory:
 * Victory triggers ONLY when all 99 rival combatants are eliminated (aliveRivalsCount <= 0)
 * while the local player is alive and not in Sandbox Practice mode.
 */
export function isBattleRoyaleVictory(
  aliveRivalsCount: number,
  playerEliminated: boolean,
  isSandboxMode = false
): boolean {
  if (isSandboxMode || playerEliminated) return false;
  return aliveRivalsCount <= 0;
}

/**
 * Resolves a safe destination for teleport, blink, and shadow-step abilities
 * ([Q] Dark Mirage, [E] Whirl Dance, etc.) so actors never clip inside solid
 * Obelisk bases or Sniper Perch stone pillars or outside the 135m arena perimeter.
 */
export function resolveSafeTeleportPosition(
  targetX: number,
  targetZ: number,
  currentY: number,
  actorRadius = 0.75
): { x: number; y: number; z: number; collided: boolean } {
  const maxRad = ARENA_RADIUS - 2.0;
  let clampedX = targetX;
  let clampedZ = targetZ;
  const distFromCenter = Math.hypot(clampedX, clampedZ);
  if (distFromCenter > maxRad && distFromCenter > 0.001) {
    clampedX = (clampedX / distFromCenter) * maxRad;
    clampedZ = (clampedZ / distFromCenter) * maxRad;
  }

  const col = resolveObstacleCollision(clampedX, clampedZ, currentY, actorRadius);
  const surf = getEffectiveSurfaceHeight(col.x, col.z, currentY);
  return {
    x: col.x,
    y: Math.max(surf.groundY, groundHeightAt(col.x, col.z)),
    z: col.z,
    collided: col.collided,
  };
}

/**
 * Performs 3D cylindrical hit detection between a projectile and a target actor,
 * preventing projectiles flying over elevated bridges/perches from hitting actors
 * standing on the ground below (and vice-versa), while accurately identifying headshots.
 */
export function checkProjectile3DHit(params: {
  projX: number;
  projY: number;
  projZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  isBoss?: boolean;
  isScopedShot?: boolean;
}): { hit: boolean; isHeadshot: boolean } {
  const hitRadius = params.isBoss ? 2.15 : 1.45;
  const hitHeight = params.isBoss ? 3.5 : 2.55;
  const horizDist = Math.hypot(params.projX - params.targetX, params.projZ - params.targetZ);
  const dy = params.projY - params.targetY;

  if (horizDist <= hitRadius && dy >= -0.05 && dy <= hitHeight) {
    const headshotThreshold = params.isBoss ? 2.2 : 1.5;
    const isHeadshot = dy >= headshotThreshold || Boolean(params.isScopedShot);
    return { hit: true, isHeadshot };
  }
  return { hit: false, isHeadshot: false };
}

/**
 * Selects living targets within a bounded tactical AoE radius sorted by proximity,
 * and caps the subset of targets that spawn heavy 3D VFX pillars/bursts so global
 * abilities never exhaust the particle or pillar pools in a 100-player match.
 */
export function selectBoundedAoETargets<
  T extends { id: string; x: number; z: number; koTimer: number; eliminated?: boolean }
>(
  originX: number,
  originZ: number,
  candidates: T[],
  maxRadius = 38,
  maxVfxCount = 6
): { affected: T[]; vfxTargets: T[] } {
  const maxRadSq = maxRadius * maxRadius;
  const scored: Array<{ target: T; distSq: number }> = [];

  for (const c of candidates) {
    if (c.koTimer > 0 || c.eliminated) continue;
    const dx = c.x - originX;
    const dz = c.z - originZ;
    const distSq = dx * dx + dz * dz;
    if (distSq <= maxRadSq) {
      scored.push({ target: c, distSq });
    }
  }

  scored.sort((a, b) => a.distSq - b.distSq);
  const affected = scored.map((s) => s.target);
  const vfxTargets = affected.slice(0, Math.max(0, maxVfxCount));
  return { affected, vfxTargets };
}

const EGYPTIAN_CALLSIGNS = [
  'Khaemwaset', 'Neferu', 'Amenhotep', 'Sobekhotep', 'Thutmose', 'Senusret', 'Hatshepsut',
  'Merneptah', 'Psamtik', 'Taharqa', 'Nectanebo', 'Ahmose', 'Kamose', 'Seti', 'Ramesses',
  'Horemheb', 'Ay', 'Akhenaten', 'Tiye', 'Nefertari', 'Ankhesenamun', 'Bakenkhonsu',
  'Paneb', 'Sennedjem', 'Imhotep', 'Hemiunu', 'Ptahhotep', 'Kagemni', 'Mereruka', 'Harkhuf',
  'Pepinakht', 'Weni', 'Sinuhe', 'Khnumhotep', 'Amenemhat', 'Mentuhotep', 'Intef', 'Seqenenre',
  'Djedi', 'Sneferu', 'Khufu', 'Khafre', 'Menkaure', 'Sahure', 'Userkaf', 'Unas', 'Teti',
  'Pepi', 'Nitocris', 'Narmer', 'Aha', 'Djer', 'Den', 'Khasekhemwy', 'Zoser', 'Huni',
  'Piankhi', 'Shabaka', 'Shebitku', 'Tanwetamani', 'Amasis', 'Apries', 'Necho', 'pedubast',
  'Osorkon', 'Shoshenq', 'Takelot', 'Smendes', 'Psusennes', 'Pinedjem', 'Herihor', 'Paser',
  'Rekhmire', 'Useramen', 'Ineni', 'Senmut', 'Hapu', 'Huy', 'Maya', 'Nakhtmin',
  'Pentawer', 'Kha', 'Merit', 'Yuya', 'Thuya', 'Maiherpri', 'wendjebauendjed', 'Hornakht',
  'Karomama', 'Shepenwepet', 'Amenirdis', 'Ankhnesneferibre', 'Nitocris-II', 'Berenice', 'Arsinoe',
  'Cleopatra', 'Ptolemy', 'Serapion', 'Apollodorus',
];

export interface GeneratedRivalTemplate {
  id: string;
  name: string;
  heroClass: HeroClassId;
  policy: EnemyPolicyType;
  spawnX: number;
  spawnZ: number;
}

export function generate100PlayerRoster(): GeneratedRivalTemplate[] {
  const classIds: HeroClassId[] = ['ranger', 'ragnar', 'bounty', 'assassin', 'mage', 'warrior', 'sniper'];
  const policies: EnemyPolicyType[] = ['kiter_sniper', 'charger_vanguard', 'orbiter_assassin', 'area_weaver'];
  const roster: GeneratedRivalTemplate[] = [];

  // First 6 iconic named champions near the inner-mid ring so the player sees immediate high-detail action
  const featured: Array<{ name: string; heroClass: HeroClassId; policy: EnemyPolicyType; x: number; z: number }> = [
    { name: 'Ragnar · Ghost Captain', heroClass: 'ragnar', policy: 'charger_vanguard', x: -16, z: -14 },
    { name: 'White · Bounty Hunter', heroClass: 'bounty', policy: 'kiter_sniper', x: 18, z: -15 },
    { name: 'Atlas · Raging King', heroClass: 'warrior', policy: 'charger_vanguard', x: -19, z: 12 },
    { name: 'Hasan-e · Assassin', heroClass: 'assassin', policy: 'orbiter_assassin', x: 19, z: 13 },
    { name: 'Lilith · Dark Succubus', heroClass: 'mage', policy: 'area_weaver', x: -26, z: -4 },
    { name: 'Chiyo · Ghost Huntress', heroClass: 'sniper', policy: 'kiter_sniper', x: 26, z: -3 },
  ];

  for (let i = 0; i < TOTAL_BR_COMBATANTS - 1; i++) {
    if (i < featured.length) {
      const f = featured[i];
      roster.push({
        id: `rival-${i}`,
        name: f.name,
        heroClass: f.heroClass,
        policy: f.policy,
        spawnX: f.x,
        spawnZ: f.z,
      });
      continue;
    }

    const heroClass = classIds[i % classIds.length];
    const policy = policies[i % policies.length];
    const callsign = EGYPTIAN_CALLSIGNS[i % EGYPTIAN_CALLSIGNS.length];
    const shortCls = HERO_CLASSES[heroClass].shortLabel;

    // Distribute remaining 93 combatants across 4 concentric tactical rings (28m to 118m) using golden angle
    const idxInOuter = i - featured.length;
    const goldenAngle = idxInOuter * 2.399963229728653;
    const ringTier = idxInOuter % 4; // 0: 30-48m, 1: 50-72m, 2: 74-96m, 3: 98-118m
    const baseRadius = 30 + ringTier * 22 + ((idxInOuter * 7) % 18);
    let sx = Math.cos(goldenAngle) * baseRadius;
    let sz = Math.sin(goldenAngle) * baseRadius;

    // Push outside any obstacle platform radius
    const resolved = resolveObstacleCollision(sx, sz, 0, 1.2);
    sx = Number(resolved.x.toFixed(1));
    sz = Number(resolved.z.toFixed(1));

    roster.push({
      id: `rival-${i}`,
      name: `${callsign} · ${shortCls} #${i + 2}`,
      heroClass,
      policy,
      spawnX: sx,
      spawnZ: sz,
    });
  }

  return roster;
}


