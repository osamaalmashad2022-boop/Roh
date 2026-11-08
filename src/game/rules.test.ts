import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_CLASSES,
  HeroClassId,
  ARENA_RADIUS,
  TOTAL_BR_COMBATANTS,
  calculatePrecisionShotDamage,
  applyDamageWithScarabRelic,
  tickScarabRelic,
  computeEnemyPolicyIntent,
  findBestGrappleTarget,
  getEffectiveSurfaceHeight,
  computeCameraRelativeMovement,
  computeAimRayDirection,
  resolveObstacleCollision,
  checkProjectileObstacleHit,
  evaluateKillstreak,
  computeDirectionalDamageAngleDeg,
  evaluateCombatMedals,
  computeSolarStormState,
  generate100PlayerRoster,
  computeBattleRoyaleRank,
  isBattleRoyaleVictory,
  resolveSafeTeleportPosition,
  checkProjectile3DHit,
  selectBoundedAoETargets,
  computeRelicBonuses,
  computeArmorMitigatedDamage,
  cycleScarabPropDisguise,
  canRivalDetectDisguisedPlayer,
  formatPropDisguiseLabel,
  computeEffectivePlayerVitals,
  evaluateRivalTacticalUpgradeAndHeal,
  SANCTUARY_SHRINES,
  ALL_RELIC_IDS,
} from './rules';
import {
  auditAllHeroClassesAndBalance,
  computeStormAwareEnemyVelocity,
  evaluateEngineHealth,
  ArenaSpatialHashGrid,
  shouldUpdateRivalAISteering,
  computeSmoothThirdPersonCamera,
  CombatInputBuffer,
  computeAdaptiveQualityState,
  computeAISkirmishPacing,
} from './engine';

test('All 9 Ride Out Heroes classes (including Ragnar, Tesla, and Claudia) have unique occupational weapons and distinct Q/E/C/R skills', () => {
  const ranger = HERO_CLASSES.ranger;
  assert.equal(ranger.shortLabel, 'RANGER');
  assert.equal(ranger.primaryWeapon, 'Cross Longbow');
  assert.equal(ranger.secondaryWeapon, 'Chaser Bolt');
  assert.equal(ranger.weapons[1].burstCount, 1);
  assert.equal(ranger.weapons[2].burstCount, 3);
  assert.equal(ranger.abilities.q.name, 'Raven Shade');
  assert.equal(ranger.abilities.e.name, 'Dazing Arrow');
  assert.equal(ranger.abilities.c.name, 'Elvish Trap');
  assert.equal(ranger.abilities.r.name, 'Hunter Orb & Steady Aim');

  const ragnar = HERO_CLASSES.ragnar;
  assert.equal(ragnar.shortLabel, 'RAGNAR');
  assert.equal(ragnar.primaryWeapon, 'Spectral Cutlass');
  assert.equal(ragnar.secondaryWeapon, 'Naval Cannon');
  assert.equal(ragnar.weapons[2].appliesBurn, true);
  assert.ok((ragnar.weapons[2].explosiveRadius ?? 0) > 4);
  assert.equal(ragnar.abilities.q.name, 'Sea Ward · Bulwark Shield');
  assert.equal(ragnar.abilities.e.name, 'Corsair Surge');
  assert.equal(ragnar.abilities.c.name, 'Wave Vortex');
  assert.equal(ragnar.abilities.r.name, 'Ghost Fleet Broadside');

  const tesla = HERO_CLASSES.tesla;
  assert.equal(tesla.shortLabel, 'TESLA');
  assert.equal(tesla.primaryWeapon, 'Arc Coil Launcher');
  assert.equal(tesla.secondaryWeapon, 'EMP Pulse Cannon');
  assert.equal(tesla.abilities.q.name, 'Lightning Turret');

  const claudia = HERO_CLASSES.claudia;
  assert.equal(claudia.shortLabel, 'CLAUDIA');
  assert.equal(claudia.primaryWeapon, 'Glacial Scepter');
  assert.equal(claudia.secondaryWeapon, 'Frostbite Shards');
  assert.equal(claudia.abilities.q.name, 'Ice Block Sanctuary');

  const classIds = Object.keys(HERO_CLASSES) as HeroClassId[];
  assert.equal(classIds.length, 9);

  const qSkills = new Set(classIds.map((c) => HERO_CLASSES[c].abilities.q.name));
  const eSkills = new Set(classIds.map((c) => HERO_CLASSES[c].abilities.e.name));
  const cSkills = new Set(classIds.map((c) => HERO_CLASSES[c].abilities.c.name));
  const rSkills = new Set(classIds.map((c) => HERO_CLASSES[c].abilities.r.name));
  const primaryWeapons = new Set(classIds.map((c) => HERO_CLASSES[c].primaryWeapon));

  assert.equal(qSkills.size, 9, 'Every hero must have a distinct Q skill');
  assert.equal(eSkills.size, 9, 'Every hero must have a distinct E skill');
  assert.equal(cSkills.size, 9, 'Every hero must have a distinct C skill');
  assert.equal(rSkills.size, 9, 'Every hero must have a distinct R skill');
  assert.equal(primaryWeapons.size, 9, 'Every hero must have a distinct primary occupational weapon');
});

test('calculatePrecisionShotDamage scales with draw charge, Steady Aim scope, Raven Shade ambush, high ground, Hunter Orb mark, and Forge tier', () => {
  const baseShot = calculatePrecisionShotDamage({
    baseDamage: 34,
    drawCharge: 0,
    isScoped: false,
    isHeadshot: false,
    isCamouflagedAmbush: false,
    isHighGround: false,
    isTargetSnared: false,
  });
  assert.equal(baseShot.finalDamage, 22);
  assert.equal(baseShot.isCritical, false);

  const sniperAmbushCrit = calculatePrecisionShotDamage({
    baseDamage: 40,
    drawCharge: 1.0,
    isScoped: true,
    isHeadshot: true,
    isCamouflagedAmbush: true,
    isHighGround: true,
    isTargetSnared: true,
    forgeLevel: 2,
  });
  assert.ok(sniperAmbushCrit.finalDamage > 240);
  assert.equal(sniperAmbushCrit.isCritical, true);
  assert.ok(sniperAmbushCrit.tags.includes('RAVEN SHADE AMBUSH +60%'));
  assert.ok(sniperAmbushCrit.tags.includes('HIGH GROUND +20%'));
  assert.ok(sniperAmbushCrit.tags.includes('WEAK-POINT CRIT'));
});

test('Ride Out Heroes Baby Dragon Relic intercepts lethal damage (12s standard / 8.5s Ankh) and resurrects after timer', () => {
  const initial = {
    isDownedScarab: false,
    scarabTimer: 0,
    scarabMaxDuration: 12,
    relicReady: true,
    relicCooldown: 0,
    hp: 50,
    maxHp: 120,
    shield: 20,
    maxShield: 60,
  };

  const hitResult = applyDamageWithScarabRelic(initial, 90);
  assert.equal(hitResult.enteredScarab, true);
  assert.equal(hitResult.eliminated, false);
  assert.equal(hitResult.nextState.isDownedScarab, true);
  assert.equal(hitResult.nextState.scarabTimer, 12.0);
  assert.equal(hitResult.nextState.relicReady, false);

  const ankhHit = applyDamageWithScarabRelic(initial, 90, true);
  assert.equal(ankhHit.nextState.scarabTimer, 8.5);

  const reviveResult = tickScarabRelic(hitResult.nextState, 12.1);
  assert.equal(reviveResult.resurrected, true);
  assert.equal(reviveResult.nextState.isDownedScarab, false);
  assert.equal(reviveResult.nextState.hp, 78);
  assert.equal(reviveResult.nextState.shield, 36);
});

test('High-ground grapple finder selects vantage platform in aim direction', () => {
  const target = findBestGrappleTarget(0, 0, -0.7, -0.8);
  assert.equal(target.perchName, 'North Horus Vantage');
  const surface = getEffectiveSurfaceHeight(target.x, target.z, target.y + 0.5);
  assert.equal(surface.isHighGround, true);
});

test('4 Enemy AI policies produce genuinely distinct movement decisions at close range', () => {
  const kiter = computeEnemyPolicyIntent({
    policy: 'kiter_sniper',
    enemyX: 0,
    enemyZ: 0,
    targetX: 10,
    targetZ: 0,
    speed: 10,
    strafeSign: 1,
    attackCooldown: 0,
    canAcquireAttackToken: true,
  });

  const charger = computeEnemyPolicyIntent({
    policy: 'charger_vanguard',
    enemyX: 0,
    enemyZ: 0,
    targetX: 10,
    targetZ: 0,
    speed: 10,
    strafeSign: 1,
    attackCooldown: 0,
    canAcquireAttackToken: true,
  });

  assert.ok(kiter.vx < 0, 'Kiter should back away when target is closer than 16m');
  assert.ok(charger.vx > 0, 'Charger should rush toward target');
});

test('Camera-relative WASD movement and 3D aim direction align with camera yaw and pitch', () => {
  const moveNorth = computeCameraRelativeMovement(1, 0, Math.PI);
  assert.equal(moveNorth.isMoving, true);
  assert.ok(Math.abs(moveNorth.moveDirX) < 1e-6);
  assert.ok(moveNorth.moveDirZ < -0.99);

  const strafeEast = computeCameraRelativeMovement(0, 1, Math.PI);
  assert.ok(strafeEast.moveDirX > 0.99);
  assert.ok(Math.abs(strafeEast.moveDirZ) < 1e-6);

  const aimUp = computeAimRayDirection(Math.PI, 0.35);
  assert.ok(aimUp.dirY > 0.3);
  assert.ok(aimUp.dirZ < -0.9);
});

test('Obstacle collision pushes ground actors outside Obelisk bases and blocks projectiles', () => {
  // Obelisk of Thoth is at (-32, -32) with radius 2.4
  const col = resolveObstacleCollision(-32.2, -32.0, 0.5, 0.75);
  assert.equal(col.collided, true);
  assert.ok(Math.hypot(col.x - -32, col.z - -32) > 2.9);

  // Projectile inside Obelisk of Thoth hits obstacle
  const projHit = checkProjectileObstacleHit(-32, 3.0, -32);
  assert.equal(projHit.hit, true);
  assert.equal(projHit.obstacleName, 'Obelisk of Thoth');

  // Projectile in open center misses obstacles
  const projOpen = checkProjectileObstacleHit(0, 2.0, 0);
  assert.equal(projOpen.hit, false);
});

test('Killstreak progression, directional hit angle, and combat medals evaluate accurately', () => {
  const doubleInfo = evaluateKillstreak(2);
  assert.equal(doubleInfo.announcerCue, 'double');
  assert.ok(doubleInfo.damageBonusRatio > 0);

  const rampageInfo = evaluateKillstreak(5);
  assert.equal(rampageInfo.announcerCue, 'rampage');
  assert.ok(rampageInfo.speedBonusRatio >= 0.18);

  // Player at (0,0) looking toward +Z (camYaw = 0); attacker directly ahead at (0, 10) -> 0 deg
  const aheadDeg = computeDirectionalDamageAngleDeg(0, 0, 0, 0, 10);
  assert.ok(Math.abs(aheadDeg) < 1e-4);

  const medals = evaluateCombatMedals({
    kills: 8,
    headshots: 4,
    shotsFired: 10,
    shotsHit: 7,
    maxSingleDamage: 120,
    bestStreak: 4,
    forgeLevel: 3,
    bossesDefeated: 1,
    chestsOpened: 2,
    placementRank: 1,
  });
  assert.equal(medals.length, 7);
});

test('100-Player Battle Royale roster generator and 5-phase Solar Sandstorm shrink accurately', () => {
  assert.equal(TOTAL_BR_COMBATANTS, 100);
  assert.equal(ARENA_RADIUS, 135);

  const roster = generate100PlayerRoster();
  assert.equal(roster.length, 99, 'Should generate 99 rival Outriders to join the 1 player = 100 total');

  const classesInRoster = new Set(roster.map((r) => r.heroClass));
  assert.equal(classesInRoster.size, 9, 'All 9 hero classes must be represented in the 100-player roster');

  for (const r of roster) {
    const dist = Math.hypot(r.spawnX, r.spawnZ);
    assert.ok(dist <= ARENA_RADIUS - 2, `Rival ${r.id} spawned within arena bounds`);
  }

  // Storm state at t = 0s (Phase 1 waiting at 130m)
  const s0 = computeSolarStormState(0);
  assert.equal(s0.phase, 1);
  assert.equal(s0.isShrinking, false);
  assert.equal(s0.currentRadius, 130);
  assert.equal(s0.targetRadius, 95);

  // Storm state at t = 25s (Phase 1 shrinking midway between 130m and 95m)
  const s25 = computeSolarStormState(25);
  assert.equal(s25.phase, 1);
  assert.equal(s25.isShrinking, true);
  assert.ok(s25.currentRadius < 130 && s25.currentRadius > 95);

  // Storm state at t = 250s (Final Sanctum Showdown at 10m)
  const sFinal = computeSolarStormState(250);
  assert.equal(sFinal.phase, 5);
  assert.equal(sFinal.currentRadius, 10);
  assert.equal(sFinal.damagePerSec, 35);

  assert.equal(computeBattleRoyaleRank(99, false), 100);
  assert.equal(computeBattleRoyaleRank(0, false), 1);
});

test('Full 9-Class, 18-Weapon, and 36-Skill combat balance audit passes with zero schema or DPS issues', () => {
  const report = auditAllHeroClassesAndBalance();
  assert.equal(report.valid, true, `Balance audit issues: ${report.issues.join(', ')}`);
  assert.equal(report.classCount, 9);
  assert.equal(report.weaponCount, 18);
  assert.equal(report.skillCount, 36);
  assert.equal(report.arenaRadius, 135);
  assert.equal(report.landmarkCount, 17, 'Arena should include all 17 inner and outer Battle Royale landmarks');

  // Verify Ragnar, Tesla, Claudia, and Robin have well-balanced survivability and high-ceiling precision damage
  assert.ok(report.metrics.ragnar.survivabilityPool >= 220);
  assert.ok(report.metrics.tesla.survivabilityPool >= 175);
  assert.ok(report.metrics.claudia.survivabilityPool >= 175);
  assert.ok(report.metrics.ranger.slot1MaxChargedHeadshot >= 110);
});

test('Storm-Aware Tactical AI steers rivals inward when outside the shrinking Solar Sandstorm and avoids obstacles', () => {
  // Rival at (110, 0) when stormRadius has shrunk to 68m -> must actively evade toward center (-X)
  const outsideStorm = computeStormAwareEnemyVelocity({
    policy: 'kiter_sniper',
    enemyX: 110,
    enemyZ: 0,
    targetX: 118, // even if target is further out, storm survival takes priority
    targetZ: 0,
    baseSpeed: 8.0,
    strafeSign: 1,
    stormRadius: 68,
    stormTargetRadius: 44,
  });
  assert.equal(outsideStorm.isEvadingStorm, true);
  assert.ok(outsideStorm.vx < -4.0, 'Rival outside storm must steer strongly inward toward sanctuary center');

  // Rival well inside safe zone at (10, 0) when stormRadius is 130m -> normal combat policy applies
  const insideStorm = computeStormAwareEnemyVelocity({
    policy: 'charger_vanguard',
    enemyX: 10,
    enemyZ: 0,
    targetX: 25,
    targetZ: 0,
    baseSpeed: 8.0,
    strafeSign: 1,
    stormRadius: 130,
    stormTargetRadius: 95,
  });
  assert.equal(insideStorm.isEvadingStorm, false);
  assert.ok(insideStorm.vx > 0, 'Charger inside safe zone pursues target normally');
});

test('Engine Self-Diagnostics evaluator verifies zero-leak GPU resource bounds and 60 FPS LOD distribution', () => {
  const healthy = evaluateEngineHealth({
    fps: 60,
    frameTimeMs: 16.4,
    drawCalls: 142,
    triangles: 28400,
    geometries: 410,
    textures: 8,
    lodNearRigCount: 14,
    lodInstancedCount: 85,
    activeProjectiles: 6,
  });
  assert.equal(healthy.memoryHealthStatus, 'OPTIMAL');
  assert.equal(healthy.zeroLeakVerified, true);
  assert.equal(healthy.lodNearRigCount + healthy.lodInstancedCount, 99);
});

test('Regression: 100-Player Battle Royale victory requires eliminating all 99 rivals, safe teleport avoids Obelisks, 3D hitbox respects elevation, and AoE skills cap VFX pools', () => {
  // 1. Victory only triggers when 0 rivals remain (not at 10 kills with 75 rivals remaining)
  assert.equal(isBattleRoyaleVictory(75, false, false), false);
  assert.equal(isBattleRoyaleVictory(0, false, false), true);
  assert.equal(isBattleRoyaleVictory(0, true, false), false);
  assert.equal(isBattleRoyaleVictory(0, false, true), false);

  // 2. Teleport/Blink directly into Obelisk of Thoth (-32, -32) pushes player safely outside the stone pillar
  const safeTp = resolveSafeTeleportPosition(-32.0, -32.0, 0.5, 0.75);
  assert.equal(safeTp.collided, true);
  assert.ok(Math.hypot(safeTp.x - -32, safeTp.z - -32) >= 2.95, 'Teleport must not clip inside Obelisk');

  // 3. 3D Projectile hitbox: projectile flying high on a perch (y = 5.5) does NOT hit a rival on the ground below (y = 0)
  const missOverGroundTarget = checkProjectile3DHit({
    projX: 10,
    projY: 5.5,
    projZ: 10,
    targetX: 10,
    targetY: 0,
    targetZ: 10,
  });
  assert.equal(missOverGroundTarget.hit, false);

  // Direct headshot at y = 1.75 on ground rival (y = 0) registers hit + headshot
  const directHeadshot = checkProjectile3DHit({
    projX: 10,
    projY: 1.75,
    projZ: 10,
    targetX: 10,
    targetY: 0,
    targetZ: 10,
  });
  assert.equal(directHeadshot.hit, true);
  assert.equal(directHeadshot.isHeadshot, true);

  // 4. Bounded AoE target selector filters by 38m radius and caps VFX targets to 6
  const mockRivals = Array.from({ length: 40 }, (_, idx) => ({
    id: `r-${idx}`,
    x: idx * 2, // 0m, 2m, 4m ... 78m
    z: 0,
    koTimer: 0,
    eliminated: false,
  }));
  const aoe = selectBoundedAoETargets(0, 0, mockRivals, 38, 6);
  assert.equal(aoe.affected.length, 20, 'Only rivals within 0..38m should be affected');
  assert.equal(aoe.vfxTargets.length, 6, 'Heavy 3D VFX bursts must be capped at 6 closest targets');
  assert.equal(aoe.vfxTargets[0].id, 'r-0');
});

test('Zero-GC ArenaSpatialHashGrid performs O(1) cell queries and Distance-Based AI Tick Slicing schedules 60Hz/20Hz updates', () => {
  const grid = new ArenaSpatialHashGrid();
  const scratch: number[] = [];

  grid.clear();
  grid.insert(0, 5, 5);
  grid.insert(1, 8, 6);
  grid.insert(2, -95, 80); // far away cell

  assert.equal(grid.activeCellCount, 2, 'Two distinct spatial cells should be populated');

  const nearIndices = grid.queryRadius(6, 5, 4, scratch);
  assert.equal(nearIndices.length, 2);
  assert.ok(nearIndices.includes(0) && nearIndices.includes(1));
  assert.ok(!nearIndices.includes(2));

  // Verify AI Tick Slicing: rivals within 58m (distSq <= 3364) update every frame (60Hz)
  assert.equal(shouldUpdateRivalAISteering(0, 25 * 25, 1), true);
  assert.equal(shouldUpdateRivalAISteering(1, 25 * 25, 1), true);
  assert.equal(shouldUpdateRivalAISteering(2, 25 * 25, 1), true);

  // Rivals beyond 58m (e.g., 90m -> distSq = 8100) update on staggered 20Hz ticks (rIdx % 3 === frameTick % 3)
  assert.equal(shouldUpdateRivalAISteering(4, 90 * 90, 1), true); // 4 % 3 === 1 % 3
  assert.equal(shouldUpdateRivalAISteering(5, 90 * 90, 1), false);
});

test('AAA Spring-Damper Camera, 160ms CombatInputBuffer, and Adaptive Quality Scaler operate smoothly', () => {
  // 1. Spring-Damper Camera pulls in smoothly when rawObstacleHitDist is closer than idealDist
  const camBlocked = computeSmoothThirdPersonCamera({
    playerX: 0,
    playerVisualY: 0,
    playerZ: 18,
    playerVx: 8,
    playerVz: 0,
    camYaw: Math.PI,
    camPitch: 0,
    isScoped: false,
    isMounted: false,
    isDashing: false,
    prevSmoothedDist: 7.8,
    rawObstacleHitDist: 3.2,
    dt: 0.016,
  });
  assert.ok(camBlocked.smoothedDist < 7.8, 'Camera distance should pull inward when an obstacle is hit');
  assert.ok(camBlocked.lookAheadX > 0, 'Velocity look-ahead should shift camera pivot slightly toward +X movement');

  // 2. CombatInputBuffer queues ability/dash/fire within 160ms and expires stale inputs
  const buffer = new CombatInputBuffer();
  buffer.enqueueAbility('q', 1000);
  assert.equal(buffer.consumeAbility('e', 1050), false);
  assert.equal(buffer.consumeAbility('q', 1120), true, 'Buffered Q within 160ms should execute');
  assert.equal(buffer.consumeAbility('q', 1130), false, 'Consumed Q should be cleared');

  buffer.enqueueDash(1000);
  assert.equal(buffer.consumeDash(1200), false, 'Dash older than 160ms should expire');

  buffer.enqueueFire(1000);
  assert.equal(buffer.consumeFire(1140), true, 'Buffered Fire within 160ms should execute');

  // 3. Adaptive Quality Scaler maintains 100% stability at 16.4ms and scales particles under heavy load
  const optimalQ = computeAdaptiveQualityState(16.4, false);
  assert.equal(optimalQ.frameStabilityPct, 100);
  assert.equal(optimalQ.qualityScale, 1.0);
  assert.equal(optimalQ.particleSpawnMultiplier, 1.0);

  const heavyLoadQ = computeAdaptiveQualityState(29.0, false);
  assert.ok(heavyLoadQ.qualityScale < 1.0);
  assert.ok(heavyLoadQ.particleSpawnMultiplier < 0.75);
});

test('100-Player Battle Royale AI-vs-AI skirmish pacer prevents early lobby wipeout and protects top-5 finale', () => {
  // 1. Opening 5s grace window prevents early spawn damage
  const grace = computeAISkirmishPacing({
    matchTimeSec: 2.5,
    aliveRivalsCount: 99,
    targetCurrentHp: 185,
    rawDamage: 20,
    aiEliminationCooldownSec: 0,
  });
  assert.equal(grace.nextTargetHp, 185);
  assert.equal(grace.eliminated, false);

  // 2. When aiEliminationCooldownSec > 0, lethal AI-vs-AI hit leaves rival at 22 HP instead of instant wipeout
  const throttledKill = computeAISkirmishPacing({
    matchTimeSec: 30,
    aliveRivalsCount: 70,
    targetCurrentHp: 12,
    rawDamage: 18,
    aiEliminationCooldownSec: 1.5,
  });
  assert.equal(throttledKill.eliminated, false);
  assert.equal(throttledKill.nextTargetHp, 22);

  // 3. When aiEliminationCooldownSec === 0 and > 5 rivals remain, lethal hit eliminates and sets 2.4s+ global cooldown
  const validKill = computeAISkirmishPacing({
    matchTimeSec: 30,
    aliveRivalsCount: 70,
    targetCurrentHp: 12,
    rawDamage: 18,
    aiEliminationCooldownSec: 0,
  });
  assert.equal(validKill.eliminated, true);
  assert.equal(validKill.nextTargetHp, 0);
  assert.ok(validKill.nextEliminationCooldownSec >= 2.4);

  // 4. Final 5 rivals never get eliminated off-screen by AI-vs-AI so the player decides the finale
  const finaleProtection = computeAISkirmishPacing({
    matchTimeSec: 180,
    aliveRivalsCount: 4,
    targetCurrentHp: 10,
    rawDamage: 20,
    aiEliminationCooldownSec: 0,
  });
  assert.equal(finaleProtection.eliminated, false);
  assert.equal(finaleProtection.nextTargetHp, 22);
});

test('Ride Out Heroes Relics, 4-Tier Armor mitigation, Sanctuary Shrines, and Multi-Prop Disguise Stealth work accurately', () => {
  // 1. 6-Slot Relics aggregate bonuses cleanly
  assert.equal(ALL_RELIC_IDS.length, 6);
  assert.equal(SANCTUARY_SHRINES.length, 4);
  const fullBonuses = computeRelicBonuses(ALL_RELIC_IDS);
  assert.equal(fullBonuses.speedMultiplier, 1.12);
  assert.equal(fullBonuses.cooldownMultiplier, 0.82);
  assert.equal(fullBonuses.damageMultiplier, 1.16);
  assert.equal(fullBonuses.hasAnkhFastRevive, true);
  assert.equal(fullBonuses.bonusMaxHp, 30);
  assert.equal(fullBonuses.bonusMaxShield, 35);
  assert.equal(fullBonuses.lifestealRatio, 0.15);

  // 2. 4-Tier Armor mitigates incoming damage (Lv1: 5%, Lv2: 12%, Lv3: 20%, Lv4: 28%)
  assert.equal(computeArmorMitigatedDamage(100, 1), 95);
  assert.equal(computeArmorMitigatedDamage(100, 2), 88);
  assert.equal(computeArmorMitigatedDamage(100, 3), 80);
  assert.equal(computeArmorMitigatedDamage(100, 4), 72);

  // 3. Multi-Prop Scarab Disguise cycles through Amphora -> Boulder -> Obelisk -> None and reduces AI detection radius to 3.5m
  const p1 = cycleScarabPropDisguise('none');
  const p2 = cycleScarabPropDisguise(p1);
  const p3 = cycleScarabPropDisguise(p2);
  const p4 = cycleScarabPropDisguise(p3);
  assert.equal(p1, 'amphora');
  assert.equal(p2, 'boulder');
  assert.equal(p3, 'obelisk');
  assert.equal(p4, 'none');

  assert.equal(canRivalDetectDisguisedPlayer(15, true, 'none'), true);
  assert.equal(canRivalDetectDisguisedPlayer(15, true, 'amphora'), false);
  assert.equal(canRivalDetectDisguisedPlayer(3.2, true, 'amphora'), true);
});

test('Codebase Audit Fixes: Prop Disguise HUD labels, Mid-Match Class Switch Vitals Preservation, Tactical Rival AI Potions/Armor, and Center Dais AI Pathing', () => {
  // 1. Dynamic Prop Disguise HUD Labels
  assert.equal(formatPropDisguiseLabel('amphora'), 'AMPHORA URN');
  assert.equal(formatPropDisguiseLabel('boulder'), 'SANDSTONE BOULDER');
  assert.equal(formatPropDisguiseLabel('obelisk'), 'MINI-OBELISK');
  assert.equal(formatPropDisguiseLabel('none'), 'NONE');

  // 2. Mid-Match Class Switch preserves Armor Tier Lv4 (+90 Shield) and Relic bonuses (+30 HP, +35 Shield)
  const teslaVitals = computeEffectivePlayerVitals('tesla', 4, ALL_RELIC_IDS);
  assert.equal(teslaVitals.maxHp, HERO_CLASSES.tesla.maxHp + 30);
  assert.equal(teslaVitals.maxShield, HERO_CLASSES.tesla.maxShield + 90 + 35);

  const claudiaVitals = computeEffectivePlayerVitals('claudia', 4, ALL_RELIC_IDS);
  assert.equal(claudiaVitals.maxHp, HERO_CLASSES.claudia.maxHp + 30);
  assert.equal(claudiaVitals.maxShield, HERO_CLASSES.claudia.maxShield + 90 + 35);

  // 3. Tactical Rival AI upgrades armor tier with storm phase/kills and drinks emergency potion when <= 42% HP
  const aiUpgradedAndHealed = evaluateRivalTacticalUpgradeAndHeal({
    currentHp: 60,
    maxHp: 180,
    currentArmorTier: 1,
    kills: 2,
    stormPhase: 3,
    potionCooldownSec: 0,
  });
  assert.equal(aiUpgradedAndHealed.upgradedArmor, true);
  assert.equal(aiUpgradedAndHealed.nextArmorTier, 4);
  assert.equal(aiUpgradedAndHealed.usedPotion, true);
  assert.equal(aiUpgradedAndHealed.nextHp, 105, 'AI should gain +45 emergency potion heal');
  assert.equal(aiUpgradedAndHealed.nextPotionCooldownSec, 18.0);

  // 4. Center Sanctuary Forge Dais ('dais-center') does NOT repel AI moving across the center (x = -5 -> target x = +5)
  const crossCenterDais = computeStormAwareEnemyVelocity({
    policy: 'charger_vanguard',
    enemyX: -5,
    enemyZ: 0,
    targetX: 5,
    targetZ: 0,
    baseSpeed: 8.0,
    strafeSign: 1,
    stormRadius: 130,
    stormTargetRadius: 95,
  });
  assert.ok(crossCenterDais.vx > 7.5, 'AI on center Sanctuary Forge Dais should move directly toward target without repulsion');
});

