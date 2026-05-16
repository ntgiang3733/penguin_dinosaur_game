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

**Firebase Realtime Database** backs all game state. `src/firebase/gameService.js` contains every read/write operation. Rooms live at `rooms/{roomId}` with fields: `status`, `players/{player1,player2}`, `currentTurn`, `lastWord`, `words[]`, `turnStartTime`, `winner`, `finishReason`, `rule` (the active rule object). Finished games are archived to `gameHistory/{historyId}`. Real-time sync uses `onValue` listeners; disconnect cleanup uses `onDisconnect`.

**Word validation** (`src/utils/wordValidator.js`): validates via Free Dictionary API (`api.dictionaryapi.dev`), with in-memory `Map` cache. `checkGameRule(word, rule, lastWord)` dispatches to rule-specific validators: chain rule, min-length, start-with-letter, end-with-letter. Also provides `checkDuplicate()` and `checkMinLength()`.

**Game constants** (`src/constants/index.js`): `WIN_PONT = 50` (score to win), `TIME_PER_TURN = 30` (seconds per turn). Also exports `RULE_DEFS`, `pickRandomRule()`, and `getRuleDescription()` for the dynamic rules system (see below).

**Quick play** uses the fixed room ID `"PENGUIN_DINO"` with auto-fill logic for disconnected players (`joinDefaultRoom` in gameService.js).

**Timer** (`src/components/Timer.jsx`): SVG ring countdown driven by `turnStartTime` from Firebase. Only the player whose turn it is fires `handleTimeout` when reaching zero. The Timer is rendered inside the input-wrapper on GameBoard.

**Dynamic game rules** (`src/constants/index.js`): Each room gets a random rule on creation via `pickRandomRule()`. Rule types defined in `RULE_DEFS`: `chain` (default — new word must start with last letter of previous), `min_length` (chain + ≥5 chars), `start_with` (all words must start with a specific letter), `end_with` (all words must end with a specific letter). `getRuleDescription()` returns the human-readable description. Validation dispatches through `checkGameRule()` in `wordValidator.js`.

**Game history** (`src/components/GameHistory.jsx`, `getGameHistory()` in gameService.js): When a game finishes (score limit or timeout), a summary is written to `gameHistory/`. The Lobby has a "Xem Lịch Sử Game" button that shows recent games with expandable word chains.

**Styling**: Single `App.css` file (~1300 lines) with CSS custom properties for the dark theme, glass-morphism cards, and responsive breakpoints at 640px.
