import test from "node:test";
import assert from "node:assert/strict";

import {
  ENGLISH_DUNGEON_ID,
  TOWN_LOCATIONS,
  calculateCorrectCount,
  getRewardForCorrectCount,
  summarizeEnglishDungeonRun,
  validateDungeonAnswers,
  getTownStatus,
} from "../shared/villageCore.js";

test("english dungeon summary computes score and reward from answers", () => {
  const answers = [0, 1, 2, 1, 2];
  const summary = summarizeEnglishDungeonRun(answers);

  assert.equal(summary.correctCount, 5);
  assert.equal(summary.rewardPoints, 3);
  assert.equal(summary.dungeonId, ENGLISH_DUNGEON_ID);
});

test("calculateCorrectCount counts only correct answers", () => {
  const answers = [0, 0, 2, 2, 2];

  assert.equal(calculateCorrectCount(answers), 3);
  assert.equal(getRewardForCorrectCount(3), 1);
});

test("validateDungeonAnswers rejects malformed payloads", () => {
  assert.equal(validateDungeonAnswers([0, 1, 2, 1, 2]), true);
  assert.equal(validateDungeonAnswers([0, 1, 2]), false);
  assert.equal(validateDungeonAnswers([0, 1, 2, 1, 9]), false);
  assert.equal(validateDungeonAnswers("01212"), false);
});

test("getTownStatus unlocks locations progressively", () => {
  const earlyTown = getTownStatus(10);
  const lateTown = getTownStatus(36);

  assert.deepEqual(
    earlyTown.unlocked.map((location) => location.id),
    [TOWN_LOCATIONS[0].id]
  );
  assert.equal(earlyTown.next?.id, TOWN_LOCATIONS[1].id);
  assert.equal(lateTown.unlocked.length, TOWN_LOCATIONS.length);
  assert.equal(lateTown.next, null);
});
