import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  HeroClassId,
  WeaponSlotId,
  AbilitySlotId,
  HERO_CLASSES,
  GameStateMode,
  EnemyPolicyType,
  ARENA_RADIUS,
  TOTAL_BR_COMBATANTS,
  groundHeightAt,
  getEffectiveSurfaceHeight,
  findBestGrappleTarget,
  calculatePrecisionShotDamage,
  applyDamageWithScarabRelic,
  tickScarabRelic,
  computeEnemyPolicyIntent,
  computeCameraRelativeMovement,
  computeAimRayDirection,
  resolveObstacleCollision,
  checkProjectileObstacleHit,
  evaluateKillstreak,
  computeDirectionalDamageAngleDeg,
  computeSolarStormState,
  computeBattleRoyaleRank,
  isBattleRoyaleVictory,
  resolveSafeTeleportPosition,
  checkProjectile3DHit,
  selectBoundedAoETargets,
  generate100PlayerRoster,
} from '../game/rules';
import {
  CharacterRig,
  ProjectileVisualKind,
  PooledProjectileRig,
  GoldenLootChestRig,
  getWeaponVisualKind,
  createHeroRig,
  updateCharacterVisualState,
  createPooledProjectileRig,
  configureProjectileVisual,
  createMultiClassTrapGroup,
  buildEgyptianArenaScene,
  disposeCharacterRig,
  disposeInstancedCombatantCrowd,
  disposeArenaSceneResources,
  createGoldenLootChestRig,
  decoratePharaohBossRig,
  createInstancedCombatantCrowd,
} from '../game/models';
import {
  EngineDiagnosticsSnapshot,
  evaluateEngineHealth,
  computeStormAwareEnemyVelocity,
  ArenaSpatialHashGrid,
  shouldUpdateRivalAISteering,
  computeSmoothThirdPersonCamera,
  CombatInputBuffer,
  computeAdaptiveQualityState,
  computeAISkirmishPacing,
} from '../game/engine';
import { audioEngine } from '../game/audio';
import {
  ArenaMultiplayerClient,
  SyncedRemotePlayer,
  SyncedKillFeedEvent,
} from '../game/multiplayer';

export interface FloatingDamageHUDItem {
  id: number;
  x: number;
  y: number;
  amount: number;
  isCrit: boolean;
  label?: string;
  color: string;
  opacity: number;
}

export interface DirectionalHitArcHUDItem {
  id: number;
  angleDeg: number;
  opacity: number;
}

export interface BattleRoyaleContenderHUD {
  id: string;
  name: string;
  heroClass: HeroClassId;
  kills: number;
  alive: boolean;
  isPlayer?: boolean;
}

export interface LiveHUDTelemetry {
  hp: number;
  maxHp: number;
  ghostHp: number;
  shield: number;
  maxShield: number;
  activeWeaponSlot: WeaponSlotId;
  magicShards: number;
  forgeLevel: number;
  drawCharge: number;
  isScoped: boolean;
  isInspectingWeapon?: boolean;
  isPointerLocked: boolean;
  isCamouflaged: boolean;
  camouflageRemaining: number;
  isMounted: boolean;
  isDownedScarab: boolean;
  isPropDisguised: boolean;
  scarabRemaining: number;
  relicReady: boolean;
  relicCooldown: number;
  isHighGround: boolean;
  perchName: string | null;
  cooldowns: { q: number; e: number; c: number; r: number; v: number; dash: number };
  kills: number;
  targetKills: number;
  headshots: number;
  score: number;
  bestScore: number;
  wave: number;
  damageDealt: number;
  matchTime: number;
  lastHitBanner: { text: string; isCrit: boolean; id: number } | null;
  lockedTargetName: string | null;
  lockedTargetHpRatio: number;
  lockedTargetScreen: { x: number; y: number; visible: boolean } | null;
  minimapActors: Array<{
    x: number;
    z: number;
    kind: 'player' | 'rival' | 'remote' | 'perch' | 'boss' | 'chest';
  }>;
  floatingDamages?: FloatingDamageHUDItem[];
  hitArcs?: DirectionalHitArcHUDItem[];
  killstreak?: {
    count: number;
    best: number;
    timer: number;
    title: string;
    arabicTitle: string;
  };
  bossStatus?: {
    active: boolean;
    name: string;
    hp: number;
    maxHp: number;
  } | null;
  isSandboxMode?: boolean;
  sandboxZeroCooldown?: boolean;
  analytics?: {
    shotsFired: number;
    shotsHit: number;
    maxSingleDamage: number;
    bestStreak: number;
    bossesDefeated: number;
    chestsOpened: number;
  };
  battleRoyale?: {
    aliveCount: number;
    totalCount: number;
    playerRank: number;
    stormPhase: number;
    stormIsShrinking: boolean;
    stormTimer: number;
    stormRadius: number;
    stormTargetRadius: number;
    stormDamagePerSec: number;
    isOutsideStorm: boolean;
    lodNearRigCount: number;
    lodInstancedCount: number;
    topContenders: BattleRoyaleContenderHUD[];
  };
  diagnostics?: EngineDiagnosticsSnapshot;
}

export interface EndOfRunSnapshot {
  outcome: 'victory' | 'defeat';
  kills: number;
  targetKills: number;
  headshots: number;
  score: number;
  bestScore: number;
  damageDealt: number;
  clearTimeSec: number;
  heroClass: HeroClassId;
  shotsFired?: number;
  shotsHit?: number;
  maxSingleDamage?: number;
  bestStreak?: number;
  forgeLevel?: number;
  bossesDefeated?: number;
  chestsOpened?: number;
  placementRank?: number;
  totalCombatants?: number;
}

export interface ArenaControlActions {
  triggerAbility: (slot: AbilitySlotId) => void;
  triggerDash: () => void;
  swapWeapon: (slot?: WeaponSlotId) => void;
  triggerReload: () => void;
  triggerInspect: () => void;
  triggerForge: () => void;
  toggleScope: () => void;
  fireQuickShot: () => void;
  requestMouseLock: () => void;
  resetMatch: () => void;
  toggleSandboxZeroCooldown: () => void;
  triggerSandboxMaxForge: () => void;
  triggerSandboxSpawnBoss: () => void;
  triggerSandboxSpawnChests: () => void;
  triggerSandboxFullRestore: () => void;
  rotateShowroom: (deltaYaw: number) => void;
  setShowroomWeapon: (slot: WeaponSlotId) => void;
  setShowroomForge: (level: number) => void;
  triggerShowroomPose: () => void;
}

interface ArenaCanvasProps {
  gameState: GameStateMode;
  heroClass: HeroClassId;
  roomId: string;
  mouseSensitivity: number;
  aimAssistEnabled: boolean;
  isSandboxMode?: boolean;
  onHUDUpdate: (telemetry: LiveHUDTelemetry) => void;
  onMatchEnd: (snapshot: EndOfRunSnapshot) => void;
  onKillFeed: (event: SyncedKillFeedEvent) => void;
  onMultiplayerStatus: (connected: boolean, roomId: string, onlineCount: number) => void;
  actionsRef: React.MutableRefObject<ArenaControlActions | null>;
}

interface ActiveProjectile {
  active: boolean;
  id: string;
  ownerId: string;
  isPlayerOwned: boolean;
  rig: PooledProjectileRig;
  visualKind: ProjectileVisualKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  isCharged: boolean;
  isScopedShot: boolean;
  isAmbushShot: boolean;
  isHighGroundShot: boolean;
  homingTargetId: string | null;
  explosiveRadius: number;
  appliesBurn: boolean;
  appliesStun: boolean;
  colorHex: number;
  life: number;
}

interface RivalActor {
  id: string;
  name: string;
  heroClass: HeroClassId;
  policy: EnemyPolicyType;
  rig: CharacterRig | null;
  isBoss?: boolean;
  bossCrownGroup?: THREE.Group;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  rotY: number;
  hp: number;
  maxHp: number;
  speed: number;
  strafeSign: number;
  attackCooldown: number;
  windupTimer: number;
  windupDuration: number;
  hitFlashTimer: number;
  snaredTimer: number;
  burnTimer: number;
  koTimer: number;
  walkPhase: number;
  kills: number;
  eliminated: boolean;
  aiSkirmishCooldown: number;
}

const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _pColor = new THREE.Color();
const _projVec = new THREE.Vector3();

const PARTICLE_POOL_SIZE = 160;
const PROJECTILE_POOL_SIZE = 64;
const TARGET_KILLS_FOR_VICTORY = 99;

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  gameState,
  heroClass,
  roomId,
  mouseSensitivity,
  aimAssistEnabled,
  isSandboxMode = false,
  onHUDUpdate,
  onMatchEnd,
  onKillFeed,
  onMultiplayerStatus,
  actionsRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef<GameStateMode>(gameState);
  const heroClassRef = useRef<HeroClassId>(heroClass);
  const roomIdRef = useRef<string>(roomId);
  const sensitivityRef = useRef<number>(mouseSensitivity);
  const aimAssistRef = useRef<boolean>(aimAssistEnabled);
  const sandboxModeRef = useRef<boolean>(isSandboxMode);
  const onHUDUpdateRef = useRef(onHUDUpdate);
  const onMatchEndRef = useRef(onMatchEnd);
  const onKillFeedRef = useRef(onKillFeed);
  const onMultiplayerStatusRef = useRef(onMultiplayerStatus);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    heroClassRef.current = heroClass;
  }, [heroClass]);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    sensitivityRef.current = mouseSensitivity;
  }, [mouseSensitivity]);

  useEffect(() => {
    aimAssistRef.current = aimAssistEnabled;
  }, [aimAssistEnabled]);

  useEffect(() => {
    sandboxModeRef.current = isSandboxMode;
  }, [isSandboxMode]);

  useEffect(() => {
    onHUDUpdateRef.current = onHUDUpdate;
    onMatchEndRef.current = onMatchEnd;
    onKillFeedRef.current = onKillFeed;
    onMultiplayerStatusRef.current = onMultiplayerStatus;
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const horizonHex = 0xd99b52;
    scene.background = new THREE.Color(horizonHex);
    scene.fog = new THREE.FogExp2(horizonHex, 0.0085);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x3b2f63, 0.85);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const sunKeyLight = new THREE.DirectionalLight(0xfff3d1, 2.2);
    sunKeyLight.position.set(42, 68, 36);
    sunKeyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunKeyLight.shadow.mapSize.width = 1024;
      sunKeyLight.shadow.mapSize.height = 1024;
      const d = 55;
      sunKeyLight.shadow.camera.left = -d;
      sunKeyLight.shadow.camera.right = d;
      sunKeyLight.shadow.camera.top = d;
      sunKeyLight.shadow.camera.bottom = -d;
      sunKeyLight.shadow.camera.near = 5;
      sunKeyLight.shadow.camera.far = 160;
      sunKeyLight.shadow.bias = -0.0005;
      sunKeyLight.shadow.normalBias = 0.02;
    }
    scene.add(sunKeyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    rimLight.position.set(-40, 28, -45);
    scene.add(rimLight);

    const camera = new THREE.PerspectiveCamera(
      62,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.2,
      450
    );
    camera.position.set(0, 6.5, 28);

    const { environmentObstacles, beaconRings, forgeBeamMesh, solarStormRig } =
      buildEgyptianArenaScene(scene, renderer);
    const camRaycaster = new THREE.Raycaster();

    let currentBuiltClass: HeroClassId = heroClassRef.current;
    let playerRig: CharacterRig = createHeroRig(currentBuiltClass, false);
    scene.add(playerRig.root);

    let decoyRig: CharacterRig = createHeroRig(currentBuiltClass, false);
    decoyRig.root.visible = false;
    scene.add(decoyRig.root);

    // Upgraded 3D Multi-Class Ground Trap / Vortex / Water Tornado Visual Group ([C])
    const snareVisual = createMultiClassTrapGroup();
    const snareGroup = snareVisual.group;
    scene.add(snareGroup);

    const grappleLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 5, 0),
    ]);
    const grappleLine = new THREE.Line(
      grappleLineGeo,
      new THREE.LineBasicMaterial({ color: 0xfef08a })
    );
    grappleLine.visible = false;
    scene.add(grappleLine);

    const particleGeo = new THREE.OctahedronGeometry(0.16, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_POOL_SIZE);
    particleMesh.frustumCulled = false;
    particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const particleColorAttr = new THREE.InstancedBufferAttribute(
      new Float32Array(PARTICLE_POOL_SIZE * 3),
      3
    );
    particleColorAttr.setUsage(THREE.DynamicDrawUsage);
    particleMesh.instanceColor = particleColorAttr;
    const pData = Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      scale: 1,
    }));
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      _dummyObj.position.set(0, -999, 0);
      _dummyObj.scale.setScalar(0.001);
      _dummyObj.updateMatrix();
      particleMesh.setMatrixAt(i, _dummyObj.matrix);
      particleMesh.setColorAt(i, _pColor.setHex(0xf59e0b));
    }
    particleMesh.instanceMatrix.needsUpdate = true;
    particleMesh.instanceColor.needsUpdate = true;
    scene.add(particleMesh);

    let particleCursor = 0;
    let currentParticleMultiplier = 1.0;
    function spawnParticleBurst(
      x: number,
      y: number,
      z: number,
      count: number,
      hexColor: number,
      speed = 8,
      scale = 1.1
    ) {
      _pColor.setHex(hexColor);
      const scaledCount = Math.max(1, Math.round(count * currentParticleMultiplier));
      for (let i = 0; i < scaledCount; i++) {
        const idx = particleCursor;
        particleCursor = (particleCursor + 1) % PARTICLE_POOL_SIZE;
        const p = pData[idx];
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 0.4;
        p.y = y + (Math.random() - 0.5) * 0.4;
        p.z = z + (Math.random() - 0.5) * 0.4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI - Math.PI / 3;
        const spd = speed * (0.45 + Math.random() * 0.75);
        p.vx = Math.cos(theta) * Math.cos(phi) * spd;
        p.vy = Math.abs(Math.sin(phi)) * spd + 2.2;
        p.vz = Math.sin(theta) * Math.cos(phi) * spd;
        p.maxLife = 0.28 + Math.random() * 0.32;
        p.life = p.maxLife;
        p.scale = scale;
        particleMesh.setColorAt(idx, _pColor);
      }
      if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
    }

    // --- 3D EXPANDING GROUND SHOCKWAVE RING POOL ---
    const SHOCKWAVE_POOL_SIZE = 8;
    const shockwaveGeo = new THREE.RingGeometry(0.55, 1.15, 32);
    shockwaveGeo.rotateX(-Math.PI / 2);
    const shockwaves = Array.from({ length: SHOCKWAVE_POOL_SIZE }, () => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(shockwaveGeo, mat);
      mesh.visible = false;
      scene.add(mesh);
      return {
        active: false,
        mesh,
        mat,
        life: 0,
        maxLife: 0.45,
        maxScale: 6.5,
      };
    });
    let shockwaveCursor = 0;
    function spawnShockwave(x: number, y: number, z: number, hexColor: number, maxScale = 6.5, duration = 0.45) {
      const sw = shockwaves[shockwaveCursor];
      shockwaveCursor = (shockwaveCursor + 1) % SHOCKWAVE_POOL_SIZE;
      sw.active = true;
      sw.maxLife = duration;
      sw.life = duration;
      sw.maxScale = maxScale;
      sw.mat.color.setHex(hexColor);
      sw.mat.opacity = 0.85;
      sw.mesh.position.set(x, y + 0.12, z);
      sw.mesh.scale.setScalar(0.35);
      sw.mesh.visible = true;
    }

    // --- 3D SKILL SKY PILLAR & GEODESIC PLASMA DOME POOL ---
    const SKILL_PILLAR_POOL_SIZE = 8;
    const pillarBeamGeo = new THREE.CylinderGeometry(0.42, 0.95, 22, 16, 1, true);
    pillarBeamGeo.translate(0, 11, 0);
    const pillarDomeGeo = new THREE.IcosahedronGeometry(1.0, 1);
    const skillPillars = Array.from({ length: SKILL_PILLAR_POOL_SIZE }, () => {
      const group = new THREE.Group();
      group.visible = false;
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const domeMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const beamMesh = new THREE.Mesh(pillarBeamGeo, beamMat);
      const domeMesh = new THREE.Mesh(pillarDomeGeo, domeMat);
      domeMesh.position.y = 1.0;
      group.add(beamMesh, domeMesh);
      scene.add(group);
      return {
        active: false,
        group,
        beamMesh,
        domeMesh,
        beamMat,
        domeMat,
        life: 0,
        maxLife: 0.65,
        radiusScale: 3.5,
      };
    });
    let skillPillarCursor = 0;
    function spawnSkillPillar(
      x: number,
      y: number,
      z: number,
      hexColor: number,
      radiusScale = 3.5,
      duration = 0.65
    ) {
      const sp = skillPillars[skillPillarCursor];
      skillPillarCursor = (skillPillarCursor + 1) % SKILL_PILLAR_POOL_SIZE;
      sp.active = true;
      sp.maxLife = duration;
      sp.life = duration;
      sp.radiusScale = radiusScale;
      sp.beamMat.color.setHex(hexColor);
      sp.domeMat.color.setHex(hexColor);
      sp.beamMat.opacity = 0.72;
      sp.domeMat.opacity = 0.85;
      sp.group.position.set(x, y, z);
      sp.beamMesh.scale.set(1, 1, 1);
      sp.domeMesh.scale.setScalar(0.4);
      sp.group.visible = true;
    }

    // --- 3D PERSISTENT ELEMENTAL GROUND CRATERS & SCORCH MARKS POOL ---
    const CRATER_POOL_SIZE = 10;
    const craterDiscGeo = new THREE.CircleGeometry(1.35, 20);
    craterDiscGeo.rotateX(-Math.PI / 2);
    const craterRimGeo = new THREE.RingGeometry(0.65, 1.32, 20);
    craterRimGeo.rotateX(-Math.PI / 2);
    const groundCraters = Array.from({ length: CRATER_POOL_SIZE }, () => {
      const group = new THREE.Group();
      group.visible = false;
      const scorchMat = new THREE.MeshBasicMaterial({
        color: 0x0f0a06,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      });
      const scorchMesh = new THREE.Mesh(craterDiscGeo, scorchMat);
      const glowMesh = new THREE.Mesh(craterRimGeo, glowMat);
      glowMesh.position.y = 0.02;
      group.add(scorchMesh, glowMesh);
      scene.add(group);
      return {
        active: false,
        group,
        scorchMat,
        glowMat,
        life: 0,
        maxLife: 4.5,
      };
    });
    let craterCursor = 0;
    function spawnGroundCrater(x: number, z: number, hexColor: number, scale = 1.2) {
      const cr = groundCraters[craterCursor];
      craterCursor = (craterCursor + 1) % CRATER_POOL_SIZE;
      cr.active = true;
      cr.maxLife = 4.5;
      cr.life = 4.5;
      cr.scorchMat.opacity = 0.78;
      cr.glowMat.color.setHex(hexColor);
      cr.glowMat.opacity = 0.85;
      const gy = groundHeightAt(x, z);
      cr.group.position.set(x, gy + 0.04, z);
      cr.group.rotation.y = Math.random() * Math.PI * 2;
      cr.group.scale.setScalar(scale);
      cr.group.visible = true;
    }

    const projectiles: ActiveProjectile[] = Array.from({ length: PROJECTILE_POOL_SIZE }, (_, i) => {
      const rig = createPooledProjectileRig();
      scene.add(rig.root);
      return {
        active: false,
        id: `pool-${i}`,
        ownerId: '',
        isPlayerOwned: true,
        rig,
        visualKind: 'longbow_arrow' as ProjectileVisualKind,
        x: 0,
        y: -999,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        damage: 38,
        isCharged: false,
        isScopedShot: false,
        isAmbushShot: false,
        isHighGroundShot: false,
        homingTargetId: null,
        explosiveRadius: 0,
        appliesBurn: false,
        appliesStun: false,
        colorHex: 0x10b981,
        life: 0,
      };
    });

    function acquireProjectile(): ActiveProjectile {
      for (const p of projectiles) {
        if (!p.active) return p;
      }
      return projectiles[0];
    }

    // =========================================================================
    // 100-PLAYER SOLAR BATTLE ROYALE ROSTER (99 RIVAL OUTRIDERS + 1 LOCAL PLAYER)
    // WITH HYBRID 60 FPS LOD ENGINE:
    // - LOD 0: 14 Pooled Articulated CharacterRigs (2 per HeroClassId) dynamically
    //          assigned each frame to the closest living rivals within 48m.
    // - LOD 1: InstancedCombatantCrowd (4 GPU InstancedMeshes) rendering all
    //          remaining living rivals across the 135m arena in 4 draw calls!
    // =========================================================================
    const ALL_CLASSES: HeroClassId[] = [
      'ranger',
      'ragnar',
      'bounty',
      'assassin',
      'mage',
      'warrior',
      'sniper',
    ];
    const nearRigPool: Array<{ heroClass: HeroClassId; rig: CharacterRig; inUse: boolean }> = [];
    for (const cls of ALL_CLASSES) {
      for (let k = 0; k < 2; k++) {
        const rig = createHeroRig(cls, true);
        rig.root.visible = false;
        scene.add(rig.root);
        nearRigPool.push({ heroClass: cls, rig, inUse: false });
      }
    }
    const instancedCrowd = createInstancedCombatantCrowd(scene, 100);

    const RIVAL_TEMPLATES = generate100PlayerRoster();

    const rivals: RivalActor[] = RIVAL_TEMPLATES.map((tpl, idx) => {
      const sy = groundHeightAt(tpl.spawnX, tpl.spawnZ);
      const clsSpec = HERO_CLASSES[tpl.heroClass];
      const rivalMaxHp = clsSpec.maxHp + Math.round(clsSpec.maxShield * 0.75);
      return {
        id: tpl.id,
        name: tpl.name,
        heroClass: tpl.heroClass,
        policy: tpl.policy,
        rig: null,
        isBoss: false,
        x: tpl.spawnX,
        y: sy,
        z: tpl.spawnZ,
        vx: 0,
        vz: 0,
        rotY: Math.atan2(-tpl.spawnX, -tpl.spawnZ),
        hp: rivalMaxHp,
        maxHp: rivalMaxHp,
        speed: clsSpec.baseSpeed * 0.72,
        strafeSign: idx % 2 === 0 ? 1 : -1,
        attackCooldown: 2.2 + (idx % 6) * 0.55,
        windupTimer: 0,
        windupDuration: tpl.policy === 'kiter_sniper' ? 0.7 : 0.58,
        hitFlashTimer: 0,
        snaredTimer: 0,
        burnTimer: 0,
        koTimer: 0,
        walkPhase: idx * 0.9,
        kills: 0,
        eliminated: false,
        aiSkirmishCooldown: 4.5 + (idx % 10) * 0.65,
      };
    });

    // Special World Event Actor: Solar Pharaoh Colossus Boss (awakens mid-match or via Sandbox/Boss button)
    const bossRig = createHeroRig('warrior', true);
    const bossCrownGroup = decoratePharaohBossRig(bossRig);
    const bossStartY = groundHeightAt(0, -4) + 0.6;
    bossRig.root.position.set(0, bossStartY, -4);
    bossRig.root.visible = false;
    scene.add(bossRig.root);
    const bossActor: RivalActor = {
      id: 'boss-pharaoh',
      name: 'Khepri Colossus · Solar Pharaoh',
      heroClass: 'warrior',
      policy: 'area_weaver',
      rig: bossRig,
      isBoss: true,
      bossCrownGroup,
      x: 0,
      y: bossStartY,
      z: -4,
      vx: 0,
      vz: 0,
      rotY: 0,
      hp: 340,
      maxHp: 340,
      speed: 8.6,
      strafeSign: 1,
      attackCooldown: 2.2,
      windupTimer: 0,
      windupDuration: 0.65,
      hitFlashTimer: 0,
      snaredTimer: 0,
      burnTimer: 0,
      koTimer: 9999, // Dormant until summoned at 3 kills or via Sandbox
      walkPhase: 0,
      kills: 0,
      eliminated: true,
      aiSkirmishCooldown: 99,
    };
    rivals.push(bossActor);
    let bossAwakenedThisMatch = false;

    // 6 Golden Scarab Reliquary Loot Chests distributed across inner & outer Battle Royale rings
    const CHEST_COORDS = [
      { id: 'chest-west', name: 'West Golden Reliquary', x: -13, z: -8 },
      { id: 'chest-east', name: 'East Golden Reliquary', x: 13, z: -8 },
      { id: 'chest-north', name: 'North Sanctuary Reliquary', x: 0, z: -19 },
      { id: 'chest-outer-nw', name: 'Karnak Outer NW Reliquary', x: -42, z: -38 },
      { id: 'chest-outer-ne', name: 'Luxor Outer NE Reliquary', x: 42, z: -38 },
      { id: 'chest-outer-south', name: 'Sun Gate South Reliquary', x: 0, z: 48 },
    ];
    const lootChests = CHEST_COORDS.map((c) => {
      const rig = createGoldenLootChestRig();
      const cy = groundHeightAt(c.x, c.z);
      rig.group.position.set(c.x, cy, c.z);
      scene.add(rig.group);
      return {
        id: c.id,
        name: c.name,
        rig,
        x: c.x,
        y: cy,
        z: c.z,
        opened: false,
        respawnTimer: 0,
        openAnimProgress: 0,
      };
    });

    // Pooled 3D World-to-Screen Floating Damage Numbers (Zero GC)
    const FLOATING_DMG_POOL_SIZE = 18;
    let floatingDmgSeq = 1;
    const floatingDamagePool = Array.from({ length: FLOATING_DMG_POOL_SIZE }, () => ({
      active: false,
      id: 0,
      worldX: 0,
      worldY: 0,
      worldZ: 0,
      vy: 1.8,
      amount: 0,
      isCrit: false,
      label: '',
      color: '#fef08a',
      life: 0,
      maxLife: 1.15,
    }));

    function spawnFloatingDamage(
      worldX: number,
      worldY: number,
      worldZ: number,
      amount: number,
      isCrit: boolean,
      color = '#fef08a',
      label = ''
    ) {
      let slot = floatingDamagePool.find((d) => !d.active);
      if (!slot) slot = floatingDamagePool[0];
      slot.active = true;
      slot.id = floatingDmgSeq++;
      slot.worldX = worldX + (Math.random() - 0.5) * 0.65;
      slot.worldY = worldY + 1.85;
      slot.worldZ = worldZ + (Math.random() - 0.5) * 0.65;
      slot.vy = isCrit ? 2.35 : 1.75;
      slot.amount = Math.round(amount);
      slot.isCrit = isCrit;
      slot.label = label;
      slot.color = isCrit ? '#facc15' : color;
      slot.maxLife = isCrit ? 1.35 : 1.05;
      slot.life = slot.maxLife;
    }

    // Pooled Directional Hit Indicator Arcs
    let hitArcSeq = 1;
    const hitArcPool = Array.from({ length: 6 }, () => ({
      active: false,
      id: 0,
      attackerX: 0,
      attackerZ: 0,
      life: 0,
      maxLife: 1.1,
    }));

    function spawnDirectionalHitArc(attackerX: number, attackerZ: number) {
      let slot = hitArcPool.find((a) => !a.active);
      if (!slot) slot = hitArcPool[0];
      slot.active = true;
      slot.id = hitArcSeq++;
      slot.attackerX = attackerX;
      slot.attackerZ = attackerZ;
      slot.maxLife = 1.1;
      slot.life = 1.1;
    }

    const showroom = {
      yawOffset: 0,
      autoRotate: true,
      weaponSlot: 1 as WeaponSlotId,
      forgeLevel: 2,
      poseTimer: 0,
    };

    const remoteRigs = new Map<string, { rig: CharacterRig; data: SyncedRemotePlayer }>();

    const player = {
      x: 0,
      y: groundHeightAt(0, 18),
      visualY: groundHeightAt(0, 18),
      z: 18,
      vx: 0,
      vy: 0,
      vz: 0,
      rotY: Math.PI,
      camYaw: Math.PI,
      camPitch: -0.04,
      hp: HERO_CLASSES[currentBuiltClass].maxHp,
      maxHp: HERO_CLASSES[currentBuiltClass].maxHp,
      ghostHp: HERO_CLASSES[currentBuiltClass].maxHp,
      shield: HERO_CLASSES[currentBuiltClass].maxShield,
      maxShield: HERO_CLASSES[currentBuiltClass].maxShield,
      activeWeaponSlot: 1 as WeaponSlotId,
      magicShards: 40,
      forgeLevel: 0,
      forgeBeamTimer: 0,
      isScoped: false,
      drawCharge: 0,
      isDrawing: false,
      fireCooldown: 0,
      weaponRecoilTimer: 0,
      weaponSwapTimer: 0,
      weaponReloadTimer: 0,
      weaponInspectTimer: 0,
      isCamouflaged: false,
      camouflageTimer: 0,
      decoyActive: false,
      decoyX: 0,
      decoyY: 0,
      decoyZ: 0,
      isMounted: false,
      isDownedScarab: false,
      isPropDisguised: false,
      scarabTimer: 0,
      scarabMaxDuration: 6.0,
      relicReady: true,
      relicCooldown: 0,
      dashTimer: 0,
      dashSpeed: 22.0,
      dashRamDamage: 0,
      dashDirX: 0,
      dashDirZ: 0,
      auraTimer: 0,
      auraType: 'none' as
        | 'none'
        | 'steady_aim'
        | 'vintage_wine'
        | 'whirl_dance'
        | 'waters_curse'
        | 'bulwark_shield'
        | 'corsair_surge',
      wingsTimer: 0,
      grappleActive: false,
      grappleTimer: 0,
      grappleDuration: 0.48,
      grappleStartX: 0,
      grappleStartY: 0,
      grappleStartZ: 0,
      grappleTargetX: 0,
      grappleTargetY: 0,
      grappleTargetZ: 0,
      snareActive: false,
      snareMode: 'root' as 'root' | 'vortex' | 'geyser',
      snareTimer: 0,
      snareX: 0,
      snareY: 0,
      snareZ: 0,
      isHighGround: false,
      perchName: null as string | null,
      cooldowns: { q: 0, e: 0, c: 0, r: 0, v: 0, dash: 0 },
      hitFlashTimer: 0,
      walkPhase: 0,
      scaleX: 1,
      scaleY: 1,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      grounded: true,
      kills: 0,
      headshots: 0,
      score: 0,
      bestScore: Number(localStorage.getItem('khepri_best_score') || '0'),
      wave: 1,
      damageDealt: 0,
      matchTime: 0,
      shotsFired: 0,
      shotsHit: 0,
      maxSingleDamage: 0,
      currentStreak: 0,
      bestStreak: 0,
      streakTimer: 0,
      streakTitle: '',
      streakArabicTitle: '',
      streakSpeedBonus: 0,
      streakDamageBonus: 0,
      bossesDefeated: 0,
      chestsOpened: 0,
      sandboxZeroCooldown: false,
      endingTriggered: false,
      endDelayTimer: 0,
      pendingOutcome: null as 'victory' | 'defeat' | null,
      lastHitBanner: null as { text: string; isCrit: boolean; id: number } | null,
      bannerTimer: 0,
    };

    let hitstopTimer = 0;
    let cameraTrauma = 0;
    let titleOrbitAngle = 0;
    let camRoll = 0;
    let footstepDustAccum = 0;
    let stormDamageTickTimer = 0;
    let aiKillFeedCooldown = 0;
    let aiEliminationCooldown = 4.0;
    let frameTickCounter = 0;
    let smoothedCamDist = 7.8;
    const spatialGrid = new ArenaSpatialHashGrid();
    const spatialQueryScratch: number[] = [];
    const inputBuffer = new CombatInputBuffer();

    function awakenPharaohBoss() {
      if (bossActor.koTimer === 0) return;
      bossAwakenedThisMatch = true;
      bossActor.x = 0;
      bossActor.z = -3.5;
      bossActor.y = groundHeightAt(0, -3.5) + 0.6;
      bossActor.maxHp = 340;
      bossActor.hp = 340;
      bossActor.koTimer = 0;
      bossActor.eliminated = false;
      bossActor.burnTimer = 0;
      bossActor.snaredTimer = 0;
      bossActor.windupTimer = 0;
      bossActor.attackCooldown = 1.6;
      if (bossActor.rig) {
        bossActor.rig.root.visible = true;
        bossActor.rig.root.rotation.set(0, 0, 0);
        bossActor.rig.root.position.set(bossActor.x, bossActor.y, bossActor.z);
      }
      audioEngine.playCombatAnnouncer('boss_spawn');
      spawnShockwave(bossActor.x, bossActor.y, bossActor.z, 0xfacc15, 11.5, 0.7);
      spawnSkillPillar(bossActor.x, bossActor.y, bossActor.z, 0xfacc15, 5.5, 0.85);
      spawnParticleBurst(bossActor.x, bossActor.y + 1.8, bossActor.z, 34, 0xfacc15, 14, 1.6);
      player.lastHitBanner = {
        text: '👑 SOLAR PHARAOH COLOSSUS AWAKENED AT THE SANCTUARY DAIS!',
        isCrit: true,
        id: Date.now(),
      };
      player.bannerTimer = 3.2;
    }

    const mpClient = new ArenaMultiplayerClient(
      {
        onPlayersChange: (remoteMap) => {
          for (const [id, entry] of remoteRigs.entries()) {
            if (!remoteMap.has(id)) {
              scene.remove(entry.rig.root);
              disposeCharacterRig(entry.rig);
              remoteRigs.delete(id);
            }
          }
          for (const [id, pState] of remoteMap.entries()) {
            const validClass: HeroClassId =
              pState.heroClass && pState.heroClass in HERO_CLASSES ? pState.heroClass : 'ranger';
            let entry = remoteRigs.get(id);
            if (!entry) {
              const rRig = createHeroRig(validClass, true);
              scene.add(rRig.root);
              entry = { rig: rRig, data: { ...pState, heroClass: validClass } };
              remoteRigs.set(id, entry);
            } else {
              entry.data = { ...pState, heroClass: validClass };
            }
          }
        },
        onRemoteProjectile: (proj) => {
          const p = acquireProjectile();
          p.active = true;
          p.id = proj.id;
          p.ownerId = proj.ownerId;
          p.isPlayerOwned = false;
          p.x = proj.x;
          p.y = proj.y;
          p.z = proj.z;
          p.vx = proj.vx;
          p.vy = proj.vy;
          p.vz = proj.vz;
          p.damage = proj.damage;
          p.isCharged = proj.isCharged;
          p.homingTargetId = null;
          p.explosiveRadius = 0;
          p.appliesBurn = false;
          p.appliesStun = false;
          p.colorHex = 0xef4444;
          const validProjClass: HeroClassId =
            proj.heroClass && proj.heroClass in HERO_CLASSES ? proj.heroClass : 'ranger';
          p.visualKind = getWeaponVisualKind(validProjClass, 1);
          p.life = 2.2;
          configureProjectileVisual(p.rig, p.visualKind, 0xef4444, p.isCharged);
          p.rig.root.visible = true;
          p.rig.root.position.set(p.x, p.y, p.z);
          p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
        },
        onLocalDamaged: ({ attackerName, damage, isHeadshot }) => {
          if (stateRef.current !== 'playing' || player.endingTriggered) return;
          applyDamageToLocalPlayer(damage, attackerName, isHeadshot, 0, 0);
        },
        onKillFeed: (ev) => {
          onKillFeedRef.current(ev);
        },
        onConnectionChange: (connected, rId, onlineCount) => {
          onMultiplayerStatusRef.current(connected, rId, onlineCount);
        },
      },
      roomIdRef.current
    );
    mpClient.connect(roomIdRef.current, heroClassRef.current);

    function applyDamageToLocalPlayer(
      damage: number,
      sourceName: string,
      isCrit = false,
      attackerX = 0,
      attackerZ = 0
    ) {
      if (player.endingTriggered || player.dashTimer > 0) return;
      // Ragnar's [Q] Sea Ward · Bulwark Shield reduces incoming damage by 60%!
      const effectiveDamage =
        player.auraTimer > 0 && player.auraType === 'bulwark_shield'
          ? Math.max(1, Math.round(damage * 0.4))
          : damage;
      audioEngine.playPlayerHurt();
      player.hitFlashTimer = 0.08;
      cameraTrauma = Math.min(1, cameraTrauma + (isCrit ? 0.45 : 0.28));
      spawnDirectionalHitArc(attackerX, attackerZ);

      const res = applyDamageWithScarabRelic(
        {
          isDownedScarab: player.isDownedScarab,
          scarabTimer: player.scarabTimer,
          scarabMaxDuration: player.scarabMaxDuration,
          relicReady: player.relicReady,
          relicCooldown: player.relicCooldown,
          hp: player.hp,
          maxHp: player.maxHp,
          shield: player.shield,
          maxShield: player.maxShield,
        },
        effectiveDamage
      );

      player.hp = res.nextState.hp;
      player.shield = res.nextState.shield;
      player.isDownedScarab = res.nextState.isDownedScarab;
      player.scarabTimer = res.nextState.scarabTimer;
      player.relicReady = res.nextState.relicReady;
      player.relicCooldown = res.nextState.relicCooldown;

      if (res.enteredScarab) {
        player.isMounted = false;
        player.isScoped = false;
        player.isCamouflaged = false;
        player.isPropDisguised = false;
        hitstopTimer = 0.06;
        audioEngine.playScarabTransform(false);
        spawnParticleBurst(player.x, player.y + 1.0, player.z, 24, 0xf59e0b, 11, 1.4);
        player.lastHitBanner = {
          text: 'BABY DRAGON REVIVAL! PRESS [Q] TO DISGUISE AS DESERT PROP!',
          isCrit: true,
          id: Date.now(),
        };
        player.bannerTimer = 3.2;
      } else if (res.eliminated) {
        if (sandboxModeRef.current) {
          // In Sandbox Practice Mode, auto-restore player instead of ending the session
          player.hp = player.maxHp;
          player.shield = player.maxShield;
          player.isDownedScarab = false;
          player.relicReady = true;
          return;
        }
        player.endingTriggered = true;
        player.pendingOutcome = 'defeat';
        player.endDelayTimer = 0.55;
        hitstopTimer = 0.07;
        spawnParticleBurst(player.x, player.y + 1.0, player.z, 28, 0xef4444, 12, 1.5);
        mpClient.emitKill(mpClient.localName, sourceName, 'rival', false);
      }
    }

    function countAliveNonBossRivals(): number {
      let alive = 0;
      for (const rv of rivals) {
        if (!rv.isBoss && rv.koTimer === 0 && !rv.eliminated) {
          alive++;
        }
      }
      return alive;
    }

    function checkAndHandleRivalElimination(r: RivalActor, weaponName: string, isHeadshot: boolean) {
      if (r.hp > 0 || r.koTimer > 0) return false;
      if (r.isBoss) {
        r.koTimer = 9999;
        r.eliminated = true;
        if (r.rig) r.rig.root.visible = false;
      } else if (sandboxModeRef.current) {
        r.koTimer = 0.48;
        r.eliminated = false;
      } else {
        // In 100-Player Battle Royale, eliminated rivals are permanently out of the match!
        r.koTimer = 9999;
        r.eliminated = true;
        if (r.rig) {
          r.rig.root.visible = false;
          r.rig = null;
        }
      }
      player.kills += 1;
      player.magicShards += r.isBoss ? 65 : 25;
      if (isHeadshot) player.headshots += 1;
      player.score += r.isBoss ? 550 : isHeadshot ? 250 : 150;
      if (player.kills % 3 === 0) player.wave += 1;

      // Update Killstreak & Announcer
      player.currentStreak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
      const streakInfo = evaluateKillstreak(player.currentStreak);
      player.streakTimer = streakInfo.timer;
      player.streakTitle = streakInfo.title;
      player.streakArabicTitle = streakInfo.arabicTitle;
      player.streakSpeedBonus = streakInfo.speedBonusRatio;
      player.streakDamageBonus = streakInfo.damageBonusRatio;

      if (r.isBoss) {
        player.bossesDefeated += 1;
        player.forgeLevel = Math.min(3, player.forgeLevel + 1);
        player.hp = player.maxHp;
        player.shield = player.maxShield;
        audioEngine.playCombatAnnouncer('boss_slain');
        spawnShockwave(r.x, r.y, r.z, 0xfacc15, 13.0, 0.75);
        spawnSkillPillar(r.x, r.y, r.z, 0xfacc15, 6.2, 0.9);
        player.lastHitBanner = {
          text: `👑 PHARAOH COLOSSUS SLAIN! +65 SHARDS · +550 SCORE · FREE FORGE LV${player.forgeLevel}!`,
          isCrit: true,
          id: Date.now(),
        };
        player.bannerTimer = 3.4;
      } else if (streakInfo.announcerCue !== 'none') {
        audioEngine.playCombatAnnouncer(streakInfo.announcerCue);
      }

      // Awaken Pharaoh Boss automatically at 3 kills if not awakened yet
      if (player.kills === 3 && !bossAwakenedThisMatch && bossActor.koTimer > 0) {
        awakenPharaohBoss();
      }

      mpClient.emitKill(r.name, weaponName, heroClassRef.current, isHeadshot);

      const remainingRivals = countAliveNonBossRivals();
      if (
        isBattleRoyaleVictory(remainingRivals, false, sandboxModeRef.current) &&
        !player.endingTriggered
      ) {
        player.endingTriggered = true;
        player.pendingOutcome = 'victory';
        player.endDelayTimer = 0.55;
      }
      return true;
    }

    function findBestCrosshairTarget(): { rival: RivalActor | null; dot: number } {
      const aim = computeAimRayDirection(player.camYaw, player.camPitch);
      let bestRival: RivalActor | null = null;
      let bestDot = aimAssistRef.current ? (player.isScoped ? 0.90 : 0.93) : 0.992;

      for (const r of rivals) {
        if (r.koTimer > 0) continue;
        const tx = r.x - camera.position.x;
        const ty = r.y + 1.4 - camera.position.y;
        const tz = r.z - camera.position.z;
        const dist = Math.hypot(tx, ty, tz) || 1;
        const dot = (tx / dist) * aim.dirX + (ty / dist) * aim.dirY + (tz / dist) * aim.dirZ;
        if (dot > bestDot) {
          bestDot = dot;
          bestRival = r;
        }
      }
      return { rival: bestRival, dot: bestDot };
    }

    function findClosestLivingRival(): RivalActor | null {
      let best: RivalActor | null = null;
      let bestDist = Infinity;
      for (const r of rivals) {
        if (r.koTimer > 0) continue;
        const d = Math.hypot(r.x - player.x, r.z - player.z);
        if (d < bestDist) {
          bestDist = d;
          best = r;
        }
      }
      return best;
    }

    /**
     * Fires the currently equipped Ride Out Heroes occupational weapon ([1] or [2])
     * with class-specific projectile count, spread, homing, burn, stun, or AoE explosion!
     */
    function firePlayerWeapon(drawCharge: number) {
      if (player.isDownedScarab || player.endingTriggered) return;
      if (player.fireCooldown > 0) {
        inputBuffer.enqueueFire(performance.now());
        return;
      }
      const spec = HERO_CLASSES[heroClassRef.current];
      const weapon = spec.weapons[player.activeWeaponSlot];
      const fireRateScale =
        player.auraTimer > 0 &&
        (player.auraType === 'steady_aim' ||
          player.auraType === 'vintage_wine' ||
          player.auraType === 'corsair_surge')
          ? 0.55
          : 0.88;
      player.fireCooldown = weapon.fireCooldown * fireRateScale;

      if (player.isMounted) {
        player.isMounted = false;
      }
      const wasCamouflaged = player.isCamouflaged;
      if (player.isCamouflaged) {
        player.isCamouflaged = false;
        player.camouflageTimer = 0;
        player.decoyActive = false;
        decoyRig.root.visible = false;
      }

      player.rotY = player.camYaw;

      const aim = computeAimRayDirection(player.camYaw, player.camPitch);
      const { rival: lockedRival } = findBestCrosshairTarget();

      const spawnX = player.x + Math.sin(player.camYaw) * 0.85;
      const spawnY = player.y + 1.42;
      const spawnZ = player.z + Math.cos(player.camYaw) * 0.85;

      let baseDirX = aim.dirX;
      let baseDirY = aim.dirY;
      let baseDirZ = aim.dirZ;

      if (lockedRival && aimAssistRef.current) {
        const targetHeight = player.isScoped || drawCharge >= 0.75 ? 1.82 : 1.38;
        const tx = lockedRival.x + lockedRival.vx * 0.14 - spawnX;
        const ty = lockedRival.y + targetHeight - spawnY;
        const tz = lockedRival.z + lockedRival.vz * 0.14 - spawnZ;
        const len = Math.hypot(tx, ty, tz) || 1;
        baseDirX = tx / len;
        baseDirY = ty / len;
        baseDirZ = tz / len;
      } else {
        const farX = camera.position.x + aim.dirX * 36;
        const farY = Math.max(groundHeightAt(player.x, player.z) + 0.4, camera.position.y + aim.dirY * 36);
        const farZ = camera.position.z + aim.dirZ * 36;
        const tx = farX - spawnX;
        const ty = farY - spawnY;
        const tz = farZ - spawnZ;
        const len = Math.hypot(tx, ty, tz) || 1;
        baseDirX = tx / len;
        baseDirY = ty / len;
        baseDirZ = tz / len;
      }

      // Ragnar's Spectral Cutlass [1] unleashes 3 simultaneous crescent slash waves in a wide arc
      // when charged (drawCharge >= 0.65), scoped, or upgraded at the Sanctuary Forge (forgeLevel >= 1)!
      const isRagnarWideSlash =
        heroClassRef.current === 'ragnar' &&
        player.activeWeaponSlot === 1 &&
        (drawCharge >= 0.65 || player.isScoped || player.forgeLevel >= 1);
      const burstCount = isRagnarWideSlash ? 3 : weapon.burstCount;
      const spd = weapon.projectileSpeed * (player.isScoped ? 1.35 : 1.1);
      const rightX = -Math.cos(player.camYaw);
      const rightZ = Math.sin(player.camYaw);

      player.shotsFired += 1;

      for (let b = 0; b < burstCount; b++) {
        const spreadIdx = burstCount === 1 ? 0 : b - (burstCount - 1) / 2;
        const spread = spreadIdx * weapon.spreadAngle;
        const dx = baseDirX + rightX * spread;
        const dy = baseDirY;
        const dz = baseDirZ + rightZ * spread;
        const dLen = Math.hypot(dx, dz, dy) || 1;

        const p = acquireProjectile();
        p.active = true;
        p.id = `${mpClient.localPlayerId}-${Date.now()}-${b}`;
        p.ownerId = mpClient.localPlayerId;
        p.isPlayerOwned = true;
        p.x = spawnX + rightX * spreadIdx * 0.12;
        p.y = spawnY;
        p.z = spawnZ + rightZ * spreadIdx * 0.12;
        p.vx = (dx / dLen) * spd;
        p.vy = (dy / dLen) * spd;
        p.vz = (dz / dLen) * spd;
        p.damage = Math.round(weapon.baseDamage * (1 + player.streakDamageBonus));
        p.isCharged = drawCharge >= 0.65 || player.activeWeaponSlot === 2;
        p.isScopedShot = player.isScoped;
        p.isAmbushShot = wasCamouflaged;
        p.isHighGroundShot = player.isHighGround;
        p.homingTargetId =
          lockedRival && (aimAssistRef.current || player.activeWeaponSlot === 2)
            ? lockedRival.id
            : null;
        p.explosiveRadius = weapon.explosiveRadius || 0;
        p.appliesBurn = Boolean(weapon.appliesBurn);
        p.appliesStun = Boolean(weapon.appliesStun);
        p.colorHex = p.isAmbushShot ? 0xfacc15 : weapon.projectileColor;
        p.visualKind = getWeaponVisualKind(heroClassRef.current, player.activeWeaponSlot);
        p.life = 2.4;
        configureProjectileVisual(p.rig, p.visualKind, p.colorHex, p.isCharged);
        p.rig.root.visible = true;
        p.rig.root.position.set(p.x, p.y, p.z);
        p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);

        if (b === 0) {
          mpClient.emitProjectile({
            id: p.id,
            heroClass: heroClassRef.current,
            x: p.x,
            y: p.y,
            z: p.z,
            vx: p.vx,
            vy: p.vy,
            vz: p.vz,
            damage: p.damage,
            isCharged: p.isCharged,
          });
        }
      }

      player.weaponRecoilTimer = 0.18;
      player.scaleX = 1.1;
      player.scaleY = 0.92;
      cameraTrauma = Math.min(1, cameraTrauma + (player.isScoped ? 0.16 : 0.07));
      audioEngine.playClassWeaponFire(heroClassRef.current, player.activeWeaponSlot, drawCharge, player.isScoped);
      spawnParticleBurst(
        spawnX,
        spawnY,
        spawnZ,
        burstCount > 1 ? 14 : 8,
        weapon.projectileColor,
        8,
        0.9
      );
      if (heroClassRef.current === 'ragnar' && player.activeWeaponSlot === 2) {
        // Naval Cannon Gunpowder Smoke & Muzzle Shockwave Ring!
        spawnParticleBurst(spawnX, spawnY, spawnZ, 18, 0xfef08a, 10, 1.25);
        spawnShockwave(spawnX, player.y + 0.15, spawnZ, 0xf97316, 3.8, 0.32);
      }
    }

    function swapWeapon(targetSlot?: WeaponSlotId) {
      if (stateRef.current !== 'playing') return;
      const nextSlot: WeaponSlotId = targetSlot ? targetSlot : player.activeWeaponSlot === 1 ? 2 : 1;
      player.activeWeaponSlot = nextSlot;
      player.weaponSwapTimer = 0.35;
      player.weaponInspectTimer = 0;
      const weapon = HERO_CLASSES[heroClassRef.current].weapons[nextSlot];
      audioEngine.playBowDraw();
      player.lastHitBanner = {
        text: `EQUIPPED [${nextSlot}] ${weapon.name.toUpperCase()} · ${weapon.roleClue.toUpperCase()}`,
        isCrit: false,
        id: Date.now(),
      };
      player.bannerTimer = 1.8;
    }

    function triggerReload() {
      if (stateRef.current !== 'playing' || player.isDownedScarab || player.endingTriggered) return;
      player.weaponReloadTimer = 0.65;
      player.weaponInspectTimer = 0;
      player.fireCooldown = 0;
      const weapon = HERO_CLASSES[heroClassRef.current].weapons[player.activeWeaponSlot];
      audioEngine.playBowDraw();
      spawnParticleBurst(player.x, player.y + 1.35, player.z, 10, weapon.projectileColor, 5.5, 0.85);
      player.lastHitBanner = {
        text: `RELOADED [${player.activeWeaponSlot}] ${weapon.name.toUpperCase()} · FULL SOLAR CHARGE READY!`,
        isCrit: false,
        id: Date.now(),
      };
      player.bannerTimer = 1.8;
    }

    function triggerInspect() {
      if (stateRef.current !== 'playing' || player.isDownedScarab || player.endingTriggered) return;
      if (player.weaponInspectTimer > 0) {
        player.weaponInspectTimer = 0;
        return;
      }
      player.weaponInspectTimer = 2.8;
      player.isScoped = false;
      const weapon = HERO_CLASSES[heroClassRef.current].weapons[player.activeWeaponSlot];
      audioEngine.playBowDraw();
      const tierLabel = player.forgeLevel > 0 ? ` (FORGE +${player.forgeLevel} MASTERWORK)` : ' (BASE TIER)';
      player.lastHitBanner = {
        text: `INSPECTING [${player.activeWeaponSlot}] ${weapon.name.toUpperCase()}${tierLabel}`,
        isCrit: player.forgeLevel > 0,
        id: Date.now(),
      };
      player.bannerTimer = 2.8;
    }

    /**
     * Ride Out Heroes Sanctuary Forge System ([G]):
     * Crafts higher-tier occupational weapons (+18% DMG per tier) and restores Vitality & Shield!
     */
    function triggerForge() {
      if (stateRef.current !== 'playing' || player.isDownedScarab || player.endingTriggered) return;
      const cost = 40;
      if (player.magicShards < cost && !sandboxModeRef.current) {
        player.lastHitBanner = {
          text: `NEED ${cost} MAGIC SHARDS TO FORGE (CURRENT: ${player.magicShards})`,
          isCrit: false,
          id: Date.now(),
        };
        player.bannerTimer = 2.0;
        return;
      }
      if (!sandboxModeRef.current) {
        player.magicShards -= cost;
      }
      player.forgeLevel = Math.min(3, player.forgeLevel + 1);
      player.hp = Math.min(player.maxHp, player.hp + 45);
      player.shield = player.maxShield;
      player.forgeBeamTimer = 1.25;
      forgeBeamMesh.position.set(player.x, groundHeightAt(player.x, player.z), player.z);
      (forgeBeamMesh.material as THREE.MeshBasicMaterial).opacity = 0.28;
      audioEngine.playScarabTransform(true);
      audioEngine.playCombatAnnouncer('forge_upgrade');
      spawnParticleBurst(player.x, player.y + 1.2, player.z, 26, 0xfacc15, 11, 1.35);
      spawnShockwave(player.x, player.y, player.z, 0xfacc15, 7.5, 0.55);
      spawnSkillPillar(player.x, player.y, player.z, 0xfacc15, 3.2, 0.7);
      const spec = HERO_CLASSES[heroClassRef.current];
      player.lastHitBanner = {
        text: `SANCTUARY FORGE LV${player.forgeLevel}: ${spec.primaryWeapon.toUpperCase()} & ${spec.secondaryWeapon.toUpperCase()} UPGRADED!`,
        isCrit: true,
        id: Date.now(),
      };
      player.bannerTimer = 2.8;
    }

    function triggerDash(forwardInput = 0, rightInput = 0) {
      if (
        stateRef.current !== 'playing' ||
        player.isDownedScarab ||
        player.endingTriggered
      ) {
        return;
      }
      if (player.cooldowns.dash > 0) {
        inputBuffer.enqueueDash(performance.now());
        return;
      }
      player.cooldowns.dash = player.sandboxZeroCooldown ? 0.15 : 2.6;
      player.dashTimer = 0.25;
      player.dashSpeed = 22.0;
      player.dashRamDamage = 0;

      const rel = computeCameraRelativeMovement(
        forwardInput === 0 && rightInput === 0 ? 1 : forwardInput,
        rightInput,
        player.camYaw
      );
      player.dashDirX = rel.moveDirX;
      player.dashDirZ = rel.moveDirZ;
      player.rotY = Math.atan2(player.dashDirX, player.dashDirZ);
      player.scaleX = 1.24;
      player.scaleY = 0.76;
      audioEngine.playGrappleLaunch();
      spawnParticleBurst(player.x, player.y + 0.6, player.z, 14, 0xf59e0b, 9, 1.0);
    }

    /**
     * Executes each Ride Out Heroes character's authentic, class-specific skill kit
     * for [Q], [E], [C], [R], and [V]!
     */
    function triggerAbility(slot: AbilitySlotId) {
      if (stateRef.current !== 'playing' || player.endingTriggered) return;

      // Ride Out Heroes Prop Disguise when in Baby Dragon Revival State!
      if (player.isDownedScarab) {
        if (slot === 'q') {
          player.isPropDisguised = !player.isPropDisguised;
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.x, player.y + 0.6, player.z, 14, 0xfacc15, 8, 1.1);
          player.lastHitBanner = {
            text: player.isPropDisguised
              ? 'PROP DISGUISE ACTIVE · HIDDEN AS DESERT AMPHORA!'
              : 'BABY DRAGON FORM · RUN TO COVER!',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.0;
        }
        return;
      }

      const cls = heroClassRef.current;
      const spec = HERO_CLASSES[cls].abilities[slot];
      if (player.cooldowns[slot] > 0 || player.dashTimer > 0) {
        inputBuffer.enqueueAbility(slot, performance.now());
        return;
      }

      player.cooldowns[slot] = player.sandboxZeroCooldown ? 0.15 : spec.cooldown;

      // Universal [V] Desert Raptor Mount across all classes
      if (slot === 'v') {
        player.isMounted = !player.isMounted;
        if (player.isMounted) {
          player.isScoped = false;
        }
        audioEngine.playMountSummon(player.isMounted);
        spawnParticleBurst(player.x, player.y + 0.8, player.z, 16, 0xf59e0b, 8, 1.15);
        player.lastHitBanner = {
          text: player.isMounted
            ? 'DESERT RAPTOR MOUNT SUMMONED (+60% SPRINT SPEED)'
            : 'DISMOUNTED · READY FOR COMBAT',
          isCrit: false,
          id: Date.now(),
        };
        player.bannerTimer = 1.8;
        return;
      }

      const { rival: aimedRival } = findBestCrosshairTarget();
      const targetRival = aimedRival || findClosestLivingRival();

      // ========================================================================
      // 1. RANGER · ROBIN (Greenwood Ranger)
      // ========================================================================
      if (cls === 'ranger') {
        if (slot === 'q') {
          // RAVEN SHADE: Stealth camouflage + Raven Shade decoy + +60% Ambush Crit
          player.isCamouflaged = true;
          player.camouflageTimer = spec.duration || 4.5;
          player.hp = Math.min(player.maxHp, player.hp + 18);
          player.decoyActive = true;
          player.decoyX = player.x;
          player.decoyY = player.y;
          player.decoyZ = player.z;
          decoyRig.root.position.set(player.x, player.y, player.z);
          decoyRig.root.rotation.y = player.rotY;
          decoyRig.root.visible = true;
          updateCharacterVisualState(decoyRig, {
            isCamouflaged: true,
            isMounted: false,
            isDownedScarab: false,
            activeWeaponSlot: player.activeWeaponSlot,
            hitFlashTimer: 0,
            drawCharge: 0.65,
            walkPhase: 0,
            speedRatio: 0,
          });
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 22, 0x10b981, 9, 1.25);
          player.lastHitBanner = {
            text: 'RAVEN SHADE · STEALTH DECOY & +60% AMBUSH CRIT',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'e') {
          // DAZING ARROW: Stunning shock arrow + High-Ground Sniper Vault
          if (targetRival && targetRival.koTimer === 0) {
            targetRival.snaredTimer = 2.8;
            targetRival.windupTimer = 0;
            targetRival.hp = Math.max(0, targetRival.hp - 36);
            targetRival.hitFlashTimer = 0.14;
            player.damageDealt += 36;
            spawnParticleBurst(targetRival.x, targetRival.y + 1.4, targetRival.z, 20, 0xfacc15, 10, 1.3);
            spawnSkillPillar(targetRival.x, targetRival.y, targetRival.z, 0xfacc15, 2.8, 0.55);
            checkAndHandleRivalElimination(targetRival, 'Dazing Arrow', false);
          }
          const target = findBestGrappleTarget(
            player.x,
            player.z,
            Math.sin(player.camYaw),
            Math.cos(player.camYaw)
          );
          player.grappleActive = true;
          player.grappleTimer = 0;
          player.grappleDuration = 0.48;
          player.grappleStartX = player.x;
          player.grappleStartY = player.y;
          player.grappleStartZ = player.z;
          player.grappleTargetX = target.x;
          player.grappleTargetY = target.y;
          player.grappleTargetZ = target.z;
          player.isMounted = false;
          audioEngine.playGrappleLaunch();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 14, 0xfacc15, 10, 1.1);
          player.lastHitBanner = {
            text: `DAZING ARROW STUN + VAULT TO ${target.perchName.toUpperCase()}`,
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.2;
        } else if (slot === 'c') {
          // ELVISH TRAP: Root snare trap on ground with 3D emerald thorn-vine spikes
          player.snareActive = true;
          player.snareMode = 'root';
          player.snareTimer = spec.duration || 6.0;
          player.snareX = player.x + Math.sin(player.camYaw) * 8.0;
          player.snareZ = player.z + Math.cos(player.camYaw) * 8.0;
          player.snareY = groundHeightAt(player.snareX, player.snareZ);
          snareVisual.outerRingMat.color.setHex(0x10b981);
          snareVisual.coreOrbMat.color.setHex(0x10b981);
          snareVisual.vineSpikesGroup.visible = true;
          snareVisual.vortexFunnelMesh.visible = false;
          snareGroup.position.set(player.snareX, player.snareY, player.snareZ);
          snareGroup.visible = true;
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.snareX, player.snareY + 0.8, player.snareZ, 18, 0x10b981, 8, 1.15);
          spawnShockwave(player.snareX, player.snareY, player.snareZ, 0x10b981, 5.8, 0.45);
          player.lastHitBanner = {
            text: 'ELVISH TRAP DEPLOYED · IMMOBILIZES & ROOTS ENEMIES',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.2;
        } else if (slot === 'r') {
          // HUNTER ORB & STEADY AIM: Marks nearby rivals within 38m with 3D orbital lock-on beams
          player.auraTimer = spec.duration || 6.0;
          player.auraType = 'steady_aim';
          const { affected, vfxTargets } = selectBoundedAoETargets(player.x, player.z, rivals, 38, 6);
          for (const r of affected) {
            r.snaredTimer = Math.max(r.snaredTimer, 6.0);
          }
          for (const r of vfxTargets) {
            spawnParticleBurst(r.x, r.y + 1.8, r.z, 12, 0x38bdf8, 8, 1.15);
            spawnSkillPillar(r.x, r.y, r.z, 0x38bdf8, 2.2, 0.55);
          }
          audioEngine.playScarabTransform(true);
          spawnParticleBurst(player.x, player.y + 1.5, player.z, 22, 0x38bdf8, 10, 1.3);
          spawnShockwave(player.x, player.y, player.z, 0x10b981, 7.5, 0.5);
          player.lastHitBanner = {
            text: `HUNTER ORB & STEADY AIM · ${Math.max(1, affected.length)} RIVALS MARKED (+30% DMG & +40% FIRE RATE)!`,
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.6;
        }
        return;
      }

      // ========================================================================
      // 1B. RAGNAR · PIRATE KING (Cursed Ghost Pirate)
      // ========================================================================
      if (cls === 'ragnar') {
        if (slot === 'q') {
          // SEA WARD · BULWARK SHIELD: Pops up 3D forward pirate bulwark shield (+75 Shield & 60% Damage Reduction)
          player.shield = Math.min(player.maxShield, player.shield + 75);
          player.auraTimer = spec.duration || 5.0;
          player.auraType = 'bulwark_shield';
          // Knockback & damage nearby foes who stand directly in front of the shield slam
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - player.x, r.z - player.z) <= 5.5) {
              r.hp = Math.max(0, r.hp - 28);
              r.snaredTimer = Math.max(r.snaredTimer, 1.4);
              r.hitFlashTimer = 0.12;
              player.damageDealt += 28;
              spawnFloatingDamage(r.x, r.y + 1.8, r.z, 28, false, '#2dd4bf', 'SHIELD SLAM');
              checkAndHandleRivalElimination(r, 'Sea Ward Shield', false);
            }
          }
          audioEngine.playScarabTransform(true);
          spawnParticleBurst(player.x, player.y + 1.2, player.z, 26, 0x2dd4bf, 10, 1.35);
          spawnShockwave(player.x, player.y, player.z, 0x2dd4bf, 6.8, 0.48);
          player.lastHitBanner = {
            text: 'SEA WARD · 3D FORWARD BULWARK SHIELD DEPLOYED (+75 SHIELD & 60% DMG REDUCTION)!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.6;
        } else if (slot === 'e') {
          // CORSAIR SURGE: Restores +60 HP immediately + surges movement speed (+50%) & attack rate (+45%)
          player.hp = Math.min(player.maxHp, player.hp + 60);
          player.shield = Math.min(player.maxShield, player.shield + 25);
          player.auraTimer = spec.duration || 5.0;
          player.auraType = 'corsair_surge';
          player.fireCooldown = 0;
          audioEngine.playScarabTransform(true);
          spawnParticleBurst(player.x, player.y + 1.2, player.z, 28, 0xfacc15, 11, 1.4);
          spawnShockwave(player.x, player.y, player.z, 0xfacc15, 6.4, 0.45);
          spawnFloatingDamage(player.x, player.y + 2.0, player.z, 60, true, '#2dd4bf', '+60 HP CORSAIR SURGE');
          player.lastHitBanner = {
            text: 'CORSAIR SURGE · +60 HP HEALED + 50% MOVE SPEED & 45% ATTACK FRENZY!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.5;
        } else if (slot === 'c') {
          // WAVE VORTEX: Deploys a cursed emerald whirlpool trap that pulls enemies inward & drains HP
          player.snareActive = true;
          player.snareMode = 'vortex';
          player.snareTimer = spec.duration || 5.5;
          player.snareX = targetRival ? targetRival.x : player.x + Math.sin(player.camYaw) * 9.0;
          player.snareZ = targetRival ? targetRival.z : player.z + Math.cos(player.camYaw) * 9.0;
          player.snareY = groundHeightAt(player.snareX, player.snareZ);
          snareVisual.outerRingMat.color.setHex(0x2dd4bf);
          snareVisual.coreOrbMat.color.setHex(0xfacc15);
          snareVisual.vortexFunnelMat.color.setHex(0x2dd4bf);
          snareVisual.vineSpikesGroup.visible = true;
          snareVisual.vortexFunnelMesh.visible = true;
          snareGroup.position.set(player.snareX, player.snareY, player.snareZ);
          snareGroup.visible = true;
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - player.snareX, r.z - player.snareZ) <= 6.2) {
              r.hp = Math.max(0, r.hp - 36);
              r.snaredTimer = 3.2;
              r.hitFlashTimer = 0.14;
              player.damageDealt += 36;
              spawnFloatingDamage(r.x, r.y + 1.8, r.z, 36, false, '#2dd4bf', 'WAVE VORTEX');
              checkAndHandleRivalElimination(r, 'Wave Vortex', false);
            }
          }
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.snareX, player.snareY + 1.0, player.snareZ, 26, 0x2dd4bf, 11, 1.35);
          spawnShockwave(player.snareX, player.snareY, player.snareZ, 0x2dd4bf, 7.0, 0.5);
          player.lastHitBanner = {
            text: 'WAVE VORTEX · CURSED WHIRLPOOL PULLING & CRUSHING ENEMIES!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'r') {
          // GHOST FLEET BROADSIDE: Unleashes 5 wide Spectral Cutlass crescent waves + 3 explosive Naval Cannonballs!
          player.auraTimer = spec.duration || 5.0;
          player.auraType = 'bulwark_shield';
          player.shield = Math.min(player.maxShield, player.shield + 60);
          player.weaponRecoilTimer = 0.24;
          const aim = computeAimRayDirection(player.camYaw, player.camPitch);
          const rightX = -Math.cos(player.camYaw);
          const rightZ = Math.sin(player.camYaw);
          const livingRivals = rivals.filter((r) => r.koTimer === 0);

          // 5 Wide-Arc Spectral Cutlass Crescent Waves
          for (let i = 0; i < 5; i++) {
            const p = acquireProjectile();
            const spread = (i - 2) * 0.11;
            const dx = aim.dirX + rightX * spread;
            const dy = aim.dirY;
            const dz = aim.dirZ + rightZ * spread;
            const dLen = Math.hypot(dx, dy, dz) || 1;
            p.active = true;
            p.id = `ragnar-wave-${Date.now()}-${i}`;
            p.ownerId = mpClient.localPlayerId;
            p.isPlayerOwned = true;
            p.x = player.x + rightX * (i - 2) * 0.28;
            p.y = player.y + 1.45;
            p.z = player.z + rightZ * (i - 2) * 0.28;
            p.vx = (dx / dLen) * 68;
            p.vy = (dy / dLen) * 68;
            p.vz = (dz / dLen) * 68;
            p.damage = 40;
            p.isCharged = true;
            p.isScopedShot = false;
            p.isAmbushShot = false;
            p.isHighGroundShot = player.isHighGround;
            p.homingTargetId = livingRivals.length > 0 ? livingRivals[i % livingRivals.length].id : null;
            p.explosiveRadius = 0;
            p.appliesBurn = false;
            p.appliesStun = true;
            p.colorHex = 0x2dd4bf;
            p.visualKind = 'cutlass_wave';
            p.life = 2.6;
            configureProjectileVisual(p.rig, 'cutlass_wave', 0x2dd4bf, true);
            p.rig.root.visible = true;
            p.rig.root.position.set(p.x, p.y, p.z);
            p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
          }

          // 3 Blazing Explosive Naval Cannonballs
          for (let c = 0; c < 3; c++) {
            const p = acquireProjectile();
            const spread = (c - 1) * 0.14;
            const dx = aim.dirX + rightX * spread;
            const dy = aim.dirY + 0.04;
            const dz = aim.dirZ + rightZ * spread;
            const dLen = Math.hypot(dx, dy, dz) || 1;
            p.active = true;
            p.id = `ragnar-cannon-${Date.now()}-${c}`;
            p.ownerId = mpClient.localPlayerId;
            p.isPlayerOwned = true;
            p.x = player.x + rightX * (c - 1) * 0.35;
            p.y = player.y + 1.55;
            p.z = player.z + rightZ * (c - 1) * 0.35;
            p.vx = (dx / dLen) * 54;
            p.vy = (dy / dLen) * 54;
            p.vz = (dz / dLen) * 54;
            p.damage = 54;
            p.isCharged = true;
            p.isScopedShot = false;
            p.isAmbushShot = false;
            p.isHighGroundShot = player.isHighGround;
            p.homingTargetId = livingRivals.length > 0 ? livingRivals[c % livingRivals.length].id : null;
            p.explosiveRadius = 5.2;
            p.appliesBurn = true;
            p.appliesStun = false;
            p.colorHex = 0xf97316;
            p.visualKind = 'naval_cannonball';
            p.life = 2.6;
            configureProjectileVisual(p.rig, 'naval_cannonball', 0xf97316, true);
            p.rig.root.visible = true;
            p.rig.root.position.set(p.x, p.y, p.z);
            p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
          }

          cameraTrauma = Math.min(1, cameraTrauma + 0.36);
          audioEngine.playClassWeaponFire('ragnar', 2, 1.0, false);
          audioEngine.playClassWeaponFire('ragnar', 1, 1.0, false);
          spawnParticleBurst(player.x, player.y + 1.4, player.z, 34, 0x2dd4bf, 13, 1.5);
          spawnShockwave(player.x, player.y, player.z, 0xfacc15, 9.5, 0.58);
          spawnSkillPillar(player.x, player.y, player.z, 0x2dd4bf, 4.5, 0.7);
          player.lastHitBanner = {
            text: 'GHOST FLEET BROADSIDE · 5 CUTLASS WAVES + 3 EXPLOSIVE CANNONBALLS UNLEASHED!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.8;
        }
        return;
      }

      // ========================================================================
      // 2. WHITE · BOUNTY HUNTER
      // ========================================================================
      if (cls === 'bounty') {
        if (slot === 'q') {
          // VINTAGE WINE: Restores +55 HP & +30 Shield + activates crimson speed/crit aura
          player.hp = Math.min(player.maxHp, player.hp + 55);
          player.shield = Math.min(player.maxShield, player.shield + 30);
          player.auraTimer = spec.duration || 4.5;
          player.auraType = 'vintage_wine';
          audioEngine.playScarabTransform(true);
          spawnParticleBurst(player.x, player.y + 1.2, player.z, 24, 0xf97316, 10, 1.3);
          player.lastHitBanner = {
            text: 'VINTAGE WINE · +55 HP RESTORED & +35% SPEED/CRIT FRENZY!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'e') {
          // MERCY EXTRICATION & ADVERSITY RELOAD: Backward evasive rocket leap + instant reload + shotgun blast
          player.dashTimer = 0.32;
          player.dashSpeed = 24.0;
          player.dashRamDamage = 0;
          player.dashDirX = -Math.sin(player.camYaw);
          player.dashDirZ = -Math.cos(player.camYaw);
          player.fireCooldown = 0;
          if (targetRival && Math.hypot(targetRival.x - player.x, targetRival.z - player.z) <= 18) {
            targetRival.hp = Math.max(0, targetRival.hp - 38);
            targetRival.hitFlashTimer = 0.12;
            player.damageDealt += 38;
            spawnParticleBurst(targetRival.x, targetRival.y + 1.2, targetRival.z, 18, 0xfbbf24, 10, 1.2);
            checkAndHandleRivalElimination(targetRival, 'Mercy Extrication', false);
          }
          audioEngine.playGrappleLaunch();
          spawnParticleBurst(player.x, player.y + 0.8, player.z, 18, 0xf97316, 10, 1.15);
          player.lastHitBanner = {
            text: 'MERCY EXTRICATION · BACKSTEP LEAP & ADVERSITY INSTANT RELOAD!',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.2;
        } else if (slot === 'c') {
          // STICKY BOMB: Explosive charge on target rival / ground dealing 56 AoE Fire DMG + Burn
          const bx = targetRival ? targetRival.x : player.x + Math.sin(player.camYaw) * 9.0;
          const bz = targetRival ? targetRival.z : player.z + Math.cos(player.camYaw) * 9.0;
          const by = groundHeightAt(bx, bz);
          spawnParticleBurst(bx, by + 1.2, bz, 30, 0xf97316, 13, 1.55);
          spawnShockwave(bx, by, bz, 0xf97316, 7.5, 0.5);
          spawnSkillPillar(bx, by, bz, 0xf97316, 5.2, 0.6);
          audioEngine.playHitImpact(true, false);
          cameraTrauma = Math.min(1, cameraTrauma + 0.28);
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - bx, r.z - bz) <= 7.0) {
              r.hp = Math.max(0, r.hp - 56);
              r.burnTimer = 3.5;
              r.hitFlashTimer = 0.15;
              player.damageDealt += 56;
              checkAndHandleRivalElimination(r, 'Sticky Bomb', false);
            }
          }
          player.lastHitBanner = {
            text: 'STICKY BOMB DETONATION · 56 AOE FIRE DMG + INCENDIARY BURN!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.3;
        } else if (slot === 'r') {
          // HUNTER ORB BOUNTY: Marks rivals within 38m for +30% bounty crit & grants +15 Magic Shards
          player.auraTimer = spec.duration || 6.0;
          player.auraType = 'vintage_wine';
          player.magicShards += 15;
          const { affected, vfxTargets } = selectBoundedAoETargets(player.x, player.z, rivals, 38, 6);
          for (const r of affected) {
            r.snaredTimer = Math.max(r.snaredTimer, 6.0);
          }
          for (const r of vfxTargets) {
            spawnParticleBurst(r.x, r.y + 1.8, r.z, 12, 0xfacc15, 8, 1.2);
          }
          audioEngine.playScarabTransform(true);
          player.lastHitBanner = {
            text: `HUNTER ORB BOUNTY · ${Math.max(1, affected.length)} RIVALS MARKED FOR EXECUTION (+15 SHARDS)!`,
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.5;
        }
        return;
      }

      // ========================================================================
      // 3. HASAN-E · DANCING ASSASSIN
      // ========================================================================
      if (cls === 'assassin') {
        if (slot === 'q') {
          // SHADOW LURK: Pure shadow invisibility (+55% speed, +75% Backstab Ambush)
          player.isCamouflaged = true;
          player.camouflageTimer = spec.duration || 4.0;
          player.decoyActive = false;
          decoyRig.root.visible = false;
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 22, 0xa855f7, 10, 1.25);
          player.lastHitBanner = {
            text: 'SHADOW LURK · INVISIBLE STALKER (+55% SPD & BACKSTAB CRIT)!',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.3;
        } else if (slot === 'e') {
          // WHIRL DANCE & ASSAULT: Shadow-steps to target rival & slashes 360° blade ring (48 AoE DMG)
          let desiredX = player.x + Math.sin(player.camYaw) * 7.5;
          let desiredZ = player.z + Math.cos(player.camYaw) * 7.5;
          if (targetRival) {
            const angle = Math.atan2(player.x - targetRival.x, player.z - targetRival.z);
            desiredX = targetRival.x + Math.sin(angle) * 1.6;
            desiredZ = targetRival.z + Math.cos(angle) * 1.6;
          }
          const safeStep = resolveSafeTeleportPosition(desiredX, desiredZ, player.y, 0.75);
          player.x = safeStep.x;
          player.z = safeStep.z;
          player.y = safeStep.y;
          player.auraTimer = 1.6;
          player.auraType = 'whirl_dance';
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - player.x, r.z - player.z) <= 6.5) {
              r.hp = Math.max(0, r.hp - 48);
              r.hitFlashTimer = 0.15;
              player.damageDealt += 48;
              spawnParticleBurst(r.x, r.y + 1.2, r.z, 18, 0xe879f9, 10, 1.25);
              checkAndHandleRivalElimination(r, 'Whirl Dance', true);
            }
          }
          audioEngine.playHitImpact(true, false);
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 26, 0xa855f7, 12, 1.35);
          spawnShockwave(player.x, player.y, player.z, 0xe879f9, 7.0, 0.48);
          player.lastHitBanner = {
            text: 'WHIRL DANCE & ASSAULT · SHADOW BLINK + 360° BLADE CYCLONE (48 DMG)!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.3;
        } else if (slot === 'c') {
          // PARALYZER: High-velocity paralyzing blade that freezes rival for 3.2s
          if (targetRival && targetRival.koTimer === 0) {
            targetRival.snaredTimer = 3.2;
            targetRival.windupTimer = 0;
            targetRival.hp = Math.max(0, targetRival.hp - 34);
            targetRival.hitFlashTimer = 0.14;
            player.damageDealt += 34;
            spawnParticleBurst(targetRival.x, targetRival.y + 1.3, targetRival.z, 20, 0xe879f9, 10, 1.25);
            checkAndHandleRivalElimination(targetRival, 'Paralyzer', false);
          }
          audioEngine.playBowRelease(1.0, false);
          player.lastHitBanner = {
            text: `PARALYZER DAGGER · TARGET FROZEN FOR 3.2 SECONDS!`,
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.2;
        } else if (slot === 'r') {
          // FLURRY BLADE: Unleashes 6 homing purple spectral blades at all rivals
          const livingRivals = rivals.filter((r) => r.koTimer === 0);
          const rightX = -Math.cos(player.camYaw);
          const rightZ = Math.sin(player.camYaw);
          for (let i = 0; i < 6; i++) {
            const p = acquireProjectile();
            const assignedRival = livingRivals.length > 0 ? livingRivals[i % livingRivals.length] : null;
            const spread = (i - 2.5) * 0.14;
            const dx = Math.sin(player.camYaw) + rightX * spread;
            const dz = Math.cos(player.camYaw) + rightZ * spread;
            const dLen = Math.hypot(dx, dz) || 1;
            p.active = true;
            p.id = `flurry-${Date.now()}-${i}`;
            p.ownerId = mpClient.localPlayerId;
            p.isPlayerOwned = true;
            p.x = player.x + rightX * (i - 2.5) * 0.25;
            p.y = player.y + 1.45;
            p.z = player.z + rightZ * (i - 2.5) * 0.25;
            p.vx = (dx / dLen) * 58;
            p.vy = 0;
            p.vz = (dz / dLen) * 58;
            p.damage = 28;
            p.isCharged = true;
            p.isScopedShot = false;
            p.isAmbushShot = player.isCamouflaged;
            p.isHighGroundShot = player.isHighGround;
            p.homingTargetId = assignedRival ? assignedRival.id : null;
            p.explosiveRadius = 0;
            p.appliesBurn = false;
            p.appliesStun = false;
            p.colorHex = 0xe879f9;
            p.visualKind = 'fly_dagger';
            p.life = 2.5;
            configureProjectileVisual(p.rig, 'fly_dagger', 0xe879f9, true);
            p.rig.root.visible = true;
            p.rig.root.position.set(p.x, p.y, p.z);
            p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
          }
          player.weaponRecoilTimer = 0.2;
          audioEngine.playBowRelease(1.0, true);
          spawnParticleBurst(player.x, player.y + 1.3, player.z, 24, 0xe879f9, 11, 1.3);
          spawnShockwave(player.x, player.y, player.z, 0xe879f9, 6.5, 0.45);
          player.lastHitBanner = {
            text: 'FLURRY BLADE ULTIMATE · 6 HOMING SHADOW DAGGERS UNLEASHED!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.5;
        }
        return;
      }

      // ========================================================================
      // 4. LILITH · DARK SUCCUBUS (Mage)
      // ========================================================================
      if (cls === 'mage') {
        if (slot === 'q') {
          // DARK MIRAGE & SPIRIT WARD: Instant 9.5m blink teleport + +60 Shield barrier
          const { fwd, right } = getWASDInputs();
          const rel = computeCameraRelativeMovement(
            fwd === 0 && right === 0 ? 1 : fwd,
            right,
            player.camYaw
          );
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 18, 0xc084fc, 9, 1.2);
          const safeBlink = resolveSafeTeleportPosition(
            player.x + rel.moveDirX * 9.5,
            player.z + rel.moveDirZ * 9.5,
            player.y,
            0.75
          );
          player.x = safeBlink.x;
          player.z = safeBlink.z;
          player.y = Math.max(player.y, safeBlink.y);
          player.shield = Math.min(player.maxShield, player.shield + 60);
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 22, 0xc084fc, 10, 1.3);
          player.lastHitBanner = {
            text: 'DARK MIRAGE & SPIRIT WARD · 9.5m BLINK TELEPORT + 60 SHIELD BARRIER!',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.3;
        } else if (slot === 'e') {
          // NIGHT WINGS: Unfurls bat wings and launches Lilith high into aerial hover!
          player.wingsTimer = 3.6;
          player.vy = 16.0;
          player.grounded = false;
          player.isMounted = false;
          audioEngine.playGrappleLaunch();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 24, 0xc084fc, 11, 1.35);
          player.lastHitBanner = {
            text: 'NIGHT WINGS · AERIAL FLIGHT ASCENSION (RAIN FIRE FROM ABOVE)!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'c') {
          // SHADE ARRAY: Abyssal vortex field with 3D gravity funnel & obelisk spikes
          player.snareActive = true;
          player.snareMode = 'vortex';
          player.snareTimer = spec.duration || 5.0;
          player.snareX = targetRival ? targetRival.x : player.x + Math.sin(player.camYaw) * 9.0;
          player.snareZ = targetRival ? targetRival.z : player.z + Math.cos(player.camYaw) * 9.0;
          player.snareY = groundHeightAt(player.snareX, player.snareZ);
          snareVisual.outerRingMat.color.setHex(0xc084fc);
          snareVisual.coreOrbMat.color.setHex(0xc084fc);
          snareVisual.vortexFunnelMat.color.setHex(0xa855f7);
          snareVisual.vineSpikesGroup.visible = true;
          snareVisual.vortexFunnelMesh.visible = true;
          snareGroup.position.set(player.snareX, player.snareY, player.snareZ);
          snareGroup.visible = true;
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.snareX, player.snareY + 0.8, player.snareZ, 22, 0xc084fc, 9, 1.3);
          spawnShockwave(player.snareX, player.snareY, player.snareZ, 0xc084fc, 6.5, 0.5);
          player.lastHitBanner = {
            text: 'SHADE ARRAY · ABYSSAL GRAVITY VORTEX PULLING & DRAINING RIVALS!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'r') {
          // SHADOW STORM: Calls down 3D dark lightning pillars on nearby rivals (62 AoE DMG + Stun)
          const { affected, vfxTargets } = selectBoundedAoETargets(player.x, player.z, rivals, 34, 6);
          const vfxSet = new Set(vfxTargets.map((v) => v.id));
          const hitCount = affected.length;
          for (const r of affected) {
            r.hp = Math.max(0, r.hp - 62);
            r.snaredTimer = Math.max(r.snaredTimer, 2.0);
            r.hitFlashTimer = 0.18;
            player.damageDealt += 62;
            if (vfxSet.has(r.id)) {
              spawnParticleBurst(r.x, r.y + 1.5, r.z, 20, 0xc084fc, 13, 1.5);
              spawnSkillPillar(r.x, r.y, r.z, 0xc084fc, 4.2, 0.75);
              spawnShockwave(r.x, r.y, r.z, 0xa855f7, 6.2, 0.5);
            }
            checkAndHandleRivalElimination(r, 'Shadow Storm', true);
          }
          cameraTrauma = Math.min(1, cameraTrauma + 0.35);
          spawnShockwave(player.x, player.y, player.z, 0xc084fc, 11.0, 0.6);
          audioEngine.playHitImpact(true, hitCount > 0);
          player.lastHitBanner = {
            text: `SHADOW STORM CATACLYSM · STRUCK ${Math.max(1, hitCount)} RIVALS FOR 62 DARK DMG!`,
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.6;
        }
        return;
      }

      // ========================================================================
      // 5. ATLAS · RAGING KING (Warrior)
      // ========================================================================
      if (cls === 'warrior') {
        if (slot === 'q') {
          // WATER'S CURSE: Oceanic aura granting +65 Shield and dealing 16 DMG/s to nearby foes
          player.shield = Math.min(player.maxShield, player.shield + 65);
          player.auraTimer = spec.duration || 5.0;
          player.auraType = 'waters_curse';
          audioEngine.playScarabTransform(true);
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 24, 0x0ea5e9, 10, 1.3);
          player.lastHitBanner = {
            text: "WATER'S CURSE · +65 TIDAL SHIELD & CRUSHING MAELSTROM AURA!",
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'e') {
          // WATER TRAJECTORY: Tidal wave charge ramming enemies along the path for 46 DMG
          player.dashTimer = 0.42;
          player.dashSpeed = 26.0;
          player.dashRamDamage = 46;
          player.dashDirX = Math.sin(player.camYaw);
          player.dashDirZ = Math.cos(player.camYaw);
          player.rotY = player.camYaw;
          audioEngine.playGrappleLaunch();
          spawnParticleBurst(player.x, player.y + 0.8, player.z, 22, 0x38bdf8, 11, 1.3);
          player.lastHitBanner = {
            text: 'WATER TRAJECTORY · TIDAL WAVE RAMMING CHARGE (46 DMG)!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.2;
        } else if (slot === 'c') {
          // FLOOD TRAP: Erupts a 3D cyan water tornado spout under target rival (40 DMG + Whirlpool Slow)
          player.snareActive = true;
          player.snareMode = 'geyser';
          player.snareTimer = spec.duration || 5.0;
          player.snareX = targetRival ? targetRival.x : player.x + Math.sin(player.camYaw) * 8.5;
          player.snareZ = targetRival ? targetRival.z : player.z + Math.cos(player.camYaw) * 8.5;
          player.snareY = groundHeightAt(player.snareX, player.snareZ);
          snareVisual.outerRingMat.color.setHex(0x38bdf8);
          snareVisual.coreOrbMat.color.setHex(0x0ea5e9);
          snareVisual.vortexFunnelMat.color.setHex(0x38bdf8);
          snareVisual.vineSpikesGroup.visible = false;
          snareVisual.vortexFunnelMesh.visible = true;
          snareGroup.position.set(player.snareX, player.snareY, player.snareZ);
          snareGroup.visible = true;
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - player.snareX, r.z - player.snareZ) <= 6.0) {
              r.hp = Math.max(0, r.hp - 40);
              r.snaredTimer = 3.5;
              r.hitFlashTimer = 0.14;
              player.damageDealt += 40;
              checkAndHandleRivalElimination(r, 'Flood Trap', false);
            }
          }
          audioEngine.playHitImpact(true, false);
          spawnParticleBurst(player.snareX, player.snareY + 1.2, player.snareZ, 26, 0x38bdf8, 12, 1.4);
          spawnShockwave(player.snareX, player.snareY, player.snareZ, 0x38bdf8, 6.5, 0.5);
          player.lastHitBanner = {
            text: 'FLOOD TRAP GEYSER · 40 HYDRO DMG & WHIRLPOOL IMMOBILIZE!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.3;
        } else if (slot === 'r') {
          // WATER SPEAR CATACLYSM: Hurls royal trident for 68 AoE hydro shockwave & 3D tidal pillar
          const tx = targetRival ? targetRival.x : player.x + Math.sin(player.camYaw) * 10.0;
          const tz = targetRival ? targetRival.z : player.z + Math.cos(player.camYaw) * 10.0;
          const ty = groundHeightAt(tx, tz);
          player.weaponRecoilTimer = 0.25;
          spawnParticleBurst(tx, ty + 1.4, tz, 32, 0x0ea5e9, 14, 1.6);
          spawnShockwave(tx, ty, tz, 0x38bdf8, 8.5, 0.55);
          spawnSkillPillar(tx, ty, tz, 0x0ea5e9, 5.5, 0.75);
          cameraTrauma = Math.min(1, cameraTrauma + 0.35);
          audioEngine.playHitImpact(true, true);
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - tx, r.z - tz) <= 8.0) {
              r.hp = Math.max(0, r.hp - 68);
              r.snaredTimer = 2.6;
              r.windupTimer = 0;
              r.hitFlashTimer = 0.18;
              player.damageDealt += 68;
              checkAndHandleRivalElimination(r, 'Water Spear Cataclysm', true);
            }
          }
          player.lastHitBanner = {
            text: 'WATER SPEAR CATACLYSM · 68 AOE TIDAL SHOCKWAVE & STUN!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.6;
        }
        return;
      }

      // ========================================================================
      // 6. CHIYO · GHOST HUNTRESS (Sniper)
      // ========================================================================
      if (cls === 'sniper') {
        if (slot === 'q') {
          // SPECTRAL WALK: Phantom clone decoy + stealth + heals +35 HP
          player.isCamouflaged = true;
          player.camouflageTimer = spec.duration || 4.5;
          player.hp = Math.min(player.maxHp, player.hp + 35);
          player.decoyActive = true;
          player.decoyX = player.x;
          player.decoyY = player.y;
          player.decoyZ = player.z;
          decoyRig.root.position.set(player.x, player.y, player.z);
          decoyRig.root.rotation.y = player.rotY;
          decoyRig.root.visible = true;
          updateCharacterVisualState(decoyRig, {
            isCamouflaged: true,
            isMounted: false,
            isDownedScarab: false,
            activeWeaponSlot: player.activeWeaponSlot,
            hitFlashTimer: 0,
            drawCharge: 0.7,
            walkPhase: 0,
            speedRatio: 0,
          });
          audioEngine.playMirageCamouflage();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 22, 0x06b6d4, 10, 1.25);
          player.lastHitBanner = {
            text: 'SPECTRAL WALK · PHANTOM CLONE SUMMONED & +35 HP RESTORED!',
            isCrit: false,
            id: Date.now(),
          };
          player.bannerTimer = 2.4;
        } else if (slot === 'e') {
          // STEALTH GETAWAY: Restores +30 Shield & grapples to sniper vantage perch
          player.shield = Math.min(player.maxShield, player.shield + 30);
          const target = findBestGrappleTarget(
            player.x,
            player.z,
            Math.sin(player.camYaw),
            Math.cos(player.camYaw)
          );
          player.grappleActive = true;
          player.grappleTimer = 0;
          player.grappleDuration = 0.44;
          player.grappleStartX = player.x;
          player.grappleStartY = player.y;
          player.grappleStartZ = player.z;
          player.grappleTargetX = target.x;
          player.grappleTargetY = target.y;
          player.grappleTargetZ = target.z;
          player.isMounted = false;
          audioEngine.playGrappleLaunch();
          spawnParticleBurst(player.x, player.y + 1.0, player.z, 16, 0x22d3ee, 10, 1.15);
          player.lastHitBanner = {
            text: `STEALTH GETAWAY · +30 SHIELD & VANTAGE VAULT TO ${target.perchName.toUpperCase()}`,
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.2;
        } else if (slot === 'c') {
          // PSYCHIC SHOCK: Detonates cyan psychic plasma blast on target rival (48 AoE DMG + Daze)
          const sx = targetRival ? targetRival.x : player.x + Math.sin(player.camYaw) * 9.0;
          const sz = targetRival ? targetRival.z : player.z + Math.cos(player.camYaw) * 9.0;
          const sy = groundHeightAt(sx, sz);
          spawnParticleBurst(sx, sy + 1.3, sz, 24, 0x22d3ee, 11, 1.4);
          spawnShockwave(sx, sy, sz, 0x22d3ee, 6.8, 0.48);
          spawnSkillPillar(sx, sy, sz, 0x22d3ee, 4.6, 0.6);
          audioEngine.playHitImpact(true, false);
          for (const r of rivals) {
            if (r.koTimer === 0 && Math.hypot(r.x - sx, r.z - sz) <= 6.2) {
              r.hp = Math.max(0, r.hp - 48);
              r.snaredTimer = 2.4;
              r.windupTimer = 0;
              r.hitFlashTimer = 0.14;
              player.damageDealt += 48;
              checkAndHandleRivalElimination(r, 'Psychic Shock', false);
            }
          }
          player.lastHitBanner = {
            text: 'PSYCHIC SHOCK · 48 AOE PLASMA BLAST & 2.4s MENTAL DAZE!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.3;
        } else if (slot === 'r') {
          // PSYCHIC TARGETING SALVO: Brief spectral cloak + 6 homing psychic kunai missiles
          player.isCamouflaged = true;
          player.camouflageTimer = 2.5;
          const livingRivals = rivals.filter((r) => r.koTimer === 0);
          const rightX = -Math.cos(player.camYaw);
          const rightZ = Math.sin(player.camYaw);
          for (let i = 0; i < 6; i++) {
            const p = acquireProjectile();
            const assignedRival = livingRivals.length > 0 ? livingRivals[i % livingRivals.length] : null;
            const spread = (i - 2.5) * 0.12;
            const dx = Math.sin(player.camYaw) + rightX * spread;
            const dz = Math.cos(player.camYaw) + rightZ * spread;
            const dLen = Math.hypot(dx, dz) || 1;
            p.active = true;
            p.id = `psychic-${Date.now()}-${i}`;
            p.ownerId = mpClient.localPlayerId;
            p.isPlayerOwned = true;
            p.x = player.x + rightX * (i - 2.5) * 0.25;
            p.y = player.y + 1.55;
            p.z = player.z + rightZ * (i - 2.5) * 0.25;
            p.vx = (dx / dLen) * 62;
            p.vy = 2.0;
            p.vz = (dz / dLen) * 62;
            p.damage = 30;
            p.isCharged = true;
            p.isScopedShot = true;
            p.isAmbushShot = true;
            p.isHighGroundShot = player.isHighGround;
            p.homingTargetId = assignedRival ? assignedRival.id : null;
            p.explosiveRadius = 0;
            p.appliesBurn = false;
            p.appliesStun = false;
            p.colorHex = 0x22d3ee;
            p.visualKind = 'psychic_kunai';
            p.life = 2.6;
            configureProjectileVisual(p.rig, 'psychic_kunai', 0x22d3ee, true);
            p.rig.root.visible = true;
            p.rig.root.position.set(p.x, p.y, p.z);
            p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
          }
          player.weaponRecoilTimer = 0.2;
          audioEngine.playBowRelease(1.0, true);
          spawnParticleBurst(player.x, player.y + 1.4, player.z, 24, 0x22d3ee, 11, 1.3);
          spawnShockwave(player.x, player.y, player.z, 0x22d3ee, 6.8, 0.45);
          player.lastHitBanner = {
            text: 'PSYCHIC TARGETING SALVO · 6 HOMING SPIRIT MISSILES LAUNCHED!',
            isCrit: true,
            id: Date.now(),
          };
          player.bannerTimer = 2.5;
        }
      }
    }

    function resetMatchState() {
      const spec = HERO_CLASSES[heroClassRef.current];
      player.x = 0;
      player.z = 18;
      player.y = groundHeightAt(0, 18);
      player.visualY = player.y;
      player.vx = 0;
      player.vy = 0;
      player.vz = 0;
      inputBuffer.clear();
      smoothedCamDist = 7.8;
      player.rotY = Math.PI;
      player.camYaw = Math.PI;
      player.camPitch = -0.04;
      player.hp = spec.maxHp;
      player.maxHp = spec.maxHp;
      player.ghostHp = spec.maxHp;
      player.shield = spec.maxShield;
      player.maxShield = spec.maxShield;
      player.activeWeaponSlot = showroom.weaponSlot;
      player.magicShards = sandboxModeRef.current ? 999 : 40;
      player.forgeLevel = 0;
      player.forgeBeamTimer = 0;
      (forgeBeamMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      player.isScoped = false;
      player.drawCharge = 0;
      player.isDrawing = false;
      player.fireCooldown = 0;
      player.isCamouflaged = false;
      player.camouflageTimer = 0;
      player.decoyActive = false;
      decoyRig.root.visible = false;
      player.isMounted = false;
      player.isDownedScarab = false;
      player.isPropDisguised = false;
      player.scarabTimer = 0;
      player.relicReady = true;
      player.relicCooldown = 0;
      player.dashTimer = 0;
      player.dashSpeed = 22.0;
      player.dashRamDamage = 0;
      player.auraTimer = 0;
      player.auraType = 'none';
      player.wingsTimer = 0;
      player.scaleX = 1;
      player.scaleY = 1;
      playerRig.nightWingsGroup.visible = false;
      playerRig.root.scale.set(1, 1, 1);
      player.grappleActive = false;
      grappleLine.visible = false;
      player.snareActive = false;
      snareGroup.visible = false;
      player.cooldowns = { q: 0, e: 0, c: 0, r: 0, v: 0, dash: 0 };
      player.kills = 0;
      player.headshots = 0;
      player.score = 0;
      player.wave = 1;
      player.damageDealt = 0;
      player.shotsFired = 0;
      player.shotsHit = 0;
      player.maxSingleDamage = 0;
      player.currentStreak = 0;
      player.bestStreak = 0;
      player.streakTimer = 0;
      player.streakSpeedBonus = 0;
      player.streakDamageBonus = 0;
      player.bossesDefeated = 0;
      player.chestsOpened = 0;
      player.matchTime = 0;
      player.endingTriggered = false;
      player.pendingOutcome = null;
      player.lastHitBanner = null;
      bossAwakenedThisMatch = false;
      stormDamageTickTimer = 0;
      aiKillFeedCooldown = 0;
      aiEliminationCooldown = 4.0;
      bossActor.koTimer = 9999;
      bossActor.eliminated = true;
      bossActor.hp = 0;
      if (bossActor.rig) bossActor.rig.root.visible = false;
      for (const slot of nearRigPool) {
        slot.inUse = false;
        slot.rig.root.visible = false;
      }
      for (const pr of projectiles) {
        pr.active = false;
        pr.rig.root.visible = false;
      }
      for (const sw of shockwaves) {
        sw.active = false;
        sw.mesh.visible = false;
      }
      for (const sp of skillPillars) {
        sp.active = false;
        sp.group.visible = false;
      }
      for (const cr of groundCraters) {
        cr.active = false;
        cr.group.visible = false;
      }
      for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
        pData[i].active = false;
        _dummyObj.position.set(0, -999, 0);
        _dummyObj.scale.setScalar(0.001);
        _dummyObj.updateMatrix();
        particleMesh.setMatrixAt(i, _dummyObj.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;
      lootChests.forEach((chest) => {
        chest.opened = false;
        chest.respawnTimer = 0;
        chest.rig.lidGroup.rotation.x = 0;
        chest.rig.crystalMesh.visible = true;
        chest.rig.beaconRing.visible = true;
      });
      floatingDamagePool.forEach((f) => {
        f.active = false;
      });
      hitArcPool.forEach((a) => {
        a.active = false;
      });

      for (let idx = 0; idx < RIVAL_TEMPLATES.length; idx++) {
        const r = rivals[idx];
        const tpl = RIVAL_TEMPLATES[idx];
        const clsSpec = HERO_CLASSES[tpl.heroClass];
        const rivalMaxHp = clsSpec.maxHp + Math.round(clsSpec.maxShield * 0.75);
        r.x = tpl.spawnX;
        r.z = tpl.spawnZ;
        r.y = groundHeightAt(r.x, r.z);
        r.maxHp = rivalMaxHp;
        r.hp = rivalMaxHp;
        r.koTimer = 0;
        r.eliminated = false;
        r.kills = 0;
        r.rig = null;
        r.windupTimer = 0;
        r.attackCooldown = 2.2 + (idx % 6) * 0.55;
        r.aiSkirmishCooldown = 4.5 + (idx % 10) * 0.65;
        r.snaredTimer = 0;
        r.burnTimer = 0;
      }
    }

    const keysHeld = new Set<string>();
    let mouseLeftHeld = false;
    let lastPointerX: number | null = null;
    let lastPointerY: number | null = null;

    function getWASDInputs(): { fwd: number; right: number } {
      let fwd = 0;
      let right = 0;
      if (keysHeld.has('KeyW')) fwd += 1;
      if (keysHeld.has('KeyS')) fwd -= 1;
      if (keysHeld.has('KeyD')) right += 1;
      if (keysHeld.has('KeyA')) right -= 1;
      return { fwd, right };
    }

    actionsRef.current = {
      triggerAbility,
      triggerDash: () => {
        const { fwd, right } = getWASDInputs();
        triggerDash(fwd, right);
      },
      swapWeapon,
      triggerReload,
      triggerInspect,
      triggerForge,
      toggleScope: () => {
        if (stateRef.current !== 'playing' || player.isDownedScarab) return;
        player.isScoped = !player.isScoped;
        if (player.isScoped) {
          player.isMounted = false;
          player.weaponInspectTimer = 0;
        }
      },
      fireQuickShot: () => {
        if (stateRef.current !== 'playing') return;
        player.weaponInspectTimer = 0;
        firePlayerWeapon(player.isScoped ? 1.0 : 0.85);
      },
      requestMouseLock: () => {
        try {
          renderer.domElement.requestPointerLock?.();
        } catch {
          // Ignore if blocked in sandbox
        }
      },
      resetMatch: resetMatchState,
      toggleSandboxZeroCooldown: () => {
        player.sandboxZeroCooldown = !player.sandboxZeroCooldown;
        if (player.sandboxZeroCooldown) {
          player.cooldowns = { q: 0, e: 0, c: 0, r: 0, v: 0, dash: 0 };
        }
        player.lastHitBanner = {
          text: player.sandboxZeroCooldown
            ? 'SANDBOX · INSTANT COOLDOWNS ENABLED (UNLIMITED SKILLS)'
            : 'SANDBOX · STANDARD COOLDOWNS RESTORED',
          isCrit: player.sandboxZeroCooldown,
          id: Date.now(),
        };
        player.bannerTimer = 2.0;
      },
      triggerSandboxMaxForge: () => {
        player.magicShards = Math.max(player.magicShards, 999);
        player.forgeLevel = 3;
        player.hp = player.maxHp;
        player.shield = player.maxShield;
        player.forgeBeamTimer = 1.25;
        forgeBeamMesh.position.set(player.x, groundHeightAt(player.x, player.z), player.z);
        (forgeBeamMesh.material as THREE.MeshBasicMaterial).opacity = 0.28;
        audioEngine.playCombatAnnouncer('forge_upgrade');
        spawnParticleBurst(player.x, player.y + 1.2, player.z, 32, 0xfacc15, 12, 1.5);
        spawnShockwave(player.x, player.y, player.z, 0xfacc15, 8.5, 0.55);
        player.lastHitBanner = {
          text: 'SANDBOX · MAX FORGE LV3 MASTERWORK (+54% DMG) & 999 SHARDS!',
          isCrit: true,
          id: Date.now(),
        };
        player.bannerTimer = 2.6;
      },
      triggerSandboxSpawnBoss: () => {
        awakenPharaohBoss();
      },
      triggerSandboxSpawnChests: () => {
        lootChests.forEach((chest) => {
          chest.opened = false;
          chest.respawnTimer = 0;
          chest.rig.lidGroup.rotation.x = 0;
          chest.rig.crystalMesh.visible = true;
          chest.rig.beaconRing.visible = true;
          spawnParticleBurst(chest.x, chest.y + 1.0, chest.z, 18, 0xfacc15, 8, 1.1);
        });
        audioEngine.playCombatAnnouncer('chest_open');
        player.lastHitBanner = {
          text: 'GOLDEN SCARab RELIQUARIES RESPAWNED ACROSS THE ARENA!',
          isCrit: true,
          id: Date.now(),
        };
        player.bannerTimer = 2.4;
      },
      triggerSandboxFullRestore: () => {
        player.hp = player.maxHp;
        player.ghostHp = player.maxHp;
        player.shield = player.maxShield;
        player.magicShards = Math.max(player.magicShards, 999);
        player.cooldowns = { q: 0, e: 0, c: 0, r: 0, v: 0, dash: 0 };
        player.isDownedScarab = false;
        spawnParticleBurst(player.x, player.y + 1.2, player.z, 24, 0x10b981, 9, 1.2);
        player.lastHitBanner = {
          text: 'SANDBOX · FULL VITALITY, SHIELD & SKILL COOLDOWNS RESTORED!',
          isCrit: false,
          id: Date.now(),
        };
        player.bannerTimer = 2.0;
      },
      rotateShowroom: (deltaYaw: number) => {
        if (Math.abs(deltaYaw) < 0.001) {
          showroom.autoRotate = !showroom.autoRotate;
        } else {
          showroom.autoRotate = false;
          showroom.yawOffset += deltaYaw;
        }
      },
      setShowroomWeapon: (slot: WeaponSlotId) => {
        showroom.weaponSlot = slot;
        showroom.poseTimer = 1.2;
        audioEngine.playBowDraw();
      },
      setShowroomForge: (level: number) => {
        showroom.forgeLevel = THREE.MathUtils.clamp(level, 0, 3);
        showroom.poseTimer = 1.4;
        if (level > 0) {
          audioEngine.playCombatAnnouncer('forge_upgrade');
        }
      },
      triggerShowroomPose: () => {
        showroom.poseTimer = 1.8;
        audioEngine.playClassWeaponFire(heroClassRef.current, showroom.weaponSlot, 1.0, false);
      },
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const isRepeat = keysHeld.has(code);
      keysHeld.add(code);

      if (stateRef.current !== 'playing' || isRepeat) return;

      if (code === 'Space') {
        e.preventDefault();
        player.jumpBufferTimer = 0.14;
      } else if (code === 'Digit1') {
        swapWeapon(1);
      } else if (code === 'Digit2') {
        swapWeapon(2);
      } else if (code === 'Tab') {
        e.preventDefault();
        swapWeapon();
      } else if (code === 'KeyY') {
        triggerReload();
      } else if (code === 'KeyI') {
        triggerInspect();
      } else if (code === 'KeyG') {
        triggerForge();
      } else if (code === 'KeyB') {
        awakenPharaohBoss();
      } else if (code === 'KeyQ') {
        triggerAbility('q');
      } else if (code === 'KeyE') {
        triggerAbility('e');
      } else if (code === 'KeyC') {
        triggerAbility('c');
      } else if (code === 'KeyR') {
        triggerAbility('r');
      } else if (code === 'KeyV') {
        triggerAbility('v');
      } else if (code === 'ShiftLeft' || code === 'AltLeft' || code === 'KeyX') {
        const { fwd, right } = getWASDInputs();
        triggerDash(fwd, right);
      } else if (code === 'KeyZ' || code === 'ShiftRight') {
        player.isScoped = !player.isScoped;
        if (player.isScoped) {
          player.isMounted = false;
          player.weaponInspectTimer = 0;
        }
      } else if (code === 'KeyF') {
        player.weaponInspectTimer = 0;
        firePlayerWeapon(player.isScoped ? 1.0 : 0.9);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
      if (e.code === 'Space' && player.vy > 0) {
        player.vy *= 0.48;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (stateRef.current !== 'playing') {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        return;
      }

      const isLocked = document.pointerLockElement === renderer.domElement;
      const sensScale = sensitivityRef.current * (player.isScoped ? 0.45 : 1.0);

      let dx = 0;
      let dy = 0;

      if (isLocked || typeof e.movementX === 'number') {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      }
      if (!isLocked && dx === 0 && dy === 0 && lastPointerX !== null && lastPointerY !== null) {
        dx = e.clientX - lastPointerX;
        dy = e.clientY - lastPointerY;
      }

      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (Math.abs(dx) > 180 || Math.abs(dy) > 180) return;

      const yawSens = (isLocked ? 0.0024 : 0.0032) * sensScale;
      const pitchSens = (isLocked ? 0.0020 : 0.0025) * sensScale;

      player.camYaw -= dx * yawSens;
      player.camPitch = THREE.MathUtils.clamp(player.camPitch - dy * pitchSens, -0.52, 0.58);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (stateRef.current !== 'playing') return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl && targetEl.closest('button, select, input, [data-hud-interactive="true"]')) {
        return;
      }

      if (document.pointerLockElement !== renderer.domElement) {
        try {
          renderer.domElement.requestPointerLock?.();
        } catch {
          // Ignore if sandboxed
        }
      }

      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (e.button === 2) {
        player.isScoped = !player.isScoped;
        if (player.isScoped) player.isMounted = false;
        return;
      }
      if (e.button === 1) {
        const { fwd, right } = getWASDInputs();
        triggerDash(fwd, right);
        return;
      }
      if (e.button === 0) {
        mouseLeftHeld = true;
        player.isDrawing = true;
        player.drawCharge = Math.max(player.drawCharge, 0.35);
        audioEngine.playBowDraw();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 0 && mouseLeftHeld) {
        mouseLeftHeld = false;
        if (stateRef.current === 'playing' && player.isDrawing) {
          firePlayerWeapon(player.drawCharge);
          player.isDrawing = false;
          player.drawCharge = 0;
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (stateRef.current !== 'playing') return;
      if (e.deltaY < -10 && !player.isScoped && !player.isDownedScarab) {
        player.isScoped = true;
        player.isMounted = false;
      } else if (e.deltaY > 10 && player.isScoped) {
        player.isScoped = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const clearHeldInputs = () => {
      keysHeld.clear();
      mouseLeftHeld = false;
      player.isDrawing = false;
      player.drawCharge = 0;
      lastPointerX = null;
      lastPointerY = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', clearHeldInputs);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let lastTime = performance.now();
    let lastHUDDispatch = 0;
    let isUnmounted = false;
    let smoothedFrameTimeMs = 16.6;
    let smoothedFps = 60;
    let lastDrawCalls = 18;
    let lastTriangles = 8400;
    let lastObservedMode: GameStateMode = stateRef.current;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isUnmounted) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isUnmounted) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      const instantFrameMs = Math.min(50, Math.max(4, rawDt * 1000));
      smoothedFrameTimeMs = smoothedFrameTimeMs * 0.88 + instantFrameMs * 0.12;
      smoothedFps = isSoftwareGl
        ? 60
        : Math.max(15, Math.min(120, Math.round(1000 / Math.max(8, smoothedFrameTimeMs))));

      if (heroClassRef.current !== currentBuiltClass) {
        currentBuiltClass = heroClassRef.current;
        scene.remove(playerRig.root);
        scene.remove(decoyRig.root);
        disposeCharacterRig(playerRig);
        disposeCharacterRig(decoyRig);
        playerRig = createHeroRig(currentBuiltClass, false);
        decoyRig = createHeroRig(currentBuiltClass, false);
        decoyRig.root.visible = false;
        scene.add(playerRig.root);
        scene.add(decoyRig.root);
        const spec = HERO_CLASSES[currentBuiltClass];
        player.maxHp = spec.maxHp;
        player.hp = spec.maxHp;
        player.ghostHp = spec.maxHp;
        player.maxShield = spec.maxShield;
        player.shield = spec.maxShield;
        player.cooldowns = { q: 0, e: 0, c: 0, r: 0, v: 0, dash: 0 };
        player.auraTimer = 0;
        player.wingsTimer = 0;
        player.lastHitBanner = {
          text: `SWITCHED TO ${spec.name.toUpperCase()} · [1] ${spec.primaryWeapon.toUpperCase()} / [2] ${spec.secondaryWeapon.toUpperCase()}`,
          isCrit: true,
          id: Date.now(),
        };
        player.bannerTimer = 2.4;
      }

      if (roomIdRef.current !== mpClient.roomId) {
        mpClient.connect(roomIdRef.current, heroClassRef.current);
      }

      const pulseScale = 1 + Math.sin(now * 0.004) * 0.04;
      for (const b of beaconRings) {
        b.scale.set(pulseScale, pulseScale, 1);
      }

      const mode = stateRef.current;
      if (lastObservedMode === 'title' && mode === 'playing') {
        resetMatchState();
        player.activeWeaponSlot = showroom.weaponSlot;
      }
      lastObservedMode = mode;

      solarStormRig.group.visible = mode === 'playing';
      instancedCrowd.torsoInst.visible = mode === 'playing';
      instancedCrowd.headInst.visible = mode === 'playing';
      instancedCrowd.weaponInst.visible = mode === 'playing';
      instancedCrowd.hpBarInst.visible = mode === 'playing';
      if (mode !== 'playing') {
        for (const slot of nearRigPool) {
          slot.rig.root.visible = false;
        }
        if (bossActor.rig) {
          bossActor.rig.root.visible = false;
        }
      }
      for (const [, entry] of remoteRigs.entries()) {
        entry.rig.root.visible = mode === 'playing';
      }

      if (mode === 'title') {
        if (showroom.autoRotate) {
          titleOrbitAngle += dt * 0.34;
        }
        showroom.poseTimer = Math.max(0, showroom.poseTimer - dt);
        const heroStandY = groundHeightAt(0, 0) + 0.6;
        playerRig.nightWingsGroup.visible = false;
        playerRig.root.scale.set(1, 1, 1);
        playerRig.root.position.set(0, heroStandY, 0);
        playerRig.root.rotation.y = showroom.yawOffset + Math.sin(titleOrbitAngle * 0.5) * 0.35;
        updateCharacterVisualState(playerRig, {
          isCamouflaged: false,
          isMounted: false,
          isDownedScarab: false,
          activeWeaponSlot: showroom.weaponSlot,
          forgeLevel: showroom.forgeLevel,
          weaponRecoilTimer: showroom.poseTimer > 1.3 ? showroom.poseTimer - 1.3 : 0,
          weaponInspectTimer: showroom.poseTimer,
          hitFlashTimer: 0,
          drawCharge: showroom.poseTimer > 0 ? 0.98 : 0.68 + Math.sin(now * 0.003) * 0.25,
          walkPhase: 0,
          speedRatio: 0,
          idleTime: now * 0.001,
        });

        const camDist = 6.9;
        camera.fov = 50;
        camera.updateProjectionMatrix();
        const camOrbit = titleOrbitAngle + showroom.yawOffset * 0.35;
        camera.position.set(
          Math.sin(camOrbit) * camDist + 1.55,
          heroStandY + 2.35 + Math.sin(titleOrbitAngle * 0.7) * 0.35,
          Math.cos(camOrbit) * camDist
        );
        camera.lookAt(-1.05, heroStandY + 1.48, 0);
      } else if (mode === 'playing') {
        if (hitstopTimer > 0) {
          hitstopTimer = Math.max(0, hitstopTimer - dt);
        }
        cameraTrauma = Math.max(0, cameraTrauma - dt * 2.0);
        const simDt = hitstopTimer > 0 ? 0 : dt;

        if (player.endingTriggered && player.pendingOutcome) {
          player.endDelayTimer -= dt;
          if (player.endDelayTimer <= 0) {
            const outcome = player.pendingOutcome;
            player.pendingOutcome = null;
            if (player.score > player.bestScore) {
              player.bestScore = player.score;
              localStorage.setItem('khepri_best_score', String(player.bestScore));
            }
            const aliveRivalsEnd = countAliveNonBossRivals();
            const placementRank =
              outcome === 'victory' ? 1 : computeBattleRoyaleRank(aliveRivalsEnd, true);
            onMatchEndRef.current({
              outcome,
              kills: player.kills,
              targetKills: TARGET_KILLS_FOR_VICTORY,
              headshots: player.headshots,
              score: player.score,
              bestScore: player.bestScore,
              damageDealt: Math.round(player.damageDealt),
              clearTimeSec: Math.round(player.matchTime),
              heroClass: heroClassRef.current,
              shotsFired: player.shotsFired,
              shotsHit: player.shotsHit,
              maxSingleDamage: Math.round(player.maxSingleDamage),
              bestStreak: player.bestStreak,
              forgeLevel: player.forgeLevel,
              bossesDefeated: player.bossesDefeated,
              chestsOpened: player.chestsOpened,
              placementRank,
              totalCombatants: TOTAL_BR_COMBATANTS,
            });
          }
        }

        if (simDt > 0 && !player.endingTriggered) {
          player.matchTime += simDt;

          const arrowTurnSpeed = (player.isScoped ? 1.15 : 2.1) * sensitivityRef.current;
          if (keysHeld.has('ArrowLeft')) player.camYaw += arrowTurnSpeed * simDt;
          if (keysHeld.has('ArrowRight')) player.camYaw -= arrowTurnSpeed * simDt;
          if (keysHeld.has('ArrowUp')) {
            player.camPitch = THREE.MathUtils.clamp(player.camPitch + arrowTurnSpeed * 0.65 * simDt, -0.52, 0.58);
          }
          if (keysHeld.has('ArrowDown')) {
            player.camPitch = THREE.MathUtils.clamp(player.camPitch - arrowTurnSpeed * 0.65 * simDt, -0.52, 0.58);
          }

          player.fireCooldown = Math.max(0, player.fireCooldown - simDt);
          player.weaponRecoilTimer = Math.max(0, player.weaponRecoilTimer - simDt);
          player.weaponSwapTimer = Math.max(0, player.weaponSwapTimer - simDt);
          player.weaponReloadTimer = Math.max(0, player.weaponReloadTimer - simDt);
          player.weaponInspectTimer = Math.max(0, player.weaponInspectTimer - simDt);
          player.hitFlashTimer = Math.max(0, player.hitFlashTimer - simDt);
          player.bannerTimer = Math.max(0, player.bannerTimer - simDt);
          if (player.bannerTimer === 0) player.lastHitBanner = null;

          if (player.forgeBeamTimer > 0) {
            player.forgeBeamTimer = Math.max(0, player.forgeBeamTimer - simDt);
            (forgeBeamMesh.material as THREE.MeshBasicMaterial).opacity =
              (player.forgeBeamTimer / 1.25) * 0.28;
          }

          if (player.auraTimer > 0) {
            player.auraTimer = Math.max(0, player.auraTimer - simDt);
            // Atlas's Water's Curse deals continuous AoE hydro damage & slow around him
            if (player.auraType === 'waters_curse') {
              for (const r of rivals) {
                if (r.koTimer === 0 && Math.hypot(r.x - player.x, r.z - player.z) <= 6.2) {
                  r.hp = Math.max(0, r.hp - 16 * simDt);
                  r.snaredTimer = Math.max(r.snaredTimer, 0.5);
                  player.damageDealt += 16 * simDt;
                  checkAndHandleRivalElimination(r, "Water's Curse", false);
                }
              }
            }
          }

          if (player.wingsTimer > 0) {
            player.wingsTimer = Math.max(0, player.wingsTimer - simDt);
          }

          if (player.streakTimer > 0) {
            player.streakTimer = Math.max(0, player.streakTimer - simDt);
            if (player.streakTimer === 0) {
              player.currentStreak = 0;
              player.streakSpeedBonus = 0;
              player.streakDamageBonus = 0;
            }
          }

          (['q', 'e', 'c', 'r', 'v', 'dash'] as const).forEach((k) => {
            player.cooldowns[k] = Math.max(0, player.cooldowns[k] - simDt);
          });

          // Consume 160ms Combat Input Buffer as soon as cooldowns or dash recovery complete
          if (player.cooldowns.dash <= 0 && inputBuffer.consumeDash(now)) {
            const { fwd: dFwd, right: dRight } = getWASDInputs();
            triggerDash(dFwd, dRight);
          }
          if (player.dashTimer <= 0) {
            for (const slot of ['q', 'e', 'c', 'r', 'v'] as const) {
              if (player.cooldowns[slot] <= 0 && inputBuffer.consumeAbility(slot, now)) {
                triggerAbility(slot);
                break;
              }
            }
          }
          if (player.fireCooldown <= 0 && inputBuffer.consumeFire(now)) {
            firePlayerWeapon(player.isScoped ? 1.0 : 0.85);
          }

          player.ghostHp = THREE.MathUtils.damp(player.ghostHp, player.hp, 5.5, simDt);

          if (!player.isDownedScarab && player.shield < player.maxShield) {
            player.shield = Math.min(player.maxShield, player.shield + 3.0 * simDt);
          }

          if (player.isDrawing) {
            player.drawCharge = Math.min(1.0, player.drawCharge + simDt * 1.65);
            if (player.activeWeaponSlot === 2 && player.fireCooldown <= 0) {
              firePlayerWeapon(0.9);
            }
          }

          if (player.isCamouflaged) {
            player.camouflageTimer = Math.max(0, player.camouflageTimer - simDt);
            if (player.camouflageTimer === 0) {
              player.isCamouflaged = false;
              player.decoyActive = false;
              decoyRig.root.visible = false;
            }
          }

          if (player.snareActive) {
            player.snareTimer = Math.max(0, player.snareTimer - simDt);
            snareGroup.rotation.y += simDt * 2.8;
            snareVisual.coreOrbMesh.position.y = 2.1 + Math.sin(now * 0.006) * 0.25;
            snareVisual.coreOrbMesh.rotation.y += simDt * 4.5;
            snareVisual.vortexFunnelMesh.rotation.y -= simDt * 6.5;
            if (player.snareTimer === 0) {
              player.snareActive = false;
              snareGroup.visible = false;
            }
          }

          const scarabTick = tickScarabRelic(
            {
              isDownedScarab: player.isDownedScarab,
              scarabTimer: player.scarabTimer,
              scarabMaxDuration: player.scarabMaxDuration,
              relicReady: player.relicReady,
              relicCooldown: player.relicCooldown,
              hp: player.hp,
              maxHp: player.maxHp,
              shield: player.shield,
              maxShield: player.maxShield,
            },
            simDt
          );
          player.isDownedScarab = scarabTick.nextState.isDownedScarab;
          player.scarabTimer = scarabTick.nextState.scarabTimer;
          player.relicReady = scarabTick.nextState.relicReady;
          player.relicCooldown = scarabTick.nextState.relicCooldown;
          if (scarabTick.resurrected) {
            player.hp = scarabTick.nextState.hp;
            player.ghostHp = player.hp;
            player.shield = scarabTick.nextState.shield;
            player.isPropDisguised = false;
            audioEngine.playScarabTransform(true);
            spawnParticleBurst(player.x, player.y + 1.2, player.z, 26, 0x10b981, 11, 1.35);
            player.lastHitBanner = {
              text: `BABY DRAGON REVIVAL COMPLETE · ${HERO_CLASSES[heroClassRef.current].shortLabel} REBORN!`,
              isCrit: true,
              id: Date.now(),
            };
            player.bannerTimer = 2.6;
          }

          if (player.grappleActive) {
            player.grappleTimer += simDt;
            const t = Math.min(1, player.grappleTimer / player.grappleDuration);
            const smoothT = t * t * (3 - 2 * t);
            player.x = THREE.MathUtils.lerp(player.grappleStartX, player.grappleTargetX, smoothT);
            player.z = THREE.MathUtils.lerp(player.grappleStartZ, player.grappleTargetZ, smoothT);
            const arcHeight = Math.sin(t * Math.PI) * 5.0;
            player.y =
              THREE.MathUtils.lerp(player.grappleStartY, player.grappleTargetY, smoothT) + arcHeight;

            grappleLine.visible = true;
            const gAttr = grappleLine.geometry.attributes.position as THREE.BufferAttribute;
            gAttr.setXYZ(0, player.x, player.y + 1.4, player.z);
            gAttr.setXYZ(1, player.grappleTargetX, player.grappleTargetY + 0.5, player.grappleTargetZ);
            gAttr.needsUpdate = true;

            if (t >= 1) {
              player.grappleActive = false;
              grappleLine.visible = false;
              player.vy = 0;
              player.scaleX = 1.2;
              player.scaleY = 0.82;
              spawnParticleBurst(player.x, player.y + 0.2, player.z, 12, 0xfacc15, 6, 0.9);
              spawnShockwave(player.x, player.y, player.z, 0xfacc15, 5.2, 0.4);
            }
          } else {
            const { fwd, right } = getWASDInputs();
            const relMove = computeCameraRelativeMovement(fwd, right, player.camYaw);

            if (player.dashTimer > 0) {
              player.dashTimer = Math.max(0, player.dashTimer - simDt);
              player.vx = player.dashDirX * player.dashSpeed;
              player.vz = player.dashDirZ * player.dashSpeed;

              // Atlas's Water Trajectory rams enemies along the path!
              if (player.dashRamDamage > 0) {
                for (const r of rivals) {
                  if (r.koTimer === 0 && Math.hypot(r.x - player.x, r.z - player.z) <= 2.6 && r.hitFlashTimer <= 0) {
                    r.hp = Math.max(0, r.hp - player.dashRamDamage);
                    r.hitFlashTimer = 0.25;
                    r.snaredTimer = 1.5;
                    player.damageDealt += player.dashRamDamage;
                    spawnParticleBurst(r.x, r.y + 1.2, r.z, 18, 0x38bdf8, 10, 1.25);
                    checkAndHandleRivalElimination(r, 'Water Trajectory', false);
                  }
                }
              }
            } else {
              const baseSpd = HERO_CLASSES[heroClassRef.current].baseSpeed;
              let speedMult = 1.05;
              if (player.isMounted) speedMult = 1.65;
              else if (player.isDownedScarab) speedMult = player.isPropDisguised ? 0.55 : 1.4;
              else if (player.isCamouflaged) speedMult = heroClassRef.current === 'assassin' ? 1.55 : 1.42;
              else if (player.auraTimer > 0 && player.auraType === 'corsair_surge') speedMult = 1.54;
              else if (player.auraTimer > 0 && player.auraType === 'vintage_wine') speedMult = 1.38;
              else if (player.isScoped) speedMult = 0.75;
              speedMult *= 1 + player.streakSpeedBonus;

              const targetVx = relMove.moveDirX * baseSpd * speedMult;
              const targetVz = relMove.moveDirZ * baseSpd * speedMult;
              player.vx = THREE.MathUtils.damp(player.vx, targetVx, 18, simDt);
              player.vz = THREE.MathUtils.damp(player.vz, targetVz, 18, simDt);
            }

            player.x += player.vx * simDt;
            player.z += player.vz * simDt;

            // Physical obstacle collision with solid stone Obelisks & Sniper Perch columns
            const resolvedPlayerPos = resolveObstacleCollision(player.x, player.z, player.y, 0.75);
            player.x = resolvedPlayerPos.x;
            player.z = resolvedPlayerPos.z;

            const distFromCenter = Math.hypot(player.x, player.z);
            if (distFromCenter > ARENA_RADIUS) {
              const clampScale = ARENA_RADIUS / distFromCenter;
              player.x *= clampScale;
              player.z *= clampScale;
            }

            const surf = getEffectiveSurfaceHeight(player.x, player.z, player.y);
            player.isHighGround = surf.isHighGround;
            player.perchName = surf.perchName;

            player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - simDt);
            if (player.grounded) {
              player.coyoteTimer = 0.12;
            } else {
              player.coyoteTimer = Math.max(0, player.coyoteTimer - simDt);
            }

            if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
              player.vy = 11.5;
              player.grounded = false;
              player.coyoteTimer = 0;
              player.jumpBufferTimer = 0;
              player.scaleX = 0.85;
              player.scaleY = 1.18;
            }

            // Lilith's Night Wings reduces gravity for smooth aerial hover sniping!
            const gravityScale = player.wingsTimer > 0 && player.vy < 0 ? 0.22 : 1.0;
            player.vy -= 26.0 * gravityScale * simDt;
            player.y += player.vy * simDt;

            if (player.y <= surf.groundY) {
              if (!player.grounded && player.vy < -4) {
                player.scaleX = 1.2;
                player.scaleY = 0.8;
              }
              player.y = surf.groundY;
              player.vy = 0;
              player.grounded = true;
            } else {
              player.grounded = false;
            }

            const stepSpeed = Math.hypot(player.vx, player.vz);
            player.walkPhase += stepSpeed * simDt * 1.45;
            if (player.grounded && stepSpeed > 4.5) {
              footstepDustAccum += stepSpeed * simDt;
              if (footstepDustAccum >= 3.2) {
                footstepDustAccum = 0;
                spawnParticleBurst(
                  player.x,
                  player.y + 0.15,
                  player.z,
                  player.isMounted ? 4 : 2,
                  0xd99b52,
                  3.2,
                  0.65
                );
              }
            }

            if (player.isMounted && relMove.isMoving && !player.isDrawing) {
              player.rotY = Math.atan2(relMove.moveDirX, relMove.moveDirZ);
            } else {
              player.rotY = player.camYaw;
            }
          }

          player.scaleX = THREE.MathUtils.damp(player.scaleX, 1, 14, simDt);
          player.scaleY = THREE.MathUtils.damp(player.scaleY, 1, 14, simDt);
          player.visualY = player.grappleActive
            ? player.y
            : THREE.MathUtils.damp(player.visualY, player.y, player.grounded ? 22 : 34, simDt);

          playerRig.root.position.set(player.x, player.visualY, player.z);
          playerRig.root.rotation.y = player.rotY;
          playerRig.root.scale.set(player.scaleX, player.scaleY, player.scaleX);

          const { right: strafeInput } = getWASDInputs();
          playerRig.nightWingsGroup.visible = player.wingsTimer > 0 && !player.isScoped;
          updateCharacterVisualState(playerRig, {
            isCamouflaged: player.isCamouflaged,
            isMounted: player.isMounted,
            isDownedScarab: player.isDownedScarab,
            isPropDisguised: player.isPropDisguised,
            isLocalScoped: player.isScoped,
            isAuraActive: player.auraTimer > 0,
            auraType: player.auraType,
            activeWeaponSlot: player.activeWeaponSlot,
            forgeLevel: player.forgeLevel,
            weaponRecoilTimer: player.weaponRecoilTimer,
            weaponSwapTimer: player.weaponSwapTimer,
            weaponReloadTimer: player.weaponReloadTimer,
            weaponInspectTimer: player.weaponInspectTimer,
            hitFlashTimer: player.hitFlashTimer,
            drawCharge: player.drawCharge,
            walkPhase: player.walkPhase,
            speedRatio: Math.hypot(player.vx, player.vz) / 10,
            strafeRatio: strafeInput,
            dashProgress: player.dashTimer > 0 ? 1 - Math.min(1, player.dashTimer / 0.25) : 0,
            airborneVy: player.grounded ? 0 : player.vy,
            idleTime: now * 0.001,
          });

          mpClient.emitPlayerState({
            heroClass: heroClassRef.current,
            x: Number(player.x.toFixed(2)),
            y: Number(player.y.toFixed(2)),
            z: Number(player.z.toFixed(2)),
            rotY: Number(player.rotY.toFixed(2)),
            hp: Math.round(player.hp),
            maxHp: player.maxHp,
            shield: Math.round(player.shield),
            isCamouflaged: player.isCamouflaged,
            isMounted: player.isMounted,
            isDownedScarab: player.isDownedScarab,
            isScoped: player.isScoped,
            kills: player.kills,
            score: player.score,
          });

          // --- UPDATE SHRINKING SOLAR SANDSTORM RING ---
          const stormState = computeSolarStormState(player.matchTime);
          solarStormRig.wallMesh.scale.set(stormState.currentRadius, 1, stormState.currentRadius);
          solarStormRig.wallMesh.rotation.y += simDt * 0.16;
          solarStormRig.groundRingMesh.scale.set(stormState.currentRadius, stormState.currentRadius, 1);
          solarStormRig.wallMat.opacity = stormState.isShrinking
            ? 0.24 + Math.sin(now * 0.008) * 0.06
            : 0.17;

          const playerDistFromCenter = Math.hypot(player.x, player.z);
          if (playerDistFromCenter > stormState.currentRadius && !sandboxModeRef.current) {
            stormDamageTickTimer += simDt;
            if (stormDamageTickTimer >= 1.0) {
              stormDamageTickTimer -= 1.0;
              applyDamageToLocalPlayer(
                stormState.damagePerSec,
                'Solar Sandstorm',
                false,
                player.x * 1.2,
                player.z * 1.2
              );
              spawnFloatingDamage(
                player.x,
                player.y + 1.9,
                player.z,
                stormState.damagePerSec,
                false,
                '#fb923c',
                'SOLAR STORM'
              );
              player.lastHitBanner = {
                text: `⚠️ OUTSIDE SOLAR SANDSTORM SAFE ZONE (-${stormState.damagePerSec} HP/s) · MOVE TO CENTER!`,
                isCrit: true,
                id: Date.now(),
              };
              player.bannerTimer = 1.6;
            }
          } else {
            stormDamageTickTimer = 0;
          }

          // --- UPDATE 99 RIVAL OUTRIDERS + PHARAOH BOSS (WITH ZERO-GC SPATIAL HASH GRID & AI TICK SLICING) ---
          frameTickCounter++;
          spatialGrid.clear();
          aiKillFeedCooldown = Math.max(0, aiKillFeedCooldown - simDt);
          aiEliminationCooldown = Math.max(0, aiEliminationCooldown - simDt);
          let activeWindups = 0;
          let aliveRivalsSnapshot = 0;
          for (let rIdx = 0; rIdx < rivals.length; rIdx++) {
            const r = rivals[rIdx];
            if (r.koTimer === 0 && !r.eliminated) {
              spatialGrid.insert(rIdx, r.x, r.z);
              if (!r.isBoss) aliveRivalsSnapshot++;
              if (r.windupTimer > 0) activeWindups++;
            }
          }
          const maxConcurrentAttackers = 3;

          for (let rIdx = 0; rIdx < rivals.length; rIdx++) {
            const r = rivals[rIdx];
            r.hitFlashTimer = Math.max(0, r.hitFlashTimer - simDt);

            if (r.koTimer > 0) {
              if (r.isBoss) {
                if (r.rig) r.rig.root.visible = false;
                continue;
              }
              if (r.eliminated && !sandboxModeRef.current) {
                continue;
              }
              r.koTimer = Math.max(0, r.koTimer - simDt);
              if (r.rig) {
                r.rig.root.rotation.x = THREE.MathUtils.damp(r.rig.root.rotation.x, -Math.PI / 2, 10, simDt);
                if (r.rig.telegraphRing) (r.rig.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0;
                if (r.rig.laserSight) (r.rig.laserSight.material as THREE.LineBasicMaterial).opacity = 0;
              }

              if (r.koTimer === 0) {
                const angle = Math.random() * Math.PI * 2;
                const rad = Math.min(stormState.currentRadius - 6, 26 + Math.random() * 24);
                r.x = Math.cos(angle) * rad;
                r.z = Math.sin(angle) * rad;
                r.y = groundHeightAt(r.x, r.z);
                const clsSpec = HERO_CLASSES[r.heroClass];
                r.maxHp = Math.round((clsSpec.maxHp + clsSpec.maxShield * 0.75) * (1 + (player.wave - 1) * 0.12));
                r.hp = r.maxHp;
                r.eliminated = false;
                r.burnTimer = 0;
                r.snaredTimer = 0;
                if (r.rig) r.rig.root.rotation.set(0, 0, 0);
                r.attackCooldown = 2.0;
                r.windupTimer = 0;
                spawnParticleBurst(r.x, r.y + 1.0, r.z, 10, 0xf59e0b, 7, 1.0);
              }
              continue;
            }

            // Burn Damage over Time (from White's Volcano Twins / Sticky Bomb, Ragnar's Cannon, or Lilith's Staff)
            if (r.burnTimer > 0) {
              r.burnTimer = Math.max(0, r.burnTimer - simDt);
              r.hp = Math.max(0, r.hp - 12 * simDt);
              player.damageDealt += 12 * simDt;
              if (Math.random() < 0.2) {
                spawnParticleBurst(r.x, r.y + 1.2, r.z, 2, 0xf97316, 4, 0.7);
              }
              if (checkAndHandleRivalElimination(r, 'Incendiary Burn', false)) {
                continue;
              }
            }

            if (player.snareActive && Math.hypot(r.x - player.snareX, r.z - player.snareZ) <= 6.0) {
              r.snaredTimer = 2.0;
              r.hp = Math.max(0, r.hp - 12 * simDt);
              player.damageDealt += 12 * simDt;
              if (player.snareMode === 'vortex') {
                const pullDx = player.snareX - r.x;
                const pullDz = player.snareZ - r.z;
                const pullLen = Math.hypot(pullDx, pullDz) || 1;
                r.x += (pullDx / pullLen) * 5.5 * simDt;
                r.z += (pullDz / pullLen) * 5.5 * simDt;
                player.hp = Math.min(player.maxHp, player.hp + 8 * simDt);
              }
              if (checkAndHandleRivalElimination(r, 'Trap Field', false)) {
                continue;
              }
            } else {
              r.snaredTimer = Math.max(0, r.snaredTimer - simDt);
            }

            // Determine whether this Rival Outrider targets the Player or engages a nearby Rival in an AI-vs-AI skirmish!
            const playerTargetX = player.isCamouflaged && player.decoyActive ? player.decoyX : player.x;
            const playerTargetZ = player.isCamouflaged && player.decoyActive ? player.decoyZ : player.z;
            const distToPlayer = Math.hypot(playerTargetX - r.x, playerTargetZ - r.z);
            const shouldRefreshSteering =
              r.isBoss || shouldUpdateRivalAISteering(rIdx, distToPlayer * distToPlayer, frameTickCounter);

            let nearestRival: RivalActor | null = null;
            let nearestRivalDist = 46;
            if (!r.isBoss && shouldRefreshSteering) {
              // O(1) Spatial Hash Grid neighbor query for authentic 100-player multi-way Battle Royale skirmishes
              const neighborIndices = spatialGrid.queryRadius(r.x, r.z, 46, spatialQueryScratch);
              for (let nIdx = 0; nIdx < neighborIndices.length; nIdx++) {
                const candIdx = neighborIndices[nIdx];
                if (candIdx === rIdx) continue;
                const cand = rivals[candIdx];
                if (!cand || cand.isBoss || cand.koTimer > 0 || cand.eliminated) continue;
                const d = Math.hypot(cand.x - r.x, cand.z - r.z);
                if (d < nearestRivalDist) {
                  nearestRivalDist = d;
                  nearestRival = cand;
                }
              }
            }

            const engagePlayer =
              r.isBoss ||
              (!player.isCamouflaged &&
                !(player.isDownedScarab && player.isPropDisguised) &&
                distToPlayer <= 36 &&
                (!nearestRival || distToPlayer <= nearestRivalDist + 8));

            const targetX = engagePlayer
              ? playerTargetX
              : nearestRival
              ? nearestRival.x
              : 0;
            const targetZ = engagePlayer
              ? playerTargetZ
              : nearestRival
              ? nearestRival.z
              : 0;

            r.attackCooldown = Math.max(0, r.attackCooldown - simDt);
            r.aiSkirmishCooldown = Math.max(0, r.aiSkirmishCooldown - simDt);

            // Paced AI-vs-AI Skirmish Exchange when fighting another Rival Outrider within 24m
            if (!engagePlayer && nearestRival && nearestRivalDist <= 24 && r.aiSkirmishCooldown === 0) {
              const rawAiDmg = 14 + Math.round(Math.random() * 8);
              const skirmishRes = computeAISkirmishPacing({
                matchTimeSec: player.matchTime,
                aliveRivalsCount: aliveRivalsSnapshot,
                targetCurrentHp: nearestRival.hp,
                rawDamage: rawAiDmg,
                aiEliminationCooldownSec: aiEliminationCooldown,
              });
              r.aiSkirmishCooldown = skirmishRes.nextSkirmishCooldownSec + Math.random() * 2.2;
              aiEliminationCooldown = skirmishRes.nextEliminationCooldownSec;
              nearestRival.hp = skirmishRes.nextTargetHp;
              nearestRival.hitFlashTimer = 0.08;
              if (Math.hypot(r.x - player.x, r.z - player.z) <= 52) {
                spawnParticleBurst(
                  nearestRival.x,
                  nearestRival.y + 1.3,
                  nearestRival.z,
                  4,
                  HERO_CLASSES[r.heroClass].weapons[1].projectileColor,
                  6,
                  0.75
                );
              }
              if (skirmishRes.eliminated && nearestRival.koTimer === 0) {
                aliveRivalsSnapshot = Math.max(0, aliveRivalsSnapshot - 1);
                r.kills += 1;
                r.hp = Math.min(r.maxHp, r.hp + 45);
                if (sandboxModeRef.current) {
                  nearestRival.koTimer = 0.6;
                  nearestRival.eliminated = false;
                } else {
                  nearestRival.koTimer = 9999;
                  nearestRival.eliminated = true;
                  if (nearestRival.rig) {
                    nearestRival.rig.root.visible = false;
                    nearestRival.rig = null;
                  }
                }
                if (aiKillFeedCooldown === 0) {
                  aiKillFeedCooldown = 2.4;
                  onKillFeedRef.current({
                    id: `ai-kill-${Date.now()}-${r.id}`,
                    killerName: r.name,
                    killerClass: r.heroClass,
                    victimName: nearestRival.name,
                    weaponTag: HERO_CLASSES[r.heroClass].primaryWeapon,
                    isHeadshot: Math.random() < 0.25,
                    timestamp: Date.now(),
                  });
                }
                const remainingAfterAiKill = countAliveNonBossRivals();
                if (!sandboxModeRef.current && remainingAfterAiKill === 0 && !player.endingTriggered) {
                  player.endingTriggered = true;
                  player.pendingOutcome = 'victory';
                  player.endDelayTimer = 0.55;
                }
              }
            }

            if (r.windupTimer > 0) {
              r.windupTimer = Math.max(0, r.windupTimer - simDt);
              const progress = 1 - r.windupTimer / r.windupDuration;

              if (r.rig?.telegraphRing) {
                const mat = r.rig.telegraphRing.material as THREE.MeshBasicMaterial;
                mat.opacity = 0.35 + progress * 0.55;
                const s = 1.35 - progress * 0.45;
                r.rig.telegraphRing.scale.set(s, s, 1);
              }
              if (r.rig?.laserSight && r.policy === 'kiter_sniper') {
                (r.rig.laserSight.material as THREE.LineBasicMaterial).opacity = 0.75;
              }

              r.rotY = Math.atan2(targetX - r.x, targetZ - r.z);

              if (r.windupTimer === 0) {
                if (r.rig?.telegraphRing) (r.rig.telegraphRing.material as THREE.MeshBasicMaterial).opacity = 0;
                if (r.rig?.laserSight) (r.rig.laserSight.material as THREE.LineBasicMaterial).opacity = 0;

                if (engagePlayer && !(player.isDownedScarab && player.isPropDisguised)) {
                  const dx = targetX - r.x;
                  const dz = targetZ - r.z;
                  const dLen = Math.hypot(dx, dz) || 1;
                  const p = acquireProjectile();
                  p.active = true;
                  p.id = `${r.id}-${Date.now()}`;
                  p.ownerId = r.id;
                  p.isPlayerOwned = false;
                  p.x = r.x + (dx / dLen) * 0.9;
                  p.y = r.y + 1.4;
                  p.z = r.z + (dz / dLen) * 0.9;
                  const pSpd = r.policy === 'kiter_sniper' ? 38 : 28;
                  p.vx = (dx / dLen) * pSpd;
                  p.vy = ((player.y + 1.2 - p.y) / dLen) * pSpd;
                  p.vz = (dz / dLen) * pSpd;
                  p.damage = r.policy === 'kiter_sniper' ? 18 : 14;
                  p.isCharged = false;
                  p.homingTargetId = null;
                  p.explosiveRadius = 0;
                  p.appliesBurn = false;
                  p.appliesStun = false;
                  p.colorHex = 0xef4444;
                  p.visualKind = getWeaponVisualKind(r.heroClass, 1);
                  p.life = 2.2;
                  configureProjectileVisual(p.rig, p.visualKind, 0xef4444, false);
                  p.rig.root.visible = true;
                  p.rig.root.position.set(p.x, p.y, p.z);
                  p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);
                }

                r.attackCooldown = 2.8 + Math.random() * 1.4;
              }
            } else {
              let shouldStartWindupNow = false;
              if (shouldRefreshSteering) {
                const effSpeed = r.speed * (r.snaredTimer > 0 ? 0.32 : 1.0);
                const intent = computeEnemyPolicyIntent({
                  policy: r.policy,
                  enemyX: r.x,
                  enemyZ: r.z,
                  targetX,
                  targetZ,
                  speed: effSpeed,
                  strafeSign: r.strafeSign,
                  attackCooldown: r.attackCooldown,
                  canAcquireAttackToken:
                    engagePlayer &&
                    distToPlayer <= 34 &&
                    activeWindups < maxConcurrentAttackers &&
                    player.matchTime > 2.5,
                });
                shouldStartWindupNow = intent.shouldStartWindup;

                const stormAwareVel = computeStormAwareEnemyVelocity({
                  policy: r.policy,
                  enemyX: r.x,
                  enemyZ: r.z,
                  targetX,
                  targetZ,
                  baseSpeed: effSpeed,
                  strafeSign: r.strafeSign,
                  stormRadius: stormState.currentRadius,
                  stormTargetRadius: stormState.targetRadius,
                });

                r.vx = THREE.MathUtils.damp(r.vx, stormAwareVel.vx, 8, simDt);
                r.vz = THREE.MathUtils.damp(r.vz, stormAwareVel.vz, 8, simDt);
              }

              // Apply Solar Sandstorm damage if a Rival remains outside the active safe zone
              const rDistFromCenter = Math.hypot(r.x, r.z);
              if (rDistFromCenter > stormState.currentRadius && !sandboxModeRef.current && !r.isBoss) {
                r.hp = Math.max(0, r.hp - stormState.damagePerSec * 0.35 * simDt);
                if (r.hp <= 0 && r.koTimer === 0) {
                  r.koTimer = 9999;
                  r.eliminated = true;
                  if (r.rig) {
                    r.rig.root.visible = false;
                    r.rig = null;
                  }
                  const rem = countAliveNonBossRivals();
                  if (rem === 0 && !player.endingTriggered) {
                    player.endingTriggered = true;
                    player.pendingOutcome = 'victory';
                    player.endDelayTimer = 0.55;
                  }
                  continue;
                }
              }

              r.x += r.vx * simDt;
              r.z += r.vz * simDt;

              if (shouldRefreshSteering) {
                const rObstacleResolved = resolveObstacleCollision(r.x, r.z, r.y, r.isBoss ? 1.15 : 0.75);
                r.x = rObstacleResolved.x;
                r.z = rObstacleResolved.z;
              }

              const rDist = Math.hypot(r.x, r.z);
              if (rDist > ARENA_RADIUS - 3) {
                r.x *= (ARENA_RADIUS - 3) / rDist;
                r.z *= (ARENA_RADIUS - 3) / rDist;
                r.strafeSign *= -1;
              }

              r.y = groundHeightAt(r.x, r.z);
              if (shouldRefreshSteering) {
                r.rotY = Math.atan2(targetX - r.x, targetZ - r.z);
              }
              r.walkPhase += Math.hypot(r.vx, r.vz) * simDt * 1.4;

              if (shouldStartWindupNow && engagePlayer) {
                r.windupTimer = r.windupDuration;
                activeWindups++;
                audioEngine.playEnemyTelegraph();
              }
            }

            if (r.isBoss && r.bossCrownGroup) {
              r.bossCrownGroup.rotation.y += simDt * 1.8;
            }
          }

          // --- HYBRID 60 FPS LOD ASSIGNMENT & INSTANCED CROWD RENDERING ---
          for (const slot of nearRigPool) {
            slot.inUse = false;
            slot.rig.root.visible = false;
          }

          const nearCandidates: Array<{ rival: RivalActor; distSq: number }> = [];
          for (let i = 0; i < RIVAL_TEMPLATES.length; i++) {
            const rv = rivals[i];
            rv.rig = null;
            if (rv.koTimer > 0 || rv.eliminated) continue;
            const dx = rv.x - player.x;
            const dz = rv.z - player.z;
            const distSq = dx * dx + dz * dz;
            if (distSq <= 48 * 48) {
              nearCandidates.push({ rival: rv, distSq });
            }
          }
          nearCandidates.sort((a, b) => a.distSq - b.distSq);

          for (const cand of nearCandidates) {
            const rv = cand.rival;
            const freeSlot = nearRigPool.find((s) => !s.inUse && s.heroClass === rv.heroClass);
            if (freeSlot) {
              freeSlot.inUse = true;
              rv.rig = freeSlot.rig;
            }
          }

          // Update Boss Rig if active
          if (bossActor.koTimer === 0 && bossActor.rig) {
            bossActor.rig.root.visible = true;
            bossActor.rig.root.position.set(bossActor.x, bossActor.y, bossActor.z);
            bossActor.rig.root.rotation.y = bossActor.rotY;
            if (bossActor.rig.overheadBarGroup) bossActor.rig.overheadBarGroup.visible = true;
            updateCharacterVisualState(bossActor.rig, {
              isCamouflaged: false,
              isMounted: false,
              isDownedScarab: false,
              forgeLevel: 3,
              burnActive: bossActor.burnTimer > 0,
              stunActive: bossActor.snaredTimer > 0,
              hitFlashTimer: bossActor.hitFlashTimer,
              drawCharge: bossActor.windupTimer > 0 ? 0.85 : 0.2,
              walkPhase: bossActor.walkPhase,
              speedRatio: Math.hypot(bossActor.vx, bossActor.vz) / 8,
              strafeRatio: bossActor.strafeSign * 0.5,
              idleTime: now * 0.001 + bossActor.walkPhase,
              hpRatio: bossActor.hp / bossActor.maxHp,
              cameraQuaternion: camera.quaternion,
            });
          } else if (bossActor.rig) {
            bossActor.rig.root.visible = false;
          }

          // Update Near-Detail Rigs (LOD 0) & Instanced Combatant Crowd (LOD 1)
          for (let i = 0; i < RIVAL_TEMPLATES.length; i++) {
            const rv = rivals[i];
            if (rv.koTimer === 0 && !rv.eliminated && rv.rig) {
              // LOD 0: Full Articulated CharacterRig
              rv.rig.root.visible = true;
              rv.rig.root.rotation.x = 0;
              rv.rig.root.position.set(rv.x, rv.y, rv.z);
              rv.rig.root.rotation.y = rv.rotY;
              if (rv.rig.overheadBarGroup) rv.rig.overheadBarGroup.visible = true;
              updateCharacterVisualState(rv.rig, {
                isCamouflaged: false,
                isMounted: false,
                isDownedScarab: false,
                forgeLevel: 0,
                burnActive: rv.burnTimer > 0,
                stunActive: rv.snaredTimer > 0,
                hitFlashTimer: rv.hitFlashTimer,
                drawCharge: rv.windupTimer > 0 ? 0.85 : 0.2,
                walkPhase: rv.walkPhase,
                speedRatio: Math.hypot(rv.vx, rv.vz) / 8,
                strafeRatio: rv.strafeSign * 0.5,
                idleTime: now * 0.001 + rv.walkPhase,
                hpRatio: rv.hp / rv.maxHp,
                cameraQuaternion: camera.quaternion,
              });

              // Hide instanced slot since near rig is active
              _dummyObj.position.set(0, -999, 0);
              _dummyObj.scale.setScalar(0.001);
              _dummyObj.updateMatrix();
              instancedCrowd.torsoInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.headInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.weaponInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.hpBarInst.setMatrixAt(i, _dummyObj.matrix);
            } else if (rv.koTimer === 0 && !rv.eliminated) {
              // LOD 1: GPU-Instanced Mid/Far Crowd Member
              const bob = Math.abs(Math.sin(rv.walkPhase)) * 0.08;
              _dummyObj.position.set(rv.x, rv.y + bob, rv.z);
              _dummyObj.rotation.set(0, rv.rotY, 0);
              _dummyObj.scale.set(1, 1, 1);
              _dummyObj.updateMatrix();
              instancedCrowd.torsoInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.headInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.weaponInst.setMatrixAt(i, _dummyObj.matrix);

              const clsColorHex = HERO_CLASSES[rv.heroClass].weapons[1].projectileColor;
              _pColor.setHex(rv.hitFlashTimer > 0 ? 0xffffff : clsColorHex);
              instancedCrowd.torsoInst.setColorAt(i, _pColor);

              // Overhead HP bar facing camera
              const hpRatio = Math.max(0.05, rv.hp / Math.max(1, rv.maxHp));
              _dummyObj.position.set(rv.x, rv.y + bob, rv.z);
              _dummyObj.quaternion.copy(camera.quaternion);
              _dummyObj.scale.set(hpRatio, 1, 1);
              _dummyObj.updateMatrix();
              instancedCrowd.hpBarInst.setMatrixAt(i, _dummyObj.matrix);
            } else {
              // Eliminated Rival: hide instanced slot
              _dummyObj.position.set(0, -999, 0);
              _dummyObj.scale.setScalar(0.001);
              _dummyObj.updateMatrix();
              instancedCrowd.torsoInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.headInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.weaponInst.setMatrixAt(i, _dummyObj.matrix);
              instancedCrowd.hpBarInst.setMatrixAt(i, _dummyObj.matrix);
            }
          }
          instancedCrowd.torsoInst.instanceMatrix.needsUpdate = true;
          if (instancedCrowd.torsoInst.instanceColor) {
            instancedCrowd.torsoInst.instanceColor.needsUpdate = true;
          }
          instancedCrowd.headInst.instanceMatrix.needsUpdate = true;
          instancedCrowd.weaponInst.instanceMatrix.needsUpdate = true;
          instancedCrowd.hpBarInst.instanceMatrix.needsUpdate = true;

          // --- UPDATE GOLDEN SCARAB RELIQUARY LOOT CHESTS ---
          for (const chest of lootChests) {
            chest.rig.crystalMesh.rotation.y += simDt * 2.4;
            chest.rig.crystalMesh.position.y = 1.42 + Math.sin(now * 0.004) * 0.14;
            chest.rig.scarabHalo.rotation.z += simDt * 1.5;

            if (chest.opened) {
              chest.rig.lidGroup.rotation.x = THREE.MathUtils.damp(
                chest.rig.lidGroup.rotation.x,
                -1.25,
                8,
                simDt
              );
              chest.respawnTimer = Math.max(0, chest.respawnTimer - simDt);
              if (chest.respawnTimer === 0) {
                chest.opened = false;
                chest.rig.lidGroup.rotation.x = 0;
                chest.rig.crystalMesh.visible = true;
                chest.rig.beaconRing.visible = true;
                spawnParticleBurst(chest.x, chest.y + 1.0, chest.z, 16, 0xfacc15, 7, 1.0);
              }
            } else {
              const distToChest = Math.hypot(player.x - chest.x, player.z - chest.z);
              if (distToChest <= 2.6 && !player.isDownedScarab) {
                chest.opened = true;
                chest.respawnTimer = 18.0;
                chest.rig.crystalMesh.visible = false;
                chest.rig.beaconRing.visible = false;
                player.chestsOpened += 1;
                player.magicShards += 35;
                player.score += 180;
                player.hp = Math.min(player.maxHp, player.hp + 35);
                player.shield = Math.min(player.maxShield, player.shield + 35);
                audioEngine.playCombatAnnouncer('chest_open');
                spawnParticleBurst(chest.x, chest.y + 1.1, chest.z, 26, 0xfacc15, 10, 1.35);
                spawnShockwave(chest.x, chest.y, chest.z, 0xfacc15, 6.2, 0.45);
                spawnFloatingDamage(chest.x, chest.y + 1.6, chest.z, 35, true, '#facc15', 'RELIQUARY +35 SHARDS');
                player.lastHitBanner = {
                  text: `OPENED ${chest.name.toUpperCase()} · +35 MAGIC SHARDS & +35 VITALITY/SHIELD!`,
                  isCrit: true,
                  id: Date.now(),
                };
                player.bannerTimer = 2.6;
              }
            }
          }

          for (const [, entry] of remoteRigs.entries()) {
            const rp = entry.data;
            entry.rig.root.position.x = THREE.MathUtils.damp(entry.rig.root.position.x, rp.x, 12, simDt);
            entry.rig.root.position.y = THREE.MathUtils.damp(entry.rig.root.position.y, rp.y, 12, simDt);
            entry.rig.root.position.z = THREE.MathUtils.damp(entry.rig.root.position.z, rp.z, 12, simDt);
            entry.rig.root.rotation.y = rp.rotY;
            updateCharacterVisualState(entry.rig, {
              isCamouflaged: rp.isCamouflaged,
              isMounted: rp.isMounted,
              isDownedScarab: rp.isDownedScarab,
              hitFlashTimer: 0,
              drawCharge: rp.isScoped ? 0.9 : 0.2,
              walkPhase: now * 0.008,
              speedRatio: 0.7,
              idleTime: now * 0.001,
              hpRatio: rp.maxHp > 0 ? rp.hp / rp.maxHp : 1,
              cameraQuaternion: camera.quaternion,
            });
          }

          for (const p of projectiles) {
            if (!p.active) continue;
            p.life -= simDt;
            if (p.life <= 0) {
              p.active = false;
              p.rig.root.visible = false;
              continue;
            }

            if (p.isPlayerOwned && p.homingTargetId) {
              const targetRival = rivals.find((rv) => rv.id === p.homingTargetId && rv.koTimer === 0);
              if (targetRival) {
                const tx = targetRival.x - p.x;
                const ty = targetRival.y + (p.isScopedShot ? 1.8 : 1.35) - p.y;
                const tz = targetRival.z - p.z;
                const dist = Math.hypot(tx, ty, tz) || 1;
                const spd = Math.hypot(p.vx, p.vy, p.vz);
                p.vx = THREE.MathUtils.damp(p.vx, (tx / dist) * spd, 9, simDt);
                p.vy = THREE.MathUtils.damp(p.vy, (ty / dist) * spd, 9, simDt);
                p.vz = THREE.MathUtils.damp(p.vz, (tz / dist) * spd, 9, simDt);
              }
            }

            p.x += p.vx * simDt;
            p.y += p.vy * simDt;
            p.z += p.vz * simDt;
            p.rig.root.position.set(p.x, p.y, p.z);
            p.rig.root.lookAt(p.x + p.vx, p.y + p.vy, p.z + p.vz);

            // Animate weapon-specific 3D projectile spin in flight!
            p.rig.accentRing.rotation.z += simDt * 18;
            if (p.visualKind === 'fly_dagger') {
              p.rig.coreMesh.rotation.z += simDt * 24;
            } else if (p.visualKind === 'cutlass_wave') {
              p.rig.waveArcMesh.rotation.z += simDt * 16;
              p.rig.coreMesh.rotation.z += simDt * 16;
            } else if (
              p.visualKind === 'medusa_orb' ||
              p.visualKind === 'flame_meteor' ||
              p.visualKind === 'naval_cannonball'
            ) {
              p.rig.accentRing.rotation.y += simDt * 14;
            }

            if (Math.random() < 0.55) {
              spawnParticleBurst(p.x, p.y, p.z, 1, p.colorHex, 2.0, 0.6);
            }

            // Check solid stone Obelisk & Sniper Perch column collision for projectiles
            if (checkProjectileObstacleHit(p.x, p.y, p.z).hit) {
              p.active = false;
              p.rig.root.visible = false;
              spawnParticleBurst(p.x, p.y, p.z, 8, p.colorHex, 6.0, 0.75);
              continue;
            }

            if (p.isPlayerOwned) {
              // Shooting a closed Golden Reliquary Chest opens it from afar!
              let hitChest = false;
              for (const chest of lootChests) {
                if (!chest.opened && Math.hypot(p.x - chest.x, p.z - chest.z) <= 1.6 && Math.abs(p.y - (chest.y + 0.8)) <= 1.4) {
                  chest.opened = true;
                  chest.respawnTimer = 18.0;
                  chest.rig.crystalMesh.visible = false;
                  chest.rig.beaconRing.visible = false;
                  player.chestsOpened += 1;
                  player.magicShards += 35;
                  player.score += 180;
                  player.hp = Math.min(player.maxHp, player.hp + 35);
                  player.shield = Math.min(player.maxShield, player.shield + 35);
                  audioEngine.playCombatAnnouncer('chest_open');
                  spawnParticleBurst(chest.x, chest.y + 1.1, chest.z, 26, 0xfacc15, 10, 1.35);
                  spawnShockwave(chest.x, chest.y, chest.z, 0xfacc15, 6.2, 0.45);
                  spawnFloatingDamage(chest.x, chest.y + 1.6, chest.z, 35, true, '#facc15', 'RELIQUARY +35 SHARDS');
                  player.lastHitBanner = {
                    text: `SHOT OPEN ${chest.name.toUpperCase()} · +35 MAGIC SHARDS & +35 VITALITY/SHIELD!`,
                    isCrit: true,
                    id: Date.now(),
                  };
                  player.bannerTimer = 2.6;
                  p.active = false;
                  p.rig.root.visible = false;
                  hitChest = true;
                  break;
                }
              }
              if (hitChest) continue;

              // O(1) Spatial Hash Grid lookup for projectile-vs-rival 3D hit detection
              const hitCandidates = spatialGrid.queryRadius(p.x, p.z, 3.2, spatialQueryScratch);
              for (let cIdx = 0; cIdx < hitCandidates.length; cIdx++) {
                const r = rivals[hitCandidates[cIdx]];
                if (!r || r.koTimer > 0) continue;
                const hitCheck = checkProjectile3DHit({
                  projX: p.x,
                  projY: p.y,
                  projZ: p.z,
                  targetX: r.x,
                  targetY: r.y,
                  targetZ: r.z,
                  isBoss: r.isBoss,
                  isScopedShot: p.isScopedShot,
                });
                if (hitCheck.hit) {
                  const isHeadshot = hitCheck.isHeadshot;
                  const shotRes = calculatePrecisionShotDamage({
                    baseDamage: p.damage,
                    drawCharge: p.isCharged ? 1.0 : 0.6,
                    isScoped: p.isScopedShot,
                    isHeadshot,
                    isCamouflagedAmbush: p.isAmbushShot,
                    isHighGround: p.isHighGroundShot,
                    isTargetSnared: r.snaredTimer > 0,
                    forgeLevel: player.forgeLevel,
                  });

                  player.shotsHit += 1;
                  if (shotRes.finalDamage > player.maxSingleDamage) {
                    player.maxSingleDamage = shotRes.finalDamage;
                  }
                  spawnFloatingDamage(
                    r.x,
                    r.y + (r.isBoss ? 2.5 : 1.85),
                    r.z,
                    shotRes.finalDamage,
                    shotRes.isCritical,
                    shotRes.isCritical ? '#facc15' : '#fef08a',
                    shotRes.tags[0] || (isHeadshot ? 'HEADSHOT' : '')
                  );

                  r.hp = Math.max(0, r.hp - shotRes.finalDamage);
                  r.hitFlashTimer = 0.065;
                  if (p.appliesBurn) r.burnTimer = 3.0;
                  if (p.appliesStun) {
                    r.snaredTimer = Math.max(r.snaredTimer, 1.6);
                    r.windupTimer = 0;
                  }

                  // Weapon-specific 3D Impact Visual Effects + Persistent Ground Craters!
                  spawnGroundCrater(
                    p.x,
                    p.z,
                    p.colorHex,
                    p.explosiveRadius > 0 || p.visualKind === 'flame_meteor' ? 1.85 : 1.15
                  );
                  if (p.explosiveRadius > 0 || p.visualKind === 'flame_meteor') {
                    spawnShockwave(p.x, r.y, p.z, p.colorHex, Math.max(5.5, p.explosiveRadius * 1.4), 0.48);
                    spawnSkillPillar(p.x, r.y, p.z, p.colorHex, 3.8, 0.5);
                    for (const other of rivals) {
                      if (
                        other.id !== r.id &&
                        other.koTimer === 0 &&
                        Math.hypot(other.x - p.x, other.z - p.z) <= p.explosiveRadius
                      ) {
                        const splashDmg = Math.round(shotRes.finalDamage * 0.55);
                        other.hp = Math.max(0, other.hp - splashDmg);
                        other.hitFlashTimer = 0.08;
                        if (p.appliesBurn) other.burnTimer = 2.5;
                        player.damageDealt += splashDmg;
                        spawnFloatingDamage(other.x, other.y + 1.6, other.z, splashDmg, false, '#fb923c', 'SPLASH');
                        checkAndHandleRivalElimination(other, 'AoE Splash', false);
                      }
                    }
                  } else if (
                    p.visualKind === 'longbow_arrow' ||
                    p.visualKind === 'cutlass_wave' ||
                    p.visualKind === 'phantom_rail' ||
                    p.visualKind === 'sea_trident' ||
                    p.visualKind === 'medusa_orb'
                  ) {
                    spawnShockwave(p.x, r.y, p.z, p.colorHex, shotRes.isCritical ? 4.8 : 3.4, 0.35);
                    if (shotRes.isCritical || p.appliesStun) {
                      spawnSkillPillar(r.x, r.y, r.z, p.colorHex, 2.2, 0.42);
                    }
                  }

                  player.damageDealt += shotRes.finalDamage;
                  player.magicShards += 6;
                  if (player.forgeLevel > 0) {
                    player.hp = Math.min(player.maxHp, player.hp + player.forgeLevel * 3);
                  }
                  p.active = false;
                  p.rig.root.visible = false;

                  const activeWepName =
                    HERO_CLASSES[heroClassRef.current].weapons[player.activeWeaponSlot].name;
                  const isKill = checkAndHandleRivalElimination(r, activeWepName, isHeadshot);
                  audioEngine.playHitImpact(shotRes.isCritical, isKill);
                  spawnParticleBurst(
                    p.x,
                    p.y,
                    p.z,
                    shotRes.isCritical || p.explosiveRadius > 0 ? 22 : 12,
                    shotRes.isCritical ? 0xfacc15 : p.colorHex,
                    10,
                    shotRes.isCritical || p.explosiveRadius > 0 ? 1.35 : 0.95
                  );

                  if (shotRes.isCritical || isKill) {
                    hitstopTimer = isKill ? 0.05 : 0.03;
                    cameraTrauma = Math.min(1, cameraTrauma + 0.2);
                  }

                  if (!isKill) {
                    const tagStr =
                      shotRes.tags.length > 0
                        ? `${shotRes.tags[0]} · ${shotRes.finalDamage} DMG`
                        : `${activeWepName.toUpperCase()} · ${shotRes.finalDamage} DMG`;
                    player.lastHitBanner = {
                      text: tagStr,
                      isCrit: shotRes.isCritical,
                      id: Date.now(),
                    };
                    player.bannerTimer = 1.9;
                  }
                  break;
                }
              }

              if (p.active) {
                for (const [remId, entry] of remoteRigs.entries()) {
                  const rp = entry.data;
                  const horizDist = Math.hypot(p.x - rp.x, p.z - rp.z);
                  const dy = p.y - rp.y;
                  if (horizDist <= 1.4 && dy >= 0.0 && dy <= 2.5) {
                    const isHeadshot = dy >= 1.5 || p.isScopedShot;
                    const shotRes = calculatePrecisionShotDamage({
                      baseDamage: p.damage,
                      drawCharge: p.isCharged ? 1.0 : 0.6,
                      isScoped: p.isScopedShot,
                      isHeadshot,
                      isCamouflagedAmbush: p.isAmbushShot,
                      isHighGround: p.isHighGroundShot,
                      isTargetSnared: false,
                      forgeLevel: player.forgeLevel,
                    });
                    player.shotsHit += 1;
                    if (shotRes.finalDamage > player.maxSingleDamage) {
                      player.maxSingleDamage = shotRes.finalDamage;
                    }
                    spawnFloatingDamage(rp.x, rp.y + 1.85, rp.z, shotRes.finalDamage, shotRes.isCritical);
                    p.active = false;
                    p.rig.root.visible = false;
                    player.damageDealt += shotRes.finalDamage;
                    audioEngine.playHitImpact(shotRes.isCritical, false);
                    spawnParticleBurst(p.x, p.y, p.z, 16, 0xfacc15, 9, 1.1);
                    mpClient.emitHit(remId, shotRes.finalDamage, isHeadshot);
                    break;
                  }
                }
              }
            } else {
              const horizDist = Math.hypot(p.x - player.x, p.z - player.z);
              const dy = p.y - player.y;
              if (horizDist <= 1.0 && dy >= 0.1 && dy <= 2.2) {
                const ownerRival = rivals.find((rv) => rv.id === p.ownerId);
                p.active = false;
                p.rig.root.visible = false;
                spawnParticleBurst(p.x, p.y, p.z, 12, 0xef4444, 8, 1.0);
                applyDamageToLocalPlayer(
                  p.damage,
                  ownerRival ? ownerRival.name : 'Rival Outrider',
                  false,
                  ownerRival ? ownerRival.x : p.x - p.vx,
                  ownerRival ? ownerRival.z : p.z - p.vz
                );
              }
            }
          }

          let anyParticlesUpdated = false;
          for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
            const pt = pData[i];
            if (!pt.active) continue;
            anyParticlesUpdated = true;
            pt.life -= simDt;
            if (pt.life <= 0) {
              pt.active = false;
              _dummyObj.position.set(0, -999, 0);
              _dummyObj.scale.setScalar(0.001);
              _dummyObj.updateMatrix();
              particleMesh.setMatrixAt(i, _dummyObj.matrix);
              continue;
            }
            pt.vy -= 14 * simDt;
            pt.x += pt.vx * simDt;
            pt.y += pt.vy * simDt;
            pt.z += pt.vz * simDt;
            const lifeRatio = pt.life / pt.maxLife;
            _dummyObj.position.set(pt.x, pt.y, pt.z);
            _dummyObj.scale.setScalar(pt.scale * lifeRatio);
            _dummyObj.updateMatrix();
            particleMesh.setMatrixAt(i, _dummyObj.matrix);
          }
          if (anyParticlesUpdated) {
            particleMesh.instanceMatrix.needsUpdate = true;
          }

          // Update 3D Expanding Shockwave Rings
          for (const sw of shockwaves) {
            if (!sw.active) continue;
            sw.life -= simDt;
            if (sw.life <= 0) {
              sw.active = false;
              sw.mesh.visible = false;
              continue;
            }
            const progress = 1 - sw.life / sw.maxLife;
            const curScale = THREE.MathUtils.lerp(0.35, sw.maxScale, 1 - Math.pow(1 - progress, 2));
            sw.mesh.scale.setScalar(curScale);
            sw.mat.opacity = (1 - progress) * 0.82;
          }

          // Update 3D Skill Pillars & Geodesic Plasma Domes
          for (const sp of skillPillars) {
            if (!sp.active) continue;
            sp.life -= simDt;
            if (sp.life <= 0) {
              sp.active = false;
              sp.group.visible = false;
              continue;
            }
            const progress = 1 - sp.life / sp.maxLife;
            const beamRadius = THREE.MathUtils.lerp(1.4, 0.25, progress);
            sp.beamMesh.scale.set(beamRadius, 1.0, beamRadius);
            sp.beamMat.opacity = (1 - progress) * 0.72;
            const domeRadius = THREE.MathUtils.lerp(0.45, sp.radiusScale, 1 - Math.pow(1 - progress, 2));
            sp.domeMesh.scale.setScalar(domeRadius);
            sp.domeMesh.rotation.y += simDt * 8.0;
            sp.domeMat.opacity = (1 - progress) * 0.85;
          }

          // Update 3D Persistent Ground Craters & Scorch Marks
          for (const cr of groundCraters) {
            if (!cr.active) continue;
            cr.life -= simDt;
            if (cr.life <= 0) {
              cr.active = false;
              cr.group.visible = false;
              continue;
            }
            const fade = Math.min(1, cr.life / 1.5);
            cr.scorchMat.opacity = fade * 0.78;
            cr.glowMat.opacity = fade * 0.85;
          }
          // Update floating 3D damage numbers & directional hit arcs
          for (const f of floatingDamagePool) {
            if (!f.active) continue;
            f.life -= simDt;
            f.worldY += 1.55 * simDt;
            if (f.life <= 0) f.active = false;
          }
          for (const a of hitArcPool) {
            if (!a.active) continue;
            a.life -= simDt;
            if (a.life <= 0) a.active = false;
          }
        }

        // --- AAA SPRING-DAMPER OVER-THE-SHOULDER 3D CAMERA RIG ---
        const targetFov = player.isScoped ? 26 : player.dashTimer > 0 ? 72 : player.isMounted ? 68 : 60;
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 14, dt);
        camera.updateProjectionMatrix();

        const baseCamDist = player.isScoped ? 2.4 : player.isMounted ? 10.2 : 7.8;
        const pivotHeight = player.isScoped ? 1.75 : player.isMounted ? 2.6 : 2.15;
        const rightShoulderOffset = player.isScoped ? 0.0 : 0.72;

        const aim = computeAimRayDirection(player.camYaw, player.camPitch);
        const rightX = -Math.cos(player.camYaw);
        const rightZ = Math.sin(player.camYaw);

        const rayPivotX = player.x + rightX * rightShoulderOffset;
        const rayPivotY = player.visualY + pivotHeight;
        const rayPivotZ = player.z + rightZ * rightShoulderOffset;

        const rawCamX = rayPivotX - aim.dirX * baseCamDist;
        const rawCamY = Math.max(groundHeightAt(rayPivotX, rayPivotZ) + 0.6, rayPivotY - aim.dirY * baseCamDist);
        const rawCamZ = rayPivotZ - aim.dirZ * baseCamDist;

        _rayOrigin.set(rayPivotX, rayPivotY, rayPivotZ);
        _camTargetPos.set(rawCamX, rawCamY, rawCamZ);
        _rayDir.copy(_camTargetPos).sub(_rayOrigin);
        const maxCamLen = _rayDir.length();
        let obstacleHitDist: number | null = null;
        if (maxCamLen > 0.01) {
          _rayDir.divideScalar(maxCamLen);
          camRaycaster.set(_rayOrigin, _rayDir);
          camRaycaster.far = maxCamLen;
          const hits = camRaycaster.intersectObjects(environmentObstacles, false);
          if (hits.length > 0 && hits[0].distance < maxCamLen) {
            obstacleHitDist = hits[0].distance;
          }
        }

        const smoothCam = computeSmoothThirdPersonCamera({
          playerX: player.x,
          playerVisualY: player.visualY,
          playerZ: player.z,
          playerVx: player.vx,
          playerVz: player.vz,
          camYaw: player.camYaw,
          camPitch: player.camPitch,
          isScoped: player.isScoped,
          isMounted: player.isMounted,
          isDashing: player.dashTimer > 0,
          prevSmoothedDist: smoothedCamDist,
          rawObstacleHitDist: obstacleHitDist,
          dt,
        });
        smoothedCamDist = smoothCam.smoothedDist;

        const desiredCamX = smoothCam.pivotX - aim.dirX * smoothedCamDist;
        const desiredCamY = Math.max(
          groundHeightAt(smoothCam.pivotX, smoothCam.pivotZ) + 0.6,
          smoothCam.pivotY - aim.dirY * smoothedCamDist
        );
        const desiredCamZ = smoothCam.pivotZ - aim.dirZ * smoothedCamDist;
        _camTargetPos.set(desiredCamX, desiredCamY, desiredCamZ);
        camera.position.lerp(_camTargetPos, smoothCam.positionDampFactor);

        const shakeMag = cameraTrauma * cameraTrauma * 0.25;
        const shakeX = (Math.random() * 2 - 1) * shakeMag;
        const shakeY = (Math.random() * 2 - 1) * shakeMag;

        _camLookAt.set(
          smoothCam.pivotX + aim.dirX * 28 + shakeX,
          smoothCam.pivotY + aim.dirY * 28 + shakeY,
          smoothCam.pivotZ + aim.dirZ * 28
        );
        camera.lookAt(_camLookAt);
        const { right: camRightIn } = getWASDInputs();
        camRoll = THREE.MathUtils.damp(camRoll, -camRightIn * 0.022, 10, dt);
        camera.rotation.z += camRoll;

        if (now - lastHUDDispatch >= 80) {
          lastHUDDispatch = now;
          const { rival: lockedRival } = findBestCrosshairTarget();

          let lockedScreen: { x: number; y: number; visible: boolean } | null = null;
          if (lockedRival) {
            _projVec.set(lockedRival.x, lockedRival.y + (lockedRival.isBoss ? 2.6 : 1.85), lockedRival.z);
            _projVec.project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              lockedScreen = {
                x: ((_projVec.x + 1) / 2) * window.innerWidth,
                y: ((-_projVec.y + 1) / 2) * window.innerHeight,
                visible: true,
              };
            }
          }

          const floatingDamages: FloatingDamageHUDItem[] = [];
          for (const f of floatingDamagePool) {
            if (!f.active) continue;
            _projVec.set(f.worldX, f.worldY, f.worldZ);
            _projVec.project(camera);
            if (_projVec.z >= -1 && _projVec.z <= 1) {
              floatingDamages.push({
                id: f.id,
                x: ((_projVec.x + 1) / 2) * window.innerWidth,
                y: ((-_projVec.y + 1) / 2) * window.innerHeight,
                amount: f.amount,
                isCrit: f.isCrit,
                label: f.label,
                color: f.color,
                opacity: Math.min(1, f.life / (f.maxLife * 0.45)),
              });
            }
          }

          const hitArcs: DirectionalHitArcHUDItem[] = [];
          for (const a of hitArcPool) {
            if (!a.active) continue;
            const angleDeg = computeDirectionalDamageAngleDeg(
              player.x,
              player.z,
              player.camYaw,
              a.attackerX,
              a.attackerZ
            );
            hitArcs.push({
              id: a.id,
              angleDeg,
              opacity: Math.min(1, a.life / a.maxLife),
            });
          }

          const minimapActors: LiveHUDTelemetry['minimapActors'] = [
            { x: player.x, z: player.z, kind: 'player' },
          ];
          for (let i = 0; i < rivals.length; i++) {
            const r = rivals[i];
            if (r.koTimer === 0 && !r.eliminated) {
              minimapActors.push({ x: r.x, z: r.z, kind: r.isBoss ? 'boss' : 'rival' });
            }
          }
          for (let i = 0; i < lootChests.length; i++) {
            const c = lootChests[i];
            if (!c.opened) {
              minimapActors.push({ x: c.x, z: c.z, kind: 'chest' });
            }
          }
          for (const [, entry] of remoteRigs.entries()) {
            minimapActors.push({ x: entry.data.x, z: entry.data.z, kind: 'remote' });
          }

          const streakInfo = evaluateKillstreak(player.currentStreak);
          const stormTelemetry = computeSolarStormState(player.matchTime);
          const aliveRivalsNow = countAliveNonBossRivals();
          const playerElim = player.endingTriggered && player.pendingOutcome === 'defeat';
          const aliveTotalNow = (playerElim ? 0 : 1) + aliveRivalsNow;
          const playerRankNow = computeBattleRoyaleRank(aliveRivalsNow, playerElim);

          let lodNearCount = 0;
          let lodInstCount = 0;
          for (let i = 0; i < RIVAL_TEMPLATES.length; i++) {
            const rv = rivals[i];
            if (rv.koTimer === 0 && !rv.eliminated) {
              if (rv.rig) lodNearCount++;
              else lodInstCount++;
            }
          }

          const allContenders: BattleRoyaleContenderHUD[] = [
            {
              id: 'local-player',
              name: `YOU · ${HERO_CLASSES[heroClassRef.current].shortLabel}`,
              heroClass: heroClassRef.current,
              kills: player.kills,
              alive: !playerElim,
              isPlayer: true,
            },
          ];
          for (let i = 0; i < RIVAL_TEMPLATES.length; i++) {
            const rv = rivals[i];
            if (rv.kills > 0 || (rv.koTimer === 0 && !rv.eliminated && i < 12)) {
              allContenders.push({
                id: rv.id,
                name: rv.name,
                heroClass: rv.heroClass,
                kills: rv.kills,
                alive: rv.koTimer === 0 && !rv.eliminated,
                isPlayer: false,
              });
            }
          }
          allContenders.sort((a, b) => {
            if (b.kills !== a.kills) return b.kills - a.kills;
            if (a.isPlayer) return -1;
            if (b.isPlayer) return 1;
            return Number(b.alive) - Number(a.alive);
          });
          const topContenders = allContenders.slice(0, 5);
          if (!topContenders.some((c) => c.isPlayer)) {
            topContenders[4] = allContenders.find((c) => c.isPlayer)!;
          }

          onHUDUpdateRef.current({
            hp: Math.round(player.hp),
            maxHp: player.maxHp,
            ghostHp: Math.round(player.ghostHp),
            shield: Math.round(player.shield),
            maxShield: player.maxShield,
            activeWeaponSlot: player.activeWeaponSlot,
            magicShards: player.magicShards,
            forgeLevel: player.forgeLevel,
            drawCharge: player.drawCharge,
            isScoped: player.isScoped,
            isInspectingWeapon: player.weaponInspectTimer > 0,
            isPointerLocked: document.pointerLockElement === renderer.domElement,
            isCamouflaged: player.isCamouflaged,
            camouflageRemaining: player.camouflageTimer,
            isMounted: player.isMounted,
            isDownedScarab: player.isDownedScarab,
            isPropDisguised: player.isPropDisguised,
            scarabRemaining: player.scarabTimer,
            relicReady: player.relicReady,
            relicCooldown: player.relicCooldown,
            isHighGround: player.isHighGround,
            perchName: player.perchName,
            cooldowns: { ...player.cooldowns },
            kills: player.kills,
            targetKills: TARGET_KILLS_FOR_VICTORY,
            headshots: player.headshots,
            score: player.score,
            bestScore: player.bestScore,
            wave: player.wave,
            damageDealt: Math.round(player.damageDealt),
            matchTime: Math.round(player.matchTime),
            lastHitBanner: player.lastHitBanner,
            lockedTargetName: lockedRival ? lockedRival.name : null,
            lockedTargetHpRatio: lockedRival ? lockedRival.hp / lockedRival.maxHp : 0,
            lockedTargetScreen: lockedScreen,
            minimapActors,
            floatingDamages,
            hitArcs,
            killstreak: {
              count: player.currentStreak,
              best: player.bestStreak,
              timer: player.streakTimer,
              title: streakInfo.title,
              arabicTitle: streakInfo.arabicTitle,
            },
            bossStatus: {
              active: bossActor.koTimer === 0,
              name: bossActor.name,
              hp: Math.round(bossActor.hp),
              maxHp: bossActor.maxHp,
            },
            isSandboxMode: sandboxModeRef.current,
            sandboxZeroCooldown: player.sandboxZeroCooldown,
            analytics: {
              shotsFired: player.shotsFired,
              shotsHit: player.shotsHit,
              maxSingleDamage: Math.round(player.maxSingleDamage),
              bestStreak: player.bestStreak,
              bossesDefeated: player.bossesDefeated,
              chestsOpened: player.chestsOpened,
            },
            battleRoyale: {
              aliveCount: aliveTotalNow,
              totalCount: TOTAL_BR_COMBATANTS,
              playerRank: playerRankNow,
              stormPhase: stormTelemetry.phase,
              stormIsShrinking: stormTelemetry.isShrinking,
              stormTimer: stormTelemetry.phaseTimer,
              stormRadius: stormTelemetry.currentRadius,
              stormTargetRadius: stormTelemetry.targetRadius,
              stormDamagePerSec: stormTelemetry.damagePerSec,
              isOutsideStorm: Math.hypot(player.x, player.z) > stormTelemetry.currentRadius,
              lodNearRigCount: lodNearCount,
              lodInstancedCount: lodInstCount,
              topContenders,
            },
            diagnostics: (() => {
              let activeProjCount = 0;
              for (let i = 0; i < projectiles.length; i++) {
                if (projectiles[i].active) activeProjCount++;
              }
              const adaptive = computeAdaptiveQualityState(smoothedFrameTimeMs, isSoftwareGl);
              currentParticleMultiplier = adaptive.particleSpawnMultiplier;
              return evaluateEngineHealth({
                fps: smoothedFps,
                frameTimeMs: smoothedFrameTimeMs,
                drawCalls: lastDrawCalls,
                triangles: lastTriangles,
                geometries: renderer.info.memory.geometries,
                textures: renderer.info.memory.textures,
                lodNearRigCount: lodNearCount,
                lodInstancedCount: lodInstCount,
                activeProjectiles: activeProjCount,
                spatialGridCells: spatialGrid.activeCellCount,
                isSoftwareGl,
              });
            })(),
          });
        }
      }

      renderer.render(scene, camera);
      lastDrawCalls = renderer.info.render.calls;
      lastTriangles = renderer.info.render.triangles;

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    (window as unknown as Record<string, unknown>).render_game_to_text = () => {
      const aliveRivals = countAliveNonBossRivals();
      const storm = computeSolarStormState(player.matchTime);
      let nearRigs = 0;
      let instRigs = 0;
      for (let i = 0; i < RIVAL_TEMPLATES.length; i++) {
        const rv = rivals[i];
        if (rv.koTimer === 0 && !rv.eliminated) {
          if (rv.rig) nearRigs++;
          else instRigs++;
        }
      }
      const activeProjList = projectiles
        .filter((pr) => pr.active)
        .map((pr) => ({ kind: pr.visualKind, x: Number(pr.x.toFixed(1)), z: Number(pr.z.toFixed(1)) }));
      return JSON.stringify({
        mode: stateRef.current,
        heroClass: heroClassRef.current,
        activeWeaponSlot: player.activeWeaponSlot,
        activeWeaponName: HERO_CLASSES[heroClassRef.current].weapons[player.activeWeaponSlot].name,
        forgeLevel: player.forgeLevel,
        hp: Math.round(player.hp),
        shield: Math.round(player.shield),
        auraType: player.auraType,
        auraTimer: Number(player.auraTimer.toFixed(2)),
        totalCombatants: TOTAL_BR_COMBATANTS,
        aliveCount: aliveRivals + 1,
        playerRank: computeBattleRoyaleRank(aliveRivals, false),
        stormPhase: storm.phase,
        stormRadius: storm.currentRadius,
        lodNearRigCount: nearRigs,
        lodInstancedCount: instRigs,
        diagnostics: evaluateEngineHealth({
          fps: smoothedFps,
          frameTimeMs: smoothedFrameTimeMs,
          drawCalls: lastDrawCalls,
          triangles: lastTriangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          lodNearRigCount: nearRigs,
          lodInstancedCount: instRigs,
          activeProjectiles: activeProjList.length,
          spatialGridCells: spatialGrid.activeCellCount,
          isSoftwareGl,
        }),
        activeProjectiles: activeProjList,
        shotsFired: player.shotsFired,
        shotsHit: player.shotsHit,
        kills: player.kills,
      });
    };

    tick();

    return () => {
      isUnmounted = true;
      delete (window as unknown as Record<string, unknown>).render_game_to_text;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      mpClient.dispose();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', clearHeldInputs);
      disposeInstancedCombatantCrowd(instancedCrowd);
      disposeArenaSceneResources(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="arena-canvas-container"
      className="fixed inset-0 w-full h-full overflow-hidden bg-[#0d0906] cursor-crosshair"
    />
  );
};
