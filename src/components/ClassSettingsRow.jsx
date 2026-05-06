import React, { useState, useEffect } from "react";
import { css, C } from "../lib/design";

export default function ClassSettingsRow({ cls, onRename, onRemove }) {
  const [name, setName] = useState(cls.name);
  useEffect(() => setName(cls.name), [cls.name]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{cls.emoji}</span>
      <input
        style={{ ...css.input, flex: 1, fontSize: 14, fontWeight: 700 }}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onRename(name)}
        onKeyDown={(e) => e.key === "Enter" && onRename(name)}
      />
      <span style={{ ...css.pill(cls.color), flexShrink: 0, fontSize: 12 }}>
        {cls.students.length} students
      </span>
      <button
        style={css.btn(C.danger + "22", C.danger, { padding: "8px 12px", fontSize: 13, flexShrink: 0 })}
        onClick={onRemove}
      >
        🗑 Remove
      </button>
    </div>
  );
}
