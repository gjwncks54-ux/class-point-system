export const ENGLISH_DUNGEON_ID = "english-word-sprint";
export const VILLAGE_SCENE_SRC = "/assets/village/kenney-rpg-urban/pack/Sample.png";

export const TOWN_LOCATIONS = [
  {
    id: "school",
    name: "English Academy",
    subtitle: "Lv.1 Word Sprint",
    unlockAt: 0,
    accent: "#FF7043",
    top: "24%",
    left: "31%",
    description: "Jump into a short word dungeon and clear five English questions.",
    route: "dungeon-english",
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
    route: null,
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
    route: "hall",
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
    route: "shop",
  },
];

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

export function calculateCorrectCount(answers, questions = WORD_DUNGEON_QUESTIONS) {
  if (!validateDungeonAnswers(answers, questions)) {
    return 0;
  }

  return questions.reduce(
    (count, question, index) => count + Number(answers[index] === question.answer),
    0
  );
}

export function getRewardForCorrectCount(correctCount) {
  if (correctCount === WORD_DUNGEON_QUESTIONS.length) return 3;
  if (correctCount >= 4) return 2;
  if (correctCount >= 2) return 1;
  return 0;
}

export function getGradeTone(correctCount) {
  if (correctCount === WORD_DUNGEON_QUESTIONS.length) {
    return { bg: "#E8FFF2", text: "#1B8B4B", label: "Perfect clear" };
  }
  if (correctCount >= 4) return { bg: "#EEF4FF", text: "#1A4ED8", label: "Strong run" };
  if (correctCount >= 2) return { bg: "#FFF8E8", text: "#B7791F", label: "Good practice" };
  return { bg: "#FFF1F2", text: "#C53030", label: "Try again" };
}

export function summarizeEnglishDungeonRun(answers, questions = WORD_DUNGEON_QUESTIONS) {
  const correctCount = calculateCorrectCount(answers, questions);

  return {
    dungeonId: ENGLISH_DUNGEON_ID,
    questionCount: questions.length,
    correctCount,
    rewardPoints: getRewardForCorrectCount(correctCount),
    tone: getGradeTone(correctCount),
  };
}

export function getTownStatus(totalPoints) {
  const unlocked = TOWN_LOCATIONS.filter((location) => totalPoints >= location.unlockAt);
  const next = TOWN_LOCATIONS.find((location) => totalPoints < location.unlockAt) || null;
  const currentFloor = unlocked.length ? unlocked[unlocked.length - 1].unlockAt : 0;
  const currentCeiling = next ? next.unlockAt : TOWN_LOCATIONS[TOWN_LOCATIONS.length - 1].unlockAt;
  const percent =
    next && currentCeiling > currentFloor
      ? ((totalPoints - currentFloor) / (currentCeiling - currentFloor)) * 100
      : 100;

  return {
    unlocked,
    next,
    percent: Math.max(0, Math.min(100, percent)),
  };
}

export function buildVillageStatus(totalPoints) {
  const { unlocked, next, percent } = getTownStatus(totalPoints);

  return {
    totalPoints,
    unlockedIds: unlocked.map((location) => location.id),
    next,
    percent,
  };
}

export function buildTickerMessages({ cls, me, classRanked, unlocked, next, totalPoints }) {
  const messages = [];
  const leader = classRanked[0];

  if (leader) {
    messages.push(`${leader.name} is leading ${cls.name} with ${leader.points} stars.`);
  }

  messages.push(`${cls.name} Town has unlocked ${unlocked.length} of ${TOWN_LOCATIONS.length} buildings.`);

  if (next) {
    messages.push(`${next.unlockAt - totalPoints} more stars will open ${next.name}.`);
  } else {
    messages.push(`${cls.name} Town is fully opened. Time to add live dungeon rewards.`);
  }

  const publicPurchase = classRanked
    .flatMap((student) =>
      (student.purchases || []).map((purchase) => ({
        studentName: student.name,
        item: typeof purchase === "object" ? purchase.name : purchase,
        isPublic: typeof purchase === "object" ? purchase.isPublic !== false : true,
      }))
    )
    .find((purchase) => purchase.isPublic);

  if (publicPurchase) {
    messages.push(`${publicPurchase.studentName} showed off ${publicPurchase.item} in town.`);
  }

  messages.push(`${me.name} is carrying ${me.points} stars into the village today.`);

  return messages;
}
