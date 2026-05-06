import React from "react";
import { C, FF, css } from "../lib/design";
import BackBtn from "../components/BackBtn";

export default function ClassSelectView({ setView, data, setPinClassId, setPinInput, setPinError }) {
  const gradeColor = (name) =>
    name.startsWith("G6") ? "#E64A19"
    : name.startsWith("G5") ? "#1565C0"
    : name.startsWith("G3") ? "#2E7D32"
    : C.primary;

  const gradeShadow = (name) =>
    name.startsWith("G6") ? "#BF360C"
    : name.startsWith("G5") ? "#0D47A1"
    : name.startsWith("G3") ? "#1B5E20"
    : "#000";

  return (
    <div style={css.app}>
      <div style={{ ...css.header(), background: "#1A237E" }}>
        <BackBtn setView={setView} to="home" />
        <h1 style={css.htitle}>Pick Your Class 🏫</h1>
        <div style={{ width: 70 }} />
      </div>
      <div style={css.wrap}>
        <p style={{ color: C.muted, fontWeight: 700, marginBottom: 18, textAlign: "center", fontSize: 15 }}>
          Which class are you in? 👇
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {data.classes.map((cls) => {
            const bg = gradeColor(cls.name);
            const shadow = gradeShadow(cls.name);
            return (
              <button
                key={cls.id}
                className="cls-btn"
                onClick={() => {
                  setPinClassId(cls.id);
                  setPinInput("");
                  setPinError(false);
                  setView("pinLogin");
                }}
                style={{
                  background: bg,
                  border: "none",
                  borderRadius: 24,
                  padding: "24px 14px 20px",
                  cursor: "pointer",
                  fontFamily: FF.body,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: `0 6px 0 ${shadow}`,
                }}
              >
                <div style={{
                  background: "rgba(255,255,255,0.25)",
                  borderRadius: "50%",
                  width: 60,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                }}>
                  {cls.emoji}
                </div>
                <span style={{ fontFamily: FF.display, fontSize: 20, color: "#fff", letterSpacing: 0.3 }}>{cls.name}</span>
                <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 50, padding: "3px 13px", fontSize: 12, color: "#fff", fontWeight: 800 }}>
                  {cls.students.length} students
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
