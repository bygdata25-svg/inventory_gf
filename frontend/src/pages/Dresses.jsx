import { useEffect, useState } from "react";

export default function Dresses({ api, apiBase, role }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    size: "",
    color: ""
  });

  const [loanForm, setLoanForm] = useState(null); // si no es null, estamos prestando

  async function load() {
    setLoading(true);
    try {
      const data = await api.request(`${apiBase}/api/dresses`);
      setItems(data);
    } catch (e) {
      setError(e.detail || "Error");
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
        body: JSON.stringify(form)
      });
      setForm({ code: "", name: "", size: "", color: "" });
      load();
    } catch (e) {
      alert(e.detail || "Error creando vestido");
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
      alert(e.detail || "Error creando préstamo");
    }
  }

  return (
    <div>
      <h2>Vestidos</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={createDress} style={{ marginBottom: 20 }}>
        <input
          placeholder="Código"
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
        <button type="submit">Crear</button>
      </form>

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
              <td>{d.status}</td>
              <td>
                {d.status === "AVAILABLE" && (
                  <button
                    onClick={() =>
                      setLoanForm({
                        dress_id: d.id,
                        customer_name: "",
                        loan_days: 3
                      })
                    }
                  >
                    Prestar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loanForm && (
        <div style={{ marginTop: 20 }}>
          <h3>Nuevo préstamo</h3>
          <form onSubmit={createLoan}>
            <input
              placeholder="Nombre cliente"
              required
              onChange={(e) =>
                setLoanForm({ ...loanForm, customer_name: e.target.value })
              }
            />
            <input
              placeholder="DNI"
              onChange={(e) =>
                setLoanForm({ ...loanForm, customer_dni: e.target.value })
              }
            />
            <input
              placeholder="Teléfono"
              onChange={(e) =>
                setLoanForm({ ...loanForm, customer_phone: e.target.value })
              }
            />
            <input
              placeholder="Email"
              onChange={(e) =>
                setLoanForm({ ...loanForm, customer_email: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Días"
              defaultValue={3}
              onChange={(e) =>
                setLoanForm({ ...loanForm, loan_days: Number(e.target.value) })
              }
            />
            <button type="submit">Confirmar</button>
            <button type="button" onClick={() => setLoanForm(null)}>
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
