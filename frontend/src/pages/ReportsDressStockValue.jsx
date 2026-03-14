import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";
import { formatCurrency } from "../utils/currency";

export default function ReportsDressStockValue({ api, apiBase }) {
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
      let message = "No se pudo cargar el reporte de stock valorizado";

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

  const availableItems = useMemo(() => {
    return items
      .filter((item) => item.status === "AVAILABLE")
      .sort((a, b) => {
        const aName = String(a.name || "");
        const bName = String(b.name || "");
        return aName.localeCompare(bName);
      });
  }, [items]);

  const summary = useMemo(() => {
    const totalCount = availableItems.length;
    const totalValue = availableItems.reduce(
      (acc, item) => acc + Number(item.price || 0),
      0
    );
    const averageValue = totalCount > 0 ? totalValue / totalCount : 0;

    return {
      totalCount,
      totalValue,
      averageValue
    };
  }, [availableItems]);

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
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              Stock valorizado de vestidos disponibles
            </div>
            <div className="page-sub">
              Valorización actual del inventario disponible para préstamo o venta.
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
        <SummaryCard
          title="Vestidos disponibles"
          value={summary.totalCount}
          subtitle="Prendas activas en stock"
        />
        <SummaryCard
          title="Valor total"
          value={formatCurrency(summary.totalValue)}
          subtitle="Valorización actual"
        />
        <SummaryCard
          title="Precio promedio"
          value={formatCurrency(summary.averageValue)}
          subtitle="Promedio por vestido disponible"
        />
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cápsula</th>
                <th>Ubicación</th>
                <th>Precio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {availableItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700 }}>{item.code || "-"}</td>
                  <td>{item.name || "-"}</td>
                  <td>{item.capsule_name || "-"}</td>
                  <td>{item.location || "-"}</td>
                  <td>{formatCurrency(Number(item.price || 0))}</td>
                  <td>
                    <Badge variant="green">
                      {dressStatusLabel(item.status)}
                    </Badge>
                  </td>
                </tr>
              ))}

              {!loading && availableItems.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ opacity: 0.7 }}>
                    Sin vestidos disponibles
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
