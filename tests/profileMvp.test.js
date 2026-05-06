import test from "node:test";
import assert from "node:assert/strict";

import {
  PROFILE_MVP_AVATARS,
  buildStudentProfileMvp,
  estimateLifetimePoints,
  getLevelFromLifetimePoints,
  getProfileMvpRarityStyle,
  getUnlockedProfileAvatars,
} from "../shared/profileMvp.js";

test("estimateLifetimePoints prefers the best available progression signal", () => {
  assert.equal(
    estimateLifetimePoints({
      points: 4,
      lifetimePoints: 12,
      history: [{ pts: 3 }, { pts: -2 }, { pts: 6 }],
    }),
    12
  );

  assert.equal(
    estimateLifetimePoints({
      points: 2,
      history: [{ pts: 3 }, { pts: -1 }, { pts: 5 }],
    }),
    8
  );
});

test("getLevelFromLifetimePoints returns the active band and next target", () => {
  assert.deepEqual(getLevelFromLifetimePoints(0), {
    level: 1,
    currentLevelMin: 0,
    nextLevel: 2,
    nextLevelMin: 5,
    pointsIntoLevel: 0,
    pointsToNextLevel: 5,
    progressPercent: 0,
  });

  assert.deepEqual(getLevelFromLifetimePoints(31), {
    level: 5,
    currentLevelMin: 30,
    nextLevel: 6,
    nextLevelMin: 45,
    pointsIntoLevel: 1,
    pointsToNextLevel: 14,
    progressPercent: 7,
  });
});

test("getUnlockedProfileAvatars exposes only avatars at or below the student level", () => {
  assert.deepEqual(
    getUnlockedProfileAvatars(1).map((avatar) => avatar.id),
    PROFILE_MVP_AVATARS.filter((avatar) => avatar.unlockLevel <= 1).map((avatar) => avatar.id)
  );

  assert.deepEqual(
    getUnlockedProfileAvatars(5).map((avatar) => avatar.id),
    [
      "ember-fox",
      "scholar-tabby",
      "shadow-wolf",
      "owl-sage",
      "mouse-brewer",
      "lion-captain",
      "deer-archer",
      "raccoon-bard",
      "witch-cat",
      "bulldog-guard",
    ]
  );
});

test("buildStudentProfileMvp falls back to the first unlocked avatar when the saved one is locked", () => {
  const profile = buildStudentProfileMvp({
    cls: { id: "c5", name: "G3 Green" },
    student: {
      id: "c5_s1",
      name: "Luna",
      points: 6,
      history: [{ pts: 4 }, { pts: 8 }],
      profile: { avatarId: "town-champion" },
    },
  });

  assert.equal(profile.level.level, 3);
  assert.equal(profile.lifetimePoints, 12);
  assert.equal(profile.equippedAvatar.id, "ember-fox");
  assert.equal(profile.unlockedAvatars.length, 6);
  assert.equal(profile.lockedAvatars.at(-1).id, "violet-drake");
});

test("getProfileMvpRarityStyle returns the expected effect palette", () => {
  const epicStyle = getProfileMvpRarityStyle("epic");
  const fallbackStyle = getProfileMvpRarityStyle("missing");

  assert.equal(epicStyle.label, "Epic");
  assert.match(epicStyle.aura, /radial-gradient/i);
  assert.equal(fallbackStyle.label, "Common");
});
