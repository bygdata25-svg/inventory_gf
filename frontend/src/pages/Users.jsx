import { useEffect, useState } from "react";
import { t } from "../i18n";

export default function Users({ api, apiBase, role }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("OPERATOR");

  const isAdmin = role === "ADMIN";

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function showApiError(e) {
    if (!e) return setError(t("ui.error"));

    const d = e.detail;
    const mk = d?.messageKey || d?.detail?.messageKey;
    const params = d?.params || d?.detail?.params || {};

    if (mk) return setError(t(mk, params));

    if (e.status === 403) return setError(t("ui.forbidden"));
    if (typeof d === "string") return setError(d);
    if (d?.detail && typeof d.detail === "string") return setError(d.detail);

    return setError(`${t("ui.error")} ${e.status || ""}`);
  }

  async function load() {
    const data = await api.request(`${apiBase}/api/auth/users`);
    setItems(Array.isArray(data) ? data : []);
  }

  async function refresh() {
    resetMessages();
    await load();
  }

  useEffect(() => {
    if (isAdmin) refresh().catch((e) => showApiError(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function createUser(e) {
    e.preventDefault();
    if (!isAdmin) return;

    resetMessages();

    if (!username.trim()) return setError(t("ui.validationRequired"));
    if (!password.trim()) return setError(t("ui.validationRequired"));

    try {
      await api.request(`${apiBase}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: newRole
        })
      });

      setInfo(t("ui.saved"));
      setUsername("");
      setPassword("");
      setNewRole("OPERATOR");
      await load();
    } catch (e) {
      showApiError(e);
    }
  }

  if (!isAdmin) {
    return (
      <div className="card">
        <h2 style={{ margin: 0 }}>{t("nav.users")}</h2>
        <div className="alert alert-error" style={{ marginTop: 12 }}>{t("ui.forbidden")}</div>
      </div>
    );
  }

  return (
    <>
      {/* Create */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("ui.createUser")}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.createUserHint")}</div>
          </div>

          <button className="btn" type="button" onClick={() => refresh().catch((e) => showApiError(e))}>
            {t("actions.refresh")}
          </button>
        </div>

        <form onSubmit={createUser} style={{ marginTop: 12 }}>
          <div className="grid grid-3">
            <label>
              <div className="label">{t("ui.username")}</div>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. operator1" />
            </label>

            <label>
              <div className="label">{t("ui.password")}</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <label>
              <div className="label">{t("ui.role")}</div>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="OPERATOR">OPERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>

            <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
              <button className="btn btn-primary" type="submit">
                {t("ui.create")}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
          {info && <div className="alert alert-success" style={{ marginTop: 12 }}>{info}</div>}
        </form>
      </div>

      {/* List */}
      <div className="card">
        <div>
          <h2 style={{ margin: 0 }}>{t("ui.listUsers")}</h2>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.listUsersHint")}</div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("ui.username")}</th>
                <th>{t("ui.role")}</th>
                <th>{t("fields.isActive")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><b>{u.username}</b></td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? "true" : "false"}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    {t("ui.noUsers")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

