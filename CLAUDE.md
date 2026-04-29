# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## Architecture

A two-player Vietnamese-language word chain game (React 19 + Vite 8 + Firebase Realtime Database). The entire UI is Vietnamese.

**State machine** (`src/App.jsx`): `lobby` → `waiting` → `playing` → `finished`. App owns state, passes it down; components are mostly presentational. No router — game state determines which component renders.

**Firebase Realtime Database** backs all game state. `src/firebase/gameService.js` contains every read/write operation. Rooms live at `rooms/{roomId}` with fields: `status`, `players/{player1,player2}`, `currentTurn`, `lastWord`, `words[]`, `turnStartTime`, `winner`, `finishReason`. Real-time sync uses `onValue` listeners; disconnect cleanup uses `onDisconnect`.

**Word validation** (`src/utils/wordValidator.js`): validates via Free Dictionary API (`api.dictionaryapi.dev`), with in-memory `Map` cache. Also enforces chain rule (first letter must match last letter of previous word) and duplicate detection.

**Game constants** (`src/constants/index.js`): `WIN_PONT = 50` (score to win), `TIME_PER_TURN = 25` (seconds per turn).

**Quick play** uses the fixed room ID `"PENGUIN_DINO"` with auto-fill logic for disconnected players (`joinDefaultRoom` in gameService.js).

**Timer** (`src/components/Timer.jsx`): SVG ring countdown driven by `turnStartTime` from Firebase. Only the player whose turn it is fires `handleTimeout` when reaching zero.

**Styling**: Single `App.css` file (~1300 lines) with CSS custom properties for the dark theme, glass-morphism cards, and responsive breakpoints at 640px.
