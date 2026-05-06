export const DENNIS_VILLAGE_NOTICE_DISMISS_PREFIX = "dennisVillageAwardNoticeDismissed";

export function buildDennisVillageAwardDismissKey(weekId) {
  return `${DENNIS_VILLAGE_NOTICE_DISMISS_PREFIX}:${weekId}`;
}

export function hasDennisVillageAwardActivity(entry) {
  const builtSomething = Object.values(entry?.buildings || {}).some((count) => Number(count || 0) > 0);

  return (
    Number(entry?.weeklyQuizCount || 0) > 0 ||
    Number(entry?.weeklyCorrect || 0) > 0 ||
    Number(entry?.gold || 0) > 25 ||
    builtSomething
  );
}

export function buildDennisVillageAwardNotice({ weekId, entries = [] } = {}) {
  const activeEntries = entries.filter(hasDennisVillageAwardActivity);

  if (!activeEntries.length) {
    return null;
  }

  return {
    weekId,
    count: activeEntries.length,
    dismissKey: buildDennisVillageAwardDismissKey(weekId),
  };
}
