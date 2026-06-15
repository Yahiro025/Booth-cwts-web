# Architectural Scaffolding Prompt for AI/Lead Developer

### Role and Context
You are an expert system architect and senior frontend engineer building a custom web-based local arcade gaming hub. The application runs entirely client-side using Vite + React and Tailwind CSS. 

The core feature is a dual-viewport split-screen layout where two independent game instances run side-by-side (50vw each) on a single browser window. Multiple independent developers will be building 4 separate mini-games concurrently, so the architecture must remain highly modular, decoupled, and simple to interface with.

### Objective
Generate the architectural workspace directories and complete, production-ready scaffolding code components that establish the core state, unified single-keyboard input routing, and game registration interface. 

---

## Architectural Layout Specifications

```
    src/
    ├── components/
    │   └── LineDivider.jsx
    ├── games/
    │   ├── pong/
    │   │   └── PongGame.jsx
    │   └── registry.js
    ├── store/
    │   └── useGameStore.js
    ├── App.jsx
    └── main.jsx
```

### 1. Global Session State Store (src/store/useGameStore.js)
* Construct a lightweight client-side state machine using Zustand. 
* Track currentPhase string values ('LANDING_PAGE' vs. 'GAMEPLAY').
* Secure an object schema for player1 and player2 that manages their input name (string) and selected avatar key identifier (string). No backend database integrations or persistence hooks are needed.

### 2. High-Performance Input Dispatcher and Central Layout (src/App.jsx)
* Create a layout viewport component using Tailwind flex-row containers mapping out w-[50vw] bounds per game frame. Place a stylized, solid vertical line component directly in the screen center.
* Implement a singular global window.addEventListener key handler loop inside a React useEffect hook tracking keydown and keyup actions. 
* Aggregate active presses into a native JavaScript Set(). 
* Pass this shared input tracking object down to both game views as an immutable prop along with structural canvas properties. This step is critical to ensure keyboard actions for Player 1 (W,A,S,D,G) and Player 2 (I,J,K,L / Arrows + ' / Numpad 5) process simultaneously without key blocking or lagging input delays.

### 3. Decoupled Plug-and-Play Registration (src/games/registry.js)
* Design an extensible registry array tracking game meta configurations (id, name, and reference component). 
* Provide dynamic dropdown rendering structures on top of the left and right game panels so users can instantly switch between games inside their half of the screen.

### 4. Boilerplate Game Template (src/games/pong/PongGame.jsx)
* Write a standardized HTML5 Canvas prototype wrapper component.
* Expose a template showing how child developers intercept the parent's pressedKeys state updates inside their internal canvas engine animation rendering loop (requestAnimationFrame). 
* Implement clean element removal and unmount configurations (cancelAnimationFrame) to prevent active memory leaks when switching active games.

---

## Outputs Required
Deliver a production-ready repository scaffold script configuration following this design layout. Clean code only—omit visual emojis or markdown text fluff so files can easily be transferred into clean codebases.