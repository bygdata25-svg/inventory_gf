import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";

export default function ReportsDressesPopularity({ api, apiBase }) {
  const [loans, setLoans] = useState([]);
  const [dresses, setDresses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [loansData, dressesData] = await Promise.all([
        api.request(`${apiBase}/api/dress-loans`),
        api.request(`${apiBase}/api/dresses?page=1&page_size=100`)
      ]);

      setLoans(Array.isArray(loansData) ? loansData : []);
      setDresses(Array.isArray(dressesData?.items) ? dressesData.items : []);
    } catch (e) {
      let message = "No se pudo cargar el reporte de vestidos más usados";

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
      setLoans([]);
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
    const byDress = new Map();

    for (const loan of loans) {
      const dressId = Number(loan.dress_id);
      byDress.set(dressId, (byDress.get(dressId) || 0) + 1);
    }

    const result = Array.from(byDress.entries()).map(([dressId, count]) => {
      const dress = dresses.find((d) => Number(d.id) === Number(dressId));

      return {
        dressId,
        count,
        code: dress?.code || `#${dressId}`,
        name: dress?.name || "Vestido",
        color: dress?.color || "-",
        size: dress?.size || "-",
        status: dress?.status || "-"
      };
    });

    return result.sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
  }, [loans, dresses]);

  const summary = useMemo(() => {
    const totalLoans = loans.length;
    const usedDresses = rows.length;
    const top = rows[0]?.count || 0;

    return { totalLoans, usedDresses, top };
  }, [loans, rows]);

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
            <div style={{ fontWeight: 800, fontSize: 18 }}>Reporte de Vestidos Más Usados</div>
            <div className="page-sub">
              Ranking de prendas con mayor cantidad de préstamos.
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
        <SummaryCard title="Préstamos totales" value={summary.totalLoans} subtitle="Histórico cargado" />
        <SummaryCard title="Vestidos utilizados" value={summary.usedDresses} subtitle="Con al menos un préstamo" />
        <SummaryCard title="Mayor rotación" value={summary.top} subtitle="Préstamos del vestido líder" />
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Posición</th>
                <th>Vestido</th>
                <th>Nombre</th>
                <th>Color</th>
                <th>Talle</th>
                <th>Estado actual</th>
                <th>Préstamos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.dressId}>
                  <td>
                    <Badge variant={idx === 0 ? "yellow" : "default"}>#{idx + 1}</Badge>
                  </td>
                  <td>{row.code}</td>
                  <td style={{ fontWeight: 700 }}>{row.name}</td>
                  <td>{row.color}</td>
                  <td>{row.size}</td>
                  <td><Badge variant="default">
	              {dressStatusLabel(row.status)}
                      </Badge>
                  </td>
                  <td>{row.count}</td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.7 }}>
                    Sin datos
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
