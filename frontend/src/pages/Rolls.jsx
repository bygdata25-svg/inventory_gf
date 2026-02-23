import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";

export default function Rolls({ api, apiBase, role }) {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [rolls, setRolls] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // create form
  const [fabricId, setFabricId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [location, setLocation] = useState("");
  const [metersInitial, setMetersInitial] = useState(50);
  const [metersAvailable, setMetersAvailable] = useState("");

  const isAdmin = role === "ADMIN";
  const canCreate = role === "ADMIN" || role === "OPERATOR";

  const selectedFabric = useMemo(
    () => fabrics.find((f) => String(f.id) === String(fabricId)),
    [fabrics, fabricId]
  );

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function showApiError(e) {
    if (!e) return setError(t("ui.error"));

    const d = e.detail;
    const mk = d?.messageKey || d?.detail?.messageKey;
    const params = d?.params || d?.detail?.params || {};

    if (mk) return setError(t(mk, params));

    if (e.status === 403) return setError(t("ui.forbidden"));
    if (typeof d === "string") return setError(d);
    if (d?.detail && typeof d.detail === "string") return setError(d.detail);

    return setError(`${t("ui.error")} ${e.status || ""}`);
  }

  async function loadRolls() {
    const data = await api.request(`${apiBase}/api/rolls`);
    setRolls(Array.isArray(data) ? data : []);
  }

  async function loadFabrics() {
    const data = await api.request(`${apiBase}/api/fabrics`);
    setFabrics(Array.isArray(data) ? data : []);
  }

  async function loadSuppliers() {
    const data = await api.request(`${apiBase}/api/suppliers`);
    setSuppliers(Array.isArray(data) ? data : []);
  }

  async function refresh() {
    resetMessages();
    await Promise.all([loadRolls(), loadFabrics(), loadSuppliers()]);
  }

  useEffect(() => {
    refresh().catch((e) => showApiError(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If lists loaded and none selected, select first
  useEffect(() => {
    if (fabrics.length > 0 && !fabricId) setFabricId(String(fabrics[0].id));
  }, [fabrics, fabricId]);

  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) setSupplierId(String(suppliers[0].id));
  }, [suppliers, supplierId]);

  function validate() {
    const fid = Number(fabricId);
    if (!Number.isFinite(fid) || fid <= 0) return t("ui.validationSelectFabric");

    const sid = Number(supplierId);
    if (!Number.isFinite(sid) || sid <= 0) return t("ui.validationSelectSupplier") || t("ui.validationRequired");

    const mi = Number(metersInitial);
    if (!Number.isFinite(mi) || mi <= 0) return t("ui.validationMetersPositive");

    if (metersAvailable !== "") {
      const ma = Number(metersAvailable);
      if (!Number.isFinite(ma) || ma < 0) return t("ui.validationMetersNonNegative");
      if (ma > mi) return t("errors.metersAvailableGreaterThanInitial") || t("ui.error");
    }

    return null;
  }

  async function createRoll(e) {
    e.preventDefault();
    if (!canCreate) return;

    resetMessages();

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const mi = Number(metersInitial);

    const payload = {
      fabric_id: Number(fabricId),
      supplier_id: Number(supplierId),
      lot_number: lotNumber.trim() ? lotNumber.trim() : null,
      location: location.trim() ? location.trim() : null,
      meters_initial: mi,
      // UX default: if empty, equal to initial
      meters_available: metersAvailable === "" ? mi : Number(metersAvailable)
    };

    try {
      await api.request(`${apiBase}/api/rolls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setInfo(t("ui.saved"));
      setLotNumber("");
      setLocation("");
      setMetersInitial(50);
      setMetersAvailable("");

      await loadRolls();
    } catch (e) {
      showApiError(e);
    }
  }

  async function deleteRoll(id) {
    if (!isAdmin) return;

    resetMessages();
    const ok = window.confirm(`${t("ui.confirmDelete")} #${id}?`);
    if (!ok) return;

    try {
      await api.request(`${apiBase}/api/rolls/${id}`, { method: "DELETE" });
      setInfo(t("ui.deleted"));
      await loadRolls();
    } catch (e) {
      showApiError(e);
    }
  }

  function renderFabricLabel(f) {
    const name = (f.name || f.code || `#${f.id}`).trim();
    const color = (f.color || "").trim();
    return color ? `${name} — ${color}` : name;
  }

  function renderSupplierLabel(s) {
    return (s.name || `#${s.id}`).trim ? (s.name || `#${s.id}`).trim() : (s.name || `#${s.id}`);
  }

  return (
    <>
      {/* Create */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("ui.createRoll")}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.createRollHint")}</div>
          </div>

          <button className="btn" type="button" onClick={() => refresh().catch((e) => showApiError(e))}>
            {t("actions.refresh")}
          </button>
        </div>

        {!canCreate && (
          <div className="alert alert-warn" style={{ marginTop: 12 }}>
            {t("ui.forbidden")}
          </div>
        )}

        <form onSubmit={createRoll} style={{ marginTop: 12 }}>
          <div className="grid grid-3">
            <label>
              <div className="label">{t("fields.fabric")}</div>
              <select value={fabricId} onChange={(e) => setFabricId(e.target.value)}>
                <option value="">{t("ui.selectFabric")}</option>

                {fabrics.length === 0 ? (
                  <option value="">{t("ui.noFabrics")}</option>
                ) : (
                  fabrics.map((f) => (
                    <option key={f.id} value={f.id}>
                      {renderFabricLabel(f)}
                    </option>
                  ))
                )}
              </select>

              {/* Fabric info card (no supplier here anymore) */}
              {selectedFabric && (
                <div className="card" style={{ marginTop: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {(selectedFabric.name || selectedFabric.code || `#${selectedFabric.id}`)} —{" "}
                        {selectedFabric.color || "-"}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                        {t("fields.code")}: <b>{selectedFabric.code}</b>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 4, fontSize: 12, color: "var(--muted)" }}>
                      <div>
                        {t("fields.widthM")}: <b>{selectedFabric.width_m ?? "-"}</b>
                      </div>
                      <div>
                        {t("fields.pricePerMeter")}: <b>{selectedFabric.price_per_meter ?? "-"}</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </label>

            <label>
              <div className="label">{t("fields.supplier")}</div>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">{t("ui.selectSupplier")}</option>
                {suppliers.length === 0 ? (
                  <option value="">{t("ui.noSuppliers")}</option>
                ) : (
                  suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <div className="label">{t("fields.lotNumber")}</div>
              <input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="e.g. L-2026-01" />
            </label>

            <label>
              <div className="label">{t("fields.location")}</div>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. A1-S2" />
            </label>

            <label>
              <div className="label">{t("fields.metersInitial")}</div>
              <input
                type="number"
                min="1"
                step="1"
                value={metersInitial}
                onChange={(e) => setMetersInitial(e.target.value)}
              />
            </label>

            <label>
              <div className="label">
                {t("fields.metersAvailable")} ({t("ui.optional")})
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={metersAvailable}
                onChange={(e) => setMetersAvailable(e.target.value)}
                placeholder={t("ui.defaultEqualsInitial")}
              />
            </label>

            <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
              <button className="btn btn-primary" type="submit" disabled={!canCreate}>
                {t("ui.create")}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
          {info && (
            <div className="alert alert-success" style={{ marginTop: 12 }}>
              {info}
            </div>
          )}
        </form>
      </div>

      {/* List */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("ui.listRolls")}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.listRollsHint")}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("fields.fabric")}</th>
                <th>{t("fields.supplier")}</th>
                <th>{t("fields.lotNumber")}</th>
                <th>{t("fields.location")}</th>
                <th>{t("fields.metersInitial")}</th>
                <th>{t("fields.metersAvailable")}</th>
                <th>{t("fields.isActive")}</th>
                {isAdmin && <th>{t("ui.actions")}</th>}
              </tr>
            </thead>

            <tbody>
              {rolls.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    <b>{r.fabric_code}</b>
                    {r.fabric_name ? ` — ${r.fabric_name}` : ""}
                    {r.fabric_color ? ` — ${r.fabric_color}` : ""}
                    {r.fabric_width_m != null ? ` — ${r.fabric_width_m}m` : ""}
                  </td>
                  <td>{r.supplier_name || "-"}</td>
                  <td>{r.lot_number || "-"}</td>
                  <td>{r.location || "-"}</td>
                  <td>{r.meters_initial}</td>
                  <td>{r.meters_available}</td>
                  <td>{r.is_active ? "true" : "false"}</td>

                  {isAdmin && (
                    <td className="actions">
                      <button className="btn btn-danger" type="button" onClick={() => deleteRoll(r.id)}>
                        {t("actions.delete")}
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {rolls.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} style={{ color: "var(--muted)" }}>
                    {t("ui.noRolls")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isAdmin && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            {t("ui.adminActionsHidden")}
          </div>
        )}
      </div>
    </>
  );
}

