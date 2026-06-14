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
    { id: 'cp-1', x: 650, y: 3500, width: 300, height: 40 },
    { id: 'cp-2', x: 600, y: 2500, width: 280, height: 40 },
    { id: 'cp-3', x: 680, y: 1500, width: 240, height: 40 },
  ],
  finishZone: { x: 560, y: 40, width: 480, height: 120 },
  platforms: [
    // Ground (top at y=4380, player stands at y=4340)
    { id: 'ground', type: 'solid', x: 0, y: 4380, width: 1600, height: 120 },
    // Ascending platforms — tight vertical gaps, some crumbling
    { id: 'ledge-1', type: 'solid', x: 200, y: 4260, width: 240, height: 24 },
    { id: 'ledge-2', type: 'solid', x: 700, y: 4180, width: 220, height: 24 },
    { id: 'ledge-3', type: 'solid', x: 350, y: 4100, width: 240, height: 24 },
    { id: 'ledge-4', type: 'solid', x: 700, y: 4020, width: 240, height: 24 },
    // First crumbling platforms section
    { id: 'crumble-1', type: 'crumbling', x: 350, y: 3940, width: 200, height: 24, crumbleAfterMs: 800, respawnAfterMs: 3000 },
    { id: 'ledge-5', type: 'solid', x: 650, y: 3860, width: 240, height: 24 },
    { id: 'crumble-2', type: 'crumbling', x: 300, y: 3780, width: 200, height: 24, crumbleAfterMs: 600, respawnAfterMs: 2500 },
    { id: 'ledge-6', type: 'solid', x: 650, y: 3700, width: 240, height: 24 },
    // cp-1 checkpoint
    { id: 'ledge-7', type: 'solid', x: 650, y: 3600, width: 300, height: 24 },
    // Hazard zone with crumbling escape route
    { id: 'ledge-8', type: 'solid', x: 300, y: 3480, width: 240, height: 24 },
    { id: 'crumble-3', type: 'crumbling', x: 600, y: 3400, width: 200, height: 24, crumbleAfterMs: 500, respawnAfterMs: 2000 },
    { id: 'ledge-9', type: 'solid', x: 300, y: 3320, width: 240, height: 24 },
    { id: 'ledge-10', type: 'solid', x: 650, y: 3240, width: 240, height: 24 },
    { id: 'crumble-4', type: 'crumbling', x: 300, y: 3160, width: 200, height: 24, crumbleAfterMs: 700, respawnAfterMs: 2500 },
    { id: 'ledge-11', type: 'solid', x: 600, y: 3080, width: 240, height: 24 },
    // cp-2 checkpoint area
    { id: 'ledge-12', type: 'solid', x: 600, y: 2980, width: 280, height: 24 },
    // Moving platform section
    { id: 'ledge-13', type: 'solid', x: 300, y: 2880, width: 240, height: 24 },
    { id: 'ledge-14', type: 'solid', x: 650, y: 2780, width: 240, height: 24 },
    { id: 'crumble-5', type: 'crumbling', x: 350, y: 2680, width: 200, height: 24, crumbleAfterMs: 600, respawnAfterMs: 2000 },
    { id: 'ledge-15', type: 'solid', x: 650, y: 2580, width: 240, height: 24 },
    // cp-3 checkpoint area
    { id: 'ledge-16', type: 'solid', x: 680, y: 2480, width: 280, height: 24 },
    // Upper section — mixed solid and crumbling
    { id: 'ledge-17', type: 'solid', x: 350, y: 2380, width: 240, height: 24 },
    { id: 'crumble-6', type: 'crumbling', x: 650, y: 2280, width: 200, height: 24, crumbleAfterMs: 500, respawnAfterMs: 2000 },
    { id: 'ledge-18', type: 'solid', x: 350, y: 2180, width: 240, height: 24 },
    { id: 'ledge-19', type: 'solid', x: 650, y: 2080, width: 240, height: 24 },
    { id: 'crumble-7', type: 'crumbling', x: 350, y: 1980, width: 200, height: 24, crumbleAfterMs: 700, respawnAfterMs: 2500 },
    { id: 'ledge-20', type: 'solid', x: 650, y: 1880, width: 240, height: 24 },
    { id: 'ledge-21', type: 'solid', x: 350, y: 1780, width: 240, height: 24 },
    { id: 'crumble-8', type: 'crumbling', x: 650, y: 1680, width: 200, height: 24, crumbleAfterMs: 600, respawnAfterMs: 2000 },
    { id: 'ledge-22', type: 'solid', x: 350, y: 1580, width: 260, height: 24 },
    { id: 'ledge-23', type: 'solid', x: 650, y: 1480, width: 260, height: 24 },
    { id: 'crumble-9', type: 'crumbling', x: 350, y: 1380, width: 220, height: 24, crumbleAfterMs: 500, respawnAfterMs: 2000 },
    { id: 'ledge-24', type: 'solid', x: 650, y: 1280, width: 260, height: 24 },
    { id: 'ledge-25', type: 'solid', x: 350, y: 1180, width: 240, height: 24 },
    { id: 'ledge-26', type: 'solid', x: 650, y: 1080, width: 240, height: 24 },
    { id: 'crumble-10', type: 'crumbling', x: 400, y: 980, width: 220, height: 24, crumbleAfterMs: 400, respawnAfterMs: 2000 },
    { id: 'ledge-27', type: 'solid', x: 650, y: 880, width: 260, height: 24 },
    { id: 'ledge-28', type: 'solid', x: 400, y: 780, width: 240, height: 24 },
    { id: 'ledge-29', type: 'solid', x: 650, y: 680, width: 260, height: 24 },
    { id: 'crumble-11', type: 'crumbling', x: 400, y: 580, width: 220, height: 24, crumbleAfterMs: 600, respawnAfterMs: 2500 },
    { id: 'ledge-30', type: 'solid', x: 650, y: 480, width: 260, height: 24 },
    { id: 'ledge-31', type: 'solid', x: 400, y: 380, width: 240, height: 24 },
    // Final approach
    { id: 'ledge-32', type: 'solid', x: 560, y: 280, width: 480, height: 24 },
    { id: 'ledge-33', type: 'solid', x: 560, y: 180, width: 480, height: 24 },
    // Walls
    { id: 'left-wall', type: 'solid', x: 0, y: 0, width: 40, height: 4500 },
    { id: 'right-wall', type: 'solid', x: 1560, y: 0, width: 40, height: 4500 },
  ],
  movingPlatforms: [
    { id: 'moving-1', type: 'moving', x: 450, y: 2880, width: 120, height: 24, axis: 'x', distance: 300, speed: 90, phase: 0 },
    { id: 'moving-2', type: 'moving', x: 450, y: 1780, width: 140, height: 24, axis: 'y', distance: 180, speed: 70, phase: Math.PI },
  ],
  hazards: [
    { id: 'hazard-1', type: 'hazard', x: 250, y: 2950, width: 180, height: 32, damage: 'death' },
    { id: 'hazard-2', type: 'hazard', x: 650, y: 2130, width: 180, height: 32, damage: 'death' },
    { id: 'hazard-3', type: 'hazard', x: 650, y: 930, width: 180, height: 32, damage: 'death' },
  ],
  background: { theme: 'summit' },
}
