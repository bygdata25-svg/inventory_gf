// frontend/src/pages/ReportsValuation.jsx
import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";

export default function ReportsValuation({ api, apiBase }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [supplier, setSupplier] = useState("");

  function showApiError(e) {
    const d = e?.detail;
    if (typeof d === "string") return setError(d);
    if (d?.detail && typeof d.detail === "string") return setError(d.detail);
    return setError(t("ui.error"));
  }

  async function load() {
    setError("");
    const data = await api.request(
      `${apiBase}/api/reports/valuation-by-fabric?only_available=${onlyAvailable ? "true" : "false"}&include_inactive=${
        includeInactive ? "true" : "false"
      }`
    );
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load().catch(showApiError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyAvailable, includeInactive]);

  const suppliers = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (r.supplier_id) map.set(String(r.supplier_id), r.supplier_name || `#${r.supplier_id}`);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const normalized = useMemo(() => {
    return rows.map((r) => ({
      fabric_id: r.fabric_id ?? null,
      fabric_code: r.fabric_code ?? "",
      fabric_name: r.fabric_name ?? "",
      fabric_color: r.fabric_color ?? "",
      fabric_type: r.fabric_type ?? "",
      supplier_id: r.supplier_id ?? null,
      supplier_name: r.supplier_name ?? null,
      price_per_meter: r.price_per_meter != null ? Number(r.price_per_meter) : null,
      total_meters: Number(r.meters_available_sum ?? 0),
      total_value: Number(r.value_sum ?? 0)
    }));
  }, [rows]);

  const filtered = useMemo(() => {
    const term = (q || "").trim().toLowerCase();

    return normalized.filter((r) => {
      if (supplier && String(r.supplier_id || "") !== String(supplier)) return false;
      if (!term) return true;

      const hay = `${r.fabric_code} ${r.fabric_name} ${r.fabric_color} ${r.fabric_type} ${
        r.supplier_name || ""
      }`.toLowerCase();

      return hay.includes(term);
    });
  }, [normalized, q, supplier]);

  const grandMeters = useMemo(
    () => filtered.reduce((acc, r) => acc + Number(r.total_meters || 0), 0),
    [filtered]
  );

  const grandValue = useMemo(
    () => filtered.reduce((acc, r) => acc + Number(r.total_value || 0), 0),
    [filtered]
  );

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("reports.valuation.title") || t("reports.menu.valuation.title") || "Valuación"}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              {t("reports.valuation.subtitle") ||
                "Valuación estimada por tela (metros disponibles × precio por metro), agrupada por proveedor del rollo."}
            </div>
          </div>

          <button className="btn" type="button" onClick={() => load().catch(showApiError)}>
            {t("actions.refresh")}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ minWidth: 260 }}>
            <div className="label">{t("ui.search")}</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ui.searchHint")} />
          </label>

          <label style={{ minWidth: 220 }}>
            <div className="label">{t("fields.supplier")}</div>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">{t("ui.all")}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            <span style={{ fontSize: 13 }}>{t("reports.stock.onlyAvailable") || "Solo con stock"}</span>
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
            <span style={{ fontSize: 13 }}>{t("reports.valuation.includeInactive") || "Incluir telas inactivas"}</span>
          </label>

          <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13, display: "flex", gap: 16 }}>
            <div>
              {t("reports.stock.total") || "Total (m)"}: <b style={{ color: "var(--text)" }}>{grandMeters}</b>
            </div>
            <div>
              {t("reports.stock.value") || "Valor"}: <b style={{ color: "var(--text)" }}>{grandValue.toFixed(2)}</b>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      <div className="card">
        <div style={{ marginTop: 4, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t("fields.code")}</th>
                <th>{t("fields.name")}</th>
                <th>{t("fields.color")}</th>
                <th>{t("fields.fabricType")}</th>
                <th>{t("fields.supplier")}</th>
                <th>{t("reports.stock.total") || "Total (m)"}</th>
                <th>{t("fields.pricePerMeter")}</th>
                <th>{t("reports.stock.value") || "Valor"}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.fabric_id ?? r.fabric_code}-${r.supplier_id ?? "nosup"}`}>
                  <td><b>{r.fabric_code || "-"}</b></td>
                  <td>{r.fabric_name || "-"}</td>
                  <td>{r.fabric_color || "-"}</td>
                  <td>{r.fabric_type || "-"}</td>
                  <td>{r.supplier_name || "-"}</td>
                  <td><b>{r.total_meters}</b></td>
                  <td>{r.price_per_meter != null ? r.price_per_meter : "-"}</td>
                  <td>{Number(r.total_value || 0).toFixed(2)}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--muted)" }}>
                    {t("reports.stock.empty") || "No hay resultados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

