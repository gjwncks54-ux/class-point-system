import test from "node:test";
import assert from "node:assert/strict";

import {
  DENNIS_VILLAGE_BUILDINGS,
  DENNIS_VILLAGE_QUESTIONS,
  answerDennisVillageQuestion,
  buyDennisVillageBuilding,
  createDennisVillageState,
  getDennisVillageLeaderboard,
  getDennisVillageWeekId,
  getPreviousDennisVillageWeekId,
  getRandomDennisVillageQuestion,
  shuffleDennisVillageQuestionOptions,
} from "../shared/dennisVillageCore.js";

test("dennis village week id rolls from Monday local date", () => {
  assert.equal(getDennisVillageWeekId(new Date("2026-05-06T12:00:00+09:00")), "2026-05-04");
  assert.equal(getDennisVillageWeekId(new Date("2026-05-10T12:00:00+09:00")), "2026-05-04");
  assert.equal(getDennisVillageWeekId(new Date("2026-05-11T00:00:00+09:00")), "2026-05-11");
  assert.equal(getPreviousDennisVillageWeekId(new Date("2026-05-11T12:00:00+09:00")), "2026-05-04");
});

test("dennis village week id is pinned to Korea time even on UTC servers", () => {
  assert.equal(getDennisVillageWeekId(new Date("2026-05-10T15:30:00Z")), "2026-05-11");
  assert.equal(getPreviousDennisVillageWeekId(new Date("2026-05-10T15:30:00Z")), "2026-05-04");
});

test("correct quiz answer grants weekly gold, xp, and correct count", () => {
  const firstQuestion = DENNIS_VILLAGE_QUESTIONS[0];
  const state = createDennisVillageState({
    classId: "c1",
    className: "G3 Green",
    studentId: "s1",
    studentName: "Luna",
    now: new Date("2026-05-06T12:00:00+09:00"),
  });

  const next = answerDennisVillageQuestion(state, {
    questionId: firstQuestion.id,
    selectedIndex: firstQuestion.answer,
    now: 1778040000000,
  });

  assert.equal(next.gold, 40);
  assert.equal(next.xp, 10);
  assert.equal(next.weeklyCorrect, 1);
  assert.equal(next.lastQuiz.correct, true);
});

test("wrong quiz answer applies a safe gold penalty", () => {
  const firstQuestion = DENNIS_VILLAGE_QUESTIONS[0];
  const wrongAnswer = firstQuestion.options.findIndex((_, index) => index !== firstQuestion.answer);
  const state = {
    ...createDennisVillageState({
      classId: "c1",
      className: "G3 Green",
      studentId: "s1",
      studentName: "Luna",
      now: new Date("2026-05-06T12:00:00+09:00"),
    }),
    gold: 3,
  };

  const next = answerDennisVillageQuestion(state, {
    questionId: firstQuestion.id,
    selectedIndex: wrongAnswer,
    now: 1778040000000,
  });

  assert.equal(next.gold, 0);
  assert.equal(next.xp, 0);
  assert.equal(next.weeklyCorrect, 0);
  assert.equal(next.lastQuiz.correct, false);
});

test("csv quiz bank omits type metadata and loads word questions", () => {
  assert.equal(DENNIS_VILLAGE_QUESTIONS.length, 3600);
  assert.deepEqual(DENNIS_VILLAGE_QUESTIONS[0], {
    id: "word-0001",
    prompt: "act",
    options: ["후보자·지원자", "행동", "진전·발전", "시골의"],
    answer: 1,
  });
  assert.equal("type" in DENNIS_VILLAGE_QUESTIONS[0], false);
});

test("random question picker does not walk sequentially and avoids immediate repeats", () => {
  const questions = [
    { id: "a", prompt: "A", options: ["1", "2", "3", "4"], answer: 0 },
    { id: "b", prompt: "B", options: ["1", "2", "3", "4"], answer: 1 },
    { id: "c", prompt: "C", options: ["1", "2", "3", "4"], answer: 2 },
  ];

  assert.equal(getRandomDennisVillageQuestion(questions, () => 0.8).id, "c");
  assert.equal(getRandomDennisVillageQuestion(questions, () => 0.8, "c").id, "a");
});

test("shuffleDennisVillageQuestionOptions randomizes choices while preserving the correct original index", () => {
  const question = {
    id: "sample",
    prompt: "sample",
    options: ["A", "B", "C", "D"],
    answer: 1,
  };
  const shuffled = shuffleDennisVillageQuestionOptions(question, () => 0);

  assert.deepEqual(
    shuffled.choices.map((choice) => choice.text),
    ["B", "C", "D", "A"]
  );
  assert.equal(shuffled.choices[0].originalIndex, 1);
  assert.equal(shuffled.answerChoice.text, "B");
});

test("building purchase spends gold and adds production", () => {
  const state = {
    ...createDennisVillageState({
      classId: "c1",
      className: "G3 Green",
      studentId: "s1",
      studentName: "Luna",
      now: new Date("2026-05-06T12:00:00+09:00"),
    }),
    gold: 80,
  };

  const next = buyDennisVillageBuilding(state, "farm", 1778040000000);

  assert.equal(next.gold, 30);
  assert.equal(next.buildings.farm, 1);
  assert.equal(next.goldPerSecond, DENNIS_VILLAGE_BUILDINGS[0].production);
});

test("leaderboard ranks gold and quiz leaders separately", () => {
  const leaderboard = getDennisVillageLeaderboard([
    { studentId: "s1", studentName: "Luna", gold: 120, weeklyCorrect: 4 },
    { studentId: "s2", studentName: "Mina", gold: 90, weeklyCorrect: 9 },
    { studentId: "s3", studentName: "Kai", gold: 180, weeklyCorrect: 2 },
  ]);

  assert.equal(leaderboard.goldLeaders[0].studentName, "Kai");
  assert.equal(leaderboard.quizLeaders[0].studentName, "Mina");
});
