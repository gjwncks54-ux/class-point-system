import crypto from "node:crypto";

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";

import {
  ENGLISH_DUNGEON_ID,
  ENGLISH_DUNGEON_MAX_DURATION_MS,
  ENGLISH_DUNGEON_MIN_DURATION_MS,
  buildVillageStatus,
  summarizeEnglishDungeonRun,
  validateDungeonAnswers,
} from "./src/villageCore.js";
import {
  buildStudentProfileUpdate,
  estimateLifetimePointsForStudent,
  ProfileUpdateError,
} from "./src/profileCore.js";
import {
  DennisVillageError,
  answerDennisVillageQuestion,
  applyDennisVillagePassiveGold,
  buildDennisVillagePublicEntry,
  buyDennisVillageBuilding as buyDennisVillageBuildingCore,
  createDennisVillageState,
  getDennisVillageLeaderboard,
  getDennisVillageWeekId,
  normalizeDennisVillageState,
} from "./src/dennisVillageCore.js";

initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = getFirestore();
const DATA_DOC = db.collection("app").doc("data");
const GAME_SESSIONS_COL = db.collection("gameSessions");
const GAME_LOGS_COL = db.collection("gameLogs");
const TICKER_COL = db.collection("ticker");
const VILLAGE_STATUS_COL = db.collection("villageStatus");
const DENNIS_VILLAGE_WEEKS_COL = db.collection("dennisVillageWeeks");

const SESSION_TTL_MS = 30 * 60 * 1000;
const ALLOWED_DUNGEON_IDS = new Set([ENGLISH_DUNGEON_ID]);

function normalizePin(pin) {
  return String(pin || "").replace(/\D/g, "").slice(0, 4);
}

function requireId(value, fieldName) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new HttpsError("invalid-argument", `Invalid ${fieldName}.`);
  }

  return value;
}

function getCurrentData(raw) {
  return {
    ...raw,
    classes: Array.isArray(raw?.classes) ? raw.classes : [],
    shop: Array.isArray(raw?.shop) ? raw.shop : [],
    notices: Array.isArray(raw?.notices) ? raw.notices : [],
  };
}

function assertSessionShape(session, now) {
  if (!session) {
    throw new HttpsError("not-found", "Session not found.");
  }

  if (session.status !== "active") {
    throw new HttpsError("failed-precondition", "Session is no longer active.");
  }

  if (typeof session.expiresAtMs !== "number" || session.expiresAtMs < now) {
    throw new HttpsError("permission-denied", "Session expired. Verify PIN again.");
  }
}

function buildHistoryEntry({ correctCount, rewardPoints, now }) {
  return {
    type: "earn",
    pts: rewardPoints,
    reason:
      rewardPoints > 0
        ? `English Academy clear (${correctCount}/5)`
        : `English Academy practice (${correctCount}/5)`,
    date: new Date(now).toISOString().slice(0, 10),
    createdAtMs: now,
  };
}

function updateStudentReward(data, session, summary, now) {
  let className = "";
  let studentName = "";
  let updated = false;

  const nextData = {
    ...data,
    classes: data.classes.map((cls) => {
      if (cls.id !== session.classId) {
        return cls;
      }

      className = cls.name;

      return {
        ...cls,
        students: (cls.students || []).map((student) => {
          if (student.id !== session.studentId) {
            return student;
          }

          studentName = student.name;
          updated = true;
          const lifetimePoints = estimateLifetimePointsForStudent(student) + summary.rewardPoints;

          return {
            ...student,
            points: (student.points || 0) + summary.rewardPoints,
            lifetimePoints,
            profile: student.profile || { avatarId: null },
            history: [
              buildHistoryEntry({
                correctCount: summary.correctCount,
                rewardPoints: summary.rewardPoints,
                now,
              }),
              ...(student.history || []),
            ].slice(0, 50),
          };
        }),
      };
    }),
  };

  if (!updated) {
    throw new HttpsError("failed-precondition", "Student record was not found.");
  }

  return {
    nextData: {
      ...nextData,
      _rev: (data._rev || 0) + 1,
      _lastSaved: new Date(now).toISOString(),
    },
    className,
    studentName,
  };
}

function toHttpsError(error) {
  if (error instanceof HttpsError) {
    return error;
  }

  if (error instanceof ProfileUpdateError) {
    if (error.code === "invalid-avatar") {
      return new HttpsError("invalid-argument", error.message);
    }

    if (error.code === "locked-avatar" || error.code === "student-not-found") {
      return new HttpsError("failed-precondition", error.message);
    }
  }

  if (error instanceof DennisVillageError) {
    if (error.code === "not-enough-gold" || error.code === "locked-building") {
      return new HttpsError("failed-precondition", error.message);
    }

    return new HttpsError("invalid-argument", error.message);
  }

  return error;
}

function getDennisVillageStudentRef(session, weekId) {
  return DENNIS_VILLAGE_WEEKS_COL.doc(weekId)
    .collection("classes")
    .doc(session.classId)
    .collection("students")
    .doc(session.studentId);
}

function getDennisVillageClassStudentsRef(session, weekId) {
  return DENNIS_VILLAGE_WEEKS_COL.doc(weekId)
    .collection("classes")
    .doc(session.classId)
    .collection("students");
}

async function readDennisVillageLeaderboard(session, weekId) {
  const snapshot = await getDennisVillageClassStudentsRef(session, weekId).get();
  return getDennisVillageLeaderboard(snapshot.docs.map((doc) => doc.data()));
}

async function loadDennisVillageStateInTransaction(tx, session, now) {
  const weekId = getDennisVillageWeekId(new Date(now));
  const studentRef = getDennisVillageStudentRef(session, weekId);
  const studentSnap = await tx.get(studentRef);
  const fallback = {
    classId: session.classId,
    className: session.className,
    studentId: session.studentId,
    studentName: session.studentName,
    now,
  };
  const current = studentSnap.exists
    ? normalizeDennisVillageState(studentSnap.data(), fallback)
    : createDennisVillageState(fallback);
  const nextState = applyDennisVillagePassiveGold(current, now);

  tx.set(studentRef, buildDennisVillagePublicEntry(nextState), { merge: true });

  return {
    weekId,
    studentRef,
    state: nextState,
  };
}

export const verifyStudentPin = onCall(async (request) => {
  const classId = requireId(request.data?.classId, "classId");
  const pin = normalizePin(request.data?.pin);

  if (pin.length !== 4) {
    throw new HttpsError("invalid-argument", "PIN must be four digits.");
  }

  const snapshot = await DATA_DOC.get();
  const data = getCurrentData(snapshot.data());
  const cls = data.classes.find((item) => item.id === classId);
  const student = cls?.students?.find((item) => String(item.pin) === pin);

  if (!student) {
    throw new HttpsError("permission-denied", "PIN verification failed.");
  }

  const now = Date.now();
  const sessionRef = GAME_SESSIONS_COL.doc();
  const expiresAtMs = now + SESSION_TTL_MS;

  await sessionRef.set({
    classId,
    className: cls.name,
    studentId: student.id,
    studentName: student.name,
    status: "active",
    createdAtMs: now,
    lastActivityAtMs: now,
    expiresAtMs,
    activeRun: null,
  });

  return {
    sessionId: sessionRef.id,
    classId,
    studentId: student.id,
    studentName: student.name,
    expiresAtMs,
  };
});

export const enterDungeon = onCall(async (request) => {
  const sessionId = requireId(request.data?.sessionId, "sessionId");
  const dungeonId = requireId(request.data?.dungeonId, "dungeonId");

  if (!ALLOWED_DUNGEON_IDS.has(dungeonId)) {
    throw new HttpsError("invalid-argument", "Unsupported dungeon.");
  }

  const now = Date.now();
  const nonce = crypto.randomUUID();
  const sessionRef = GAME_SESSIONS_COL.doc(sessionId);

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    const session = sessionSnap.data();
    assertSessionShape(session, now);

    if (session.activeRun?.status === "started") {
      throw new HttpsError("failed-precondition", "Finish the current run before starting another.");
    }

    tx.set(
      sessionRef,
      {
        lastActivityAtMs: now,
        activeRun: {
          dungeonId,
          nonce,
          startedAtMs: now,
          expiresAtMs: now + ENGLISH_DUNGEON_MAX_DURATION_MS,
          status: "started",
        },
      },
      { merge: true }
    );
  });

  return {
    sessionId,
    dungeonId,
    nonce,
    startedAtMs: now,
  };
});

export const completeGame = onCall(async (request) => {
  const sessionId = requireId(request.data?.sessionId, "sessionId");
  const dungeonId = requireId(request.data?.dungeonId, "dungeonId");
  const nonce = requireId(request.data?.nonce, "nonce");
  const answers = request.data?.answers;

  if (dungeonId !== ENGLISH_DUNGEON_ID) {
    throw new HttpsError("invalid-argument", "Unsupported dungeon.");
  }

  if (!validateDungeonAnswers(answers)) {
    throw new HttpsError("invalid-argument", "Answer payload is invalid.");
  }

  const now = Date.now();
  const summary = summarizeEnglishDungeonRun(answers);
  const sessionRef = GAME_SESSIONS_COL.doc(sessionId);
  const logRef = GAME_LOGS_COL.doc();
  let nextVillageLifetimePoints = 0;
  let unlockedIds = [];
  let className = "";
  let studentName = "";

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    const dataSnap = await tx.get(DATA_DOC);
    const session = sessionSnap.data();
    assertSessionShape(session, now);

    if (!session.activeRun || session.activeRun.status !== "started") {
      throw new HttpsError("failed-precondition", "No active dungeon run was found.");
    }

    if (session.activeRun.dungeonId !== dungeonId || session.activeRun.nonce !== nonce) {
      throw new HttpsError("permission-denied", "Run token did not match.");
    }

    const durationMs = now - session.activeRun.startedAtMs;
    if (durationMs < ENGLISH_DUNGEON_MIN_DURATION_MS) {
      throw new HttpsError("permission-denied", "Run finished too quickly to verify.");
    }

    if (durationMs > ENGLISH_DUNGEON_MAX_DURATION_MS) {
      throw new HttpsError("permission-denied", "Run expired. Start again.");
    }

    const currentData = getCurrentData(dataSnap.data());
    const rewardUpdate = updateStudentReward(currentData, session, summary, now);
    className = rewardUpdate.className;
    studentName = rewardUpdate.studentName;

    const villageRef = VILLAGE_STATUS_COL.doc(session.classId);
    const villageSnap = await tx.get(villageRef);
    const currentVillageLifetimePoints = Number(villageSnap.data()?.lifetimePoints || 0);
    nextVillageLifetimePoints = currentVillageLifetimePoints + summary.rewardPoints;
    const villageStatus = buildVillageStatus(nextVillageLifetimePoints);
    unlockedIds = villageStatus.unlockedIds;

    const tickerRef = TICKER_COL.doc();
    const tickerMessage =
      summary.rewardPoints > 0
        ? `${studentName} cleared English Academy for +${summary.rewardPoints} stars.`
        : `${studentName} finished English Academy practice.`;

    tx.set(DATA_DOC, rewardUpdate.nextData);
    tx.set(
      sessionRef,
      {
        lastActivityAtMs: now,
        lastCompletedAtMs: now,
        activeRun: null,
      },
      { merge: true }
    );
    tx.set(logRef, {
      sessionId,
      classId: session.classId,
      className,
      studentId: session.studentId,
      studentName,
      dungeonId,
      correctCount: summary.correctCount,
      rewardPoints: summary.rewardPoints,
      durationMs,
      answers,
      createdAtMs: now,
    });
    tx.set(tickerRef, {
      classId: session.classId,
      className,
      type: "dungeonComplete",
      studentId: session.studentId,
      studentName,
      dungeonId,
      rewardPoints: summary.rewardPoints,
      message: tickerMessage,
      createdAtMs: now,
    });
    tx.set(
      villageRef,
      {
        classId: session.classId,
        className,
        lifetimePoints: nextVillageLifetimePoints,
        unlockedIds,
        updatedAtMs: now,
      },
      { merge: true }
    );
  });

  return {
    sessionId,
    dungeonId,
    correctCount: summary.correctCount,
    rewardPoints: summary.rewardPoints,
    villageLifetimePoints: nextVillageLifetimePoints,
    unlockedIds,
    message:
      summary.rewardPoints > 0
        ? `${studentName} earned ${summary.rewardPoints} stars in ${className}.`
        : `${studentName}'s practice run was recorded.`,
  };
});

export const updateStudentProfile = onCall(async (request) => {
  const sessionId = requireId(request.data?.sessionId, "sessionId");
  const avatarId = requireId(request.data?.avatarId, "avatarId");
  const sessionRef = GAME_SESSIONS_COL.doc(sessionId);
  const now = Date.now();
  let className = "";
  let studentName = "";

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    const dataSnap = await tx.get(DATA_DOC);
    const session = sessionSnap.data();
    assertSessionShape(session, now);

    try {
      const profileUpdate = buildStudentProfileUpdate(getCurrentData(dataSnap.data()), session, avatarId, now);
      className = profileUpdate.className;
      studentName = profileUpdate.studentName;

      tx.set(DATA_DOC, profileUpdate.nextData);
      tx.set(
        sessionRef,
        {
          lastActivityAtMs: now,
        },
        { merge: true }
      );
    } catch (error) {
      throw toHttpsError(error);
    }
  });

  return {
    sessionId,
    avatarId,
    className,
    studentName,
    message: `${studentName} equipped a new avatar.`,
  };
});

export const getDennisVillageState = onCall(async (request) => {
  const sessionId = requireId(request.data?.sessionId, "sessionId");
  const sessionRef = GAME_SESSIONS_COL.doc(sessionId);
  const now = Date.now();
  let responseState = null;
  let weekId = "";
  let session = null;

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    session = sessionSnap.data();
    assertSessionShape(session, now);

    const village = await loadDennisVillageStateInTransaction(tx, session, now);
    weekId = village.weekId;
    responseState = buildDennisVillagePublicEntry(village.state);

    tx.set(
      sessionRef,
      {
        lastActivityAtMs: now,
      },
      { merge: true }
    );
  });

  const leaderboard = await readDennisVillageLeaderboard(session, weekId);

  return {
    sessionId,
    weekId,
    state: responseState,
    leaderboard,
  };
});

export const answerDennisVillageQuiz = onCall(async (request) => {
  const sessionId = requireId(request.data?.sessionId, "sessionId");
  const questionId = requireId(request.data?.questionId, "questionId");
  const selectedIndex = Number(request.data?.selectedIndex);
  const sessionRef = GAME_SESSIONS_COL.doc(sessionId);
  const now = Date.now();
  let responseState = null;
  let weekId = "";
  let session = null;

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    session = sessionSnap.data();
    assertSessionShape(session, now);

    try {
      const village = await loadDennisVillageStateInTransaction(tx, session, now);
      const nextState = answerDennisVillageQuestion(village.state, {
        questionId,
        selectedIndex,
        now,
      });
      weekId = village.weekId;
      responseState = buildDennisVillagePublicEntry(nextState);

      tx.set(village.studentRef, responseState, { merge: true });
      tx.set(
        sessionRef,
        {
          lastActivityAtMs: now,
        },
        { merge: true }
      );
      tx.set(GAME_LOGS_COL.doc(), {
        type: "dennisVillageQuiz",
        sessionId,
        classId: session.classId,
        className: session.className,
        studentId: session.studentId,
        studentName: session.studentName,
        weekId,
        questionId,
        selectedIndex,
        correct: nextState.lastQuiz?.correct === true,
        createdAtMs: now,
      });
    } catch (error) {
      throw toHttpsError(error);
    }
  });

  const leaderboard = await readDennisVillageLeaderboard(session, weekId);

  return {
    sessionId,
    weekId,
    state: responseState,
    leaderboard,
  };
});

export const buyDennisVillageBuilding = onCall(async (request) => {
  const sessionId = requireId(request.data?.sessionId, "sessionId");
  const buildingId = requireId(request.data?.buildingId, "buildingId");
  const sessionRef = GAME_SESSIONS_COL.doc(sessionId);
  const now = Date.now();
  let responseState = null;
  let weekId = "";
  let session = null;

  await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    session = sessionSnap.data();
    assertSessionShape(session, now);

    try {
      const village = await loadDennisVillageStateInTransaction(tx, session, now);
      const nextState = buyDennisVillageBuildingCore(village.state, buildingId, now);
      weekId = village.weekId;
      responseState = buildDennisVillagePublicEntry(nextState);

      tx.set(village.studentRef, responseState, { merge: true });
      tx.set(
        sessionRef,
        {
          lastActivityAtMs: now,
        },
        { merge: true }
      );
      tx.set(GAME_LOGS_COL.doc(), {
        type: "dennisVillageBuilding",
        sessionId,
        classId: session.classId,
        className: session.className,
        studentId: session.studentId,
        studentName: session.studentName,
        weekId,
        buildingId,
        createdAtMs: now,
      });
    } catch (error) {
      throw toHttpsError(error);
    }
  });

  const leaderboard = await readDennisVillageLeaderboard(session, weekId);

  return {
    sessionId,
    weekId,
    state: responseState,
    leaderboard,
  };
});
