// frontend/src/pages/DressLoans.jsx
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import { isOverdue, loanStatusLabel } from "../utils/status";

export default function DressLoans({ api, apiBase }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    let url = `${apiBase}/api/dress-loans`;

    if (filter === "OVERDUE") {
      url = `${apiBase}/api/dress-loans?overdue=true`;
    } else if (filter !== "ALL") {
      url = `${apiBase}/api/dress-loans?status=${filter}`;
    }

    try {
      const data = await api.request(url);
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
  }, [filter]);

  async function returnLoan(id) {
    const returned_by = prompt("Nombre de quien devuelve:");
    if (!returned_by) return;

    try {
      await api.request(`${apiBase}/api/dress-loans/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returned_by })
      });
      load();
    } catch (e) {
      alert(e?.detail || "Error registrando devolución");
    }
  }

  function StatusBadge({ loan }) {
    const overdue = isOverdue(loan);

    if (overdue) {
      return (
        <Badge variant="red" pulse>
          {loanStatusLabel(loan)}
        </Badge>
      );
    }
    if (loan.status === "RETURNED") {
      return <Badge variant="green">{loanStatusLabel(loan)}</Badge>;
    }
    if (loan.status === "CANCELLED") {
      return <Badge variant="yellow">{loanStatusLabel(loan)}</Badge>;
    }
    return <Badge variant="default">{loanStatusLabel(loan)}</Badge>;
  }

  return (
    <div>
      <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button 
           className={`btn ${filter === "OPEN" ? "" : "btn-secondary"}`}
           onClick={() => setFilter("OPEN")}
         > 
           Abiertos
        </button>
        <button className="btn btn-secondary" onClick={() => setFilter("OVERDUE")}>
           Vencidos
        </button>
        <button className="btn btn-secondary" onClick={() => setFilter("RETURNED")}>
           Devueltos
        </button>
        <button className="btn btn-secondary" onClick={() => setFilter("")}>
           Todos
        </button>
      </div>

      {error && <div className="alert alert-error">{String(error)}</div>}
      {loading && <div>Cargando...</div>}

      <table>
        <thead>
          <tr>
            <th>Vestido</th>
            <th>Cliente</th>
            <th>Entrega</th>
            <th>Vencimiento</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => {
            const overdue = isOverdue(l);
            return (
              <tr key={l.id} style={overdue ? { background: "rgba(220,38,38,0.06)" } : undefined}>
                <td>{l.dress_id}</td>
                <td>{l.customer_name}</td>
                <td>{new Date(l.delivered_at).toLocaleDateString()}</td>
                <td>{new Date(l.due_at).toLocaleDateString()}</td>
                <td>
                  <StatusBadge loan={l} />
                </td>
                <td>
                  {l.status === "OPEN" && (
                    <button  
                     className="btn"
                     onClick={() => markReturned(row.id)}
                     >
                       Registrar devolución 
                   </button>
                  )}
                </td>
              </tr>
            );
          })}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ opacity: 0.7 }}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
