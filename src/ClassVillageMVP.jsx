import { useEffect, useState } from "react";

const VILLAGE_SCENE_SRC = "/assets/village/kenney-rpg-urban/pack/Sample.png";

const TOWN_LOCATIONS = [
  {
    id: "school",
    name: "English Academy",
    subtitle: "Lv.1 Word Sprint",
    unlockAt: 0,
    accent: "#FF7043",
    top: "24%",
    left: "31%",
    description: "Jump into a short word dungeon and clear five English questions.",
    action: "dungeon",
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
    action: "forest",
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
    action: "ranking",
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
    action: "shop",
  },
];

const WORD_DUNGEON_QUESTIONS = [
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

function getTownStatus(totalPoints) {
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

function buildTickerMessages({ cls, me, classRanked, unlocked, next, totalPoints }) {
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

function getRewardPreview(correctCount) {
  if (correctCount === WORD_DUNGEON_QUESTIONS.length) return 3;
  if (correctCount >= 4) return 2;
  if (correctCount >= 2) return 1;
  return 0;
}

function getGradeTone(correctCount) {
  if (correctCount === WORD_DUNGEON_QUESTIONS.length) {
    return { bg: "#E8FFF2", text: "#1B8B4B", label: "Perfect clear" };
  }
  if (correctCount >= 4) return { bg: "#EEF4FF", text: "#1A4ED8", label: "Strong run" };
  if (correctCount >= 2) return { bg: "#FFF8E8", text: "#B7791F", label: "Good practice" };
  return { bg: "#FFF1F2", text: "#C53030", label: "Try again" };
}

export default function ClassVillageMVP({ cls, me, classRanked, onOpenTab, showToast, css, C }) {
  const totalPoints = (cls.students || []).reduce((sum, student) => sum + (student.points || 0), 0);
  const { unlocked, next, percent } = getTownStatus(totalPoints);
  const tickerMessages = buildTickerMessages({ cls, me, classRanked, unlocked, next, totalPoints });
  const [tickerIndex, setTickerIndex] = useState(0);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [dungeonState, setDungeonState] = useState({ phase: "intro", index: 0, answers: [], startedAtMs: null });

  useEffect(() => {
    if (tickerMessages.length <= 1) return undefined;

    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [tickerMessages.length]);

  const activeLocation = TOWN_LOCATIONS.find((location) => location.id === activeLocationId) || null;

  const closeLocation = () => {
    setActiveLocationId(null);
    setDungeonState({ phase: "intro", index: 0, answers: [], startedAtMs: null });
  };

  const startWordDungeon = () => {
    setDungeonState({
      phase: "playing",
      index: 0,
      answers: [],
      startedAtMs: Date.now(),
    });
  };

  const answerWordDungeon = (choiceIndex) => {
    setDungeonState((prev) => {
      const nextAnswers = [...prev.answers, choiceIndex];
      const nextIndex = prev.index + 1;

      if (nextIndex >= WORD_DUNGEON_QUESTIONS.length) {
        const correctCount = nextAnswers.reduce(
          (count, answer, index) => count + Number(answer === WORD_DUNGEON_QUESTIONS[index].answer),
          0
        );

        const rewardPreview = getRewardPreview(correctCount);
        if (showToast) {
          showToast(
            rewardPreview > 0
              ? `Dungeon clear! Preview reward: +${rewardPreview} stars`
              : "Dungeon finished. Try once more for a reward preview.",
            rewardPreview > 0 ? "ok" : "err"
          );
        }

        return {
          ...prev,
          phase: "result",
          index: nextIndex,
          answers: nextAnswers,
          endedAtMs: Date.now(),
        };
      }

      return {
        ...prev,
        index: nextIndex,
        answers: nextAnswers,
      };
    });
  };

  const correctCount =
    dungeonState.phase === "result"
      ? dungeonState.answers.reduce(
          (count, answer, index) => count + Number(answer === WORD_DUNGEON_QUESTIONS[index].answer),
          0
        )
      : 0;
  const rewardPreview = getRewardPreview(correctCount);
  const resultTone = getGradeTone(correctCount);
  const desktopTownHeight = "calc(100vh - 300px)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "60px 1fr",
        height: "100vh",
        maxHeight: desktopTownHeight,
        minHeight: 0,
        overflow: "hidden",
        background: "linear-gradient(180deg, #F4F8FF 0%, #FFFFFF 100%)",
        borderRadius: 28,
        boxShadow: "0 22px 50px rgba(26,35,126,0.14)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 16,
          height: 60,
          padding: "0 16px",
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.38), rgba(255,255,255,0))," +
            "linear-gradient(135deg, #1A237E 0%, #3249B4 100%)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.74)", fontSize: 11, fontWeight: 800, letterSpacing: 1.1 }}>
            MAIN LOBBY
          </div>
          <div style={{ fontFamily: "'Chewy', 'Noto Sans KR', cursive", color: "#fff", fontSize: 25, lineHeight: 1.05 }}>
            {cls.name} Town
          </div>
        </div>

        <div
          style={{
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.16)",
            padding: "10px 14px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          LIVE TICKER: {tickerMessages[tickerIndex]}
        </div>

        <div
          style={{
            ...css.pill("rgba(255,255,255,0.16)", "#fff"),
            height: 36,
            display: "flex",
            alignItems: "center",
          }}
        >
          {me.points} stars
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 16,
          padding: "0 16px 16px",
          minHeight: 0,
        }}
      >
        <div
          style={css.card({
            marginBottom: 0,
            padding: 12,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          })}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              height: "100%",
              borderRadius: 26,
              overflow: "hidden",
              border: "4px solid #1A237E",
              boxShadow: "0 20px 38px rgba(26,35,126,0.18)",
              background: "#101A56",
            }}
          >
            <img
              src={VILLAGE_SCENE_SRC}
              alt={`${cls.name} world map`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                imageRendering: "pixelated",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(7,14,42,0.02) 0%, rgba(7,14,42,0.22) 100%)",
              }}
            />

            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
              <span style={{ ...css.pill("rgba(15,23,42,0.78)", "#fff"), backdropFilter: "blur(8px)" }}>
                {me.name}: {me.points} stars
              </span>
              <span style={{ ...css.pill("rgba(255,255,255,0.88)", C.dark) }}>
                Next: {next ? next.name : "Full Town"}
              </span>
            </div>

            {TOWN_LOCATIONS.map((location) => {
              const isUnlocked = totalPoints >= location.unlockAt;

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => isUnlocked && setActiveLocationId(location.id)}
                  style={{
                    position: "absolute",
                    top: location.top,
                    left: location.left,
                    transform: "translate(-50%, -50%)",
                    width: "22%",
                    maxWidth: 152,
                    minWidth: 108,
                    padding: "10px 12px",
                    borderRadius: 18,
                    border: isUnlocked ? "2px solid rgba(255,255,255,0.2)" : "2px dashed rgba(255,255,255,0.6)",
                    background: isUnlocked ? `${location.accent}EE` : "rgba(15,23,42,0.62)",
                    color: "#fff",
                    cursor: isUnlocked ? "pointer" : "not-allowed",
                    boxShadow: isUnlocked ? "0 16px 26px rgba(0,0,0,0.28)" : "none",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.1 }}>{location.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.95, marginTop: 4 }}>
                    {isUnlocked ? location.subtitle : `${location.unlockAt} stars to unlock`}
                  </div>
                </button>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 14,
                background: "rgba(10,16,45,0.72)",
                color: "#fff",
                borderRadius: 18,
                padding: "12px 14px",
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 14 }}>Explore the town</div>
              <div style={{ fontSize: 12, opacity: 0.84, marginTop: 4, lineHeight: 1.5 }}>
                Click a building to enter a dungeon, open the shop, or check the leaderboard.
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateRows: "auto auto auto",
            gap: 12,
            minHeight: 0,
          }}
        >
          <div style={css.card({ marginBottom: 0, padding: 14 })}>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.dark, marginBottom: 10 }}>Buildings</div>
            <div style={{ display: "grid", gap: 8 }}>
              {TOWN_LOCATIONS.map((location) => {
                const isUnlocked = totalPoints >= location.unlockAt;

                return (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => isUnlocked && setActiveLocationId(location.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 16,
                      border: `2px solid ${isUnlocked ? `${location.accent}55` : "#E2E8F0"}`,
                      background: isUnlocked ? `${location.accent}16` : "#F8FAFC",
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                      color: C.dark,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 40,
                        borderRadius: 999,
                        background: isUnlocked ? location.accent : "#CBD5E1",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{location.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                        {isUnlocked ? location.subtitle : `${location.unlockAt} stars to unlock`}
                      </div>
                    </div>
                    <div style={{ ...css.pill(isUnlocked ? location.accent : "#CBD5E1", "#fff"), flexShrink: 0 }}>
                      {isUnlocked ? "Open" : "Locked"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={css.card({ marginBottom: 0, padding: 14 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: C.dark }}>Town Progress</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 800 }}>
                {next ? `${totalPoints} / ${next.unlockAt}` : "Completed"}
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                height: 14,
                borderRadius: 999,
                background: "#E8EAF6",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #FF7043 0%, #FFC107 100%)",
                  borderRadius: 999,
                }}
              />
            </div>
            <div style={{ marginTop: 8, color: C.muted, fontSize: 12, lineHeight: 1.45 }}>
              {next
                ? `${next.unlockAt - totalPoints} more stars to unlock ${next.name}.`
                : "Every route is open. Backend reward sync is the next step."}
            </div>
          </div>

          <div style={css.card({ marginBottom: 0, padding: 14 })}>
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "#FFF8E8",
                }}
              >
                <div>
                  <div style={{ color: C.muted, fontWeight: 800, fontSize: 11 }}>Class Stars</div>
                  <div style={{ color: C.dark, fontSize: 24, fontWeight: 900, marginTop: 4 }}>{totalPoints}</div>
                </div>
                <div style={css.pill("#FF7043", "#fff")}>{unlocked.length} open</div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "#EEF4FF",
                }}
              >
                <div>
                  <div style={{ color: C.muted, fontWeight: 800, fontSize: 11 }}>Next Unlock</div>
                  <div style={{ color: C.dark, fontSize: 17, fontWeight: 900, marginTop: 4 }}>
                    {next ? next.name : "Town Complete"}
                  </div>
                </div>
                <div style={css.pill(next ? "#5C6BC0" : "#43A047", "#fff")}>
                  {next ? `${next.unlockAt} stars` : "Done"}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: C.muted, lineHeight: 1.45 }}>
              Pixel art for this MVP uses Kenney&apos;s RPG Urban Kit (CC0).
            </div>
          </div>
        </div>
      </div>

      {activeLocation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(9,14,34,0.72)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 600,
              background: "#fff",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 30px 60px rgba(15,23,42,0.35)",
            }}
          >
            <div
              style={{
                padding: 20,
                color: "#fff",
                background: `linear-gradient(135deg, ${activeLocation.accent} 0%, #1A237E 100%)`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.8, letterSpacing: 1 }}>{activeLocation.subtitle}</div>
              <div style={{ fontFamily: "'Chewy', 'Noto Sans KR', cursive", fontSize: 30, marginTop: 8 }}>
                {activeLocation.name}
              </div>
              <div style={{ fontSize: 13, marginTop: 8, opacity: 0.88, lineHeight: 1.5 }}>
                {activeLocation.description}
              </div>
            </div>

            <div style={{ padding: 20 }}>
              {activeLocation.id === "school" && dungeonState.phase === "intro" && (
                <div>
                  <div style={{ ...css.card({ marginBottom: 14, padding: 16, background: "#FFF8E8", boxShadow: "none" }) }}>
                    <div style={{ fontWeight: 900, color: C.dark }}>Dungeon Rules</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
                      Clear 5 quick English questions. This is a front-end MVP run. Reward preview is shown locally now,
                      and the real server reward flow will be connected next.
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                    <div style={{ ...css.card({ marginBottom: 0, padding: 16, background: "#F8FAFC", boxShadow: "none" }) }}>
                      <div style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>Expected reward preview</div>
                      <div style={{ color: C.dark, fontWeight: 900, fontSize: 24, marginTop: 6 }}>0-3 stars</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      style={css.btn(activeLocation.accent, "#fff", { padding: "12px 18px", fontSize: 14 })}
                      onClick={startWordDungeon}
                    >
                      Enter Dungeon
                    </button>
                    <button
                      style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
                      onClick={closeLocation}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {activeLocation.id === "school" && dungeonState.phase === "playing" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontWeight: 900, color: C.dark }}>
                      Question {dungeonState.index + 1} / {WORD_DUNGEON_QUESTIONS.length}
                    </div>
                    <div style={css.pill("#EEF4FF", "#1A237E")}>Word Sprint</div>
                  </div>
                  <div style={{ ...css.card({ marginBottom: 14, padding: 18, background: "#F8FAFC", boxShadow: "none" }) }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: C.dark, lineHeight: 1.45 }}>
                      {WORD_DUNGEON_QUESTIONS[dungeonState.index].prompt}
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {WORD_DUNGEON_QUESTIONS[dungeonState.index].choices.map((choice, choiceIndex) => (
                      <button
                        key={choice}
                        style={{
                          ...css.btn("#F8FAFC", C.dark, {
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 18,
                            border: "2px solid #E2E8F0",
                            textAlign: "left",
                            fontSize: 14,
                          }),
                        }}
                        onClick={() => answerWordDungeon(choiceIndex)}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeLocation.id === "school" && dungeonState.phase === "result" && (
                <div>
                  <div
                    style={{
                      borderRadius: 20,
                      background: resultTone.bg,
                      color: resultTone.text,
                      padding: 18,
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: 22 }}>{resultTone.label}</div>
                    <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
                      You answered {correctCount} / {WORD_DUNGEON_QUESTIONS.length} correctly.
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 800 }}>
                      Preview reward: {rewardPreview > 0 ? `+${rewardPreview} stars` : "No reward yet"}
                    </div>
                  </div>
                  <div style={{ ...css.card({ marginBottom: 14, padding: 16, background: "#F8FAFC", boxShadow: "none" }) }}>
                    <div style={{ fontWeight: 900, color: C.dark, marginBottom: 8 }}>What happens next</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                      The dungeon loop is now playable in the UI. Next step is connecting this result to Cloud Functions so
                      play time, score, and reward can be verified on the server.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      style={css.btn(activeLocation.accent, "#fff", { padding: "12px 18px", fontSize: 14 })}
                      onClick={startWordDungeon}
                    >
                      Play Again
                    </button>
                    <button
                      style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
                      onClick={closeLocation}
                    >
                      Back to Town
                    </button>
                  </div>
                </div>
              )}

              {activeLocation.id === "forest" && (
                <div>
                  <div style={{ ...css.card({ marginBottom: 14, padding: 16, background: "#E8FFF6", boxShadow: "none" }) }}>
                    <div style={{ fontWeight: 900, color: C.dark }}>Forest roadmap</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
                      This zone is reserved for fast reaction games, boss raids, and class events. The world map and lock
                      flow are ready now, and the next implementation step is attaching a real mini-game here.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      style={css.btn(activeLocation.accent, "#fff", { padding: "12px 18px", fontSize: 14 })}
                      onClick={() => showToast && showToast("Forest dungeon is the next gameplay target.")}
                    >
                      Preview Route
                    </button>
                    <button
                      style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
                      onClick={closeLocation}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {activeLocation.id === "shop" && (
                <div>
                  <div style={{ ...css.card({ marginBottom: 14, padding: 16, background: "#FFF9E6", boxShadow: "none" }) }}>
                    <div style={{ fontWeight: 900, color: C.dark }}>Star Market access</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
                      This route links today&apos;s reward shop and prepares the same building for future gacha systems.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      style={css.btn(activeLocation.accent, "#fff", { padding: "12px 18px", fontSize: 14 })}
                      onClick={() => {
                        onOpenTab("shop");
                        closeLocation();
                      }}
                    >
                      Open Shop
                    </button>
                    <button
                      style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
                      onClick={closeLocation}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {activeLocation.id === "hall" && (
                <div>
                  <div style={{ ...css.card({ marginBottom: 14, padding: 16, background: "#EEF4FF", boxShadow: "none" }) }}>
                    <div style={{ fontWeight: 900, color: C.dark }}>Ranking board</div>
                    <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginTop: 8 }}>
                      Town Hall connects the world map to your competitive loop. Students can jump from the lobby straight
                      into ranking without leaving the game flow.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      style={css.btn(activeLocation.accent, "#fff", { padding: "12px 18px", fontSize: 14 })}
                      onClick={() => {
                        onOpenTab("ranking");
                        closeLocation();
                      }}
                    >
                      Open Ranking
                    </button>
                    <button
                      style={css.btn("#EDF2F7", C.dark, { padding: "12px 18px", fontSize: 14 })}
                      onClick={closeLocation}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
