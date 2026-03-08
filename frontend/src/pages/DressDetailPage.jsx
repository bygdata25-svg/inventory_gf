import { useEffect, useMemo, useState } from "react";
import { dressStatusLabel } from "../utils/status";

function resolvePhoto(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `/${photoUrl.replace(/^\/+/, "")}`;
}

function badgeClass(status) {
  switch (status) {
    case "AVAILABLE":
      return "gf-badge gf-badge-green";
    case "LOANED":
      return "gf-badge gf-badge-red gf-badge-pulse";
    case "CLEANING":
      return "gf-badge gf-badge-yellow";
    case "MAINTENANCE":
      return "gf-badge gf-badge-orange";
    case "SOLD":
      return "gf-badge gf-badge-blue";
    case "RETIRED":
      return "gf-badge gf-badge-default";
    default:
      return "gf-badge gf-badge-default";
  }
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `U$S ${n.toFixed(2)}`;
}

export default function DressDetailPage({ api, apiBase, dressId, onBack, onRefresh }) {
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [loanForm, setLoanForm] = useState(null);
  const [saleForm, setSaleForm] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  async function loadDetail() {
    setLoading(true);
    setErr("");

    try {
      const data = await api.request(`${apiBase}/api/dresses/${dressId}`);
      setDress(data);
    } catch (e) {
      console.error("Dress detail error", e);
      setErr(e?.detail || e?.message || "No se pudo cargar el detalle del vestido");
      setDress(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await api.request(`${apiBase}/api/dresses/${dressId}`);
        if (!cancelled) setDress(data);
      } catch (e) {
        console.error("Dress detail error", e);
        if (!cancelled) {
          setErr(e?.detail || e?.message || "No se pudo cargar el detalle del vestido");
          setDress(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, apiBase, dressId]);

  const imgSrc = useMemo(() => resolvePhoto(dress?.photo_url), [dress?.photo_url]);

  async function updateStatus(status) {
    setSavingStatus(true);
    try {
      await api.request(`${apiBase}/api/dresses/${dressId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      await loadDetail();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e?.detail || "No se pudo actualizar el estado");
    } finally {
      setSavingStatus(false);
    }
  }

  async function createLoan(e) {
    e.preventDefault();

    try {
      await api.request(`${apiBase}/api/dress-loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanForm)
      });

      setLoanForm(null);
      await loadDetail();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e?.detail || "Error creando préstamo");
    }
  }

  async function createSale(e) {
    e.preventDefault();

    try {
      await api.request(`${apiBase}/api/dress-sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dress_id: saleForm.dress_id,
          sold_price: Number(saleForm.sold_price),
          buyer_name: saleForm.buyer_name || null,
          notes: saleForm.notes || null
        })
      });

      setSaleForm(null);
      await loadDetail();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e?.detail || "Error registrando venta");
    }
  }

  if (loading) {
    return <div className="card">Cargando vestido...</div>;
  }

  if (err) {
    return (
      <div>
        <div className="card alert alert-error" style={{ marginBottom: 12 }}>
          <b>Error:</b> {err}
        </div>
        <button className="btn" type="button" onClick={onBack}>
          ← Volver
        </button>
      </div>
    );
  }

  if (!dress) {
    return (
      <div>
        <div className="card" style={{ marginBottom: 12 }}>Vestido no encontrado.</div>
        <button className="btn" type="button" onClick={onBack}>
          ← Volver
        </button>
      </div>
    );
  }

  const isAvailable = dress.status === "AVAILABLE";
  const canReturnToAvailable = dress.status === "MAINTENANCE" || dress.status === "CLEANING";

  return (
    <div>
      <div className="dress-detail-top">
        <button className="btn" onClick={onBack} type="button">
          ← Volver
        </button>

        <div className="dress-detail-actions">
          <button className="btn" onClick={loadDetail} type="button">
            Actualizar
          </button>

          {isAvailable && (
            <>
              <button
                className="btn"
                type="button"
                onClick={() =>
                  setLoanForm({
                    dress_id: dress.id,
                    customer_name: "",
                    customer_dni: "",
                    customer_phone: "",
                    customer_email: "",
                    event_name: "",
                    loan_days: 3,
                    picked_up_by: "",
                    notes: ""
                  })
                }
              >
                Prestar
              </button>

              <button
                className="btn"
                type="button"
                onClick={() =>
                  setSaleForm({
                    dress_id: dress.id,
                    sold_price: "",
                    buyer_name: "",
                    notes: ""
                  })
                }
              >
                Vender
              </button>

              <button
                className="btn btn-primary"
                type="button"
                disabled={savingStatus}
                onClick={() => updateStatus("MAINTENANCE")}
              >
                Taller
              </button>
            </>
          )}

          {canReturnToAvailable && (
            <button
              className="btn btn-primary"
              type="button"
              disabled={savingStatus}
              onClick={() => updateStatus("AVAILABLE")}
            >
              Volver a disponible
            </button>
          )}
        </div>
      </div>

      <div className="card dress-detail-hero">
        <div className="dress-detail-hero-left">
          <div className="dress-photo">
            {imgSrc ? (
              <img src={imgSrc} alt={dress.name} />
            ) : (
              <div className="dress-photo-placeholder">
                Sin foto
              </div>
            )}
          </div>
        </div>

        <div className="dress-detail-hero-right">
          <div className="dress-title-row">
            <div className="dress-title">
              <div className="dress-name">{dress.name}</div>
              <div className="dress-code">{dress.code}</div>
            </div>
            <span className={badgeClass(dress.status)}>
              {dressStatusLabel(dress.status)}
            </span>
          </div>

          <div className="grid grid-2 dress-kpis">
            <div className="dress-kpi">
              <div className="dress-kpi-label">Precio</div>
              <div className="dress-kpi-value">{formatPrice(dress.price)}</div>
            </div>
            <div className="dress-kpi">
              <div className="dress-kpi-label">Cápsula</div>
              <div className="dress-kpi-value">{dress.capsule_name || "-"}</div>
            </div>
            <div className="dress-kpi">
              <div className="dress-kpi-label">Talle</div>
              <div className="dress-kpi-value">{dress.size || "-"}</div>
            </div>
            <div className="dress-kpi">
              <div className="dress-kpi-label">Color</div>
              <div className="dress-kpi-value">{dress.color || "-"}</div>
            </div>
            <div className="dress-kpi">
              <div className="dress-kpi-label">Ubicación</div>
              <div className="dress-kpi-value">{dress.location || "-"}</div>
            </div>
            <div className="dress-kpi">
              <div className="dress-kpi-label">Estado</div>
              <div className="dress-kpi-value">{dressStatusLabel(dress.status)}</div>
            </div>
          </div>

          <div className="dress-meta">
            <div className="dress-meta-row">
              <div className="dress-meta-label">Notas</div>
              <div className="dress-meta-value dress-notes">{dress.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Historial</h3>
        <div className="page-sub" style={{ marginBottom: 10 }}>
          Próximo paso: mostrar préstamos y ventas del vestido.
        </div>

        <div className="grid grid-2">
          <button className="btn" onClick={() => alert("Ver préstamos (pendiente)")} type="button">
            Ver préstamos
          </button>
          <button className="btn" onClick={() => alert("Ver ventas (pendiente)")} type="button">
            Ver ventas
          </button>
        </div>
      </div>

      {loanForm && (
        <div className="modal-overlay" onClick={() => setLoanForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Nuevo préstamo</h3>
              <button className="btn btn-icon" type="button" onClick={() => setLoanForm(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={createLoan}>
              <div className="modal-grid">
                <input
                  placeholder="Nombre cliente"
                  required
                  value={loanForm.customer_name || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, customer_name: e.target.value })}
                />
                <input
                  placeholder="DNI"
                  value={loanForm.customer_dni || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, customer_dni: e.target.value })}
                />
                <input
                  placeholder="Teléfono"
                  value={loanForm.customer_phone || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, customer_phone: e.target.value })}
                />
                <input
                  placeholder="Email"
                  value={loanForm.customer_email || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, customer_email: e.target.value })}
                />
                <input
                  placeholder="Evento"
                  value={loanForm.event_name || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, event_name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Días"
                  min={1}
                  max={60}
                  value={loanForm.loan_days || 3}
                  onChange={(e) => setLoanForm({ ...loanForm, loan_days: Number(e.target.value) })}
                />
                <input
                  placeholder="Retira"
                  value={loanForm.picked_up_by || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, picked_up_by: e.target.value })}
                />
                <input
                  placeholder="Notas"
                  value={loanForm.notes || ""}
                  onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="submit">Confirmar</button>
                <button type="button" onClick={() => setLoanForm(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {saleForm && (
        <div className="modal-overlay" onClick={() => setSaleForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Registrar venta</h3>
              <button className="btn btn-icon" type="button" onClick={() => setSaleForm(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={createSale}>
              <div className="modal-grid">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Precio de venta"
                  required
                  value={saleForm.sold_price}
                  onChange={(e) => setSaleForm({ ...saleForm, sold_price: e.target.value })}
                />
                <input
                  placeholder="Comprador (opcional)"
                  value={saleForm.buyer_name || ""}
                  onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })}
                />
                <input
                  placeholder="Notas (opcional)"
                  value={saleForm.notes || ""}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="submit">Confirmar venta</button>
                <button type="button" onClick={() => setSaleForm(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
