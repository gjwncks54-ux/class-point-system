# Claude Review Packet

## What This Is

This is a single review packet for a React + Firebase classroom point system that is evolving into a game-style student experience.

The current review target is the new `Town` tab:

- town lobby / world map feeling
- clickable building hotspots
- live ticker
- playable English dungeon MVP
- bridge from lobby to shop and ranking

This packet is intentionally curated into one file so the reviewer can understand the direction quickly without opening the whole codebase first.

## Project Context

- Stack: React + Vite + Firebase Firestore
- Current auth style: class selection + 4-digit PIN
- Existing student features: points, shop, ranking, history, PIN
- Existing teacher features: point management and request approval

We are trying to turn the student side into:

`Town Lobby -> Building -> Mini-game / Feature -> Reward`

## Current Goal

We want feedback on whether this frontend/game structure is a strong foundation before connecting backend verification through Cloud Functions such as:

- `enterDungeon`
- `completeGame`
- `processGacha`

## Main Review Questions

1. Does the `Town -> Building -> Dungeon -> Result` flow feel like a good classroom game loop?
2. Is the `Town` tab a strong enough lobby structure for future expansion into more buildings, mini-games, gacha, and real-time events?
3. Before adding Cloud Functions, what frontend or state-structure changes would you recommend first?
4. Would you keep this as a tab inside the current app for now, or begin moving game screens into route-based pages?

## Current Design Direction

The `Town` tab is intended to feel like a world map lobby.

- Students open the town and see major buildings.
- Buildings are clickable hotspots.
- Locked buildings unlock based on class stars.
- The English building contains the first playable dungeon MVP.
- Shop and Ranking buildings bridge to existing app sections.

This is still frontend-only for now.

- Dungeon result is a reward preview only.
- No secure backend reward flow yet.
- Cloud Functions are planned for server-side verification later.

## Important Constraints

- The app still relies heavily on a large `src/App.jsx`
- Firebase data still follows the older app structure
- The town system currently validates product direction, not final backend security
- We are intentionally building step by step

## Relevant Files In The Real Project

- `src/ClassVillageMVP.jsx`
- `src/App.jsx`
- `docs/game-system-design.md`
- `docs/asset-credits.md`

If needed later, the full code can be shared too. This review packet only includes the most relevant parts.

## Key Integration Snippets

### 1. Town component import in App

```jsx
import { useState, useEffect, useRef } from "react";
import ClassVillageMVP from "./ClassVillageMVP";
```

### 2. Town tab added to student navigation

```jsx
[
  ["shop", "Shop"],
  ["village", "Town"],
  ["ranking", "Ranking"],
  ["purchases", "Purchases"],
  ["history", "History"],
  ["pin", "PIN"],
]
```

### 3. Town tab render hook

```jsx
{studentTab === "village" && (
  <ClassVillageMVP
    cls={cls}
    me={me}
    classRanked={classRanked}
    onOpenTab={setStudentTab}
    showToast={showToast}
    css={css}
    C={C}
  />
)}
```

## Town Lobby Data Model In The UI

### Building hotspots

```jsx
const TOWN_LOCATIONS = [
  {
    id: "school",
    name: "English Academy",
    subtitle: "Lv.1 Word Sprint",
    unlockAt: 0,
    accent: "#FF7043",
    top: "24%",
    left: "31%",
    description: "Jump into a short word dungeon and clear five English questions.",
    action: "dungeon",
  },
  {
    id: "forest",
    name: "Whisper Forest",
    subtitle: "Mini Games",
    unlockAt: 15,
    accent: "#26A69A",
    top: "25%",
    left: "60%",
    description: "A future zone for reaction games and boss raid events.",
    action: "forest",
  },
  {
    id: "hall",
    name: "Town Hall",
    subtitle: "Ranking Board",
    unlockAt: 25,
    accent: "#5C6BC0",
    top: "73%",
    left: "48%",
    description: "Check the class leaderboard and see who is carrying the town.",
    action: "ranking",
  },
  {
    id: "shop",
    name: "Star Market",
    subtitle: "Shop and Gacha",
    unlockAt: 35,
    accent: "#F9A825",
    top: "77%",
    left: "76%",
    description: "Spend stars on rewards now and evolve into a gacha plaza later.",
    action: "shop",
  },
];
```

### First dungeon question bank

```jsx
const WORD_DUNGEON_QUESTIONS = [
  {
    prompt: 'Choose the correct meaning of "library".',
    choices: ["A room for books", "A sports field", "A lunch menu", "A school bus"],
    answer: 0,
  },
  {
    prompt: 'Which word is the opposite of "cold"?',
    choices: ["Short", "Warm", "Slow", "Blue"],
    answer: 1,
  },
  {
    prompt: 'Pick the correct spelling.',
    choices: ["becaus", "beacause", "because", "becose"],
    answer: 2,
  },
  {
    prompt: 'Which sentence is correct?',
    choices: ["She go to school.", "She goes to school.", "She going school.", "She goed to school."],
    answer: 1,
  },
  {
    prompt: 'What does "borrow" mean?',
    choices: ["To keep forever", "To throw away", "To use and return later", "To sell quickly"],
    answer: 2,
  },
];
```

## Behavioral Summary Of The Town Component

The new `ClassVillageMVP` currently does these things:

- calculates class total points
- determines unlocked buildings
- rotates ticker messages based on ranking / purchases / progress
- renders a pixel-art town background
- places building hotspots on top of the town image
- opens a modal when a building is clicked
- runs a 5-question dungeon for `English Academy`
- shows a local reward preview after the run
- links `Town Hall` to the ranking tab
- links `Star Market` to the shop tab

## Representative UI Flow

### Town lobby

- world map image
- live ticker
- building hotspots
- class stars and progress cards

### English Academy modal

- dungeon intro
- rules
- start button

### Dungeon play

- 5 multiple-choice questions
- one answer at a time
- local result computation

### Result

- correct answer count
- local reward preview
- explanation that backend verification is the next step

## Architecture Intention

This is meant to become:

- `English Academy` -> word dungeon
- `Whisper Forest` -> mini-games / boss raid
- `Star Market` -> shop now, gacha later
- `Town Hall` -> ranking / leaderboard

Longer-term backend plan:

- start dungeon session on server
- verify duration / score on completion
- award points through transactions
- push ticker events from trusted writes

## Known Weaknesses Right Now

- `ClassVillageMVP.jsx` is large because it includes lobby, modal logic, and dungeon flow together
- `App.jsx` is still oversized overall
- Dungeon result is only a client-side preview
- No real route separation yet between lobby and game experiences
- No server-side verification yet

## What Kind Of Feedback Would Help Most

Please focus on:

- UI/UX structure
- component boundaries
- expansion path for more buildings and games
- whether this should remain tab-based or begin moving toward route-based pages
- whether the current Town component should be split before backend work begins

## Asset Note

The world-map MVP uses Kenney's `RPG Urban Kit` pixel-art assets under CC0.

## If A Full Follow-Up Review Is Needed

If this packet is not enough, the next files to send are:

- full `src/ClassVillageMVP.jsx`
- relevant slices of `src/App.jsx`
- `docs/game-system-design.md`
