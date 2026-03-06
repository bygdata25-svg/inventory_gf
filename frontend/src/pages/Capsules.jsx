// frontend/src/pages/Capsules.jsx
import { useEffect, useState } from "react";

export default function Capsules({ api, apiBase, role }) {
  const canEdit = role === "ADMIN" || role === "OPERATOR";

  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadItems() {
    setLoading(true);
    setMsg("");
    try {
      const data = await api.request(`${apiBase}/api/capsules`);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading capsules", err);
      setItems([]);
      setMsg("No se pudieron cargar las cápsulas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canEdit) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setMsg("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      await api.request(`${apiBase}/api/capsules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName })
      });

      setName("");
      setMsg("Cápsula creada correctamente");
      await loadItems();
    } catch (err) {
      console.error("Error saving capsule", err);
      setMsg(err?.detail || "No se pudo guardar la cápsula");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Cápsulas</h2>

      {msg && <div className="alert alert-warn">{msg}</div>}

      {canEdit && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Nombre de la cápsula"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Crear"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div>Cargando...</div>
      ) : items.length === 0 ? (
        <div>No hay cápsulas cargadas.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
