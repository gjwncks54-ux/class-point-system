import { httpsCallable } from "firebase/functions";

import { functions } from "./firebaseClient";

const verifyStudentPinCallable = httpsCallable(functions, "verifyStudentPin");
const enterDungeonCallable = httpsCallable(functions, "enterDungeon");
const completeGameCallable = httpsCallable(functions, "completeGame");
const updateStudentProfileCallable = httpsCallable(functions, "updateStudentProfile");
const getDennisVillageStateCallable = httpsCallable(functions, "getDennisVillageState");
const answerDennisVillageQuizCallable = httpsCallable(functions, "answerDennisVillageQuiz");
const buyDennisVillageBuildingCallable = httpsCallable(functions, "buyDennisVillageBuilding");

export async function verifyStudentPin(payload) {
  const result = await verifyStudentPinCallable(payload);
  return result.data;
}

export async function enterDungeon(payload) {
  const result = await enterDungeonCallable(payload);
  return result.data;
}

export async function completeGame(payload) {
  const result = await completeGameCallable(payload);
  return result.data;
}

export async function updateStudentProfile(payload) {
  const result = await updateStudentProfileCallable(payload);
  return result.data;
}

export async function getDennisVillageState(payload) {
  const result = await getDennisVillageStateCallable(payload);
  return result.data;
}

export async function answerDennisVillageQuiz(payload) {
  const result = await answerDennisVillageQuizCallable(payload);
  return result.data;
}

export async function buyDennisVillageBuilding(payload) {
  const result = await buyDennisVillageBuildingCallable(payload);
  return result.data;
}

export function isFunctionsUnavailableError(error) {
  const code = String(error?.code || "");
  return (
    code.includes("functions/unavailable") ||
    code.includes("functions/not-found") ||
    code.includes("functions/internal") ||
    code.includes("unavailable")
  );
}

export function getGameApiErrorMessage(error, fallbackMessage = "Request failed.") {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
