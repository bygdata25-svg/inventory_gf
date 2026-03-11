import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { formatCurrency } from "../utils/currency";

function resolvePhoto(photoUrl, apiBase) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `${apiBase.replace(/\/+$/, "")}/${photoUrl.replace(/^\/+/, "")}`;
}

export default function Dashboard({ api, apiBase, username }) {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [dresses, setDresses] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      
      const [s, act, d] = await Promise.all([
      api.request(`${apiBase}/api/dashboard/summary`),
      api.request(`${apiBase}/api/dashboard/activity`),
      api.request(`${apiBase}/api/dresses?page=1&page_size=8`)
    ]);
      
      setSummary(s);
      setActivity(act);
      setDresses(Array.isArray(d?.items) ? d.items : []);
    } catch (e) {
      setError(e?.detail || "Error cargando dashboard");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(() => load().catch(() => {}), 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
       if (!activity) return [];

       return [...activity]
         .sort((a, b) => new Date(b.when) - new Date(a.when))
         .slice(0, 6)
         .map((item, index) => ({
           id: `${item.type}-${item.when}-${index}`,
           title: item.title,
           subtitle: item.subtitle,
           when: new Date(item.when).toLocaleString("es-AR"),
           tone:
             item.type === "loan_created"
               ? "amber"
               : item.type === "loan_returned"
               ? "green"
               : item.type === "sale"
               ? "plum"
               : "red"
         }));
     }, [activity]);

  const latestDresses = useMemo(() => dresses.slice(0, 4), [dresses]);

  const dashboardAlerts = useMemo(() => {
  const overdueCount = recentActivity.filter((item) => item.title === "Préstamo vencido").length;
  const dueSoonCount = recentActivity.filter((item) => item.title === "Vence pronto").length;

  return [
    {
      label: "Préstamos vencidos",
      value: overdueCount,
      variant: overdueCount > 0 ? "red" : "default",
      subtitle: overdueCount > 0 ? "Requiere acción" : "Sin vencidos"
    },
    {
      label: "Actividad reciente",
      value: recentActivity.length,
      variant: recentActivity.length > 0 ? "yellow" : "default",
      subtitle: recentActivity.length > 0 ? "Últimos eventos cargados" : "Sin eventos"
    },
    {
      label: "En taller",
      value: maintenance,
      variant: maintenance > 0 ? "yellow" : "default",
      subtitle: maintenance > 0 ? "Pendientes de revisión" : "Sin prendas en taller"
    }
  ];
}, [recentActivity, maintenance]);


  if (error) return <div className="alert alert-error">{String(error)}</div>;
  if (!summary) return <DashboardLoading />;

  return (
    <div className="df-dashboard-premium-v2">
      <section className="df-hero">
        <div className="df-hero-copy">
          <div className="df-hero-title">
            Bienvenida, {username || "Usuario"}
          </div>
          <div className="df-hero-subtitle">
            Vista general de operación, inventario y actividad reciente.
          </div>
        </div>

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
              <div className="df-panel-eyebrow">Timeline</div>
              <div className="df-panel-title">Actividad reciente</div>
              <div className="df-panel-sub">Eventos relevantes del sistema</div>
            </div>
          </div>

          <div className="df-activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, idx) => (
                <div
                  key={item.id}
                  className="df-activity-item"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
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
              <div className="df-panel-eyebrow">Inventory</div>
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
              <div className="df-panel-eyebrow">Alerts</div>
              <div className="df-panel-title">Alertas operativas</div>
              <div className="df-panel-sub">Seguimiento del estado del negocio</div>
            </div>
          </div>

          <div className="df-alert-grid">
            {dashboardAlerts.map((item) => (
              <MiniAlertCard
                key={item.label}
                title={item.label}
                count={item.value}
                variant={item.variant}
                subtitle={item.subtitle}
              />
            ))}
          </div>
        </div>

        <div className="df-panel">
          <div className="df-panel-header">
            <div>
              <div className="df-panel-eyebrow">Business</div>
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

      <section className="df-panel">
        <div className="df-panel-header">
          <div>
            <div className="df-panel-eyebrow">Catalog</div>
            <div className="df-panel-title">Últimos vestidos</div>
            <div className="df-panel-sub">Prendas recientes cargadas en el sistema</div>
          </div>
        </div>

        <div className="df-latest-grid">
          {latestDresses.length > 0 ? (
            latestDresses.map((dress) => {
              const photo = resolvePhoto(dress.photo_url, apiBase);

              return (
                <div key={dress.id} className="df-latest-card">
                  <div className="df-latest-photo">
                    {photo ? (
                      <img src={photo} alt={dress.name} />
                    ) : (
                      <div className="df-latest-empty">Sin foto</div>
                    )}
                  </div>

                  <div className="df-latest-body">
                    <div className="df-latest-name">{dress.name}</div>
                    <div className="df-latest-code">{dress.code}</div>
                    <div className="df-latest-meta">
                      <span>{dress.color || "—"}</span>
                      <span>{dress.size || "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="df-empty">Todavía no hay vestidos recientes.</div>
          )}
        </div>
      </section>

      <style>{`
        .df-dashboard-premium-v2{
          display:grid;
          gap:18px;
        }

        .df-hero{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:16px;
          flex-wrap:wrap;
          padding: 4px 2px 0;
        }

        .df-hero-title{
          font-size: 28px;
          font-weight: 800;
          color: #211927;
          letter-spacing: -0.02em;
        }

        .df-hero-subtitle{
          margin-top: 6px;
          font-size: 15px;
          color: rgba(17,17,17,.62);
        }

        .df-hero-chip{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,.78);
          border: 1px solid rgba(17,17,17,.06);
          box-shadow: 0 10px 24px rgba(17,17,17,.05);
          color: rgba(17,17,17,.68);
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(10px);
        }

        .df-hero-chip-dot{
          width:8px;
          height:8px;
          border-radius:999px;
          background:#C8936B;
          display:inline-block;
          box-shadow: 0 0 0 0 rgba(200,147,107,.35);
          animation: dfChipPulse 1.8s infinite ease-in-out;
        }

        @keyframes dfChipPulse{
          0%{ box-shadow:0 0 0 0 rgba(200,147,107,.32); }
          70%{ box-shadow:0 0 0 10px rgba(200,147,107,0); }
          100%{ box-shadow:0 0 0 0 rgba(200,147,107,0); }
        }

        .df-kpi-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap:16px;
        }

        .df-kpi-card{
          position:relative;
          overflow:hidden;
          border-radius: 28px;
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: 0 14px 28px rgba(17,17,17,.06);
          padding: 22px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78));
          backdrop-filter: blur(12px);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .df-kpi-card:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 34px rgba(17,17,17,.09);
          border-color: rgba(17,17,17,.08);
        }

        .df-kpi-card::before{
          content:"";
          position:absolute;
          inset:0;
          background: linear-gradient(180deg, rgba(255,255,255,.20), transparent 35%);
          pointer-events:none;
        }

        .df-kpi-card::after{
          content:"";
          position:absolute;
          inset:auto -28px -34px auto;
          width:124px;
          height:124px;
          border-radius:999px;
          opacity:.15;
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
          background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(236,223,219,.88));
          border: 1px solid rgba(17,17,17,.05);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.9),
            0 8px 18px rgba(17,17,17,.04);
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
          border-radius: 30px;
          padding: 22px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.90), rgba(255,255,255,.78));
          backdrop-filter: blur(14px);
          border: 1px solid rgba(17,17,17,.05);
          box-shadow: 0 14px 28px rgba(17,17,17,.06);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .df-panel:hover{
          transform: translateY(-1px);
          box-shadow: 0 18px 32px rgba(17,17,17,.08);
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

        .df-panel-eyebrow{
          font-size: 11px;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: rgba(17,17,17,.42);
          font-weight: 800;
          margin-bottom: 8px;
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
          background: rgba(255,255,255,.68);
          border: 1px solid rgba(17,17,17,.05);
          animation: dfFadeUp .3s ease both;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }

        .df-activity-item:hover{
          transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(17,17,17,.05);
          border-color: rgba(17,17,17,.08);
        }

        @keyframes dfFadeUp{
          from{
            opacity:0;
            transform: translateY(6px);
          }
          to{
            opacity:1;
            transform: translateY(0);
          }
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
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap:12px;
        }

        .df-mini-alert{
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(17,17,17,.05);
          background: rgba(255,255,255,.64);
          transition: transform .16s ease, box-shadow .16s ease;
        }

        .df-mini-alert:hover{
          transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(17,17,17,.05);
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

        .df-latest-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap:16px;
        }

        .df-latest-card{
          border-radius: 22px;
          overflow:hidden;
          border: 1px solid rgba(17,17,17,.05);
          background: rgba(255,255,255,.72);
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .df-latest-card:hover{
          transform: translateY(-2px);
          box-shadow: 0 14px 24px rgba(17,17,17,.07);
        }

        .df-latest-photo{
          width:100%;
          aspect-ratio: 4 / 5;
          background: rgba(17,17,17,.04);
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
        }

        .df-latest-photo img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .df-latest-empty{
          color: rgba(17,17,17,.48);
          font-size: 13px;
        }

        .df-latest-body{
          padding: 14px;
        }

        .df-latest-name{
          font-weight: 800;
          color:#231A2B;
        }

        .df-latest-code{
          margin-top: 4px;
          font-size: 13px;
          color: rgba(17,17,17,.52);
        }

        .df-latest-meta{
          margin-top: 8px;
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          color: rgba(17,17,17,.58);
          font-size: 12px;
        }

        .df-empty{
          opacity: .7;
          padding: 10px 0;
        }

        .df-dashboard-loading{
          display:grid;
          gap:16px;
        }

        .df-skeleton{
          position:relative;
          overflow:hidden;
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(17,17,17,.05);
          border-radius: 24px;
          min-height: 120px;
        }

        .df-skeleton.large{
          min-height: 320px;
        }

        .df-skeleton::after{
          content:"";
          position:absolute;
          inset:0;
          transform: translateX(-100%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.55),
            transparent
          );
          animation: dfShimmer 1.3s infinite;
        }

        @keyframes dfShimmer{
          100%{ transform: translateX(100%); }
        }

        @media (max-width: 1200px){
          .df-kpi-grid{
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .df-main-grid,
          .df-bottom-grid{
            grid-template-columns: 1fr;
          }

          .df-latest-grid{
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .df-alert-grid{
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

          .df-activity-item{
            grid-template-columns: 12px 1fr;
          }

          .df-activity-time{
            grid-column: 2;
          }

          .df-latest-grid{
            grid-template-columns: 1fr;
          }

          .df-hero{
            align-items:flex-start;
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

function DashboardLoading() {
  return (
    <div className="df-dashboard-loading">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16 }}>
        <div className="df-skeleton" />
        <div className="df-skeleton" />
        <div className="df-skeleton" />
        <div className="df-skeleton" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 16 }}>
        <div className="df-skeleton large" />
        <div className="df-skeleton large" />
      </div>
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
