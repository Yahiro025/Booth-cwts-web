import { useEffect, useRef, useCallback, useState } from 'react'
import {
  attachRenderer,
  detachRenderer,
  resetRun,
  restartRun,
  getSnapshot,
  dispose,
  tick,
  calculateFinalResult,
} from './State.js'
import { createInputReader } from './engine/Input.js'
import {
  updatePlayer,
  touchCheckpoint,
  filterActivePlatforms,
  createCrumblingState,
  updateCrumblingTimers,
  getMovingPlatformState,
  isPlatformActive,
} from './engine/Physics.js'
import { stages } from './levels/index.js'
import { createRenderer, renderFrame } from './rendering/Renderer.js'
import { createCamera, followCamera, triggerShake } from './engine/Camera.js'
import { drawOverlay, setCalculateFinalResult } from './rendering/Overlay.js'
import {
  createParticleSystem,
  updateParticles,
  spawnDeathParticles,
  spawnFinishParticles,
  spawnLandingDust,
  spawnJumpPuff,
  spawnWallJumpBurst,
  emitGrabContactParticles,
} from './rendering/Particles.js'
import useGameStore from '../../store/useGameStore.js'
import { CHARACTERS } from '../../components/landing_page/CharacterSelect'
import EndCredits from '../../components/EndCredits'

setCalculateFinalResult(calculateFinalResult)

// Cumulative race time (ms) → "M:SS.cs" for the end-credits readout.
function formatRaceTime(ms) {
  const totalCs = Math.round(ms / 10)
  const cs = totalCs % 100
  const totalSec = Math.floor(totalCs / 100)
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60)
  return `${min}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

// Global slow-mo factor applied to the simulation step (1 = real time).
// Lower = calmer, more controllable movement and a slower-counting race timer.
const SIM_SPEED = 0.7

const PANEL_MAP = {
  'canvas-left': { panelSlot: 'left', playerId: 'p1' },
  'canvas-right': { panelSlot: 'right', playerId: 'p2' },
}

let particleSystem = createParticleSystem()
let crumblingState = createCrumblingState()
// Tracks which players have already played their finish celebration this stage,
// keyed by `${runId}:${stageIndex}:${playerId}`. Cleared on each countdown.
let finishFxKeys = new Set()

function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  const w = Math.round(rect.width * dpr)
  const h = Math.round(rect.height * dpr)
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

export default function ParkourGame({
  canvasId,
  player1,
  player2,
  pressedKeys,
}) {
  const canvasRef = useRef(null)
  const hasInitRef = useRef(false)
  const inputReaderRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const renderRafRef = useRef(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const setPhase = useGameStore((s) => s.setPhase)

  // Refs to access latest values inside the effect without re-triggering it.
  const isGameOverRef = useRef(isGameOver)
  const pressedKeysRef = useRef(pressedKeys)
  useEffect(() => {
    isGameOverRef.current = isGameOver
    pressedKeysRef.current = pressedKeys
  })

  const panel = PANEL_MAP[canvasId]

  const handleRestart = useCallback(() => {
    restartRun()
    setIsGameOver(false)
  }, [])

  const handleBackToCharacterSelect = useCallback(() => {
    dispose()
    hasInitRef.current = false
    setPhase('CHARACTER_SELECT')
  }, [setPhase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !panel) return

    const { panelSlot, playerId } = panel

    if (!hasInitRef.current) {
      hasInitRef.current = true
      inputReaderRef.current = createInputReader()
      particleSystem = createParticleSystem()
      crumblingState = createCrumblingState()
      finishFxKeys = new Set()

      const snap = getSnapshot()
      if (!snap.runId) {
        resetRun({
          player1: player1 || { name: 'Player 1', avatarKey: 'joy' },
          player2: player2 || { name: 'Player 2', avatarKey: 'anger' },
          stage: stages[0],
        })
      }
    }

    resizeCanvas(canvas)
    const resizeObserver = new ResizeObserver(() => resizeCanvas(canvas))
    resizeObserver.observe(canvas)

    const currentStage = stages[getSnapshot().currentStageIndex] || stages[0]
    const camera = createCamera(currentStage.width, currentStage.height)

    // Jump camera to player position so characters are visible immediately
    const dpr = window.devicePixelRatio || 1
    const viewW = canvas.width / dpr
    const viewH = canvas.height / dpr
    const snap = getSnapshot()
    const targetPlayer = playerId === 'p1' ? snap.player1 : snap.player2
    if (targetPlayer && viewW > 0 && viewH > 0) {
      camera.x = Math.max(
        0,
        Math.min(
          targetPlayer.x + targetPlayer.width / 2 - viewW / 2,
          currentStage.width - viewW
        )
      )
      camera.y = Math.max(
        0,
        Math.min(
          targetPlayer.y + targetPlayer.height / 2 - viewH / 2,
          currentStage.height - viewH
        )
      )
    }

    cameraRef.current = camera

    const renderer = createRenderer(canvas, camera, playerId, currentStage)
    rendererRef.current = renderer

    // Track the rendered stage so the camera can re-frame when the level
    // changes mid-run (stages differ in size).
    let lastStageIndex = snap.currentStageIndex

    // Each panel renders its OWN canvas on its OWN RAF, following its OWN
    // player. The shared loop below only steps the simulation once per frame
    // so physics stays in sync across both views.
    const renderPanel = () => {
      const r = rendererRef.current
      const c = cameraRef.current
      if (!r || !c) return
      const snap = getSnapshot()
      const stage = stages[snap.currentStageIndex] || stages[0]
      r.stage = stage
      r.camera = c
      // Keep clamp bounds in sync with the active stage. Without this the camera
      // stays clamped to stage 1's size and can't scroll to the bottom spawn of
      // a taller stage — making respawned players look like they vanished.
      c.levelWidth = stage.width
      c.levelHeight = stage.height

      const targetPlayer = playerId === 'p1' ? snap.player1 : snap.player2
      if (targetPlayer) {
        const dpr = window.devicePixelRatio || 1
        if (snap.currentStageIndex !== lastStageIndex) {
          // New stage — snap straight to the player at the new spawn instead of
          // panning the whole way across the level.
          lastStageIndex = snap.currentStageIndex
          const vw = canvas.width / dpr
          const vh = canvas.height / dpr
          c.x = Math.max(0, Math.min(targetPlayer.x + targetPlayer.width / 2 - vw / 2, stage.width - vw))
          c.y = Math.max(0, Math.min(targetPlayer.y + targetPlayer.height / 2 - vh / 2, stage.height - vh))
        }
        if (targetPlayer._shakeRequest > 0) {
          triggerShake(c, targetPlayer._shakeRequest)
          targetPlayer._shakeRequest = 0
        }
        followCamera(
          c,
          targetPlayer.x + targetPlayer.width / 2,
          targetPlayer.y + targetPlayer.height / 2,
          canvas.width / dpr,
          canvas.height / dpr
        )
      }

      const players = [snap.player1, snap.player2].filter(Boolean)
      const visiblePlatforms = stage.platforms.filter((p) =>
        isPlatformActive(p, crumblingState)
      )
      const visibleStage = { ...stage, platforms: visiblePlatforms }
      renderFrame(r, players, visibleStage, particleSystem)
      const ctx = canvas.getContext('2d')
      drawOverlay(ctx, canvas, snap, playerId, snap.currentStageIndex)

      if (snap.phase === 'gameOver' && !isGameOverRef.current) {
        setIsGameOver(true)
      } else if (snap.phase !== 'gameOver' && isGameOverRef.current) {
        setIsGameOver(false)
      }
    }

    attachRenderer({ panelSlot, playerId, canvas })

    const snapshot = getSnapshot()
    snapshot.loopControls.start({
      requestAnimationFrame: window.requestAnimationFrame.bind(window),
      cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
      simulate: (rawDt) => {
        // Uniformly slow the whole simulation — movement, jumps, animations and
        // the race timer all run at SIM_SPEED of real time for a calmer pace.
        const dt = rawDt * SIM_SPEED
        const snap = getSnapshot()
        const stage = stages[snap.currentStageIndex] || stages[0]

        if (snap.phase === 'countdown') finishFxKeys.clear()

        if (snap.phase === 'racing') {
          const input = inputReaderRef.current.read(pressedKeysRef.current)

          const crumblingPlatforms = stage.platforms.filter(
            (p) => p.type === 'crumbling'
          )
          updateCrumblingTimers(
            crumblingState,
            crumblingPlatforms,
            [snap.player1, snap.player2].filter(Boolean),
            dt
          )

          const stateKeyToPhysicsKey = { player1: 'p1', player2: 'p2' }
          for (const [stateKey, physicsKey] of Object.entries(
            stateKeyToPhysicsKey
          )) {
            const playerData = snap[stateKey]
            if (!playerData) continue

            const movingPlatforms = stage.movingPlatforms.map((mp) =>
              getMovingPlatformState(mp, snap.raceTimeMs, dt)
            )
            const activePlatforms = filterActivePlatforms(
              [...stage.platforms, ...movingPlatforms],
              crumblingState
            )

            const events = updatePlayer(
              playerData,
              input[physicsKey],
              dt,
              stage,
              activePlatforms,
              stage.hazards,
              snap.phase,
              [snap.player1, snap.player2].filter(Boolean)
            )
            for (const ev of events) {
              if (ev.type === 'death') {
                spawnDeathParticles(particleSystem, playerData.x, playerData.y)
                playerData._shakeRequest = 14
              }
              if (ev.type === 'grab') {
                emitGrabContactParticles(particleSystem, ev.x, ev.y)
              }
              if (ev.type === 'land') {
                spawnLandingDust(particleSystem, ev.x, ev.y, ev.intensity)
                if (ev.intensity > 0.4) {
                  playerData._shakeRequest = Math.max(
                    playerData._shakeRequest,
                    4 + 6 * ev.intensity
                  )
                }
              }
              if (ev.type === 'jump') {
                spawnJumpPuff(particleSystem, ev.x, ev.y)
              }
              if (ev.type === 'walljump') {
                spawnWallJumpBurst(particleSystem, ev.x, ev.y, ev.dir)
                playerData._shakeRequest = Math.max(
                  playerData._shakeRequest,
                  3
                )
              }
            }
            touchCheckpoint(playerData, stage.checkpoints)
          }

          const finishMap = {}
          if (
            snap.player1 &&
            snap.player1.y <= stage.finishZone.y + stage.finishZone.height
          )
            finishMap.p1 = true
          if (
            snap.player2 &&
            snap.player2.y <= stage.finishZone.y + stage.finishZone.height
          )
            finishMap.p2 = true

          // Finish celebration — confetti + shake once per player per stage
          for (const pid of ['p1', 'p2']) {
            if (!finishMap[pid]) continue
            const key = `${snap.runId}:${snap.currentStageIndex}:${pid}`
            if (finishFxKeys.has(key)) continue
            finishFxKeys.add(key)
            const pl = pid === 'p1' ? snap.player1 : snap.player2
            if (pl) {
              spawnFinishParticles(
                particleSystem,
                pl.x + pl.width / 2,
                pl.y + pl.height / 2
              )
              pl._shakeRequest = 12
            }
          }

          tick(dt, finishMap)
        } else {
          tick(dt)
        }

        updateParticles(particleSystem, dt / 1000)
      },
      getRenderers: () => {
        const snap = getSnapshot()
        return Object.entries(snap.renderers || {}).map(([slot, data]) => ({
          panelSlot: slot,
          ...data,
        }))
      },
      // Rendering is driven per-panel below; the shared loop only simulates.
      renderRenderer: () => {},
    })

    // Per-panel render loop — independent RAF so each side draws its own
    // canvas/camera regardless of which instance owns the simulation loop.
    const renderTick = () => {
      renderPanel()
      renderRafRef.current = window.requestAnimationFrame(renderTick)
    }
    renderRafRef.current = window.requestAnimationFrame(renderTick)

    return () => {
      resizeObserver.disconnect()
      if (renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current)
        renderRafRef.current = null
      }
      detachRenderer(panelSlot)
      rendererRef.current = null
      cameraRef.current = null

      const snap = getSnapshot()
      if (snap.rendererCount === 0) {
        dispose()
        hasInitRef.current = false
      }
    }
  }, [canvasId, panel, player1, player2])

  if (!panel) {
    return (
      <div className="flex items-center justify-center w-full h-full text-red-500 text-sm font-mono">
        Invalid canvasId: {canvasId}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} id={canvasId} className="w-full h-full block" />
      {isGameOver && <ParkourEndCredits
        playerId={panel.playerId}
        player1={player1}
        player2={player2}
        onPlayAgain={handleRestart}
        onBackToSelect={handleBackToCharacterSelect}
      />}
    </div>
  )
}

// Renders the shared end-credits roll for parkour. The cast value is each
// player's cumulative time across all three stages (lower wins); the winner
// comes from the run's final result.
function ParkourEndCredits({ playerId, player1, player2, onPlayAgain, onBackToSelect }) {
  const isP1 = playerId === 'p1'
  const oppId = isP1 ? 'p2' : 'p1'

  const { totals, winner } = calculateFinalResult(getSnapshot().stageResults)

  const me = isP1 ? player1 : player2
  const opp = isP1 ? player2 : player1
  const myChar = CHARACTERS.find((c) => c.id === me?.avatarKey) ?? CHARACTERS[0]
  const oppChar = CHARACTERS.find((c) => c.id === opp?.avatarKey) ?? CHARACTERS[1]
  const myName = me?.name || (isP1 ? 'Player 1' : 'Player 2')
  const oppName = opp?.name || (isP1 ? 'Player 2' : 'Player 1')

  return (
    <EndCredits
      title="Parkour"
      outcome={winner === 'tie' ? 'tie' : winner === playerId ? 'win' : 'lose'}
      valueLabel="Total Time"
      subtitle="Fastest cumulative time across all 3 stages wins"
      myChar={myChar}
      myName={myName}
      myValue={formatRaceTime(totals[playerId])}
      oppChar={oppChar}
      oppName={oppName}
      oppValue={formatRaceTime(totals[oppId])}
      playAgainKey={null}
      onPlayAgain={onPlayAgain}
      onBackToSelect={onBackToSelect}
    />
  )
}
