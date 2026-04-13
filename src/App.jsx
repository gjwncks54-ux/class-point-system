
import { useState, useEffect, useRef } from "react";
import ClassVillageMVP from "./ClassVillageMVP";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  addDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApfeEJe4uxdxhhMSzMDijwFh80Gqx7v8E",
  authDomain: "class-point-system-f3bec.firebaseapp.com",
  projectId: "class-point-system-f3bec",
  storageBucket: "class-point-system-f3bec.firebasestorage.app",
  messagingSenderId: "672516344748",
  appId: "1:672516344748:web:bfe549870bff3190b4c809",
  measurementId: "G-FZ1Y17XWL5",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const DATA_DOC = doc(db, "app", "data");
const BACKUP_DOC = doc(db, "app", "backup");
const REQUESTS_COL = collection(db, "requests");
const REQUEST_DOC = (id) => doc(db, "requests", id);



const makeClassFromNames = (id, name, color, emoji, names) => ({
  id,
  name,
  color,
  emoji,
  students: names.map((n, i) => ({
    id: `${id}_s${i + 1}`,
    name: n,
    pin: `${1001 + i}`,
    points: 0,
    history: [],
    purchases: [],
  })),
});

const makeClass = (id, name, color, emoji) => ({
  id,
  name,
  color,
  emoji,
  students: Array.from({ length: 5 }, (_, i) => ({
    id: `${id}_s${i + 1}`,
    name: `Student ${i + 1}`,
    pin: `${1001 + i}`,
    points: 0,
    history: [],
    purchases: [],
  })),
});

const DEFAULT_CLASSES = [
  makeClassFromNames("c1", "G6 Tulip", "#FF6B6B", "🌷", [
    "Saha",
    "Sienna",
    "Evan",
    "Alice",
    "Elly",
    "Jiyoo",
    "April",
    "Emerson",
    "Luna",
    "Jun",
    "Yun",
    "Lily",
    "Ella",
    "Lucy",
    "Yunee",
  ]),
  makeClassFromNames("c2", "G6 Violet", "#A55EEA", "💜", [
    "Luna",
    "Yoonha",
    "Leo",
    "Jiyu",
    "Olivia",
    "KAllie",
    "Stella",
    "Ace",
    "WEllie",
    "Seohyun",
    "Yebin",
    "Raphaella",
    "Jayden",
    "Lucy",
    "Nick",
  ]),
  makeClassFromNames("c3", "G5 Rose", "#FF9FF3", "🌸", [
    "Luna",
    "Tony",
    "Sally",
    "Elliot",
    "Leo",
    "Sarang",
    "Sungbin",
    "Suji",
    "Adrian",
    "Wooju",
    "Chaebin",
    "Jay",
    "Berno",
    "Henry",
    "Aria",
  ]),
  makeClassFromNames("c4", "G5 Daisy", "#F7B731", "🌼", [
    "Leo",
    "Jenny",
    "David",
    "Sangwoo",
    "Sunny",
    "Daniel",
    "James",
    "Belle",
    "Aiden",
    "Roy",
    "Jasmine",
    "Rosa",
    "Lily",
    "Jayden",
    "Allie",
  ]),
  makeClassFromNames("c5", "G3 Green", "#00B894", "🟢", [
    "Luna",
    "Subin",
    "Sophia",
    "Eve",
    "Joon",
    "Mino",
    "Audrey",
    "Sally",
    "Roa",
    "Lucas",
    "Bella",
    "Bradon",
    "Soeun",
  ]),
  makeClassFromNames("c6", "G3 Purple", "#6C5CE7", "🟣", [
    "Danny",
    "Sally",
    "Sarah",
    "Eric",
    "Sol",
    "June",
    "Ember",
    "Seowoo",
    "Daisy",
    "Lucas",
    "Bella",
  ]),
  makeClassFromNames("c7", "G5 Blue", "#45B7D1", "🔵", [
    "Jayden",
    "Aria",
    "Wooju",
    "Sarang",
    "Kevin",
    "Sungbin",
    "Sangwoo",
    "Ellie",
    "Adrian",
    "Jenny",
    "Joy",
    "Jasmine",
    "Chaebin",
  ]),
  makeClassFromNames("c8", "G5 Orange", "#FF9F43", "🟠", [
    "Tony",
    "David",
    "Jay",
    "Daniel",
    "Allie",
    "Lily",
    "Henry",
    "Jacob",
    "Steve",
    "Leo",
    "Sunny",
    "Rosa",
  ]),
];

const DEFAULT_SHOP = [
  { id: 1, name: "🪑 Choose Your Seat", desc: "Pick any seat you want!", price: 10 },
  { id: 2, name: "📝 Skip Vocab Test", desc: "Skip one vocabulary test", price: 20 },
  { id: 3, name: "🏠 Homework Pass", desc: "Skip one homework assignment", price: 15 },
  { id: 4, name: "⭐ Special Sticker", desc: "Get a special sticker!", price: 5 },
  { id: 5, name: "🎮 Free Time 5min", desc: "5 minutes free time in class", price: 25 },
  { id: 6, name: "🍬 Candy Reward", desc: "Get a candy from teacher", price: 8 },
];

const DEFAULT_DATA = {
  classes: DEFAULT_CLASSES,
  shop: DEFAULT_SHOP,
  notices: [],
};

const normalizeData = (raw) => ({
  ...raw,
  shop: raw?.shop || DEFAULT_SHOP,
  notices: raw?.notices || [],
  classes: (raw?.classes || []).map((c) => ({
    ...c,
    students: (c.students || []).map((s) => ({
      history: [],
      purchases: [],
      ...s,
    })),
  })),
});

const sortNotices = (notices) =>
  [...(notices || [])].sort(
    (a, b) =>
      Number(!!b.pinned) - Number(!!a.pinned) ||
      (b.createdAtMs || 0) - (a.createdAtMs || 0)
  );

const medal = (i) =>
  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const fmtDate = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return d && m && y ? `${m}/${d}/${y}` : s;
};

if (!document.querySelector('link[href*="Chewy"]')) {
  const fontLink = document.createElement("link");
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Chewy&family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+KR:wght@400;500;700;800&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);
}
if (!document.querySelector("style[data-cls]")) {
  const s = document.createElement("style");
  s.dataset.cls = "1";
  s.textContent = `
    @keyframes clsPop { 0%{transform:scale(0.7);opacity:0} 65%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }
    @keyframes clsFloat { 0%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-10px) rotate(3deg)} 100%{transform:translateY(0) rotate(-3deg)} }
    @keyframes clsFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .cls-pop { animation: clsPop 0.45s cubic-bezier(.34,1.56,.64,1) both }
    .cls-float { animation: clsFloat 3s ease-in-out infinite }
    .cls-fadein { animation: clsFadeIn 0.4s ease both }
    .cls-btn { transition: transform 0.1s ease, box-shadow 0.1s ease }
    .cls-btn:hover { transform: translateY(-3px) }
    .cls-btn:active { transform: translateY(2px) }
  `;
  document.head.appendChild(s);
}

const C = {
  bg: "#FFF8F0",
  card: "#FFFFFF",
  primary: "#FF5722",
  secondary: "#2979FF",
  accent: "#FFC107",
  teal: "#00BCD4",
  success: "#43A047",
  danger: "#E53935",
  muted: "#90A4AE",
  dark: "#1A237E",
  mid: "#546E7A",
  light: "#E3F2FD",
  cream: "#FFF3E0",
};

const FF = {
  display: "'Chewy', 'Noto Sans KR', cursive",
  body: "'Nunito', 'Noto Sans KR', sans-serif",
};

const css = {
  app: {
    fontFamily: FF.body,
    minHeight: "100vh",
    background: C.bg,
    color: C.dark,
  },
  header: (bg) => ({
    background: bg || C.primary,
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  htitle: { color: "#fff", fontSize: 19, fontWeight: 900, margin: 0, fontFamily: FF.display, letterSpacing: 0.5 },
  wrap: { maxWidth: 640, margin: "0 auto", padding: "24px 16px" },
  card: (extra) => ({
    background: C.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    boxShadow: "0 2px 12px rgba(26,35,126,0.08)",
    ...extra,
  }),
  btn: (bg, color = "#fff", extra) => ({
    background: bg,
    color,
    border: "none",
    borderRadius: 50,
    padding: "11px 22px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: FF.body,
    ...extra,
  }),
  pill: (bg, color = "#fff") => ({
    background: bg,
    color,
    borderRadius: 50,
    padding: "4px 13px",
    fontSize: 12,
    fontWeight: 800,
    display: "inline-block",
  }),
  tab: (active, color) => ({
    background: active ? color || C.primary : C.card,
    color: active ? "#fff" : C.mid,
    border: active ? "none" : `2px solid ${C.light}`,
    borderRadius: 50,
    padding: "9px 17px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: FF.body,
    transition: "all 0.15s",
  }),
  input: {
    border: "2.5px solid #CFD8DC",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 15,
    fontFamily: FF.body,
    outline: "none",
    background: "#FFFFFF",
    width: "100%",
    boxSizing: "border-box",
    color: C.dark,
  },
  toast: (type) => ({
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: type === "err" ? C.danger : C.success,
    color: "#fff",
    padding: "13px 28px",
    borderRadius: 50,
    fontWeight: 800,
    zIndex: 9999,
    boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
    fontSize: 15,
    whiteSpace: "nowrap",
  }),
};

export default function App() {
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminAuthUid, setAdminAuthUid] = useState(null);
  const [view, setViewRaw] = useState(
    () => sessionStorage.getItem("view") || "home"
  );
  const [selectedClassId, setSelectedClassIdRaw] = useState(
    () => sessionStorage.getItem("selectedClassId") || null
  );
  const [selectedStudentId, setSelectedStudentIdRaw] = useState(
    () => sessionStorage.getItem("selectedStudentId") || null
  );
  const [adminTab, setAdminTab] = useState("points");
  const [studentTab, setStudentTab] = useState("shop");
  const [adminEmail, setAdminEmail] = useState(() => sessionStorage.getItem("adminEmail") || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [toast, setToast] = useState(null);
  const [filterClass, setFilterClass] = useState("all");
  const [pinClassId, setPinClassIdRaw] = useState(
    () => sessionStorage.getItem("pinClassId") || null
  );
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [seatPopup, setSeatPopup] = useState(null);
  const [privacyPopup, setPrivacyPopup] = useState(null);
  const dataRef = useRef(null);
  const toastTimerRef = useRef(null);

  const setView = (v) => {
    sessionStorage.setItem("view", v);
    setViewRaw(v);
  };
  const setSelectedClassId = (v) => {
    v
      ? sessionStorage.setItem("selectedClassId", v)
      : sessionStorage.removeItem("selectedClassId");
    setSelectedClassIdRaw(v);
  };
  const setSelectedStudentId = (v) => {
    v
      ? sessionStorage.setItem("selectedStudentId", v)
      : sessionStorage.removeItem("selectedStudentId");
    setSelectedStudentIdRaw(v);
  };
  const setPinClassId = (v) => {
    v
      ? sessionStorage.setItem("pinClassId", v)
      : sessionStorage.removeItem("pinClassId");
    setPinClassIdRaw(v);
  };

  useEffect(() => {
    const unsub = onSnapshot(DATA_DOC, (snap) => {
      if (snap.exists()) {
        const d = normalizeData(snap.data());
        dataRef.current = d;
        setData(d);
      } else {
        const empty = { classes: [], shop: DEFAULT_SHOP, notices: [] };
        dataRef.current = empty;
        setData(empty);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminAuthUid(user?.uid || null);
      console.log("ADMIN UID:", user?.uid || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!adminAuthUid) {
      setRequests([]);
      return;
    }
    const unsub = onSnapshot(
      REQUESTS_COL,
      (snap) => {
        const next = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setRequests(next);
      },
      (err) => {
        console.error("Request listener error:", err);
        setRequests([]);
      }
    );
    return () => unsub();
  }, [adminAuthUid]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg, type = "ok") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2500);
  };

  const saveDataTx = async (newDataOrFn, { allowReset = false } = {}) => {
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(DATA_DOC);
        const latest = snap.exists()
          ? normalizeData(snap.data())
          : { classes: [], shop: DEFAULT_SHOP, notices: [] };

        const newData =
          typeof newDataOrFn === "function" ? newDataOrFn(latest) : newDataOrFn;

        if (!allowReset && latest.classes?.length > 0 && newData.classes) {
          const oldTotal = latest.classes.reduce(
            (s, c) => s + c.students.reduce((ss, st) => ss + (st.points || 0), 0),
            0
          );
          const newTotal = newData.classes.reduce(
            (s, c) => s + c.students.reduce((ss, st) => ss + (st.points || 0), 0),
            0
          );
          const oldStudentCount = latest.classes.reduce(
            (s, c) => s + c.students.length,
            0
          );
          const newStudentCount = newData.classes.reduce(
            (s, c) => s + c.students.length,
            0
          );
          if (
            oldTotal > 10 &&
            newTotal === 0 &&
            oldStudentCount === newStudentCount
          ) {
            throw new Error("Save blocked — looked like accidental reset!");
          }
        }

        const nextRev = (latest._rev || 0) + 1;
        const nowIso = new Date().toISOString();
        const dataWithRev = {
          ...newData,
          notices: newData.notices || [],
          _rev: nextRev,
          _lastSaved: nowIso,
        };

        tx.set(DATA_DOC, dataWithRev);
        if (nextRev % 10 === 0) {
          tx.set(BACKUP_DOC, { ...dataWithRev, _backupTime: nowIso });
        }
      });
      return true;
    } catch (e) {
      console.error("Save failed:", e);
      showToast(e.message || "Save failed!", "err");
      return false;
    }
  };

  const updateStudent = (cid, sid, fn) =>
    saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              students: c.students.map((s) => (s.id !== sid ? s : fn(s))),
            }
      ),
    }));

  const addPoints = async (cid, sid, pts, reason) => {
    const ok = await saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              students: c.students.map((s) =>
                s.id !== sid
                  ? s
                  : {
                      ...s,
                      points: Math.max(0, s.points + pts),
                      history: [
                        {
                          pts,
                          reason,
                          date: today(),
                          type: pts >= 0 ? "earn" : "spend",
                        },
                        ...(s.history || []),
                      ].slice(0, 30),
                    }
              ),
            }
      ),
    }));
    if (ok) showToast(`${pts > 0 ? "+" : ""}${pts}⭐ — ${reason}`);
  };

  const addClassPoints = async (cid, pts) => {
    const ok = await saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              students: c.students.map((s) => ({
                ...s,
                points: Math.max(0, s.points + pts),
                history: [
                  {
                    pts,
                    reason: pts > 0 ? "Class Bonus ✨" : "Class Deduction",
                    date: today(),
                    type: pts > 0 ? "earn" : "spend",
                  },
                  ...(s.history || []),
                ].slice(0, 30),
              })),
            }
      ),
    }));
    if (ok) showToast(`${pts > 0 ? "+" : ""}${pts}⭐ applied to whole class!`);
  };

  const approveRequest = async (rid) => {
    const req = requests.find((r) => r.id === rid);
    if (!req) return;

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(DATA_DOC);
        if (!snap.exists()) throw new Error("Main data not found.");
        const latest = normalizeData(snap.data());

        if (req.type === "purchase") {
          const cls = latest.classes.find((c) => c.id === req.cid);
          const stu = cls?.students.find((s) => s.id === req.sid);
          if (!stu || stu.points < req.price) {
            throw new Error("Not enough points!");
          }

          if (String(req.item || "").includes("Choose Your Seat")) {
            const seatMatch = String(req.item).match(/Choose Your Seat (\d+)/);
            const seatNo = seatMatch?.[1];
            if (seatNo) {
              const alreadyTaken = latest.classes
                .find((c) => c.id === req.cid)
                ?.students.some((s) =>
                  (s.purchases || []).some((p) => {
                    const pname = typeof p === "object" ? p.name : p;
                    return String(pname).includes(`Choose Your Seat ${seatNo}`);
                  })
                );
              if (alreadyTaken) throw new Error(`Seat ${seatNo} is already taken!`);
            }
          }

          const updated = {
            ...latest,
            classes: latest.classes.map((c) =>
              c.id !== req.cid
                ? c
                : {
                    ...c,
                    students: c.students.map((s) =>
                      s.id !== req.sid
                        ? s
                        : {
                            ...s,
                            points: Math.max(0, s.points - req.price),
                            history: [
                              {
                                pts: -req.price,
                                reason: `Bought: ${req.item}`,
                                date: today(),
                                type: "spend",
                              },
                              ...(s.history || []),
                            ].slice(0, 30),
                            purchases: [
                              {
                                name: req.item,
                                isPublic: req.isPublic !== false,
                              },
                              ...(s.purchases || []),
                            ],
                          }
                    ),
                  }
            ),
          };

          const nextRev = (latest._rev || 0) + 1;
          const nowIso = new Date().toISOString();
          const saved = { ...updated, _rev: nextRev, _lastSaved: nowIso };
          tx.set(DATA_DOC, saved);
          if (nextRev % 10 === 0) {
            tx.set(BACKUP_DOC, { ...saved, _backupTime: nowIso });
          }
        }

        if (req.type === "pinChange") {
          const cls = latest.classes.find((c) => c.id === req.cid);
          const stu = cls?.students.find((s) => s.id === req.sid);
          if (!cls || !stu) throw new Error("Student not found.");
          if (
            cls.students.some(
              (s) => s.id !== req.sid && String(s.pin) === String(req.newPin)
            )
          ) {
            throw new Error("PIN already used by another student!");
          }

          const updated = {
            ...latest,
            classes: latest.classes.map((c) =>
              c.id !== req.cid
                ? c
                : {
                    ...c,
                    students: c.students.map((s) =>
                      s.id !== req.sid ? s : { ...s, pin: req.newPin }
                    ),
                  }
            ),
          };

          const nextRev = (latest._rev || 0) + 1;
          const nowIso = new Date().toISOString();
          const saved = { ...updated, _rev: nextRev, _lastSaved: nowIso };
          tx.set(DATA_DOC, saved);
          if (nextRev % 10 === 0) {
            tx.set(BACKUP_DOC, { ...saved, _backupTime: nowIso });
          }
        }

        tx.delete(REQUEST_DOC(rid));
      });

      showToast(req.type === "pinChange" ? "🔑 PIN updated!" : "✅ Approved!");
    } catch (e) {
      console.error("Approve failed:", e);
      showToast(e.message || "Approve failed!", "err");
    }
  };

  const rejectRequest = async (rid) => {
    try {
      await deleteDoc(REQUEST_DOC(rid));
      showToast("❌ Rejected.", "err");
    } catch (e) {
      console.error("Reject failed:", e);
      showToast("Reject failed!", "err");
    }
  };

  const renameStudent = async (cid, sid, name) => {
    if (!name.trim()) return;
    await updateStudent(cid, sid, (s) => ({ ...s, name: name.trim() }));
  };

  const updatePin = async (cid, sid, pin) => {
    if (pin.length !== 4) return;
    const latest = dataRef.current;
    const cls = latest.classes.find((c) => c.id === cid);
    if (cls && cls.students.some((s) => s.id !== sid && s.pin === pin)) {
      showToast("⚠️ PIN already used by another student!", "err");
      return;
    }
    const ok = await updateStudent(cid, sid, (s) => ({ ...s, pin }));
    if (ok) showToast("🔑 PIN updated!");
  };

  const addStudent = async (cid) => {
    const latest = dataRef.current;
    const cls = latest.classes.find((c) => c.id === cid);
    const maxIdx = cls.students.reduce(
      (m, s) => Math.max(m, parseInt(s.id.split("_s")[1]) || 0),
      0
    );
    const existingPins = new Set(cls.students.map((s) => s.pin));
    let newPin;
    do {
      newPin = `${Math.floor(1000 + Math.random() * 9000)}`;
    } while (existingPins.has(newPin));

    const ok = await saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              students: [
                ...c.students,
                {
                  id: `${cid}_s${maxIdx + 1}`,
                  name: "New Student",
                  pin: newPin,
                  points: 0,
                  history: [],
                  purchases: [],
                },
              ],
            }
      ),
    }));
    if (ok) showToast("Student added! ✅");
  };

  const removeStudent = async (cid, sid) => {
    const ok = await saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id !== cid
          ? c
          : { ...c, students: c.students.filter((s) => s.id !== sid) }
      ),
    }));
    if (!ok) return;
    await Promise.all(
      requests
        .filter((r) => r.cid === cid && r.sid === sid)
        .map((r) => deleteDoc(REQUEST_DOC(r.id)))
    );
    showToast("Student removed.", "err");
  };

  const CLASS_COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#F7B731",
    "#A55EEA",
    "#FF9F43",
    "#EE5A24",
    "#009432",
    "#0652DD",
    "#9980FA",
  ];
  const CLASS_EMOJIS = ["🔴", "🟢", "🔵", "🟡", "🟣", "🟠", "🔶", "🟤", "⚪", "🔷"];

  const addClass = async () => {
    const latest = dataRef.current;
    const idx = latest.classes.length;
    const newId = `c${Date.now()}`;
    const ok = await saveDataTx((prev) => ({
      ...prev,
      classes: [
        ...prev.classes,
        makeClass(
          newId,
          `Class ${idx + 1}`,
          CLASS_COLORS[idx % CLASS_COLORS.length],
          CLASS_EMOJIS[idx % CLASS_EMOJIS.length]
        ),
      ],
    }));
    if (ok) showToast("New class added! ✅");
  };

  const removeClass = async (cid) => {
    const ok = await saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== cid),
    }));
    if (!ok) return;
    await Promise.all(
      requests.filter((r) => r.cid === cid).map((r) => deleteDoc(REQUEST_DOC(r.id)))
    );
    showToast("Class removed.", "err");
  };

  const renameClass = async (cid, name) => {
    if (!name.trim()) return;
    await saveDataTx((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id !== cid ? c : { ...c, name: name.trim() }
      ),
    }));
  };

  const updateShopItem = (id, field, val) =>
    saveDataTx((prev) => ({
      ...prev,
      shop: prev.shop.map((i) =>
        i.id !== id
          ? i
          : { ...i, [field]: field === "price" ? parseInt(val) || 0 : val }
      ),
    }));

  const addShopItem = () =>
    saveDataTx((prev) => ({
      ...prev,
      shop: [
        ...prev.shop,
        { id: Date.now(), name: "New Item", desc: "Description", price: 10 },
      ],
    }));

  const removeShopItem = (id) =>
    saveDataTx((prev) => ({
      ...prev,
      shop: prev.shop.filter((i) => i.id !== id),
    }));

  const addNotice = async ({ title, body, pinned }) => {
    const titleText = title.trim();
    const bodyText = body.trim();
    if (!titleText || !bodyText) return;
    const createdAtMs = Date.now();
    const ok = await saveDataTx((prev) => ({
      ...prev,
      notices: sortNotices([
        {
          id: createdAtMs,
          title: titleText,
          body: bodyText,
          pinned: !!pinned,
          date: today(),
          createdAtMs,
        },
        ...(prev.notices || []),
      ]).slice(0, 20),
    }));
    if (ok) showToast("📢 Notice posted!");
  };

  const deleteNotice = async (id) => {
    const ok = await saveDataTx((prev) => ({
      ...prev,
      notices: (prev.notices || []).filter((n) => n.id !== id),
    }));
    if (ok) showToast("🗑 Notice removed.", "err");
  };

  const toggleNoticePinned = async (id) => {
    const ok = await saveDataTx((prev) => ({
      ...prev,
      notices: sortNotices(
        (prev.notices || []).map((n) =>
          n.id !== id ? n : { ...n, pinned: !n.pinned }
        )
      ),
    }));
    if (ok) showToast("📌 Notice updated!");
  };

  const sortedNotices = sortNotices(data?.notices || []);

  const loginAdmin = async () => {
    setAdminLoginError("");
    try {
      const email = adminEmail.trim();
      if (!email || !adminPassword) {
        setAdminLoginError("Enter your teacher email and Firebase password.");
        return;
      }
      const cred = await signInWithEmailAndPassword(auth, email, adminPassword);
      console.log("ADMIN UID:", cred.user?.uid || null);
      sessionStorage.setItem("adminEmail", email);
      setAdminPassword("");
      setView("admin");
      showToast("Teacher login complete!");
    } catch (e) {
      console.error(e);
      setAdminLoginError("Firebase email login failed.");
      showToast("Firebase email login failed!", "err");
    }
  };

  const logoutAdmin = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setAdminPassword("");
    setAdminLoginError("");
    setView("home");
  };


  const BackBtn = ({ to, label = "← Back" }) => (
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
          background: "linear-gradient(160deg, #FF5722 0%, #FF9800 100%)",
          minHeight: "100vh",
          fontFamily: FF.body,
        }}
      >
        <div className="cls-float" style={{ fontSize: 88, lineHeight: 1 }}>⭐</div>
        <div style={{ fontFamily: FF.display, fontSize: 38, color: "#fff", letterSpacing: 1, marginTop: 4 }}>
          Class Stars!
        </div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
          Loading…
        </div>
      </div>
    );
  }

  const allStudents = data.classes.flatMap((c) =>
    c.students.map((s) => ({
      ...s,
      className: c.name,
      classColor: c.color,
      cid: c.id,
    }))
  );
  const globalRanked = [...allStudents].sort((a, b) => b.points - a.points);
  const pendingCount = requests.length;
  const getCurrentStudent = () =>
    !selectedClassId || !selectedStudentId
      ? null
      : data.classes
          .find((c) => c.id === selectedClassId)
          ?.students.find((s) => s.id === selectedStudentId);

  if (view === "home") {
    return (
      <div style={css.app}>
        {/* Header — 딥블루 단색 */}
        <div style={{
          background: "#1A237E",
          padding: "34px 24px 54px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -24, left: -24, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div className="cls-float" style={{ fontSize: 68, lineHeight: 1, marginBottom: 12 }}>⭐</div>
          <h1 style={{ fontFamily: FF.display, fontSize: 44, color: "#fff", margin: "0 0 6px", letterSpacing: 0.5 }}>
            Class Stars!
          </h1>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 700 }}>
            Mr. Dennis's English Class ✏️
          </div>
        </div>

        {toast && <div style={css.toast(toast.type)}>{toast.msg}</div>}

        {/* Content panel */}
        <div style={{
          background: C.bg,
          borderRadius: "28px 28px 0 0",
          marginTop: -28,
        }}>
          <div style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "40px 24px",
            display: "flex",
            flexDirection: "row",
            gap: 24,
            alignItems: "flex-start",
          }}>

            {/* 왼쪽: Student / Teacher 카드 */}
            <div style={{ flex: 1 }}>
              {/* Student 카드 */}
              <button
                className="cls-btn"
                onClick={() => setView("classSelect")}
                style={{
                  ...css.card({ marginBottom: 8 }),
                  width: "100%",
                  background: C.primary,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 20px",
                  textAlign: "left",
                  fontFamily: FF.body,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 44 }}>🧒</span>
                  <div>
                    <div style={{ fontFamily: FF.display, fontSize: 22, color: "#fff", letterSpacing: 0.3 }}>I'm a Student</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: 700, marginTop: 2 }}>Check my stars ⭐</div>
                  </div>
                </div>
                <span style={{ fontSize: 24, color: "rgba(255,255,255,0.7)" }}>→</span>
              </button>

              {/* Teacher 카드 */}
              <button
                className="cls-btn"
                onClick={() => setView("adminLogin")}
                style={{
                  ...css.card({ marginBottom: 8 }),
                  width: "100%",
                  backgroundColor: "#FFFFFF",
                  background: "#FFFFFF",
                  border: `2px solid ${C.primary}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 20px",
                  textAlign: "left",
                  fontFamily: FF.body,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 44 }}>👩‍🏫</span>
                  <div>
                    <div style={{ fontFamily: FF.display, fontSize: 22, color: C.primary, letterSpacing: 0.3 }}>I'm the Teacher</div>
                    <div style={{ fontSize: 13, color: "#888888", fontWeight: 700, marginTop: 2 }}>Manage class &amp; points</div>
                  </div>
                </div>
                <span style={{ fontSize: 24, color: C.primary }}>→</span>
              </button>
            </div>

            {/* 오른쪽: Notices */}
            <div style={{ flex: 1.5 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontFamily: FF.display, fontSize: 20, color: C.dark, margin: 0, letterSpacing: 0.3 }}>📢 Notices</h3>
                <button
                  style={{ background: "none", border: "none", color: C.secondary, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: FF.body }}
                  onClick={() => setView("noticeBoard")}
                >
                  See all →
                </button>
              </div>

              {sortedNotices.length === 0 ? (
                <div style={css.card({ color: C.muted, textAlign: "center", padding: "24px 16px", fontSize: 15 })}>
                  No notices yet 📭
                </div>
              ) : (
                sortedNotices.slice(0, 3).map((notice) => (
                  <div key={notice.id} style={css.card({
                    padding: "12px 16px",
                    background: notice.pinned ? "#FFFDE7" : C.card,
                    borderLeft: notice.pinned ? `4px solid ${C.accent}` : "4px solid transparent",
                  })}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, flex: 1 }}>
                        {notice.pinned ? "📌 " : ""}{notice.title}
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{fmtDate(notice.date)}</span>
                    </div>
                    <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notice.body}</div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (view === "noticeBoard") {
    const noticeBorderColor = (title) =>
      title?.startsWith("G6") ? "#E64A19"
      : title?.startsWith("G5") ? "#1565C0"
      : title?.startsWith("G3") ? "#2E7D32"
      : "#FF5722";

    return (
      <div style={css.app}>
        <div style={{ ...css.header(), background: "#1A237E" }}>
          <BackBtn to="home" />
          <h1 style={css.htitle}>📢 Notice Board</h1>
          <div style={{ width: 70 }} />
        </div>
        <div style={css.wrap}>
          {sortedNotices.length === 0 ? (
            <div style={css.card({ textAlign: "center", color: C.muted, padding: 36, fontSize: 16 })}>
              No notices yet 📭
            </div>
          ) : (
            sortedNotices.map((notice) => (
              <div
                key={notice.id}
                style={css.card({
                  marginBottom: 10,
                  padding: "14px 16px",
                  borderLeft: `4px solid ${noticeBorderColor(notice.title)}`,
                  background: "#FFFFFF",
                })}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: C.dark, flex: 1 }}>
                    {notice.pinned ? "📌 " : ""}
                    {notice.title}
                  </div>
                  <span style={{ color: "#888", fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
                    {fmtDate(notice.date)}
                  </span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: C.mid, whiteSpace: "pre-wrap" }}>
                  {notice.body}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (view === "adminLogin") {
    return (
      <div style={css.app}>
        <div style={{ ...css.header(), background: "#1A237E" }}>
          <BackBtn to="home" />
          <h1 style={css.htitle}>Teacher Login 🔐</h1>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ maxWidth: 400, margin: "48px auto 0", padding: "0 20px", textAlign: "center" }}>
          <div style={css.card({ padding: "32px 28px" })}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔑</div>
            <h3 style={{ marginBottom: 12, fontSize: 20, fontWeight: 800 }}>
              Teacher Login
            </h3>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 18 }}>
              Enter your teacher email and password
            </p>
            <input
              style={{ ...css.input, marginBottom: 10, border: "2px solid #1A237E" }}
              type="email"
              value={adminEmail}
              onChange={(e) => {
                setAdminEmail(e.target.value);
                setAdminLoginError("");
              }}
              placeholder="Teacher email"
            />
            <input
              style={{ ...css.input, marginBottom: 12, border: "2px solid #1A237E" }}
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setAdminLoginError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") loginAdmin();
              }}
              placeholder="Password"
            />
            {!!adminLoginError && (
              <p style={{ color: C.danger, fontWeight: 700, marginBottom: 10 }}>
                {adminLoginError}
              </p>
            )}
            <button
              style={css.btn("#1A237E", "#fff", {
                width: "100%",
                padding: 14,
                fontSize: 16,
                marginBottom: 10,
              })}
              onClick={loginAdmin}
            >
              Login
            </button>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>
              🔐 Firebase email login
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "classSelect") {
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
          <BackBtn to="home" />
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

  if (view === "pinLogin" && pinClassId) {
    const cls = data.classes.find((c) => c.id === pinClassId);
    if (!cls) {
      setPinClassId(null);
      setView("classSelect");
      return null;
    }
    const tryPin = (pin) => {
      const found = cls.students.find((s) => s.pin === pin);
      if (found) {
        setSelectedClassId(cls.id);
        setSelectedStudentId(found.id);
        setStudentTab("shop");
        setPinInput("");
        setPinError(false);
        setView("studentDash");
      } else {
        setPinError(true);
        setPinInput("");
      }
    };

    return (
      <div style={css.app}>
        <div style={{ ...css.header(), background: "#1A237E" }}>
          <BackBtn to="classSelect" />
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

  if (view === "studentDash") {
    const cls = data.classes.find((c) => c.id === selectedClassId);
    const me = getCurrentStudent();
    if (!cls || !me) {
      setView("classSelect");
      return null;
    }
    const classRanked = [...cls.students].sort((a, b) => b.points - a.points);
    const myClassRank = classRanked.findIndex((s) => s.id === me.id) + 1;
    const myGlobalRank = globalRanked.findIndex((s) => s.id === me.id) + 1;

    return (
      <div style={css.app}>
        {/* Hero header — #1A237E */}
        <div style={{
          background: "#1A237E",
          padding: "36px 24px 60px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", top: 14, left: 16 }}><BackBtn to="classSelect" /></div>
          <div style={{ fontFamily: FF.display, fontSize: 27, color: "#fff", marginTop: 8, letterSpacing: 0.3 }}>
            Hi, {me.name}! 👋
          </div>
          <div className="cls-pop" style={{ fontFamily: FF.display, fontSize: 88, color: "#fff", lineHeight: 1, marginTop: 10, marginBottom: 2 }}>
            {me.points}
          </div>
          <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 18, fontWeight: 700, marginBottom: 18 }}>⭐ Stars</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "8px 20px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 800, marginBottom: 2, letterSpacing: 0.5 }}>CLASS RANK</div>
              <div style={{ fontFamily: FF.display, fontSize: 26, color: "#fff" }}>{medal(myClassRank - 1)}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "8px 20px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 800, marginBottom: 2, letterSpacing: 0.5 }}>OVERALL</div>
              <div style={{ fontFamily: FF.display, fontSize: 26, color: "#fff" }}>#{myGlobalRank}</div>
            </div>
          </div>
        </div>
        {toast && <div style={css.toast(toast.type)}>{toast.msg}</div>}
        <div
          style={
            studentTab === "village"
              ? {
                  maxWidth: 1280,
                  margin: "-24px auto 0",
                  padding: "16px 16px 16px",
                }
              : { ...css.wrap, marginTop: -24 }
          }
        >

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 14,
              flexWrap: studentTab === "village" ? "nowrap" : "wrap",
            }}
          >
            {[
              ["shop", "🛒 Shop"],
              ["village", "Town"],
              ["ranking", "🏆 Ranking"],
              ["purchases", "🛍 Purchases"],
              ["history", "📋 History"],
              ["pin", "🔑 PIN"],
            ].map(([t, label]) => (
              <button
                key={t}
                style={{
                  background: studentTab === t ? "#1A237E" : "#FFFFFF",
                  color: studentTab === t ? "#fff" : "#888888",
                  border: studentTab === t ? "none" : "2px solid #E0E0E0",
                  borderRadius: 50,
                  padding: "9px 17px",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: FF.body,
                  transition: "all 0.15s",
                }}
                onClick={() => setStudentTab(t)}
              >
                {label}
              </button>
            ))}
          </div>

          {studentTab === "shop" && (
            <div>
              {data.shop.map((item) => (
                <div
                  key={item.id}
                  style={css.card({
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    marginBottom: 8,
                  })}
                >
                  {/* 아이콘 */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#FFF3E0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    flexShrink: 0,
                  }}>
                    {item.emoji || "🎁"}
                  </div>
                  {/* 텍스트 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>{item.name}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  {/* 가격 + 구매 버튼 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{
                      background: "#FF5722",
                      color: "#fff",
                      borderRadius: 50,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}>⭐ {item.price}</span>
                    <button
                      style={{
                        background: me.points >= item.price ? "#1A237E" : C.muted,
                        color: "#fff",
                        border: "none",
                        borderRadius: 50,
                        width: 36,
                        height: 36,
                        fontSize: 16,
                        cursor: me.points >= item.price ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      disabled={me.points < item.price}
                      onClick={() => {
                        if (item.name.includes("Choose Your Seat")) {
                          setSeatPopup({ item });
                        } else {
                          const req = {
                            type: "purchase",
                            cid: cls.id,
                            sid: me.id,
                            studentName: me.name,
                            className: cls.name,
                            item: item.name,
                            price: item.price,
                            date: today(),
                            createdAtMs: Date.now(),
                            isPublic: true,
                          };
                          setPrivacyPopup({ req });
                        }
                      }}
                    >
                      {me.points >= item.price ? "✓" : "💸"}
                    </button>
                  </div>
                </div>
              ))}

              {seatPopup && (
                <SeatPickerPopup
                  cls={cls}
                  me={me}
                  data={data}
                  item={seatPopup.item}
                  onClose={() => setSeatPopup(null)}
                  onChoose={(req) => {
                    setSeatPopup(null);
                    setPrivacyPopup({ req });
                  }}
                  css={css}
                  C={C}
                />
              )}

              {privacyPopup && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 1001,
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
                      padding: 24,
                      maxWidth: 340,
                      width: "100%",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
                    }}
                  >
                    <h3 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 18 }}>
                      👀 Purchase Visibility
                    </h3>
                    <p style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
                      Should <strong>{privacyPopup.req.item}</strong> be visible to classmates?
                    </p>
                    <p style={{ color: C.muted, fontSize: 12, marginBottom: 20 }}>
                      Your teacher will approve it later.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <button
                        style={css.btn(C.success, "#fff", { padding: 14, fontSize: 15, borderRadius: 14 })}
                        onClick={async () => {
                          try {
                            await addDoc(REQUESTS_COL, { ...privacyPopup.req, isPublic: true });
                            setPrivacyPopup(null);
                            showToast("Request sent! 🎉");
                          } catch (e) {
                            console.error(e);
                            showToast("Request failed!", "err");
                          }
                        }}
                      >
                        🌍 Public — show everyone
                      </button>
                      <button
                        style={css.btn(C.primary, "#fff", { padding: 14, fontSize: 15, borderRadius: 14 })}
                        onClick={async () => {
                          try {
                            await addDoc(REQUESTS_COL, { ...privacyPopup.req, isPublic: false });
                            setPrivacyPopup(null);
                            showToast("Request sent! 🎉");
                          } catch (e) {
                            console.error(e);
                            showToast("Request failed!", "err");
                          }
                        }}
                      >
                        🔒 Private — only me
                      </button>
                      <button
                        style={css.btn("#F1F5F9", C.dark, { padding: 12 })}
                        onClick={() => setPrivacyPopup(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {studentTab === "village" && (
            <ClassVillageMVP
              cls={cls}
              me={me}
              classRanked={classRanked}
              onOpenTab={setStudentTab}
              showToast={showToast}
              css={css}
              C={C}
            />
          )}

          {studentTab === "ranking" && (() => {
            const podiumBg = (i) => i === 0 ? "#FFD700" : i === 1 ? "#B0BEC5" : "#FFAB76";
            const podiumText = (i) => i === 0 ? "#7A5800" : i === 1 ? "#37474F" : "#7A3200";
            const renderRankRow = (s, i, showClass = false) => {
              const isMe = s.id === me.id;
              const isPodium = i < 3;
              const publicPurchases = (s.purchases || []).filter((p) => (typeof p === "object" ? p.isPublic : true));
              return (
                <div key={s.id} style={css.card({
                  padding: "12px 16px",
                  marginBottom: 6,
                  background: isPodium ? podiumBg(i) : isMe ? "#E8EAF6" : C.card,
                  borderLeft: isMe && !isPodium ? "4px solid #1A237E" : isPodium ? "none" : "4px solid transparent",
                  borderRadius: 16,
                })}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: publicPurchases.length > 0 ? 8 : 0 }}>
                    <span style={{ width: 34, fontSize: isPodium ? 22 : 16, textAlign: "center", fontWeight: 800, color: isPodium ? podiumText(i) : C.mid }}>
                      {isPodium ? (i === 0 ? "👑" : medal(i)) : `#${i + 1}`}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: isPodium ? podiumText(i) : C.dark }}>
                        {s.name}{isMe ? " (You)" : ""}
                      </div>
                      {showClass && <div style={{ fontSize: 12, color: isPodium ? podiumText(i) : C.muted, marginTop: 1 }}>{s.className}</div>}
                    </div>
                    <span style={{
                      background: isPodium ? "rgba(0,0,0,0.12)" : C.cream,
                      color: isPodium ? podiumText(i) : C.dark,
                      borderRadius: 50,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}>⭐ {s.points}</span>
                  </div>
                  {publicPurchases.length > 0 && (
                    <div style={{ marginLeft: 46, display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {publicPurchases.map((p, j) => (
                        <span key={j} style={{ ...css.pill("#F1F5F9", isPodium ? podiumText(i) : cls.color), fontSize: 11 }}>
                          {typeof p === "object" ? p.name : p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            };
            return (
              <div>
                <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, marginBottom: 10 }}>CLASS — {cls.name}</p>
                {classRanked.map((s, i) => renderRankRow(s, i, false))}
                <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, margin: "16px 0 10px" }}>OVERALL — Top 10</p>
                {globalRanked.slice(0, 10).map((s, i) => renderRankRow(s, i, true))}
              </div>
            );
          })()}

          {studentTab === "purchases" && (
            <div>
              <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, marginBottom: 10, letterSpacing: 0.5 }}>
                MY PURCHASES — {cls.name}
              </p>
              {(me.purchases || []).length === 0 ? (
                <div style={{ ...css.card({ textAlign: "center", padding: "36px 20px" }) }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
                  <div style={{ color: C.muted, fontWeight: 700 }}>No purchases yet!</div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Visit the shop to spend your stars</div>
                </div>
              ) : (
                (me.purchases || []).map((p, i) => {
                  const pname = typeof p === "object" ? p.name : p;
                  const isPublic = typeof p === "object" ? p.isPublic : true;
                  return (
                    <div
                      key={i}
                      style={{
                        ...css.card({
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 18px",
                        }),
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        🛍
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pname}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{isPublic ? "🌍 Public" : "🔒 Private"}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontWeight: 900, fontSize: 15, color: "#FF5722" }}>✅</span>
                      </div>
                    </div>
                  );
                })
              )}

              <p style={{ fontWeight: 800, color: C.muted, fontSize: 13, margin: "16px 0 10px", letterSpacing: 0.5 }}>
                CLASSMATES' PURCHASES
              </p>
              {classRanked.filter(
                (s) =>
                  s.id !== me.id &&
                  (s.purchases || []).some((p) => (typeof p === "object" ? p.isPublic : true))
              ).length === 0 ? (
                <div style={{ ...css.card({ textAlign: "center", color: C.muted, padding: 20 }) }}>
                  No classmates have public purchases yet!
                </div>
              ) : (
                classRanked
                  .filter((s) => s.id !== me.id)
                  .map((s) => {
                    const publicItems = (s.purchases || []).filter((p) =>
                      typeof p === "object" ? p.isPublic : true
                    );
                    if (publicItems.length === 0) return null;
                    return (
                      <div key={s.id} style={css.card()}>
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>🧒 {s.name}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {publicItems.map((p, j) => (
                            <span key={j} style={{ ...css.pill("#F1F5F9", cls.color), fontSize: 12 }}>
                              {typeof p === "object" ? p.name : p}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {studentTab === "history" &&
            ((me.history || []).length === 0 ? (
              <div style={{ ...css.card({ textAlign: "center", padding: "36px 20px" }) }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                <div style={{ color: C.muted, fontWeight: 700 }}>No history yet!</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Your points activity will appear here</div>
              </div>
            ) : (
              (me.history || []).map((h, i) => (
                <div
                  key={i}
                  style={{
                    ...css.card({
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      borderLeft: `4px solid ${h.type === "earn" ? "#2E7D32" : "#C62828"}`,
                      borderRadius: "0 20px 20px 0",
                    }),
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>{h.reason}</div>
                    <div style={{ color: "#888", fontSize: 12, marginTop: 3 }}>{fmtDate(h.date)}</div>
                  </div>
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: 18,
                      color: h.type === "earn" ? "#2E7D32" : "#C62828",
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {h.type === "earn" ? "+" : "-"}{h.pts}⭐
                  </span>
                </div>
              ))
            ))}

          {studentTab === "pin" && (
            <div>
              <div style={{ ...css.card({ textAlign: "center", padding: "36px 24px" }) }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>YOUR PIN</div>
                <div style={{ fontFamily: FF.display, fontSize: 56, fontWeight: 900, color: "#1A237E", letterSpacing: 8 }}>
                  {me.pin}
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 16, lineHeight: 1.6 }}>
                  Ask your teacher to change your PIN
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "admin") {
    const displayClasses =
      filterClass === "all" ? data.classes : data.classes.filter((c) => c.id === filterClass);

    return (
      <div style={css.app}>
        <div style={{ ...css.header(), background: "#1A237E" }}>
          <button
            style={css.btn("rgba(255,255,255,0.2)", "#fff", { padding: "6px 14px", fontSize: 13 })}
            onClick={logoutAdmin}
          >
            ← Logout
          </button>
          <h1 style={css.htitle}>👩‍🏫 Teacher Panel</h1>
          <div>
            {pendingCount > 0 && (
              <button
                style={css.btn(C.accent, C.dark, { padding: "6px 12px", fontSize: 13 })}
                onClick={() => setAdminTab("requests")}
              >
                🔔 {pendingCount}
              </button>
            )}
          </div>
        </div>
        {toast && <div style={css.toast(toast.type)}>{toast.msg}</div>}
        <div style={css.wrap}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              ["points", "⭐ Points"],
              ["requests", `🛒 Requests${pendingCount ? ` (${pendingCount})` : ""}`],
              ["ranking", "🏆 Ranking"],
              ["shop", "🏪 Shop"],
              ["notices", "📢 Notices"],
              ["settings", "⚙️ Settings"],
            ].map(([t, label]) => (
              <button key={t} style={{
                background: adminTab === t ? "#1A237E" : "#FFFFFF",
                color: adminTab === t ? "#fff" : "#888888",
                border: adminTab === t ? "none" : "2px solid #E0E0E0",
                borderRadius: 50,
                padding: "9px 17px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: FF.body,
                transition: "all 0.15s",
              }} onClick={() => setAdminTab(t)}>
                {label}
              </button>
            ))}
          </div>

          {adminTab === "points" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <button style={css.tab(filterClass === "all")} onClick={() => setFilterClass("all")}>
                  All
                </button>
                {data.classes.map((c) => (
                  <button
                    key={c.id}
                    style={css.tab(filterClass === c.id, c.color)}
                    onClick={() => setFilterClass(c.id)}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>

              {displayClasses.map((cls) => (
                <div key={cls.id} style={css.card()}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{cls.emoji}</span>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17, flex: 1 }}>
                      {cls.name}
                    </h3>
                    <span style={css.pill(cls.color)}>{cls.students.length} students</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>
                        Whole class:
                      </span>
                      <button
                        style={css.btn("#2E7D32", "#fff", {
                          padding: "5px 14px",
                          fontSize: 13,
                          borderRadius: 10,
                        })}
                        onClick={() => addClassPoints(cls.id, 1)}
                      >
                        +1⭐
                      </button>
                      <button
                        style={css.btn("#C62828", "#fff", {
                          padding: "5px 14px",
                          fontSize: 13,
                          borderRadius: 10,
                        })}
                        onClick={() => addClassPoints(cls.id, -1)}
                      >
                        -1⭐
                      </button>
                    </div>
                  </div>

                  {cls.students.map((stu) => (
                    <StudentPointRow
                      key={stu.id}
                      stu={stu}
                      cls={cls}
                      onAdd={(pts, reason) => addPoints(cls.id, stu.id, pts, reason)}
                      css={css}
                      C={C}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {adminTab === "requests" &&
            (requests.length === 0 ? (
              <div style={{ ...css.card({ textAlign: "center", color: C.muted, padding: 40 }) }}>
                No pending requests! 🎉
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    ...css.card({
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                    }),
                  }}
                >
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{req.studentName}</div>
                    <div style={{ color: C.muted, fontSize: 13 }}>
                      {req.className} · {fmtDate(req.date)}
                    </div>
                    {req.type === "purchase" ? (
                      <>
                        <div style={{ fontWeight: 700, marginTop: 4 }}>{req.item}</div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                          {req.isPublic === false ? "🔒 Private purchase" : "🌍 Public purchase"}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontWeight: 700, marginTop: 4 }}>
                        🔑 PIN change request → {req.newPin}
                      </div>
                    )}
                  </div>
                  <span style={css.pill(C.accent, C.dark)}>
                    {req.type === "purchase" ? `⭐ ${req.price}` : "PIN"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={css.btn(C.success, "#fff", { padding: "8px 16px" })}
                      onClick={() => approveRequest(req.id)}
                    >
                      ✅ Approve
                    </button>
                    <button
                      style={css.btn(C.danger, "#fff", { padding: "8px 16px" })}
                      onClick={() => rejectRequest(req.id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))
            ))}

          {adminTab === "ranking" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <button style={css.tab(filterClass === "all")} onClick={() => setFilterClass("all")}>
                  🌍 Overall
                </button>
                {data.classes.map((c) => (
                  <button
                    key={c.id}
                    style={css.tab(filterClass === c.id, c.color)}
                    onClick={() => setFilterClass(c.id)}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>

              {(filterClass === "all"
                ? globalRanked
                : [...(data.classes.find((c) => c.id === filterClass)?.students || [])].sort(
                    (a, b) => b.points - a.points
                  )
              ).map((s, i) => {
                const clr =
                  filterClass === "all"
                    ? s.classColor
                    : data.classes.find((c) => c.id === filterClass)?.color || C.primary;

                return (
                  <div key={s.id} style={{ ...css.card({ padding: "12px 18px" }) }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: (s.purchases || []).length > 0 ? 8 : 0,
                      }}
                    >
                      <span style={{ width: 32, fontSize: 20, textAlign: "center" }}>
                        {medal(i)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        {filterClass === "all" && <span style={css.pill(s.classColor)}>{s.className}</span>}
                      </div>
                      <span style={css.pill(C.accent, C.dark)}>⭐ {s.points}</span>
                    </div>
                    {(s.purchases || []).length > 0 && (
                      <div style={{ marginLeft: 46, display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {(s.purchases || []).map((p, j) => {
                          const name = typeof p === "object" ? p.name : p;
                          const pub = typeof p === "object" ? p.isPublic : true;
                          return (
                            <span
                              key={j}
                              style={{
                                ...css.pill(pub ? "#F1F5F9" : "#FFF0F0", pub ? clr : C.muted),
                                fontSize: 11,
                              }}
                            >
                              {pub ? "" : "🔒 "}
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {adminTab === "shop" && (
            <div>
              {data.shop.map((item) => (
                <ShopItemRow
                  key={item.id}
                  item={item}
                  onUpdate={updateShopItem}
                  onRemove={() => removeShopItem(item.id)}
                  css={css}
                  C={C}
                />
              ))}
              <button
                style={css.btn(C.success, "#fff", { width: "100%", padding: 14, fontSize: 15 })}
                onClick={addShopItem}
              >
                + Add New Item
              </button>
            </div>
          )}

          {adminTab === "notices" && (
            <NoticeAdminPanel
              notices={sortedNotices}
              onAdd={addNotice}
              onDelete={deleteNotice}
              onTogglePinned={toggleNoticePinned}
              css={css}
              C={C}
            />
          )}

          {adminTab === "settings" && (
            <div>
              <div style={css.card()}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>🏫 Manage Classes</h3>
                  <button
                    style={css.btn(C.success, "#fff", { padding: "7px 16px", fontSize: 13 })}
                    onClick={addClass}
                  >
                    + Add Class
                  </button>
                </div>
                {data.classes.map((cls) => (
                  <ClassSettingsRow
                    key={cls.id}
                    cls={cls}
                    onRename={(name) => renameClass(cls.id, name)}
                    onRemove={() => {
                      if (window.confirm(`Remove "${cls.name}" and ALL its students?`)) {
                        removeClass(cls.id);
                      }
                    }}
                    css={css}
                    C={C}
                  />
                ))}
              </div>

              {data.classes.map((cls) => (
                <div key={cls.id} style={css.card()}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{cls.emoji}</span>
                    <h3 style={{ margin: 0, fontWeight: 800, flex: 1 }}>
                      {cls.name}{" "}
                      <span style={{ color: C.muted, fontSize: 14 }}>
                        ({cls.students.length} students)
                      </span>
                    </h3>
                    <button
                      style={css.btn("#FFF3E0", "#E67E22", { padding: "7px 14px", fontSize: 13 })}
                      onClick={async () => {
                        if (!window.confirm(`Reset seat purchases for ${cls.name}?`)) return;
                        const classId = cls.id;
                        await saveDataTx((prev) => ({
                          ...prev,
                          classes: prev.classes.map((c) =>
                            c.id !== classId
                              ? c
                              : {
                                  ...c,
                                  students: c.students.map((s) => ({
                                    ...s,
                                    purchases: (s.purchases || []).filter((p) => {
                                      const n = typeof p === "object" ? p.name : p;
                                      return !n.includes("Choose Your Seat");
                                    }),
                                  })),
                                }
                          ),
                        }));
                        await Promise.all(
                          requests
                            .filter(
                              (r) =>
                                r.type === "purchase" &&
                                r.cid === classId &&
                                String(r.item || "").includes("Choose Your Seat")
                            )
                            .map((r) => deleteDoc(REQUEST_DOC(r.id)))
                        );
                        showToast(`🪑 Seats reset for ${cls.name}!`);
                      }}
                    >
                      🪑 Reset Seats
                    </button>
                    <button
                      style={css.btn(C.success, "#fff", { padding: "7px 14px", fontSize: 13 })}
                      onClick={() => addStudent(cls.id)}
                    >
                      + Add Student
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 2fr 1fr auto",
                      gap: 6,
                      marginBottom: 6,
                      alignItems: "center",
                    }}
                  >
                    <span />
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>NAME</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>
                      PIN (4 digits)
                    </span>
                    <span />
                  </div>

                  {cls.students.map((stu, i) => (
                    <StudentSettingsRow
                      key={stu.id}
                      stu={stu}
                      idx={i}
                      onRename={(name) => renameStudent(cls.id, stu.id, name)}
                      onPinChange={(pin) => updatePin(cls.id, stu.id, pin)}
                      onRemove={() => {
                        if (window.confirm(`Remove ${stu.name}?`)) removeStudent(cls.id, stu.id);
                      }}
                      css={css}
                      C={C}
                    />
                  ))}
                </div>
              ))}

              <div style={css.card()}>
                <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>💾 Backup & Recovery</h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    style={css.btn(C.primary, "#fff", { padding: "10px 20px" })}
                    onClick={async () => {
                      try {
                        const latest = dataRef.current;
                        await setDoc(BACKUP_DOC, {
                          ...latest,
                          _backupTime: new Date().toISOString(),
                        });
                        showToast("💾 Backup saved!");
                      } catch (e) {
                        showToast("Backup failed!", "err");
                      }
                    }}
                  >
                    💾 Save Backup Now
                  </button>
                  <button
                    style={css.btn("#FFF3E0", "#E67E22", { padding: "10px 20px" })}
                    onClick={async () => {
                      try {
                        const snap = await getDoc(BACKUP_DOC);
                        if (!snap.exists()) return showToast("No backup found!", "err");

                        const backup = snap.data();
                        const totalPts = (backup.classes || []).reduce(
                          (s, c) => s + c.students.reduce((ss, st) => ss + (st.points || 0), 0),
                          0
                        );
                        const stuCount = (backup.classes || []).reduce(
                          (s, c) => s + c.students.length,
                          0
                        );
                        const backupTime = backup._backupTime || "unknown";
                        if (
                          window.confirm(
                            `Restore backup from ${backupTime}?\n${stuCount} students, ${totalPts} total points\n\nThis will overwrite current data!`
                          )
                        ) {
                          delete backup._backupTime;
                          await setDoc(DATA_DOC, backup);
                          showToast("✅ Backup restored!");
                        }
                      } catch (e) {
                        showToast("Restore failed!", "err");
                      }
                    }}
                  >
                    🔄 Restore from Backup
                  </button>
                </div>
                <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
                  Auto-backup saves every ~10 changes. Manual backup recommended before code updates.
                </p>
              </div>

              <div style={css.card()}>
                <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>⚠️ Reset All Points</h3>
                <button
                  style={css.btn(C.danger, "#fff", { padding: "10px 20px" })}
                  onClick={() => {
                    if (!window.confirm("Reset ALL points? Cannot be undone!")) return;
                    saveDataTx(
                      (prev) => ({
                        ...prev,
                        classes: prev.classes.map((c) => ({
                          ...c,
                          students: c.students.map((s) => ({
                            ...s,
                            points: 0,
                            history: [],
                            purchases: [],
                          })),
                        })),
                      }),
                      { allowReset: true }
                    );
                    showToast("All points reset!");
                  }}
                >
                  🔄 Reset All Points
                </button>
              </div>

              {data.classes.length === 0 && (
                <div style={{ ...css.card({ border: "2px dashed #FF8066", background: "#FFF5F3" }) }}>
                  <h3 style={{ margin: "0 0 8px", fontWeight: 800, color: C.primary }}>🆕 First Time Setup</h3>
                  <p style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
                    No classes found. Load the default classes to get started.
                  </p>
                  <button
                    style={css.btn(C.primary, "#fff", { padding: "10px 20px" })}
                    onClick={() => {
                      if (
                        window.confirm("Load default classes? Only do this if Firebase is empty!")
                      ) {
                        saveDataTx(DEFAULT_DATA, { allowReset: true });
                        showToast("Default classes loaded! ✅");
                      }
                    }}
                  >
                    📥 Load Default Classes
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function SeatPickerPopup({ cls, me, data, item, onClose, onChoose, css, C }) {
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

function StudentPointRow({ stu, cls, onAdd, css, C }) {
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

function ClassSettingsRow({ cls, onRename, onRemove, css, C }) {
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

function StudentSettingsRow({ stu, idx, onRename, onPinChange, onRemove, css, C }) {
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

function PinChangeTab({ me, cls, onSave, css, C, requestMode = false }) {
  const [step, setStep] = useState("current");
  const [currentInput, setCurrentInput] = useState("");
  const [newInput, setNewInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setStep("current");
    setCurrentInput("");
    setNewInput("");
    setConfirmInput("");
    setError("");
  };

  const handleKey = (val, setter, next) => {
    if (val === "⌫") {
      setter((p) => p.slice(0, -1));
      setError("");
      return;
    }
    setter((p) => {
      const nextVal = p + val;
      if (nextVal.length === 4) setTimeout(() => next(nextVal), 150);
      return nextVal.length <= 4 ? nextVal : p;
    });
  };

  const checkCurrent = (val) => {
    if (val !== me.pin) {
      setError("Wrong PIN! Try again 🙈");
      setCurrentInput("");
      return;
    }
    setStep("new");
    setCurrentInput(val);
    setError("");
  };

  const setNew = (val) => {
    setStep("confirm");
    setNewInput(val);
    setError("");
  };

  const checkConfirm = async (val) => {
    if (val !== newInput) {
      setError("PINs don't match! Try again 🙈");
      setConfirmInput("");
      setStep("new");
      setNewInput("");
      return;
    }
    await onSave(val);
    reset();
  };

  const steps = {
    current: {
      title: "Enter current PIN",
      subtitle: requestMode ? "Verify first" : "Verify it's you",
      input: currentInput,
      setter: setCurrentInput,
      next: checkCurrent,
    },
    new: {
      title: "Enter new PIN",
      subtitle: requestMode ? "Teacher approval will be needed" : "Choose a new 4-digit PIN",
      input: newInput,
      setter: setNewInput,
      next: setNew,
    },
    confirm: {
      title: "Confirm new PIN",
      subtitle: requestMode ? "Send PIN change request" : "Enter the new PIN again",
      input: confirmInput,
      setter: setConfirmInput,
      next: checkConfirm,
    },
  };

  const s = steps[step];

  return (
    <div
      style={{
        ...css.card({
          maxWidth: 320,
          margin: "0 auto",
          textAlign: "center",
          padding: 24,
        }),
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 8 }}>🔑</div>
      <h3 style={{ fontWeight: 800, fontSize: 18, margin: "0 0 4px" }}>{s.title}</h3>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>{s.subtitle}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 46,
              height: 52,
              borderRadius: 12,
              border: `2.5px solid ${s.input.length > i ? cls.color : "#DDD"}`,
              background: s.input.length > i ? cls.color + "18" : "#FAFAFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              color: cls.color,
              fontWeight: 900,
            }}
          >
            {s.input.length > i ? "●" : ""}
          </div>
        ))}
      </div>
      {error && (
        <p style={{ color: C.danger, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          {error}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          maxWidth: 220,
          margin: "0 auto 14px",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k, i) => (
          <button
            key={i}
            disabled={k === ""}
            style={{
              ...css.btn(
                k === "⌫" ? "#FFE5E5" : "#F1F5F9",
                k === "⌫" ? C.danger : cls.color,
                {
                  padding: "15px 0",
                  fontSize: 20,
                  borderRadius: 12,
                  opacity: k === "" ? 0 : 1,
                  cursor: k === "" ? "default" : "pointer",
                }
              ),
            }}
            onClick={() => k !== "" && handleKey(String(k), s.setter, s.next)}
          >
            {k}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 4 }}>
        {["current", "new", "confirm"].map((st) => (
          <div
            key={st}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: step === st ? cls.color : "#DDD",
            }}
          />
        ))}
      </div>
      <button
        style={{ ...css.btn("#F1F5F9", C.muted, { padding: "8px 20px", fontSize: 13, marginTop: 14 }) }}
        onClick={reset}
      >
        Cancel
      </button>
    </div>
  );
}

function ShopItemRow({ item, onUpdate, onRemove, css, C }) {
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

function NoticeAdminPanel({ notices, onAdd, onDelete, onTogglePinned, css, C }) {
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0, fontWeight: 800 }}>📰 Current Notices</h3>
          <span style={css.pill("#F1F5F9", C.primary)}>{notices.length} saved</span>
        </div>

        {notices.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 24,
              color: C.muted,
              background: "#F8FAFC",
              borderRadius: 14,
            }}
          >
            No notices yet.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              style={{
                border: "1px solid #EDF2F7",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                background: notice.pinned ? "#FFF9E8" : "#FAFAFA",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginBottom: 6,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {notice.pinned ? "📌 " : ""}
                  {notice.title}
                </div>
                <span
                  style={css.pill(
                    notice.pinned ? C.accent : "#F1F5F9",
                    notice.pinned ? C.dark : C.muted
                  )}
                >
                  {fmtDate(notice.date)}
                </span>
              </div>
              <div style={{ fontSize: 14, whiteSpace: "pre-wrap", marginBottom: 12 }}>
                {notice.body}
              </div>
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
