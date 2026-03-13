import { useState } from "react";
import { t } from "../i18n";
import { setAuth } from "../auth";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://inventory-gf.onrender.com";

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!r.ok) {
        setError(t("errors.invalidCredentials"));
        setLoading(false);
        return;
      }

      const data = await r.json();
      setAuth(data.access_token, data.role);
      onLoggedIn?.();
    } catch (err) {
      setError("No fue posible conectarse con el servidor.");
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .df-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6f4f3;
          padding: 20px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .df-login-card {
          width: 100%;
          max-width: 430px;
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 28px;
          box-shadow: 0 18px 50px rgba(36, 24, 38, 0.10);
          text-align: center;
          border: 1px solid rgba(221, 221, 221, 0.7);
        }

        .df-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 18px;
        }

        .df-logo {
          width: 240px;
          max-width: 100%;
          height: auto;
          animation: dfFloat 3s ease-in-out infinite;
          transform-origin: center;
          filter: drop-shadow(0 10px 22px rgba(36, 24, 38, 0.08));
        }

        @keyframes dfFloat {
          0% { transform: translateY(0px) scale(1); opacity: 0.96; }
          50% { transform: translateY(-4px) scale(1.01); opacity: 1; }
          100% { transform: translateY(0px) scale(1); opacity: 0.96; }
        }

        .df-title {
          margin: 0 0 8px;
          color: #241826;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .df-subtitle {
          margin: 0 0 24px;
          color: rgba(36, 24, 38, 0.62);
          font-size: 14px;
          line-height: 1.5;
        }

        .df-form {
          display: grid;
          gap: 14px;
        }

        .df-field {
          text-align: left;
        }

        .df-label {
          display: block;
          margin-bottom: 6px;
          color: #241826;
          font-size: 14px;
          font-weight: 600;
        }

        .df-input {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #ddd;
          padding: 0 14px;
          font-size: 16px;
          color: #241826;
          background: #fff;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
        }

        .df-input:focus {
          border-color: #d58b7f;
          box-shadow: 0 0 0 4px rgba(213, 139, 127, 0.14);
          background: #fff;
        }

        .df-input:disabled {
          background: #f4f1f0;
          cursor: not-allowed;
        }

        .df-button {
          margin-top: 6px;
          height: 50px;
          border: none;
          border-radius: 12px;
          background: #d58b7f;
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 12px 28px rgba(213, 139, 127, 0.28);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .df-button:hover:not(:disabled) {
          background: #c97869;
          transform: translateY(-1px);
        }

        .df-button:disabled {
          cursor: not-allowed;
          opacity: 0.92;
        }

        .df-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.45);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: dfSpin 0.8s linear infinite;
        }

        @keyframes dfSpin {
          to { transform: rotate(360deg); }
        }

        .df-error {
          padding: 10px 12px;
          border-radius: 10px;
          background: #ffe5e5;
          color: #8a2f2f;
          font-size: 14px;
          text-align: left;
        }

        .df-tagline {
          margin-top: 24px;
          font-size: 12px;
          color: #d58b7f;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .df-login-page {
            align-items: flex-start;
            padding: 16px;
            padding-top: 36px;
          }

          .df-login-card {
            max-width: none;
            padding: 28px 20px;
            border-radius: 18px;
          }

          .df-logo {
            width: 200px;
          }

          .df-title {
            font-size: 24px;
          }

          .df-subtitle {
            font-size: 13px;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="df-login-page">
        <div className="df-login-card">
          <div className="df-logo-wrap">
            <img
              src="/dressflow_login_logo.png"
              alt="DressFlow"
              className="df-logo"
            />
          </div>

          <h1 className="df-title">{t("ui.loginTitle")}</h1>
          <p className="df-subtitle">
            Ingresá a tu espacio para gestionar vestidos, telas, cápsulas y ventas.
          </p>

          <form onSubmit={submit} className="df-form">
            <label className="df-field">
              <span className="df-label">{t("ui.username")}</span>
              <input
                className="df-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </label>

            <label className="df-field">
              <span className="df-label">{t("ui.password")}</span>
              <input
                className="df-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </label>

            <button className="df-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="df-spinner" />
                  <span>Ingresando...</span>
                </>
              ) : (
                t("ui.login")
              )}
            </button>

            {error && <div className="df-error">{error}</div>}
          </form>

          <div className="df-tagline">From Chaos to Flow</div>
        </div>
      </div>
    </>
  );
}
