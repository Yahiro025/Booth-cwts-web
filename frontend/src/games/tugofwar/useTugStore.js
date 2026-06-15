import { create } from 'zustand'

// ─── match config ─────────────────────────────────────────────────────────────
export const MATCH_SECONDS = 120 // 2-minute tug-of-war
export const COUNTDOWN_MS = 3000 // "3·2·1·GO" before the clock starts

// ─── pull tuning ──────────────────────────────────────────────────────────────
// rope ∈ [-1, +1].  +1 = Player 1 has dragged the flag fully to their side,
// -1 = Player 2 has.  Because both players push in opposite directions the rope
// only moves by the *difference* in their performance — evenly-matched players
// stay near the centre and the clock decides the winner.
const BASE_PULL = 0.0075 // rope units gained from one clean hit at combo 0
const PERFECT_MULT = 1.6 // bonus for a dead-on (PERFECT) hit vs a GOOD hit
const COMBO_BONUS = 0.05 // each combo step adds this to the pull multiplier
const COMBO_CAP = 25 // multiplier stops growing past this combo
const MISS_DRIFT = 0.012 // ground lost to your rival when a note slips past

const INIT_PLAYER = {
  hits: 0,
  misses: 0,
  combo: 0,
  best: 0,
  perfects: 0,
}

function pullMultiplier(combo) {
  return 1 + Math.min(combo, COMBO_CAP) * COMBO_BONUS
}

const useTugStore = create((set, get) => ({
  refCount: 0,
  round: 0, // bumped on restart so each canvas wipes its local field
  rope: 0, // -1 .. +1   (read every frame on the canvas)
  winner: null, // 'player1' | 'player2' | 'tie' | null
  startTime: 0, // ms timestamp when the clock starts (after the countdown)
  timeLeft: MATCH_SECONDS, // whole seconds remaining — reactive, drives the HUD clock
  player1: { ...INIT_PLAYER },
  player2: { ...INIT_PLAYER },

  mount: () => set((s) => ({ refCount: s.refCount + 1 })),

  unmount: () => {
    const { refCount } = get()
    if (refCount <= 1) {
      set({
        refCount: 0,
        round: 0,
        rope: 0,
        winner: null,
        startTime: 0,
        timeLeft: MATCH_SECONDS,
        player1: { ...INIT_PLAYER },
        player2: { ...INIT_PLAYER },
      })
    } else {
      set((s) => ({ refCount: s.refCount - 1 }))
    }
  },

  // First canvas to mount arms the shared clock; the second one no-ops.
  init: () => {
    if (get().startTime === 0) {
      set({ startTime: Date.now() + COUNTDOWN_MS })
    }
  },

  restart: () =>
    set((s) => ({
      round: s.round + 1,
      rope: 0,
      winner: null,
      startTime: Date.now() + COUNTDOWN_MS,
      timeLeft: MATCH_SECONDS,
      player1: { ...INIT_PLAYER },
      player2: { ...INIT_PLAYER },
    })),

  // A well-timed key press: grow the combo and haul the rope toward this player.
  // `quality` is 'perfect' | 'good'.
  registerHit: (playerKey, quality) => {
    const s = get()
    if (s.winner) return
    const p = s[playerKey]
    const combo = p.combo + 1
    const force =
      BASE_PULL * (quality === 'perfect' ? PERFECT_MULT : 1) * pullMultiplier(p.combo)

    let rope = s.rope + (playerKey === 'player1' ? force : -force)
    rope = Math.max(-1, Math.min(1, rope))

    const next = {
      rope,
      [playerKey]: {
        ...p,
        hits: p.hits + 1,
        perfects: p.perfects + (quality === 'perfect' ? 1 : 0),
        combo,
        best: Math.max(p.best, combo),
      },
    }

    // Dragging the flag all the way over the line is an instant knockout.
    if (rope >= 1) next.winner = 'player1'
    else if (rope <= -1) next.winner = 'player2'

    set(next)
  },

  // A note slipped past ('passed') or the player mashed a dead key ('wasted').
  // Either way the combo snaps; a true slip also feeds ground to the rival.
  registerMiss: (playerKey, type) => {
    const s = get()
    if (s.winner) return
    const p = s[playerKey]

    const next = {
      [playerKey]: {
        ...p,
        combo: 0,
        misses: type === 'passed' ? p.misses + 1 : p.misses,
      },
    }

    if (type === 'passed') {
      let rope = s.rope + (playerKey === 'player1' ? -MISS_DRIFT : MISS_DRIFT)
      rope = Math.max(-1, Math.min(1, rope))
      next.rope = rope
      if (rope >= 1) next.winner = 'player1'
      else if (rope <= -1) next.winner = 'player2'
    }

    set(next)
  },

  // Advance the shared clock. Idempotent and safe to call from both canvases
  // every frame — it only writes when the whole-second value actually changes
  // and resolves the winner once when time runs out.
  tickClock: () => {
    const s = get()
    if (s.startTime === 0 || s.winner) return

    const remainMs = s.startTime + MATCH_SECONDS * 1000 - Date.now()
    const secs = Math.max(0, Math.ceil(remainMs / 1000))
    if (secs !== s.timeLeft) set({ timeLeft: secs })

    if (remainMs <= 0) {
      const rope = s.rope
      set({
        winner: rope > 0 ? 'player1' : rope < 0 ? 'player2' : 'tie',
        timeLeft: 0,
      })
    }
  },
}))

export default useTugStore
