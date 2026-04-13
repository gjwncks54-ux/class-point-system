# Claude Review Brief

## Project Summary

This is a React + Firebase classroom point system.

Current student flow:

- students log in with class selection + 4-digit PIN
- students can view points, ranking, shop, history, and PIN info
- teacher manages points and approvals through the admin side

We are evolving it into a game-style system with a town lobby and dungeon entry flow.

## What Was Added

We added a new student `Town` tab with:

- a town-style main lobby using pixel-art background assets
- clickable building hotspots
- a rotating live-ticker style message area
- a playable `English Academy` dungeon MVP
- direct routing from the town UI into existing `Shop` and `Ranking` tabs

The current dungeon is a front-end MVP only:

- 5 English questions
- local result screen
- reward preview only
- no Cloud Functions wiring yet

## Current Goal

We want feedback on whether this is the right frontend/game architecture before connecting backend security flows such as:

- `enterDungeon`
- `completeGame`
- `processGacha`

## Feedback Questions

1. Does the `Town -> Building -> Dungeon -> Result` flow feel like a strong foundation for a classroom game system?
2. Is the `Town` UI a good lobby structure for expanding into more buildings, mini-games, gacha, and real-time events?
3. Before adding Cloud Functions, what frontend or state-structure changes would you recommend first?
4. Would you keep this as a tab-based experience inside the current app, or start moving dungeon/game screens into their own route structure?

## Files To Review

Attach these files:

- `src/ClassVillageMVP.jsx`
- `src/App.jsx`
- `docs/game-system-design.md`
- `docs/asset-credits.md`

If you want to reduce context, the most important files are:

- `src/ClassVillageMVP.jsx`
- `src/App.jsx`

## Screenshots To Include

Recommended screenshots:

1. Student dashboard with `Town` tab open
2. Town lobby with building hotspots visible
3. `English Academy` intro modal
4. Dungeon question screen
5. Dungeon result screen

## Notes For Review

- The app currently still uses a large `App.jsx`
- Firebase data is still centered around the existing app structure
- Cloud Functions are planned but not implemented yet
- The current town system is meant to validate product direction, not backend trust/security yet
