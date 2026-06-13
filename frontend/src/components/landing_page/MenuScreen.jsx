import useGameStore from '../../store/useGameStore'
import AnimatedBackground from './AnimatedBackground'

// ─── Edit your landing page here ───────────────────────────────────────────
const TITLE = 'Booth'
const SUBTITLE = 'CWTS Gaming Platform'
const TAGLINE = '2-Player Local Multiplayer'
const PLAY_LABEL = 'Play'
// ────────────────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const { setPhase } = useGameStore()

  return (
    <div
      className="flex flex-col items-center justify-center w-screen h-screen overflow-hidden relative"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <AnimatedBackground />


      {/* Logo / title */}
      <div className="relative z-10 flex flex-col items-center gap-3 mb-12">
        <h1
          className="text-7xl font-extrabold tracking-tight text-gray-800"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textShadow: '0 0 40px rgba(0,0,0,0.03)',
          }}
        >
          {TITLE}
          <span style={{ color: '#FF9A9E' }}>.</span>
        </h1>

        <p
          className="text-[11px] tracking-[0.4em] uppercase text-gray-400"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {SUBTITLE}
        </p>

        <p
          className="mt-1 text-sm text-gray-400"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {TAGLINE}
        </p>
      </div>

      {/* Play button */}
      <button
        onClick={() => setPhase('CHARACTER_SELECT')}
        className="relative z-10 group px-16 py-4 rounded-xl font-extrabold text-base tracking-[0.25em] uppercase text-gray-950 active:scale-95 transition-all duration-150 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          boxShadow: '0 0 30px rgba(252,182,159,0.4), 0 0 30px rgba(255,236,210,0.4)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {PLAY_LABEL}
      </button>

      {/* Keyboard hint */}
      <p
        className="relative z-10 mt-8 text-[10px] tracking-[0.25em] uppercase text-gray-400"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        P1: WASD · G &nbsp;|&nbsp; P2: IJKL · '
      </p>
    </div>
  )
}
