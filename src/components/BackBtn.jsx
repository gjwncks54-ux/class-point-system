import React from "react";
import { css } from "../lib/design";

export default function BackBtn({ setView, to, label = "← Back" }) {
  return (
    <button
      style={css.btn("#ffffff", "#1A237E", {
        padding: "7px 16px",
        fontSize: 13,
        fontWeight: 800,
        border: "2px solid #1A237E",
      })}
      onClick={() => setView(to)}
    >
      {label}
    </button>
  );
}
