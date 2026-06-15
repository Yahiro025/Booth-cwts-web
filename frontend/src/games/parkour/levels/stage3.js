import {
  buildLedgeClimb,
  crumbleEvery,
  makeWalls,
  makeGround,
} from './builder.js'

// Summit — the gauntlet. The same close weave, but every few rows crumbles
// underfoot, with moving platforms and hazards layered on top.
const ledges = crumbleEvery(
  buildLedgeClimb({
    startY: 4260,
    endY: 200,
    rowGap: 80,
    columns: [460, 700, 940],
    ledgeWidth: 260,
  }),
  { pickEvery: 4, keepEnds: 4, crumbleAfterMs: 600, respawnAfterMs: 2200 }
)

export default {
  id: 'stage-3',
  name: 'Summit Rush',
  width: 1600,
  height: 4500,
  fallY: 4620,
  spawnPoints: {
    p1: { x: 700, y: 4340 },
    p2: { x: 760, y: 4340 },
  },
  checkpoints: [
    { id: 'cp-1', x: 540, y: 3500, width: 320, height: 56 },
    { id: 'cp-2', x: 540, y: 2300, width: 320, height: 56 },
    { id: 'cp-3', x: 540, y: 1100, width: 320, height: 56 },
  ],
  finishZone: { x: 560, y: 40, width: 480, height: 120 },
  platforms: [
    makeGround(1600, 4380),
    ...ledges,
    ...makeWalls(4500),
  ],
  movingPlatforms: [
    { id: 'moving-1', type: 'moving', passThrough: true, x: 620, y: 3000, width: 140, height: 24, axis: 'x', distance: 300, speed: 85, phase: 0 },
    { id: 'moving-2', type: 'moving', passThrough: true, x: 700, y: 1700, width: 150, height: 24, axis: 'y', distance: 180, speed: 65, phase: Math.PI },
  ],
  hazards: [
    { id: 'hazard-1', type: 'hazard', x: 300, y: 3400, width: 200, height: 30, damage: 'death' },
    { id: 'hazard-2', type: 'hazard', x: 900, y: 2300, width: 200, height: 30, damage: 'death' },
    { id: 'hazard-3', type: 'hazard', x: 300, y: 1200, width: 200, height: 30, damage: 'death' },
  ],
  background: { theme: 'summit' },
}
