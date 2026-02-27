import { useEffect, useState } from "react";
import { formatCurrency } from "../utils/currency";

export default function Dashboard({ api, apiBase }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await api.request(`${apiBase}/api/dashboard/summary`);
      setData(res);
    }
    load();
  }, []);

  if (!data) return <div>Cargando métricas...</div>;

  return (
    <div className="dashboard-grid">
      <Card title="Disponibles" value={data.available} color="#10b981" />
      <Card title="Prestados" value={data.loaned} color="#f59e0b" />
      <Card title="Vendidos" value={data.sold} color="#ef4444" />
      <Card title="Ventas del mes" value={data.sales_month} />
      <Card
        title="Facturación del mes"
      value={formatCurrency(data.revenue_month)}
      />
      <Card
        title="Promedio por venta"
        value={formatCurrency(data.avg_sale_month)}
      />
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div
      className="dashboard-card"
      style={{ borderLeft: `6px solid ${color || "#2563eb"}` }}
    >
      <div className="dashboard-title">{title}</div>
      <div className="dashboard-value">{value}</div>
    </div>
  );
}
