
import { useState, useEffect, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  getDocs,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { DEFAULT_STUDENT_PATH, getPathForStudentDestination, getStudentTabForPath, isDungeonPath, normalizeStudentPath } from "../shared/studentRoutes.js";
import { getPreviousDennisVillageWeekId } from "../shared/dennisVillageWeek.js";
import { auth, db, DATA_DOC, BACKUP_DOC, REQUESTS_COL, REQUEST_DOC } from "./lib/firebaseClient";
import { getGameApiErrorMessage, isFunctionsUnavailableError, verifyStudentPin } from "./lib/gameApi";
import { clearStudentSession, readStudentSession, writeStudentSession } from "./lib/studentSession";
import {
  buildDennisVillageAwardDismissKey,
  buildDennisVillageAwardNotice,
} from "./lib/dennisVillageAwardNotice";
import { FF } from "./lib/design";
import { today } from "./lib/utils";
import HomeView from "./views/HomeView";
import NoticeBoardView from "./views/NoticeBoardView";
import AdminLoginView from "./views/AdminLoginView";
import ClassSelectView from "./views/ClassSelectView";
import PinLoginView from "./views/PinLoginView";
import StudentDashView from "./views/StudentDashView";
import AdminView from "./views/AdminView";



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
    lifetimePoints: 0,
    history: [],
    purchases: [],
    profile: { avatarId: null },
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
    lifetimePoints: 0,
    history: [],
    purchases: [],
    profile: { avatarId: null },
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
      profile: { avatarId: null, ...(s.profile || {}) },
    })),
  })),
});

const sortNotices = (notices) =>
  [...(notices || [])].sort(
    (a, b) =>
      Number(!!b.pinned) - Number(!!a.pinned) ||
      (b.createdAtMs || 0) - (a.createdAtMs || 0)
  );


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
  const [studentTab, setStudentTabRaw] = useState(() =>
    getStudentTabForPath(window.location.pathname) || getStudentTabForPath(DEFAULT_STUDENT_PATH) || "village"
  );
  const [studentSession, setStudentSessionRaw] = useState(() => readStudentSession());
  const [pathname, setPathname] = useState(() => window.location.pathname || "/");
  const [adminEmail, setAdminEmail] = useState(() => sessionStorage.getItem("adminEmail") || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [toast, setToast] = useState(null);
  const [dennisVillageAwardNotice, setDennisVillageAwardNotice] = useState(null);
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
  const classIdsKey = (data?.classes || []).map((cls) => cls.id).join("|");

  const navigatePath = (nextPath, { replace = false } = {}) => {
    const normalizedPath = nextPath || "/";
    const currentPath = window.location.pathname || "/";

    if (normalizedPath === currentPath) {
      setPathname(normalizedPath);
      return;
    }

    const historyMethod = replace ? "replaceState" : "pushState";
    window.history[historyMethod]({}, "", normalizedPath);
    setPathname(normalizedPath);
  };

  const setStudentSession = (session) => {
    setStudentSessionRaw(writeStudentSession(session));
  };

  const setStudentTab = (tab) => {
    setStudentTabRaw(tab);
  };

  const openStudentDestination = (destination, options) => {
    const nextPath = normalizeStudentPath(getPathForStudentDestination(destination));
    setStudentTabRaw(getStudentTabForPath(nextPath));
    navigatePath(nextPath, options);
  };

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

  const logoutStudent = () => {
    clearStudentSession();
    setStudentSessionRaw(null);
    setSelectedStudentId(null);
    setSelectedClassId(null);
    setPinInput("");
    setPinError(false);
    setView("classSelect");
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
    if (!adminAuthUid || !(data?.classes || []).length) {
      setDennisVillageAwardNotice(null);
      return undefined;
    }

    let cancelled = false;
    const weekId = getPreviousDennisVillageWeekId(new Date());
    const dismissKey = buildDennisVillageAwardDismissKey(weekId);

    try {
      if (localStorage.getItem(dismissKey) === "1") {
        setDennisVillageAwardNotice(null);
        return undefined;
      }
    } catch (error) {
      console.error("Failed to read Dennis Village notice preference:", error);
    }

    async function loadDennisVillageAwardNotice() {
      try {
        const classEntries = await Promise.all(
          (data.classes || []).map(async (cls) => {
            const snap = await getDocs(
              collection(db, "dennisVillageWeeks", weekId, "classes", cls.id, "students")
            );

            return snap.docs.map((docSnap) => ({
              classId: cls.id,
              className: cls.name,
              studentId: docSnap.id,
              ...docSnap.data(),
            }));
          })
        );
        const awardNotice = buildDennisVillageAwardNotice({
          weekId,
          entries: classEntries.flat(),
        });

        if (!cancelled) {
          setDennisVillageAwardNotice(awardNotice);
        }
      } catch (error) {
        console.error("Failed to load Dennis Village award notice:", error);
        if (!cancelled) setDennisVillageAwardNotice(null);
      }
    }

    loadDennisVillageAwardNotice();

    return () => {
      cancelled = true;
    };
  }, [adminAuthUid, classIdsKey, data]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (view === "studentDash") {
      const nextPath = normalizeStudentPath(pathname);

      if (nextPath !== pathname) {
        navigatePath(nextPath, { replace: true });
        return;
      }

      const nextTab = getStudentTabForPath(nextPath);
      if (nextTab !== studentTab) {
        setStudentTabRaw(nextTab);
      }
      return;
    }

    if (pathname !== "/") {
      navigatePath("/", { replace: true });
    }
  }, [pathname, studentTab, view]);

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
                  lifetimePoints: 0,
                  history: [],
                  purchases: [],
                  profile: { avatarId: null },
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

  const cls = data.classes.find((c) => c.id === selectedClassId);
  const me = getCurrentStudent();
  const classRanked = cls ? [...cls.students].sort((a, b) => b.points - a.points) : [];
  const displayClasses =
    filterClass === "all" ? data.classes : data.classes.filter((c) => c.id === filterClass);

  if (view === "home") return <HomeView setView={setView} sortedNotices={sortedNotices} toast={toast} />;

  if (view === "noticeBoard") return <NoticeBoardView setView={setView} sortedNotices={sortedNotices} />;

  if (view === "adminLogin") return <AdminLoginView setView={setView} adminEmail={adminEmail} setAdminEmail={setAdminEmail} adminPassword={adminPassword} setAdminPassword={setAdminPassword} adminLoginError={adminLoginError} setAdminLoginError={setAdminLoginError} loginAdmin={loginAdmin} />;

  if (view === "classSelect") return <ClassSelectView setView={setView} data={data} setPinClassId={setPinClassId} setPinInput={setPinInput} setPinError={setPinError} />;

  if (view === "pinLogin" && pinClassId) return <PinLoginView setView={setView} data={data} pinClassId={pinClassId} setPinClassId={setPinClassId} pinInput={pinInput} setPinInput={setPinInput} pinError={pinError} setPinError={setPinError} setSelectedClassId={setSelectedClassId} setSelectedStudentId={setSelectedStudentId} setStudentSession={setStudentSession} setStudentTab={setStudentTab} showToast={showToast} />;

  if (view === "studentDash") {
    if (!cls || !me) { setView("classSelect"); return null; }
    return <StudentDashView cls={cls} me={me} classRanked={classRanked} globalRanked={globalRanked} logoutStudent={logoutStudent} toast={toast} showToast={showToast} pathname={pathname} studentSession={studentSession} openStudentDestination={openStudentDestination} seatPopup={seatPopup} setSeatPopup={setSeatPopup} privacyPopup={privacyPopup} setPrivacyPopup={setPrivacyPopup} shop={data.shop} />;
  }

  if (view === "admin") return <AdminView data={data} displayClasses={displayClasses} filterClass={filterClass} setFilterClass={setFilterClass} logoutAdmin={logoutAdmin} toast={toast} showToast={showToast} adminTab={adminTab} setAdminTab={setAdminTab} pendingCount={pendingCount} dennisVillageAwardNotice={dennisVillageAwardNotice} setDennisVillageAwardNotice={setDennisVillageAwardNotice} globalRanked={globalRanked} sortedNotices={sortedNotices} requests={requests} approveRequest={approveRequest} rejectRequest={rejectRequest} addClassPoints={addClassPoints} addPoints={addPoints} updateShopItem={updateShopItem} removeShopItem={removeShopItem} addShopItem={addShopItem} addNotice={addNotice} deleteNotice={deleteNotice} toggleNoticePinned={toggleNoticePinned} addClass={addClass} removeClass={removeClass} addStudent={addStudent} removeStudent={removeStudent} renameClass={renameClass} renameStudent={renameStudent} updatePin={updatePin} saveDataTx={saveDataTx} dataRef={dataRef} DEFAULT_DATA={DEFAULT_DATA} />;

  return null;
}

