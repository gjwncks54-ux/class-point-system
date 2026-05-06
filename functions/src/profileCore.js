const PROFILE_LEVELS = [
  { level: 1, minLifetimePoints: 0 },
  { level: 2, minLifetimePoints: 5 },
  { level: 3, minLifetimePoints: 12 },
  { level: 4, minLifetimePoints: 20 },
  { level: 5, minLifetimePoints: 30 },
  { level: 6, minLifetimePoints: 45 },
  { level: 7, minLifetimePoints: 65 },
  { level: 8, minLifetimePoints: 90 },
];

const PROFILE_AVATAR_UNLOCKS = new Map([
  ["ember-fox", 1],
  ["scholar-tabby", 1],
  ["shadow-wolf", 2],
  ["owl-sage", 2],
  ["mouse-brewer", 3],
  ["lion-captain", 3],
  ["deer-archer", 4],
  ["raccoon-bard", 4],
  ["witch-cat", 5],
  ["bulldog-guard", 5],
  ["bunny-gardener", 6],
  ["polar-paladin", 6],
  ["phoenix-mage", 7],
  ["glacier-bear", 7],
  ["prism-owl", 7],
  ["void-panther", 7],
  ["sunhart-stag", 8],
  ["violet-drake", 8],
]);

function toSafeNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export class ProfileUpdateError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProfileUpdateError";
    this.code = code;
  }
}

export function estimateLifetimePointsForStudent(student) {
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

export function getProfileLevelFromLifetimePoints(lifetimePoints) {
  const total = Math.max(0, toSafeNumber(lifetimePoints));
  const currentBand =
    [...PROFILE_LEVELS].reverse().find((band) => total >= band.minLifetimePoints) || PROFILE_LEVELS[0];

  return currentBand.level;
}

export function buildStudentProfileUpdate(data, session, avatarId, now) {
  const unlockLevel = PROFILE_AVATAR_UNLOCKS.get(avatarId);

  if (!unlockLevel) {
    throw new ProfileUpdateError("invalid-avatar", "Avatar selection is invalid.");
  }

  let className = "";
  let studentName = "";
  let updated = false;

  const nextData = {
    ...data,
    classes: (data.classes || []).map((cls) => {
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

          const level = getProfileLevelFromLifetimePoints(estimateLifetimePointsForStudent(student));
          if (unlockLevel > level) {
            throw new ProfileUpdateError("locked-avatar", "Avatar is still locked for this level.");
          }

          return {
            ...student,
            profile: {
              ...(student.profile || {}),
              avatarId,
            },
          };
        }),
      };
    }),
  };

  if (!updated) {
    throw new ProfileUpdateError("student-not-found", "Student record was not found.");
  }

  return {
    nextData: {
      ...nextData,
      _rev: toSafeNumber(data?._rev) + 1,
      _lastSaved: new Date(now).toISOString(),
    },
    className,
    studentName,
    avatarId,
  };
}
