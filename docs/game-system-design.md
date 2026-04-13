# Game System Design

## 1. Purpose

This document defines a phased design for adding student-facing game systems to the Class Point System without making the project too large to manage at once.

The goal is to:

- increase student engagement
- keep the existing teacher point workflow intact
- avoid insecure client-side reward logic
- introduce larger features in safe stages

## 2. Current System Summary

The current app is a single-page React app centered around one main Firestore document:

- `app/data`: classes, students, points, shop, notices
- `requests`: student purchase and PIN-change requests

Current constraints:

- students do not use authenticated Firebase accounts
- students enter with class selection and a PIN
- students cannot safely be trusted to calculate rewards on the client
- teacher approval already exists and is the current trusted write path

This means any feature that gives random rewards or automatic point payouts must be designed carefully.

## 3. Product Direction

We will build the game layer in stages.

### Stage 1: Safe progression systems

These features are derived from existing point data and do not require server-side randomness.

- Avatar Evolution
- Top 5 Avatar Showcase
- Class Village

### Stage 2: Server-controlled random systems

These features require trusted server-side logic.

- Gacha
- Mystery Box Event
- Real-time event ticker

### Stage 3: Teacher operations and live events

- teacher event controls
- reward coupon management
- event scheduling
- audit logs and abuse controls

## 4. Recommended Release Order

### Release 1

Build a visible progression loop first.

- student avatar evolution
- title system
- class top-5 avatar preview
- class village progress

Reason:

- low security risk
- high visual payoff
- minimal workflow change for the teacher

### Release 2

Introduce server-side randomness.

- point gacha
- mystery box
- reward logs
- ticker feed

Reason:

- requires backend trust boundary
- should only come after the data model is stable

## 5. Core Experience Design

## 5.1 Avatar Evolution

Each student gets a persistent avatar identity.

Base evolution path:

- Egg
- Baby
- Growth
- Final Evolution

Evolution is based on cumulative point milestones, not current spendable points.

Suggested model:

- `points`: current spendable points
- `lifetimePoints`: all points ever earned
- `avatar.stage`: derived from `lifetimePoints`

This prevents students from losing evolution progress when they spend points.

Suggested thresholds:

- Egg: default
- Baby: 20 lifetime points
- Growth: 60 lifetime points
- Final Evolution: 120 lifetime points

Optional visual expansion later:

- elemental themes
- class-specific skins
- title badges
- rare overlays from gacha

## 5.2 Top 5 Avatar Showcase

Show the current top 5 students on the home screen or student ranking screen.

Display:

- avatar
- student name
- class
- current points
- title

Purpose:

- creates social visibility
- connects points to identity
- makes ranking feel more alive than plain numbers

## 5.3 Class Village

Each class or the whole school view can have a village that grows from point accumulation.

Recommended first version:

- one village per class
- village progress based on total class lifetime points

Suggested unlocks:

- Stage 1: Snack Shop
- Stage 2: Gym
- Stage 3: Library
- Stage 4: Festival Square

Each unlocked building can later map to a teacher-controlled class reward.

Example:

- Snack Shop -> snack coupon
- Gym -> class activity bonus
- Library -> reading reward

Important:

Village growth should be progression-only and should not go backward when students spend points.
Use class lifetime points, not current class points.

## 5.4 Gacha

Students spend points to roll for:

- cosmetic skins
- title badges
- visual effects
- very small bonus point rewards

Do not let the client determine outcomes.

Recommended categories:

- Common
- Rare
- Epic
- Legendary

Important design rule:

Most gacha rewards should be cosmetic. If point rewards are allowed, they should be tightly capped.

## 5.5 Mystery Box Event

This is a limited-time event page.

Students spend points to open a box.

Possible outcomes:

- bonus points
- no reward
- cosmetic reward
- fun classroom mission
- class coupon fragment

This should be seasonal or teacher-activated, not always available.

## 6. Trust and Security Model

## 6.1 Safe Rule

Any feature that changes rewards, items, or random outcomes must be decided on the server.

## 6.2 Approved Architecture

### Option A: Cloud Functions

Recommended for:

- gacha
- mystery box
- event ticker
- server-side validation

Flow:

1. student submits a request
2. Cloud Function verifies identity and state
3. Cloud Function calculates result
4. Cloud Function updates Firestore
5. client listens for the result

### Option B: Teacher Approval

Recommended only for:

- physical rewards
- exceptional manual rewards
- temporary fallback before backend is ready

Not recommended for high-frequency actions like gacha because it creates too much teacher overhead.

## 6.3 Student Identity Risk

The current system uses PIN-based access without Firebase student auth.

This means a server function cannot rely on `request.auth.uid` for students.

Because of that, Stage 2 should use one of these patterns:

### Pattern 1: Signed student session token

- student enters class and PIN
- server verifies student
- server issues a short-lived session token
- game functions require that token

This is the stronger long-term option.

### Pattern 2: Teacher-approved random actions

- easier short-term fallback
- lower engineering cost
- higher teacher workload

Recommendation:

Use Pattern 2 only if we want a fast prototype. Use Pattern 1 for production-grade gacha.

## 7. Data Model Proposal

The current `app/data` document should stay focused on current state, not event history.

## 7.1 Student Shape

Add the following fields to each student:

```js
{
  id: "c1_s1",
  name: "Student 1",
  pin: "1001",
  points: 12,
  lifetimePoints: 34,
  history: [],
  purchases: [],
  avatar: {
    creatureId: "seedling",
    stage: "baby",
    skin: "default",
    title: "Rising Star"
  },
  inventory: {
    skins: ["default"],
    titles: ["Rising Star"],
    effects: []
  },
  stats: {
    gachaCount: 0,
    mysteryBoxCount: 0
  }
}
```

## 7.2 Class Shape

Add class progression fields:

```js
{
  id: "c1",
  name: "G6 Tulip",
  color: "#FF6B6B",
  emoji: "...",
  village: {
    level: 1,
    unlockedBuildings: ["snack-shop"]
  },
  lifetimeClassPoints: 320,
  students: []
}
```

## 7.3 New Collections

Add new collections instead of overloading `app/data`.

- `gameEvents`
- `gachaLogs`
- `mysteryBoxLogs`
- `ticker`
- `coupons`

Purpose:

- audit trail
- easier admin filtering
- real-time updates
- reduced risk of one huge document growing forever

## 8. Derived Values

These values should be computed from trusted stored fields.

- avatar stage from `lifetimePoints`
- class village level from `lifetimeClassPoints`
- top 5 ranking from current `points`
- unlocked titles from rules or inventory

This keeps UI logic simple and deterministic.

## 9. UI Architecture

The current app is too centralized in `src/App.jsx` for safe growth.

Before feature implementation, split the UI into modules.

Recommended structure:

- `src/app/`
- `src/features/student/`
- `src/features/admin/`
- `src/features/games/`
- `src/features/village/`
- `src/lib/`

Suggested first extraction:

- student dashboard
- shop
- ranking
- avatar card
- village card
- request handling utilities

## 10. Firestore Rule Direction

### Stage 1

No major rule expansion is required if avatar evolution and village progress are derived from teacher-controlled point data.

### Stage 2

If Cloud Functions are added:

- students should not directly write gacha results
- only functions should write reward outcomes
- client may only create narrow, validated request documents if needed

Rule principle:

- student write permissions stay narrow
- reward application stays server-side

## 11. Implementation Roadmap

## 11.1 Milestone 1: Foundation Refactor

- split `App.jsx` into feature modules
- introduce student expansion fields
- add shared data helpers
- keep behavior unchanged

Deliverable:

- cleaner codebase with no visible feature change

## 11.2 Milestone 2: Avatar Evolution

- add avatar card to student dashboard
- compute evolution stage from `lifetimePoints`
- add title display
- surface top 5 avatars

Deliverable:

- first visible game-like progression system

## 11.3 Milestone 3: Class Village

- compute class lifetime point total
- render village progression card
- show next building unlock goal
- optionally show unlocked coupon placeholders

Deliverable:

- collaborative class progression loop

## 11.4 Milestone 4: Backend Prep

- define Cloud Functions project structure
- choose session verification approach
- define request/result collections
- define logs and ticker schema

Deliverable:

- backend design ready for random systems

## 11.5 Milestone 5: Gacha

- add gacha page
- add point spend flow
- add server-side random result logic
- update inventory and logs

Deliverable:

- secure cosmetic reward loop

## 11.6 Milestone 6: Mystery Box Event

- add event page and time window
- add function-controlled reward results
- add ticker announcement stream

Deliverable:

- limited-time excitement feature

## 12. Recommended First Build

The best first implementation is:

- refactor foundation
- avatar evolution
- top 5 showcase
- class village

Do not build gacha first.

Reason:

- it adds complexity before the data model is ready
- it needs a stronger trust boundary
- it will be easier and safer after Stage 1 data fields exist

## 13. Open Decisions

These should be finalized before implementation:

1. Should villages be per class or shared across all classes?
2. Should avatar evolution be based on current points or lifetime points?
3. Should titles be earned automatically or mostly via gacha?
4. When Stage 2 starts, do we want a prototype teacher-approved flow or full Cloud Functions?

## 14. Final Recommendation

Build in this order:

1. Foundation refactor
2. Avatar evolution
3. Top 5 showcase
4. Class village
5. Cloud Functions backend
6. Gacha
7. Mystery box

This gives the project a clear path from simple and safe features to larger, more exciting systems without losing control of scope.
