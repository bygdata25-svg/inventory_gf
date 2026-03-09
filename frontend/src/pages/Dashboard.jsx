import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { formatCurrency } from "../utils/currency";

export default function Dashboard({ api, apiBase, username }) {
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

  const inventoryData = useMemo(() => {
    if (!summary) return [];
    const available = Number(summary.available || 0);
    const loaned = Number(summary.loaned || 0);
    const maintenance = Number(summary.maintenance || 0);
    const total = available + loaned + maintenance;

    return [
      {
        label: "Disponibles",
        value: available,
        percent: total > 0 ? Math.round((available / total) * 100) : 0,
        color: "#E79A8A"
      },
      {
        label: "Préstamos",
        value: loaned,
        percent: total > 0 ? Math.round((loaned / total) * 100) : 0,
        color: "#B65D5A"
      },
      {
        label: "Mantenimiento",
        value: maintenance,
        percent: total > 0 ? Math.round((maintenance / total) * 100) : 0,
        color: "#9A7A92"
      }
    ];
  }, [summary]);

  const recentActivity = useMemo(() => {
    if (!alerts) return [];

    const overdue = (alerts.overdue_top || []).map((x) => ({
      id: `overdue-${x.id}`,
      title: `Préstamo vencido`,
      subtitle: `${x.customer_name} · Vestido #${x.dress_id}`,
      when: new Date(x.due_at).toLocaleString("es-AR"),
      tone: "red"
    }));

    const dueSoon = (alerts.due_soon_top || []).map((x) => ({
      id: `soon-${x.id}`,
      title: `Próximo vencimiento`,
      subtitle: `${x.customer_name} · Vestido #${x.dress_id}`,
      when: new Date(x.due_at).toLocaleString("es-AR"),
      tone: "yellow"
    }));

    return [...overdue, ...dueSoon].slice(0, 6);
  }, [alerts]);

  if (error) return <div className="alert alert-error">{String(error)}</div>;
  if (!summary || !alerts) return <div>Cargando métricas...</div>;

  return (
    <div className="df-dashboard">
      <div className="df-hero">
        <div>
          <div className="df-hello">Hola, {username || "Usuario"} 👋</div>
          <div className="df-subtitle">Resumen de tu inventario</div>
        </div>


      <div className="df-kpi-grid">
        <DashboardKpiCard
          title="Vestidos"
          value={summary.available + summary.loaned + summary.sold + (summary.maintenance || 0)}
          subtitle={`${summary.available} disponibles`}
          icon="D"
	/>
	<DashboardKpiCard
	  title="Préstamos"
	  value={summary.loaned}
	  subtitle="Activos"
	  icon="P"
	/>
	<DashboardKpiCard
	  title="Ventas del mes"
	  value={summary.sales_month}
	  subtitle={formatCurrency(summary.revenue_month)}
	  icon="V"
	/>

	<DashboardKpiCard
	  title="Promedio por venta"
	  value={formatCurrency(summary.avg_sale_month)}
	  subtitle="Ticket promedio"
	  icon="$"
	/>
      </div>

      <div className="df-main-grid">
        <div className="card df-panel">
          <div className="df-panel-title">Actividad reciente</div>
          <div className="df-panel-sub">Últimos eventos del sistema</div>

          <div className="df-activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="df-activity-item">
                  <div className={`df-activity-dot ${item.tone}`} />
                  <div className="df-activity-body">
                    <div className="df-activity-title">{item.title}</div>
                    <div className="df-activity-subtitle">{item.subtitle}</div>
                  </div>
                  <div className="df-activity-time">{item.when}</div>
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.7 }}>Todavía no hay actividad reciente.</div>
            )}
          </div>
        </div>

        <div className="card df-panel">
          <div className="df-panel-title">Estado del inventario</div>
          <div className="df-panel-sub">Distribución actual de vestidos</div>

          <div className="df-inventory-wrap">
            <div className="df-donut">
              <DonutChart data={inventoryData} />
            </div>

            <div className="df-legend">
              {inventoryData.map((item) => (
                <div key={item.label} className="df-legend-row">
                  <div className="df-legend-left">
                    <span
                      className="df-legend-color"
                      style={{ background: item.color }}
                    />
                    <span>{item.label}</span>
                  </div>
                  <strong>{item.percent}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="df-bottom-grid">
        <div className="card df-panel">
          <div className="df-panel-title">Alertas</div>
          <div className="df-panel-sub">Revisá devoluciones y vencimientos</div>

          <div className="df-alert-grid">
            <MiniAlertCard
              title="Vencidos"
              count={alerts.overdue_count}
              variant={alerts.overdue_count > 0 ? "red" : "default"}
              subtitle={alerts.overdue_count > 0 ? "Requiere acción" : "Sin vencidos"}
            />

            <MiniAlertCard
              title="Vencen pronto"
              count={alerts.due_soon_count}
              variant={alerts.due_soon_count > 0 ? "yellow" : "default"}
              subtitle={alerts.due_soon_count > 0 ? "Próximas 48h" : "Sin próximos vencimientos"}
            />
          </div>
        </div>

        <div className="card df-panel">
          <div className="df-panel-title">Resumen comercial</div>
          <div className="df-panel-sub">Indicadores del período actual</div>

          <div className="df-summary-list">
            <SummaryRow label="Vendidos" value={summary.sold} />
            <SummaryRow label="Ventas del mes" value={summary.sales_month} />
            <SummaryRow label="Facturación" value={formatCurrency(summary.revenue_month)} />
            <SummaryRow label="Promedio por venta" value={formatCurrency(summary.avg_sale_month)} />
          </div>
        </div>
      </div>

      <style>{`
        .df-dashboard{
          display:grid;
          gap:18px;
        }

        .df-hero{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          flex-wrap:wrap;
        }

        .df-hello{
          font-size: 26px;
          font-weight: 800;
          color: #20192A;
        }

        .df-subtitle{
          margin-top: 4px;
          font-size: 15px;
          color: rgba(17,17,17,.68);
        }

        .df-kpi-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap:16px;
        }

        .df-kpi-card{
          background: rgba(255,255,255,.74);
          border-radius: 24px;
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: 0 10px 24px rgba(17,17,17,.06);
          padding: 20px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
        }

        .df-kpi-title{
          font-size: 15px;
          font-weight: 700;
          color: #21192A;
        }

        .df-kpi-value{
          font-size: 34px;
          font-weight: 800;
          margin-top: 6px;
          color: #20192A;
          line-height: 1.1;
        }

        .df-kpi-sub{
          margin-top: 4px;
          color: rgba(17,17,17,.65);
          font-size: 14px;
        }

	.df-kpi-icon{
	  width:72px;
	  height:72px;
	  border-radius: 999px;
	  display:flex;
	  align-items:center;
	  justify-content:center;
	  background: rgba(231,154,138,.14);
	  font-size: 28px;
	  font-weight: 700;
	  color: #7F4C58;
	  flex: 0 0 72px;
	}
        .df-main-grid{
          display:grid;
          grid-template-columns: 1.1fr .9fr;
          gap:16px;
        }

        .df-bottom-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:16px;
        }

        .df-panel{
          border-radius: 26px;
          padding: 20px;
          background: rgba(255,255,255,.76);
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: 0 10px 24px rgba(17,17,17,.06);
        }

        .df-panel-title{
          font-size: 18px;
          font-weight: 800;
          color: #20192A;
        }

        .df-panel-sub{
          font-size: 14px;
          color: rgba(17,17,17,.58);
          margin-top: 4px;
          margin-bottom: 14px;
        }

        .df-activity-list{
          display:grid;
          gap:10px;
        }

        .df-activity-item{
          display:grid;
          grid-template-columns: 12px 1fr auto;
          gap:12px;
          align-items:center;
          padding: 12px 10px;
          border-radius: 16px;
          background: rgba(255,255,255,.56);
          border: 1px solid rgba(17,17,17,.05);
        }

        .df-activity-dot{
          width: 12px;
          height: 12px;
          border-radius: 999px;
        }

        .df-activity-dot.red{ background:#D78686; }
        .df-activity-dot.yellow{ background:#D9B07A; }

        .df-activity-title{
          font-weight: 700;
          color:#241C2C;
        }

        .df-activity-subtitle{
          font-size: 13px;
          color: rgba(17,17,17,.62);
          margin-top: 2px;
        }

        .df-activity-time{
          font-size: 13px;
          color: rgba(17,17,17,.58);
          white-space: nowrap;
        }

        .df-inventory-wrap{
          display:grid;
          grid-template-columns: 220px 1fr;
          gap:20px;
          align-items:center;
        }

        .df-donut{
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .df-legend{
          display:grid;
          gap:14px;
        }

        .df-legend-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          font-size:16px;
          color:#241C2C;
        }

        .df-legend-left{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .df-legend-color{
          width:16px;
          height:16px;
          border-radius:999px;
          display:inline-block;
        }

        .df-alert-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:12px;
        }

        .df-mini-alert{
          border-radius: 18px;
          padding: 16px;
          border: 1px solid rgba(17,17,17,.06);
          background: rgba(255,255,255,.64);
        }

        .df-mini-alert-title{
          font-size: 14px;
          font-weight: 700;
          color:#241C2C;
        }

        .df-mini-alert-sub{
          font-size: 13px;
          color: rgba(17,17,17,.6);
          margin-top: 4px;
        }

        .df-mini-alert-top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
        }

        .df-summary-list{
          display:grid;
          gap:12px;
        }

        .df-summary-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(17,17,17,.06);
        }

        .df-summary-row:last-child{
          border-bottom:none;
        }

        .df-summary-label{
          color: rgba(17,17,17,.68);
        }

        .df-summary-value{
          font-weight: 800;
          color:#20192A;
        }

        @media (max-width: 1200px){
          .df-kpi-grid{
            grid-template-columns: repeat(2, minmax(0,1fr));
          }
          .df-main-grid,
          .df-bottom-grid{
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px){
          .df-search{
            min-width: 100%;
            width: 100%;
          }
          .df-search-wrap{
            width: 100%;
          }
          .df-kpi-grid{
            grid-template-columns: 1fr;
          }
          .df-inventory-wrap{
            grid-template-columns: 1fr;
          }
          .df-alert-grid{
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function DashboardKpiCard({ title, value, subtitle, icon }) {
  return (
    <div className="df-kpi-card">
      <div>
        <div className="df-kpi-title">{title}</div>
        <div className="df-kpi-value">{value}</div>
        <div className="df-kpi-sub">{subtitle}</div>
      </div>
      <div className="df-kpi-icon">{icon}</div>
    </div>
  );
}

function MiniAlertCard({ title, count, subtitle, variant }) {
  return (
    <div className="df-mini-alert">
      <div className="df-mini-alert-top">
        <div>
          <div className="df-mini-alert-title">{title}</div>
          <div className="df-mini-alert-sub">{subtitle}</div>
        </div>
        <Badge variant={variant}>{count}</Badge>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="df-summary-row">
      <div className="df-summary-label">{label}</div>
      <div className="df-summary-value">{value}</div>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (!total) {
    return (
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="34" />
      </svg>
    );
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      <g transform="rotate(-90 110 110)">
        {data.map((item) => {
          const fraction = item.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const strokeDasharray = `${dash} ${gap}`;
          const strokeDashoffset = -offsetAccumulator;
          offsetAccumulator += dash;

          return (
            <circle
              key={item.label}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="34"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </g>

      <circle cx="110" cy="110" r="42" fill="#F7F3EE" />
    </svg>
  );
}
