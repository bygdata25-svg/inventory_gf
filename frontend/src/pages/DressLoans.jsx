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
    } else if (filter && filter !== "ALL") {
      url = `${apiBase}/api/dress-loans?status=${filter}`;
    }

    try {
      const data = await api.request(url);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      let message = "Error cargando préstamos";

      if (typeof e?.detail === "string") {
        message = e.detail;
      } else if (Array.isArray(e?.detail)) {
        message = e.detail.map((x) => x?.msg || JSON.stringify(x)).join(" | ");
      } else if (e?.detail && typeof e.detail === "object") {
        message = JSON.stringify(e.detail, null, 2);
      } else if (typeof e?.message === "string") {
        message = e.message;
      }

      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      let message = "Error registrando devolución";

      if (typeof e?.detail === "string") {
        message = e.detail;
      } else if (Array.isArray(e?.detail)) {
        message = e.detail.map((x) => x?.msg || JSON.stringify(x)).join(" | ");
      } else if (e?.detail && typeof e.detail === "object") {
        message = JSON.stringify(e.detail, null, 2);
      } else if (typeof e?.message === "string") {
        message = e.message;
      }

      alert(message);
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
          type="button"
          onClick={() => setFilter("OPEN")}
        >
          Abiertos
        </button>

        <button
          className={`btn ${filter === "OVERDUE" ? "" : "btn-secondary"}`}
          type="button"
          onClick={() => setFilter("OVERDUE")}
        >
          Vencidos
        </button>

        <button
          className={`btn ${filter === "RETURNED" ? "" : "btn-secondary"}`}
          type="button"
          onClick={() => setFilter("RETURNED")}
        >
          Devueltos
        </button>

        <button
          className={`btn ${filter === "ALL" ? "" : "btn-secondary"}`}
          type="button"
          onClick={() => setFilter("ALL")}
        >
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
              <tr
                key={l.id}
                style={overdue ? { background: "rgba(220,38,38,0.06)" } : undefined}
              >
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
                      type="button"
                      onClick={() => returnLoan(l.id)}
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
