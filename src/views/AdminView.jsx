import React from "react";
import { deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { C, FF, css } from "../lib/design";
import { fmtDate, medal } from "../lib/utils";
import { BACKUP_DOC, DATA_DOC, REQUEST_DOC } from "../lib/firebaseClient";
import StudentPointRow from "../components/StudentPointRow";
import ShopItemRow from "../components/ShopItemRow";
import ClassSettingsRow from "../components/ClassSettingsRow";
import StudentSettingsRow from "../components/StudentSettingsRow";
import NoticeAdminPanel from "../components/NoticeAdminPanel";

export default function AdminView({
  data, displayClasses, filterClass, setFilterClass,
  logoutAdmin, toast, showToast,
  adminTab, setAdminTab,
  pendingCount, dennisVillageAwardNotice, setDennisVillageAwardNotice,
  globalRanked, sortedNotices,
  requests, approveRequest, rejectRequest,
  addClassPoints, addPoints,
  updateShopItem, removeShopItem, addShopItem,
  addNotice, deleteNotice, toggleNoticePinned,
  addClass, removeClass, addStudent, removeStudent,
  renameClass, renameStudent, updatePin,
  saveDataTx, dataRef, DEFAULT_DATA,
}) {
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
        {/* Tab bar */}
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
              borderRadius: 50, padding: "9px 17px", fontWeight: 800, fontSize: 13,
              cursor: "pointer", fontFamily: FF.body, transition: "all 0.15s",
            }} onClick={() => setAdminTab(t)}>
              {label}
            </button>
          ))}
        </div>

        {/* Dennis Village award notice */}
        {dennisVillageAwardNotice && (
          <div style={css.card({ marginBottom: 14, padding: "14px 16px", background: "#FFF8E1", borderLeft: "5px solid #F9A825", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" })}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 900, color: C.dark, fontSize: 15 }}>Dennis Village 지난주 보상 확인 필요</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                지난주 참여 기록 {dennisVillageAwardNotice.count}건이 있어요. 리더보드를 보고 별 보상을 수동으로 주세요.
              </div>
            </div>
            <button
              style={css.btn("#F9A825", C.dark, { padding: "8px 14px", fontSize: 13 })}
              onClick={() => {
                try { localStorage.setItem(dennisVillageAwardNotice.dismissKey, "1"); } catch (e) { console.error(e); }
                setDennisVillageAwardNotice(null);
              }}
            >
              확인
            </button>
          </div>
        )}

        {/* Points tab */}
        {adminTab === "points" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button style={css.tab(filterClass === "all")} onClick={() => setFilterClass("all")}>All</button>
              {data.classes.map((c) => (
                <button key={c.id} style={css.tab(filterClass === c.id, c.color)} onClick={() => setFilterClass(c.id)}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
            {displayClasses.map((cls) => (
              <div key={cls.id} style={css.card()}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 22 }}>{cls.emoji}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17, flex: 1 }}>{cls.name}</h3>
                  <span style={css.pill(cls.color)}>{cls.students.length} students</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Whole class:</span>
                    <button style={css.btn("#2E7D32", "#fff", { padding: "5px 14px", fontSize: 13, borderRadius: 10 })} onClick={() => addClassPoints(cls.id, 1)}>+1⭐</button>
                    <button style={css.btn("#C62828", "#fff", { padding: "5px 14px", fontSize: 13, borderRadius: 10 })} onClick={() => addClassPoints(cls.id, -1)}>-1⭐</button>
                  </div>
                </div>
                {cls.students.map((stu) => (
                  <StudentPointRow key={stu.id} stu={stu} cls={cls} onAdd={(pts, reason) => addPoints(cls.id, stu.id, pts, reason)} css={css} C={C} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Requests tab */}
        {adminTab === "requests" && (
          requests.length === 0 ? (
            <div style={{ ...css.card({ textAlign: "center", color: C.muted, padding: 40 }) }}>No pending requests! 🎉</div>
          ) : (
            requests.map((req) => (
              <div key={req.id} style={{ ...css.card({ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }) }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{req.studentName}</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>{req.className} · {fmtDate(req.date)}</div>
                  {req.type === "purchase" ? (
                    <>
                      <div style={{ fontWeight: 700, marginTop: 4 }}>{req.item}</div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{req.isPublic === false ? "🔒 Private purchase" : "🌍 Public purchase"}</div>
                    </>
                  ) : (
                    <div style={{ fontWeight: 700, marginTop: 4 }}>🔑 PIN change request → {req.newPin}</div>
                  )}
                </div>
                <span style={css.pill(C.accent, C.dark)}>{req.type === "purchase" ? `⭐ ${req.price}` : "PIN"}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={css.btn(C.success, "#fff", { padding: "8px 16px" })} onClick={() => approveRequest(req.id)}>✅ Approve</button>
                  <button style={css.btn(C.danger, "#fff", { padding: "8px 16px" })} onClick={() => rejectRequest(req.id)}>❌ Reject</button>
                </div>
              </div>
            ))
          )
        )}

        {/* Ranking tab */}
        {adminTab === "ranking" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button style={css.tab(filterClass === "all")} onClick={() => setFilterClass("all")}>🌍 Overall</button>
              {data.classes.map((c) => (
                <button key={c.id} style={css.tab(filterClass === c.id, c.color)} onClick={() => setFilterClass(c.id)}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
            {(filterClass === "all"
              ? globalRanked
              : [...(data.classes.find((c) => c.id === filterClass)?.students || [])].sort((a, b) => b.points - a.points)
            ).map((s, i) => {
              const clr = filterClass === "all" ? s.classColor : data.classes.find((c) => c.id === filterClass)?.color || C.primary;
              return (
                <div key={s.id} style={{ ...css.card({ padding: "12px 18px" }) }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: (s.purchases || []).length > 0 ? 8 : 0 }}>
                    <span style={{ width: 32, fontSize: 20, textAlign: "center" }}>{medal(i)}</span>
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
                        return <span key={j} style={{ ...css.pill(pub ? "#F1F5F9" : "#FFF0F0", pub ? clr : C.muted), fontSize: 11 }}>{pub ? "" : "🔒 "}{name}</span>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Shop tab */}
        {adminTab === "shop" && (
          <div>
            {data.shop.map((item) => (
              <ShopItemRow key={item.id} item={item} onUpdate={updateShopItem} onRemove={() => removeShopItem(item.id)} css={css} C={C} />
            ))}
            <button style={css.btn(C.success, "#fff", { width: "100%", padding: 14, fontSize: 15 })} onClick={addShopItem}>
              + Add New Item
            </button>
          </div>
        )}

        {/* Notices tab */}
        {adminTab === "notices" && (
          <NoticeAdminPanel notices={sortedNotices} onAdd={addNotice} onDelete={deleteNotice} onTogglePinned={toggleNoticePinned} />
        )}

        {/* Settings tab */}
        {adminTab === "settings" && (
          <div>
            <div style={css.card()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16 }}>🏫 Manage Classes</h3>
                <button style={css.btn(C.success, "#fff", { padding: "7px 16px", fontSize: 13 })} onClick={addClass}>+ Add Class</button>
              </div>
              {data.classes.map((cls) => (
                <ClassSettingsRow
                  key={cls.id}
                  cls={cls}
                  onRename={(name) => renameClass(cls.id, name)}
                  onRemove={() => { if (window.confirm(`Remove "${cls.name}" and ALL its students?`)) removeClass(cls.id); }}
                />
              ))}
            </div>

            {data.classes.map((cls) => (
              <div key={cls.id} style={css.card()}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 22 }}>{cls.emoji}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, flex: 1 }}>
                    {cls.name} <span style={{ color: C.muted, fontSize: 14 }}>({cls.students.length} students)</span>
                  </h3>
                  <button
                    style={css.btn("#FFF3E0", "#E67E22", { padding: "7px 14px", fontSize: 13 })}
                    onClick={async () => {
                      if (!window.confirm(`Reset seat purchases for ${cls.name}?`)) return;
                      const classId = cls.id;
                      await saveDataTx((prev) => ({
                        ...prev,
                        classes: prev.classes.map((c) =>
                          c.id !== classId ? c : {
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
                        requests.filter((r) => r.type === "purchase" && r.cid === classId && String(r.item || "").includes("Choose Your Seat"))
                          .map((r) => deleteDoc(REQUEST_DOC(r.id)))
                      );
                      showToast(`🪑 Seats reset for ${cls.name}!`);
                    }}
                  >
                    🪑 Reset Seats
                  </button>
                  <button style={css.btn(C.success, "#fff", { padding: "7px 14px", fontSize: 13 })} onClick={() => addStudent(cls.id)}>+ Add Student</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "28px 2fr 1fr auto", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <span /><span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>NAME</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>PIN (4 digits)</span><span />
                </div>

                {cls.students.map((stu, i) => (
                  <StudentSettingsRow
                    key={stu.id}
                    stu={stu}
                    idx={i}
                    onRename={(name) => renameStudent(cls.id, stu.id, name)}
                    onPinChange={(pin) => updatePin(cls.id, stu.id, pin)}
                    onRemove={() => { if (window.confirm(`Remove ${stu.name}?`)) removeStudent(cls.id, stu.id); }}
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
                      await setDoc(BACKUP_DOC, { ...latest, _backupTime: new Date().toISOString() });
                      showToast("💾 Backup saved!");
                    } catch (e) { showToast("Backup failed!", "err"); }
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
                      const totalPts = (backup.classes || []).reduce((s, c) => s + c.students.reduce((ss, st) => ss + (st.points || 0), 0), 0);
                      const stuCount = (backup.classes || []).reduce((s, c) => s + c.students.length, 0);
                      const backupTime = backup._backupTime || "unknown";
                      if (window.confirm(`Restore backup from ${backupTime}?\n${stuCount} students, ${totalPts} total points\n\nThis will overwrite current data!`)) {
                        delete backup._backupTime;
                        await setDoc(DATA_DOC, backup);
                        showToast("✅ Backup restored!");
                      }
                    } catch (e) { showToast("Restore failed!", "err"); }
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
                    (prev) => ({ ...prev, classes: prev.classes.map((c) => ({ ...c, students: c.students.map((s) => ({ ...s, points: 0, history: [], purchases: [] })) })) }),
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
                <p style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>No classes found. Load the default classes to get started.</p>
                <button
                  style={css.btn(C.primary, "#fff", { padding: "10px 20px" })}
                  onClick={() => {
                    if (window.confirm("Load default classes? Only do this if Firebase is empty!")) {
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
