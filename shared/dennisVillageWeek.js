const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function formatUtcDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getKstCalendarDate(now) {
  const sourceDate = now instanceof Date ? now : new Date(now);
  const shifted = new Date(sourceDate.getTime() + KST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

export function getDennisVillageWeekId(now = new Date()) {
  const date = getKstCalendarDate(now);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return formatUtcDate(date);
}

export function getPreviousDennisVillageWeekId(now = new Date()) {
  const date = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  date.setTime(date.getTime() - 7 * DAY_MS);
  return getDennisVillageWeekId(date);
}
