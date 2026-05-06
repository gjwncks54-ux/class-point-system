import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDennisVillageAwardDismissKey,
  buildDennisVillageAwardNotice,
  hasDennisVillageAwardActivity,
} from "../src/lib/dennisVillageAwardNotice.js";

test("hasDennisVillageAwardActivity detects quiz, gold, and building activity", () => {
  assert.equal(hasDennisVillageAwardActivity({}), false);
  assert.equal(hasDennisVillageAwardActivity({ gold: 25, weeklyQuizCount: 0, weeklyCorrect: 0 }), false);
  assert.equal(hasDennisVillageAwardActivity({ weeklyQuizCount: 1 }), true);
  assert.equal(hasDennisVillageAwardActivity({ weeklyCorrect: 1 }), true);
  assert.equal(hasDennisVillageAwardActivity({ gold: 26 }), true);
  assert.equal(hasDennisVillageAwardActivity({ buildings: { farm: 1 } }), true);
});

test("buildDennisVillageAwardNotice returns a compact Korean reward notice model", () => {
  const weekId = "2026-05-04";
  const notice = buildDennisVillageAwardNotice({
    weekId,
    entries: [
      { studentId: "s1", gold: 25, weeklyQuizCount: 0 },
      { studentId: "s2", weeklyQuizCount: 2 },
      { studentId: "s3", buildings: { farm: 1 } },
    ],
  });

  assert.deepEqual(notice, {
    weekId,
    count: 2,
    dismissKey: buildDennisVillageAwardDismissKey(weekId),
  });
});

test("buildDennisVillageAwardNotice returns null when previous week has no activity", () => {
  assert.equal(
    buildDennisVillageAwardNotice({
      weekId: "2026-05-04",
      entries: [{ studentId: "s1", gold: 25, weeklyQuizCount: 0 }],
    }),
    null
  );
});
