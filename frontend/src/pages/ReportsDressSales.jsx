import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/currency";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("es-AR");
  } catch {
    return value;
  }
}

export default function ReportsDressSales({ api, apiBase }) {
  const [sales, setSales] = useState([]);
  const [dresses, setDresses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [buyer, setBuyer] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [salesData, dressesData] = await Promise.all([
        api.request(`${apiBase}/api/dress-sales`),
        api.request(`${apiBase}/api/dresses?page=1&page_size=100`)
      ]);

      setSales(Array.isArray(salesData) ? salesData : []);
      setDresses(Array.isArray(dressesData?.items) ? dressesData.items : []);
    } catch (e) {
      let message = "No se pudo cargar el reporte de ventas de vestidos";

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
      setSales([]);
      setDresses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    return sales
      .map((sale) => {
        const dress = dresses.find((d) => Number(d.id) === Number(sale.dress_id));

        return {
          id: sale.id,
          dressId: sale.dress_id,
          code: dress?.code || `#${sale.dress_id}`,
          name: dress?.name || "Vestido",
          soldAt: sale.sold_at,
          soldPrice: Number(sale.sold_price || 0),
          buyerName: sale.buyer_name || "-",
          notes: sale.notes || "-"
        };
      })
      .filter((row) =>
        !buyer ||
        String(row.buyerName || "").toLowerCase().includes(buyer.trim().toLowerCase())
      )
      .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt));
  }, [sales, dresses, buyer]);

  const summary = useMemo(() => {
    const totalSales = rows.length;
    const revenue = rows.reduce((acc, row) => acc + Number(row.soldPrice || 0), 0);
    const avg = totalSales > 0 ? revenue / totalSales : 0;

    return { totalSales, revenue, avg };
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
            <div style={{ fontWeight: 800, fontSize: 18 }}>Reporte de Ventas de Vestidos</div>
            <div className="page-sub">
              Historial de ventas, facturación y ticket promedio.
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
        <SummaryCard title="Ventas" value={summary.totalSales} subtitle="Vestidos vendidos" />
        <SummaryCard title="Facturación" value={formatCurrency(summary.revenue)} subtitle="Importe acumulado" />
        <SummaryCard title="Promedio" value={formatCurrency(summary.avg)} subtitle="Ticket promedio" />
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
            <div className="label">Comprador</div>
            <input
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              placeholder="Buscar por comprador"
            />
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
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Precio</th>
                <th>Comprador</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.code}</td>
                  <td style={{ fontWeight: 700 }}>{row.name}</td>
                  <td>{formatDate(row.soldAt)}</td>
                  <td>{formatCurrency(row.soldPrice)}</td>
                  <td>{row.buyerName}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.7 }}>
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
