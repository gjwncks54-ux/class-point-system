import { DENNIS_VILLAGE_QUESTIONS } from "./dennisVillageQuestions.js";
import { getDennisVillageWeekId } from "./dennisVillageWeek.js";

export { DENNIS_VILLAGE_QUESTIONS } from "./dennisVillageQuestions.js";
export { getDennisVillageWeekId, getPreviousDennisVillageWeekId } from "./dennisVillageWeek.js";

export const DENNIS_VILLAGE_NAME = "Dennis Village";

export const DENNIS_VILLAGE_BUILDINGS = [
  {
    id: "farm",
    name: "Sunny Farm",
    role: "First income",
    cost: 50,
    production: 1,
    unlockLevel: 1,
    color: "#59B66D",
  },
  {
    id: "library",
    name: "Word Library",
    role: "Study boost",
    cost: 200,
    production: 4,
    unlockLevel: 3,
    color: "#4A90E2",
  },
  {
    id: "school",
    name: "Quiz School",
    role: "Core academy",
    cost: 500,
    production: 10,
    unlockLevel: 6,
    color: "#FF9D3D",
  },
  {
    id: "tower",
    name: "Focus Tower",
    role: "Late-game engine",
    cost: 1500,
    production: 30,
    unlockLevel: 10,
    color: "#8A63D2",
  },
  {
    id: "castle",
    name: "Dennis Castle",
    role: "Weekly crown",
    cost: 5000,
    production: 100,
    unlockLevel: 15,
    color: "#D99A1E",
  },
];

export const DENNIS_VILLAGE_START_GOLD = 25;
export const DENNIS_VILLAGE_QUIZ_REWARD_GOLD = 15;
export const DENNIS_VILLAGE_QUIZ_REWARD_XP = 10;
export const DENNIS_VILLAGE_QUIZ_PENALTY_GOLD = 5;
export const DENNIS_VILLAGE_BUILD_XP = 5;
export const DENNIS_VILLAGE_COST_GROWTH = 1.15;

export class DennisVillageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DennisVillageError";
    this.code = code;
  }
}

function toSafeNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function normalizeRandomValue(random) {
  const value = typeof random === "function" ? Number(random()) : Math.random();
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999, value));
}

export function getRandomDennisVillageQuestion(
  questions = DENNIS_VILLAGE_QUESTIONS,
  random = Math.random,
  previousQuestionId = null
) {
  const pool = Array.isArray(questions) && questions.length > 0 ? questions : DENNIS_VILLAGE_QUESTIONS;
  const index = Math.floor(normalizeRandomValue(random) * pool.length);

  if (pool.length > 1 && pool[index]?.id === previousQuestionId) {
    return pool[(index + 1) % pool.length];
  }

  return pool[index];
}

export function shuffleDennisVillageQuestionOptions(question, random = Math.random) {
  const choices = (question?.options || []).map((text, originalIndex) => ({
    text,
    originalIndex,
  }));

  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(normalizeRandomValue(random) * (index + 1));
    const current = choices[index];
    choices[index] = choices[swapIndex];
    choices[swapIndex] = current;
  }

  return {
    questionId: question?.id,
    prompt: question?.prompt,
    choices,
    answerChoice: choices.find((choice) => choice.originalIndex === question?.answer) || null,
  };
}

export function getDennisVillageBuildingCost(baseCost, owned) {
  return Math.floor(toSafeNumber(baseCost) * Math.pow(DENNIS_VILLAGE_COST_GROWTH, Math.max(0, toSafeNumber(owned))));
}

export function getDennisVillageXpForLevel(level) {
  return Math.floor(50 * Math.pow(Math.max(1, toSafeNumber(level)), 1.6));
}

export function getDennisVillageProduction(buildings = {}) {
  return DENNIS_VILLAGE_BUILDINGS.reduce(
    (sum, building) => sum + building.production * Math.max(0, toSafeNumber(buildings[building.id])),
    0
  );
}

function createEmptyBuildings() {
  return DENNIS_VILLAGE_BUILDINGS.reduce(
    (buildings, building) => ({
      ...buildings,
      [building.id]: 0,
    }),
    {}
  );
}

function applyLevelUps(state) {
  let level = Math.max(1, Math.floor(toSafeNumber(state.level)) || 1);
  let xp = Math.max(0, Math.floor(toSafeNumber(state.xp)));
  let needed = getDennisVillageXpForLevel(level);

  while (xp >= needed) {
    xp -= needed;
    level += 1;
    needed = getDennisVillageXpForLevel(level);
  }

  return {
    ...state,
    level,
    xp,
  };
}

function withDerived(state) {
  const goldPerSecond = getDennisVillageProduction(state.buildings);

  return {
    ...state,
    goldPerSecond,
    xpNeeded: getDennisVillageXpForLevel(state.level),
  };
}

export function createDennisVillageState({
  classId,
  className,
  studentId,
  studentName,
  now = Date.now(),
} = {}) {
  const time = now instanceof Date ? now.getTime() : toSafeNumber(now) || Date.now();

  return withDerived({
    weekId: getDennisVillageWeekId(new Date(time)),
    classId: String(classId || ""),
    className: String(className || ""),
    studentId: String(studentId || ""),
    studentName: String(studentName || ""),
    gold: DENNIS_VILLAGE_START_GOLD,
    level: 1,
    xp: 0,
    buildings: createEmptyBuildings(),
    weeklyCorrect: 0,
    weeklyQuizCount: 0,
    lastQuizAtMs: 0,
    lastTickAtMs: time,
    updatedAtMs: time,
    createdAtMs: time,
    lastQuiz: null,
  });
}

export function normalizeDennisVillageState(raw, fallback = {}) {
  const base = createDennisVillageState(fallback);
  const buildings = {
    ...base.buildings,
    ...(raw?.buildings || {}),
  };

  return withDerived({
    ...base,
    ...(raw || {}),
    classId: String(raw?.classId || fallback.classId || base.classId),
    className: String(raw?.className || fallback.className || base.className),
    studentId: String(raw?.studentId || fallback.studentId || base.studentId),
    studentName: String(raw?.studentName || fallback.studentName || base.studentName),
    weekId: String(raw?.weekId || fallback.weekId || base.weekId),
    gold: Math.max(0, Math.floor(toSafeNumber(raw?.gold ?? base.gold))),
    level: Math.max(1, Math.floor(toSafeNumber(raw?.level ?? base.level)) || 1),
    xp: Math.max(0, Math.floor(toSafeNumber(raw?.xp ?? base.xp))),
    buildings,
    weeklyCorrect: Math.max(0, Math.floor(toSafeNumber(raw?.weeklyCorrect))),
    weeklyQuizCount: Math.max(0, Math.floor(toSafeNumber(raw?.weeklyQuizCount))),
    lastTickAtMs: Math.max(0, toSafeNumber(raw?.lastTickAtMs ?? base.lastTickAtMs)),
    updatedAtMs: Math.max(0, toSafeNumber(raw?.updatedAtMs ?? base.updatedAtMs)),
    createdAtMs: Math.max(0, toSafeNumber(raw?.createdAtMs ?? base.createdAtMs)),
  });
}

export function applyDennisVillagePassiveGold(state, now = Date.now()) {
  const time = toSafeNumber(now) || Date.now();
  const normalized = normalizeDennisVillageState(state, { now: time });
  const elapsedSeconds = Math.max(0, Math.floor((time - normalized.lastTickAtMs) / 1000));
  const earned = elapsedSeconds * normalized.goldPerSecond;

  if (earned <= 0) {
    return {
      ...normalized,
      lastTickAtMs: time,
      updatedAtMs: time,
    };
  }

  return withDerived({
    ...normalized,
    gold: normalized.gold + earned,
    lastTickAtMs: time,
    updatedAtMs: time,
  });
}

export function answerDennisVillageQuestion(state, { questionId, selectedIndex, now = Date.now() } = {}) {
  const question = DENNIS_VILLAGE_QUESTIONS.find((item) => item.id === questionId);
  if (!question) {
    throw new DennisVillageError("invalid-question", "Question is invalid.");
  }

  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
    throw new DennisVillageError("invalid-answer", "Answer is invalid.");
  }

  const time = toSafeNumber(now) || Date.now();
  const current = applyDennisVillagePassiveGold(state, time);
  const correct = selectedIndex === question.answer;
  const nextBase = correct
    ? {
        ...current,
        gold: current.gold + DENNIS_VILLAGE_QUIZ_REWARD_GOLD,
        xp: current.xp + DENNIS_VILLAGE_QUIZ_REWARD_XP,
        weeklyCorrect: current.weeklyCorrect + 1,
      }
    : {
        ...current,
        gold: Math.max(0, current.gold - DENNIS_VILLAGE_QUIZ_PENALTY_GOLD),
      };

  return withDerived(
    applyLevelUps({
      ...nextBase,
      weeklyQuizCount: current.weeklyQuizCount + 1,
      lastQuizAtMs: time,
      updatedAtMs: time,
      lastQuiz: {
        questionId,
        selectedIndex,
        correct,
        correctIndex: question.answer,
        createdAtMs: time,
      },
    })
  );
}

export function buyDennisVillageBuilding(state, buildingId, now = Date.now()) {
  const building = DENNIS_VILLAGE_BUILDINGS.find((item) => item.id === buildingId);
  if (!building) {
    throw new DennisVillageError("invalid-building", "Building is invalid.");
  }

  const time = toSafeNumber(now) || Date.now();
  const current = applyDennisVillagePassiveGold(state, time);
  const owned = Math.max(0, Math.floor(toSafeNumber(current.buildings?.[building.id])));
  const cost = getDennisVillageBuildingCost(building.cost, owned);

  if (current.level < building.unlockLevel) {
    throw new DennisVillageError("locked-building", "Building is still locked.");
  }

  if (current.gold < cost) {
    throw new DennisVillageError("not-enough-gold", "Not enough village gold.");
  }

  return withDerived(
    applyLevelUps({
      ...current,
      gold: current.gold - cost,
      xp: current.xp + DENNIS_VILLAGE_BUILD_XP,
      buildings: {
        ...current.buildings,
        [building.id]: owned + 1,
      },
      updatedAtMs: time,
    })
  );
}

export function getDennisVillageLeaderboard(entries = []) {
  const normalized = entries.map((entry) => normalizeDennisVillageState(entry, entry));
  const byGold = [...normalized].sort(
    (a, b) =>
      b.gold - a.gold ||
      b.weeklyCorrect - a.weeklyCorrect ||
      String(a.studentName).localeCompare(String(b.studentName))
  );
  const byCorrect = [...normalized].sort(
    (a, b) =>
      b.weeklyCorrect - a.weeklyCorrect ||
      b.gold - a.gold ||
      String(a.studentName).localeCompare(String(b.studentName))
  );

  return {
    goldLeaders: byGold.slice(0, 5),
    quizLeaders: byCorrect.slice(0, 5),
  };
}

export function buildDennisVillagePublicEntry(state) {
  const normalized = normalizeDennisVillageState(state, state);

  return {
    weekId: normalized.weekId,
    classId: normalized.classId,
    className: normalized.className,
    studentId: normalized.studentId,
    studentName: normalized.studentName,
    gold: normalized.gold,
    level: normalized.level,
    xp: normalized.xp,
    xpNeeded: normalized.xpNeeded,
    buildings: normalized.buildings,
    weeklyCorrect: normalized.weeklyCorrect,
    weeklyQuizCount: normalized.weeklyQuizCount,
    goldPerSecond: normalized.goldPerSecond,
    lastTickAtMs: normalized.lastTickAtMs,
    updatedAtMs: normalized.updatedAtMs,
    createdAtMs: normalized.createdAtMs,
    lastQuiz: normalized.lastQuiz,
  };
}
