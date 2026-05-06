import { useState } from "react";

import {
  ENGLISH_DUNGEON_ID,
  WORD_DUNGEON_QUESTIONS,
  summarizeEnglishDungeonRun,
} from "../shared/villageCore.js";
import { completeGame, enterDungeon, getGameApiErrorMessage, isFunctionsUnavailableError } from "./lib/gameApi";
import { isSecureStudentSession } from "./lib/studentSession";

const initialRunState = {
  phase: "intro",
  index: 0,
  answers: [],
  mode: "secure",
  nonce: null,
};

export default function EnglishAcademyDungeon({
  cls,
  me,
  session,
  onNavigate,
  showToast,
  css,
  C,
}) {
  const [runState, setRunState] = useState(initialRunState);
  const [resultState, setResultState] = useState(null);
  const [requestError, setRequestError] = useState("");

  const resetRun = () => {
    setRunState(initialRunState);
    setResultState(null);
    setRequestError("");
  };

  const startRun = async () => {
    setRequestError("");

    if (!isSecureStudentSession(session)) {
      setRunState({
        phase: "playing",
        index: 0,
        answers: [],
        mode: "preview",
        nonce: null,
      });
      showToast?.("Cloud session is not ready yet. Running in preview mode.", "err");
      return;
    }

    setRunState((prev) => ({ ...prev, phase: "starting" }));

    try {
      const started = await enterDungeon({
        sessionId: session.sessionId,
        dungeonId: ENGLISH_DUNGEON_ID,
      });

      setRunState({
        phase: "playing",
        index: 0,
        answers: [],
        mode: "secure",
        nonce: started.nonce,
      });
    } catch (error) {
      if (isFunctionsUnavailableError(error)) {
        setRunState({
          phase: "playing",
          index: 0,
          answers: [],
          mode: "preview",
          nonce: null,
        });
        showToast?.("Functions are not deployed yet. Running in preview mode.", "err");
        return;
      }

      const message = getGameApiErrorMessage(error, "Failed to start the dungeon.");
      setRequestError(message);
      setRunState(initialRunState);
      showToast?.(message, "err");
    }
  };

  const answerQuestion = async (choiceIndex) => {
    const nextAnswers = [...runState.answers, choiceIndex];
    const nextIndex = runState.index + 1;

    if (nextIndex < WORD_DUNGEON_QUESTIONS.length) {
      setRunState((prev) => ({
        ...prev,
        index: nextIndex,
        answers: nextAnswers,
      }));
      return;
    }

    const summary = summarizeEnglishDungeonRun(nextAnswers);
    const previewResult = {
      ...summary,
      awardedPoints: summary.rewardPoints,
      mode: runState.mode,
      serverVerified: runState.mode === "secure",
      message:
        runState.mode === "secure"
          ? "Server reward synced successfully."
          : "Preview reward only. Deploy Functions to award points for real.",
    };

    setRunState((prev) => ({
      ...prev,
      phase: "submitting",
      answers: nextAnswers,
      index: nextIndex,
    }));

    if (runState.mode !== "secure" || !session?.sessionId || !runState.nonce) {
      setResultState(previewResult);
      setRunState((prev) => ({ ...prev, phase: "result" }));
      return;
    }

    try {
      const completed = await completeGame({
        sessionId: session.sessionId,
        dungeonId: ENGLISH_DUNGEON_ID,
        nonce: runState.nonce,
        answers: nextAnswers,
      });

      setResultState({
        ...summary,
        awardedPoints: completed.rewardPoints,
        lifetimePoints: completed.villageLifetimePoints,
        unlockedIds: completed.unlockedIds || [],
        mode: "secure",
        serverVerified: true,
        message: completed.message || "Server reward synced successfully.",
      });
      showToast?.(
        completed.rewardPoints > 0
          ? `Dungeon clear! +${completed.rewardPoints} stars awarded.`
          : "Dungeon clear recorded. No stars awarded this run.",
        completed.rewardPoints > 0 ? "ok" : "err"
      );
    } catch (error) {
      const message = getGameApiErrorMessage(error, "Failed to submit the dungeon result.");
      setRequestError(message);
      setResultState({
        ...previewResult,
        mode: "preview",
        serverVerified: false,
        message: `${message} Preview reward shown locally only.`,
      });
      showToast?.(message, "err");
    }

    setRunState((prev) => ({ ...prev, phase: "result" }));
  };

  const activeQuestion =
    runState.phase === "playing" || runState.phase === "submitting"
      ? WORD_DUNGEON_QUESTIONS[runState.index]
      : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={css.card({ padding: 18, marginBottom: 0 })}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ color: C.muted, fontSize: 12, fontWeight: 800, letterSpacing: 0.8 }}>
              SECURE DUNGEON ROUTE
            </div>
            <div
              style={{
                fontFamily: "'Chewy', 'Noto Sans KR', cursive",
                color: C.dark,
                fontSize: 28,
                lineHeight: 1.1,
                marginTop: 6,
              }}
            >
              English Academy
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
              {cls.name} · {me.name} · {session?.sessionId ? "session ready" : "preview fallback"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              style={css.btn("#EDF2F7", C.dark, { padding: "10px 16px", fontSize: 14 })}
              onClick={() => onNavigate("village")}
            >
              Back to Town
            </button>
            <button
              style={css.btn("#1A237E", "#fff", { padding: "10px 16px", fontSize: 14 })}
              onClick={resetRun}
            >
              Reset Run
            </button>
          </div>
        </div>
      </div>

      {requestError ? (
        <div
          style={css.card({
            marginBottom: 0,
            padding: 16,
            background: "#FFF1F2",
            border: "2px solid #FECACA",
          })}
        >
          <div style={{ fontWeight: 800, color: "#C53030" }}>Sync note</div>
          <div style={{ color: "#7F1D1D", fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>{requestError}</div>
        </div>
      ) : null}

      {runState.phase === "intro" && (
        <div style={css.card({ padding: 20, marginBottom: 0 })}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 900, color: C.dark, fontSize: 18 }}>Word Sprint</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
                Clear five English questions. When Cloud Functions are available, the server will verify the run before
                awarding stars and updating village progress.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <div style={css.card({ marginBottom: 0, padding: 16, background: "#F8FAFC", boxShadow: "none" })}>
                <div style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>Question count</div>
                <div style={{ color: C.dark, fontWeight: 900, fontSize: 26, marginTop: 6 }}>
                  {WORD_DUNGEON_QUESTIONS.length}
                </div>
              </div>
              <div style={css.card({ marginBottom: 0, padding: 16, background: "#F8FAFC", boxShadow: "none" })}>
                <div style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>Reward range</div>
                <div style={{ color: C.dark, fontWeight: 900, fontSize: 26, marginTop: 6 }}>0-3 stars</div>
              </div>
              <div style={css.card({ marginBottom: 0, padding: 16, background: "#F8FAFC", boxShadow: "none" })}>
                <div style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>Mode</div>
                <div style={{ color: C.dark, fontWeight: 900, fontSize: 22, marginTop: 6 }}>
                  {session?.sessionId ? "Secure run" : "Preview"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={css.btn("#FF7043", "#fff", { padding: "12px 18px", fontSize: 14 })}
                onClick={startRun}
              >
                Enter Dungeon
              </button>
              <button
                style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
                onClick={() => onNavigate("hall")}
              >
                Open Hall
              </button>
            </div>
          </div>
        </div>
      )}

      {runState.phase === "starting" && (
        <div style={css.card({ padding: 24, marginBottom: 0, textAlign: "center" })}>
          <div style={{ color: C.dark, fontWeight: 800 }}>Preparing secure dungeon session...</div>
        </div>
      )}

      {(runState.phase === "playing" || runState.phase === "submitting") && activeQuestion && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={css.card({ padding: 18, marginBottom: 0 })}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 900, color: C.dark }}>
                Question {runState.index + 1} / {WORD_DUNGEON_QUESTIONS.length}
              </div>
              <div
                style={css.pill(
                  runState.mode === "secure" ? "#EEF4FF" : "#FFF8E8",
                  runState.mode === "secure" ? "#1A237E" : "#B7791F"
                )}
              >
                {runState.mode === "secure" ? "Server-verified" : "Preview"}
              </div>
            </div>
          </div>

          <div style={css.card({ padding: 20, marginBottom: 0 })}>
            <div style={{ fontWeight: 900, fontSize: 22, color: C.dark, lineHeight: 1.45 }}>{activeQuestion.prompt}</div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {activeQuestion.choices.map((choice, choiceIndex) => (
              <button
                key={choice}
                disabled={runState.phase === "submitting"}
                style={css.btn("#F8FAFC", C.dark, {
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 18,
                  border: "2px solid #E2E8F0",
                  textAlign: "left",
                  fontSize: 14,
                  opacity: runState.phase === "submitting" ? 0.7 : 1,
                })}
                onClick={() => answerQuestion(choiceIndex)}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {runState.phase === "result" && resultState && (
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={css.card({
              marginBottom: 0,
              padding: 20,
              background: resultState.tone.bg,
              color: resultState.tone.text,
              boxShadow: "none",
            })}
          >
            <div style={{ fontWeight: 900, fontSize: 24 }}>{resultState.tone.label}</div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
              You answered {resultState.correctCount} / {resultState.questionCount} correctly.
            </div>
            <div style={{ marginTop: 8, fontWeight: 800 }}>
              {resultState.serverVerified
                ? `Awarded reward: +${resultState.awardedPoints} stars`
                : `Preview reward: +${resultState.awardedPoints} stars`}
            </div>
          </div>

          <div style={css.card({ marginBottom: 0, padding: 18 })}>
            <div style={{ fontWeight: 900, color: C.dark }}>Result sync</div>
            <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{resultState.message}</div>
            {typeof resultState.lifetimePoints === "number" ? (
              <div style={{ marginTop: 10, color: C.dark, fontWeight: 800 }}>
                Village lifetime points: {resultState.lifetimePoints}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={css.btn("#FF7043", "#fff", { padding: "12px 18px", fontSize: 14 })}
              onClick={startRun}
            >
              Play Again
            </button>
            <button
              style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
              onClick={() => onNavigate("village")}
            >
              Back to Town
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
