import { useEffect, useMemo, useState } from "react";

import {
  DENNIS_VILLAGE_BUILDINGS,
  DENNIS_VILLAGE_NAME,
  DENNIS_VILLAGE_QUESTIONS,
  answerDennisVillageQuestion,
  applyDennisVillagePassiveGold,
  buildDennisVillagePublicEntry,
  buyDennisVillageBuilding as buyDennisVillageBuildingLocal,
  createDennisVillageState,
  getDennisVillageBuildingCost,
  getDennisVillageLeaderboard,
  getDennisVillageWeekId,
  getRandomDennisVillageQuestion,
  normalizeDennisVillageState,
  shuffleDennisVillageQuestionOptions,
} from "../shared/dennisVillageCore.js";
import {
  answerDennisVillageQuiz,
  buyDennisVillageBuilding,
  getDennisVillageState,
  getGameApiErrorMessage,
  isFunctionsUnavailableError,
} from "./lib/gameApi";
import { isSecureStudentSession } from "./lib/studentSession";

const LOCAL_PREFIX = "dennis-village-v1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const theme = {
  ink: "#1E2F22",
  softInk: "#48604F",
  card: "#FFFDF3",
  line: "#D8C7A5",
  sky: "#BFEFFF",
  grass: "#56B95E",
  grassDark: "#2E8B43",
  gold: "#FFC93F",
  goldDark: "#9A5C00",
  magic: "#8E63D9",
  coral: "#FF7057",
  blue: "#5DA9E9",
  muted: "#7D8B87",
};

const buildingEmoji = {
  farm: "🌾",
  library: "📚",
  school: "🏫",
  tower: "🔮",
  castle: "🏰",
};
const rankBadges = ["🥇", "🥈", "🥉"];

function getLocalKey(weekId, classId, studentId) {
  return `${LOCAL_PREFIX}:${weekId}:${classId}:${studentId}`;
}

function getLocalPrefix(weekId, classId) {
  return `${LOCAL_PREFIX}:${weekId}:${classId}:`;
}

function readLocalState(cls, me) {
  const now = Date.now();
  const weekId = getDennisVillageWeekId(new Date(now));
  const key = getLocalKey(weekId, cls.id, me.id);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return applyDennisVillagePassiveGold(
        normalizeDennisVillageState(JSON.parse(raw), {
          classId: cls.id,
          className: cls.name,
          studentId: me.id,
          studentName: me.name,
          now,
        }),
        now
      );
    }
  } catch (error) {
    console.error("Failed to read local Dennis Village state:", error);
  }

  return createDennisVillageState({
    classId: cls.id,
    className: cls.name,
    studentId: me.id,
    studentName: me.name,
    now,
  });
}

function writeLocalState(state) {
  const entry = buildDennisVillagePublicEntry(state);
  localStorage.setItem(getLocalKey(entry.weekId, entry.classId, entry.studentId), JSON.stringify(entry));
  return entry;
}

function readLocalLeaderboard(cls, state) {
  const prefix = getLocalPrefix(state.weekId, cls.id);
  const entries = [state];

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(prefix) || key.endsWith(`:${state.studentId}`)) continue;

      const raw = localStorage.getItem(key);
      if (raw) entries.push(JSON.parse(raw));
    }
  } catch (error) {
    console.error("Failed to read local Dennis Village leaderboard:", error);
  }

  return getDennisVillageLeaderboard(entries);
}

function formatNumber(value) {
  return Math.floor(Number(value) || 0).toLocaleString();
}

function getStudentDisplayName(row, fallbackClassName = "") {
  const className = String(row?.className || fallbackClassName || "").trim();
  const studentName = String(row?.studentName || "").trim();

  return className ? `${className} ${studentName}` : studentName;
}

function clampPercent(value) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function countBuildings(buildings) {
  return Object.values(buildings || {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

function BuildingEmoji({ id, size = 34, muted = false }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size * 0.68,
        filter: muted ? "grayscale(1)" : "none",
        opacity: muted ? 0.58 : 1,
        lineHeight: 1,
      }}
    >
      {buildingEmoji[id] || "🏠"}
    </span>
  );
}

function getDaysLeft(weekId) {
  const start = new Date(`${weekId}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max(0, Math.ceil((start.getTime() + WEEK_MS - Date.now()) / (24 * 60 * 60 * 1000)));
}

function createQuizRound(previousQuestionId = null) {
  const question = getRandomDennisVillageQuestion(DENNIS_VILLAGE_QUESTIONS, Math.random, previousQuestionId);
  const display = shuffleDennisVillageQuestionOptions(question, Math.random);

  return {
    question,
    choices: display.choices,
  };
}

export default function DennisVillage({ cls, me, session, showToast }) {
  const [state, setState] = useState(() => readLocalState(cls, me));
  const [leaderboard, setLeaderboard] = useState(() => readLocalLeaderboard(cls, state));
  const [mode, setMode] = useState("local");
  const [busy, setBusy] = useState(false);
  const [quizRound, setQuizRound] = useState(() => createQuizRound());
  const [pickedIndex, setPickedIndex] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 900);
  const secure = isSecureStudentSession(session);
  const currentQuestion = quizRound.question;
  const xpPercent = state.xpNeeded ? (state.xp / state.xpNeeded) * 100 : 0;
  const totalBuildings = countBuildings(state.buildings);
  const daysLeft = getDaysLeft(state.weekId);

  useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!secure) {
        const nextState = readLocalState(cls, me);
        if (!active) return;
        setMode("local");
        setState(nextState);
        setLeaderboard(readLocalLeaderboard(cls, nextState));
        return;
      }

      try {
        const result = await getDennisVillageState({ sessionId: session.sessionId });
        if (!active) return;
        const nextState = normalizeDennisVillageState(result.state, {
          classId: cls.id,
          className: cls.name,
          studentId: me.id,
          studentName: me.name,
        });
        setMode("server");
        setState(nextState);
        setLeaderboard(result.leaderboard || getDennisVillageLeaderboard([nextState]));
      } catch (error) {
        if (!active) return;
        if (!isFunctionsUnavailableError(error)) {
          showToast?.(getGameApiErrorMessage(error, "Dennis Village could not load."), "err");
        }
        const nextState = readLocalState(cls, me);
        setMode("local");
        setState(nextState);
        setLeaderboard(readLocalLeaderboard(cls, nextState));
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [cls.id, cls.name, me.id, me.name, secure, session?.sessionId, showToast]);

  useEffect(() => {
    const timer = setInterval(() => {
      setState((current) => {
        const next = applyDennisVillagePassiveGold(current, Date.now());
        if (mode === "local") {
          writeLocalState(next);
          setLeaderboard(readLocalLeaderboard(cls, next));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cls, mode]);

  const villageTiles = useMemo(() => {
    const tiles = [];
    DENNIS_VILLAGE_BUILDINGS.forEach((building) => {
      const owned = Math.min(Number(state.buildings?.[building.id]) || 0, 12);
      for (let index = 0; index < owned; index += 1) {
        tiles.push({ ...building, key: `${building.id}-${index}` });
      }
    });
    return tiles;
  }, [state.buildings]);

  const applyLocalState = (nextState) => {
    const entry = writeLocalState(nextState);
    setState(entry);
    setLeaderboard(readLocalLeaderboard(cls, entry));
  };

  const submitAnswer = async (selectedIndex) => {
    if (busy || pickedIndex !== null) return;
    setBusy(true);
    setPickedIndex(selectedIndex);

    try {
      if (mode === "server" && secure) {
        const result = await answerDennisVillageQuiz({
          sessionId: session.sessionId,
          questionId: currentQuestion.id,
          selectedIndex,
        });
        const nextState = normalizeDennisVillageState(result.state, state);
        setState(nextState);
        setLeaderboard(result.leaderboard || getDennisVillageLeaderboard([nextState]));
        setStatusText(nextState.lastQuiz?.correct ? "Correct! +15 gold and +10 XP" : "Almost. -5 gold");
      } else {
        const nextState = answerDennisVillageQuestion(state, {
          questionId: currentQuestion.id,
          selectedIndex,
          now: Date.now(),
        });
        applyLocalState(nextState);
        setStatusText(nextState.lastQuiz?.correct ? "Correct! +15 gold and +10 XP" : "Almost. -5 gold");
      }
    } catch (error) {
      if (isFunctionsUnavailableError(error)) {
        const nextState = answerDennisVillageQuestion(state, {
          questionId: currentQuestion.id,
          selectedIndex,
          now: Date.now(),
        });
        setMode("local");
        applyLocalState(nextState);
        setStatusText(nextState.lastQuiz?.correct ? "Correct! +15 gold and +10 XP" : "Almost. -5 gold");
      } else {
        setPickedIndex(null);
        showToast?.(getGameApiErrorMessage(error, "Quiz result failed."), "err");
      }
    } finally {
      setBusy(false);
    }
  };

  const nextQuestion = () => {
    setQuizRound((current) => createQuizRound(current.question?.id));
    setPickedIndex(null);
    setStatusText("");
  };

  const buyBuilding = async (buildingId) => {
    if (busy) return;
    setBusy(true);

    try {
      if (mode === "server" && secure) {
        const result = await buyDennisVillageBuilding({
          sessionId: session.sessionId,
          buildingId,
        });
        const nextState = normalizeDennisVillageState(result.state, state);
        setState(nextState);
        setLeaderboard(result.leaderboard || getDennisVillageLeaderboard([nextState]));
      } else {
        applyLocalState(buyDennisVillageBuildingLocal(state, buildingId, Date.now()));
      }
    } catch (error) {
      if (isFunctionsUnavailableError(error)) {
        setMode("local");
        applyLocalState(buyDennisVillageBuildingLocal(state, buildingId, Date.now()));
      } else {
        showToast?.(getGameApiErrorMessage(error, "Building purchase failed."), "err");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        color: theme.ink,
      }}
    >
      <style>
        {`@keyframes dennisVillagePop {
          0% { opacity: 0; transform: translateY(8px) scale(0.9); }
          70% { transform: translateY(-1px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dennisFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }`}
      </style>

      <header style={{ textAlign: "center", marginBottom: 14 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 28px",
            borderRadius: 999,
            border: `4px solid ${theme.goldDark}`,
            background: "linear-gradient(135deg, #FFE782 0%, #FFB334 100%)",
            color: "#5C3500",
            boxShadow: "0 7px 0 #A76609, 0 16px 30px rgba(90,63,13,0.2)",
            fontFamily: "'Chewy', 'Noto Sans KR', cursive",
            fontSize: isNarrow ? 30 : 40,
            lineHeight: 1,
          }}
        >
          Mr. {DENNIS_VILLAGE_NAME}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1fr) 360px",
          gap: 16,
        }}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <StatsPanel state={state} xpPercent={xpPercent} totalBuildings={totalBuildings} />

          {!quizOpen ? (
            <button
              type="button"
              onClick={() => {
                setQuizRound((current) => createQuizRound(current.question?.id));
                setQuizOpen(true);
              }}
              style={{
                minHeight: 66,
                width: "100%",
                border: `4px solid ${theme.magic}`,
                borderRadius: 24,
                background: "linear-gradient(135deg, #A878F2 0%, #7047CE 100%)",
                color: "#fff",
                boxShadow: "0 7px 0 #5737A6, 0 16px 28px rgba(112,71,206,0.24)",
                fontWeight: 950,
                fontSize: 19,
                cursor: "pointer",
              }}
            >
              Take Quiz! +15 gold / -5 gold
            </button>
          ) : (
            <QuizPanel
              busy={busy}
              currentQuestion={currentQuestion}
              displayChoices={quizRound.choices}
              pickedIndex={pickedIndex}
              statusText={statusText}
              onPick={submitAnswer}
              onNext={nextQuestion}
              onClose={() => {
                setQuizOpen(false);
                setPickedIndex(null);
                setStatusText("");
              }}
            />
          )}

          <LeaderboardPanel leaderboard={leaderboard} me={me} className={cls.name} />
          <VillagePanel isNarrow={isNarrow} state={state} tiles={villageTiles} />
          <WeeklyPanel daysLeft={daysLeft} state={state} mode={mode} />
        </div>

        <BuildShopPanel state={state} busy={busy} onBuy={buyBuilding} />
      </div>
    </main>
  );
}

function panelStyle(borderColor = theme.line) {
  return {
    borderRadius: 24,
    border: `4px solid ${borderColor}`,
    background: "linear-gradient(180deg, #FFFDF3 0%, #FFF2D7 100%)",
    boxShadow: "0 10px 30px rgba(55,70,45,0.16)",
  };
}

function StatsPanel({ state, xpPercent, totalBuildings }) {
  return (
    <section style={{ ...panelStyle(theme.gold), padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            padding: 14,
            background: "linear-gradient(135deg, #FFD95C 0%, #FF9E2D 100%)",
            color: "#5C3500",
            boxShadow: "0 5px 0 #B56A08",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.8 }}>GOLD</div>
          <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1.05 }}>{formatNumber(state.gold)}</div>
          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 4 }}>+{formatNumber(state.goldPerSecond)}/sec</div>
        </div>

        <div
          style={{
            borderRadius: 20,
            padding: 14,
            background: "linear-gradient(135deg, #A778F0 0%, #5F80E5 100%)",
            color: "#fff",
            boxShadow: "0 5px 0 #4D55AA",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 950, opacity: 0.86 }}>LEVEL</div>
          <div style={{ fontSize: 34, fontWeight: 950, lineHeight: 1.05 }}>{state.level}</div>
          <div style={{ height: 10, background: "rgba(0,0,0,0.2)", borderRadius: 999, overflow: "hidden", marginTop: 7 }}>
            <div
              style={{
                width: clampPercent(xpPercent),
                height: "100%",
                background: "#69E8FF",
                borderRadius: 999,
                transition: "width 220ms ease",
              }}
            />
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, marginTop: 5 }}>{state.xp} / {state.xpNeeded} XP</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        <MiniStat label="Correct This Week" value={formatNumber(state.weeklyCorrect)} />
        <MiniStat label="Buildings Built" value={formatNumber(totalBuildings)} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ borderRadius: 16, background: "#fff", border: `2px solid ${theme.line}`, padding: "10px 12px" }}>
      <div style={{ color: theme.muted, fontSize: 11, fontWeight: 950 }}>{label}</div>
      <div style={{ color: theme.ink, fontSize: 22, fontWeight: 950, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function QuizPanel({ busy, currentQuestion, displayChoices, pickedIndex, statusText, onPick, onNext, onClose }) {
  const revealed = pickedIndex !== null;

  return (
    <section style={{ ...panelStyle(theme.magic), padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ color: theme.magic, fontSize: 12, fontWeight: 950 }}>ENGLISH QUIZ</div>
          <div style={{ color: theme.ink, fontSize: 20, fontWeight: 950, marginTop: 4 }}>
            {currentQuestion.prompt}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `2px solid ${theme.line}`,
            background: "#fff",
            color: theme.ink,
            fontWeight: 950,
            cursor: "pointer",
          }}
          aria-label="Close quiz"
        >
          X
        </button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {displayChoices.map((choice) => {
          const isPicked = pickedIndex === choice.originalIndex;
          const isCorrect = currentQuestion.answer === choice.originalIndex;
          const bg = revealed && isCorrect ? "#DFF8E5" : revealed && isPicked ? "#FFE0D9" : "#fff";
          const border = revealed && isCorrect ? theme.grassDark : revealed && isPicked ? theme.coral : theme.line;

          return (
            <button
              key={`${choice.originalIndex}-${choice.text}`}
              type="button"
              disabled={busy || revealed}
              onClick={() => onPick(choice.originalIndex)}
              style={{
                minHeight: 48,
                borderRadius: 16,
                border: `3px solid ${border}`,
                background: bg,
                color: theme.ink,
                fontWeight: 900,
                padding: "11px 13px",
                textAlign: "left",
                cursor: busy || revealed ? "default" : "pointer",
              }}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button
          type="button"
          onClick={onNext}
          style={{
            width: "100%",
            marginTop: 12,
            border: `3px solid ${theme.goldDark}`,
            borderRadius: 16,
            background: "linear-gradient(135deg, #FFE782 0%, #FFB334 100%)",
            color: "#5C3500",
            padding: 12,
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          {statusText || "Next question"}
        </button>
      )}
    </section>
  );
}

function LeaderboardPanel({ leaderboard, me, className }) {
  return (
    <section style={{ ...panelStyle(theme.gold), padding: 16 }}>
      <h3 style={{ margin: "0 0 11px", color: theme.ink, fontSize: 20, fontWeight: 950 }}>Weekly Leaderboard</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <LeaderList title="Gold King" rows={leaderboard.goldLeaders || []} metric="gold" me={me} className={className} />
        <LeaderList title="Quiz King" rows={leaderboard.quizLeaders || []} metric="weeklyCorrect" me={me} className={className} />
      </div>
    </section>
  );
}

function LeaderList({ title, rows, metric, me, className }) {
  return (
    <div style={{ borderRadius: 18, background: "#fff", border: `2px solid ${theme.line}`, padding: 11 }}>
      <div style={{ color: theme.softInk, fontSize: 13, fontWeight: 950, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {rows.length === 0 ? (
          <div style={{ color: theme.muted, fontSize: 13, fontWeight: 800 }}>No entries yet.</div>
        ) : (
          rows.slice(0, 3).map((row, index) => {
            const isMe = row.studentId === me.id;
            const displayName = getStudentDisplayName(row, className);
            return (
              <div
                key={`${title}-${row.studentId}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "26px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 7,
                  minHeight: 38,
                  borderRadius: 12,
                  background: isMe ? "#FFF0B8" : "#F8FAF4",
                  color: theme.ink,
                  fontWeight: 900,
                  padding: "7px 8px",
                }}
              >
                <span style={{ textAlign: "center", fontSize: index < 3 ? 19 : 13 }}>
                  {rankBadges[index] || index + 1}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </span>
                <span>{formatNumber(row[metric])}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function VillagePanel({ isNarrow, state, tiles }) {
  return (
    <section
      style={{
        borderRadius: 26,
        border: `4px solid ${theme.grassDark}`,
        background:
          "linear-gradient(180deg, #9EE7FF 0 23%, #6BCB62 23% 100%)",
        minHeight: 280,
        boxShadow: "0 10px 30px rgba(55,70,45,0.16)",
        position: "relative",
        overflow: "hidden",
        padding: 18,
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 16, color: "#fff", fontWeight: 950 }}>
        {formatNumber(state.gold)} gold
      </div>
      <h3 style={{ position: "relative", margin: "42px 0 12px", color: "#fff", fontSize: 21, fontWeight: 950 }}>
        Your Village
      </h3>

      {tiles.length === 0 ? (
        <div
          style={{
            color: "#fff",
            fontWeight: 950,
            textAlign: "center",
            marginTop: 54,
            background: "rgba(30,47,34,0.22)",
            borderRadius: 18,
            padding: 16,
          }}
        >
          Empty plot! Build a Sunny Farm to start.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "repeat(4, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))",
            gap: 9,
            position: "relative",
          }}
        >
          {tiles.map((tile, index) => (
            <div
              key={tile.key}
              title={tile.name}
              style={{
                aspectRatio: "1",
                borderRadius: 14,
                background: "#FFFDF3",
                border: `2px solid ${theme.line}`,
                boxShadow: "0 4px 0 rgba(85,116,63,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: `dennisVillagePop 280ms ease ${Math.min(index, 12) * 20}ms both`,
              }}
            >
              <BuildingEmoji id={tile.id} size={46} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function WeeklyPanel({ daysLeft, state, mode }) {
  return (
    <section style={{ ...panelStyle(theme.magic), padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <h3 style={{ margin: 0, color: theme.ink, fontSize: 19, fontWeight: 950 }}>This Week</h3>
        <span
          style={{
            borderRadius: 999,
            background: "#EBDCFF",
            color: "#5830A5",
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 950,
          }}
        >
          {daysLeft}d left
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <MiniStat label="Quizzes Right" value={formatNumber(state.weeklyCorrect)} />
        <MiniStat label={mode === "server" ? "Saved Online" : "Preview Save"} value={state.weekId} />
      </div>
    </section>
  );
}

function BuildShopPanel({ state, busy, onBuy }) {
  return (
    <aside style={{ ...panelStyle(theme.line), padding: 16, position: "sticky", top: 14 }}>
      <h3 style={{ margin: "0 0 12px", color: theme.ink, fontSize: 22, fontWeight: 950 }}>Build Shop</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {DENNIS_VILLAGE_BUILDINGS.map((building) => {
          const owned = Number(state.buildings?.[building.id]) || 0;
          const cost = getDennisVillageBuildingCost(building.cost, owned);
          const locked = state.level < building.unlockLevel;
          const canBuy = !locked && state.gold >= cost;

          return (
            <button
              key={building.id}
              type="button"
              disabled={!canBuy || busy}
              onClick={() => onBuy(building.id)}
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "56px minmax(0, 1fr)",
                gap: 12,
                alignItems: "center",
                borderRadius: 18,
                border: `3px solid ${canBuy ? building.color : theme.line}`,
                background: locked ? "#EEF2ED" : "#fff",
                padding: 12,
                textAlign: "left",
                cursor: canBuy && !busy ? "pointer" : "default",
                opacity: locked ? 0.66 : 1,
                boxShadow: canBuy ? "0 5px 0 rgba(55,70,45,0.18)" : "none",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: locked ? "#E6ECE4" : building.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BuildingEmoji id={building.id} size={48} muted={locked} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ color: theme.ink, fontSize: 15, fontWeight: 950 }}>{building.name}</div>
                  <div
                    style={{
                      borderRadius: 999,
                      background: "#EAF0E8",
                      color: theme.softInk,
                      padding: "3px 8px",
                      fontSize: 12,
                      fontWeight: 950,
                    }}
                  >
                    x{owned}
                  </div>
                </div>
                <div style={{ color: theme.muted, fontSize: 12, fontWeight: 850, marginTop: 4 }}>
                  {locked ? `Unlocks at Lv.${building.unlockLevel}` : `${formatNumber(cost)} gold / +${building.production}/sec`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
