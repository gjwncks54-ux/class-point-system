import test from "node:test";
import assert from "node:assert/strict";

import {
  ProfileUpdateError,
  buildStudentProfileUpdate,
  estimateLifetimePointsForStudent,
} from "../functions/src/profileCore.js";

test("estimateLifetimePointsForStudent keeps the strongest progression signal", () => {
  assert.equal(
    estimateLifetimePointsForStudent({
      points: 3,
      lifetimePoints: 11,
      history: [{ pts: 4 }, { pts: -2 }, { pts: 6 }],
    }),
    11
  );

  assert.equal(
    estimateLifetimePointsForStudent({
      points: 1,
      history: [{ pts: 2 }, { pts: 5 }, { pts: -3 }],
    }),
    7
  );
});

test("buildStudentProfileUpdate stores a selectable avatar on the matching student", () => {
  const now = Date.UTC(2026, 3, 22);
  const result = buildStudentProfileUpdate(
    {
      _rev: 4,
      classes: [
        {
          id: "c5",
          name: "G3 Green",
          students: [
            {
              id: "c5_s1",
              name: "Luna",
              points: 3,
              lifetimePoints: 31,
              history: [{ pts: 4 }],
              profile: { avatarId: "ember-fox" },
            },
          ],
        },
      ],
    },
    {
      classId: "c5",
      studentId: "c5_s1",
    },
    "witch-cat",
    now
  );

  assert.equal(result.className, "G3 Green");
  assert.equal(result.studentName, "Luna");
  assert.equal(result.nextData._rev, 5);
  assert.equal(result.nextData._lastSaved, "2026-04-22T00:00:00.000Z");
  assert.equal(result.nextData.classes[0].students[0].profile.avatarId, "witch-cat");
});

test("buildStudentProfileUpdate rejects locked avatars", () => {
  assert.throws(
    () =>
      buildStudentProfileUpdate(
        {
          classes: [
            {
              id: "c5",
              name: "G3 Green",
              students: [
                {
                  id: "c5_s1",
                  name: "Luna",
                  points: 0,
                  lifetimePoints: 5,
                  history: [],
                  profile: { avatarId: "ember-fox" },
                },
              ],
            },
          ],
        },
        {
          classId: "c5",
          studentId: "c5_s1",
        },
        "sunhart-stag",
        Date.UTC(2026, 3, 22)
      ),
    (error) =>
      error instanceof ProfileUpdateError &&
      error.code === "locked-avatar" &&
      /locked/i.test(error.message)
  );
});
