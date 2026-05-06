import { useEffect, useState } from "react";

import { getGameApiErrorMessage, updateStudentProfile } from "./lib/gameApi";
import { isSecureStudentSession } from "./lib/studentSession";

import {
  PROFILE_MVP_SHEET_COLS,
  PROFILE_MVP_SHEET_ROWS,
  PROFILE_MVP_SHEET_SRC,
  buildStudentProfileMvp,
  getProfileMvpRarityStyle,
} from "../shared/profileMvp.js";

function statCardStyle(tone) {
  return {
    display: "grid",
    gap: 6,
    padding: "16px 18px",
    borderRadius: 20,
    background: tone.background,
    border: `1px solid ${tone.border}`,
    minWidth: 0,
  };
}

function getSpriteFrameStyle(avatar, extra = {}) {
  const x = PROFILE_MVP_SHEET_COLS === 1 ? 0 : (avatar.sheet.col / (PROFILE_MVP_SHEET_COLS - 1)) * 100;
  const y = PROFILE_MVP_SHEET_ROWS === 1 ? 0 : (avatar.sheet.row / (PROFILE_MVP_SHEET_ROWS - 1)) * 100;
  const xOffset = Number(avatar.sheet.xOffset || 0);
  const yOffset = Number(avatar.sheet.yOffset || 0);

  return {
    backgroundImage: `url(${PROFILE_MVP_SHEET_SRC})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${PROFILE_MVP_SHEET_COLS * 100}% ${PROFILE_MVP_SHEET_ROWS * 100}%`,
    backgroundPosition: `calc(${x}% + ${xOffset}px) calc(${y}% + ${yOffset}px)`,
    ...extra,
  };
}

function orbitDotStyle(index, accent) {
  const positions = [
    { top: "14%", left: "18%" },
    { top: "20%", right: "12%" },
    { bottom: "16%", left: "14%" },
    { bottom: "20%", right: "18%" },
  ];

  return {
    position: "absolute",
    width: index % 2 === 0 ? 10 : 6,
    height: index % 2 === 0 ? 10 : 6,
    borderRadius: "50%",
    background: accent,
    boxShadow: `0 0 20px ${accent}`,
    opacity: 0.9,
    ...positions[index % positions.length],
  };
}

export default function StudentProfileMVP({ cls, me, session, onNavigate, showToast, css, C }) {
  const preview = buildStudentProfileMvp({ cls, student: me });
  const [equippedAvatarId, setEquippedAvatarId] = useState(preview.equippedAvatar.id);
  const [savingAvatarId, setSavingAvatarId] = useState(null);
  const activeAvatar =
    preview.avatarCatalog.find((avatar) => avatar.id === equippedAvatarId) || preview.equippedAvatar;
  const activeRarity = getProfileMvpRarityStyle(activeAvatar.rarity);
  const unlockedAvatarIds = new Set(preview.unlockedAvatars.map((avatar) => avatar.id));
  const canPersistAvatar = isSecureStudentSession(session);

  useEffect(() => {
    setEquippedAvatarId(preview.equippedAvatar.id);
  }, [preview.equippedAvatar.id]);

  const equipAvatar = async (avatarId) => {
    if (!unlockedAvatarIds.has(avatarId) || savingAvatarId || avatarId === equippedAvatarId) {
      return;
    }

    const previousAvatarId = equippedAvatarId;
    setEquippedAvatarId(avatarId);

    if (!canPersistAvatar) {
      showToast?.("Avatar equipped.");
      return;
    }

    setSavingAvatarId(avatarId);
    try {
      await updateStudentProfile({
        sessionId: session.sessionId,
        avatarId,
      });
      showToast?.("Avatar equipped.");
    } catch (error) {
      setEquippedAvatarId(previousAvatarId);
      showToast?.(getGameApiErrorMessage(error, "Avatar update failed."), "err");
    } finally {
      setSavingAvatarId(null);
    }
  };

  const tones = {
    stars: { background: "#FFF3E0", border: "#FFD6A6" },
    lifetime: { background: "#EEF4FF", border: "#C8D5FF" },
    next: { background: "#E8FFF6", border: "#B7E7CF" },
  };

  return (
    <div className="profile-mvp-root" style={{ display: "grid", gap: 16 }}>
      <style>{`
        .profile-mvp-hero-grid {
          display: grid;
          grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
          gap: 0;
        }
        .profile-mvp-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .profile-mvp-wardrobe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(196px, 1fr));
          gap: 14px;
        }
        .profile-mvp-card {
          transition:
            transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 180ms ease;
        }
        .profile-mvp-card:hover {
          transform: translateY(-6px);
        }
        .profile-mvp-float {
          animation: profile-mvp-float 4.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .profile-mvp-pulse {
          animation: profile-mvp-pulse 3.6s ease-in-out infinite;
        }
        .profile-mvp-orbit {
          animation: profile-mvp-orbit 5.8s ease-in-out infinite;
        }
        .profile-mvp-shine {
          overflow: hidden;
        }
        .profile-mvp-shine::after {
          content: "";
          position: absolute;
          inset: -35%;
          background: linear-gradient(120deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0) 62%);
          transform: translateX(-68%) rotate(10deg);
          animation: profile-mvp-shine 6.4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes profile-mvp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes profile-mvp-pulse {
          0%, 100% { opacity: 0.82; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes profile-mvp-orbit {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.86; }
          50% { transform: translateY(-6px) scale(1.08); opacity: 1; }
        }
        @keyframes profile-mvp-shine {
          0%, 100% { transform: translateX(-72%) rotate(10deg); opacity: 0; }
          18% { opacity: 0; }
          34% { opacity: 1; }
          52% { transform: translateX(72%) rotate(10deg); opacity: 0; }
        }
        @media (max-width: 980px) {
          .profile-mvp-hero-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .profile-mvp-stats-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .profile-mvp-card,
          .profile-mvp-float,
          .profile-mvp-pulse,
          .profile-mvp-orbit,
          .profile-mvp-shine::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div
        style={css.card({
          padding: 0,
          overflow: "hidden",
          background: "linear-gradient(135deg, #101D63 0%, #293C9D 50%, #4965DB 100%)",
          color: "#fff",
        })}
      >
        <div className="profile-mvp-hero-grid">
          <div
            style={{
              padding: 24,
              background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
              borderRight: "1px solid rgba(255,255,255,0.12)",
              display: "grid",
              gap: 18,
              alignContent: "start",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ ...css.pill("rgba(255,255,255,0.16)", "#fff"), width: "fit-content" }}>PROFILE</div>
              <div style={css.pill(activeRarity.accent, "#13205B")}>{activeRarity.label}</div>
            </div>

            <div
              className="profile-mvp-float"
              style={{
                position: "relative",
                minHeight: 312,
                borderRadius: 34,
                overflow: "hidden",
                border: `1px solid ${activeRarity.frame}`,
                background:
                  "radial-gradient(circle at top, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 55%)," +
                  "linear-gradient(180deg, rgba(10,16,45,0.25), rgba(10,16,45,0.55))",
                boxShadow: `0 30px 70px ${activeRarity.glow}`,
                isolation: "isolate",
              }}
            >
              <div
                className="profile-mvp-pulse"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: activeRarity.aura,
                  filter: "blur(2px)",
                  opacity: 0.95,
                }}
              />

              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="profile-mvp-orbit"
                  style={orbitDotStyle(index, activeRarity.accent)}
                />
              ))}

              <div
                className="profile-mvp-shine"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 26,
                  transform: "translateX(-50%)",
                  width: "78%",
                  aspectRatio: "11 / 12",
                  borderRadius: 28,
                  overflow: "hidden",
                  border: `2px solid ${activeRarity.frame}`,
                  boxShadow: `0 18px 38px ${activeRarity.glow}`,
                  ...getSpriteFrameStyle(activeAvatar, {
                    backgroundColor: "#FDF6E4",
                  }),
                }}
              />
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: 20,
                background: "rgba(10,16,45,0.68)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, opacity: 0.72 }}>EQUIPPED AVATAR</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{activeAvatar.name}</div>
                </div>
                <div style={css.pill("rgba(255,255,255,0.14)", "#fff")}>Lv.{activeAvatar.unlockLevel}</div>
              </div>
              <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>{activeAvatar.theme}</div>
            </div>
          </div>

          <div style={{ padding: 24, display: "grid", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.1, opacity: 0.76 }}>STUDENT PROFILE</div>
                <div style={{ fontFamily: "'Chewy', 'Noto Sans KR', cursive", fontSize: 42, lineHeight: 0.98, marginTop: 8 }}>
                  {preview.studentName}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                  <span style={css.pill("rgba(255,255,255,0.14)", "#fff")}>{preview.className}</span>
                  <span style={css.pill("rgba(255,255,255,0.14)", "#fff")}>{preview.unlockedAvatars.length} avatars open</span>
                  <span style={css.pill("rgba(255,255,255,0.14)", "#fff")}>{preview.lockedAvatars.length} locked</span>
                </div>
              </div>

              <div
                style={{
                  minWidth: 196,
                  padding: "16px 18px",
                  borderRadius: 24,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
                  border: `1px solid ${activeRarity.frame}`,
                  boxShadow: `0 18px 36px ${activeRarity.glow}`,
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, opacity: 0.74 }}>CURRENT LEVEL</div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>Lv.{preview.level.level}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: activeRarity.frame }}>{activeRarity.label} Tier</div>
              </div>
            </div>

            <div className="profile-mvp-stats-grid">
              <div style={statCardStyle(tones.stars)}>
                <div style={{ color: "#7A4A00", fontSize: 12, fontWeight: 800 }}>CURRENT STARS</div>
                <div style={{ color: C.dark, fontSize: 26, fontWeight: 900 }}>{preview.currentStars}</div>
              </div>
              <div style={statCardStyle(tones.lifetime)}>
                <div style={{ color: "#3651A4", fontSize: 12, fontWeight: 800 }}>LIFETIME STARS</div>
                <div style={{ color: C.dark, fontSize: 26, fontWeight: 900 }}>{preview.lifetimePoints}</div>
              </div>
              <div style={statCardStyle(tones.next)}>
                <div style={{ color: "#266B46", fontSize: 12, fontWeight: 800 }}>NEXT LEVEL</div>
                <div style={{ color: C.dark, fontSize: 26, fontWeight: 900 }}>
                  {preview.level.nextLevel ? `${preview.level.pointsToNextLevel} left` : "Max"}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 22,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.1, opacity: 0.74 }}>LEVEL TRACK</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
                    Level {preview.level.level}
                    {preview.level.nextLevel ? ` to Level ${preview.level.nextLevel}` : " complete"}
                  </div>
                </div>
                <div style={{ ...css.pill("rgba(255,255,255,0.16)", "#fff"), whiteSpace: "nowrap" }}>
                  {preview.level.nextLevel ? `${preview.level.progressPercent}%` : "100%"}
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  height: 16,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${preview.level.progressPercent}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${activeRarity.accent} 0%, #FF8A65 100%)`,
                  }}
                />
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13, lineHeight: 1.6, opacity: 0.84 }}>
                <div>
                  {preview.level.nextLevel
                    ? `${preview.level.pointsToNextLevel} more lifetime stars unlock the next avatar tier.`
                    : "Every MVP avatar tier is unlocked."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={css.card({ marginBottom: 0, padding: 18 })}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", marginBottom: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: C.muted, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>AVATAR WARDROBE</div>
            <div style={{ color: C.dark, fontSize: 24, fontWeight: 900, marginTop: 4 }}>Avatar Collection</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["common", "rare", "epic", "legendary"].map((rarity) => {
              const rarityStyle = getProfileMvpRarityStyle(rarity);
              const count = preview.avatarCatalog.filter((avatar) => avatar.rarity === rarity).length;
              return (
                <div key={rarity} style={css.pill(rarityStyle.frame, "#13205B")}>
                  {rarityStyle.label} {count}
                </div>
              );
            })}
          </div>
        </div>

        <div className="profile-mvp-wardrobe-grid">
          {preview.avatarCatalog.map((avatar) => {
            const rarityStyle = getProfileMvpRarityStyle(avatar.rarity);
            const isUnlocked = unlockedAvatarIds.has(avatar.id);
            const isEquipped = activeAvatar.id === avatar.id;
            const isSaving = savingAvatarId === avatar.id;

            return (
              <div
                key={avatar.id}
                className="profile-mvp-card"
                style={{
                  position: "relative",
                  borderRadius: 24,
                  padding: 14,
                  background: isUnlocked
                    ? `linear-gradient(180deg, ${rarityStyle.frame} 0%, #FFFFFF 72%)`
                    : "#F8FAFC",
                  border: isEquipped
                    ? `2px solid ${rarityStyle.accent}`
                    : isUnlocked
                      ? `1px solid ${rarityStyle.frame}`
                      : "1px solid #E2E8F0",
                  boxShadow: isUnlocked ? `0 18px 34px ${rarityStyle.glow}` : "0 8px 18px rgba(15,23,42,0.05)",
                  display: "grid",
                  gap: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  className={isUnlocked ? "profile-mvp-pulse" : ""}
                  style={{
                    position: "absolute",
                    inset: 10,
                    borderRadius: 18,
                    background: isUnlocked ? rarityStyle.aura : "transparent",
                    opacity: isUnlocked ? 0.88 : 0,
                    filter: "blur(4px)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", position: "relative", zIndex: 1 }}>
                  <div style={css.pill(isUnlocked ? rarityStyle.accent : "#CBD5E1", isUnlocked ? "#13205B" : "#475569")}>
                    {rarityStyle.label}
                  </div>
                  <div style={css.pill(isUnlocked ? "#FFFFFF" : "#F1F5F9", C.dark)}>
                    {isUnlocked ? `Lv.${avatar.unlockLevel}` : `Unlock Lv.${avatar.unlockLevel}`}
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    borderRadius: 22,
                    overflow: "hidden",
                    aspectRatio: "11 / 12",
                    border: `1px solid ${isUnlocked ? rarityStyle.frame : "#E2E8F0"}`,
                    boxShadow: isUnlocked ? `0 14px 24px ${rarityStyle.glow}` : "none",
                    ...getSpriteFrameStyle(avatar, {
                      backgroundColor: "#FCF3DD",
                      filter: isUnlocked ? "none" : "grayscale(1) saturate(0.2) brightness(0.92)",
                    }),
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ color: C.dark, fontSize: 17, fontWeight: 900 }}>{avatar.name}</div>
                  <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{avatar.theme}</div>
                </div>

                <button
                  type="button"
                  style={css.btn(
                    isEquipped ? C.dark : isUnlocked ? rarityStyle.accent : "#CBD5E1",
                    isEquipped ? "#fff" : isUnlocked ? "#13205B" : "#64748B",
                    {
                      width: "100%",
                      padding: "10px 16px",
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                      position: "relative",
                      zIndex: 1,
                    }
                  )}
                  disabled={!isUnlocked || Boolean(savingAvatarId)}
                  onClick={() => equipAvatar(avatar.id)}
                >
                  {isSaving ? "Saving..." : isEquipped ? "Equipped" : isUnlocked ? "Equip" : "Locked"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
