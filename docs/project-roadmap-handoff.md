# Project Roadmap And Handoff

## 1. Project Summary

This project is a React + Firebase classroom point system that is being expanded into a game-style student experience.

Current long-term direction:

- `Town Lobby -> Building -> Dungeon / Feature -> Reward`
- student-facing world map and game loop
- teacher-managed point/admin tools remain intact
- later secure reward processing through Cloud Functions

Repository:

- GitHub: `https://github.com/gjwncks54-ux/class-point-system.git`
- Current branch target: `main`

## 2. Current State Snapshot

### Existing base system

Already present before this game expansion:

- student login by class + 4-digit PIN
- student tabs for points/shop/ranking/purchases/history/PIN
- teacher admin for class/student point management
- Firestore-based data storage

### New work completed in this phase

Implemented now:

- new student `Town` tab
- `ClassVillageMVP.jsx` world-map style lobby
- pixel-art town background asset integration
- clickable building hotspots
- Chromebook-first fixed layout refactor
- rotating live ticker area
- building side panel with lock/open states
- playable `English Academy` dungeon MVP
- bridge from town to existing `Shop` and `Ranking`
- design and handoff documents in `docs/`

### Important note

The current dungeon result is still a frontend reward preview only.

Not implemented yet:

- Cloud Functions
- secure server-side reward validation
- persistent dungeon sessions/logs
- real point awards from the new dungeon

## 3. Files To Know First

### Highest priority files

- `src/App.jsx`
- `src/ClassVillageMVP.jsx`
- `docs/game-system-design.md`
- `docs/project-roadmap-handoff.md`

### Supporting docs

- `docs/asset-credits.md`
- `docs/claude-review-brief.md`
- `docs/claude-review-packet.md`

### Assets

- `public/assets/village/kenney-rpg-urban/`

## 4. What The Current Town MVP Does

### Student flow

1. Student logs in with PIN
2. Student opens `Town` tab
3. Student sees:
   - main lobby header
   - live ticker
   - world map
   - clickable buildings
   - building list and town progress panel
4. Student can:
   - open `English Academy`
   - play a 5-question word dungeon
   - see local reward preview
   - jump to shop
   - jump to ranking

### Current buildings

- `English Academy`
- `Whisper Forest`
- `Town Hall`
- `Star Market`

## 5. Layout Decision Currently In Use

`ClassVillageMVP.jsx` is now optimized for Chromebook-like screens.

Target shape:

- 16:9 horizontal layout
- no mobile-first stacking
- no long vertical scrolling inside the town view
- fixed header + left map + right sidebar

Structure:

- Header: town title + live ticker + star badge
- Left: world map with hotspots
- Right:
  - 4 building cards
  - progress bar
  - class stars / next unlock summary

## 6. Current Technical Debt

These are known and expected:

- `src/App.jsx` is still very large
- `ClassVillageMVP.jsx` now contains lobby + modal + dungeon flow together
- Firebase structure is still based on the old app model
- no route separation yet for dungeon screens
- no trusted backend reward flow yet

## 7. Recommended Next Steps

This is the recommended order from here.

### Phase 1: Turn the dungeon into a real vertical slice

Goal:

- make `English Academy` actually award points securely

Tasks:

1. Add Cloud Functions project structure
2. Add `enterDungeon`
3. Add `completeGame`
4. Add session/log collections
5. Replace preview reward with server-validated reward

### Phase 2: Add backend data structures

Suggested collections:

- `gameSessions`
- `gameLogs`
- `ticker`
- `villageStatus`
- later `gachaLogs`

### Phase 3: Refactor frontend boundaries

Goal:

- make future expansion easier before more games are added

Tasks:

1. move town constants/config into separate files
2. move dungeon modal logic into dedicated components
3. create a client API layer for game/session calls
4. reduce direct view logic in `App.jsx`

### Phase 4: Add next gameplay zone

Recommended next gameplay after `English Academy`:

- `Whisper Forest`

Good candidates:

- reaction mini-game
- cooperative boss raid
- timed classroom event

### Phase 5: Expand the world system

After secure reward flow exists:

- gacha
- real-time ticker events from trusted writes
- item inventory
- avatar progression
- village progression using trusted point totals

## 8. Immediate Next Milestone

If resuming from another PC, start here:

### Milestone

`English Academy secure reward flow`

### Definition of done

- student enters dungeon
- server creates trusted session
- student finishes game
- score and play time are validated server-side
- point reward is written atomically
- town ticker can reflect the result

## 9. Suggested Firestore Direction

Current app still relies heavily on the old central data structure.

Short-term recommendation:

- keep current main app structure working
- add new collections for game/session/event data
- do not attempt a full database rewrite yet

Suggested additions:

- `gameSessions/{sessionId}`
- `gameLogs/{logId}`
- `ticker/{eventId}`
- `villageStatus/{classId}`

## 10. Suggested Cloud Functions To Add

### First batch

- `verifyStudentPin`
- `enterDungeon`
- `completeGame`

### Later batch

- `processGacha`
- `openMysteryBox`
- `postTickerEvent`

## 11. Suggested Frontend Refactor Order

Do not try to refactor the whole app at once.

Recommended order:

1. extract town config/constants
2. extract dungeon modal views
3. add `lib/gameApi.js`
4. then revisit `App.jsx`

This keeps forward progress while reducing risk.

## 12. Verification Commands

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev -- --host 127.0.0.1
```

### Production build

```bash
npm run build
```

## 13. How To Review The Current UI

1. open the app
2. choose `I'm a Student`
3. select a class
4. enter a student PIN
5. open the `Town` tab

Then test:

- building click
- `English Academy` intro
- word questions
- result flow
- `Shop` bridge
- `Ranking` bridge

## 14. Asset Note

Current town MVP uses:

- Kenney `RPG Urban Kit`
- stored in `public/assets/village/kenney-rpg-urban/`
- license details documented in `docs/asset-credits.md`

## 15. Recommended Handoff Message

If another PC/user resumes the work, the first instruction should be:

`Start from docs/project-roadmap-handoff.md, review src/ClassVillageMVP.jsx and src/App.jsx, then implement secure English Academy reward flow using Cloud Functions.`
