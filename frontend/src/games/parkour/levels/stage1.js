import {
  buildLedgeClimb,
  makeWalls,
  makeGround,
} from './builder.js'

// Greenfield — the gentle intro. Wide, overlapping ledges woven across three
// close columns so the path always flows upward with short, forgiving hops.
const ledges = buildLedgeClimb({
  startY: 3360,
  endY: 240,
  rowGap: 72, // 48px gap after the 24px ledge — well within jump reach
  columns: [560, 720, 880],
  ledgeWidth: 320,
})

export default {
  id: 'stage-1',
  name: 'Greenfield Climb',
  width: 1600,
  height: 3600,
  fallY: 3720,
  spawnPoints: {
    p1: { x: 700, y: 3440 },
    p2: { x: 760, y: 3440 },
  },
  checkpoints: [
    { id: 'cp-1', x: 560, y: 2400, width: 320, height: 56 },
    { id: 'cp-2', x: 560, y: 1176, width: 320, height: 56 },
  ],
  finishZone: { x: 560, y: 40, width: 480, height: 120 },
  platforms: [
    makeGround(1600, 3480),
    ...ledges,
    ...makeWalls(3600),
  ],
  movingPlatforms: [
    { id: 'moving-1', type: 'moving', passThrough: true, x: 660, y: 1620, width: 180, height: 24, axis: 'x', distance: 220, speed: 55, phase: 0 },
  ],
  hazards: [],
  background: { theme: 'greenfield' },
}
