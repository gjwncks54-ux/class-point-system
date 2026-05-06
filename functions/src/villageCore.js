export const ENGLISH_DUNGEON_ID = "english-word-sprint";

export const WORD_DUNGEON_QUESTIONS = [
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
    prompt: "Pick the correct spelling.",
    choices: ["becaus", "beacause", "because", "becose"],
    answer: 2,
  },
  {
    prompt: "Which sentence is correct?",
    choices: ["She go to school.", "She goes to school.", "She going school.", "She goed to school."],
    answer: 1,
  },
  {
    prompt: 'What does "borrow" mean?',
    choices: ["To keep forever", "To throw away", "To use and return later", "To sell quickly"],
    answer: 2,
  },
];

export const ENGLISH_DUNGEON_MIN_DURATION_MS = 5_000;
export const ENGLISH_DUNGEON_MAX_DURATION_MS = 15 * 60 * 1000;

const TOWN_LOCATIONS = [
  { id: "school", unlockAt: 0 },
  { id: "forest", unlockAt: 15 },
  { id: "hall", unlockAt: 25 },
  { id: "shop", unlockAt: 35 },
];

export function validateDungeonAnswers(answers, questions = WORD_DUNGEON_QUESTIONS) {
  return (
    Array.isArray(answers) &&
    answers.length === questions.length &&
    answers.every(
      (answer, index) =>
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer < questions[index].choices.length
    )
  );
}

export function summarizeEnglishDungeonRun(answers, questions = WORD_DUNGEON_QUESTIONS) {
  const correctCount = validateDungeonAnswers(answers, questions)
    ? questions.reduce(
        (count, question, index) => count + Number(answers[index] === question.answer),
        0
      )
    : 0;

  const rewardPoints =
    correctCount === questions.length ? 3 : correctCount >= 4 ? 2 : correctCount >= 2 ? 1 : 0;

  return {
    dungeonId: ENGLISH_DUNGEON_ID,
    questionCount: questions.length,
    correctCount,
    rewardPoints,
  };
}

export function buildVillageStatus(totalPoints) {
  const unlocked = TOWN_LOCATIONS.filter((location) => totalPoints >= location.unlockAt);
  const next = TOWN_LOCATIONS.find((location) => totalPoints < location.unlockAt) || null;
  const currentFloor = unlocked.length ? unlocked[unlocked.length - 1].unlockAt : 0;
  const currentCeiling = next ? next.unlockAt : TOWN_LOCATIONS[TOWN_LOCATIONS.length - 1].unlockAt;
  const percent =
    next && currentCeiling > currentFloor
      ? ((totalPoints - currentFloor) / (currentCeiling - currentFloor)) * 100
      : 100;

  return {
    totalPoints,
    unlockedIds: unlocked.map((location) => location.id),
    next,
    percent: Math.max(0, Math.min(100, percent)),
  };
}
