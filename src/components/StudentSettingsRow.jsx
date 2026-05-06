import React, { useState, useEffect } from "react";
import { css, C } from "../lib/design";

export default function StudentSettingsRow({ stu, idx, onRename, onPinChange, onRemove }) {
  const [name, setName] = useState(stu.name);
  const [pin, setPin] = useState(stu.pin || "");
  const [pinErr, setPinErr] = useState(false);

  useEffect(() => {
    setName(stu.name);
    setPin(stu.pin || "");
  }, [stu.name, stu.pin]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 2fr 1fr auto",
        gap: 6,
        marginBottom: 6,
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textAlign: "center" }}>
        {idx + 1}
      </span>
      <input
        style={{ ...css.input, fontSize: 13 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onRename(name)}
        onKeyDown={(e) => e.key === "Enter" && onRename(name)}
      />
      <input
        style={{
          ...css.input,
          fontSize: 14,
          textAlign: "center",
          letterSpacing: 4,
          border: pinErr ? "2px solid red" : "2px solid #EEE",
        }}
        maxLength={4}
        value={pin}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "");
          setPin(v);
          setPinErr(false);
        }}
        onBlur={() => {
          if (pin.length === 4) {
            onPinChange(pin);
          } else if (pin.length > 0) {
            setPinErr(true);
          }
        }}
        placeholder="PIN"
      />
      <button
        style={css.btn(C.danger + "22", C.danger, { padding: "8px 10px", fontSize: 13 })}
        onClick={onRemove}
      >
        🗑
      </button>
    </div>
  );
}
