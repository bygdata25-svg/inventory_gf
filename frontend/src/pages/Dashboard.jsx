import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import { formatCurrency } from "../utils/currency";

export default function Dashboard({ api, apiBase }) {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const s = await api.request(`${apiBase}/api/dashboard/summary`);
      const a = await api.request(`${apiBase}/api/dashboard/alerts`);
      setSummary(s);
      setAlerts(a);
    } catch (e) {
      setError(e?.detail || "Error cargando dashboard");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(() => load().catch(() => {}), 60000);
    return () => clearInterval(id);
  }, []);

  if (error) return <div className="alert alert-error">{String(error)}</div>;
  if (!summary || !alerts) return <div>Cargando métricas...</div>;

  const hasOverdue = alerts.overdue_count > 0;
  const hasDueSoon = alerts.due_soon_count > 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPIs */}
      <div className="dashboard-grid">
        <Card title="Disponibles" value={summary.available} color="#10b981" />
        <Card title="Prestados" value={summary.loaned} color="#f59e0b" />
        <Card title="Vendidos" value={summary.sold} color="#ef4444" />
        <Card title="Ventas del mes" value={summary.sales_month} />
        <Card title="Facturación del mes" value={formatCurrency(summary.revenue_month)} />
        <Card title="Promedio por venta" value={formatCurrency(summary.avg_sale_month)} />
      </div>

      {/* Alertas visuales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <AlertCard
          title="Vencidos"
          count={alerts.overdue_count}
          variant={hasOverdue ? "red" : "default"}
          pulse={hasOverdue}
          subtitle={hasOverdue ? "Requiere acción" : "Sin vencidos"}
        >
          {alerts.overdue_top?.length ? (
            <AlertList items={alerts.overdue_top} kind="overdue" />
          ) : (
            <div style={{ opacity: 0.7 }}>Nada por aquí.</div>
          )}
        </AlertCard>

        <AlertCard
          title="Vencen pronto (48h)"
          count={alerts.due_soon_count}
          variant={hasDueSoon ? "yellow" : "default"}
          pulse={false}
          subtitle={hasDueSoon ? "Revisar devoluciones" : "Sin próximos vencimientos"}
        >
          {alerts.due_soon_top?.length ? (
            <AlertList items={alerts.due_soon_top} kind="soon" />
          ) : (
            <div style={{ opacity: 0.7 }}>Nada por aquí.</div>
          )}
        </AlertCard>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div className="dashboard-card" style={{ borderLeft: `6px solid ${color || "#2563eb"}` }}>
      <div className="dashboard-title">{title}</div>
      <div className="dashboard-value">{value}</div>
    </div>
  );
}

function AlertCard({ title, count, variant, pulse, subtitle, children }) {
  return (
    <div className="dashboard-card" style={{ borderLeft: "6px solid rgba(0,0,0,.12)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="dashboard-title">{title}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{subtitle}</div>
        </div>
        <Badge variant={variant} pulse={pulse}>
          {count}
        </Badge>
      </div>

      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function AlertList({ items, kind }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((x) => (
        <div
          key={x.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,.10)",
            background: kind === "overdue" ? "rgba(220,38,38,0.06)" : "rgba(245,158,11,0.08)"
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Vestido #{x.dress_id} — {x.customer_name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Vence: {new Date(x.due_at).toLocaleString()}
            </div>
          </div>
          <span style={{ fontSize: 12, opacity: 0.8 }}>#{x.id}</span>
        </div>
      ))}
    </div>
  );
}
