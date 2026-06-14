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
    { id: 'cp-1', x: 640, y: 3000, width: 280, height: 40 },
    { id: 'cp-2', x: 600, y: 2000, width: 240, height: 40 },
  ],
  finishZone: { x: 560, y: 40, width: 480, height: 120 },
  platforms: [
    // Ground (top at y=3880, player stands at y=3840)
    { id: 'ground', type: 'solid', x: 0, y: 3880, width: 1600, height: 120 },
    // Ascending platforms — slightly wider gaps than stage 1
    { id: 'ledge-1', type: 'solid', x: 200, y: 3760, width: 240, height: 24 },
    { id: 'ledge-2', type: 'solid', x: 700, y: 3660, width: 220, height: 24 },
    { id: 'ledge-3', type: 'solid', x: 350, y: 3560, width: 240, height: 24 },
    { id: 'ledge-4', type: 'solid', x: 700, y: 3460, width: 240, height: 24 },
    { id: 'ledge-5', type: 'solid', x: 300, y: 3360, width: 240, height: 24 },
    { id: 'ledge-6', type: 'solid', x: 650, y: 3260, width: 240, height: 24 },
    // Moving platform zone 1 — some ledges are replaced by moving platforms below
    { id: 'ledge-7', type: 'solid', x: 300, y: 3160, width: 240, height: 24 },
    { id: 'ledge-8', type: 'solid', x: 640, y: 3080, width: 280, height: 24 },
    // cp-1 checkpoint
    { id: 'ledge-9', type: 'solid', x: 250, y: 2960, width: 240, height: 24 },
    // Hazard zone
    { id: 'ledge-10', type: 'solid', x: 650, y: 2860, width: 240, height: 24 },
    { id: 'ledge-11', type: 'solid', x: 300, y: 2760, width: 220, height: 24 },
    { id: 'ledge-12', type: 'solid', x: 600, y: 2660, width: 240, height: 24 },
    { id: 'ledge-13', type: 'solid', x: 300, y: 2560, width: 220, height: 24 },
    // Moving platform zone 2
    { id: 'ledge-14', type: 'solid', x: 600, y: 2460, width: 240, height: 24 },
    { id: 'ledge-15', type: 'solid', x: 300, y: 2360, width: 240, height: 24 },
    // cp-2 checkpoint area
    { id: 'ledge-16', type: 'solid', x: 600, y: 2260, width: 260, height: 24 },
    // Upper section — longer gaps up to 100px vertical
    { id: 'ledge-17', type: 'solid', x: 300, y: 2150, width: 240, height: 24 },
    { id: 'ledge-18', type: 'solid', x: 650, y: 2050, width: 240, height: 24 },
    { id: 'ledge-19', type: 'solid', x: 300, y: 1950, width: 240, height: 24 },
    { id: 'ledge-20', type: 'solid', x: 650, y: 1850, width: 240, height: 24 },
    { id: 'ledge-21', type: 'solid', x: 350, y: 1750, width: 240, height: 24 },
    { id: 'ledge-22', type: 'solid', x: 650, y: 1650, width: 240, height: 24 },
    { id: 'ledge-23', type: 'solid', x: 350, y: 1550, width: 240, height: 24 },
    { id: 'ledge-24', type: 'solid', x: 650, y: 1450, width: 260, height: 24 },
    { id: 'ledge-25', type: 'solid', x: 350, y: 1350, width: 240, height: 24 },
    { id: 'ledge-26', type: 'solid', x: 650, y: 1250, width: 240, height: 24 },
    { id: 'ledge-27', type: 'solid', x: 350, y: 1150, width: 240, height: 24 },
    { id: 'ledge-28', type: 'solid', x: 650, y: 1050, width: 240, height: 24 },
    { id: 'ledge-29', type: 'solid', x: 400, y: 950, width: 260, height: 24 },
    { id: 'ledge-30', type: 'solid', x: 650, y: 850, width: 260, height: 24 },
    { id: 'ledge-31', type: 'solid', x: 400, y: 750, width: 240, height: 24 },
    { id: 'ledge-32', type: 'solid', x: 650, y: 650, width: 260, height: 24 },
    { id: 'ledge-33', type: 'solid', x: 400, y: 550, width: 240, height: 24 },
    { id: 'ledge-34', type: 'solid', x: 650, y: 450, width: 260, height: 24 },
    // Final approach
    { id: 'ledge-35', type: 'solid', x: 400, y: 350, width: 260, height: 24 },
    { id: 'ledge-36', type: 'solid', x: 560, y: 250, width: 480, height: 24 },
    { id: 'ledge-37', type: 'solid', x: 560, y: 150, width: 480, height: 24 },
    // Walls
    { id: 'left-wall', type: 'solid', x: 0, y: 0, width: 40, height: 4000 },
    { id: 'right-wall', type: 'solid', x: 1560, y: 0, width: 40, height: 4000 },
  ],
  movingPlatforms: [
    { id: 'moving-1', type: 'moving', x: 450, y: 3360, width: 120, height: 24, axis: 'x', distance: 300, speed: 80, phase: 0 },
    { id: 'moving-2', type: 'moving', x: 450, y: 2560, width: 140, height: 24, axis: 'y', distance: 200, speed: 60, phase: Math.PI },
  ],
  hazards: [
    { id: 'hazard-1', type: 'hazard', x: 250, y: 2910, width: 180, height: 32, damage: 'death' },
    { id: 'hazard-2', type: 'hazard', x: 700, y: 1910, width: 180, height: 32, damage: 'death' },
  ],
  background: { theme: 'midnight' },
}
