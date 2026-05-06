import React from "react";
import { C, FF, css } from "../lib/design";
import { fmtDate } from "../lib/utils";

export default function HomeView({ setView, sortedNotices, toast }) {
  return (
    <div style={css.app}>
      {/* Header */}
      <div style={{
        background: "#1A237E",
        padding: "34px 24px 54px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -24, left: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div className="cls-float" style={{ fontSize: 68, lineHeight: 1, marginBottom: 12 }}>⭐</div>
        <h1 style={{ fontFamily: FF.display, fontSize: 44, color: "#fff", margin: "0 0 6px", letterSpacing: 0.5 }}>
          Class Stars!
        </h1>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700 }}>
          Mr. Dennis's English Class ✏️
        </div>
      </div>

      {toast && <div style={css.toast(toast.type)}>{toast.msg}</div>}

      {/* Content panel */}
      <div style={{ background: C.bg, borderRadius: "28px 28px 0 0", marginTop: -28 }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 24px",
          display: "flex",
          flexDirection: "row",
          gap: 24,
          alignItems: "flex-start",
        }}>

          {/* 왼쪽: Student / Teacher 카드 */}
          <div style={{ flex: 1 }}>
            <button
              className="cls-btn"
              onClick={() => setView("classSelect")}
              style={{
                ...css.card({ marginBottom: 8 }),
                width: "100%",
                background: C.primary,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 20px",
                textAlign: "left",
                fontFamily: FF.body,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 44 }}>🧒</span>
                <div>
                  <div style={{ fontFamily: FF.display, fontSize: 22, color: "#fff", letterSpacing: 0.3 }}>I'm a Student</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: 700, marginTop: 2 }}>Check my stars ⭐</div>
                </div>
              </div>
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.7)" }}>→</span>
            </button>

            <button
              className="cls-btn"
              onClick={() => setView("adminLogin")}
              style={{
                ...css.card({ marginBottom: 8 }),
                width: "100%",
                backgroundColor: "#FFFFFF",
                background: "#FFFFFF",
                border: `2px solid ${C.primary}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 20px",
                textAlign: "left",
                fontFamily: FF.body,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 44 }}>👩‍🏫</span>
                <div>
                  <div style={{ fontFamily: FF.display, fontSize: 22, color: C.primary, letterSpacing: 0.3 }}>I'm the Teacher</div>
                  <div style={{ fontSize: 13, color: "#888888", fontWeight: 700, marginTop: 2 }}>Manage class &amp; points</div>
                </div>
              </div>
              <span style={{ fontSize: 24, color: C.primary }}>→</span>
            </button>
          </div>

          {/* 오른쪽: Notices */}
          <div style={{ flex: 1.5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontFamily: FF.display, fontSize: 20, color: C.dark, margin: 0, letterSpacing: 0.3 }}>📢 Notices</h3>
              <button
                style={{ background: "none", border: "none", color: C.secondary, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: FF.body }}
                onClick={() => setView("noticeBoard")}
              >
                See all →
              </button>
            </div>

            {sortedNotices.length === 0 ? (
              <div style={css.card({ color: C.muted, textAlign: "center", padding: "24px 16px", fontSize: 15 })}>
                No notices yet 📭
              </div>
            ) : (
              sortedNotices.slice(0, 3).map((notice) => (
                <div key={notice.id} style={css.card({
                  padding: "12px 16px",
                  background: notice.pinned ? "#FFFDE7" : C.card,
                  borderLeft: notice.pinned ? `4px solid ${C.accent}` : "4px solid transparent",
                })}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, flex: 1 }}>
                      {notice.pinned ? "📌 " : ""}{notice.title}
                    </div>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{fmtDate(notice.date)}</span>
                  </div>
                  <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notice.body}</div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
