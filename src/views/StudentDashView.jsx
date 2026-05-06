import React, { Suspense, lazy } from "react";
import { addDoc } from "firebase/firestore";
import { C, FF, css } from "../lib/design";
import { fmtDate, medal, today } from "../lib/utils";
import { REQUESTS_COL } from "../lib/firebaseClient";
import {
  DEFAULT_STUDENT_PATH,
  getStudentTabForPath,
  isDungeonPath,
  normalizeStudentPath,
} from "../../shared/studentRoutes.js";
import SeatPickerPopup from "../components/SeatPickerPopup";
import EnglishAcademyDungeon from "../EnglishAcademyDungeon";

const DennisVillage = lazy(() => import("../DennisVillage"));

export default function StudentDashView({
  cls, me, classRanked, globalRanked,
  logoutStudent, toast, showToast,
  pathname, studentSession,
  openStudentDestination,
  seatPopup, setSeatPopup,
  privacyPopup, setPrivacyPopup,
  shop,
}) {
  const studentRoute = normalizeStudentPath(pathname);
  const villageLayout = studentRoute === "/village" || isDungeonPath(studentRoute);
  const wideStudentLayout = villageLayout || studentRoute === DEFAULT_STUDENT_PATH;

  const myClassRank = classRanked.findIndex((s) => s.id === me.id) + 1;
  const myGlobalRank = globalRanked.findIndex((s) => s.id === me.id) + 1;

  return (
    <div style={css.app}>
      {/* Hero header */}
      <div style={{
        background: "#1A237E",
        padding: "36px 24px 72px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", top: 14, left: 16 }}>
          <button
            style={css.btn("#ffffff", "#1A237E", {
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 800,
              border: "2px solid #1A237E",
            })}
            onClick={logoutStudent}
          >
            ← Back
          </button>
        </div>
        <div style={{ fontFamily: FF.display, fontSize: 27, color: "#fff", marginTop: 8, letterSpacing: 0.3 }}>
          Hi, {me.name}! 👋
        </div>
        <div className="cls-pop" style={{ fontFamily: FF.display, fontSize: 88, color: "#fff", lineHeight: 1, marginTop: 10, marginBottom: 2 }}>
          {me.points}
        </div>
        <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>⭐ Stars</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "8px 20px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 800, marginBottom: 2, letterSpacing: 0.5 }}>CLASS RANK</div>
            <div style={{ fontFamily: FF.display, fontSize: 26, color: "#fff" }}>{medal(myClassRank - 1)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "8px 20px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 800, marginBottom: 2, letterSpacing: 0.5 }}>OVERALL</div>
            <div style={{ fontFamily: FF.display, fontSize: 26, color: "#fff" }}>#{myGlobalRank}</div>
          </div>
        </div>
      </div>

      {toast && <div style={css.toast(toast.type)}>{toast.msg}</div>}

      <div
        style={
          wideStudentLayout
            ? { maxWidth: 1280, margin: "-8px auto 0", padding: "18px 16px 16px" }
            : { ...css.wrap, marginTop: -8 }
        }
      >
        {/* Tab bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: wideStudentLayout ? "nowrap" : "wrap" }}>
          {[
            ["shop", "🛒 Shop"],
            ["village", "Village"],
            ["ranking", "🏆 Ranking"],
            ["purchases", "🛍 Purchases"],
            ["history", "📋 History"],
            ["pin", "🔑 PIN"],
          ].map(([t, label]) => (
            <button
              key={t}
              style={{
                background:
                  (t === "ranking" ? studentRoute === "/hall" : getStudentTabForPath(studentRoute) === t)
                    ? "#1A237E"
                    : "#FFFFFF",
                color:
                  (t === "ranking" ? studentRoute === "/hall" : getStudentTabForPath(studentRoute) === t)
                    ? "#fff"
                    : "#888888",
                border:
                  (t === "ranking" ? studentRoute === "/hall" : getStudentTabForPath(studentRoute) === t)
                    ? "none"
                    : "2px solid #E0E0E0",
                borderRadius: 50,
                padding: "9px 17px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: FF.body,
                transition: "all 0.15s",
              }}
              onClick={() => openStudentDestination(t === "ranking" ? "hall" : t)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dungeon */}
        {studentRoute === "/dungeon/english" && (
          <EnglishAcademyDungeon
            cls={cls}
            me={me}
            session={studentSession}
            onNavigate={openStudentDestination}
            showToast={showToast}
            css={css}
            C={C}
          />
        )}

        {/* Shop */}
        {studentRoute === "/shop" && (
          <div>
            {(shop || []).length === 0 && (
              <div style={css.card({ textAlign: "center", color: C.muted, padding: 36 })}>
                No items in the shop yet 🏪
              </div>
            )}
            {(shop || []).map((item) => (
              <div
                key={item.id}
                style={css.card({ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 8 })}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                  {item.emoji || "🎁"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>{item.name}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ background: "#FF5722", color: "#fff", borderRadius: 50, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>⭐ {item.price}</span>
                  <button
                    style={{ background: me.points >= item.price ? "#1A237E" : C.muted, color: "#fff", border: "none", borderRadius: 50, width: 36, height: 36, fontSize: 16, cursor: me.points >= item.price ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    disabled={me.points < item.price}
                    onClick={() => {
                      if (item.name.includes("Choose Your Seat")) {
                        setSeatPopup({ item });
                      } else {
                        setPrivacyPopup({ req: { type: "purchase", cid: cls.id, sid: me.id, studentName: me.name, className: cls.name, item: item.name, price: item.price, date: today(), createdAtMs: Date.now(), isPublic: true } });
                      }
                    }}
                  >
                    {me.points >= item.price ? "✓" : "💸"}
                  </button>
                </div>
              </div>
            ))}

            {seatPopup && (
              <SeatPickerPopup
                cls={cls}
                me={me}
                item={seatPopup.item}
                onClose={() => setSeatPopup(null)}
                onChoose={(req) => { setSeatPopup(null); setPrivacyPopup({ req }); }}
                css={css}
                C={C}
                FF={FF}
              />
            )}

            {privacyPopup && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, maxWidth: 340, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
                  <h3 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 18 }}>👀 Purchase Visibility</h3>
                  <p style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
                    Should <strong>{privacyPopup.req.item}</strong> be visible to classmates?
                  </p>
                  <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>Your teacher will approve it later.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button style={css.btn(C.success, "#fff", { padding: 14, fontSize: 15, borderRadius: 14 })}
                      onClick={async () => {
                        try {
                          await addDoc(REQUESTS_COL, { ...privacyPopup.req, isPublic: true });
                          setPrivacyPopup(null);
                          showToast("Request sent! 🎉");
                        } catch (e) { console.error(e); showToast("Request failed!", "err"); }
                      }}>
                      🌍 Public — show everyone
                    </button>
                    <button style={css.btn(C.primary, "#fff", { padding: 14, fontSize: 15, borderRadius: 14 })}
                      onClick={async () => {
                        try {
                          await addDoc(REQUESTS_COL, { ...privacyPopup.req, isPublic: false });
                          setPrivacyPopup(null);
                          showToast("Request sent! 🎉");
                        } catch (e) { console.error(e); showToast("Request failed!", "err"); }
                      }}>
                      🔒 Private — only me
                    </button>
                    <button style={css.btn("#F1F5F9", C.dark, { padding: 12 })} onClick={() => setPrivacyPopup(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Village */}
        {studentRoute === "/village" && (
          <Suspense fallback={<div style={css.card({ padding: 20, fontWeight: 900 })}>Loading Dennis Village...</div>}>
            <DennisVillage cls={cls} me={me} session={studentSession} showToast={showToast} />
          </Suspense>
        )}

        {/* Ranking */}
        {studentRoute === "/hall" && (() => {
          const podiumBg = (i) => i === 0 ? "#FFD700" : i === 1 ? "#B0BEC5" : "#FFAB76";
          const podiumText = (i) => i === 0 ? "#7A5800" : i === 1 ? "#37474F" : "#7A3200";
          const renderRankRow = (s, i, showClass = false) => {
            const isMe = s.id === me.id;
            const isPodium = i < 3;
            const publicPurchases = (s.purchases || []).filter((p) => (typeof p === "object" ? p.isPublic : true));
            return (
              <div key={s.id} style={css.card({
                padding: "12px 16px", marginBottom: 6,
                background: isPodium ? podiumBg(i) : isMe ? "#E8EAF6" : C.card,
                borderLeft: isMe && !isPodium ? "4px solid #1A237E" : isPodium ? "none" : "4px solid transparent",
                borderRadius: 16,
              })}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: publicPurchases.length > 0 ? 8 : 0 }}>
                  <span style={{ width: 34, fontSize: isPodium ? 22 : 16, textAlign: "center", fontWeight: 800, color: isPodium ? podiumText(i) : C.mid }}>
                    {isPodium ? (i === 0 ? "👑" : medal(i)) : `#${i + 1}`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: isPodium ? podiumText(i) : C.dark }}>
                      {s.name}{isMe ? " (You)" : ""}
                    </div>
                    {showClass && <div style={{ fontSize: 12, color: isPodium ? podiumText(i) : C.muted, marginTop: 1 }}>{s.className}</div>}
                  </div>
                  <span style={{ background: isPodium ? "rgba(0,0,0,0.12)" : C.cream, color: isPodium ? podiumText(i) : C.dark, borderRadius: 50, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>⭐ {s.points}</span>
                </div>
                {publicPurchases.length > 0 && (
                  <div style={{ marginLeft: 46, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {publicPurchases.map((p, j) => (
                      <span key={j} style={{ ...css.pill("#F1F5F9", isPodium ? podiumText(i) : cls.color), fontSize: 11 }}>
                        {typeof p === "object" ? p.name : p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          };
          return (
            <div>
              <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, marginBottom: 10 }}>CLASS — {cls.name}</p>
              {classRanked.map((s, i) => renderRankRow(s, i, false))}
              <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, margin: "16px 0 10px" }}>OVERALL — Top 10</p>
              {globalRanked.slice(0, 10).map((s, i) => renderRankRow(s, i, true))}
            </div>
          );
        })()}

        {/* Purchases */}
        {studentRoute === "/purchases" && (
          <div>
            <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, marginBottom: 10, letterSpacing: 0.5 }}>MY PURCHASES — {cls.name}</p>
            {(me.purchases || []).length === 0 ? (
              <div style={{ ...css.card({ textAlign: "center", padding: "36px 20px" }) }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
                <div style={{ color: C.muted, fontWeight: 700 }}>No purchases yet!</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Visit the shop to spend your stars</div>
              </div>
            ) : (
              (me.purchases || []).map((p, i) => {
                const pname = typeof p === "object" ? p.name : p;
                const isPublic = typeof p === "object" ? p.isPublic : true;
                return (
                  <div key={i} style={{ ...css.card({ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }) }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🛍</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pname}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isPublic ? "🌍 Public" : "🔒 Private"}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontWeight: 900, fontSize: 15, color: "#FF5722" }}>✅</span>
                    </div>
                  </div>
                );
              })
            )}

            <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, margin: "16px 0 10px", letterSpacing: 0.5 }}>CLASSMATES' PURCHASES</p>
            {classRanked.filter((s) => s.id !== me.id && (s.purchases || []).some((p) => (typeof p === "object" ? p.isPublic : true))).length === 0 ? (
              <div style={{ ...css.card({ textAlign: "center", color: C.muted, padding: 20 }) }}>No classmates have public purchases yet!</div>
            ) : (
              classRanked.filter((s) => s.id !== me.id).map((s) => {
                const publicItems = (s.purchases || []).filter((p) => typeof p === "object" ? p.isPublic : true);
                if (publicItems.length === 0) return null;
                return (
                  <div key={s.id} style={css.card()}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>🧒 {s.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {publicItems.map((p, j) => (
                        <span key={j} style={{ ...css.pill("#F1F5F9", cls.color), fontSize: 12 }}>{typeof p === "object" ? p.name : p}</span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* History */}
        {studentRoute === "/history" && (
          (me.history || []).length === 0 ? (
            <div style={{ ...css.card({ textAlign: "center", padding: "36px 20px" }) }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
              <div style={{ color: C.muted, fontWeight: 700 }}>No history yet!</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Your points activity will appear here</div>
            </div>
          ) : (
            (me.history || []).map((h, i) => (
              <div key={i} style={{ ...css.card({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderLeft: `4px solid ${h.type === "earn" ? "#2E7D32" : "#C62828"}`, borderRadius: "0 20px 20px 0" }) }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>{h.reason}</div>
                  <div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{fmtDate(h.date)}</div>
                </div>
                <span style={{ fontWeight: 900, fontSize: 18, color: h.type === "earn" ? "#2E7D32" : "#C62828", flexShrink: 0, marginLeft: 12 }}>
                  {h.type === "earn" ? "+" : "-"}{h.pts}⭐
                </span>
              </div>
            ))
          )
        )}

        {/* PIN */}
        {studentRoute === "/pin" && (
          <div>
            <div style={{ ...css.card({ textAlign: "center", padding: "36px 24px" }) }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>YOUR PIN</div>
              <div style={{ fontFamily: FF.display, fontSize: 56, fontWeight: 900, color: "#1A237E", letterSpacing: 8 }}>{me.pin}</div>
              <div style={{ fontSize: 13, color: "#888", marginTop: 16, lineHeight: 1.6 }}>Ask your teacher to change your PIN</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
