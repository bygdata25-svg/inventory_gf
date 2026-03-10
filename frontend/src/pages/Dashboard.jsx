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

  const available = Number(summary?.available || 0);
  const loaned = Number(summary?.loaned || 0);
  const sold = Number(summary?.sold || 0);
  const maintenance = Number(summary?.maintenance || 0);
  const salesMonth = Number(summary?.sales_month || 0);
  const revenueMonth = Number(summary?.revenue_month || 0);
  const avgSaleMonth = Number(summary?.avg_sale_month || 0);

  const totalDresses = available + loaned + sold + maintenance;
  const operationalTotal = available + loaned + maintenance;

  const inventoryData = useMemo(() => {
    const total = operationalTotal;
    return [
      {
        label: "Disponibles",
        value: available,
        percent: total > 0 ? Math.round((available / total) * 100) : 0,
        color: "#E39A8C"
      },
      {
        label: "Préstamos",
        value: loaned,
        percent: total > 0 ? Math.round((loaned / total) * 100) : 0,
        color: "#B76462"
      },
      {
        label: "Taller",
        value: maintenance,
        percent: total > 0 ? Math.round((maintenance / total) * 100) : 0,
        color: "#8D7A92"
      }
    ];
  }, [available, loaned, maintenance, operationalTotal]);

  const recentActivity = useMemo(() => {
    if (!alerts) return [];

    const overdue = (alerts.overdue_top || []).map((x) => ({
      id: `overdue-${x.id}`,
      title: "Préstamo vencido",
      subtitle: `${x.customer_name} · Vestido #${x.dress_id}`,
      when: new Date(x.due_at).toLocaleString("es-AR"),
      tone: "red"
    }));

    const dueSoon = (alerts.due_soon_top || []).map((x) => ({
      id: `soon-${x.id}`,
      title: "Vence pronto",
      subtitle: `${x.customer_name} · Vestido #${x.dress_id}`,
      when: new Date(x.due_at).toLocaleString("es-AR"),
      tone: "amber"
    }));

    return [...overdue, ...dueSoon].slice(0, 6);
  }, [alerts]);

  if (error) return <div className="alert alert-error">{String(error)}</div>;
  if (!summary || !alerts) return <div>Cargando métricas...</div>;

  return (
    <div className="df-dashboard">
      <section className="df-hero">
        <div className="df-hero-chip">
          <span className="df-hero-chip-dot" />
          Actualización automática
        </div>
      </section>

      <section className="df-kpi-grid">
        <DashboardKpiCard
          title="Vestidos"
          value={totalDresses}
          subtitle={`${available} disponibles`}
          icon={<IconDress />}
          tone="rose"
        />

        <DashboardKpiCard
          title="Préstamos"
          value={loaned}
          subtitle="Activos"
          icon={<IconLoan />}
          tone="plum"
        />

        <DashboardKpiCard
          title="Ventas del mes"
          value={salesMonth}
          subtitle={formatCurrency(revenueMonth)}
          icon={<IconSales />}
          tone="gold"
        />

        <DashboardKpiCard
          title="Promedio por venta"
          value={formatCurrency(avgSaleMonth)}
          subtitle="Ticket promedio"
          icon={<IconRevenue />}
          tone="graphite"
        />
      </section>

      <section className="df-main-grid">
        <div className="df-panel df-panel-large">
          <div className="df-panel-header">
            <div>
              <div className="df-panel-title">Actividad reciente</div>
              <div className="df-panel-sub">Eventos relevantes del sistema</div>
            </div>
          </div>

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
              <div className="df-empty">Todavía no hay actividad reciente.</div>
            )}
          </div>
        </div>

        <div className="df-panel">
          <div className="df-panel-header">
            <div>
              <div className="df-panel-title">Estado del inventario</div>
              <div className="df-panel-sub">Vestidos operativos actuales</div>
            </div>
          </div>

          <div className="df-inventory-wrap">
            <div className="df-donut">
              <DonutChart data={inventoryData} total={operationalTotal} />
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
                  <div className="df-legend-right">
                    <strong>{item.value}</strong>
                    <span>{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="df-bottom-grid">
        <div className="df-panel">
          <div className="df-panel-header">
            <div>
              <div className="df-panel-title">Alertas</div>
              <div className="df-panel-sub">Seguimiento de devoluciones</div>
            </div>
          </div>

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
              subtitle={alerts.due_soon_count > 0 ? "Próximas 48h" : "Sin alertas"}
            />
          </div>
        </div>

        <div className="df-panel">
          <div className="df-panel-header">
            <div>
              <div className="df-panel-title">Resumen comercial</div>
              <div className="df-panel-sub">Indicadores del período actual</div>
            </div>
          </div>

          <div className="df-summary-list">
            <SummaryRow label="Vendidos" value={sold} />
            <SummaryRow label="Ventas del mes" value={salesMonth} />
            <SummaryRow label="Facturación" value={formatCurrency(revenueMonth)} />
            <SummaryRow label="Promedio por venta" value={formatCurrency(avgSaleMonth)} />
          </div>
        </div>
      </section>

      <style>{`
        .df-dashboard{
          display:grid;
          gap:18px;
        }

        .df-hero{
          display:flex;
          justify-content:flex-end;
          margin-top: 4px;
        } 

        .df-hero-chip{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.75);
          border: 1px solid rgba(17,17,17,.06);
          box-shadow: 0 8px 18px rgba(17,17,17,.05);
          color: rgba(17,17,17,.68);
          font-size: 13px;
          font-weight: 600;
        }

        .df-hero-chip-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#C8936B;
          display:inline-block;
        }

        .df-kpi-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap:16px;
        }

        .df-kpi-card{
          position:relative;
          overflow:hidden;
          border-radius: 26px;
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: 0 12px 26px rgba(17,17,17,.06);
          padding: 22px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          background: rgba(255,255,255,.78);
          backdrop-filter: blur(10px);
        }

        .df-kpi-card::after{
          content:"";
          position:absolute;
          inset:auto -30px -30px auto;
          width:120px;
          height:120px;
          border-radius:999px;
          opacity:.16;
          pointer-events:none;
        }

        .df-kpi-card.rose::after{ background:#E9B0A5; }
        .df-kpi-card.plum::after{ background:#C8B0D0; }
        .df-kpi-card.gold::after{ background:#E7C58F; }
        .df-kpi-card.graphite::after{ background:#A9B0B8; }

        .df-kpi-title{
          font-size: 15px;
          font-weight: 700;
          color: #231A2B;
        }

        .df-kpi-value{
          font-size: 34px;
          font-weight: 800;
          margin-top: 8px;
          color: #20192A;
          line-height: 1.06;
          letter-spacing: -0.03em;
        }

        .df-kpi-sub{
          margin-top: 6px;
          color: rgba(17,17,17,.62);
          font-size: 14px;
        }

        .df-kpi-icon{
          width:74px;
          height:74px;
          border-radius: 22px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex: 0 0 74px;
          color: #6E434B;
          background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(236,223,219,.9));
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
        }

        .df-kpi-card.plum .df-kpi-icon{ color:#6A4C73; }
        .df-kpi-card.gold .df-kpi-icon{ color:#8D6840; }
        .df-kpi-card.graphite .df-kpi-icon{ color:#48525B; }

        .df-main-grid{
          display:grid;
          grid-template-columns: 1.15fr .85fr;
          gap:16px;
        }

        .df-bottom-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:16px;
        }

        .df-panel{
          border-radius: 28px;
          padding: 22px;
          background: rgba(255,255,255,.80);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: 0 12px 26px rgba(17,17,17,.06);
        }

        .df-panel-large{
          min-height: 360px;
        }

        .df-panel-header{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:14px;
          margin-bottom: 14px;
        }

        .df-panel-title{
          font-size: 18px;
          font-weight: 800;
          color: #22192B;
          letter-spacing: -0.02em;
        }

        .df-panel-sub{
          font-size: 14px;
          color: rgba(17,17,17,.56);
          margin-top: 4px;
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
          padding: 13px 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.66);
          border: 1px solid rgba(17,17,17,.05);
        }

        .df-activity-dot{
          width: 12px;
          height: 12px;
          border-radius: 999px;
        }

        .df-activity-dot.red{ background:#D68B8B; }
        .df-activity-dot.amber{ background:#D8B077; }

        .df-activity-title{
          font-weight: 700;
          color:#251D2D;
        }

        .df-activity-subtitle{
          font-size: 13px;
          color: rgba(17,17,17,.62);
          margin-top: 3px;
        }

        .df-activity-time{
          font-size: 12px;
          color: rgba(17,17,17,.54);
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
          gap:12px;
        }

        .df-legend-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          font-size:15px;
          color:#241C2C;
          padding: 10px 0;
          border-bottom: 1px solid rgba(17,17,17,.05);
        }

        .df-legend-row:last-child{
          border-bottom:none;
        }

        .df-legend-left{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .df-legend-right{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .df-legend-right strong{
          min-width: 24px;
          text-align:right;
        }

        .df-legend-right span{
          color: rgba(17,17,17,.55);
          font-size: 13px;
        }

        .df-legend-color{
          width:14px;
          height:14px;
          border-radius:999px;
          display:inline-block;
        }

        .df-alert-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:12px;
        }

        .df-mini-alert{
          border-radius: 20px;
          padding: 18px;
          border: 1px solid rgba(17,17,17,.05);
          background: rgba(255,255,255,.62);
        }

        .df-mini-alert-title{
          font-size: 14px;
          font-weight: 700;
          color:#241C2C;
        }

        .df-mini-alert-sub{
          font-size: 13px;
          color: rgba(17,17,17,.58);
          margin-top: 4px;
        }

        .df-mini-alert-top{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:10px;
        }

        .df-summary-list{
          display:grid;
          gap:8px;
        }

        .df-summary-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(17,17,17,.05);
        }

        .df-summary-row:last-child{
          border-bottom:none;
        }

        .df-summary-label{
          color: rgba(17,17,17,.66);
        }

        .df-summary-value{
          font-weight: 800;
          color:#22192B;
        }

        .df-empty{
          opacity: .7;
          padding: 10px 0;
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
          .df-kpi-grid{
            grid-template-columns: 1fr;
          }

          .df-inventory-wrap{
            grid-template-columns: 1fr;
          }

          .df-alert-grid{
            grid-template-columns: 1fr;
          }

          .df-activity-item{
            grid-template-columns: 12px 1fr;
          }

          .df-activity-time{
            grid-column: 2;
          }
        }
      `}</style>
    </div>
  );
}

function DashboardKpiCard({ title, value, subtitle, icon, tone }) {
  return (
    <div className={`df-kpi-card ${tone || ""}`}>
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

function DonutChart({ data, total }) {
  const safeTotal = total || 0;

  if (!safeTotal) {
    return (
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="30" />
        <circle cx="110" cy="110" r="46" fill="#F7F3EE" />
      </svg>
    );
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.10" />
        </filter>
      </defs>

      <g transform="rotate(-90 110 110)" filter="url(#softShadow)">
        {data.map((item) => {
          const fraction = item.value / safeTotal;
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
              strokeWidth="30"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      <circle cx="110" cy="110" r="46" fill="#F7F3EE" />
      <text x="110" y="103" textAnchor="middle" fontSize="15" fill="rgba(17,17,17,.55)">
        Total
      </text>
      <text x="110" y="126" textAnchor="middle" fontSize="24" fontWeight="800" fill="#22192B">
        {safeTotal}
      </text>
    </svg>
  );
}

function IconDress() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 3L8 6l2 2-3 12h10l-3-12 2-2-1.5-3z" />
      <path d="M10 8h4" />
    </svg>
  );
}

function IconLoan() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <path d="M8 7V5h8v2" />
      <path d="M12 10v4" />
      <path d="M10 12h4" />
    </svg>
  );
}

function IconSales() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function IconRevenue() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16l5-5 4 4 7-7" />
      <path d="M14 8h6v6" />
    </svg>
  );
}
