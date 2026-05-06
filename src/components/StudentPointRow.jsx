import React, { useState } from "react";

export default function StudentPointRow({ stu, cls, onAdd, css, C }) {
  const [open, setOpen] = useState(false);
  const [customPts, setCustomPts] = useState(1);
  const [customReason, setCustomReason] = useState("");

  return (
    <div style={{ ...css.card({ marginBottom: 8, padding: "12px 16px" }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ flex: 1, fontWeight: 700, minWidth: 80, color: C.dark }}>🧒 {stu.name}</span>
        <span style={{ color: "#FF5722", fontWeight: 800, fontSize: 15 }}>⭐ {stu.points}</span>
        <button
          style={css.btn(open ? C.muted : "#1A237E", "#fff", { padding: "6px 14px", fontSize: 13 })}
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "+ Points"}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10, background: "#F5F8FF", borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {[
              { label: "Participation", pts: 2 },
              { label: "100 on Test", pts: 5 },
              { label: "Homework", pts: 2 },
              { label: "Great Answer", pts: 3 },
              { label: "-1 Deduction", pts: -1 },
            ].map((p) => (
              <button
                key={p.label}
                style={css.btn(p.pts > 0 ? "#2E7D32" : "#C62828", "#fff", { padding: "6px 12px", fontSize: 12 })}
                onClick={async () => {
                  await onAdd(p.pts, p.label);
                  setOpen(false);
                }}
              >
                {p.pts > 0 ? "+" : ""}
                {p.pts} {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              style={{ ...css.input, width: 70 }}
              value={customPts}
              onChange={(e) => setCustomPts(parseInt(e.target.value) || 0)}
            />
            <input
              style={{ ...css.input, flex: 1, minWidth: 100 }}
              placeholder="Custom reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
            <button
              style={css.btn(C.primary, "#fff", { padding: "8px 16px", fontSize: 13 })}
              onClick={async () => {
                if (customReason.trim()) {
                  await onAdd(customPts, customReason);
                  setCustomReason("");
                  setOpen(false);
                }
              }}
            >
              Give
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
