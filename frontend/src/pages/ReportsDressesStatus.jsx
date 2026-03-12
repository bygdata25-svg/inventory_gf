import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";

function statusVariant(status) {
  switch (status) {
    case "AVAILABLE":
      return "green";
    case "LOANED":
      return "red";
    case "CLEANING":
      return "yellow";
    case "MAINTENANCE":
      return "orange";
    case "SOLD":
      return "blue";
    default:
      return "default";
  }
}

const STATUS_ORDER = [
  "AVAILABLE",
  "LOANED",
  "CLEANING",
  "MAINTENANCE",
  "SOLD",
  "RETIRED"
];

export default function ReportsDressesStatus({ api, apiBase }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
  setLoading(true);
  setError("");

  try {
    const data = await api.request(`${apiBase}/api/dresses?page=1&page_size=100`);
    setItems(Array.isArray(data?.items) ? data.items : []);
  } catch (e) {
    let message = "No se pudo cargar el reporte de vestidos";

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
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(() => {
    const base = {
      AVAILABLE: 0,
      LOANED: 0,
      CLEANING: 0,
      MAINTENANCE: 0,
      SOLD: 0,
      RETIRED: 0
    };

    for (const item of items) {
      const key = item.status || "RETIRED";
      if (key in base) {
        base[key] += 1;
      }
    }

    return base;
  }, [items]);

  const total = items.length;

  const rows = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      label: dressStatusLabel(status),
      count: summary[status] || 0,
      percent: total > 0 ? Math.round(((summary[status] || 0) / total) * 100) : 0
    }));
  }, [summary, total]);

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
            <div style={{ fontWeight: 800, fontSize: 18 }}>Reporte de Estado de Vestidos</div>
            <div className="page-sub">
              Distribución actual del inventario por estado operativo.
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
        <StatusCard title="Total vestidos" value={total} subtitle="Inventario total cargado" />
        <StatusCard
          title="Disponibles"
          value={summary.AVAILABLE}
          subtitle="Listos para préstamo o venta"
        />
        <StatusCard
          title="No disponibles"
          value={
            (summary.LOANED || 0) +
            (summary.CLEANING || 0) +
            (summary.MAINTENANCE || 0)
          }
          subtitle="Prestados, limpieza o taller"
        />
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
          Resumen por estado
        </div>

        <div className="grid grid-3">
          {rows.map((row) => (
            <div key={row.status} className="dress-status-box">
              <div className="dress-status-box-top">
                <Badge variant={statusVariant(row.status)}>{row.label}</Badge>
                <strong>{row.count}</strong>
              </div>

              <div className="dress-status-box-sub">{row.percent}% del inventario</div>

              <div className="dress-status-bar">
                <div
                  className="dress-status-bar-fill"
                  style={{ width: `${row.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
          Detalle por estado
        </div>

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
                <th>% del total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.status}>
                  <td>
                    <Badge variant={statusVariant(row.status)}>{row.label}</Badge>
                  </td>
                  <td>{row.count}</td>
                  <td>{row.percent}%</td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ opacity: 0.7 }}>
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dress-status-box{
          border: 1px solid rgba(17,17,17,.08);
          border-radius: 16px;
          padding: 14px;
          background: rgba(255,255,255,.72);
        }

        .dress-status-box-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }

        .dress-status-box-sub{
          margin-top: 10px;
          font-size: 13px;
          color: var(--muted);
        }

        .dress-status-bar{
          width:100%;
          height:8px;
          border-radius:999px;
          background: rgba(17,17,17,.08);
          margin-top:10px;
          overflow:hidden;
        }

        .dress-status-bar-fill{
          height:100%;
          border-radius:999px;
          background: var(--primary);
        }
      `}</style>
    </div>
  );
}

function StatusCard({ title, value, subtitle }) {
  return (
    <div className="card">
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{subtitle}</div>
    </div>
  );
}
