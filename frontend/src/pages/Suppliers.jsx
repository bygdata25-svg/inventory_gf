import { useEffect, useState } from "react";
import { t } from "../i18n";

export default function Suppliers({ api, apiBase, role }) {
  const isAdmin = role === "ADMIN";

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

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
    const data = await api.request(`${apiBase}/api/suppliers`);
    setItems(Array.isArray(data) ? data : []);
  }

  async function refresh() {
    resetMessages();
    await load();
  }

  useEffect(() => {
    refresh().catch((e) => showApiError(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSupplier(e) {
    e.preventDefault();
    if (!isAdmin) return;

    resetMessages();

    if (!name.trim()) {
      setError(t("ui.validationRequired"));
      return;
    }

    try {
      await api.request(`${apiBase}/api/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() ? phone.trim() : null,
          email: email.trim() ? email.trim() : null,
          notes: notes.trim() ? notes.trim() : null,
          is_active: isActive
        })
      });

      setInfo(t("ui.saved"));
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setIsActive(true);

      await load();
    } catch (e2) {
      showApiError(e2);
    }
  }

  async function deleteSupplier(id) {
    if (!isAdmin) return;

    resetMessages();
    const ok = window.confirm(`${t("ui.confirmDelete")} #${id}?`);
    if (!ok) return;

    try {
      await api.request(`${apiBase}/api/suppliers/${id}`, { method: "DELETE" });
      setInfo(t("ui.deleted"));
      await load();
    } catch (e) {
      showApiError(e);
    }
  }

  return (
    <>
      {/* Create */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("ui.createSupplier")}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.createSupplierHint")}</div>
          </div>

          <button className="btn" type="button" onClick={() => refresh().catch((e) => showApiError(e))}>
            {t("actions.refresh")}
          </button>
        </div>

        {!isAdmin && (
          <div className="alert alert-warn" style={{ marginTop: 12 }}>
            {t("ui.adminActionsHidden")}
          </div>
        )}

        <form onSubmit={createSupplier} style={{ marginTop: 12 }}>
          <div className="grid grid-3">
            <label>
              <div className="label">{t("fields.name")}</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Textiles SA" />
            </label>

            <label>
              <div className="label">{t("fields.phone")}</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +54 11 ..." />
            </label>

            <label>
              <div className="label">{t("fields.email")}</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. sales@..." />
            </label>

            <label style={{ gridColumn: "span 2" }}>
              <div className="label">{t("fields.notes")}</div>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("ui.optional")} />
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "end" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{t("fields.isActive")}</span>
              </div>
            </label>

            <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
              <button className="btn btn-primary" type="submit" disabled={!isAdmin}>
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
          <h2 style={{ margin: 0 }}>{t("ui.listSuppliers")}</h2>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.listSuppliersHint")}</div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("fields.name")}</th>
                <th>{t("fields.phone")}</th>
                <th>{t("fields.email")}</th>
                <th>{t("fields.isActive")}</th>
                {isAdmin && <th>{t("ui.actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td><b>{s.name}</b></td>
                  <td>{s.phone || "-"}</td>
                  <td>{s.email || "-"}</td>
                  <td>{s.is_active ? "true" : "false"}</td>
                  {isAdmin && (
                    <td className="actions">
                      <button className="btn btn-danger" type="button" onClick={() => deleteSupplier(s.id)}>
                        {t("actions.delete")}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ color: "var(--muted)" }}>
                    {t("ui.noSuppliers")}
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

