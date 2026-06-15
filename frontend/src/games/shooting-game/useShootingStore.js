import { create } from 'zustand'

// Coordinates the two independent shooter panels so the match only ends — and
// the end credits only roll — once BOTH players have died. The winner is the
// player with the higher final score; an exact draw is a tie.
//
// Mirrors the bowling/tug stores: a refCount keeps shared state alive while
// either panel is mounted, and `round` is bumped on restart so each panel can
// detect the reset and rebuild its local game state.

const INIT_PLAYER = { finished: false, score: 0 }

const useShootingStore = create((set, get) => ({
  refCount: 0,
  round: 0,
  winner: null, // 'player1' | 'player2' | 'tie' | null
  player1: { ...INIT_PLAYER },
  player2: { ...INIT_PLAYER },

  mount: () => set((s) => ({ refCount: s.refCount + 1 })),

  unmount: () => {
    const { refCount } = get()
    if (refCount <= 1) {
      set({
        refCount: 0,
        round: 0,
        winner: null,
        player1: { ...INIT_PLAYER },
        player2: { ...INIT_PLAYER },
      })
    } else {
      set((s) => ({ refCount: s.refCount - 1 }))
    }
  },

  // Record a player's final score once their run is over and, if the rival has
  // also finished, resolve the winner.
  reportFinish: (playerKey, score) => {
    const s = get()
    if (s[playerKey].finished) return

    const me = { finished: true, score }
    const next = { [playerKey]: me }

    const otherKey = playerKey === 'player1' ? 'player2' : 'player1'
    const other = s[otherKey]
    if (other.finished) {
      next.winner = score > other.score ? playerKey : score < other.score ? otherKey : 'tie'
    }

    set(next)
  },

  // Replay the same match. Guarded so a press on each panel only resets once.
  restart: () => {
    if (!get().winner) return
    set((s) => ({
      round: s.round + 1,
      winner: null,
      player1: { ...INIT_PLAYER },
      player2: { ...INIT_PLAYER },
    }))
  },
}))

export default useShootingStore
