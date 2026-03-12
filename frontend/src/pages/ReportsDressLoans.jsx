import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("es-AR");
  } catch {
    return value;
  }
}

function loanStatusVariant(status, dueAt, returnedAt) {
  if (returnedAt) return "green";
  if (status === "RETURNED") return "green";
  if (dueAt && new Date(dueAt) < new Date()) return "red";
  return "yellow";
}

function loanStatusLabel(status, dueAt, returnedAt) {
  if (returnedAt || status === "RETURNED") return "Devuelto";
  if (dueAt && new Date(dueAt) < new Date()) return "Vencido";
  return "Abierto";
}

export default function ReportsDressLoans({ api, apiBase }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await api.request(`${apiBase}/api/dress-loans`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      let message = "No se pudo cargar el reporte de préstamos";

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
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesCustomer =
        !customer ||
        String(row.customer_name || "").toLowerCase().includes(customer.trim().toLowerCase());

      const computedStatus = row.returned_at
        ? "RETURNED"
        : row.due_at && new Date(row.due_at) < new Date()
          ? "OVERDUE"
          : "OPEN";

      const matchesStatus = !statusFilter || computedStatus === statusFilter;

      return matchesCustomer && matchesStatus;
    });
  }, [rows, customer, statusFilter]);

  const summary = useMemo(() => {
    let open = 0;
    let overdue = 0;
    let returned = 0;

    for (const row of rows) {
      if (row.returned_at || row.status === "RETURNED") {
        returned += 1;
      } else if (row.due_at && new Date(row.due_at) < new Date()) {
        overdue += 1;
      } else {
        open += 1;
      }
    }

    return { open, overdue, returned, total: rows.length };
  }, [rows]);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Reporte de Préstamos</div>
            <div className="page-sub">
              Seguimiento de préstamos abiertos, vencidos y devueltos.
            </div>
          </div>

          <button className="btn" type="button" onClick={() => load().catch(() => {})}>
            Actualizar
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-3">
        <SummaryCard title="Total" value={summary.total} subtitle="Préstamos registrados" />
        <SummaryCard title="Abiertos" value={summary.open} subtitle="Aún no devueltos" />
        <SummaryCard title="Vencidos" value={summary.overdue} subtitle="Requieren seguimiento" />
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "end"
          }}
        >
          <label style={{ minWidth: 260 }}>
            <div className="label">Cliente</div>
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Buscar por cliente"
            />
          </label>

          <label style={{ minWidth: 220 }}>
            <div className="label">Estado</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="OPEN">Abiertos</option>
              <option value="OVERDUE">Vencidos</option>
              <option value="RETURNED">Devueltos</option>
            </select>
          </label>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vestido</th>
                <th>Cliente</th>
                <th>Evento</th>
                <th>Entregado</th>
                <th>Vence</th>
                <th>Devuelto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>#{row.dress_id}</td>
                  <td>{row.customer_name || "-"}</td>
                  <td>{row.event_name || "-"}</td>
                  <td>{formatDate(row.delivered_at)}</td>
                  <td>{formatDate(row.due_at)}</td>
                  <td>{formatDate(row.returned_at)}</td>
                  <td>
                    <Badge variant={loanStatusVariant(row.status, row.due_at, row.returned_at)}>
                      {loanStatusLabel(row.status, row.due_at, row.returned_at)}
                    </Badge>
                  </td>
                </tr>
              ))}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ opacity: 0.7 }}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="card">
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{subtitle}</div>
    </div>
  );
}
