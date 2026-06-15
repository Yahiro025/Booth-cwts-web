export function createParticleSystem() {
  return { particles: [] }
}

export function spawnDeathParticles(particleSystem, x, y) {
  const colors = ['#e74c3c', '#f39c12', '#e67e22', '#c0392b']
  for (let i = 0; i < 20; i++) {
    particleSystem.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 400,
      vy: (Math.random() - 0.5) * 400 - 150,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 0.5 + Math.random() * 0.5,
      size: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

export function spawnFinishParticles(particleSystem, x, y) {
  const colors = ['#2ecc71', '#27ae60', '#f1c40f', '#3498db']
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 * i) / 30
    const speed = 100 + Math.random() * 200
    particleSystem.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 100,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 0.8 + Math.random() * 0.4,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

/**
 * Dust kicked up when a player lands. Intensity (0..1) scales the burst size
 * and spread so soft landings barely puff and hard landings throw debris wide.
 */
export function spawnLandingDust(particleSystem, x, y, intensity = 0.5) {
  const colors = ['#cfd8dc', '#b0bec5', '#eceff1']
  const count = 5 + Math.floor(intensity * 8)
  for (let i = 0; i < count; i++) {
    const dir = i < count / 2 ? -1 : 1
    const speed = (40 + Math.random() * 120) * (0.5 + intensity)
    const life = 0.25 + Math.random() * 0.25
    particleSystem.particles.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      vx: dir * speed * (0.4 + Math.random() * 0.6),
      vy: -Math.random() * 60 - 20,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

/**
 * Small puff under the feet on takeoff.
 */
export function spawnJumpPuff(particleSystem, x, y) {
  const colors = ['#dfe6e9', '#b2bec3']
  for (let i = 0; i < 6; i++) {
    const life = 0.18 + Math.random() * 0.14
    particleSystem.particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y,
      vx: (Math.random() - 0.5) * 120,
      vy: Math.random() * 40 + 10,
      life,
      maxLife: life,
      size: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

/**
 * Directional burst when kicking off a wall. `dir` is the push-off direction
 * ('left' | 'right'); debris sprays that way.
 */
export function spawnWallJumpBurst(particleSystem, x, y, dir) {
  const colors = ['#dfe6e9', '#b2bec3', '#ffffff']
  const sign = dir === 'right' ? 1 : -1
  for (let i = 0; i < 8; i++) {
    const speed = 60 + Math.random() * 140
    const life = 0.2 + Math.random() * 0.2
    particleSystem.particles.push({
      x,
      y: y + (Math.random() - 0.5) * 20,
      vx: sign * speed,
      vy: (Math.random() - 0.5) * 120 - 20,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

export function updateParticles(particleSystem, dt) {
  for (let i = particleSystem.particles.length - 1; i >= 0; i--) {
    const p = particleSystem.particles[i]
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += 500 * dt
    p.life -= dt
    if (p.life <= 0) {
      particleSystem.particles.splice(i, 1)
    }
  }
}

export function emitGrabContactParticles(particleSystem, x, y) {
  const colors = ['#ffffff', '#ffff00', '#ffd700', '#fff8c4']
  const count = 4 + Math.floor(Math.random() * 3) // 4-6 particles
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 30 + Math.random() * 60
    particleSystem.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life: 0.2 + Math.random() * 0.1,
      maxLife: 0.2 + Math.random() * 0.1,
      size: 2 + Math.random() * 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }
}

export function drawParticles(ctx, camera, particleSystem) {
  for (const p of particleSystem.particles) {
    const alpha = Math.max(0, p.life / p.maxLife)
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color || '#e74c3c'
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
  }
  ctx.globalAlpha = 1
}
