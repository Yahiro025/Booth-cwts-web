import { useEffect, useRef } from 'react'
import { CHARACTERS } from '../../components/landing_page/CharacterSelect'
import useGameStore from '../../store/useGameStore'
import EndCredits from '../../components/EndCredits'
import useTugStore, { MATCH_SECONDS } from './useTugStore'

const HUD_H = 64
const ROPE_H = 96 // tug-of-war banner drawn just under the HUD
const LANES = 4

// ─── note timing / difficulty ─────────────────────────────────────────────────
// Distances are kept relative to the playfield so the feel is identical on any
// canvas size; only the cadence ramps as the match heats up.
const HIT_PERFECT = 0.05 // |dist to hit-line| as a fraction of fall span → PERFECT
const HIT_GOOD = 0.12 // … → GOOD (anything larger is a clean miss)
const FALL_TIME_START = 1.55 // seconds for a note to reach the hit-line (early game)
const FALL_TIME_END = 0.95 // … late game (faster = harder)
const SPAWN_START = 0.7 // seconds between spawns (early game)
const SPAWN_END = 0.36 // … late game

// Per-player lane → key. The note's letter tells the player what to press.
const P1_LANES = ['w', 'a', 's', 'd']
const P2_LANES = ['i', 'j', 'k', 'l']

// ─── helpers ──────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  r = Math.round(Math.min(255, Math.max(0, r + amt * 255)))
  g = Math.round(Math.min(255, Math.max(0, g + amt * 255)))
  b = Math.round(Math.min(255, Math.max(0, b + amt * 255)))
  return `rgb(${r},${g},${b})`
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function computeLayout(W, H) {
  const fieldTop = HUD_H + ROPE_H
  const laneW = W / LANES
  const hitLineY = H - Math.max(72, (H - fieldTop) * 0.16)
  const spawnY = fieldTop + 6
  const fallSpan = hitLineY - spawnY
  const noteR = Math.min(laneW * 0.32, 30)
  return {
    W, H, fieldTop, laneW, hitLineY, spawnY, fallSpan, noteR,
    ropeTop: HUD_H, ropeBottom: HUD_H + ROPE_H,
  }
}

// ─── component ────────────────────────────────────────────────────────────────
export default function TugOfWarGame({ canvasId, player1, player2, pressedKeys }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  const isP1 = canvasId === 'canvas-left'
  const myKey = isP1 ? 'player1' : 'player2'
  const me = isP1 ? player1 : player2
  const opp = isP1 ? player2 : player1
  const laneKeys = isP1 ? P1_LANES : P2_LANES
  const restartKeys = isP1 ? ['g', 'G'] : ["'", '5']

  const myChar = CHARACTERS.find((c) => c.id === me.avatarKey) ?? CHARACTERS[0]
  const oppChar = CHARACTERS.find((c) => c.id === opp.avatarKey) ?? CHARACTERS[1]
  const p1Char = CHARACTERS.find((c) => c.id === player1.avatarKey) ?? CHARACTERS[0]
  const p2Char = CHARACTERS.find((c) => c.id === player2.avatarKey) ?? CHARACTERS[2]
  const myName = me.name || (isP1 ? 'Player 1' : 'Player 2')
  const oppName = opp.name || (isP1 ? 'Player 2' : 'Player 1')
  const p1Name = player1.name || 'Player 1'
  const p2Name = player2.name || 'Player 2'

  const setPhase = useGameStore((s) => s.setPhase)

  // reactive HUD state (kept deliberately light — gameplay stats are drawn on canvas)
  const winner = useTugStore((s) => s.winner)
  const timeLeft = useTugStore((s) => s.timeLeft)

  useEffect(() => {
    const store = useTugStore.getState()
    store.mount()
    store.init()

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    let L = computeLayout(canvas.width, canvas.height)

    // ── local (per-canvas) state ──
    const local = {
      notes: [], // { lane, y, hit, dead, pop }
      particles: [], // { x, y, vx, vy, life, max, r, color }
      popups: [], // { x, y, text, color, life, max, vy, size }
      spawnTimer: 0.6,
      shake: 0,
      comboPunch: 0, // 0..1 scales the combo readout on each increment
      flash: 0, // lane-wide red flash on a slip
      lastT: performance.now(),
      goFlash: 0, // brief "GO!" pulse when the countdown ends
      countingDown: true,
      seenRound: store.round,
      prevLane: laneKeys.map(() => false),
      prevRestart: false,
    }

    const laneCenter = (lane) => lane * L.laneW + L.laneW / 2

    const resetLocal = () => {
      local.notes.length = 0
      local.particles.length = 0
      local.popups.length = 0
      local.spawnTimer = 0.6
      local.shake = 0
      local.comboPunch = 0
      local.flash = 0
      local.goFlash = 0
      local.countingDown = true
    }

    const burst = (x, y, color, n, power) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = power * (0.4 + Math.random() * 0.9)
        local.particles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - power * 0.4,
          life: 1, max: 0.45 + Math.random() * 0.4,
          r: L.noteR * (0.12 + Math.random() * 0.16),
          color,
        })
      }
    }

    const popup = (lane, text, color, size) => {
      local.popups.push({
        x: laneCenter(lane), y: L.hitLineY - L.noteR * 1.4,
        text, color, life: 1, max: 0.7, vy: -42, size,
      })
    }

    const spawnInterval = (progress) => lerp(SPAWN_START, SPAWN_END, progress)
    const fallSpeed = (progress) => L.fallSpan / lerp(FALL_TIME_START, FALL_TIME_END, progress)

    const spawnNote = () => {
      // Bias toward a lane that isn't already crowded near the top.
      let lane = Math.floor(Math.random() * LANES)
      for (let tries = 0; tries < 3; tries++) {
        const crowded = local.notes.some(
          (nt) => nt.lane === lane && !nt.hit && nt.y < L.spawnY + L.noteR * 3,
        )
        if (!crowded) break
        lane = Math.floor(Math.random() * LANES)
      }
      local.notes.push({ lane, y: L.spawnY, hit: false, dead: false, pop: 0 })
    }

    const tryHit = (lane) => {
      // Closest live note in this lane that's within the GOOD window.
      let best = null
      let bestDist = Infinity
      for (const nt of local.notes) {
        if (nt.lane !== lane || nt.hit) continue
        const dist = Math.abs(nt.y - L.hitLineY)
        if (dist < bestDist) {
          bestDist = dist
          best = nt
        }
      }
      const frac = bestDist / L.fallSpan
      if (best && frac <= HIT_GOOD) {
        const perfect = frac <= HIT_PERFECT
        best.hit = true
        best.pop = 1
        useTugStore.getState().registerHit(myKey, perfect ? 'perfect' : 'good')
        const combo = useTugStore.getState()[myKey].combo
        local.comboPunch = 1
        local.shake = Math.min(14, local.shake + (perfect ? 7 : 4) + combo * 0.15)
        burst(laneCenter(lane), L.hitLineY, perfect ? '#ffffff' : myChar.color,
          perfect ? 16 : 10, perfect ? 5.2 : 3.6)
        popup(lane, perfect ? 'PERFECT' : 'GOOD', perfect ? '#fff' : myChar.color,
          perfect ? 22 : 18)
      } else {
        // Mashing a dead lane just snaps the combo — no reward for spamming.
        useTugStore.getState().registerMiss(myKey, 'wasted')
        local.flash = Math.max(local.flash, 0.5)
        popup(lane, 'X', 'rgba(255,90,90,0.95)', 16)
      }
    }

    // ── drawing ──
    const drawBackdrop = () => {
      const bg = ctx.createLinearGradient(0, 0, 0, L.H)
      bg.addColorStop(0, '#0d0b13')
      bg.addColorStop(1, '#181423')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, L.W, L.H)
      const glow = ctx.createRadialGradient(L.W / 2, L.H * 0.7, 0, L.W / 2, L.H * 0.7, L.W * 0.8)
      glow.addColorStop(0, myChar.glow.replace('0.35', '0.14'))
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, L.W, L.H)
    }

    const drawRope = (rope) => {
      const cx = L.W / 2
      const midY = L.ropeTop + ROPE_H * 0.54
      const margin = L.W * 0.14
      const half = cx - margin // travel of the flag from centre to a win
      const knotX = cx - rope * half // +rope → flag slides toward P1 (left)

      // panel
      ctx.fillStyle = 'rgba(8,6,12,0.55)'
      ctx.fillRect(0, L.ropeTop, L.W, ROPE_H)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, L.ropeBottom)
      ctx.lineTo(L.W, L.ropeBottom)
      ctx.stroke()

      // tinted lead — the side currently winning glows in its colour
      const leadColor = rope >= 0 ? p1Char.color : p2Char.color
      const leadGrad = rope >= 0
        ? ctx.createLinearGradient(0, 0, cx, 0)
        : ctx.createLinearGradient(L.W, 0, cx, 0)
      leadGrad.addColorStop(0, leadColor + '33')
      leadGrad.addColorStop(1, leadColor + '00')
      ctx.fillStyle = leadGrad
      ctx.fillRect(0, L.ropeTop, L.W, ROPE_H)

      // win-line posts
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.setLineDash([4, 6])
      ctx.lineWidth = 2
      for (const x of [margin, L.W - margin]) {
        ctx.beginPath()
        ctx.moveTo(x, L.ropeTop + 14)
        ctx.lineTo(x, L.ropeBottom - 14)
        ctx.stroke()
      }
      ctx.setLineDash([])

      // the rope itself
      ctx.strokeStyle = '#caa86a'
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(margin, midY)
      ctx.lineTo(L.W - margin, midY)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(120,80,40,0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 7])
      ctx.beginPath()
      ctx.moveTo(margin, midY)
      ctx.lineTo(L.W - margin, midY)
      ctx.stroke()
      ctx.setLineDash([])

      // centre flag / knot
      ctx.save()
      ctx.shadowColor = leadColor
      ctx.shadowBlur = 16
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(knotX, midY, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      // flag pole + cloth toward the leader
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(knotX, midY)
      ctx.lineTo(knotX, midY - 26)
      ctx.stroke()
      const dir = rope >= 0 ? -1 : 1
      ctx.fillStyle = leadColor
      ctx.beginPath()
      ctx.moveTo(knotX, midY - 26)
      ctx.lineTo(knotX + dir * 22, midY - 20)
      ctx.lineTo(knotX, midY - 14)
      ctx.closePath()
      ctx.fill()

      // end emblems + names
      const drawSide = (x, char, name, mine, align) => {
        ctx.save()
        ctx.shadowColor = char.glow
        ctx.shadowBlur = 12
        ctx.fillStyle = char.color
        ctx.beginPath()
        ctx.arc(x, midY, 13, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        ctx.fillStyle = '#fff'
        ctx.font = '800 12px "Plus Jakarta Sans", sans-serif'
        ctx.textAlign = align
        const tx = align === 'left' ? x + 20 : x - 20
        ctx.fillText(name + (mine ? '  (YOU)' : ''), tx, midY - 18)
      }
      drawSide(margin, p1Char, p1Name, isP1, 'left')
      drawSide(L.W - margin, p2Char, p2Name, !isP1, 'right')
    }

    const drawField = () => {
      // lane columns + separators
      for (let i = 0; i < LANES; i++) {
        const x = i * L.laneW
        const g = ctx.createLinearGradient(0, L.fieldTop, 0, L.H)
        g.addColorStop(0, 'rgba(255,255,255,0.015)')
        g.addColorStop(1, i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)')
        ctx.fillStyle = g
        ctx.fillRect(x, L.fieldTop, L.laneW, L.H - L.fieldTop)
        if (i > 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.06)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, L.fieldTop)
          ctx.lineTo(x, L.H)
          ctx.stroke()
        }
      }

      // hit-line glow bar
      ctx.save()
      ctx.shadowColor = myChar.color
      ctx.shadowBlur = 18
      ctx.strokeStyle = myChar.color
      ctx.globalAlpha = 0.9
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, L.hitLineY)
      ctx.lineTo(L.W, L.hitLineY)
      ctx.stroke()
      ctx.restore()

      // target keycaps at the hit line (light up while held)
      for (let i = 0; i < LANES; i++) {
        const cx = laneCenter(i)
        const held = pressedKeys.has(laneKeys[i]) || pressedKeys.has(laneKeys[i].toUpperCase())
        const s = L.noteR * 1.5
        ctx.save()
        ctx.globalAlpha = held ? 1 : 0.5
        if (held) {
          ctx.shadowColor = myChar.color
          ctx.shadowBlur = 16
        }
        roundRect(ctx, cx - s / 2, L.hitLineY - s / 2, s, s, 8)
        ctx.fillStyle = held ? myChar.color + 'cc' : 'rgba(255,255,255,0.05)'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = held ? '#fff' : myChar.color + '88'
        ctx.stroke()
        ctx.restore()
        ctx.fillStyle = held ? '#fff' : 'rgba(255,255,255,0.55)'
        ctx.font = `800 ${Math.round(L.noteR * 0.95)}px "Space Grotesk", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(laneKeys[i].toUpperCase(), cx, L.hitLineY)
      }
    }

    const drawNote = (nt) => {
      const cx = laneCenter(nt.lane)
      const s = L.noteR * 2
      let scale = 1
      let alpha
      if (nt.hit) {
        scale = 1 + (1 - nt.pop) * 0.8
        alpha = nt.pop
      } else {
        // brighten as it nears the hit line
        const closeness = 1 - Math.min(1, Math.abs(nt.y - L.hitLineY) / L.fallSpan)
        alpha = 0.55 + closeness * 0.45
      }
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, nt.y)
      ctx.scale(scale, scale)
      ctx.shadowColor = myChar.color
      ctx.shadowBlur = 14
      const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2)
      g.addColorStop(0, shade(myChar.color, 0.18))
      g.addColorStop(1, shade(myChar.color, -0.28))
      ctx.fillStyle = g
      roundRect(ctx, -s / 2, -s / 2, s, s, 9)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      roundRect(ctx, -s / 2, -s / 2, s, s, 9)
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = `800 ${Math.round(L.noteR * 0.95)}px "Space Grotesk", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(laneKeys[nt.lane].toUpperCase(), 0, 0)
      ctx.restore()
    }

    const drawParticles = () => {
      for (const p of local.particles) {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const drawPopups = () => {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const p of local.popups) {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.font = `800 ${p.size}px "Plus Jakarta Sans", sans-serif`
        ctx.fillText(p.text, p.x, p.y)
      }
      ctx.globalAlpha = 1
    }

    const drawCombo = () => {
      const combo = useTugStore.getState()[myKey].combo
      if (combo < 2) return
      const cx = L.W / 2
      const cy = L.fieldTop + (L.hitLineY - L.fieldTop) * 0.34
      const punch = 1 + local.comboPunch * 0.4
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.translate(cx, cy)
      ctx.scale(punch, punch)
      ctx.fillStyle = myChar.color
      ctx.shadowColor = myChar.glow
      ctx.shadowBlur = 18
      ctx.font = '900 48px "Plus Jakarta Sans", sans-serif'
      ctx.fillText(`${combo}`, 0, 0)
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '800 13px "Space Grotesk", sans-serif'
      ctx.fillText('COMBO', 0, 34)
      ctx.restore()
    }

    const drawCountdown = (startTime) => {
      const remain = startTime - Date.now()
      const n = Math.ceil(remain / 1000)
      const sub = (remain % 1000) / 1000 // 1 → 0 within the current second
      const scale = 0.7 + sub * 0.6
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = Math.min(1, sub * 1.6)
      ctx.fillStyle = myChar.color
      ctx.shadowColor = myChar.glow
      ctx.shadowBlur = 30
      ctx.font = `900 ${Math.round(120 * scale)}px "Plus Jakarta Sans", sans-serif`
      ctx.fillText(String(n), L.W / 2, L.fieldTop + (L.H - L.fieldTop) * 0.42)
      ctx.restore()
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '700 13px "Space Grotesk", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GET READY', L.W / 2, L.fieldTop + (L.H - L.fieldTop) * 0.42 + 80)
    }

    const drawGo = () => {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = Math.min(1, local.goFlash)
      const scale = 1 + (1 - local.goFlash) * 0.6
      ctx.translate(L.W / 2, L.fieldTop + (L.H - L.fieldTop) * 0.42)
      ctx.scale(scale, scale)
      ctx.fillStyle = '#fff'
      ctx.shadowColor = myChar.color
      ctx.shadowBlur = 30
      ctx.font = '900 96px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('GO!', 0, 0)
      ctx.restore()
    }

    // ── main loop ──
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)

      const now = performance.now()
      let dt = (now - local.lastT) / 1000
      local.lastT = now
      if (dt > 0.1) dt = 0.1 // clamp after tab-switch stalls

      if (canvas.clientWidth !== canvas.width || canvas.clientHeight !== canvas.height) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        L = computeLayout(canvas.width, canvas.height)
      }

      const s = useTugStore.getState()

      // restart wipes both fields
      if (s.round !== local.seenRound) {
        local.seenRound = s.round
        resetLocal()
      }

      useTugStore.getState().tickClock()

      const startTime = s.startTime
      const counting = Date.now() < startTime
      if (local.countingDown && !counting) {
        local.countingDown = false
        local.goFlash = 1 // fire the GO! pulse once
      }
      const progress = 1 - Math.max(0, s.timeLeft) / MATCH_SECONDS
      const playing = !counting && !s.winner

      // ── input (edge-triggered per lane) ──
      for (let i = 0; i < LANES; i++) {
        const down = pressedKeys.has(laneKeys[i]) || pressedKeys.has(laneKeys[i].toUpperCase())
        if (playing && down && !local.prevLane[i]) tryHit(i)
        local.prevLane[i] = down
      }

      // restart from the win overlay
      const rdown = restartKeys.some((k) => pressedKeys.has(k))
      if (s.winner && rdown && !local.prevRestart) useTugStore.getState().restart()
      local.prevRestart = rdown

      // ── update notes ──
      if (playing) {
        local.spawnTimer -= dt
        if (local.spawnTimer <= 0) {
          spawnNote()
          local.spawnTimer = spawnInterval(progress) * (0.85 + Math.random() * 0.3)
        }
        const speed = fallSpeed(progress)
        for (const nt of local.notes) {
          if (nt.hit) continue
          nt.y += speed * dt
          if (nt.y > L.hitLineY + L.fallSpan * HIT_GOOD) {
            nt.dead = true
            useTugStore.getState().registerMiss(myKey, 'passed')
            local.flash = Math.max(local.flash, 0.5)
            popup(nt.lane, 'MISS', 'rgba(255,90,90,0.95)', 16)
          }
        }
      }

      // advance pop/cleanup
      for (const nt of local.notes) if (nt.hit) nt.pop = Math.max(0, nt.pop - dt * 4)
      local.notes = local.notes.filter((nt) => !nt.dead && !(nt.hit && nt.pop <= 0))

      // particles / popups / juice decay
      for (const p of local.particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.25
        p.life -= dt / p.max
      }
      local.particles = local.particles.filter((p) => p.life > 0)
      for (const p of local.popups) {
        p.y += p.vy * dt
        p.life -= dt / p.max
      }
      local.popups = local.popups.filter((p) => p.life > 0)
      local.comboPunch = Math.max(0, local.comboPunch - dt * 5)
      local.shake = Math.max(0, local.shake - dt * 26)
      local.flash = Math.max(0, local.flash - dt * 2.2)
      if (local.goFlash > 0) local.goFlash = Math.max(0, local.goFlash - dt * 1.6)

      // ── render ──
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, L.W, L.H)
      drawBackdrop()
      drawRope(s.rope)

      const sx = (Math.random() - 0.5) * local.shake
      const sy = (Math.random() - 0.5) * local.shake
      ctx.save()
      ctx.translate(sx, sy)

      drawField()
      for (const nt of local.notes) if (!nt.hit) drawNote(nt)
      for (const nt of local.notes) if (nt.hit) drawNote(nt)
      drawParticles()

      if (local.flash > 0) {
        ctx.fillStyle = `rgba(255,40,40,${local.flash * 0.16})`
        ctx.fillRect(0, L.fieldTop, L.W, L.H - L.fieldTop)
      }

      if (counting) drawCountdown(startTime)
      else {
        drawCombo()
        if (local.goFlash > 0) drawGo()
      }
      drawPopups()

      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      useTugStore.getState().unmount()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── HUD clock formatting ──
  const mm = Math.floor(timeLeft / 60)
  const ss = String(timeLeft % 60).padStart(2, '0')
  const low = timeLeft <= 10 && !winner

  // win-overlay summary (read once; stable after the winner is set)
  const oppKey = isP1 ? 'player2' : 'player1'
  const finalRope = useTugStore.getState().rope
  const myStats = useTugStore.getState()[myKey]
  const oppStats = useTugStore.getState()[oppKey]
  const pullPct = Math.round(Math.abs(finalRope) * 100)

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0d0b13' }}>
      {/* HUD */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center px-3"
        style={{
          height: HUD_H,
          background: 'rgba(18,15,26,0.92)',
          backdropFilter: 'blur(6px)',
          borderBottom: `2px solid ${myChar.color}55`,
        }}
      >
        {/* me */}
        <div className="flex flex-col shrink-0" style={{ width: '32%' }}>
          <span style={{ color: myChar.color, fontWeight: 800, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {myName} <span style={{ opacity: 0.6, fontSize: 10 }}>(YOU)</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>
            TUG OF WAR
          </span>
        </div>

        {/* clock */}
        <div className="flex-1 flex flex-col items-center">
          <span
            style={{
              color: low ? '#ff5a5a' : '#fff',
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1,
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: low ? '0 0 14px rgba(255,90,90,0.7)' : 'none',
              transform: low ? `scale(${1 + (timeLeft % 2 === 0 ? 0.08 : 0)})` : 'none',
              transition: 'transform 0.15s',
            }}
          >
            {mm}:{ss}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.2em', fontFamily: "'Space Grotesk', sans-serif" }}>
            TIME LEFT
          </span>
        </div>

        {/* opponent */}
        <div className="flex flex-col items-end shrink-0" style={{ width: '32%' }}>
          <span style={{ color: oppChar.color, fontWeight: 700, fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {oppName}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>
            RIVAL
          </span>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* controls hint */}
      {!winner && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full"
          style={{ background: 'rgba(18,15,26,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: '0.08em', fontFamily: "'Space Grotesk', sans-serif" }}>
            Hit {laneKeys.map((k) => k.toUpperCase()).join(' ')} on the line to pull · combos pull harder
          </span>
        </div>
      )}

      {/* end credits — match resolved (time up or rope pulled over the line) */}
      {winner && (
        <EndCredits
          title="Tug of War"
          outcome={winner === 'tie' ? 'tie' : winner === myKey ? 'win' : 'lose'}
          valueLabel="Hits"
          subtitle={`Rope pulled ${pullPct}% · your best combo ${myStats.best}× · ${myStats.perfects} perfects`}
          myChar={myChar}
          myName={myName}
          myValue={myStats.hits}
          oppChar={oppChar}
          oppName={oppName}
          oppValue={oppStats.hits}
          playAgainKey={isP1 ? 'G' : "'"}
          onPlayAgain={() => useTugStore.getState().restart()}
          onBackToSelect={() => setPhase('CHARACTER_SELECT')}
        />
      )}
    </div>
  )
}
