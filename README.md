# Booth — CWTS Gaming Platform

A 100% client-side, 2-player local multiplayer web platform. Two games run **side-by-side** in a 50/50 split-screen layout, both controlled from a single keyboard. Players pick characters on a shared landing screen, then each panel independently runs whichever game is selected.

**Tech stack:** Vite · React 19 · Tailwind CSS v4 · Zustand · HTML5 Canvas (or Phaser 3 per game)

---

## Quick Setup

**Prerequisites:** Node.js 18+ and npm

```bash
# 1. Clone the repo
git clone <repo-url>
cd Booth-cwts-web

# 2. Install dependencies (all deps live in frontend/)
cd frontend
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` (or the next available port shown in the terminal).

---

## Project Structure

```
Booth-cwts-web/
├── frontend/
│   ├── src/
│   │   ├── games/
│   │   │   ├── registry.js          ← register your game here
│   │   │   └── pong/
│   │   │       └── PongGame.jsx     ← example game component
│   │   ├── components/
│   │   │   └── landing_page/
│   │   │       ├── MenuScreen.jsx   ← title screen
│   │   │       ├── CharacterSelect.jsx
│   │   │       └── LineDivider.jsx
│   │   ├── store/
│   │   │   └── useGameStore.js      ← Zustand global state
│   │   ├── App.jsx                  ← root layout + input system
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/
    └── server.js                    ← placeholder, unused for now
```

---

## App Flow

```
LANDING_PAGE  →  CHARACTER_SELECT  →  PLAYING
  MenuScreen       CharacterSelect      App (split-screen)
```

Both players choose a character and press **Ready**. Once both are ready the **Fight!** button appears. Hitting it transitions the whole screen to the split-screen game view.

---

## Available Scripts

Run these from the `frontend/` directory.

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format all files |
| `npm run test` | Vitest one-shot run |
| `npm run test:watch` | Vitest in watch mode |

---

---

# Game Developer Guide

This section is for teammates building individual games. Each game lives in its own folder and plugs into the platform through a single registry file. You do **not** need to touch any core platform code.

---

## Step 1 — Create your game folder

```
frontend/src/games/<your-game-name>/
```

Example: `frontend/src/games/snake/`

Create your main component file inside it:

```
frontend/src/games/snake/SnakeGame.jsx
```

---

## Step 2 — Implement the game component

Your component **must** accept exactly these four props:

```jsx
export default function SnakeGame({ canvasId, player1, player2, pressedKeys }) {
  // your game logic here
}
```

| Prop | Type | Description |
|---|---|---|
| `canvasId` | `string` | Unique ID to assign to your `<canvas>` element. Use this so two instances don't collide. |
| `player1` | `{ name: string, avatarKey: string }` | Left-side player's name and chosen character. |
| `player2` | `{ name: string, avatarKey: string }` | Right-side player's name and chosen character. |
| `pressedKeys` | `Set<string>` | Live set of currently held keys. Read this every frame to drive movement. |

**`avatarKey`** will be one of: `joy` · `sadness` · `anger` · `fear` · `disgust` · `anxiety` · `envy` · `embarrassment` · `ennui`

---

## Step 3 — Read input from `pressedKeys`

The platform captures all keyboard events globally and gives you a live `Set<string>` of every key that is currently held down. **Do not** add your own `window.addEventListener('keydown')` — it will conflict with the platform and cause both panels to respond to the same input.

```jsx
// Inside a useEffect game loop:
if (pressedKeys.has('w')) { /* player 1 move up */ }
if (pressedKeys.has('s')) { /* player 1 move down */ }
if (pressedKeys.has('g')) { /* player 1 action  */ }

if (pressedKeys.has('i')) { /* player 2 move up    */ }
if (pressedKeys.has('k')) { /* player 2 move down  */ }
if (pressedKeys.has("'")) { /* player 2 action     */ }
```

### Full key map

| | Player 1 (left panel) | Player 2 (right panel) |
|---|---|---|
| Up | `w` | `i` or `ArrowUp` |
| Left | `a` | `j` or `ArrowLeft` |
| Down | `s` | `k` or `ArrowDown` |
| Right | `d` | `l` or `ArrowRight` |
| Action / Shoot | `g` | `'` (single quote) or `5` (Numpad) |

> Key strings match the browser's `KeyboardEvent.key` value exactly — they are **case-sensitive**. Lowercase letters only (e.g. `'w'`, not `'W'`).

---

## Step 4 — Register your game

Open `frontend/src/games/registry.js` and add an entry:

```js
import PongGame  from './pong/PongGame.jsx'
import SnakeGame from './snake/SnakeGame.jsx'   // ← add your import

const registry = [
  { id: 'pong',  name: 'Pong',  component: PongGame  },
  { id: 'snake', name: 'Snake', component: SnakeGame }, // ← add your entry
]

export default registry
```

That's it. Your game will immediately appear in the dropdown selector on each panel.

---

## Canvas setup example

If your game uses an HTML5 Canvas, use the `canvasId` prop as the element's `id` so each panel gets its own independent canvas:

```jsx
import { useEffect, useRef } from 'react'

export default function SnakeGame({ canvasId, player1, player2, pressedKeys }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frameId

    function loop() {
      // read input
      if (pressedKeys.has('w')) { /* move up */ }

      // draw
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // ... your draw calls

      frameId = requestAnimationFrame(loop)
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [pressedKeys])

  return (
    <canvas
      id={canvasId}
      ref={canvasRef}
      width={800}
      height={600}
      className="w-full h-full"
    />
  )
}
```

---

## Quick checklist before you push

- [ ] Component is a **default export**
- [ ] Component accepts `{ canvasId, player1, player2, pressedKeys }` exactly
- [ ] Input is read from `pressedKeys` — no direct `window.addEventListener` calls
- [ ] Game is added to `registry.js` with a unique `id` and display `name`
- [ ] No keys conflict with existing bindings (see key map above)
- [ ] Canvas uses `id={canvasId}` (not a hardcoded string)

---

## Git conventions

- Branch names: `feature/<name>` or `fix/<name>`
- No conventional-commit prefix required
