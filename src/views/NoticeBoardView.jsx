import React from "react";
import { C, css } from "../lib/design";
import { fmtDate } from "../lib/utils";
import BackBtn from "../components/BackBtn";

export default function NoticeBoardView({ setView, sortedNotices }) {
  const noticeBorderColor = (title) =>
    title?.startsWith("G6") ? "#E64A19"
    : title?.startsWith("G5") ? "#1565C0"
    : title?.startsWith("G3") ? "#2E7D32"
    : "#FF5722";

  return (
    <div style={css.app}>
      <div style={{ ...css.header(), background: "#1A237E" }}>
        <BackBtn setView={setView} to="home" />
        <h1 style={css.htitle}>📢 Notice Board</h1>
        <div style={{ width: 70 }} />
      </div>
      <div style={css.wrap}>
        {sortedNotices.length === 0 ? (
          <div style={css.card({ textAlign: "center", color: C.muted, padding: 36, fontSize: 16 })}>
            No notices yet 📭
          </div>
        ) : (
          sortedNotices.map((notice) => (
            <div
              key={notice.id}
              style={css.card({
                marginBottom: 10,
                padding: "14px 16px",
                borderLeft: `4px solid ${noticeBorderColor(notice.title)}`,
                background: "#FFFFFF",
              })}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.dark, flex: 1 }}>
                  {notice.pinned ? "📌 " : ""}
                  {notice.title}
                </div>
                <span style={{ color: "#888", fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                  {fmtDate(notice.date)}
                </span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: C.mid, whiteSpace: "pre-wrap" }}>
                {notice.body}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
