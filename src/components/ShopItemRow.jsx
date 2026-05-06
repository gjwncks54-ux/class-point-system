import React, { useState, useEffect } from "react";

export default function ShopItemRow({ item, onUpdate, onRemove, css, C }) {
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.desc);
  const [price, setPrice] = useState(item.price);

  useEffect(() => {
    setName(item.name);
    setDesc(item.desc);
    setPrice(item.price);
  }, [item.name, item.desc, item.price]);

  return (
    <div style={css.card()}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...css.input, flex: 2, minWidth: 120 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== item.name && onUpdate(item.id, "name", name)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onUpdate(item.id, "name", name);
              e.target.blur();
            }
          }}
        />
        <input
          style={{ ...css.input, flex: 3, minWidth: 120 }}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => desc !== item.desc && onUpdate(item.id, "desc", desc)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onUpdate(item.id, "desc", desc);
              e.target.blur();
            }
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>⭐</span>
          <input
            style={{ ...css.input, width: 70 }}
            type="number"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            onBlur={() => price !== item.price && onUpdate(item.id, "price", price)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate(item.id, "price", price);
                e.target.blur();
              }
            }}
          />
        </div>
        <button
          style={css.btn(C.danger, "#fff", { padding: "8px 14px" })}
          onClick={onRemove}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
