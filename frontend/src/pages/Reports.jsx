// frontend/src/pages/Reports.jsx
import { useMemo, useState } from "react";
import { t } from "../i18n";
import ReportsStock from "./ReportsStock";
import ReportsValuation from "./ReportsValuation";
// Si ya tenés el reporte de movimientos:
import ReportsMovements from "./ReportsMovements";

export default function Reports({ api, apiBase, role }) {
  const reports = useMemo(
    () => [
      {
        key: "stock",
        title: t("reports.menu.stock.title") || "Stock actual",
        desc: t("reports.menu.stock.desc") || t("reports.stock.subtitle") || ""
      },
      {
        key: "valuation",
        title: t("reports.menu.valuation.title") || "Valuación",
        desc:
          t("reports.menu.valuation.desc") ||
          "Valuación estimada por tela (metros disponibles × precio por metro)."
      },
      {
        key: "movements",
        title: t("reports.menu.movements.title") || "Movimientos",
        desc: t("reports.menu.movements.desc") || "Reporte filtrable de movimientos."
      }
    ],
    []
  );

  const [current, setCurrent] = useState(reports[0]?.key || "stock");
  const currentReport = reports.find((r) => r.key === current) || reports[0];

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      {/* Submenu */}
      <div className="card" style={{ position: "sticky", top: 12 }}>
        <h2 style={{ margin: 0 }}>{t("nav.reports")}</h2>
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
          {t("reports.subtitle") || ""}
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {reports.map((r) => {
            const active = r.key === current;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setCurrent(r.key)}
                className={`nav-btn ${active ? "active" : ""}`}
                style={{ textAlign: "left", padding: 12, borderRadius: 12 }}
              >
                <div style={{ fontWeight: 800 }}>{r.title}</div>
                {r.desc ? (
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>{r.desc}</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido del reporte */}
      <div>
        <div className="card">
          <h2 style={{ margin: 0 }}>{currentReport?.title}</h2>
          {currentReport?.desc ? (
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{currentReport.desc}</div>
          ) : null}
        </div>

        <div style={{ marginTop: 12 }}>
          {current === "stock" && <ReportsStock api={api} apiBase={apiBase} role={role} />}
          {current === "valuation" && <ReportsValuation api={api} apiBase={apiBase} role={role} />}
          {current === "movements" && <ReportsMovements api={api} apiBase={apiBase} role={role} />}
        </div>
      </div>
    </div>
  );
}

