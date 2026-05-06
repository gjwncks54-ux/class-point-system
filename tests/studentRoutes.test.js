import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_STUDENT_PATH,
  getPathForStudentDestination,
  getStudentTabForPath,
  isDungeonPath,
  normalizeStudentPath,
} from "../shared/studentRoutes.js";

test("normalizeStudentPath keeps supported student routes and falls back otherwise", () => {
  assert.equal(normalizeStudentPath("/profile"), "/village");
  assert.equal(normalizeStudentPath("/village"), "/village");
  assert.equal(normalizeStudentPath("/dungeon/english"), "/dungeon/english");
  assert.equal(normalizeStudentPath("/profile-mvp"), "/village");
  assert.equal(normalizeStudentPath("/unknown"), DEFAULT_STUDENT_PATH);
});

test("getPathForStudentDestination resolves hall and dungeon routes", () => {
  assert.equal(getPathForStudentDestination("profile"), "/village");
  assert.equal(getPathForStudentDestination("hall"), "/hall");
  assert.equal(getPathForStudentDestination("ranking"), "/hall");
  assert.equal(getPathForStudentDestination("dungeon-english"), "/dungeon/english");
});

test("getStudentTabForPath maps hall to ranking and dungeon to village context", () => {
  assert.equal(getStudentTabForPath("/profile"), "village");
  assert.equal(getStudentTabForPath("/hall"), "ranking");
  assert.equal(getStudentTabForPath("/dungeon/english"), "village");
  assert.equal(isDungeonPath("/dungeon/english"), true);
});

test("legacy profile routes canonicalize to village while profile is disabled", () => {
  assert.equal(getStudentTabForPath("/profile-mvp"), "village");
  assert.equal(isDungeonPath("/profile-mvp"), false);
});
