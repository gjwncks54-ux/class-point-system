export const PROFILE_MVP_SHEET_SRC = "/assets/profile-mvp/avatar-sheet-18.png";
export const PROFILE_MVP_SHEET_COLS = 6;
export const PROFILE_MVP_SHEET_ROWS = 3;

export const PROFILE_MVP_LEVELS = [
  { level: 1, minLifetimePoints: 0 },
  { level: 2, minLifetimePoints: 5 },
  { level: 3, minLifetimePoints: 12 },
  { level: 4, minLifetimePoints: 20 },
  { level: 5, minLifetimePoints: 30 },
  { level: 6, minLifetimePoints: 45 },
  { level: 7, minLifetimePoints: 65 },
  { level: 8, minLifetimePoints: 90 },
];

export const PROFILE_MVP_RARITY_STYLES = {
  common: {
    label: "Common",
    accent: "#FFB74D",
    glow: "rgba(255,183,77,0.28)",
    aura: "radial-gradient(circle at 50% 0%, rgba(255,236,179,0.9), rgba(255,236,179,0) 72%)",
    frame: "#FFE0B2",
  },
  rare: {
    label: "Rare",
    accent: "#4FC3F7",
    glow: "rgba(79,195,247,0.3)",
    aura: "radial-gradient(circle at 50% 0%, rgba(179,229,252,0.92), rgba(179,229,252,0) 72%)",
    frame: "#B3E5FC",
  },
  epic: {
    label: "Epic",
    accent: "#BA68C8",
    glow: "rgba(186,104,200,0.34)",
    aura: "radial-gradient(circle at 50% 0%, rgba(234,128,252,0.9), rgba(234,128,252,0) 72%)",
    frame: "#E1BEE7",
  },
  legendary: {
    label: "Legendary",
    accent: "#FFD54F",
    glow: "rgba(255,213,79,0.4)",
    aura: "radial-gradient(circle at 50% 0%, rgba(255,241,118,0.96), rgba(255,241,118,0) 76%)",
    frame: "#FFE082",
  },
};

export const PROFILE_MVP_AVATARS = [
  {
    id: "ember-fox",
    name: "Ember Fox",
    rarity: "common",
    unlockLevel: 1,
    accent: "#FF8A65",
    theme: "Fire Starter",
    sheet: { col: 0, row: 0 },
  },
  {
    id: "scholar-tabby",
    name: "Scholar Tabby",
    rarity: "common",
    unlockLevel: 1,
    accent: "#D4A373",
    theme: "Library Student",
    sheet: { col: 1, row: 0 },
  },
  {
    id: "shadow-wolf",
    name: "Shadow Wolf",
    rarity: "common",
    unlockLevel: 2,
    accent: "#78909C",
    theme: "Silent Scout",
    sheet: { col: 2, row: 0 },
  },
  {
    id: "owl-sage",
    name: "Owl Sage",
    rarity: "common",
    unlockLevel: 2,
    accent: "#A1887F",
    theme: "Town Scholar",
    sheet: { col: 3, row: 0 },
  },
  {
    id: "mouse-brewer",
    name: "Mouse Brewer",
    rarity: "common",
    unlockLevel: 3,
    accent: "#F48FB1",
    theme: "Potion Club",
    sheet: { col: 4, row: 0 },
  },
  {
    id: "lion-captain",
    name: "Lion Captain",
    rarity: "common",
    unlockLevel: 3,
    accent: "#FFCC80",
    theme: "Sports Hero",
    sheet: { col: 5, row: 0 },
  },
  {
    id: "deer-archer",
    name: "Deer Archer",
    rarity: "rare",
    unlockLevel: 4,
    accent: "#81C784",
    theme: "Forest Class",
    sheet: { col: 0, row: 1 },
  },
  {
    id: "raccoon-bard",
    name: "Raccoon Bard",
    rarity: "rare",
    unlockLevel: 4,
    accent: "#8D6E63",
    theme: "Music Club",
    sheet: { col: 1, row: 1 },
  },
  {
    id: "witch-cat",
    name: "Witch Cat",
    rarity: "rare",
    unlockLevel: 5,
    accent: "#5C6BC0",
    theme: "Arcane Student",
    sheet: { col: 2, row: 1 },
  },
  {
    id: "bulldog-guard",
    name: "Bulldog Guard",
    rarity: "rare",
    unlockLevel: 5,
    accent: "#B0BEC5",
    theme: "Hall Defender",
    sheet: { col: 3, row: 1 },
  },
  {
    id: "bunny-gardener",
    name: "Bunny Gardener",
    rarity: "rare",
    unlockLevel: 6,
    accent: "#AED581",
    theme: "Green Thumb",
    sheet: { col: 4, row: 1 },
  },
  {
    id: "polar-paladin",
    name: "Polar Paladin",
    rarity: "rare",
    unlockLevel: 6,
    accent: "#90CAF9",
    theme: "Frost Shield",
    sheet: { col: 5, row: 1 },
  },
  {
    id: "phoenix-mage",
    name: "Phoenix Mage",
    rarity: "epic",
    unlockLevel: 7,
    accent: "#FF7043",
    theme: "Flare Master",
    sheet: { col: 0, row: 2 },
  },
  {
    id: "glacier-bear",
    name: "Glacier Bear",
    rarity: "epic",
    unlockLevel: 7,
    accent: "#81D4FA",
    theme: "Ice Channeler",
    sheet: { col: 1, row: 2 },
  },
  {
    id: "prism-owl",
    name: "Prism Owl",
    rarity: "epic",
    unlockLevel: 7,
    accent: "#B39DDB",
    theme: "Sky Mystic",
    sheet: { col: 2, row: 2 },
  },
  {
    id: "void-panther",
    name: "Void Panther",
    rarity: "epic",
    unlockLevel: 7,
    accent: "#9575CD",
    theme: "Night Caster",
    sheet: { col: 3, row: 2 },
  },
  {
    id: "sunhart-stag",
    name: "Sunhart Stag",
    rarity: "legendary",
    unlockLevel: 8,
    accent: "#FFD54F",
    theme: "Crown Knight",
    sheet: { col: 4, row: 2 },
  },
  {
    id: "violet-drake",
    name: "Violet Drake",
    rarity: "legendary",
    unlockLevel: 8,
    accent: "#CE93D8",
    theme: "Town Legend",
    sheet: { col: 5, row: 2, xOffset: -7 },
  },
];

function toSafeNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function estimateLifetimePoints(student) {
  const positiveHistoryPoints = (student?.history || []).reduce((sum, entry) => {
    const points = toSafeNumber(entry?.pts);
    return points > 0 ? sum + points : sum;
  }, 0);

  return Math.max(
    0,
    toSafeNumber(student?.lifetimePoints),
    toSafeNumber(student?.points),
    positiveHistoryPoints
  );
}

export function getLevelFromLifetimePoints(lifetimePoints) {
  const total = Math.max(0, toSafeNumber(lifetimePoints));
  const currentBand =
    [...PROFILE_MVP_LEVELS].reverse().find((band) => total >= band.minLifetimePoints) || PROFILE_MVP_LEVELS[0];
  const currentIndex = PROFILE_MVP_LEVELS.findIndex((band) => band.level === currentBand.level);
  const nextBand = PROFILE_MVP_LEVELS[currentIndex + 1] || null;

  if (!nextBand) {
    return {
      level: currentBand.level,
      currentLevelMin: currentBand.minLifetimePoints,
      nextLevel: null,
      nextLevelMin: null,
      pointsIntoLevel: total - currentBand.minLifetimePoints,
      pointsToNextLevel: 0,
      progressPercent: 100,
    };
  }

  const levelRange = nextBand.minLifetimePoints - currentBand.minLifetimePoints;
  const pointsIntoLevel = total - currentBand.minLifetimePoints;
  const progressPercent = levelRange > 0 ? Math.round((pointsIntoLevel / levelRange) * 100) : 100;

  return {
    level: currentBand.level,
    currentLevelMin: currentBand.minLifetimePoints,
    nextLevel: nextBand.level,
    nextLevelMin: nextBand.minLifetimePoints,
    pointsIntoLevel,
    pointsToNextLevel: nextBand.minLifetimePoints - total,
    progressPercent: clamp(progressPercent, 0, 100),
  };
}

export function getUnlockedProfileAvatars(level, avatarCatalog = PROFILE_MVP_AVATARS) {
  const unlockedLevel = Math.max(1, toSafeNumber(level));
  return avatarCatalog.filter((avatar) => avatar.unlockLevel <= unlockedLevel);
}

export function getProfileMvpRarityStyle(rarity) {
  return PROFILE_MVP_RARITY_STYLES[rarity] || PROFILE_MVP_RARITY_STYLES.common;
}

export function buildStudentProfileMvp({ cls, student }) {
  const lifetimePoints = estimateLifetimePoints(student);
  const level = getLevelFromLifetimePoints(lifetimePoints);
  const unlockedAvatars = getUnlockedProfileAvatars(level.level);
  const unlockedAvatarIds = new Set(unlockedAvatars.map((avatar) => avatar.id));
  const equippedAvatarId = student?.profile?.avatarId;
  const equippedAvatar =
    unlockedAvatars.find((avatar) => avatar.id === equippedAvatarId) || unlockedAvatars[0] || PROFILE_MVP_AVATARS[0];

  return {
    classId: cls?.id || "",
    className: cls?.name || "Class",
    studentId: student?.id || "",
    studentName: student?.name || "Student",
    currentStars: toSafeNumber(student?.points),
    lifetimePoints,
    level,
    equippedAvatar,
    unlockedAvatars,
    lockedAvatars: PROFILE_MVP_AVATARS.filter((avatar) => !unlockedAvatarIds.has(avatar.id)),
    avatarCatalog: PROFILE_MVP_AVATARS,
  };
}
