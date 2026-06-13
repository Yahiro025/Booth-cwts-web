import { create } from 'zustand'

const useGameStore = create((set) => ({
  currentPhase: 'LANDING_PAGE',
  selectedGame: null,
  player1: { name: '', avatarKey: '' },
  player2: { name: '', avatarKey: '' },
  setPhase: (phase) => set({ currentPhase: phase }),
  setGame: (gameId) => set({ selectedGame: gameId }),
  setPlayer1: (data) => set((state) => ({ player1: { ...state.player1, ...data } })),
  setPlayer2: (data) => set((state) => ({ player2: { ...state.player2, ...data } })),
}))

export default useGameStore
