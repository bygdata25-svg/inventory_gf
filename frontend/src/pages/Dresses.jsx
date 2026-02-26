// frontend/src/pages/Dresses.jsx
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";

export default function Dresses({ api, apiBase, role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    size: "",
    color: "",
    notes: ""
  });

  // Si no es null, estamos prestando y contiene los datos a enviar
  const [loanForm, setLoanForm] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.request(`${apiBase}/api/dresses`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.detail || "Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createDress(e) {
    e.preventDefault();
    try {
      await api.request(`${apiBase}/api/dresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          size: form.size || null,
          color: form.color || null,
          notes: form.notes || null
        })
      });
      setForm({ code: "", name: "", size: "", color: "", notes: "" });
      load();
    } catch (e) {
      alert(e?.detail || "Error creando vestido");
    }
  }

  async function createLoan(e) {
    e.preventDefault();
    try {
      await api.request(`${apiBase}/api/dress-loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanForm)
      });
      setLoanForm(null);
      load();
    } catch (e) {
      alert(e?.detail || "Error creando préstamo");
    }
  }

  function DressStatusBadge({ status }) {
    if (status === "AVAILABLE") return <Badge variant="green">{dressStatusLabel(status)}</Badge>;
    if (status === "LOANED") return <Badge variant="red">{dressStatusLabel(status)}</Badge>;
    if (status === "CLEANING") return <Badge variant="yellow">{dressStatusLabel(status)}</Badge>;
    return <Badge variant="default">{dressStatusLabel(status)}</Badge>;
  }

  return (
    <div>
      <h2>Vestidos</h2>

      {error && <div className="alert alert-error">{String(error)}</div>}

      {(role === "ADMIN" || role === "OPERATOR") && (
        <form onSubmit={createDress} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Código (único)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <input
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              placeholder="Talle"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />
            <input
              placeholder="Color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
            <input
              placeholder="Notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ minWidth: 240 }}
            />
            <button type="submit">Crear</button>
          </div>
        </form>
      )}

      {loading && <div>Cargando...</div>}

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Talle</th>
            <th>Color</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td>{d.code}</td>
              <td>{d.name}</td>
              <td>{d.size}</td>
              <td>{d.color}</td>
              <td>
                <DressStatusBadge status={d.status} />
              </td>
              <td>
                {d.status === "AVAILABLE" && (role === "ADMIN" || role === "OPERATOR") && (
                  <button
                    onClick={() =>
                      setLoanForm({
                        dress_id: d.id,
                        customer_name: "",
                        customer_dni: "",
                        customer_phone: "",
                        customer_email: "",
                        event_name: "",
                        loan_days: 3,
                        picked_up_by: "",
                        notes: ""
                      })
                    }
                  >
                    Prestar
                  </button>
                )}
              </td>
            </tr>
          ))}

          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ opacity: 0.7 }}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {loanForm && (
        <div style={{ marginTop: 18 }}>
          <h3>Nuevo préstamo</h3>

          <form onSubmit={createLoan}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                placeholder="Nombre cliente"
                required
                value={loanForm.customer_name || ""}
                onChange={(e) => setLoanForm({ ...loanForm, customer_name: e.target.value })}
              />

              <input
                placeholder="DNI"
                value={loanForm.customer_dni || ""}
                onChange={(e) => setLoanForm({ ...loanForm, customer_dni: e.target.value })}
              />

              <input
                placeholder="Teléfono"
                value={loanForm.customer_phone || ""}
                onChange={(e) => setLoanForm({ ...loanForm, customer_phone: e.target.value })}
              />

              <input
                placeholder="Email"
                value={loanForm.customer_email || ""}
                onChange={(e) => setLoanForm({ ...loanForm, customer_email: e.target.value })}
              />

              <input
                placeholder="Evento"
                value={loanForm.event_name || ""}
                onChange={(e) => setLoanForm({ ...loanForm, event_name: e.target.value })}
              />

              <input
                type="number"
                placeholder="Días"
                min={1}
                max={60}
                value={loanForm.loan_days || 3}
                onChange={(e) => setLoanForm({ ...loanForm, loan_days: Number(e.target.value) })}
                style={{ width: 110 }}
              />

              <input
                placeholder="Retira"
                value={loanForm.picked_up_by || ""}
                onChange={(e) => setLoanForm({ ...loanForm, picked_up_by: e.target.value })}
              />

              <input
                placeholder="Notas"
                value={loanForm.notes || ""}
                onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                style={{ minWidth: 240 }}
              />
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button type="submit">Confirmar</button>
              <button type="button" onClick={() => setLoanForm(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
