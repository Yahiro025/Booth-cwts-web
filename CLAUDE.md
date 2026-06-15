# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dual-instance split-screen web gaming platform for 2-player local multiplayer on a single keyboard.

**Tech stack:** Vite + React, Tailwind CSS, Zustand, HTML5 Canvas or Phaser 3 (per-game choice)
**Package manager:** npm (dependencies live in `frontend/`)

## Project Structure

```
frontend/          # Vite + React app
  src/
    games/         # one subdirectory per game (e.g., src/games/pong/)
    test/          # Vitest setup
  public/
  index.html
  vite.config.js
  package.json

backend/           # Node.js server (placeholder)
  server.js
  package.json
```

Run the dev server from the `frontend/` directory:

```
cd frontend && npm run dev
```

## Game Component Contract

Every game lives in `frontend/src/games/<game-name>/` and must export a component that accepts exactly these props:

```ts
{ canvasId: string, player1: PlayerConfig, player2: PlayerConfig, pressedKeys: Set<string> }
```

## Input System

Games must **not** call `window.addEventListener('keydown')` or `'keyup'` directly. Read player input exclusively from the `pressedKeys` set, which is dispatched globally every frame by the platform.

**Player 1 (left side):** Move — W A S D · Action/Shoot — G
**Player 2 (right side):** Move — I J K L (or Arrow Keys) · Action/Shoot — `'` (single quote) or Numpad 5

## Available Scripts (run from `frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run test` | Vitest (one-shot) |
| `npm run test:watch` | Vitest (watch mode) |

## Git Conventions

- Branch names: `feature/<name>` or `fix/<name>`
- No conventional-commit prefix required
