import React, { useState } from "react";
import { css, C } from "../lib/design";
import { fmtDate } from "../lib/utils";

export default function NoticeAdminPanel({ notices, onAdd, onDelete, onTogglePinned }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    await onAdd({ title, body, pinned });
    setTitle("");
    setBody("");
    setPinned(false);
  };

  return (
    <div>
      <div style={css.card()}>
        <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>📢 Post Notice</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            style={css.input}
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            style={{ ...css.input, minHeight: 120, resize: "vertical", lineHeight: 1.5 }}
            placeholder="Write your notice here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin this notice
          </label>
          <button
            style={css.btn(C.primary, "#fff", { width: "100%", padding: 14 })}
            onClick={submit}
          >
            Post Notice
          </button>
        </div>
      </div>

      <div style={css.card()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>📰 Current Notices</h3>
          <span style={css.pill("#F1F5F9", C.primary)}>{notices.length} saved</span>
        </div>

        {notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: C.muted, background: "#F8FAFC", borderRadius: 14 }}>
            No notices yet.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              style={{ border: "1px solid #EDF2F7", borderRadius: 14, padding: 14, marginBottom: 10, background: notice.pinned ? "#FFF9E8" : "#FAFAFA" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {notice.pinned ? "📌 " : ""}{notice.title}
                </div>
                <span style={css.pill(notice.pinned ? C.accent : "#F1F5F9", notice.pinned ? C.dark : C.muted)}>
                  {fmtDate(notice.date)}
                </span>
              </div>
              <div style={{ fontSize: 14, whiteSpace: "pre-wrap", marginBottom: 12 }}>{notice.body}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  style={css.btn("#F1F5F9", C.primary, { padding: "7px 14px", fontSize: 13 })}
                  onClick={() => onTogglePinned(notice.id)}
                >
                  {notice.pinned ? "📍 Unpin" : "📌 Pin"}
                </button>
                <button
                  style={css.btn(C.danger, "#fff", { padding: "7px 14px", fontSize: 13 })}
                  onClick={() => onDelete(notice.id)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
