import React from "react";
import { C, css } from "../lib/design";
import BackBtn from "../components/BackBtn";

export default function AdminLoginView({
  setView,
  adminEmail, setAdminEmail,
  adminPassword, setAdminPassword,
  adminLoginError, setAdminLoginError,
  loginAdmin,
}) {
  return (
    <div style={css.app}>
      <div style={{ ...css.header(), background: "#1A237E" }}>
        <BackBtn setView={setView} to="home" />
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
