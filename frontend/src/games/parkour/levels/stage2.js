import {
  buildLedgeClimb,
  makeWalls,
  makeGround,
} from './builder.js'

// Midnight — a wider, brisker weave. Same forgiving hop height, but the columns
// spread out so traversal demands more committed jumps, with hazards to dodge.
const ledges = buildLedgeClimb({
  startY: 3760,
  endY: 200,
  rowGap: 78,
  columns: [480, 700, 920],
  ledgeWidth: 280,
})

export default {
  id: 'stage-2',
  name: 'Midnight Chasm',
  width: 1600,
  height: 4000,
  fallY: 4120,
  spawnPoints: {
    p1: { x: 680, y: 3840 },
    p2: { x: 740, y: 3840 },
  },
  checkpoints: [
    { id: 'cp-1', x: 540, y: 2800, width: 320, height: 56 },
    { id: 'cp-2', x: 540, y: 1400, width: 320, height: 56 },
  ],
  finishZone: { x: 560, y: 40, width: 480, height: 120 },
  platforms: [
    makeGround(1600, 3880),
    ...ledges,
    ...makeWalls(4000),
  ],
  movingPlatforms: [
    { id: 'moving-1', type: 'moving', passThrough: true, x: 620, y: 3100, width: 150, height: 24, axis: 'x', distance: 280, speed: 70, phase: 0 },
    { id: 'moving-2', type: 'moving', passThrough: true, x: 700, y: 1900, width: 160, height: 24, axis: 'y', distance: 180, speed: 55, phase: Math.PI },
  ],
  hazards: [
    { id: 'hazard-1', type: 'hazard', x: 300, y: 2480, width: 200, height: 30, damage: 'death' },
    { id: 'hazard-2', type: 'hazard', x: 900, y: 1080, width: 200, height: 30, damage: 'death' },
  ],
  background: { theme: 'midnight' },
}
