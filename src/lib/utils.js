export const medal = (i) =>
  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const fmtDate = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return d && m && y ? `${m}/${d}/${y}` : s;
};
