import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import {
  HeroClassId,
  WeaponSlotId,
  ARENA_PLATFORMS,
  SANCTUARY_SHRINES,
  ScarabPropKind,
  groundHeightAt,
} from './rules';
import sandstoneUrl from '../assets/images/egyptian_sandstone_tile_1793842861639.jpg';
import reliefUrl from '../assets/images/karnak_limestone_relief_1793842862324.jpg';

export type ProjectileVisualKind =
  | 'longbow_arrow'
  | 'chaser_bolt'
  | 'cutlass_wave'
  | 'naval_cannonball'
  | 'volcano_slug'
  | 'shotgun_pellet'
  | 'smg_tracer'
  | 'fly_dagger'
  | 'medusa_orb'
  | 'flame_meteor'
  | 'sea_trident'
  | 'vortex_wave'
  | 'phantom_rail'
  | 'psychic_kunai'
  | 'arc_bolt'
  | 'emp_orb'
  | 'frost_lance'
  | 'ice_shard'
  | 'rival_bolt';

export interface CharacterRig {
  root: THREE.Group;
  humanoidGroup: THREE.Group;
  pelvisGroup: THREE.Group;
  spineGroup: THREE.Group;
  mountGroup: THREE.Group;
  mountNeck: THREE.Group;
  mountTail: THREE.Mesh;
  mountLegs: THREE.Group[];
  scarabGroup: THREE.Group;
  dragonBodyGroup: THREE.Group;
  dragonWings: THREE.Mesh[];
  propDisguiseGroup: THREE.Group;
  ravenShadeGroup: THREE.Group;
  nightWingsGroup: THREE.Group;
  frontShieldGroup: THREE.Group;
  classAuraRing: THREE.Mesh;
  classAuraOrbitGroup: THREE.Group;
  classAuraDome: THREE.Mesh;
  whirlCycloneGroup: THREE.Group;
  statusBurnGroup: THREE.Group;
  statusStunGroup: THREE.Group;
  leftLeg: THREE.Group;
  leftKnee: THREE.Group;
  leftAnkle: THREE.Group;
  rightLeg: THREE.Group;
  rightKnee: THREE.Group;
  rightAnkle: THREE.Group;
  leftArm: THREE.Group;
  leftElbow: THREE.Group;
  rightArm: THREE.Group;
  rightElbow: THREE.Group;
  capeSegments: THREE.Group[];
  weaponGroup: THREE.Group;
  primaryWeaponMeshGroup: THREE.Group;
  secondaryWeaponMeshGroup: THREE.Group;
  forgeTierHaloRing: THREE.Mesh;
  forgeTierWingsGroup: THREE.Group;
  forgeTierCrownMesh: THREE.Mesh;
  muzzleFlashGroup: THREE.Group;
  nockedArrowGroup?: THREE.Group;
  bowUpperLimbGroup?: THREE.Group;
  bowLowerLimbGroup?: THREE.Group;
  rangerLaserSight?: THREE.Line;
  weaponSpinParts: THREE.Object3D[];
  bowString?: THREE.Line;
  headMesh: THREE.Group;
  cloakMeshes: THREE.Mesh[];
  bodyMaterials: THREE.MeshStandardMaterial[];
  telegraphRing?: THREE.Mesh;
  laserSight?: THREE.Line;
  overheadBarGroup?: THREE.Group;
  overheadHpFill?: THREE.Mesh;
  heroClass: HeroClassId;
}

export function getWeaponVisualKind(heroClass: HeroClassId, slot: WeaponSlotId): ProjectileVisualKind {
  switch (heroClass) {
    case 'ranger':
      return slot === 1 ? 'longbow_arrow' : 'chaser_bolt';
    case 'ragnar':
      return slot === 1 ? 'cutlass_wave' : 'naval_cannonball';
    case 'bounty':
      return slot === 1 ? 'volcano_slug' : 'shotgun_pellet';
    case 'assassin':
      return slot === 1 ? 'smg_tracer' : 'fly_dagger';
    case 'mage':
      return slot === 1 ? 'medusa_orb' : 'flame_meteor';
    case 'warrior':
      return slot === 1 ? 'sea_trident' : 'vortex_wave';
    case 'sniper':
      return slot === 1 ? 'phantom_rail' : 'psychic_kunai';
    case 'tesla':
      return slot === 1 ? 'arc_bolt' : 'emp_orb';
    case 'claudia':
      return slot === 1 ? 'frost_lance' : 'ice_shard';
  }
}

let _sharedHieroglyphTex: THREE.CanvasTexture | null = null;
export function createProceduralHieroglyphicGlowTexture(): THREE.CanvasTexture {
  if (_sharedHieroglyphTex) return _sharedHieroglyphTex;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#18120b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#fbbf24';
  ctx.fillStyle = '#fef08a';
  ctx.lineWidth = 3;

  for (let y = 16; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    for (let x = 24; x < 256; x += 64) {
      ctx.beginPath();
      ctx.arc(x, y + 32, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y + 32, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x - 18, y + 14);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x + 18, y + 14);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + 43);
      ctx.lineTo(x, y + 56);
      ctx.moveTo(x - 8, y + 49);
      ctx.lineTo(x + 8, y + 49);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  _sharedHieroglyphTex = tex;
  return tex;
}

export function createProceduralMicroReliefTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(65, 65, 65, 0.55)';
  ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const offset = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 64);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 3600; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    const shade = 96 + ((i * 29) % 68);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, 3, 2);
  }

  ctx.strokeStyle = 'rgba(215, 215, 215, 0.25)';
  ctx.lineWidth = 1.5;
  for (let y = 8; y < 512; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + 6, 340, y - 6, 512, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

let _sharedShadowTex: THREE.CanvasTexture | null = null;
export function createContactShadowDisc(radius = 1.05): THREE.Mesh {
  if (!_sharedShadowTex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    grad.addColorStop(0, 'rgba(10, 6, 3, 0.72)');
    grad.addColorStop(0.55, 'rgba(10, 6, 3, 0.32)');
    grad.addColorStop(1, 'rgba(10, 6, 3, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    _sharedShadowTex = new THREE.CanvasTexture(canvas);
  }
  const geo = new THREE.CircleGeometry(radius, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: _sharedShadowTex,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.02;
  return mesh;
}

/**
 * Builds a high-detail, multi-joint articulated 3D Hero Character Rig with:
 * - Hierarchical thigh->knee->shin->ankle and shoulder->elbow->forearm joints
 * - 12 Masterwork 3D Occupational Weapons (2 per class) with moving parts & 3D muzzle flash
 * - Multi-layer 3D Class Skill Aura (counter-rotating rune rings, 6 orbiting shards, & energy dome)
 * - 360° Whirl Dance Blade Cyclone & Raven Shade Orbiting Feathers
 */
export function createHeroRig(heroClass: HeroClassId, isRival = false): CharacterRig {
  const root = new THREE.Group();
  root.add(createContactShadowDisc(1.05));

  const humanoidGroup = new THREE.Group();
  humanoidGroup.scale.setScalar(0.88);

  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.92, 0);
  humanoidGroup.add(pelvisGroup);

  const spineGroup = new THREE.Group();
  spineGroup.position.set(0, 0.12, 0);
  pelvisGroup.add(spineGroup);

  const mountGroup = new THREE.Group();
  const scarabGroup = new THREE.Group();
  const dragonBodyGroup = new THREE.Group();
  const propDisguiseGroup = new THREE.Group();
  const ravenShadeGroup = new THREE.Group();
  const nightWingsGroup = new THREE.Group();
  const frontShieldGroup = new THREE.Group();
  const whirlCycloneGroup = new THREE.Group();
  const statusBurnGroup = new THREE.Group();
  const statusStunGroup = new THREE.Group();

  mountGroup.visible = false;
  scarabGroup.visible = false;
  propDisguiseGroup.visible = false;
  ravenShadeGroup.visible = false;
  nightWingsGroup.visible = false;
  frontShieldGroup.visible = false;
  whirlCycloneGroup.visible = false;
  statusBurnGroup.visible = false;
  statusStunGroup.visible = false;

  scarabGroup.add(dragonBodyGroup);
  scarabGroup.add(propDisguiseGroup);

  root.add(humanoidGroup);
  root.add(mountGroup);
  root.add(scarabGroup);
  root.add(ravenShadeGroup);
  root.add(frontShieldGroup);
  root.add(whirlCycloneGroup);
  root.add(statusBurnGroup);
  root.add(statusStunGroup);
  spineGroup.add(nightWingsGroup);

  const palette = {
    ranger: {
      cloak: isRival ? 0x7f1d1d : 0x065f46,
      armor: isRival ? 0xd97706 : 0xf59e0b,
      accent: isRival ? 0xef4444 : 0x10b981,
      linen: 0xf5ebd6,
      obsidian: 0x1c1917,
    },
    ragnar: {
      cloak: isRival ? 0x450a0a : 0x0b2922,
      armor: 0xfacc15,
      accent: 0x2dd4bf,
      linen: 0xfef08a,
      obsidian: 0x091512,
    },
    bounty: {
      cloak: isRival ? 0x451a03 : 0x431407,
      armor: 0xf59e0b,
      accent: 0xf97316,
      linen: 0xfef3c7,
      obsidian: 0x1c1917,
    },
    assassin: {
      cloak: isRival ? 0x3b0764 : 0x1e1b4b,
      armor: 0xeab308,
      accent: 0xa855f7,
      linen: 0xe2e8f0,
      obsidian: 0x0f172a,
    },
    mage: {
      cloak: isRival ? 0x4c0519 : 0x3b0764,
      armor: 0xf59e0b,
      accent: 0xc084fc,
      linen: 0xfce7f3,
      obsidian: 0x1e1b4b,
    },
    warrior: {
      cloak: isRival ? 0x450a0a : 0x0c4a6e,
      armor: 0xfacc15,
      accent: 0x0ea5e9,
      linen: 0xe0f2fe,
      obsidian: 0x0f172a,
    },
    sniper: {
      cloak: isRival ? 0x7c2d12 : 0x0f172a,
      armor: 0xf59e0b,
      accent: 0x22d3ee,
      linen: 0xe2e8f0,
      obsidian: 0x090d16,
    },
    tesla: {
      cloak: isRival ? 0x7c2d12 : 0x1e3a8a,
      armor: 0xfacc15,
      accent: 0x38bdf8,
      linen: 0xfef9c3,
      obsidian: 0x0f172a,
    },
    claudia: {
      cloak: isRival ? 0x4c0519 : 0x083344,
      armor: 0xe2e8f0,
      accent: 0x67e8f9,
      linen: 0xecfeff,
      obsidian: 0x0f172a,
    },
  }[heroClass];

  const hieroTex = createProceduralHieroglyphicGlowTexture();

  const clothMat = new THREE.MeshStandardMaterial({
    color: palette.cloak,
    roughness: 0.78,
    metalness: 0.12,
  });
  const linenMat = new THREE.MeshStandardMaterial({
    color: palette.linen,
    roughness: 0.72,
    metalness: 0.05,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: palette.armor,
    bumpMap: hieroTex,
    bumpScale: 0.04,
    roughness: 0.18,
    metalness: 0.94,
  });
  const obsidianMat = new THREE.MeshStandardMaterial({
    color: palette.obsidian,
    bumpMap: hieroTex,
    bumpScale: 0.05,
    emissive: palette.accent,
    emissiveMap: hieroTex,
    emissiveIntensity: 0.22,
    roughness: 0.32,
    metalness: 0.84,
  });
  const lapisAccentMat = new THREE.MeshStandardMaterial({
    color: palette.accent,
    emissive: palette.accent,
    emissiveIntensity: 0.78,
    roughness: 0.14,
    metalness: 0.62,
  });
  const solarGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.92,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xb87d52,
    roughness: 0.62,
    metalness: 0.06,
  });

  const bodyMaterials = [clothMat, linenMat, goldMat, obsidianMat, lapisAccentMat, skinMat];
  const cloakMeshes: THREE.Mesh[] = [];
  const weaponSpinParts: THREE.Object3D[] = [];

  // --- 3D ELEMENTAL STATUS EFFECTS ON BODY (Burn Flames & Stun/Root Crystal Cage) ---
  const burnFlameMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  });
  const burnInnerMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const flameConeGeo = new THREE.ConeGeometry(0.18, 0.75, 5);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const fMesh = new THREE.Mesh(flameConeGeo, i % 2 === 0 ? burnFlameMat : burnInnerMat);
    fMesh.position.set(Math.cos(a) * 0.42, 0.75 + (i % 2) * 0.35, Math.sin(a) * 0.42);
    statusBurnGroup.add(fMesh);
  }
  const burnRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.035, 8, 20).rotateX(Math.PI / 2),
    burnFlameMat
  );
  burnRing.position.y = 0.35;
  statusBurnGroup.add(burnRing);

  const stunCrystalMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const stunPrism = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), stunCrystalMat);
  stunPrism.scale.set(0.82, 1.45, 0.82);
  stunPrism.position.y = 1.15;
  const stunHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.04, 8, 24).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  stunHalo.position.y = 2.15;
  statusStunGroup.add(stunPrism, stunHalo);

  // --- UPGRADED 3D CLASS SKILL AURA (Runic Rings + 6 Orbiting Shards + Energy Shield Dome) ---
  const auraGeo = new THREE.RingGeometry(0.95, 1.52, 32);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: palette.accent,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const classAuraRing = new THREE.Mesh(auraGeo, auraMat);
  classAuraRing.position.y = 0.06;
  root.add(classAuraRing);

  const classAuraOrbitGroup = new THREE.Group();
  classAuraOrbitGroup.visible = false;
  const orbitCrystalGeo = new THREE.OctahedronGeometry(0.14, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const shard = new THREE.Mesh(orbitCrystalGeo, lapisAccentMat);
    shard.scale.set(0.7, 1.8, 0.7);
    shard.position.set(Math.cos(a) * 1.25, 0.9 + (i % 2) * 0.35, Math.sin(a) * 1.25);
    classAuraOrbitGroup.add(shard);
  }
  const innerRuneRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.03, 8, 28).rotateX(Math.PI / 2),
    lapisAccentMat
  );
  innerRuneRing.position.y = 0.14;
  classAuraOrbitGroup.add(innerRuneRing);
  root.add(classAuraOrbitGroup);

  const classAuraDome = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.38, 1),
    new THREE.MeshBasicMaterial({
      color: palette.accent,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
  );
  classAuraDome.position.y = 1.1;
  classAuraDome.visible = false;
  root.add(classAuraDome);

  // --- 360° WHIRL DANCE / BLADE CYCLONE SKILL VFX GROUP ---
  const cycloneBladeGeo = new THREE.ConeGeometry(0.12, 1.1, 4).rotateX(Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const blade = new THREE.Mesh(cycloneBladeGeo, lapisAccentMat);
    blade.position.set(Math.cos(angle) * 2.1, 1.05 + (i % 2) * 0.28, Math.sin(angle) * 2.1);
    blade.rotation.y = angle + Math.PI / 2;
    whirlCycloneGroup.add(blade);
  }
  const cycloneRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.045, 8, 32).rotateX(Math.PI / 2),
    lapisAccentMat
  );
  cycloneRing.position.y = 1.1;
  whirlCycloneGroup.add(cycloneRing);

  // --- RAGNAR'S 3D FORWARD POP-UP PIRATE BULWARK SHIELD ([Q] Sea Ward) ---
  frontShieldGroup.position.set(0, 1.18, 1.15);
  const shieldArcGeo = new THREE.CylinderGeometry(
    1.15,
    1.05,
    1.55,
    20,
    1,
    true,
    -Math.PI * 0.34,
    Math.PI * 0.68
  );
  const shieldBarrierMat = new THREE.MeshBasicMaterial({
    color: palette.accent,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shieldArcMesh = new THREE.Mesh(shieldArcGeo, shieldBarrierMat);
  const shieldRimTop = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.045, 8, 24, Math.PI * 0.68).rotateX(Math.PI / 2),
    goldMat
  );
  shieldRimTop.rotation.z = Math.PI * 0.16;
  shieldRimTop.position.y = 0.76;
  const shieldRimBot = shieldRimTop.clone();
  shieldRimBot.position.y = -0.76;
  const shieldCenterCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), goldMat);
  shieldCenterCrest.position.set(0, 0, 1.12);
  const shieldRuneRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.032, 8, 24),
    lapisAccentMat
  );
  shieldRuneRing.position.set(0, 0, 1.14);
  frontShieldGroup.add(shieldArcMesh, shieldRimTop, shieldRimBot, shieldCenterCrest, shieldRuneRing);

  // --- MULTI-JOINT ARTICULATED LEGS (Thigh -> Knee -> Shin/Greave -> Ankle/Boot) ---
  function buildArticulatedLeg(sideSign: number) {
    const hipGroup = new THREE.Group();
    hipGroup.position.set(sideSign * 0.17, 0, 0);

    const thighGeo = new THREE.CylinderGeometry(0.115, 0.095, 0.44, 12);
    thighGeo.translate(0, -0.22, 0);
    const thighMesh = new THREE.Mesh(thighGeo, clothMat);
    thighMesh.castShadow = true;
    hipGroup.add(thighMesh);

    const thighPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.16), goldMat);
    thighPlate.position.set(sideSign * 0.03, -0.2, 0.03);
    hipGroup.add(thighPlate);

    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.44, 0);
    hipGroup.add(kneeGroup);

    const kneeCap = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 1), goldMat);
    kneeCap.scale.set(0.9, 1.1, 0.8);
    kneeCap.position.set(0, 0, 0.06);
    kneeGroup.add(kneeCap);

    const shinGeo = new THREE.CylinderGeometry(0.092, 0.072, 0.44, 12);
    shinGeo.translate(0, -0.22, 0);
    const shinMesh = new THREE.Mesh(shinGeo, goldMat);
    shinMesh.castShadow = true;
    kneeGroup.add(shinMesh);

    const shinGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), lapisAccentMat);
    shinGem.position.set(0, -0.2, 0.085);
    kneeGroup.add(shinGem);

    const ankleGroup = new THREE.Group();
    ankleGroup.position.set(0, -0.44, 0);
    kneeGroup.add(ankleGroup);

    const bootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.28), obsidianMat);
    bootMesh.position.set(0, -0.02, 0.05);
    const bootToe = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6).rotateX(Math.PI / 2), goldMat);
    bootToe.position.set(0, -0.01, 0.21);
    ankleGroup.add(bootMesh, bootToe);

    return { hipGroup, kneeGroup, ankleGroup };
  }

  const leftLegParts = buildArticulatedLeg(-1);
  const rightLegParts = buildArticulatedLeg(1);
  pelvisGroup.add(leftLegParts.hipGroup, rightLegParts.hipGroup);

  const leftLeg = leftLegParts.hipGroup;
  const leftKnee = leftLegParts.kneeGroup;
  const leftAnkle = leftLegParts.ankleGroup;
  const rightLeg = rightLegParts.hipGroup;
  const rightKnee = rightLegParts.kneeGroup;
  const rightAnkle = rightLegParts.ankleGroup;

  // --- ROYAL EGYPTIAN SHENDYT KILT & BELT GIRDLE ---
  const kiltPoints = [
    new THREE.Vector2(0.25, 0),
    new THREE.Vector2(0.32, 0.22),
    new THREE.Vector2(0.22, 0.44),
  ];
  const kiltGeo = new THREE.LatheGeometry(kiltPoints, 16);
  const kiltMesh = new THREE.Mesh(kiltGeo, linenMat);
  kiltMesh.position.set(0, -0.28, 0);
  kiltMesh.castShadow = true;
  pelvisGroup.add(kiltMesh);
  cloakMeshes.push(kiltMesh);

  const beltMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.045, 8, 20).rotateX(Math.PI / 2),
    goldMat
  );
  beltMesh.position.set(0, 0.08, 0);
  pelvisGroup.add(beltMesh);

  const sashMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.04), clothMat);
  sashMesh.position.set(0, -0.14, 0.24);
  const sashTrim = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), lapisAccentMat);
  sashTrim.position.set(0, 0.06, 0.26);
  pelvisGroup.add(sashMesh, sashTrim);

  // --- SCULPTED TORSO CUIRASS, PECTORAL ARMOR & USEKH COLLAR ---
  const torsoGeo = new THREE.CylinderGeometry(0.28, 0.21, 0.68, 14);
  const torsoMesh = new THREE.Mesh(torsoGeo, clothMat);
  torsoMesh.position.set(0, 0.34, 0);
  torsoMesh.castShadow = true;
  spineGroup.add(torsoMesh);
  cloakMeshes.push(torsoMesh);

  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.18), obsidianMat);
  chestPlate.position.set(0, 0.44, 0.14);
  const chestCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 1), lapisAccentMat);
  chestCore.position.set(0, 0.45, 0.24);
  spineGroup.add(chestPlate, chestCore);

  // Ragnar's Cursed Ghost Pirate Glowing Golden Ribcage & Crossed Cutlass Baldric
  if (heroClass === 'ragnar') {
    for (let r = 0; r < 3; r++) {
      const ribArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.24 - r * 0.02, 0.022, 6, 16, Math.PI * 0.85).rotateX(Math.PI / 2),
        goldMat
      );
      ribArc.position.set(0, 0.54 - r * 0.1, 0.06);
      ribArc.rotation.z = Math.PI * 0.075;
      spineGroup.add(ribArc);
    }
    const sternumBone = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.32, 0.04), solarGlowMat);
    sternumBone.position.set(0, 0.44, 0.24);
    spineGroup.add(sternumBone);
  }

  const collarGeo = new THREE.TorusGeometry(0.27, 0.058, 10, 24);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, goldMat);
  collarMesh.position.set(0, 0.65, 0);
  spineGroup.add(collarMesh);

  [-1, 1].forEach((s) => {
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
      goldMat
    );
    pauldron.position.set(s * 0.33, 0.62, 0);
    pauldron.rotation.z = -s * 0.45;
    const pauldronFin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), lapisAccentMat);
    pauldronFin.position.set(s * 0.42, 0.7, -0.04);
    pauldronFin.rotation.z = -s * 0.65;
    spineGroup.add(pauldron, pauldronFin);
  });

  // --- HEAD & CLASS-SPECIFIC ICONIC HEADGEAR SILHOUETTE ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.88, 0);
  spineGroup.add(headGroup);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 14), skinMat);
  headSphere.castShadow = true;
  headGroup.add(headSphere);

  const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.055, 0.14), lapisAccentMat);
  visorMesh.position.set(0, 0.02, 0.14);
  headGroup.add(visorMesh);

  if (heroClass === 'ranger') {
    const hoodMesh = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.46, 12), clothMat);
    hoodMesh.position.set(0, 0.12, -0.03);
    hoodMesh.rotation.x = -0.24;
    const circlet = new THREE.Mesh(
      new THREE.TorusGeometry(0.195, 0.025, 8, 18).rotateX(Math.PI / 2),
      goldMat
    );
    circlet.position.set(0, 0.08, 0.02);
    const plume1 = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.42, 6), lapisAccentMat);
    plume1.position.set(0.14, 0.28, -0.08);
    plume1.rotation.set(-0.48, 0, -0.32);
    const plume2 = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.34, 6), goldMat);
    plume2.position.set(0.18, 0.22, -0.14);
    plume2.rotation.set(-0.62, 0, -0.42);
    headGroup.add(hoodMesh, circlet, plume1, plume2);
  } else if (heroClass === 'ragnar') {
    // Ragnar's Iconic Cursed Pirate King Tricorn Captain Hat with Golden Trim & Spectral Plume
    const tricornBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.06, 3), obsidianMat);
    tricornBrim.position.set(0, 0.15, 0.02);
    tricornBrim.rotation.y = Math.PI;
    const tricornGoldRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.026, 6, 3).rotateX(Math.PI / 2),
      goldMat
    );
    tricornGoldRim.position.set(0, 0.18, 0.02);
    tricornGoldRim.rotation.z = Math.PI / 6;
    const captainCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.22, 12), clothMat);
    captainCrown.position.set(0, 0.22, 0);
    const skullCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), goldMat);
    skullCrest.position.set(0, 0.22, 0.22);
    const ghostPlume = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.46, 6), lapisAccentMat);
    ghostPlume.position.set(-0.16, 0.34, -0.1);
    ghostPlume.rotation.set(-0.55, 0, 0.36);
    headGroup.add(tricornBrim, tricornGoldRim, captainCrown, skullCrest, ghostPlume);
  } else if (heroClass === 'bounty') {
    const brimMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 20), obsidianMat);
    brimMesh.position.set(0, 0.12, 0);
    brimMesh.rotation.z = 0.06;
    const crownMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.24, 14), clothMat);
    crownMesh.position.set(0, 0.23, 0);
    const hatBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.205, 0.025, 8, 18).rotateX(Math.PI / 2),
      goldMat
    );
    hatBand.position.set(0, 0.14, 0);
    headGroup.add(brimMesh, crownMesh, hatBand);
  } else if (heroClass === 'mage') {
    const hornCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 0.1, 0),
      new THREE.Vector3(-0.28, 0.26, -0.05),
      new THREE.Vector3(-0.22, 0.46, 0.08),
    ]);
    const hornCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.14, 0.1, 0),
      new THREE.Vector3(0.28, 0.26, -0.05),
      new THREE.Vector3(0.22, 0.46, 0.08),
    ]);
    const hornL = new THREE.Mesh(new THREE.TubeGeometry(hornCurveL, 12, 0.038, 8, false), obsidianMat);
    const hornR = new THREE.Mesh(new THREE.TubeGeometry(hornCurveR, 12, 0.038, 8, false), obsidianMat);
    const diadem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), lapisAccentMat);
    diadem.position.set(0, 0.18, 0.16);
    headGroup.add(hornL, hornR, diadem);
  } else if (heroClass === 'warrior') {
    const nemesMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.28), goldMat);
    nemesMesh.position.set(0, 0.06, -0.04);
    const crestCenter = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 6), lapisAccentMat);
    crestCenter.position.set(0, 0.32, 0.06);
    headGroup.add(nemesMesh, crestCenter);
  } else if (heroClass === 'tesla') {
    // Tesla's Arc Engineer Helmet + Twin Copper Induction Coils
    const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 14), goldMat);
    capMesh.position.set(0, 0.14, 0);
    const coilL = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), lapisAccentMat);
    coilL.position.set(-0.22, 0.24, 0);
    coilL.rotation.y = Math.PI / 2;
    const coilR = coilL.clone();
    coilR.position.x = 0.22;
    const antenna = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), solarGlowMat);
    antenna.position.set(0, 0.34, 0.06);
    headGroup.add(capMesh, coilL, coilR, antenna);
  } else if (heroClass === 'claudia') {
    // Claudia's Glacial Tiara Crown + Floating Frost Crystal Halo
    const tiara = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.028, 8, 20).rotateX(Math.PI / 2),
      goldMat
    );
    tiara.position.set(0, 0.14, 0);
    for (let c = -1; c <= 1; c++) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, c === 0 ? 0.36 : 0.24, 4),
        lapisAccentMat
      );
      spire.position.set(c * 0.12, 0.28, 0.12 - Math.abs(c) * 0.04);
      spire.rotation.z = -c * 0.25;
      headGroup.add(spire);
    }
    headGroup.add(tiara);
  } else {
    const hoodMesh = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.42, 10), obsidianMat);
    hoodMesh.position.set(0, 0.1, -0.02);
    const earGeo = new THREE.ConeGeometry(0.055, 0.28, 5);
    const earL = new THREE.Mesh(earGeo, lapisAccentMat);
    earL.position.set(-0.14, 0.28, 0);
    const earR = new THREE.Mesh(earGeo, lapisAccentMat);
    earR.position.set(0.14, 0.28, 0);
    headGroup.add(hoodMesh, earL, earR);
  }

  // --- 3-SEGMENT FLOWING CLOTH CAPE ---
  const capeSegments: THREE.Group[] = [];
  let parentCapeNode: THREE.Object3D = spineGroup;
  const segHeights = [0.38, 0.38, 0.36];
  const segWidths = [0.46, 0.52, 0.58];
  for (let i = 0; i < 3; i++) {
    const segGroup = new THREE.Group();
    if (i === 0) {
      segGroup.position.set(0, 0.62, -0.22);
    } else {
      segGroup.position.set(0, -segHeights[i - 1], 0);
    }
    const segGeo = new THREE.BoxGeometry(segWidths[i], segHeights[i], 0.03);
    segGeo.translate(0, -segHeights[i] / 2, 0);
    const segMesh = new THREE.Mesh(segGeo, i === 2 ? goldMat : clothMat);
    segMesh.castShadow = true;
    segGroup.add(segMesh);
    cloakMeshes.push(segMesh);
    parentCapeNode.add(segGroup);
    parentCapeNode = segGroup;
    capeSegments.push(segGroup);
  }

  if (heroClass === 'ranger') {
    const quiverGroup = new THREE.Group();
    quiverGroup.position.set(0.18, 0.44, -0.26);
    quiverGroup.rotation.z = -0.32;
    const quiverBody = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.68, 10), goldMat);
    quiverGroup.add(quiverBody);
    for (let a = -1; a <= 1; a++) {
      const fletch = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 5), lapisAccentMat);
      fletch.position.set(a * 0.035, 0.4, 0);
      quiverGroup.add(fletch);
    }
    spineGroup.add(quiverGroup);
  }

  // Lilith's Sculpted Night Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(0.45, 0.38, 0.95, 0.22);
  wingShape.quadraticCurveTo(0.7, -0.1, 0.55, -0.32);
  wingShape.quadraticCurveTo(0.28, -0.15, 0, -0.22);
  wingShape.closePath();
  const extrudeWingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  const nWingL = new THREE.Mesh(extrudeWingGeo, lapisAccentMat);
  nWingL.position.set(-0.15, 0.52, -0.24);
  nWingL.rotation.y = Math.PI - 0.25;
  const nWingR = new THREE.Mesh(extrudeWingGeo, lapisAccentMat);
  nWingR.position.set(0.15, 0.52, -0.24);
  nWingR.rotation.y = 0.25;
  nightWingsGroup.add(nWingL, nWingR);
  if (heroClass === 'mage') {
    nightWingsGroup.visible = true;
  }

  // --- 2-SEGMENT ARTICULATED ARMS ---
  function buildArticulatedArm(sideSign: number) {
    const shoulderGroup = new THREE.Group();
    shoulderGroup.position.set(sideSign * 0.33, 0.56, 0);

    const upperArmGeo = new THREE.CylinderGeometry(0.075, 0.062, 0.32, 10);
    upperArmGeo.rotateX(Math.PI / 2);
    upperArmGeo.translate(0, 0, 0.16);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, skinMat);
    shoulderGroup.add(upperArmMesh);

    const elbowGroup = new THREE.Group();
    elbowGroup.position.set(0, 0, 0.32);
    shoulderGroup.add(elbowGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.068, 0.055, 0.32, 10);
    forearmGeo.rotateX(Math.PI / 2);
    forearmGeo.translate(0, 0, 0.16);
    const forearmMesh = new THREE.Mesh(forearmGeo, goldMat);
    elbowGroup.add(forearmMesh);

    const vambraceGem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.18), lapisAccentMat);
    vambraceGem.position.set(sideSign * 0.04, 0.03, 0.16);
    elbowGroup.add(vambraceGem);

    return { shoulderGroup, elbowGroup };
  }

  const leftArmParts = buildArticulatedArm(-1);
  const rightArmParts = buildArticulatedArm(1);
  spineGroup.add(leftArmParts.shoulderGroup, rightArmParts.shoulderGroup);

  const leftArm = leftArmParts.shoulderGroup;
  const leftElbow = leftArmParts.elbowGroup;
  const rightArm = rightArmParts.shoulderGroup;
  const rightElbow = rightArmParts.elbowGroup;

  // --- MASTERWORK 12 OCCUPATIONAL WEAPONS (Slot 1 Primary & Slot 2 Secondary) ---
  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0, 0.46, 0.56);
  spineGroup.add(weaponGroup);

  const primaryWeaponMeshGroup = new THREE.Group();
  const secondaryWeaponMeshGroup = new THREE.Group();
  secondaryWeaponMeshGroup.visible = false;
  weaponGroup.add(primaryWeaponMeshGroup, secondaryWeaponMeshGroup);

  // --- SANCTUARY FORGE TIER EVOLUTION ATTACHMENTS (Lv1 Halo, Lv2 Horus Wings, Lv3 Solar Crown) ---
  const forgeTierHaloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.018, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.88 })
  );
  forgeTierHaloRing.position.set(0, 0.04, 0.25);
  forgeTierHaloRing.visible = false;
  weaponGroup.add(forgeTierHaloRing);

  const forgeTierWingsGroup = new THREE.Group();
  forgeTierWingsGroup.position.set(0, 0.08, 0.22);
  forgeTierWingsGroup.visible = false;
  [-1, 1].forEach((side) => {
    const wPivot = new THREE.Group();
    for (let f = 0; f < 3; f++) {
      const feather = new THREE.Mesh(
        new THREE.ConeGeometry(0.042, 0.36 - f * 0.06, 4),
        f === 0 ? goldMat : lapisAccentMat
      );
      feather.position.set(side * (0.16 + f * 0.08), 0.1 + f * 0.06, -f * 0.05);
      feather.rotation.z = -side * (0.65 + f * 0.22);
      feather.rotation.x = -0.25;
      wPivot.add(feather);
    }
    forgeTierWingsGroup.add(wPivot);
  });
  weaponGroup.add(forgeTierWingsGroup);

  const forgeTierCrownMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 1),
    solarGlowMat
  );
  forgeTierCrownMesh.position.set(0, 0.34, 0.28);
  forgeTierCrownMesh.visible = false;
  weaponGroup.add(forgeTierCrownMesh);

  // 3D Starburst Muzzle Flash / Energy Release Burst attached to weapon tip
  const muzzleFlashGroup = new THREE.Group();
  muzzleFlashGroup.position.set(0, 0.05, 0.85);
  muzzleFlashGroup.visible = false;
  const flashCone1 = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9 })
  );
  flashCone1.scale.set(1.2, 0.35, 2.2);
  const flashCone2 = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.24, 0),
    new THREE.MeshBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.85 })
  );
  flashCone2.scale.set(0.35, 1.2, 2.2);
  const flashRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.035, 8, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  muzzleFlashGroup.add(flashCone1, flashCone2, flashRing);
  weaponGroup.add(muzzleFlashGroup);

  let bowString: THREE.Line | undefined;
  let nockedArrowGroup: THREE.Group | undefined;
  let bowUpperLimbGroup: THREE.Group | undefined;
  let bowLowerLimbGroup: THREE.Group | undefined;
  let rangerLaserSight: THREE.Line | undefined;
  const arrowShaftGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.96, 8).rotateX(Math.PI / 2);

  if (heroClass === 'ranger') {
    // =========================================================================
    // [1] CROSS LONGBOW (Robin's Masterwork Recurve Solar Bow + Articulated Flexing Limbs)
    // =========================================================================
    const riserGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.42, 12), obsidianMat);
    riserGrip.position.set(0, 0, 0.21);
    const riserWingGuard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.14), goldMat);
    riserWingGuard.position.set(0, 0, 0.24);
    primaryWeaponMeshGroup.add(riserGrip, riserWingGuard);

    bowUpperLimbGroup = new THREE.Group();
    bowUpperLimbGroup.position.set(0, 0.16, 0.2);
    const upperCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.36, -0.04),
      new THREE.Vector3(0, 0.72, -0.42),
    ]);
    const upperLimbMesh = new THREE.Mesh(new THREE.TubeGeometry(upperCurve, 18, 0.042, 10, false), goldMat);
    const upperWingBlade = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.36, 4), lapisAccentMat);
    upperWingBlade.position.set(0, 0.56, -0.18);
    upperWingBlade.rotation.x = -0.42;
    const upperTipGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), solarGlowMat);
    upperTipGem.position.set(0, 0.72, -0.42);
    bowUpperLimbGroup.add(upperLimbMesh, upperWingBlade, upperTipGem);
    primaryWeaponMeshGroup.add(bowUpperLimbGroup);

    bowLowerLimbGroup = new THREE.Group();
    bowLowerLimbGroup.position.set(0, -0.16, 0.2);
    const lowerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.36, -0.04),
      new THREE.Vector3(0, -0.72, -0.42),
    ]);
    const lowerLimbMesh = new THREE.Mesh(new THREE.TubeGeometry(lowerCurve, 18, 0.042, 10, false), goldMat);
    const lowerWingBlade = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.36, 4), lapisAccentMat);
    lowerWingBlade.position.set(0, -0.56, -0.18);
    lowerWingBlade.rotation.x = Math.PI + 0.42;
    const lowerTipGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), solarGlowMat);
    lowerTipGem.position.set(0, -0.72, -0.42);
    bowLowerLimbGroup.add(lowerLimbMesh, lowerWingBlade, lowerTipGem);
    primaryWeaponMeshGroup.add(bowLowerLimbGroup);

    const sightRingOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.016, 8, 24),
      lapisAccentMat
    );
    sightRingOuter.position.set(0, 0.13, 0.3);
    const sightRingInner = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.012, 8, 20),
      goldMat
    );
    sightRingInner.position.set(0, 0.13, 0.3);
    primaryWeaponMeshGroup.add(sightRingOuter, sightRingInner);
    weaponSpinParts.push(sightRingOuter, sightRingInner);

    const rLaserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.02, 0.4),
      new THREE.Vector3(0, 0.02, 26.0),
    ]);
    const rLaserMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.0,
    });
    rangerLaserSight = new THREE.Line(rLaserGeo, rLaserMat);
    primaryWeaponMeshGroup.add(rangerLaserSight);

    nockedArrowGroup = new THREE.Group();
    const arrowMesh = new THREE.Mesh(arrowShaftGeo, goldMat);
    arrowMesh.position.set(0, 0, 0.28);
    const arrowTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.26, 6).rotateX(Math.PI / 2),
      lapisAccentMat
    );
    arrowTip.position.set(0, 0, 0.84);
    const arrowChargeSpiral1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.015, 6, 18),
      lapisAccentMat
    );
    arrowChargeSpiral1.position.set(0, 0, 0.7);
    const arrowChargeSpiral2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.012, 6, 16),
      solarGlowMat
    );
    arrowChargeSpiral2.position.set(0, 0, 0.52);
    weaponSpinParts.push(arrowChargeSpiral1, arrowChargeSpiral2);
    nockedArrowGroup.add(arrowMesh, arrowTip, arrowChargeSpiral1, arrowChargeSpiral2);
    primaryWeaponMeshGroup.add(nockedArrowGroup);

    const stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.88, -0.22),
      new THREE.Vector3(0, 0, -0.18),
      new THREE.Vector3(0, -0.88, -0.22),
    ]);
    bowString = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0xfef08a }));
    primaryWeaponMeshGroup.add(bowString);

    // =========================================================================
    // [2] CHASER BOLT (Repeating 3-Bolt Mechanical Crossbow with Spinning Drum & Stirrup)
    // =========================================================================
    const stockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.17, 0.92), obsidianMat);
    stockMesh.position.set(0, -0.04, 0.08);
    const railTrim = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.8), goldMat);
    railTrim.position.set(0, 0.05, 0.14);
    const cockingStirrup = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.016, 8, 18, Math.PI).rotateX(Math.PI / 2),
      goldMat
    );
    cockingStirrup.position.set(0, 0.02, 0.56);
    secondaryWeaponMeshGroup.add(stockMesh, railTrim, cockingStirrup);

    const prodCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, 0.03, 0.16),
      new THREE.Vector3(-0.3, 0.03, 0.45),
      new THREE.Vector3(0, 0.03, 0.5),
      new THREE.Vector3(0.3, 0.03, 0.45),
      new THREE.Vector3(0.62, 0.03, 0.16),
    ]);
    secondaryWeaponMeshGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(prodCurve, 24, 0.04, 10, false), goldMat)
    );

    const drumMag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.24, 8).rotateX(Math.PI / 2),
      lapisAccentMat
    );
    drumMag.position.set(0, -0.08, 0.22);
    const xbowSight = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.014, 8, 18),
      lapisAccentMat
    );
    xbowSight.position.set(0, 0.15, 0.22);
    secondaryWeaponMeshGroup.add(drumMag, xbowSight);
    weaponSpinParts.push(drumMag, xbowSight);

    [-0.095, 0, 0.095].forEach((offsetX) => {
      const boltMesh = new THREE.Mesh(arrowShaftGeo, lapisAccentMat);
      boltMesh.scale.set(0.85, 0.85, 0.74);
      boltMesh.position.set(offsetX, 0.08, 0.26);
      secondaryWeaponMeshGroup.add(boltMesh);
    });
  } else if (heroClass === 'ragnar') {
    // =========================================================================
    // [1] SPECTRAL CUTLASS (Ragnar's Curved Pirate Scimitar with Skull Basket-Hilt & Ghost-Fire Edge)
    // =========================================================================
    const cutlassGroup = new THREE.Group();
    cutlassGroup.position.set(0.18, -0.04, 0.16);
    cutlassGroup.rotation.set(0.28, 0.12, -0.18);

    const hiltGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.34, 10), obsidianMat);
    hiltGrip.position.set(0, -0.18, 0);
    const skullPommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.068, 1), goldMat);
    skullPommel.position.set(0, -0.37, 0);
    const basketGuard = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 10, 0, Math.PI, 0, Math.PI * 0.75),
      goldMat
    );
    basketGuard.position.set(0, -0.05, 0.03);
    basketGuard.rotation.x = -Math.PI * 0.35;
    const crossGuard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.28), goldMat);
    crossGuard.position.set(0, -0.01, 0.02);

    const bladeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.0, 0.0),
      new THREE.Vector3(0, 0.42, 0.06),
      new THREE.Vector3(0, 0.86, 0.02),
      new THREE.Vector3(0, 1.24, -0.14),
    ]);
    const spineTube = new THREE.Mesh(
      new THREE.TubeGeometry(bladeCurve, 20, 0.038, 8, false),
      obsidianMat
    );
    spineTube.scale.set(0.45, 1.0, 1.55);

    const edgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0.05),
      new THREE.Vector3(0, 0.44, 0.14),
      new THREE.Vector3(0, 0.88, 0.11),
      new THREE.Vector3(0, 1.28, -0.1),
    ]);
    const spectralEdge = new THREE.Mesh(
      new THREE.TubeGeometry(edgeCurve, 20, 0.026, 6, false),
      lapisAccentMat
    );
    spectralEdge.scale.set(0.35, 1.0, 1.8);

    const cutlassTip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.26, 4), lapisAccentMat);
    cutlassTip.position.set(0, 1.32, -0.15);
    cutlassTip.rotation.x = -0.35;

    const cutlassRuneRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.018, 8, 22).rotateX(Math.PI / 2),
      lapisAccentMat
    );
    cutlassRuneRing.position.set(0, 0.55, 0.06);
    weaponSpinParts.push(cutlassRuneRing);

    cutlassGroup.add(
      hiltGrip,
      skullPommel,
      basketGuard,
      crossGuard,
      spineTube,
      spectralEdge,
      cutlassTip,
      cutlassRuneRing
    );
    primaryWeaponMeshGroup.add(cutlassGroup);

    // =========================================================================
    // [2] NAVAL CANNON (Ragnar's Heavy Bronze-and-Bone Handheld Broadside Cannon)
    // =========================================================================
    const cannonGroup = new THREE.Group();
    cannonGroup.position.set(0, -0.02, 0.18);

    const barrelBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.21, 1.08, 16).rotateX(Math.PI / 2),
      obsidianMat
    );
    barrelBody.position.set(0, 0.04, 0.26);

    const flaredMuzzle = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.038, 10, 22),
      goldMat
    );
    flaredMuzzle.position.set(0, 0.04, 0.8);

    [-0.1, 0.25, 0.58].forEach((zBand) => {
      const boneBand = new THREE.Mesh(
        new THREE.TorusGeometry(0.195 - zBand * 0.03, 0.024, 8, 20),
        goldMat
      );
      boneBand.position.set(0, 0.04, zBand);
      cannonGroup.add(boneBand);
    });

    const breechCascabel = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), goldMat);
    breechCascabel.position.set(0, 0.04, -0.34);

    const furnaceCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 1),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    furnaceCore.position.set(0, 0.04, 0.72);
    weaponSpinParts.push(furnaceCore);

    const skullMuzzleSight = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), lapisAccentMat);
    skullMuzzleSight.position.set(0, 0.23, 0.72);

    cannonGroup.add(barrelBody, flaredMuzzle, breechCascabel, furnaceCore, skullMuzzleSight);
    secondaryWeaponMeshGroup.add(cannonGroup);
  } else if (heroClass === 'bounty') {
    // =========================================================================
    // [1] VOLCANO TWINS (Dual Magma Flintlock Revolvers with Spinning Lava Cylinders)
    // =========================================================================
    const pistolBarrelGeo = new THREE.CylinderGeometry(0.042, 0.046, 0.58, 12).rotateX(Math.PI / 2);
    [-0.28, 0.28].forEach((ox) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(ox, 0, 0);
      const pBarrel = new THREE.Mesh(pistolBarrelGeo, goldMat);
      pBarrel.position.set(0, 0.06, 0.24);
      const underBlade = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.34, 4).rotateX(Math.PI / 2),
        obsidianMat
      );
      underBlade.position.set(0, -0.02, 0.32);
      const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.2, 0.11), obsidianMat);
      pGrip.position.set(0, -0.06, 0.0);
      pGrip.rotation.x = -0.25;
      const lavaCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.058, 0.14, 6).rotateX(Math.PI / 2),
        lapisAccentMat
      );
      lavaCylinder.position.set(0, 0.05, 0.08);
      weaponSpinParts.push(lavaCylinder);
      const muzzleCrown = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 14), lapisAccentMat);
      muzzleCrown.position.set(0, 0.06, 0.53);
      pGroup.add(pBarrel, underBlade, pGrip, lavaCylinder, muzzleCrown);
      primaryWeaponMeshGroup.add(pGroup);
    });

    // =========================================================================
    // [2] DOUBLE-BARRELED SHOTGUN (Twin Dragon-Breath Heavy Scattergun)
    // =========================================================================
    const sgBarrelGeo = new THREE.CylinderGeometry(0.058, 0.064, 1.04, 12).rotateX(Math.PI / 2);
    [-0.068, 0.068].forEach((ox) => {
      const barrel = new THREE.Mesh(sgBarrelGeo, goldMat);
      barrel.position.set(ox, 0.05, 0.28);
      const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.018, 8, 16), lapisAccentMat);
      muzzleRing.position.set(ox, 0.05, 0.8);
      secondaryWeaponMeshGroup.add(barrel, muzzleRing);
    });
    const sgReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.52), obsidianMat);
    sgReceiver.position.set(0, -0.01, -0.06);
    const furnaceCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 1), lapisAccentMat);
    furnaceCore.position.set(0, 0.08, 0.08);
    weaponSpinParts.push(furnaceCore);
    secondaryWeaponMeshGroup.add(sgReceiver, furnaceCore);
  } else if (heroClass === 'assassin') {
    // =========================================================================
    // [1] BLADED SMG (Dual Cyber-Pharaoh Scythe-Bayonet Submachine Guns)
    // =========================================================================
    const smgGeo = new THREE.BoxGeometry(0.1, 0.18, 0.68);
    const scytheBladeGeo = new THREE.ConeGeometry(0.08, 0.58, 4).rotateX(Math.PI / 2);
    [-0.27, 0.27].forEach((ox) => {
      const smgGroup = new THREE.Group();
      smgGroup.position.set(ox, 0, 0);
      const body = new THREE.Mesh(smgGeo, obsidianMat);
      body.position.set(0, 0, 0.16);
      const goldRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.56), goldMat);
      goldRail.position.set(0, 0.08, 0.18);
      const plasmaMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.09), lapisAccentMat);
      plasmaMag.position.set(0, -0.16, 0.22);
      plasmaMag.rotation.x = 0.28;
      const bayonet = new THREE.Mesh(scytheBladeGeo, lapisAccentMat);
      bayonet.position.set(0, -0.09, 0.54);
      const energyRotor = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 16), goldMat);
      energyRotor.position.set(0, 0.02, 0.5);
      weaponSpinParts.push(energyRotor);
      smgGroup.add(body, goldRail, plasmaMag, bayonet, energyRotor);
      primaryWeaponMeshGroup.add(smgGroup);
    });

    // =========================================================================
    // [2] FLY DAGGERS (5 Levitating Diamond-Edge Kunai in a Spinning Fan Array)
    // =========================================================================
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 0.06, 0.28);
    const daggerBladeGeo = new THREE.ConeGeometry(0.065, 0.56, 4).rotateX(Math.PI / 2);
    for (let i = -2; i <= 2; i++) {
      const dPivot = new THREE.Group();
      dPivot.position.set(i * 0.14, Math.abs(i) * -0.03, Math.abs(i) * -0.05);
      dPivot.rotation.y = i * 0.12;
      const blade = new THREE.Mesh(daggerBladeGeo, lapisAccentMat);
      const pommelRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.045, 0.012, 8, 14).rotateX(Math.PI / 2),
        goldMat
      );
      pommelRing.position.set(0, 0, -0.3);
      dPivot.add(blade, pommelRing);
      fanGroup.add(dPivot);
    }
    const fanHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.014, 8, 24),
      lapisAccentMat
    );
    fanGroup.add(fanHalo);
    weaponSpinParts.push(fanHalo);
    secondaryWeaponMeshGroup.add(fanGroup);
  } else if (heroClass === 'mage') {
    // =========================================================================
    // [1] MEDUSAGAZER (Abyssal Scepter with Dual Counter-Rotating Gyroscope Rings)
    // =========================================================================
    const staffGeo = new THREE.CylinderGeometry(0.034, 0.028, 1.75, 12);
    const staffShaft = new THREE.Mesh(staffGeo, goldMat);
    primaryWeaponMeshGroup.add(staffShaft);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.88, 0);
    const outerGyro = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 10, 28), obsidianMat);
    const innerGyro = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 10, 24), goldMat);
    innerGyro.rotation.x = Math.PI / 3;
    const medusaCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 1), lapisAccentMat);
    headPivot.add(outerGyro, innerGyro, medusaCore);
    weaponSpinParts.push(outerGyro, innerGyro, medusaCore);
    primaryWeaponMeshGroup.add(headPivot);

    // =========================================================================
    // [2] FLAME STAFF (Twin-Horned Hellfire Staff with Levitating Solar-Magma Core)
    // =========================================================================
    const flameShaft = new THREE.Mesh(staffGeo.clone(), obsidianMat);
    secondaryWeaponMeshGroup.add(flameShaft);
    const flameHead = new THREE.Group();
    flameHead.position.set(0, 0.9, 0);
    const magmaSun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), lapisAccentMat);
    const sunCage = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.26, 0.024, 36, 8),
      goldMat
    );
    flameHead.add(magmaSun, sunCage);
    weaponSpinParts.push(sunCage);
    secondaryWeaponMeshGroup.add(flameHead);
  } else if (heroClass === 'warrior') {
    // =========================================================================
    // [1] POLEARM OF THE RAGING SEA (Colossal 3-Pronged Royal Poseidon Trident)
    // =========================================================================
    const tridentGroup = new THREE.Group();
    tridentGroup.rotation.x = Math.PI / 2.6;
    const poleMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 2.05, 12), goldMat);
    tridentGroup.add(poleMesh);

    const crossGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.048, 10, 20, Math.PI),
      goldMat
    );
    crossGuard.position.set(0, 0.78, 0);
    tridentGroup.add(crossGuard);

    // 3 Razor Hydro-Crystal Prongs
    const centerSpear = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.62, 6), lapisAccentMat);
    centerSpear.position.set(0, 1.18, 0);
    const leftProng = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.48, 6), lapisAccentMat);
    leftProng.position.set(-0.26, 1.08, 0);
    leftProng.rotation.z = 0.14;
    const rightProng = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.48, 6), lapisAccentMat);
    rightProng.position.set(0.26, 1.08, 0);
    rightProng.rotation.z = -0.14;
    const hydroRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.022, 8, 24).rotateX(Math.PI / 2),
      lapisAccentMat
    );
    hydroRing.position.set(0, 0.92, 0);
    weaponSpinParts.push(hydroRing);
    tridentGroup.add(centerSpear, leftProng, rightProng, hydroRing);
    primaryWeaponMeshGroup.add(tridentGroup);

    // =========================================================================
    // [2] VORTEX BURSTING (Heavy Atlantean Hydro-Turbine Wave Cannon)
    // =========================================================================
    const cannonShroud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.19, 0.96, 14).rotateX(Math.PI / 2),
      obsidianMat
    );
    cannonShroud.position.set(0, 0.04, 0.22);
    const goldBanding = new THREE.Mesh(
      new THREE.TorusGeometry(0.175, 0.028, 8, 20),
      goldMat
    );
    goldBanding.position.set(0, 0.04, 0.56);
    const turbineRotor = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.15, 0),
      lapisAccentMat
    );
    turbineRotor.position.set(0, 0.04, 0.64);
    weaponSpinParts.push(turbineRotor);
    secondaryWeaponMeshGroup.add(cannonShroud, goldBanding, turbineRotor);
  } else if (heroClass === 'tesla') {
    // =========================================================================
    // [1] ARC COIL LAUNCHER (Tesla's Triple-Ring Magnetic Lightning Rifle)
    // =========================================================================
    const coilCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.085, 1.15, 14).rotateX(Math.PI / 2),
      obsidianMat
    );
    coilCore.position.set(0, 0.04, 0.28);
    primaryWeaponMeshGroup.add(coilCore);
    [0.05, 0.36, 0.68].forEach((zPos, idx) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.14 - idx * 0.015, 0.024, 8, 22),
        idx % 2 === 0 ? goldMat : lapisAccentMat
      );
      ring.position.set(0, 0.04, zPos);
      primaryWeaponMeshGroup.add(ring);
      weaponSpinParts.push(ring);
    });
    const sparkTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 1), solarGlowMat);
    sparkTip.position.set(0, 0.04, 0.88);
    weaponSpinParts.push(sparkTip);
    primaryWeaponMeshGroup.add(sparkTip);

    // =========================================================================
    // [2] EMP PULSE CANNON (Heavy Twin-Capacitor Plasma Orb Launcher)
    // =========================================================================
    const empBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.86), goldMat);
    empBody.position.set(0, 0.02, 0.22);
    const empOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), lapisAccentMat);
    empOrb.position.set(0, 0.05, 0.74);
    const empCage = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 8, 24), solarGlowMat);
    empCage.position.set(0, 0.05, 0.74);
    weaponSpinParts.push(empOrb, empCage);
    secondaryWeaponMeshGroup.add(empBody, empOrb, empCage);
  } else if (heroClass === 'claudia') {
    // =========================================================================
    // [1] GLACIAL SCEPTER (Claudia's Cryo-Crystal Archmage Staff)
    // =========================================================================
    const cryoShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 1.72, 12), goldMat);
    primaryWeaponMeshGroup.add(cryoShaft);
    const cryoCrown = new THREE.Group();
    cryoCrown.position.set(0, 0.88, 0);
    const frostDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), lapisAccentMat);
    frostDiamond.scale.set(0.85, 1.45, 0.85);
    const frostRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.022, 8, 24), goldMat);
    const frostRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 8, 20), lapisAccentMat);
    frostRing2.rotation.x = Math.PI / 2;
    cryoCrown.add(frostDiamond, frostRing1, frostRing2);
    weaponSpinParts.push(frostRing1, frostRing2);
    primaryWeaponMeshGroup.add(cryoCrown);

    // =========================================================================
    // [2] FROSTBITE SHARDS (3 Levitating Sub-Zero Ice Prisms)
    // =========================================================================
    const shardGeo = new THREE.OctahedronGeometry(0.12, 0);
    [-0.24, 0, 0.24].forEach((ox, idx) => {
      const sMesh = new THREE.Mesh(shardGeo, lapisAccentMat);
      sMesh.scale.set(0.65, 1.85, 0.65);
      sMesh.position.set(ox, 0.1 + (idx === 1 ? 0.14 : 0), 0.34);
      weaponSpinParts.push(sMesh);
      secondaryWeaponMeshGroup.add(sMesh);
    });
  } else {
    // =========================================================================
    // [1] PHANTOM LONGRIFLE (Chiyo's Magnetic Accelerator Rail-Sniper Rifle)
    // =========================================================================
    const barrelMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.05, 1.62, 12).rotateX(Math.PI / 2),
      goldMat
    );
    barrelMesh.position.set(0, 0.04, 0.36);
    const rifleChassis = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.17, 0.64), obsidianMat);
    rifleChassis.position.set(0, -0.02, -0.12);
    const opticScope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.46, 12).rotateX(Math.PI / 2),
      lapisAccentMat
    );
    opticScope.position.set(0, 0.14, 0.14);
    primaryWeaponMeshGroup.add(barrelMesh, rifleChassis, opticScope);

    // 3 Floating Magnetic Accelerator Coils along the Barrel
    [0.35, 0.68, 1.0].forEach((zPos) => {
      const accelCoil = new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.016, 8, 18),
        lapisAccentMat
      );
      accelCoil.position.set(0, 0.04, zPos);
      primaryWeaponMeshGroup.add(accelCoil);
      weaponSpinParts.push(accelCoil);
    });

    // =========================================================================
    // [2] PSYCHIC KUNAI (3 Telekinetic Spirit Daggers with Spinning Mandala Halos)
    // =========================================================================
    const kunaiGeo = new THREE.ConeGeometry(0.068, 0.52, 4).rotateX(Math.PI / 2);
    [-0.22, 0, 0.22].forEach((ox, idx) => {
      const kGroup = new THREE.Group();
      kGroup.position.set(ox, idx === 1 ? 0.14 : 0.02, 0.28);
      const blade = new THREE.Mesh(kunaiGeo, lapisAccentMat);
      const sealRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.09, 0.012, 6, 16),
        goldMat
      );
      sealRing.position.set(0, 0, -0.18);
      weaponSpinParts.push(sealRing);
      kGroup.add(blade, sealRing);
      secondaryWeaponMeshGroup.add(kGroup);
    });
  }

  // --- RAVEN SHADE / CLASS STEALTH ORBITING FEATHERS ---
  const featherGeo = new THREE.ConeGeometry(0.08, 0.36, 4).rotateX(Math.PI / 2);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const fMesh = new THREE.Mesh(featherGeo, lapisAccentMat);
    fMesh.position.set(Math.cos(angle) * 0.9, 0.85 + (i % 3) * 0.32, Math.sin(angle) * 0.9);
    fMesh.rotation.y = angle + Math.PI / 2;
    ravenShadeGroup.add(fMesh);
  }

  // --- ARTICULATED DESERT RAPTOR MOUNT ([V]) ---
  const mountBodyGeo = new THREE.CapsuleGeometry(0.32, 1.15, 8, 14).rotateX(Math.PI / 2);
  const mountBody = new THREE.Mesh(mountBodyGeo, clothMat);
  mountBody.position.set(0, 0.78, 0);
  mountGroup.add(mountBody);

  const saddleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.18, 0.64), goldMat);
  saddleMesh.position.set(0, 1.06, -0.05);
  mountGroup.add(saddleMesh);

  const mountNeck = new THREE.Group();
  mountNeck.position.set(0, 0.95, 0.48);
  mountGroup.add(mountNeck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.62, 10), clothMat);
  neckMesh.position.set(0, 0.22, 0.12);
  neckMesh.rotation.x = 0.45;
  mountNeck.add(neckMesh);

  const snoutMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.54, 10).rotateX(Math.PI / 2),
    goldMat
  );
  snoutMesh.position.set(0, 0.46, 0.42);
  mountNeck.add(snoutMesh);

  const crestGeo = new THREE.ConeGeometry(0.06, 0.38, 6);
  const crestL = new THREE.Mesh(crestGeo, lapisAccentMat);
  crestL.position.set(-0.1, 0.68, 0.22);
  const crestR = new THREE.Mesh(crestGeo, lapisAccentMat);
  crestR.position.set(0.1, 0.68, 0.22);
  mountNeck.add(crestL, crestR);

  const mountTail = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.95, 8).rotateX(-Math.PI / 2),
    goldMat
  );
  mountTail.position.set(0, 0.78, -0.92);
  mountGroup.add(mountTail);

  const mountLegs: THREE.Group[] = [];
  const mLegGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.72, 10);
  mLegGeo.translate(0, -0.36, 0);
  [
    [-0.24, 0.72, 0.45],
    [0.24, 0.72, 0.45],
    [-0.24, 0.72, -0.45],
    [0.24, 0.72, -0.45],
  ].forEach(([lx, ly, lz]) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, ly, lz);
    legPivot.add(new THREE.Mesh(mLegGeo, goldMat));
    mountGroup.add(legPivot);
    mountLegs.push(legPivot);
  });

  // --- BABY DRAGON REVIVAL FORM + PROP DISGUISE ---
  const dBody = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), lapisAccentMat);
  dBody.scale.set(0.95, 0.8, 1.25);
  dBody.position.set(0, 0.45, 0);
  dragonBodyGroup.add(dBody);

  const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), goldMat);
  dHead.position.set(0, 0.72, 0.38);
  dragonBodyGroup.add(dHead);

  const dHornGeo = new THREE.ConeGeometry(0.05, 0.22, 6);
  const dHornL = new THREE.Mesh(dHornGeo, lapisAccentMat);
  dHornL.position.set(-0.12, 0.94, 0.34);
  const dHornR = new THREE.Mesh(dHornGeo, lapisAccentMat);
  dHornR.position.set(0.12, 0.94, 0.34);
  dragonBodyGroup.add(dHornL, dHornR);

  const dTail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 8).rotateX(-Math.PI / 2), goldMat);
  dTail.position.set(0, 0.4, -0.58);
  dragonBodyGroup.add(dTail);

  const wingGeo = new THREE.BoxGeometry(0.62, 0.04, 0.36);
  const wingL = new THREE.Mesh(wingGeo, goldMat);
  wingL.position.set(-0.48, 0.62, -0.02);
  wingL.rotation.z = 0.32;
  const wingR = new THREE.Mesh(wingGeo, goldMat);
  wingR.position.set(0.48, 0.62, -0.02);
  wingR.rotation.z = -0.32;
  dragonBodyGroup.add(wingL, wingR);
  const dragonWings = [wingL, wingR];

  // 3-Mode Environmental Prop Disguises inside propDisguiseGroup:
  // [0] Amphora Urn, [1] Sandstone Boulder, [2] Mini Obelisk Pillar
  const amphoraProp = new THREE.Group();
  const urnPoints = [
    new THREE.Vector2(0.02, 0),
    new THREE.Vector2(0.28, 0.08),
    new THREE.Vector2(0.42, 0.45),
    new THREE.Vector2(0.22, 0.82),
    new THREE.Vector2(0.3, 1.02),
  ];
  const urnMesh = new THREE.Mesh(new THREE.LatheGeometry(urnPoints, 14), linenMat);
  urnMesh.castShadow = true;
  const urnRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.045, 8, 16).rotateX(Math.PI / 2),
    goldMat
  );
  urnRim.position.y = 0.98;
  amphoraProp.add(urnMesh, urnRim);

  const boulderProp = new THREE.Group();
  const boulderMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 1), linenMat);
  boulderMesh.scale.set(1.25, 0.88, 1.15);
  boulderMesh.position.y = 0.48;
  boulderProp.add(boulderMesh);
  boulderProp.visible = false;

  const obeliskProp = new THREE.Group();
  const miniShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.35, 4), obsidianMat);
  miniShaft.rotation.y = Math.PI / 4;
  miniShaft.position.y = 0.68;
  const miniCap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.38, 4), goldMat);
  miniCap.rotation.y = Math.PI / 4;
  miniCap.position.y = 1.54;
  obeliskProp.add(miniShaft, miniCap);
  obeliskProp.visible = false;

  propDisguiseGroup.add(amphoraProp, boulderProp, obeliskProp);

  let telegraphRing: THREE.Mesh | undefined;
  let laserSight: THREE.Line | undefined;
  let overheadBarGroup: THREE.Group | undefined;
  let overheadHpFill: THREE.Mesh | undefined;

  if (isRival) {
    const ringGeo = new THREE.RingGeometry(1.15, 1.48, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    telegraphRing = new THREE.Mesh(ringGeo, ringMat);
    telegraphRing.position.y = 0.05;
    root.add(telegraphRing);

    const sightGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 1.5, 28),
    ]);
    const sightMat = new THREE.LineBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.0,
    });
    laserSight = new THREE.Line(sightGeo, sightMat);
    root.add(laserSight);

    overheadBarGroup = new THREE.Group();
    overheadBarGroup.position.set(0, 2.55, 0);
    const bgPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.24, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x0a0705, side: THREE.DoubleSide })
    );
    const fillGeo = new THREE.PlaneGeometry(1.18, 0.11);
    fillGeo.translate(0.59, 0, 0.01);
    overheadHpFill = new THREE.Mesh(
      fillGeo,
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    overheadHpFill.position.x = -0.59;
    overheadBarGroup.add(bgPlane, overheadHpFill);
    root.add(overheadBarGroup);
  }

  return {
    root,
    humanoidGroup,
    pelvisGroup,
    spineGroup,
    mountGroup,
    mountNeck,
    mountTail,
    mountLegs,
    scarabGroup,
    dragonBodyGroup,
    dragonWings,
    propDisguiseGroup,
    ravenShadeGroup,
    nightWingsGroup,
    frontShieldGroup,
    classAuraRing,
    classAuraOrbitGroup,
    classAuraDome,
    whirlCycloneGroup,
    statusBurnGroup,
    statusStunGroup,
    leftLeg,
    leftKnee,
    leftAnkle,
    rightLeg,
    rightKnee,
    rightAnkle,
    leftArm,
    leftElbow,
    rightArm,
    rightElbow,
    capeSegments,
    weaponGroup,
    primaryWeaponMeshGroup,
    secondaryWeaponMeshGroup,
    forgeTierHaloRing,
    forgeTierWingsGroup,
    forgeTierCrownMesh,
    muzzleFlashGroup,
    nockedArrowGroup,
    bowUpperLimbGroup,
    bowLowerLimbGroup,
    rangerLaserSight,
    weaponSpinParts,
    bowString,
    headMesh: headGroup,
    cloakMeshes,
    bodyMaterials,
    telegraphRing,
    laserSight,
    overheadBarGroup,
    overheadHpFill,
    heroClass,
  };
}

/**
 * Updates full multi-joint procedural animation + weapon recoil/spin/slash/reload/inspect/swap kinematics +
 * Sanctuary Forge evolution visuals + 3D Skill Aura & Elemental Status effects on a CharacterRig.
 */
export function updateCharacterVisualState(
  rig: CharacterRig,
  params: {
    isCamouflaged: boolean;
    isMounted: boolean;
    isDownedScarab: boolean;
    isPropDisguised?: boolean;
    propDisguiseKind?: ScarabPropKind;
    isGliding?: boolean;
    isLocalScoped?: boolean;
    isAuraActive?: boolean;
    auraType?:
      | 'none'
      | 'steady_aim'
      | 'vintage_wine'
      | 'whirl_dance'
      | 'waters_curse'
      | 'bulwark_shield'
      | 'corsair_surge'
      | 'magnetic_surge'
      | 'ice_block';
    activeWeaponSlot?: WeaponSlotId;
    forgeLevel?: number;
    armorTier?: number;
    weaponRecoilTimer?: number;
    weaponSwapTimer?: number;
    weaponReloadTimer?: number;
    weaponInspectTimer?: number;
    burnActive?: boolean;
    stunActive?: boolean;
    hitFlashTimer: number;
    drawCharge: number;
    walkPhase: number;
    speedRatio: number;
    strafeRatio?: number;
    dashProgress?: number;
    airborneVy?: number;
    idleTime?: number;
    hpRatio?: number;
    cameraQuaternion?: THREE.Quaternion;
  }
) {
  const spd = Math.min(1.5, Math.max(0, params.speedRatio));
  const tIdle = params.idleTime ?? params.walkPhase * 0.5;
  const strafe = params.strafeRatio ?? 0;
  const dashProg = params.dashProgress ?? 0;
  const airVy = params.airborneVy ?? 0;
  const isAirborne = Math.abs(airVy) > 0.6 || Boolean(params.isGliding);
  const recoil = Math.max(0, params.weaponRecoilTimer ?? 0);
  const swapTimer = Math.max(0, params.weaponSwapTimer ?? 0);
  const reloadTimer = Math.max(0, params.weaponReloadTimer ?? 0);
  const inspectTimer = Math.max(0, params.weaponInspectTimer ?? 0);
  const forgeLv = Math.max(0, params.forgeLevel ?? 0);

  if (rig.overheadBarGroup && rig.overheadHpFill) {
    if (params.hpRatio !== undefined) {
      rig.overheadHpFill.scale.x = Math.max(0.001, Math.min(1, params.hpRatio));
    }
    if (params.cameraQuaternion) {
      rig.overheadBarGroup.quaternion.copy(params.cameraQuaternion);
    }
  }

  // --- 3D ELEMENTAL STATUS EFFECTS (BURN & STUN/FREEZE) ---
  rig.statusBurnGroup.visible = Boolean(params.burnActive && !params.isDownedScarab);
  if (rig.statusBurnGroup.visible) {
    rig.statusBurnGroup.rotation.y = tIdle * 6.5;
    for (let i = 0; i < rig.statusBurnGroup.children.length - 1; i++) {
      const flame = rig.statusBurnGroup.children[i];
      const fScale = 0.75 + Math.sin(tIdle * 14 + i * 1.4) * 0.35;
      flame.scale.set(1, fScale, 1);
    }
  }

  rig.statusStunGroup.visible = Boolean(params.stunActive && !params.isDownedScarab);
  if (rig.statusStunGroup.visible) {
    rig.statusStunGroup.rotation.y = -tIdle * 4.2;
    if (rig.statusStunGroup.children[1]) {
      rig.statusStunGroup.children[1].rotation.z = tIdle * 8.0;
    }
  }

  rig.scarabGroup.visible = params.isDownedScarab;
  if (params.isDownedScarab) {
    const pKind = params.propDisguiseKind ?? (params.isPropDisguised ? 'amphora' : 'none');
    const disguised = pKind !== 'none';
    rig.dragonBodyGroup.visible = !disguised;
    rig.propDisguiseGroup.visible = disguised;
    if (disguised && rig.propDisguiseGroup.children.length >= 3) {
      rig.propDisguiseGroup.children[0].visible = pKind === 'amphora';
      rig.propDisguiseGroup.children[1].visible = pKind === 'boulder';
      rig.propDisguiseGroup.children[2].visible = pKind === 'obelisk';
    }
    rig.dragonBodyGroup.position.y = 0.15 + Math.sin(tIdle * 5.5) * 0.1;
    const flap = Math.sin(tIdle * 14.0) * 0.55;
    if (rig.dragonWings[0]) rig.dragonWings[0].rotation.z = 0.25 + flap;
    if (rig.dragonWings[1]) rig.dragonWings[1].rotation.z = -0.25 - flap;
  }

  rig.humanoidGroup.visible = !params.isDownedScarab && !params.isLocalScoped;
  rig.mountGroup.visible = !params.isDownedScarab && params.isMounted && !params.isLocalScoped;
  rig.nightWingsGroup.visible =
    !params.isLocalScoped && (rig.heroClass === 'mage' || Boolean(params.isGliding));
  if (params.isGliding) {
    rig.nightWingsGroup.scale.setScalar(1.65);
  } else {
    rig.nightWingsGroup.scale.setScalar(1.0);
  }

  const slot = params.activeWeaponSlot || 1;
  rig.primaryWeaponMeshGroup.visible = slot === 1;
  rig.secondaryWeaponMeshGroup.visible = slot === 2;

  // --- SANCTUARY FORGE TIER EVOLUTION (Lv1 Halo, Lv2 Horus Wings, Lv3 Solar Crown + Emissive Boost) ---
  rig.forgeTierHaloRing.visible = forgeLv >= 1;
  rig.forgeTierWingsGroup.visible = forgeLv >= 2;
  rig.forgeTierCrownMesh.visible = forgeLv >= 3;
  if (rig.forgeTierHaloRing.visible) {
    rig.forgeTierHaloRing.rotation.z = tIdle * (3.2 + forgeLv * 1.5);
    const hScale = 1.0 + Math.min(3, forgeLv) * 0.08 + Math.sin(tIdle * 5.0) * 0.04;
    rig.forgeTierHaloRing.scale.setScalar(hScale);
  }
  if (rig.forgeTierWingsGroup.visible) {
    const wingPulse = Math.sin(tIdle * 4.5) * 0.12;
    if (rig.forgeTierWingsGroup.children[0]) rig.forgeTierWingsGroup.children[0].rotation.y = wingPulse;
    if (rig.forgeTierWingsGroup.children[1]) rig.forgeTierWingsGroup.children[1].rotation.y = -wingPulse;
  }
  if (rig.forgeTierCrownMesh.visible) {
    rig.forgeTierCrownMesh.rotation.y = tIdle * 5.0;
    rig.forgeTierCrownMesh.position.y = 0.34 + Math.sin(tIdle * 6.0) * 0.03;
  }

  // Continuously animate spinning weapon sub-components (gyroscopes, drums, accelerator coils, rotors)
  const spinRate =
    2.8 +
    params.drawCharge * 6.0 +
    forgeLv * 1.5 +
    (recoil > 0 ? 9.0 : 0) +
    (reloadTimer > 0 ? 14.0 : 0);
  for (let i = 0; i < rig.weaponSpinParts.length; i++) {
    const part = rig.weaponSpinParts[i];
    if (i % 2 === 0) {
      part.rotation.z = tIdle * spinRate;
    } else {
      part.rotation.y = -tIdle * spinRate * 0.85;
    }
  }

  // 3D Muzzle Flash / Energy Recharge Burst visibility & scale
  if ((recoil > 0.04 || (reloadTimer > 0.05 && reloadTimer < 0.22)) && !params.isLocalScoped) {
    rig.muzzleFlashGroup.visible = true;
    const fScale =
      reloadTimer > 0
        ? 0.55 + Math.sin(reloadTimer * 25) * 0.25
        : 0.65 + (recoil / 0.18) * 0.9 + Math.min(0.4, forgeLv * 0.12);
    rig.muzzleFlashGroup.scale.setScalar(fScale);
    rig.muzzleFlashGroup.rotation.z = tIdle * 24;
  } else {
    rig.muzzleFlashGroup.visible = false;
  }

  rig.ravenShadeGroup.visible = params.isCamouflaged && !params.isLocalScoped;
  if (rig.ravenShadeGroup.visible) {
    rig.ravenShadeGroup.rotation.y += 0.09;
  }

  // 3D Class Skill Aura, Legendary Lv4 Pharaoh Gold Aura, Bulwark Pop-Up Shield & Whirl Dance Blade Cyclone
  const auraMat = rig.classAuraRing.material as THREE.MeshBasicMaterial;
  const hasLegendaryArmorAura = (params.armorTier ?? 1) >= 4 && !params.isDownedScarab;
  const showAura = Boolean((params.isAuraActive || hasLegendaryArmorAura) && !params.isLocalScoped);
  rig.classAuraOrbitGroup.visible = showAura;
  rig.classAuraDome.visible = Boolean(params.isAuraActive && !params.isLocalScoped && params.auraType === 'waters_curse');
  rig.whirlCycloneGroup.visible = Boolean(params.isAuraActive && !params.isLocalScoped && params.auraType === 'whirl_dance');
  rig.frontShieldGroup.visible = Boolean(params.isAuraActive && !params.isLocalScoped && params.auraType === 'bulwark_shield');

  if (showAura) {
    auraMat.opacity = params.isAuraActive ? 0.78 : 0.58;
    rig.classAuraRing.rotation.z += params.isAuraActive ? 0.09 : 0.045;
    rig.classAuraOrbitGroup.rotation.y = -tIdle * (params.isAuraActive ? 3.8 : 2.2);
    rig.classAuraDome.rotation.y = tIdle * 2.2;
    if (rig.whirlCycloneGroup.visible) {
      rig.whirlCycloneGroup.rotation.y = tIdle * 14.0;
    }
    if (rig.frontShieldGroup.visible) {
      rig.frontShieldGroup.position.y = 1.18 + Math.sin(tIdle * 5.5) * 0.05;
      const runeChild = rig.frontShieldGroup.children[4];
      if (runeChild) runeChild.rotation.z = tIdle * 6.0;
    }
  } else {
    auraMat.opacity = 0.0;
  }

  // --- PELVIS & SPINE KINEMATICS ---
  const doubleStep = Math.abs(Math.sin(params.walkPhase));
  const hipBounce = params.isMounted ? Math.sin(params.walkPhase * 2) * 0.06 * spd : doubleStep * 0.075 * spd;
  const breathOffset = Math.sin(tIdle * 2.4) * 0.018;

  rig.humanoidGroup.position.y = params.isMounted ? 0.56 : 0;
  rig.pelvisGroup.position.y = 0.92 + hipBounce + breathOffset;
  rig.pelvisGroup.rotation.y = Math.sin(params.walkPhase) * 0.12 * spd;
  rig.pelvisGroup.rotation.z = -strafe * 0.14;

  if (dashProg > 0) {
    rig.spineGroup.rotation.x = dashProg * Math.PI * 2;
  } else {
    const forwardLean = Math.min(0.28, spd * 0.22) * (1 - params.drawCharge * 0.65);
    rig.spineGroup.rotation.x = forwardLean + Math.cos(tIdle * 2.4) * 0.025;
  }

  const aimTwist = params.drawCharge * 0.36;
  const meleeSlashTwist =
    (rig.heroClass === 'warrior' || rig.heroClass === 'ragnar') && slot === 1 && recoil > 0
      ? Math.sin((recoil / 0.18) * Math.PI) * 0.72
      : 0;
  rig.spineGroup.rotation.y = -Math.sin(params.walkPhase) * 0.16 * spd + aimTwist + meleeSlashTwist;
  rig.spineGroup.rotation.z = -strafe * 0.12;

  rig.headMesh.rotation.y = -aimTwist * 0.85;
  rig.headMesh.rotation.x = -rig.spineGroup.rotation.x * 0.45;

  // --- 2-SEGMENT LEG KINEMATICS ---
  if (params.isMounted) {
    rig.leftLeg.rotation.set(-0.65, 0, -0.38);
    rig.leftKnee.rotation.x = 0.95;
    rig.rightLeg.rotation.set(-0.65, 0, 0.38);
    rig.rightKnee.rotation.x = 0.95;

    const gallop = params.walkPhase * 1.35;
    if (rig.mountLegs.length === 4) {
      rig.mountLegs[0].rotation.x = Math.sin(gallop) * 0.75 * spd;
      rig.mountLegs[1].rotation.x = Math.sin(gallop + 0.6) * 0.75 * spd;
      rig.mountLegs[2].rotation.x = -Math.sin(gallop) * 0.75 * spd;
      rig.mountLegs[3].rotation.x = -Math.sin(gallop + 0.6) * 0.75 * spd;
    }
    rig.mountNeck.rotation.x = Math.sin(gallop * 2) * 0.14 * spd;
    rig.mountTail.rotation.y = Math.cos(gallop) * 0.28 * spd;
  } else if (isAirborne) {
    rig.leftLeg.rotation.set(-0.55, 0, 0);
    rig.leftKnee.rotation.x = 0.85;
    rig.leftAnkle.rotation.x = 0.35;
    rig.rightLeg.rotation.set(0.25, 0, 0);
    rig.rightKnee.rotation.x = 0.35;
    rig.rightAnkle.rotation.x = 0.4;
  } else {
    const strideAmp = 0.68 * Math.min(1.15, spd);
    const lPhase = params.walkPhase;
    const rPhase = params.walkPhase + Math.PI;

    rig.leftLeg.rotation.set(Math.sin(lPhase) * strideAmp, 0, 0);
    rig.rightLeg.rotation.set(Math.sin(rPhase) * strideAmp, 0, 0);

    rig.leftKnee.rotation.x = Math.max(0.05, -Math.cos(lPhase) * 0.95 * Math.min(1, spd));
    rig.rightKnee.rotation.x = Math.max(0.05, -Math.cos(rPhase) * 0.95 * Math.min(1, spd));

    rig.leftAnkle.rotation.x = Math.sin(lPhase - 0.6) * 0.32 * Math.min(1, spd);
    rig.rightAnkle.rotation.x = Math.sin(rPhase - 0.6) * 0.32 * Math.min(1, spd);
  }

  // --- 2-SEGMENT ARM & WEAPON RECOIL / SWAP / RELOAD / INSPECT KINEMATICS ---
  const armSwing = Math.sin(params.walkPhase) * 0.38 * Math.min(1, spd) * (1 - params.drawCharge * 0.8);
  const recoilNorm = Math.min(1, recoil / 0.18);
  const swapNorm = Math.min(1, swapTimer / 0.35);
  const reloadNorm = Math.min(1, reloadTimer / 0.65);
  const inspectNorm = Math.min(1, inspectTimer / 2.8);

  rig.leftArm.rotation.x =
    -armSwing -
    params.drawCharge * 0.35 -
    recoilNorm * 0.28 -
    (reloadNorm > 0 ? Math.sin(reloadNorm * Math.PI) * 0.65 : 0) -
    (inspectNorm > 0 ? 0.55 : 0);
  rig.leftElbow.rotation.x = -0.25 * (1 - params.drawCharge * 0.7) - (reloadNorm > 0 ? 0.45 : 0);

  rig.rightArm.rotation.x =
    armSwing -
    params.drawCharge * 0.55 -
    recoilNorm * 0.42 -
    (swapNorm > 0 ? Math.sin(swapNorm * Math.PI) * -0.55 : 0) -
    (inspectNorm > 0 ? 0.65 : 0);
  rig.rightElbow.rotation.x =
    -0.35 - params.drawCharge * 0.65 - recoilNorm * 0.25 - (reloadNorm > 0 ? 0.55 : 0);

  let wepOffsetX = 0;
  let wepOffsetY = 0.46 + Math.sin(tIdle * 2.4) * 0.015;
  let wepOffsetZ = 0.56;
  let wepPitchX = 0;
  let wepYawY = -aimTwist * 0.6;
  let wepRollZ = 0;
  let wepScale = 1.0;

  if (rig.heroClass === 'ragnar' && slot === 1 && recoilNorm > 0) {
    // Dynamic diagonal Cutlass slash wave swing across the torso!
    const slashArc = Math.sin(recoilNorm * Math.PI);
    wepOffsetX = Math.cos(recoilNorm * Math.PI) * 0.38;
    wepOffsetZ = 0.56 + slashArc * 0.44;
    wepYawY += (recoilNorm - 0.5) * 1.45;
    wepRollZ = 0.72 * slashArc;
    wepPitchX = 0.35 * slashArc;
  } else if (rig.heroClass === 'ragnar' && slot === 2 && recoilNorm > 0) {
    // Heavy Naval Cannon broadside recoil kickback
    wepOffsetZ = 0.56 - recoilNorm * 0.34;
    wepPitchX = -recoilNorm * 0.55;
  } else if (rig.heroClass === 'warrior' && slot === 1 && recoilNorm > 0) {
    wepOffsetZ = 0.56 + Math.sin(recoilNorm * Math.PI) * 0.48;
    wepPitchX = Math.sin(recoilNorm * Math.PI) * 0.35;
  } else if (rig.heroClass === 'bounty' && slot === 2 && recoilNorm > 0) {
    wepOffsetZ = 0.56 - recoilNorm * 0.26;
    wepPitchX = -recoilNorm * 0.48;
  } else if (recoilNorm > 0) {
    wepOffsetZ = 0.56 - recoilNorm * 0.18;
    wepPitchX = -recoilNorm * 0.22;
  }

  if (swapNorm > 0) {
    const dip = Math.sin(swapNorm * Math.PI);
    wepOffsetY -= dip * 0.32;
    wepPitchX += dip * 0.85;
    wepRollZ += (1 - swapNorm) * Math.PI * 2;
  }

  if (reloadNorm > 0) {
    const rCurve = Math.sin(reloadNorm * Math.PI);
    wepOffsetY += rCurve * 0.18;
    wepPitchX -= (1 - reloadNorm) * Math.PI * 2;
    wepRollZ += rCurve * 0.45;
  }

  if (inspectNorm > 0) {
    const env = Math.sin(Math.min(1, inspectNorm * 4) * (Math.PI / 2));
    wepOffsetX = 0.22 * env;
    wepOffsetY = 0.72;
    wepOffsetZ = 0.88;
    wepYawY = (1 - inspectNorm) * Math.PI * 2.2;
    wepPitchX = Math.sin((1 - inspectNorm) * Math.PI * 2) * 0.35;
    wepRollZ = 0.28 * env;
    wepScale = 1.24;
  }

  rig.weaponGroup.position.set(wepOffsetX, wepOffsetY, wepOffsetZ);
  rig.weaponGroup.rotation.set(wepPitchX, wepYawY, wepRollZ);
  rig.weaponGroup.scale.setScalar(wepScale);

  if (rig.bowUpperLimbGroup && rig.bowLowerLimbGroup) {
    const flexAngle = params.drawCharge * 0.28;
    rig.bowUpperLimbGroup.rotation.x = flexAngle;
    rig.bowLowerLimbGroup.rotation.x = -flexAngle;
  }
  if (rig.nockedArrowGroup) {
    rig.nockedArrowGroup.position.z = -params.drawCharge * 0.38;
    rig.nockedArrowGroup.visible = recoilNorm < 0.5 && reloadNorm < 0.5;
  }
  if (rig.rangerLaserSight) {
    const lMat = rig.rangerLaserSight.material as THREE.LineBasicMaterial;
    lMat.opacity = slot === 1 && (params.drawCharge > 0.15 || params.isLocalScoped) ? 0.68 : 0.0;
  }

  // --- 3-SEGMENT FLOWING CLOTH CAPE ---
  const baseBillow = 0.16 + Math.min(0.85, spd * 0.55) + (isAirborne ? 0.35 : 0);
  for (let i = 0; i < rig.capeSegments.length; i++) {
    const seg = rig.capeSegments[i];
    const wave = Math.sin(tIdle * 5.0 + params.walkPhase * 1.5 - i * 0.95) * (0.1 + spd * 0.16);
    seg.rotation.x = (i === 0 ? baseBillow : 0.12) + wave;
    seg.rotation.z = Math.cos(params.walkPhase - i * 0.7) * 0.08 * spd - strafe * 0.12;
  }

  if (rig.nightWingsGroup.visible && rig.nightWingsGroup.children.length >= 2) {
    const wingBeat = Math.sin(tIdle * 7.5) * (isAirborne ? 0.42 : 0.16);
    rig.nightWingsGroup.children[0].rotation.y = Math.PI - 0.25 + wingBeat;
    rig.nightWingsGroup.children[1].rotation.y = 0.25 - wingBeat;
  }

  if (rig.bowString && slot === 1) {
    const pos = rig.bowString.geometry.attributes.position as THREE.BufferAttribute;
    const tipZ = -0.22 - params.drawCharge * 0.16;
    pos.setXYZ(0, 0, 0.88 - params.drawCharge * 0.06, tipZ);
    pos.setXYZ(1, 0, 0, -0.18 - params.drawCharge * 0.38);
    pos.setXYZ(2, 0, -0.88 + params.drawCharge * 0.06, tipZ);
    pos.needsUpdate = true;
  }

  for (const mat of rig.bodyMaterials) {
    if (params.hitFlashTimer > 0) {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.9;
      mat.transparent = false;
      mat.opacity = 1.0;
    } else if (params.isCamouflaged) {
      mat.emissive.setHex(0x10b981);
      mat.emissiveIntensity = 0.65;
      mat.transparent = true;
      mat.opacity = 0.32;
    } else {
      if (mat === rig.bodyMaterials[4]) {
        mat.emissiveIntensity = 0.78 + Math.min(3, forgeLv) * 0.32;
      } else if (mat === rig.bodyMaterials[3]) {
        mat.emissiveIntensity = 0.22 + Math.min(3, forgeLv) * 0.22;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
      mat.transparent = false;
      mat.opacity = 1.0;
    }
  }
}

/**
 * Creates a pooled multi-part 3D Projectile Group capable of morphing into any of the
 * 12 distinct Ride Out Heroes weapon projectile silhouettes + Continuous 3D Ribbon Trail!
 */
export interface PooledProjectileRig {
  root: THREE.Group;
  coreMesh: THREE.Mesh;
  coreMat: THREE.MeshBasicMaterial;
  accentRing: THREE.Mesh;
  accentMat: THREE.MeshBasicMaterial;
  finGroup: THREE.Group;
  waveArcMesh: THREE.Mesh;
  ribbonTrailGroup: THREE.Group;
  ribbonTrailMat: THREE.MeshBasicMaterial;
}

export function createPooledProjectileRig(): PooledProjectileRig {
  const root = new THREE.Group();
  root.visible = false;

  const coreMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const accentMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    wireframe: false,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });

  const coreGeo = new THREE.ConeGeometry(0.11, 1.5, 6);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  root.add(coreMesh);

  const accentRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.032, 8, 20), accentMat);
  root.add(accentRing);

  const finGroup = new THREE.Group();
  const sideFinGeo = new THREE.ConeGeometry(0.06, 0.65, 4).rotateX(Math.PI / 2);
  const finL = new THREE.Mesh(sideFinGeo, accentMat);
  finL.position.set(-0.18, 0, -0.15);
  const finR = new THREE.Mesh(sideFinGeo, accentMat);
  finR.position.set(0.18, 0, -0.15);
  finGroup.add(finL, finR);
  root.add(finGroup);

  const waveArcMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.075, 8, 20, Math.PI).rotateX(Math.PI / 2),
    accentMat
  );
  waveArcMesh.visible = false;
  root.add(waveArcMesh);

  const ribbonTrailGroup = new THREE.Group();
  const ribbonTrailMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
  });
  const trailGeo = new THREE.ConeGeometry(0.16, 3.8, 4, 1, true);
  trailGeo.rotateX(Math.PI / 2);
  trailGeo.translate(0, 0, -1.9);
  const trailMeshA = new THREE.Mesh(trailGeo, ribbonTrailMat);
  trailMeshA.scale.set(1.0, 0.15, 1.0);
  const trailMeshB = new THREE.Mesh(trailGeo, ribbonTrailMat);
  trailMeshB.scale.set(0.15, 1.0, 1.0);
  ribbonTrailGroup.add(trailMeshA, trailMeshB);
  root.add(ribbonTrailGroup);

  return {
    root,
    coreMesh,
    coreMat,
    accentRing,
    accentMat,
    finGroup,
    waveArcMesh,
    ribbonTrailGroup,
    ribbonTrailMat,
  };
}

export function configureProjectileVisual(
  rig: PooledProjectileRig,
  kind: ProjectileVisualKind,
  colorHex: number,
  isCharged: boolean
) {
  rig.coreMat.color.setHex(colorHex);
  rig.accentMat.color.setHex(isCharged ? 0xfef08a : colorHex);
  rig.ribbonTrailMat.color.setHex(colorHex);
  rig.ribbonTrailMat.opacity = isCharged ? 0.72 : 0.48;
  rig.ribbonTrailGroup.scale.set(isCharged ? 1.35 : 1.0, isCharged ? 1.35 : 1.0, isCharged ? 1.45 : 1.0);

  rig.coreMesh.visible = true;
  rig.coreMesh.scale.set(1, 1, 1);
  rig.coreMesh.rotation.set(0, 0, 0);
  rig.accentRing.visible = true;
  rig.accentRing.scale.set(1, 1, 1);
  rig.accentRing.rotation.set(0, 0, 0);
  rig.finGroup.visible = false;
  rig.waveArcMesh.visible = false;

  switch (kind) {
    case 'longbow_arrow':
      rig.coreMesh.scale.set(0.75, 0.75, 1.45);
      rig.accentRing.scale.set(1.15, 1.15, 1.15);
      rig.finGroup.visible = true;
      rig.ribbonTrailGroup.scale.set(1.2, 1.2, 1.65);
      break;
    case 'chaser_bolt':
      rig.coreMesh.scale.set(0.85, 0.85, 0.95);
      rig.accentRing.scale.set(0.75, 0.75, 0.75);
      rig.finGroup.visible = true;
      break;
    case 'cutlass_wave':
      // Ragnar's Tilted & Spinning 3D Crescent Slash Wave with Wide Spectral Ribbon Trail!
      rig.coreMesh.scale.set(2.2, 0.22, 0.95);
      rig.coreMesh.rotation.z = 0.42;
      rig.waveArcMesh.visible = true;
      rig.waveArcMesh.scale.set(1.75, 1.35, 1.75);
      rig.waveArcMesh.rotation.z = 0.42;
      rig.accentRing.scale.set(1.65, 1.65, 1.65);
      rig.accentRing.rotation.x = Math.PI / 2.6;
      rig.ribbonTrailGroup.scale.set(1.95, 0.55, 1.75);
      break;
    case 'naval_cannonball':
      // Ragnar's Blazing Explosive Naval Cannonball with Molten Fire Rings!
      rig.coreMesh.scale.set(2.15, 2.15, 0.88);
      rig.accentRing.scale.set(1.85, 1.85, 1.85);
      rig.accentMat.color.setHex(0xfacc15);
      rig.waveArcMesh.visible = true;
      rig.waveArcMesh.scale.set(1.15, 1.15, 1.15);
      rig.ribbonTrailGroup.scale.set(1.7, 1.7, 1.6);
      break;
    case 'volcano_slug':
      rig.coreMesh.scale.set(1.45, 1.45, 0.85);
      rig.accentRing.scale.set(1.25, 1.25, 1.25);
      rig.accentMat.color.setHex(0xfacc15);
      break;
    case 'shotgun_pellet':
      rig.coreMesh.scale.set(1.1, 1.1, 0.55);
      rig.accentRing.visible = false;
      rig.ribbonTrailGroup.scale.set(0.75, 0.75, 0.7);
      break;
    case 'smg_tracer':
      rig.coreMesh.scale.set(0.55, 0.55, 1.35);
      rig.accentRing.visible = false;
      rig.ribbonTrailGroup.scale.set(0.85, 0.85, 1.3);
      break;
    case 'fly_dagger':
      rig.coreMesh.scale.set(1.2, 0.35, 0.85);
      rig.finGroup.visible = true;
      rig.accentRing.scale.set(1.3, 1.3, 1.3);
      break;
    case 'medusa_orb':
      rig.coreMesh.scale.set(1.8, 1.8, 0.6);
      rig.accentRing.scale.set(1.65, 1.65, 1.65);
      rig.accentRing.rotation.x = Math.PI / 3;
      break;
    case 'flame_meteor':
      rig.coreMesh.scale.set(2.4, 2.4, 1.1);
      rig.accentRing.scale.set(2.2, 2.2, 2.2);
      rig.accentMat.color.setHex(0xfef08a);
      rig.waveArcMesh.visible = true;
      rig.ribbonTrailGroup.scale.set(1.85, 1.85, 1.8);
      break;
    case 'sea_trident':
      rig.coreMesh.scale.set(1.0, 1.0, 1.75);
      rig.finGroup.visible = true;
      rig.accentRing.scale.set(1.35, 1.35, 1.35);
      rig.ribbonTrailGroup.scale.set(1.35, 1.35, 1.6);
      break;
    case 'vortex_wave':
      rig.coreMesh.scale.set(0.9, 0.9, 0.9);
      rig.waveArcMesh.visible = true;
      rig.accentRing.scale.set(1.4, 1.4, 1.4);
      break;
    case 'phantom_rail':
      rig.coreMesh.scale.set(0.65, 0.65, 2.1);
      rig.accentRing.scale.set(1.55, 1.55, 1.55);
      rig.accentMat.color.setHex(0xffffff);
      rig.ribbonTrailGroup.scale.set(1.4, 1.4, 2.1);
      break;
    case 'psychic_kunai':
      rig.coreMesh.scale.set(1.05, 0.45, 0.95);
      rig.accentRing.scale.set(1.2, 1.2, 1.2);
      rig.accentRing.rotation.x = Math.PI / 2;
      rig.finGroup.visible = true;
      break;
    case 'arc_bolt':
      rig.coreMesh.scale.set(0.8, 0.8, 1.85);
      rig.accentRing.scale.set(1.6, 1.6, 1.6);
      rig.accentMat.color.setHex(0xfacc15);
      rig.ribbonTrailGroup.scale.set(1.4, 1.4, 1.9);
      break;
    case 'emp_orb':
      rig.coreMesh.scale.set(2.1, 2.1, 0.95);
      rig.accentRing.scale.set(2.05, 2.05, 2.05);
      rig.waveArcMesh.visible = true;
      rig.ribbonTrailGroup.scale.set(1.75, 1.75, 1.6);
      break;
    case 'frost_lance':
      rig.coreMesh.scale.set(0.9, 0.9, 1.9);
      rig.finGroup.visible = true;
      rig.accentRing.scale.set(1.45, 1.45, 1.45);
      rig.accentMat.color.setHex(0xecfeff);
      rig.ribbonTrailGroup.scale.set(1.3, 1.3, 1.75);
      break;
    case 'ice_shard':
      rig.coreMesh.scale.set(1.15, 0.55, 1.1);
      rig.finGroup.visible = true;
      rig.accentRing.scale.set(1.15, 1.15, 1.15);
      break;
    default:
      rig.coreMesh.scale.set(0.9, 0.9, 1.0);
      rig.accentRing.visible = false;
      break;
  }
}

/**
 * Builds the upgraded 3D Multi-Mode Skill Trap / Field Visual (`[C]` Elvish Trap, Shade Array, Flood Trap).
 */
export function createMultiClassTrapGroup(): {
  group: THREE.Group;
  outerRingMat: THREE.MeshBasicMaterial;
  coreOrbMesh: THREE.Mesh;
  coreOrbMat: THREE.MeshBasicMaterial;
  vineSpikesGroup: THREE.Group;
  vortexFunnelMesh: THREE.Mesh;
  vortexFunnelMat: THREE.MeshBasicMaterial;
} {
  const group = new THREE.Group();
  group.visible = false;

  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(new THREE.RingGeometry(0.6, 5.2, 32), outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.08;
  group.add(outerRing);

  const coreOrbMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: false });
  const coreOrbMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 1), coreOrbMat);
  coreOrbMesh.position.y = 2.2;
  group.add(coreOrbMesh);

  // 8 Articulated Perimeter Spikes / Obelisk Pillars around the trap perimeter
  const vineSpikesGroup = new THREE.Group();
  const spikeGeo = new THREE.ConeGeometry(0.24, 1.65, 5);
  spikeGeo.translate(0, 0.82, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spike = new THREE.Mesh(spikeGeo, outerRingMat);
    spike.position.set(Math.cos(a) * 4.4, 0, Math.sin(a) * 4.4);
    spike.rotation.z = Math.cos(a) * 0.28;
    spike.rotation.x = -Math.sin(a) * 0.28;
    vineSpikesGroup.add(spike);
  }
  group.add(vineSpikesGroup);

  // Towering 3D Water Tornado / Abyssal Gravity Funnel
  const funnelGeo = new THREE.CylinderGeometry(3.8, 0.65, 5.8, 24, 4, true);
  funnelGeo.translate(0, 2.9, 0);
  const vortexFunnelMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const vortexFunnelMesh = new THREE.Mesh(funnelGeo, vortexFunnelMat);
  group.add(vortexFunnelMesh);

  return {
    group,
    outerRingMat,
    coreOrbMesh,
    coreOrbMat,
    vineSpikesGroup,
    vortexFunnelMesh,
    vortexFunnelMat,
  };
}

export interface SolarStormVisualRig {
  group: THREE.Group;
  wallMesh: THREE.Mesh;
  wallMat: THREE.MeshBasicMaterial;
  groundRingMesh: THREE.Mesh;
  groundRingMat: THREE.MeshBasicMaterial;
}

export interface InstancedCombatantCrowd {
  maxCount: number;
  torsoInst: THREE.InstancedMesh;
  headInst: THREE.InstancedMesh;
  weaponInst: THREE.InstancedMesh;
  hpBarInst: THREE.InstancedMesh;
}

export function createInstancedCombatantCrowd(
  scene: THREE.Scene,
  maxCount = 100
): InstancedCombatantCrowd {
  const torsoGeo = new THREE.CylinderGeometry(0.26, 0.36, 1.32, 10);
  torsoGeo.translate(0, 0.76, 0);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.25,
  });

  const headGeo = new THREE.OctahedronGeometry(0.24, 1);
  headGeo.translate(0, 1.65, 0);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.8,
  });

  const weaponGeo = new THREE.BoxGeometry(0.11, 0.14, 0.92);
  weaponGeo.translate(0.28, 1.05, 0.42);
  const weaponMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const hpBarGeo = new THREE.BoxGeometry(1.12, 0.13, 0.06);
  hpBarGeo.translate(0, 2.35, 0);
  const hpBarMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const torsoInst = new THREE.InstancedMesh(torsoGeo, torsoMat, maxCount);
  const headInst = new THREE.InstancedMesh(headGeo, headMat, maxCount);
  const weaponInst = new THREE.InstancedMesh(weaponGeo, weaponMat, maxCount);
  const hpBarInst = new THREE.InstancedMesh(hpBarGeo, hpBarMat, maxCount);

  torsoInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  headInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  weaponInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  hpBarInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  torsoInst.frustumCulled = false;
  headInst.frustumCulled = false;
  weaponInst.frustumCulled = false;
  hpBarInst.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const c = new THREE.Color(0xf59e0b);
  dummy.position.set(0, -999, 0);
  dummy.scale.setScalar(0.001);
  dummy.updateMatrix();

  for (let i = 0; i < maxCount; i++) {
    torsoInst.setMatrixAt(i, dummy.matrix);
    headInst.setMatrixAt(i, dummy.matrix);
    weaponInst.setMatrixAt(i, dummy.matrix);
    hpBarInst.setMatrixAt(i, dummy.matrix);
    torsoInst.setColorAt(i, c);
    headInst.setColorAt(i, c);
    weaponInst.setColorAt(i, c);
    hpBarInst.setColorAt(i, c);
  }

  torsoInst.instanceMatrix.needsUpdate = true;
  headInst.instanceMatrix.needsUpdate = true;
  weaponInst.instanceMatrix.needsUpdate = true;
  hpBarInst.instanceMatrix.needsUpdate = true;

  scene.add(torsoInst, headInst, weaponInst, hpBarInst);

  return {
    maxCount,
    torsoInst,
    headInst,
    weaponInst,
    hpBarInst,
  };
}

export function buildEgyptianArenaScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): {
  environmentObstacles: THREE.Object3D[];
  beaconRings: THREE.Mesh[];
  forgeBeamMesh: THREE.Mesh;
  solarStormRig: SolarStormVisualRig;
} {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const loader = new THREE.TextureLoader();

  // --- 1. PHYSICALLY-BASED PREETHAM ATMOSPHERIC SKY + GOLDEN SUN CORONA ---
  const sky = new Sky();
  sky.scale.setScalar(460);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 7.5;
  skyUniforms['rayleigh'].value = 1.85;
  skyUniforms['mieCoefficient'].value = 0.008;
  skyUniforms['mieDirectionalG'].value = 0.82;

  const sunVec = new THREE.Vector3(42, 34, -68).normalize();
  skyUniforms['sunPosition'].value.copy(sunVec);

  const sunDisk = new THREE.Mesh(
    new THREE.SphereGeometry(9.0, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false })
  );
  sunDisk.position.copy(sunVec).multiplyScalar(250);
  const sunHalo = new THREE.Mesh(
    new THREE.RingGeometry(10.0, 23.0, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.42,
      fog: false,
      depthWrite: false,
    })
  );
  sunHalo.position.copy(sunDisk.position);
  sunHalo.lookAt(0, 0, 0);
  scene.add(sunDisk, sunHalo);

  const microBump = createProceduralMicroReliefTexture(maxAniso);
  const sandBump = createProceduralMicroReliefTexture(maxAniso);
  sandBump.repeat.set(36, 36);

  const sandstoneTex = loader.load(sandstoneUrl);
  sandstoneTex.colorSpace = THREE.SRGBColorSpace;
  sandstoneTex.wrapS = THREE.RepeatWrapping;
  sandstoneTex.wrapT = THREE.RepeatWrapping;
  sandstoneTex.repeat.set(28, 28);
  sandstoneTex.anisotropy = maxAniso;

  const reliefTex = loader.load(reliefUrl);
  reliefTex.colorSpace = THREE.SRGBColorSpace;
  reliefTex.wrapS = THREE.RepeatWrapping;
  reliefTex.wrapT = THREE.RepeatWrapping;
  reliefTex.repeat.set(2, 2);
  reliefTex.anisotropy = maxAniso;

  const groundGeo = new THREE.PlaneGeometry(340, 340, 96, 96);
  groundGeo.rotateX(-Math.PI / 2);
  const posAttr = groundGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, groundHeightAt(vx, vz));
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: sandstoneTex,
    bumpMap: sandBump,
    bumpScale: 0.22,
    roughness: 0.84,
    metalness: 0.06,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const templeStoneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: reliefTex,
    bumpMap: microBump,
    bumpScale: 0.16,
    roughness: 0.68,
    metalness: 0.08,
  });

  const royalGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.18,
    metalness: 0.92,
  });

  const solarLapisMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.72,
    roughness: 0.16,
    metalness: 0.45,
  });

  const sacredWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.78,
  });

  const environmentObstacles: THREE.Object3D[] = [];
  const beaconRings: THREE.Mesh[] = [];

  // --- 2. COLOSSAL GREAT PYRAMIDS OF GIZA ON THE HORIZON ---
  const pyramidConfigs = [
    { x: -135, z: -158, size: 42, height: 56 },
    { x: 0, z: -176, size: 54, height: 72 },
    { x: 138, z: -156, size: 40, height: 52 },
  ];
  for (const pyr of pyramidConfigs) {
    const pGroup = new THREE.Group();
    pGroup.position.set(pyr.x, 3.2, pyr.z);
    const bodyHeight = pyr.height * 0.82;
    const capHeight = pyr.height * 0.18;
    const bodyMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(pyr.size * 0.18, pyr.size, bodyHeight, 4),
      templeStoneMat
    );
    bodyMesh.rotation.y = Math.PI / 4;
    bodyMesh.position.y = bodyHeight / 2;
    const capMesh = new THREE.Mesh(
      new THREE.ConeGeometry(pyr.size * 0.185, capHeight, 4),
      royalGoldMat
    );
    capMesh.rotation.y = Math.PI / 4;
    capMesh.position.y = bodyHeight + capHeight / 2;
    pGroup.add(bodyMesh, capMesh);
    scene.add(pGroup);
  }

  const forgeBeamGeo = new THREE.CylinderGeometry(0.24, 0.65, 24, 20, 1, true);
  forgeBeamGeo.translate(0, 12, 0);
  const forgeBeamMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const forgeBeamMesh = new THREE.Mesh(forgeBeamGeo, forgeBeamMat);
  scene.add(forgeBeamMesh);

  // --- 3D SHRINKING SOLAR SANDSTORM SAFE-ZONE BARRIER WALL ---
  const solarStormGroup = new THREE.Group();
  const stormWallGeo = new THREE.CylinderGeometry(1, 1, 34, 64, 1, true);
  stormWallGeo.translate(0, 16, 0);
  const stormWallMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const stormWallMesh = new THREE.Mesh(stormWallGeo, stormWallMat);
  stormWallMesh.scale.set(130, 1, 130);

  const stormGroundRingGeo = new THREE.RingGeometry(0.985, 1.015, 64);
  stormGroundRingGeo.rotateX(-Math.PI / 2);
  const stormGroundRingMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  const stormGroundRingMesh = new THREE.Mesh(stormGroundRingGeo, stormGroundRingMat);
  stormGroundRingMesh.position.y = 0.22;
  stormGroundRingMesh.scale.set(130, 130, 1);

  solarStormGroup.add(stormWallMesh, stormGroundRingMesh);
  scene.add(solarStormGroup);

  const solarStormRig: SolarStormVisualRig = {
    group: solarStormGroup,
    wallMesh: stormWallMesh,
    wallMat: stormWallMat,
    groundRingMesh: stormGroundRingMesh,
    groundRingMat: stormGroundRingMat,
  };

  for (const plat of ARENA_PLATFORMS) {
    const baseY = groundHeightAt(plat.x, plat.z);
    const group = new THREE.Group();
    group.position.set(plat.x, baseY, plat.z);

    if (plat.type === 'temple_dais') {
      const waterPool = new THREE.Mesh(
        new THREE.RingGeometry(plat.radius - 0.2, plat.radius + 3.2, 36),
        sacredWaterMat
      );
      waterPool.rotation.x = -Math.PI / 2;
      waterPool.position.y = 0.05;
      group.add(waterPool);

      const poolRim = new THREE.Mesh(
        new THREE.TorusGeometry(plat.radius + 3.2, 0.35, 8, 36).rotateX(Math.PI / 2),
        templeStoneMat
      );
      poolRim.position.y = 0.15;
      group.add(poolRim);

      const tier1 = new THREE.Mesh(
        new THREE.CylinderGeometry(plat.radius, plat.radius + 0.8, 0.38, 28),
        templeStoneMat
      );
      tier1.position.y = 0.19;
      tier1.receiveShadow = true;

      const tier2 = new THREE.Mesh(
        new THREE.CylinderGeometry(plat.radius - 1.2, plat.radius - 0.8, 0.3, 28),
        templeStoneMat
      );
      tier2.position.y = 0.48;
      tier2.receiveShadow = true;

      const sunRing = new THREE.Mesh(
        new THREE.RingGeometry(plat.radius - 2.6, plat.radius - 1.9, 36),
        royalGoldMat
      );
      sunRing.rotation.x = -Math.PI / 2;
      sunRing.position.y = 0.65;

      for (let c = 0; c < 4; c++) {
        const cAngle = (c / 4) * Math.PI * 2 + Math.PI / 4;
        const cx = Math.cos(cAngle) * (plat.radius - 0.8);
        const cz = Math.sin(cAngle) * (plat.radius - 0.8);
        const colGroup = new THREE.Group();
        colGroup.position.set(cx, 0.38, cz);

        const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.1), royalGoldMat);
        plinth.position.y = 0.22;
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 4.6, 12), templeStoneMat);
        shaft.position.y = 2.7;
        shaft.castShadow = true;
        const lotusCap = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.36, 0.75, 12), royalGoldMat);
        lotusCap.position.y = 5.2;
        const brazierFlame = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), solarLapisMat);
        brazierFlame.position.y = 5.85;
        beaconRings.push(brazierFlame);

        colGroup.add(plinth, shaft, lotusCap, brazierFlame);
        group.add(colGroup);
      }

      const anvilBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.88, 0.92, 10),
        royalGoldMat
      );
      anvilBase.position.set(0, 1.05, -2.8);
      const forgeFlame = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), solarLapisMat);
      forgeFlame.position.set(0, 1.82, -2.8);
      beaconRings.push(forgeFlame);

      group.add(tier1, tier2, sunRing, anvilBase, forgeFlame);
    } else if (plat.type === 'sniper_perch') {
      const pillarMain = new THREE.Mesh(
        new THREE.CylinderGeometry(plat.radius * 0.82, plat.radius * 0.98, plat.height - 0.5, 16),
        templeStoneMat
      );
      pillarMain.position.y = (plat.height - 0.5) / 2;
      pillarMain.castShadow = true;
      pillarMain.receiveShadow = true;

      const bandMid = new THREE.Mesh(
        new THREE.CylinderGeometry(plat.radius * 0.92, plat.radius * 0.92, 0.32, 16),
        royalGoldMat
      );
      bandMid.position.y = plat.height * 0.5;

      const deckCap = new THREE.Mesh(
        new THREE.CylinderGeometry(plat.radius + 0.35, plat.radius * 0.88, 0.65, 16),
        templeStoneMat
      );
      deckCap.position.y = plat.height - 0.25;
      deckCap.castShadow = true;
      deckCap.receiveShadow = true;

      const grappleBeacon = new THREE.Mesh(
        new THREE.TorusGeometry(plat.radius * 0.94, 0.095, 10, 28),
        solarLapisMat
      );
      grappleBeacon.rotation.x = Math.PI / 2;
      grappleBeacon.position.y = plat.height + 0.08;
      beaconRings.push(grappleBeacon);

      const parapetGeo = new THREE.BoxGeometry(1.9, 0.98, 0.48);
      const p1 = new THREE.Mesh(parapetGeo, templeStoneMat);
      p1.position.set(0, plat.height + 0.46, plat.radius * 0.68);
      const p2 = new THREE.Mesh(parapetGeo, royalGoldMat);
      p2.scale.set(1.06, 0.22, 1.06);
      p2.position.set(0, plat.height + 0.94, plat.radius * 0.68);

      group.add(pillarMain, bandMid, deckCap, grappleBeacon, p1, p2);
      environmentObstacles.push(pillarMain);
    } else if (plat.type === 'obelisk_base') {
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(plat.radius * 2.15, 2.3, plat.radius * 2.15),
        templeStoneMat
      );
      pedestal.position.y = 1.15;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(plat.radius * 0.54, plat.radius * 0.86, plat.height - 4.5, 4),
        templeStoneMat
      );
      shaft.rotation.y = Math.PI / 4;
      shaft.position.y = 2.3 + (plat.height - 4.5) / 2;
      shaft.castShadow = true;
      shaft.receiveShadow = true;

      const pyramidion = new THREE.Mesh(
        new THREE.ConeGeometry(plat.radius * 0.6, 2.8, 4),
        royalGoldMat
      );
      pyramidion.rotation.y = Math.PI / 4;
      pyramidion.position.y = plat.height - 0.9;

      const solarBand = new THREE.Mesh(
        new THREE.BoxGeometry(plat.radius * 1.48, 0.38, plat.radius * 1.48),
        solarLapisMat
      );
      solarBand.position.y = 2.4;

      group.add(pedestal, shaft, pyramidion, solarBand);
      environmentObstacles.push(pedestal, shaft);
    }

    scene.add(group);
  }

  const rockCount = 52;
  const rockGeo = new THREE.DodecahedronGeometry(4.4, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0xd4a359,
    bumpMap: microBump,
    bumpScale: 0.22,
    roughness: 0.88,
    metalness: 0.04,
  });
  const rockInstanced = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInstanced.castShadow = true;
  rockInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < rockCount; i++) {
    const angle = (i / rockCount) * Math.PI * 2;
    const radius = 136 + (i % 3) * 6.5;
    const rx = Math.cos(angle) * radius;
    const rz = Math.sin(angle) * radius;
    const ry = groundHeightAt(rx, rz);

    dummy.position.set(rx, ry + 1.8, rz);
    dummy.rotation.set((i * 1.3) % Math.PI, angle, (i * 0.7) % Math.PI);
    const s = 0.95 + (i % 4) * 0.32;
    dummy.scale.set(s * 1.3, s * (1.2 + (i % 3) * 0.4), s);
    dummy.updateMatrix();
    rockInstanced.setMatrixAt(i, dummy.matrix);

    const tint = 0.88 + ((i * 17) % 24) / 100;
    color.setRGB(tint, tint * 0.85, tint * 0.68);
    rockInstanced.setColorAt(i, color);
  }
  rockInstanced.instanceMatrix.needsUpdate = true;
  if (rockInstanced.instanceColor) rockInstanced.instanceColor.needsUpdate = true;
  rockInstanced.computeBoundingSphere();
  scene.add(rockInstanced);

  const palmCount = 44;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 5.4, 8);
  trunkGeo.translate(0, 2.7, 0);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.9,
    metalness: 0.02,
  });
  const crownGeo = new THREE.ConeGeometry(2.6, 1.9, 8);
  crownGeo.translate(0, 5.5, 0);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.72,
    metalness: 0.06,
  });

  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, palmCount);

  for (let i = 0; i < palmCount; i++) {
    const angle = (i / palmCount) * Math.PI * 2 + 0.15;
    const r = i % 2 === 0 ? 48 + (i % 4) * 3.5 : 94 + (i % 4) * 5.0;
    const px = Math.cos(angle) * r;
    const pz = Math.sin(angle) * r;
    const py = groundHeightAt(px, pz);

    dummy.position.set(px, py - 0.1, pz);
    dummy.rotation.set(0.06 * Math.sin(i), i * 1.1, 0.06 * Math.cos(i));
    const scale = 0.85 + (i % 3) * 0.18;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();

    trunkInst.setMatrixAt(i, dummy.matrix);
    crownInst.setMatrixAt(i, dummy.matrix);
  }
  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  scene.add(trunkInst, crownInst);

  // --- 4 SANCTUARY PRAYER SHRINES (North, East, South, West) ---
  for (const shrine of SANCTUARY_SHRINES) {
    const sy = groundHeightAt(shrine.x, shrine.z);
    const sGroup = new THREE.Group();
    sGroup.position.set(shrine.x, sy, shrine.z);

    const altarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.4, 0.55, 8), templeStoneMat);
    altarBase.position.y = 0.27;
    const altarGoldRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.08, 8, 28).rotateX(Math.PI / 2),
      royalGoldMat
    );
    altarGoldRing.position.y = 0.12;

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.4, 6), royalGoldMat);
    pillar.position.y = 1.65;

    const relicMat = new THREE.MeshBasicMaterial({ color: shrine.colorHex });
    const floatingAnkhCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), relicMat);
    floatingAnkhCrystal.position.y = 3.45;
    beaconRings.push(floatingAnkhCrystal);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.045, 8, 24),
      new THREE.MeshBasicMaterial({ color: shrine.colorHex, transparent: true, opacity: 0.78 })
    );
    halo.position.y = 3.45;
    beaconRings.push(halo);

    sGroup.add(altarBase, altarGoldRing, pillar, floatingAnkhCrystal, halo);
    scene.add(sGroup);
  }

  return {
    environmentObstacles,
    beaconRings,
    forgeBeamMesh,
    solarStormRig,
  };
}

/**
 * Safely disposes geometries and materials of a CharacterRig when switching classes
 * without disposing shared singleton textures.
 */
export function disposeCharacterRig(rig: CharacterRig) {
  rig.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });
}

/**
 * Safely disposes all InstancedMesh geometries and materials for the 100-player crowd.
 */
export function disposeInstancedCombatantCrowd(crowd: InstancedCombatantCrowd) {
  const layers = [crowd.torsoInst, crowd.headInst, crowd.weaponInst, crowd.hpBarInst];
  for (const inst of layers) {
    inst.geometry.dispose();
    if (Array.isArray(inst.material)) {
      inst.material.forEach((m) => m.dispose());
    } else {
      inst.material.dispose();
    }
    inst.dispose();
  }
}

/**
 * Full scene teardown audit helper: disposes all geometries and materials in the WebGL scene
 * on unmount to guarantee zero GPU memory leaks across mounts.
 */
export function disposeArenaSceneResources(scene: THREE.Scene) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });
}

export interface GoldenLootChestRig {
  group: THREE.Group;
  lidGroup: THREE.Group;
  crystalMesh: THREE.Mesh;
  scarabHalo: THREE.Mesh;
  beaconRing: THREE.Mesh;
}

/**
 * Builds a composite 3D Golden Scarab Reliquary Loot Chest with hinged lid,
 * floating emerald/amber shard crystal, and ground beacon ring.
 */
export function createGoldenLootChestRig(): GoldenLootChestRig {
  const group = new THREE.Group();
  group.add(createContactShadowDisc(1.25));

  const hieroglyphTex = createProceduralHieroglyphicGlowTexture();

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.18,
    metalness: 0.94,
    bumpMap: hieroglyphTex,
    bumpScale: 0.03,
    emissive: 0xd97706,
    emissiveMap: hieroglyphTex,
    emissiveIntensity: 0.25,
  });

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x16120e,
    roughness: 0.35,
    metalness: 0.82,
    bumpMap: hieroglyphTex,
    bumpScale: 0.02,
  });

  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 0.85,
    roughness: 0.12,
    metalness: 0.3,
  });

  // 1. Stepped Temple Pedestal
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 1.05), obsidianMat);
  plinth.position.y = 0.11;
  const baseBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.52, 0.78), obsidianMat);
  baseBody.position.y = 0.48;
  const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.12, 0.84), goldMat);
  goldTrim.position.y = 0.48;

  // Corner pillars
  for (const sx of [-0.56, 0.56]) {
    for (const sz of [-0.36, 0.36]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.56, 8), goldMat);
      col.position.set(sx, 0.48, sz);
      group.add(col);
    }
  }

  // 2. Articulated Hinged Lid
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, 0.74, -0.38);
  const lidArch = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.24, 0.8), goldMat);
  lidArch.position.set(0, 0.12, 0.38);
  const scarabCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), crystalMat);
  scarabCrest.scale.set(1.2, 0.45, 1.4);
  scarabCrest.position.set(0, 0.26, 0.38);
  lidGroup.add(lidArch, scarabCrest);

  // 3. Floating Rotating Treasure Crystal & Halo
  const crystalMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), crystalMat);
  crystalMesh.position.set(0, 1.25, 0);

  const haloGeo = new THREE.TorusGeometry(0.46, 0.025, 8, 24);
  haloGeo.rotateX(Math.PI / 2);
  const scarabHalo = new THREE.Mesh(
    haloGeo,
    new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 })
  );
  scarabHalo.position.set(0, 1.25, 0);

  const beaconGeo = new THREE.RingGeometry(0.95, 1.15, 28);
  beaconGeo.rotateX(-Math.PI / 2);
  const beaconRing = new THREE.Mesh(
    beaconGeo,
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    })
  );
  beaconRing.position.y = 0.04;

  group.add(plinth, baseBody, goldTrim, lidGroup, crystalMesh, scarabHalo, beaconRing);
  return {
    group,
    lidGroup,
    crystalMesh,
    scarabHalo,
    beaconRing,
  };
}

/**
 * Enhances a CharacterRig into the towering Solar Pharaoh Colossus World Boss
 * with 1.65x scale, floating Golden Sun Disc Halo, and orbiting Obelisk Shards.
 */
export function decoratePharaohBossRig(rig: CharacterRig): THREE.Group {
  rig.humanoidGroup.scale.setScalar(1.48);
  if (rig.overheadBarGroup) {
    rig.overheadBarGroup.position.set(0, 3.85, 0);
    rig.overheadBarGroup.scale.setScalar(1.45);
  }

  const bossCrownGroup = new THREE.Group();
  bossCrownGroup.position.set(0, 3.15, 0);

  const sunHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.045, 10, 28),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  const innerSun = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.26, 0),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  bossCrownGroup.add(sunHalo, innerSun);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const obeliskShard = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.45, 4),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    obeliskShard.position.set(Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05);
    bossCrownGroup.add(obeliskShard);
  }

  rig.root.add(bossCrownGroup);
  return bossCrownGroup;
}

export interface TeslaTurretVisualRig {
  group: THREE.Group;
  coilHead: THREE.Group;
  arcRing: THREE.Mesh;
  rangeRing: THREE.Mesh;
}

/**
 * Builds Tesla's deployable 3D Lightning Turret ([Q] ability) that automatically
 * tracks and zaps nearby rivals in the arena.
 */
export function createTeslaTurretRig(): TeslaTurretVisualRig {
  const group = new THREE.Group();
  group.visible = false;
  group.add(createContactShadowDisc(1.15));

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.85,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.92,
  });
  const arcMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const tripodBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.88, 0.42, 6), baseMat);
  tripodBase.position.y = 0.21;
  const centralPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.35, 10), goldMat);
  centralPylon.position.y = 0.95;

  const coilHead = new THREE.Group();
  coilHead.position.set(0, 1.78, 0);
  const coreSphere = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 1), arcMat);
  const emitterBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.65, 8).rotateX(Math.PI / 2),
    goldMat
  );
  emitterBarrel.position.set(0, 0, 0.36);
  coilHead.add(coreSphere, emitterBarrel);

  const arcRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.035, 8, 24).rotateX(Math.PI / 2),
    arcMat
  );
  arcRing.position.y = 1.45;

  const rangeRing = new THREE.Mesh(
    new THREE.RingGeometry(17.6, 18.0, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
  );
  rangeRing.position.y = 0.06;

  group.add(tripodBase, centralPylon, coilHead, arcRing, rangeRing);
  return { group, coilHead, arcRing, rangeRing };
}


