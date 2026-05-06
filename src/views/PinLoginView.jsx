import React from "react";
import { C, FF, css } from "../lib/design";
import { getGameApiErrorMessage, isFunctionsUnavailableError, verifyStudentPin } from "../lib/gameApi";
import BackBtn from "../components/BackBtn";

export default function PinLoginView({
  setView, data, pinClassId, setPinClassId,
  pinInput, setPinInput, pinError, setPinError,
  setSelectedClassId, setSelectedStudentId,
  setStudentSession, setStudentTab, showToast,
}) {
  const cls = data.classes.find((c) => c.id === pinClassId);
  if (!cls) {
    setPinClassId(null);
    setView("classSelect");
    return null;
  }

  const tryPin = async (pin) => {
    try {
      const verified = await verifyStudentPin({ classId: cls.id, pin });
      const found = cls.students.find((student) => student.id === verified.studentId);
      if (!found) throw new Error("Verified student was not found in the current app data.");

      setSelectedClassId(cls.id);
      setSelectedStudentId(found.id);
      setStudentSession({
        sessionId: verified.sessionId,
        classId: cls.id,
        studentId: found.id,
        studentName: found.name,
        expiresAtMs: verified.expiresAtMs || null,
        mode: "secure",
      });
      setStudentTab("village");
      setPinInput("");
      setPinError(false);
      setView("studentDash");
      showToast("Secure student session ready.");
      return;
    } catch (error) {
      if (!isFunctionsUnavailableError(error)) {
        console.error("PIN verification failed:", error);
        setPinError(true);
        setPinInput("");
        showToast(getGameApiErrorMessage(error, "PIN verification failed."), "err");
        return;
      }
    }

    const found = cls.students.find((student) => student.pin === pin);
    if (found) {
      setSelectedClassId(cls.id);
      setSelectedStudentId(found.id);
      setStudentSession({
        sessionId: null,
        classId: cls.id,
        studentId: found.id,
        studentName: found.name,
        expiresAtMs: null,
        mode: "preview",
      });
      setStudentTab("village");
      setPinInput("");
      setPinError(false);
      setView("studentDash");
      showToast("Functions are not deployed yet. Logged in with preview fallback.", "err");
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  return (
    <div style={css.app}>
      <div style={{ ...css.header(), background: "#1A237E" }}>
        <BackBtn setView={setView} to="classSelect" />
        <h1 style={css.htitle}>
          {cls.emoji} {cls.name}
        </h1>
        <div style={{ width: 70 }} />
      </div>
      <div style={{ ...css.wrap, maxWidth: 360, paddingTop: 36, textAlign: "center" }}>
        <div style={css.card({ padding: "28px 24px" })}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔢</div>
          <h3 style={{ fontFamily: FF.display, fontSize: 24, marginBottom: 4, color: "#1A237E" }}>
            Enter your PIN
          </h3>
          <p style={{ color: C.muted, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
            Ask your teacher if you forgot!
          </p>
          {/* PIN 입력 표시 */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 60,
                  borderRadius: 16,
                  border: `3px solid #1A237E`,
                  background: pinInput.length > i ? "#1A237E" : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  color: "#FFFFFF",
                  fontWeight: 900,
                  transition: "all 0.15s",
                }}
              >
                {pinInput.length > i ? "●" : ""}
              </div>
            ))}
          </div>
          {/* 키패드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 72px)",
              gap: 12,
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
              <button
                key={i}
                disabled={k === ""}
                style={{
                  width: 72,
                  height: 72,
                  background: k === "⌫" ? "#FFCDD2" : "#F1F5F9",
                  color: k === "⌫" ? "#C62828" : "#1A237E",
                  border: "none",
                  borderRadius: 16,
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: FF.body,
                  cursor: k === "" ? "default" : "pointer",
                  opacity: k === "" ? 0 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => {
                  if (k === "⌫") {
                    setPinInput((p) => p.slice(0, -1));
                    setPinError(false);
                  } else if (pinInput.length < 4) {
                    const next = pinInput + k;
                    setPinInput(next);
                    if (next.length === 4) setTimeout(() => tryPin(next), 150);
                  }
                }}
              >
                {k}
              </button>
            ))}
          </div>
          {pinError && (
            <p style={{ color: C.danger, fontWeight: 700, fontSize: 14, marginTop: 8 }}>
              Wrong PIN! Try again 🙈
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
