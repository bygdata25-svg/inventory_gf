import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n";

export default function Movements({ api, apiBase, role }) {
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [rolls, setRolls] = useState([]);
  const [movements, setMovements] = useState([]);

  // Form state
  const [rollId, setRollId] = useState("");
  const [movementType, setMovementType] = useState("OUT");
  const [meters, setMeters] = useState(5);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  const canAdjust = role === "ADMIN";

  const selectedRoll = useMemo(
    () => rolls.find((r) => String(r.id) === String(rollId)),
    [rollId, rolls]
  );

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function showApiError(e) {
    if (!e) {
      setError(t("ui.error"));
      return;
    }

    const d = e.detail;
    const mk = d?.messageKey || d?.detail?.messageKey;
    const params = d?.params || d?.detail?.params || {};

    if (mk) {
      setError(t(mk, params));
      return;
    }

    if (e.status === 403) {
      setError(t("ui.forbidden"));
      return;
    }

    if (typeof d === "string") {
      setError(d);
      return;
    }

    if (d?.detail && typeof d.detail === "string") {
      setError(d.detail);
      return;
    }

    setError(`${t("ui.error")} ${e.status || ""}`);
  }

  async function loadRolls() {
    const data = await api.request(`${apiBase}/api/rolls`);
    setRolls(Array.isArray(data) ? data : []);
  }
  
  async function loadMovements(currentRollId) {
  if (!currentRollId) {
    setMovements([]);
    return;
  }
  const data = await api.request(
    `${apiBase}/api/stock-movements?roll_id=${encodeURIComponent(currentRollId)}`
  );
  setMovements(Array.isArray(data) ? data : []);
}

  async function refresh() {
  resetMessages();
  await Promise.all([loadRolls(), loadMovements(rollId)]);
}
useEffect(() => {
  loadMovements(rollId).catch((e) => showApiError(e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [rollId]);

  // auto-select first roll
  useEffect(() => {
    if (rolls.length > 0 && !rollId) setRollId(String(rolls[0].id));
  }, [rolls, rollId]);

  // if operator, prevent ADJUST in UI
  useEffect(() => {
    if (!canAdjust && movementType === "ADJUST") setMovementType("OUT");
  }, [canAdjust, movementType]);

  function validate() {
    if (!rollId) return t("ui.validationSelectRoll");

    const metersInt = Number(meters);
    if (!Number.isFinite(metersInt) || metersInt <= 0) return t("ui.validationMetersPositive");

    if (movementType === "ADJUST") {
      if (!canAdjust) return t("ui.forbidden");
      if (!reason.trim()) return t("errors.adjustReasonRequired");
    }

    return null;
  }

  async function submit(e) {
    e.preventDefault();
    resetMessages();

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      roll_id: Number(rollId),
      movement_type: movementType,
      meters: Number(meters),
      reason: reason.trim() ? reason.trim() : null,
      reference: reference.trim() ? reference.trim() : null
    };

    try {
      await api.request(`${apiBase}/api/stock-movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setInfo(t("ui.saved"));
      setReason("");
      setReference("");

      await refresh();
    } catch (e) {
      showApiError(e);
    }
  }

	const movementLabel = t(`movements.types.${movementType}`);

	const typeHint =
	  movementType === "IN"
	    ? `${movementLabel} — ${t("ui.hintIn")}`
	    : movementType === "OUT"
	      ? `${movementLabel} — ${t("ui.hintOut")}`
	      : `${movementLabel} — ${t("ui.hintAdjust")}`;

  return (
    <>
      <div className="grid grid-2">
        {/* Create movement */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div>
              <h2 style={{ margin: 0 }}>{t("ui.createMovement")}</h2>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{typeHint}</div>
            </div>
            <button className="btn" type="button" onClick={() => refresh().catch((e) => showApiError(e))}>
              {t("actions.refresh")}
            </button>
          </div>

          <form onSubmit={submit} style={{ marginTop: 12 }}>
            <div className="grid grid-2">
              <label>
                <div className="label">{t("fields.rollId")}</div>
                <select value={rollId} onChange={(e) => setRollId(e.target.value)}>
                  {rolls.length === 0 ? (
                    <option value="">{t("ui.noRolls")}</option>
                  ) : (
                    rolls.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.id} | {r.fabric_code} ({r.fabric_color}) | lot: {r.lot_number || "-"} | loc:{" "}
                        {r.location || "-"} | avail: {r.meters_available}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                <div className="label">{t("fields.movementType")}</div>
                 <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                   <option value="IN">{t("movements.types.IN")}</option>
                   <option value="OUT">{t("movements.types.OUT")}</option>
                   {canAdjust && <option value="ADJUST">{t("movements.types.ADJUST")}</option>}
                 </select>

                {!canAdjust && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                    {t("ui.adjustHiddenForOperator")}
                  </div>
                )}
              </label>

              <label>
                <div className="label">
                  {movementType === "ADJUST" ? t("ui.adjustToMeters") : t("fields.meters")}
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={meters}
                  onChange={(e) => setMeters(e.target.value)}
                />
              </label>

              <label>
                <div className="label">
                  {t("fields.reference")} ({t("ui.optional")})
                </div>
                <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Order #123" />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <div className="label">
                  {t("fields.reason")}{" "}
                  {movementType === "ADJUST" ? `(${t("ui.required")})` : `(${t("ui.optional")})`}
                </div>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    movementType === "ADJUST" ? t("ui.reasonPlaceholderAdjust") : t("ui.reasonPlaceholder")
                  }
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
              <button className="btn btn-primary" type="submit">
                {t("ui.create")}
              </button>

              {selectedRoll && (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  {t("ui.selectedRoll")}: <b style={{ color: "var(--text)" }}>#{selectedRoll.id}</b> —{" "}
                  {t("ui.available")}: <b style={{ color: "var(--text)" }}>{selectedRoll.meters_available}</b>
                </div>
              )}
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
            {info && <div className="alert alert-success" style={{ marginTop: 12 }}>{info}</div>}
          </form>
        </div>

        {/* Selected roll info */}
        <div className="card">
          <h2 style={{ margin: 0 }}>{t("ui.rollSnapshot")}</h2>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.rollSnapshotHint")}</div>

          <div style={{ marginTop: 12 }}>
            {!selectedRoll ? (
              <div className="alert" style={{ background: "rgba(17,24,39,.02)" }}>
                {t("ui.selectRollToSeeDetails")}
              </div>
            ) : (
              <div className="grid grid-2">
                <div>
                  <div className="label">{t("fields.rollId")}</div>
                  <div style={{ fontWeight: 800 }}>#{selectedRoll.id}</div>
                </div>

                <div>
                  <div className="label">{t("fields.location")}</div>
                  <div style={{ fontWeight: 800 }}>{selectedRoll.location || "-"}</div>
                </div>

                <div>
                  <div className="label">{t("fields.fabric")}</div>
                  <div style={{ fontWeight: 800 }}>
                    {selectedRoll.fabric_code} — {selectedRoll.fabric_type}
                  </div>
                </div>

                <div>
                  <div className="label">{t("fields.color")}</div>
                  <div style={{ fontWeight: 800 }}>{selectedRoll.fabric_color}</div>
                </div>

                <div>
                  <div className="label">{t("fields.metersInitial")}</div>
                  <div style={{ fontWeight: 800 }}>{selectedRoll.meters_initial}</div>
                </div>

                <div>
                  <div className="label">{t("fields.metersAvailable")}</div>
                  <div style={{ fontWeight: 800 }}>{selectedRoll.meters_available}</div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <div className="label">{t("fields.lotNumber")}</div>
                  <div style={{ fontWeight: 800 }}>{selectedRoll.lot_number || "-"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>{t("ui.latestMovements")}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{t("ui.latestMovementsHint")}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("fields.rollId")}</th>
                <th>{t("fields.movementType")}</th>
                <th>{t("fields.meters")}</th>
                <th>{t("fields.reason")}</th>
                <th>{t("fields.reference")}</th>
                <th>Created</th>
                <th>{t("fields.fabric")}</th>
                <th>{t("ui.availableAfter")}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.roll_id}</td>
                  <td>
                     <span className={`badge badge-${m.movement_type.toLowerCase()}`}>
                       {t(`movements.types.${m.movement_type}`)}
                     </span>
                   </td>
                  <td>{m.meters}</td>
                  <td>{m.reason || "-"}</td>
                  <td>{m.reference || "-"}</td>
                  <td>{m.created_at}</td>
                  <td>{m.fabric_code}</td>
                  <td>{m.roll_meters_available}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ color: "var(--muted)" }}>
                    {t("ui.noMovementsYet")}
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

