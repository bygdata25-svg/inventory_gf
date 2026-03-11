import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";

export default function ReportsMovements({ api, apiBase }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [rollId, setRollId] = useState("");
  const [movementType, setMovementType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function showApiError(e) {
    const d = e?.detail;
    if (typeof d === "string") return setError(d);
    if (d?.detail && typeof d.detail === "string") return setError(d.detail);
    return setError(t("ui.error"));
  }

  async function load() {
    setError("");

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (rollId) params.set("roll_id", rollId);
    if (movementType) params.set("movement_type", movementType);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const data = await api.request(`${apiBase}/api/reports/movements?${params.toString()}`);
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load().catch(showApiError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rollOptions = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      map.set(String(r.roll_id), r);
    }
    return Array.from(map.values()).sort((a, b) => Number(a.roll_id) - Number(b.roll_id));
  }, [rows]);

  const totalMeters = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.meters || 0), 0);
  }, [rows]);

  const movementLabel = (mt) => t(`movements.types.${mt}`);

  return (
    <>
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
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            Reporte de Movimientos
          </div>

          <button className="btn" type="button" onClick={() => load().catch(showApiError)}>
            {t("actions.refresh")}
          </button>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ minWidth: 280 }}>
            <div className="label">{t("ui.search")}</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("reports.movements.searchHint")} />
          </label>

          <label style={{ minWidth: 220 }}>
            <div className="label">{t("fields.rollId")}</div>
            <select value={rollId} onChange={(e) => setRollId(e.target.value)}>
              <option value="">{t("ui.all")}</option>
              {rollOptions.map((r) => (
                <option key={r.roll_id} value={r.roll_id}>
                  #{r.roll_id} — {r.fabric_code} {r.fabric_color ? `(${r.fabric_color})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label style={{ minWidth: 220 }}>
            <div className="label">{t("fields.movementType")}</div>
            <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
              <option value="">{t("ui.all")}</option>
              <option value="IN">{movementLabel("IN")}</option>
              <option value="OUT">{movementLabel("OUT")}</option>
              <option value="ADJUST">{movementLabel("ADJUST")}</option>
            </select>
          </label>

          <label>
            <div className="label">{t("reports.movements.dateFrom")}</div>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>

          <label>
            <div className="label">{t("reports.movements.dateTo")}</div>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>

          <button className="btn btn-primary" type="button" onClick={() => load().catch(showApiError)}>
            {t("actions.search") || "Buscar"}
          </button>

          <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13 }}>
            {t("reports.movements.totalMeters")}:{" "}
            <b style={{ color: "var(--text)" }}>{totalMeters}</b>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ marginTop: 4, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("fields.movementDate")}</th>
                <th>{t("fields.movementType")}</th>
                <th>{t("fields.rollId")}</th>
                <th>{t("fields.fabric")}</th>
                <th>{t("fields.color")}</th>
                <th>{t("fields.meters")}</th>
                <th>{t("fields.reason")}</th>
                <th>{t("fields.reference")}</th>
                <th>{t("fields.location")}</th>
                <th>{t("fields.lotNumber")}</th>
                <th>{t("fields.supplier")}</th>
                <th>{t("ui.available")}</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.created_at ? r.created_at.slice(0, 19).replace("T", " ") : "-"}</td>
                  <td><b>{movementLabel(r.movement_type) || r.movement_type}</b></td>
                  <td>#{r.roll_id}</td>
                  <td>
                    <b>{r.fabric_code}</b>
                    {r.fabric_name ? ` — ${r.fabric_name}` : ""}
                  </td>
                  <td>{r.fabric_color || "-"}</td>
                  <td>{r.meters}</td>
                  <td>{r.reason || "-"}</td>
                  <td>{r.reference || "-"}</td>
                  <td>{r.location || "-"}</td>
                  <td>{r.lot_number || "-"}</td>
                  <td>{r.supplier_name || "-"}</td>
                  <td>{r.roll_meters_available ?? "-"}</td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ color: "var(--muted)" }}>
                    {t("reports.movements.empty")}
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
