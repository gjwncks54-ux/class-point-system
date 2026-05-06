import React from "react";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function SeatPickerPopup({ cls, me, data, item, onClose, onChoose, css, C, FF }) {
  const takenSeats = {};
  cls.students.forEach((s) => {
    (s.purchases || []).forEach((p) => {
      const pname = typeof p === "object" ? p.name : p;
      const match = String(pname).match(/Choose Your Seat (\d+)/);
      if (match) takenSeats[match[1]] = s.name;
    });
  });

  const layout = [
    ["01", "02", null, "03", "04"],
    ["05", "06", null, "07", "08"],
    ["09", "10", null, "11", "12"],
    ["13", null, null, "14", "15"],
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          overflow: "hidden",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ background: "#1A237E", padding: "16px 20px" }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#fff", fontFamily: FF.display }}>🪑 Choose Your Seat</h3>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: "4px 0 0" }}>
            Check the board and pick your seat!
          </p>
        </div>
        <div style={{ padding: 20 }}>
          <div
            style={{
              background: "#FFF3E0",
              border: "2px solid #E67E22",
              borderRadius: 10,
              textAlign: "center",
              padding: "6px 0",
              marginBottom: 14,
              fontSize: 13,
              fontWeight: 800,
              color: "#E67E22",
            }}
          >
            🖥 Teacher's Desk
          </div>
          {layout.map((row, ri) => (
            <div
              key={ri}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 24px 1fr 1fr",
                gap: 6,
                marginBottom: 6,
              }}
            >
              {row.map((num, ci) => {
                if (num === null) return <div key={ci} />;
                const takenBy = takenSeats[num];
                const isTaken = !!takenBy;
                return (
                  <button
                    key={num}
                    disabled={isTaken}
                    style={{
                      ...css.btn(
                        isTaken ? "#EEEEEE" : "#ffffff",
                        isTaken ? "#888" : "#1A237E",
                        {
                          padding: "10px 4px",
                          fontSize: 12,
                          borderRadius: 10,
                          fontWeight: 900,
                          cursor: isTaken ? "not-allowed" : "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 2,
                          lineHeight: 1.3,
                          border: isTaken ? "none" : "2px solid #1A237E",
                        }
                      ),
                    }}
                    onClick={() =>
                      onChoose({
                        type: "purchase",
                        cid: cls.id,
                        sid: me.id,
                        studentName: me.name,
                        className: cls.name,
                        item: `🪑 Choose Your Seat ${num}`,
                        price: item.price,
                        date: today(),
                        createdAtMs: Date.now(),
                        isPublic: true,
                      })
                    }
                  >
                    <span>{num}</span>
                    {isTaken && <span style={{ fontSize: 9, opacity: 0.85 }}>{takenBy}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, fontSize: 12, color: C.muted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#fff", border: "2px solid #1A237E", display: "inline-block" }} /> Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#EEEEEE", display: "inline-block" }} /> Taken
            </span>
          </div>
          <button style={css.btn("#1A237E", "#fff", { width: "100%", padding: 12, fontWeight: 900 })} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
