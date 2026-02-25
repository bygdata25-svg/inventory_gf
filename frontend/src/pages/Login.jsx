import { useState } from "react";
import { t } from "../i18n";
import { setAuth } from "../auth";

const API_BASE = import.meta.env.VITE_API_URL || "https://inventory-gf.onrender.com";

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!r.ok) {
      setError(t("errors.invalidCredentials"));
      return;
    }

    const data = await r.json();
    setAuth(data.access_token, data.role);
    onLoggedIn?.();
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 16, maxWidth: 420 }}>
      <h1>{t("ui.loginTitle")}</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label>
          <div style={{ marginBottom: 4 }}>{t("ui.username")}</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>{t("ui.password")}</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <button type="submit">{t("ui.login")}</button>

        {error && <div style={{ padding: 8, background: "#ffe5e5" }}>{error}</div>}
      </form>
    </div>
  );
}

