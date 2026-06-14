import { describe, expect, it } from 'vitest'
import { createPlayer } from '../entities/Player.js'
import {
  updatePlayer,
  COYOTE_TIME_MS,
  getMovingPlatformState,
  carryOnMovingPlatform,
  createCrumblingState,
  updateCrumblingTimers,
  isPlatformActive,
} from './Physics.js'

const DT = 1000 / 60 // ~16.667ms fixed timestep

function stillInput() {
  return { left: false, right: false, down: false, jumpHeld: false, jumpPressed: false }
}

function jumpInput() {
  return { left: false, right: false, down: false, jumpHeld: true, jumpPressed: true }
}

function rightInput() {
  return { left: false, right: true, down: false, jumpHeld: false, jumpPressed: false }
}

function makeStage(spawnY, fallY, checkpoints) {
  return {
    fallY: fallY || 2000,
    checkpoints: checkpoints || [],
    spawnPoints: { p1: { x: 100, y: spawnY }, p2: { x: 160, y: spawnY } },
    finishZone: { x: 0, y: 0, width: 400, height: 50 },
  }
}

describe('Parkour physics — FB-2', () => {
  it('ground collision lands on a platform', () => {
    const stage = makeStage(500)
    const player = createPlayer('p1', { x: 100, y: 500 })
    const platforms = [
      { id: 'ground', type: 'solid', x: 0, y: 600, width: 400, height: 50 },
    ]

    for (let i = 0; i < 120; i++) {
      updatePlayer(player, stillInput(), DT, stage, platforms, [])
    }

    expect(player.grounded).toBe(true)
    expect(player.y).toBe(560) // 600 - 40
    expect(player.vy).toBe(0)
  })

  it('walking into a wall stops horizontal movement', () => {
    const stage = makeStage(300)
    const player = createPlayer('p1', { x: 50, y: 300 })
    const platforms = [
      { id: 'ground', type: 'solid', x: 0, y: 360, width: 400, height: 40 },
      { id: 'wall', type: 'solid', x: 200, y: 300, width: 20, height: 60 },
    ]

    for (let i = 0; i < 60; i++) {
      updatePlayer(player, stillInput(), DT, stage, platforms, [])
    }
    expect(player.grounded).toBe(true)
    expect(player.y).toBe(320) // 360 - 40

    for (let i = 0; i < 60; i++) {
      updatePlayer(player, rightInput(), DT, stage, platforms, [])
    }

    expect(player.x + player.width).toBeLessThanOrEqual(200)
    expect(player.grounded).toBe(true)
  })

  it('buffered jump fires on landing', () => {
    const stage = makeStage(200)
    const player = createPlayer('p1', { x: 100, y: 200 })
    const platforms = [
      { id: 'ground', type: 'solid', x: 0, y: 260, width: 400, height: 40 },
    ]

    // Fall for 5 ticks — still in the air (lands around tick 10)
    for (let i = 0; i < 5; i++) {
      updatePlayer(player, stillInput(), DT, stage, platforms, [])
    }
    expect(player.grounded).toBe(false)

    // Press jump while in the air — buffers but does NOT fire
    updatePlayer(player, jumpInput(), DT, stage, platforms, [])
    expect(player.vy).toBeGreaterThan(0) // still falling
    expect(player.jumpBufferTimer).toBeGreaterThan(0) // jump buffered

    // Continue falling — land and fire the buffered jump
    let jumpFired = false
    for (let i = 0; i < 20; i++) {
      updatePlayer(player, stillInput(), DT, stage, platforms, [])
      if (player.vy < 0) {
        jumpFired = true
        break
      }
    }

    expect(jumpFired).toBe(true)
    expect(player.vy).toBeLessThan(0)
  })

  it('coyote jump works shortly after leaving ground', () => {
    const stage = makeStage(300)
    const player = createPlayer('p1', { x: 100, y: 300 })
    const platforms = [
      { id: 'ledge', type: 'solid', x: 100, y: 340, width: 100, height: 20 },
    ]

    // Land on ledge
    for (let i = 0; i < 60; i++) {
      updatePlayer(player, stillInput(), DT, stage, platforms, [])
    }
    expect(player.grounded).toBe(true)

    // Walk right off the ledge (right edge at x=200).
    // At 5px/tick from x=100, player reaches x=200 at tick 20.
    // Walk only 22 ticks — only ~2 ticks airborne = 33ms, well within 80ms COYOTE_TIME_MS
    for (let i = 0; i < 22; i++) {
      updatePlayer(player, rightInput(), DT, stage, platforms, [])
    }

    expect(player.grounded).toBe(false)
    expect(player.groundedTimer).toBeLessThanOrEqual(COYOTE_TIME_MS)

    // Coyote jump should fire
    updatePlayer(player, jumpInput(), DT, stage, platforms, [])
    expect(player.vy).toBeLessThan(0)
  })

  it('fall death respawns at last checkpoint and adds penalty', () => {
    const checkpoints = [{ id: 'cp-1', x: 80, y: 300, width: 200, height: 30 }]
    const stage = makeStage(500, 600, checkpoints)
    const player = createPlayer('p1', { x: 100, y: 500 })
    // No platforms — free fall past fallY=600
    const platforms = []

    // Simulate having touched a checkpoint
    player.lastCheckpointId = 'cp-1'

    // Free-fall past fallY=600.
    // ~20 ticks to reach fallY=600 from y=500. Run 30 ticks — enough for one death
    // but not enough to fall from respawn position (y≈258) to fallY again.
    const deathEvents = []
    for (let i = 0; i < 30; i++) {
      const events = updatePlayer(player, stillInput(), DT, stage, platforms, [])
      deathEvents.push(...events)
    }

    const fallDeath = deathEvents.find((e) => e.type === 'death' && e.cause === 'fall')
    expect(fallDeath).toBeTruthy()
    expect(fallDeath.checkpointId).toBe('cp-1')

    expect(player.y).toBeLessThan(600)
    expect(player.invulnerabilityTimer).toBeGreaterThan(0)
    expect(player.deaths).toBe(1)
  })

  it('hazard death respects invulnerability', () => {
    const stage = makeStage(300)
    const player = createPlayer('p1', { x: 100, y: 300 })
    const platforms = [{ id: 'ground', type: 'solid', x: 0, y: 360, width: 400, height: 40 }]
    const hazards = [{ id: 'haz-1', type: 'hazard', x: 80, y: 340, width: 60, height: 20, damage: 'death' }]

    // Land on ground
    for (let i = 0; i < 60; i++) {
      updatePlayer(player, stillInput(), DT, stage, platforms, hazards)
    }
    expect(player.grounded).toBe(true)

    // Walk left into hazard
    const leftInput = () => ({ left: true, right: false, down: false, jumpHeld: false, jumpPressed: false })
    let hazardEvents = []
    for (let i = 0; i < 10; i++) {
      const events = updatePlayer(player, leftInput(), DT, stage, platforms, hazards)
      hazardEvents.push(...events)
    }

    const hazardDeath = hazardEvents.find((e) => e.type === 'death' && e.cause === 'hazard')
    expect(hazardDeath).toBeTruthy()
    expect(player.invulnerabilityTimer).toBeGreaterThan(0)

    // Hazard touch during invulnerability should NOT cause death
    const deathCount = player.deaths
    let moreEvents = []
    for (let i = 0; i < 10; i++) {
      const events = updatePlayer(player, leftInput(), DT, stage, platforms, hazards)
      moreEvents.push(...events)
    }

    expect(player.deaths).toBe(deathCount)
    expect(moreEvents.filter((e) => e.type === 'death')).toHaveLength(0)
  })
})

describe('Parkour moving & crumbling platforms — FB-3', () => {
  it('grounded player is carried by moving platform delta', () => {
    // An X-axis moving platform with speed & distance
    const platform = {
      id: 'mp-1', type: 'moving', x: 100, y: 300, width: 120, height: 24,
      axis: 'x', distance: 200, speed: 100, phase: 0,
    }

    const state1 = getMovingPlatformState(platform, 3000, 1000 / 60)
    const state2 = getMovingPlatformState(platform, 3000 + 1000 / 60, 1000 / 60)

    // Player standing on top of the platform
    const player = createPlayer('p1', { x: 140, y: 200 })
    player.y = state1.y - player.height
    player.grounded = true

    const beforeX = player.x
    carryOnMovingPlatform(player, state2)

    // Player should have moved by the platform's delta
    expect(player.x - beforeX).toBeCloseTo(state2.dx, 1)
  })

  it('crumbling timer starts only while occupied', () => {
    const cs = createCrumblingState()
    const platform = {
      id: 'cr-1', type: 'crumbling', x: 100, y: 300, width: 120, height: 24,
      crumbleAfterMs: 1000, respawnAfterMs: 2000,
    }
    const player = createPlayer('p1', { x: 140, y: 200 })
    player.y = platform.y - player.height
    player.grounded = true

    // Tick while occupied — timer should increase
    updateCrumblingTimers(cs, [platform], [player], 100)
    expect(cs['cr-1'].crumbleTimer).toBe(100)

    updateCrumblingTimers(cs, [platform], [player], 200)
    expect(cs['cr-1'].crumbleTimer).toBe(300)

    // Remove player from platform
    player.grounded = false
    player.x = 9999

    // Tick — timer should NOT increase
    updateCrumblingTimers(cs, [platform], [player], 500)
    expect(cs['cr-1'].crumbleTimer).toBe(300)
  })

  it('crumbled platform does not collide', () => {
    const cs = createCrumblingState()
    const platform = {
      id: 'cr-1', type: 'crumbling', x: 100, y: 300, width: 120, height: 24,
      crumbleAfterMs: 100, respawnAfterMs: 2000,
    }
    const player = createPlayer('p1', { x: 140, y: 200 })
    player.y = platform.y - player.height
    player.grounded = true

    // Let it crumble completely
    updateCrumblingTimers(cs, [platform], [player], 200)

    expect(cs['cr-1'].active).toBe(false)
    expect(isPlatformActive(platform, cs)).toBe(false)

    // Player should fall through (if we move player above, gravity should pull them down
    // without hitting the platform)
    // With platform inactive, player at (140, 275) should not be stopped
    player.y = 275 // above platform top
    player.grounded = false
    player.vy = 100

    const stage = { fallY: 9999, checkpoints: [], spawnPoints: { p1: { x: 0, y: 0 } }, finishZone: { x: 0, y: 0, width: 0, height: 0 } }
    // Only pass active platforms
    const activePlatforms = [platform].filter((p) => isPlatformActive(p, cs))

    // Fall for multiple ticks to pass through where the platform was
    const input = { left: false, right: false, down: false, jumpHeld: false, jumpPressed: false }
    for (let i = 0; i < 30; i++) {
      updatePlayer(player, input, 16.667, stage, activePlatforms, [])
    }

    // Player fell through (y past platform top of 300)
    expect(player.y).toBeGreaterThan(300)
  })

  it('platform respawns after configured delay', () => {
    const cs = createCrumblingState()
    const platform = {
      id: 'cr-1', type: 'crumbling', x: 100, y: 300, width: 120, height: 24,
      crumbleAfterMs: 100, respawnAfterMs: 200,
    }
    const player = createPlayer('p1', { x: 140, y: 200 })
    player.y = platform.y - player.height
    player.grounded = true

    // Crumble it
    updateCrumblingTimers(cs, [platform], [player], 150)
    expect(cs['cr-1'].active).toBe(false)

    // Wait for respawn
    updateCrumblingTimers(cs, [platform], [player], 100)
    expect(cs['cr-1'].active).toBe(false) // not yet

    updateCrumblingTimers(cs, [platform], [player], 150)
    expect(cs['cr-1'].active).toBe(true) // respawned

    expect(isPlatformActive(platform, cs)).toBe(true)
  })
})
