// frontend/src/pages/Suppliers.jsx
import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";

export default function Suppliers({ api, apiBase, role }) {
  const canEdit = role === "ADMIN" || role === "OPERATOR";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: ""
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      // Si tu backend soporta query, podés cambiar a: `${apiBase}/api/suppliers?q=${encodeURIComponent(q)}`
      const data = await api.request(`${apiBase}/api/suppliers`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.detail || t("ui.error"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((s) => {
      const hay = [
        s.name,
        s.phone,
        s.email,
        s.address,
        s.notes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  async function createSupplier(e) {
    e.preventDefault();
    if (!canEdit) return;

    // Validación mínima extra (el backend valida EmailStr)
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Email inválido");
      return;
    }

    try {
      await api.request(`${apiBase}/api/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,     // ✅ sin formato estricto
          email: form.email || null,     // ✅ type=email + backend EmailStr
          address: form.address || null, // ✅ nuevo
          notes: form.notes || null
        })
      });

      setForm({ name: "", phone: "", email: "", address: "", notes: "" });
      await load();
    } catch (e) {
      // Si tu backend devuelve {detail: "..."} o un objeto, esto lo muestra
      setError(
        typeof e?.detail === "string"
          ? e.detail
          : (e?.detail?.detail || JSON.stringify(e?.detail || e))
      );
    }
  }

  async function deleteSupplier(id) {
    if (!canEdit) return;
    if (!confirm(t("ui.confirmDelete") || "¿Confirmar eliminación?")) return;

    try {
      await api.request(`${apiBase}/api/suppliers/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e?.detail || t("ui.error"));
    }
  }

  return (
    <div>
      <h2>{t("ui.listSuppliers") || t("nav.suppliers")}</h2>
      <div style={{ opacity: 0.75, marginBottom: 12 }}>
        {t("ui.listSuppliersHint") || "Listado de proveedores disponibles."}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {String(error)}
        </div>
      )}

      {canEdit && (
        <form onSubmit={createSupplier} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder={t("fields.name") || "Nombre"}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {/* ✅ Teléfono sin formato estricto */}
            <input
              placeholder={t("fields.phone") || "Teléfono"}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            {/* ✅ Email con formato en UI */}
            <input
              type="email"
              placeholder={t("fields.email") || "Email"}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {/* ✅ Nuevo: domicilio */}
            <input
              placeholder="Domicilio"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={{ minWidth: 220 }}
            />

            <input
              placeholder={t("fields.notes") || "Notas"}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ minWidth: 220 }}
            />

            <button type="submit">{t("actions.create") || "Crear"}</button>
            <button type="button" onClick={load}>
              {t("actions.refresh") || "Actualizar"}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <input
          placeholder={t("ui.searchHint") || "Buscar..."}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <button type="button" onClick={() => setQ("")}>
          {t("actions.clear") || "Limpiar"}
        </button>
      </div>

      {loading && <div>Cargando...</div>}

      <table>
        <thead>
          <tr>
            <th>{t("fields.name") || "Nombre"}</th>
            <th>{t("fields.phone") || "Teléfono"}</th>
            <th>{t("fields.email") || "Email"}</th>
            <th>Domicilio</th>
            <th>{t("fields.notes") || "Notas"}</th>
            <th style={{ width: 120 }}>{t("ui.actions") || "Acciones"}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.phone || "—"}</td>
              <td>{s.email || "—"}</td>
              <td>{s.address || "—"}</td>
              <td style={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.notes || "—"}
              </td>
              <td>
                {canEdit ? (
                  <button type="button" onClick={() => deleteSupplier(s.id)}>
                    {t("actions.delete") || "Eliminar"}
                  </button>
                ) : (
                  <span style={{ opacity: 0.7 }}>{t("ui.forbidden") || "Sin permisos"}</span>
                )}
              </td>
            </tr>
          ))}

          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={6} style={{ opacity: 0.7 }}>
                {t("ui.noSuppliers") || "Todavía no hay proveedores."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!canEdit && (
        <div style={{ marginTop: 12, opacity: 0.75 }}>
          {t("ui.adminActionsHidden") || "Algunas acciones solo están disponibles para administradores"}
        </div>
      )}
    </div>
  );
}
