import { useEffect, useMemo, useState } from "react";
import { dressStatusLabel } from "../utils/status";
import { DRESS_LOCATIONS } from "../constants/dressLocations";

function resolvePhoto(photoUrl, apiBase) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `${apiBase.replace(/\/+$/, "")}/${photoUrl.replace(/^\/+/, "")}`;
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

export default function DressDetailPage({ api, apiBase, dressId, onBack, onRefresh, role }) {
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [loanForm, setLoanForm] = useState(null);
  const [saleForm, setSaleForm] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const [capsules, setCapsules] = useState([]);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    price: "",
    capsule_id: "",
    location: "",
    notes: ""
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const isAdmin = role === "ADMIN";

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  async function loadCapsules() {
    try {
      const data = await api.request(`${apiBase}/api/capsules`);
      setCapsules(Array.isArray(data) ? data : []);
    } catch {
      setCapsules([]);
    }
  }

  function syncEditForm(data) {
    setEditForm({
      price: data?.price ?? "",
      capsule_id: data?.capsule_id ?? "",
      location: data?.location ?? "",
      notes: data?.notes ?? ""
    });

    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview("");
  }

  async function loadDetail() {
    setLoading(true);
    setErr("");

    try {
      const data = await api.request(`${apiBase}/api/dresses/${dressId}`);
      setDress(data);
      syncEditForm(data);
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
        if (!cancelled) {
          setDress(data);
          syncEditForm(data);
        }
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

  useEffect(() => {
    if (isAdmin) {
      loadCapsules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const imgSrc = useMemo(() => {
    if (photoPreview) return photoPreview;
    return resolvePhoto(dress?.photo_url, apiBase);
  }, [dress?.photo_url, apiBase, photoPreview]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Seleccioná una imagen válida");
      return;
    }

    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhotoSelection() {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview("");
  }

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

  async function saveEdit() {
    setSavingEdit(true);

    try {
      const formData = new FormData();

      formData.append("price", editForm.price === "" ? "" : String(Number(editForm.price)));
      formData.append("capsule_id", editForm.capsule_id === "" ? "" : String(Number(editForm.capsule_id)));
      formData.append("location", editForm.location || "");
      formData.append("notes", editForm.notes || "");

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await api.request(`${apiBase}/api/dresses/${dressId}`, {
        method: "PATCH",
        body: formData
      });

      setEditing(false);
      await loadDetail();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("saveEdit error:", e);

      let message = "No se pudieron guardar los cambios";

      if (typeof e === "string") {
        message = e;
      } else if (typeof e?.detail === "string") {
        message = e.detail;
      } else if (Array.isArray(e?.detail)) {
        message = e.detail.map((x) => x?.msg || JSON.stringify(x)).join(" | ");
      } else if (e?.detail && typeof e.detail === "object") {
        message = JSON.stringify(e.detail, null, 2);
      } else if (typeof e?.message === "string") {
        message = e.message;
      } else {
        message = JSON.stringify(e, null, 2);
      }

      alert(message);
    } finally {
      setSavingEdit(false);
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

  async function returnLoan() {
    try {
      const openLoan = await api.request(`${apiBase}/api/dress-loans/by-dress/${dressId}/open`);

      await api.request(`${apiBase}/api/dress-loans/${openLoan.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returned_by: "Showroom"
        })
      });

      await loadDetail();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e?.detail || "Error registrando devolución");
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
  const isLoaned = dress.status === "LOANED";
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

          {isAdmin && !editing && (
            <button
              className="btn"
              type="button"
              onClick={() => setEditing(true)}
            >
              Editar
            </button>
          )}

          {isAdmin && editing && (
            <>
              <button
                className="btn btn-primary"
                type="button"
                disabled={savingEdit}
                onClick={saveEdit}
              >
                Guardar cambios
              </button>

              <button
                className="btn"
                type="button"
                disabled={savingEdit}
                onClick={() => {
                  setEditing(false);
                  syncEditForm(dress);
                }}
              >
                Cancelar
              </button>
            </>
          )}

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

          {isLoaned && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={returnLoan}
            >
              Registrar devolución
            </button>
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

          {editing && isAdmin && (
            <div className="dress-photo-tools">
              <label className="btn" style={{ width: "fit-content" }}>
                {dress.photo_url || photoFile ? "Cambiar foto" : "Agregar foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
              </label>

              {photoFile && (
                <button
                  type="button"
                  className="btn"
                  onClick={clearPhotoSelection}
                >
                  Quitar selección
                </button>
              )}
            </div>
          )}
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
              {editing && isAdmin ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                />
              ) : (
                <div className="dress-kpi-value">{formatPrice(dress.price)}</div>
              )}
            </div>

            <div className="dress-kpi">
              <div className="dress-kpi-label">Cápsula</div>
              {editing && isAdmin ? (
                <select
                  value={editForm.capsule_id}
                  onChange={(e) => setEditForm({ ...editForm, capsule_id: e.target.value })}
                >
                  <option value="">Sin cápsula</option>
                  {capsules.map((capsule) => (
                    <option key={capsule.id} value={capsule.id}>
                      {capsule.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="dress-kpi-value">{dress.capsule_name || "-"}</div>
              )}
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
              {editing && isAdmin ? (
                <select
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                >
                  <option value="">Sin ubicación</option>
                  {DRESS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="dress-kpi-value">{dress.location || "-"}</div>
              )}
            </div>

            <div className="dress-kpi">
              <div className="dress-kpi-label">Estado</div>
              <div className="dress-kpi-value">{dressStatusLabel(dress.status)}</div>
            </div>
          </div>

          <div className="dress-meta">
            <div className="dress-meta-row">
              <div className="dress-meta-label">Notas</div>
              <div className="dress-meta-value dress-notes">
                {editing && isAdmin ? (
                  <textarea
                    rows={4}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                ) : (
                  dress.notes || "-"
                )}
              </div>
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
                  min="0"
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

      <style>{`
        .dress-photo-tools{
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:12px;
        }

        .modal-overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.35);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 999;
        }

        .modal{
          width: min(860px, 100%);
          background: #fff;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,.12);
          box-shadow: 0 12px 40px rgba(0,0,0,.18);
          padding: 14px;
        }

        .modal-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .modal-grid{
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .modal-actions{
          display:flex;
          gap: 10px;
          margin-top: 12px;
        }

        @media (max-width: 720px){
          .modal-grid{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
