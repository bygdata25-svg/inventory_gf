import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";
import { t } from "../i18n";
import DressDetail from "./DressDetailPage";
import { DRESS_LOCATIONS } from "../constants/dressLocations";

function resolvePhoto(photoUrl, apiBase) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `${apiBase.replace(/\/+$/, "")}/${photoUrl.replace(/^\/+/, "")}`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export default function Dresses({ api, apiBase, role, mode = "list" }) {
  const canEdit = role === "ADMIN" || role === "OPERATOR";
  const pageSize = 10;
  const showCreate = mode === "create";
  const showList = mode === "list";

  const [allItems, setAllItems] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCapsules, setLoadingCapsules] = useState(false);
  const [error, setError] = useState("");

  const [selectedDressId, setSelectedDressId] = useState(null);

  const [page, setPage] = useState(1);

  const [filterForm, setFilterForm] = useState({
    status: "",
    capsule_id: "",
    color: "",
    location: "",
    price_min: "",
    price_max: ""
  });

  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    capsule_id: "",
    color: "",
    location: "",
    price_min: "",
    price_max: ""
  });

  const [form, setForm] = useState({
    code: "",
    name: "",
    size: "",
    color: "",
    location: "",
    notes: "",
    price: "",
    capsule_id: ""
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [loanForm, setLoanForm] = useState(null);
  const [saleForm, setSaleForm] = useState(null);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

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

  async function loadAllDresses() {
    setLoading(true);
    setError("");

    try {
      const data = await api.request(`${apiBase}/api/dresses?page=1&page_size=100`);

      if (Array.isArray(data)) {
        setAllItems(data);
      } else {
        setAllItems(Array.isArray(data?.items) ? data.items : []);
      }
      } catch (e) {
  console.error("createDress error:", e);

  let message = "Error creando vestido";

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
}
      setError(message);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCapsules() {
    setLoadingCapsules(true);
    try {
      const data = await api.request(`${apiBase}/api/capsules`);
      setCapsules(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading capsules", e);
      setCapsules([]);
    } finally {
      setLoadingCapsules(false);
    }
  }

  useEffect(() => {
    loadCapsules();
    if (showList) {
      loadAllDresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showList]);

  async function createDress(e) {
    e.preventDefault();
    if (!canEdit) return;

    try {
      const formData = new FormData();
      formData.append("code", form.code.trim());
      formData.append("name", form.name.trim());
      formData.append("status", "AVAILABLE");

      if (form.size) formData.append("size", form.size);
      if (form.color) formData.append("color", form.color);
      if (form.location) formData.append("location", form.location);
      if (form.notes) formData.append("notes", form.notes);
      if (form.price !== "") formData.append("price", String(Number(form.price)));
      if (form.capsule_id !== "") formData.append("capsule_id", String(Number(form.capsule_id)));
      if (photoFile) formData.append("photo", photoFile);

      await api.request(`${apiBase}/api/dresses`, {
        method: "POST",
        body: formData
      });

      setForm({
        code: "",
        name: "",
        size: "",
        color: "",
        location: "",
        notes: "",
        price: "",
        capsule_id: ""
      });

      clearPhotoSelection();

      await loadAllDresses();
    } catch (e) {
      alert(e?.detail || "Error creando vestido");
    }
  }

  async function createLoan(e) {
    e.preventDefault();
    if (!canEdit) return;

    try {
      await api.request(`${apiBase}/api/dress-loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanForm)
      });
      setLoanForm(null);
      await loadAllDresses();
    } catch (e) {
      alert(e?.detail || "Error creando préstamo");
    }
  }

  async function createSale(e) {
    e.preventDefault();
    if (!canEdit) return;

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
      await loadAllDresses();
    } catch (e) {
      alert(e?.detail || "Error registrando venta");
    }
  }

  async function sendToWorkshop(dressId) {
    if (!canEdit) return;

    try {
      await api.request(`${apiBase}/api/dresses/${dressId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "MAINTENANCE" })
      });

      await loadAllDresses();
    } catch (e) {
      alert(e?.detail || "Error enviando a taller");
    }
  }

  async function markAsAvailable(dressId) {
    if (!canEdit) return;

    try {
      await api.request(`${apiBase}/api/dresses/${dressId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AVAILABLE" })
      });

      await loadAllDresses();
    } catch (e) {
      alert(e?.detail || "Error cambiando a disponible");
    }
  }

  function applyFilters(e) {
    e.preventDefault();

    setAppliedFilters({
      status: String(filterForm.status || "").trim(),
      capsule_id: String(filterForm.capsule_id || "").trim(),
      color: String(filterForm.color || "").trim(),
      location: String(filterForm.location || "").trim(),
      price_min: String(filterForm.price_min ?? "").trim(),
      price_max: String(filterForm.price_max ?? "").trim()
    });

    setPage(1);
  }

  function clearFilters() {
    const empty = {
      status: "",
      capsule_id: "",
      color: "",
      location: "",
      price_min: "",
      price_max: ""
    };

    setFilterForm(empty);
    setAppliedFilters(empty);
    setPage(1);
  }

  function DressStatusBadge({ status }) {
    if (status === "AVAILABLE") return <Badge variant="green">{dressStatusLabel(status)}</Badge>;
    if (status === "LOANED") return <Badge variant="orange">{dressStatusLabel(status)}</Badge>;
    if (status === "SOLD") return <Badge variant="blue">{dressStatusLabel(status)}</Badge>;
    if (status === "CLEANING") return <Badge variant="yellow">{dressStatusLabel(status)}</Badge>;
    if (status === "MAINTENANCE") return <Badge variant="orange">{dressStatusLabel(status)}</Badge>;
    if (status === "RETIRED") return <Badge variant="default">{dressStatusLabel(status)}</Badge>;
    return <Badge variant="default">{status}</Badge>;
  }

  const filteredItems = useMemo(() => {
    const status = String(appliedFilters.status || "").trim();
    const capsuleId = normalizeText(appliedFilters.capsule_id);
    const color = normalizeText(appliedFilters.color);
    const location = normalizeText(appliedFilters.location);
    const priceMin = appliedFilters.price_min !== "" ? Number(appliedFilters.price_min) : null;
    const priceMax = appliedFilters.price_max !== "" ? Number(appliedFilters.price_max) : null;

    return (allItems || []).filter((item) => {
      const itemStatus = String(item.status || "").trim();
      const itemCapsuleId = String(item.capsule_id ?? "").trim();
      const itemColor = normalizeText(item.color);
      const itemLocation = normalizeText(item.location);
      const itemPrice = item.price != null ? Number(item.price) : null;

      if (status && itemStatus !== status) return false;
      if (capsuleId && itemCapsuleId !== capsuleId) return false;
      if (color && !itemColor.includes(color)) return false;
      if (location && !itemLocation.includes(location)) return false;
      if (priceMin !== null && (itemPrice === null || itemPrice < priceMin)) return false;
      if (priceMax !== null && (itemPrice === null || itemPrice > priceMax)) return false;

      return true;
    });
  }, [allItems, appliedFilters]);

  const total = filteredItems.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, page, pages]);

  useEffect(() => {
    if (page > pages) {
      setPage(pages);
    }
  }, [page, pages]);

  if (selectedDressId) {
    return (
      <DressDetail
        api={api}
        apiBase={apiBase}
        role={role}
        dressId={selectedDressId}
        onBack={() => setSelectedDressId(null)}
        onRefresh={loadAllDresses}
      />
    );
  }

  return (
    <div>

      {error && <div className="alert alert-error">{String(error)}</div>}

      {canEdit && showCreate && (
        <form onSubmit={createDress} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Código (único)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />

            <input
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              placeholder="Talle"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />

            <input
              placeholder="Color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />

            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              <option value="">Ubicación</option>
              {DRESS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              value={form.capsule_id}
              onChange={(e) => setForm({ ...form, capsule_id: e.target.value })}
              style={{ minWidth: 180 }}
            >
              <option value="">Sin cápsula</option>
              {capsules.map((capsule) => (
                <option key={capsule.id} value={capsule.id}>
                  {capsule.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <input
              placeholder="Notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ minWidth: 240 }}
            />
          </div>

          <div className="dress-upload-box">
            <div className="dress-upload-left">
              <div className="label">Foto del vestido</div>

              <label className="btn" style={{ width: "fit-content" }}>
                Subir foto
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
                  Quitar foto
                </button>
              )}
            </div>

            <div className="dress-upload-preview">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="dress-upload-image"
                />
              ) : (
                <div className="dress-upload-empty">Sin foto cargada</div>
              )}
            </div>
          </div>

          {loadingCapsules && (
            <div style={{ marginTop: 8, opacity: 0.7 }}>Cargando cápsulas...</div>
          )}

          <div style={{ marginTop: 12 }}>
            <button type="submit">{t("actions.create") || "Crear"}</button>
          </div>
        </form>
      )}

      {showList && (
        <div className="card" style={{ marginBottom: 18 }}>
          <form onSubmit={applyFilters}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={filterForm.status}
                onChange={(e) => setFilterForm({ ...filterForm, status: e.target.value })}
                style={{ minWidth: 180 }}
              >
                <option value="">Todos los estados</option>
                <option value="AVAILABLE">{dressStatusLabel("AVAILABLE")}</option>
                <option value="LOANED">{dressStatusLabel("LOANED")}</option>
                <option value="CLEANING">{dressStatusLabel("CLEANING")}</option>
                <option value="MAINTENANCE">{dressStatusLabel("MAINTENANCE")}</option>
                <option value="RETIRED">{dressStatusLabel("RETIRED")}</option>
                <option value="SOLD">{dressStatusLabel("SOLD")}</option>
              </select>

              <select
                value={filterForm.capsule_id}
                onChange={(e) => setFilterForm({ ...filterForm, capsule_id: e.target.value })}
                style={{ minWidth: 180 }}
              >
                <option value="">Todas las cápsulas</option>
                {capsules.map((capsule) => (
                  <option key={capsule.id} value={capsule.id}>
                    {capsule.name}
                  </option>
                ))}
              </select>

              <input
                placeholder="Filtrar por color"
                value={filterForm.color}
                onChange={(e) => setFilterForm({ ...filterForm, color: e.target.value })}
              />

              <select
                value={filterForm.location}
                onChange={(e) => setFilterForm({ ...filterForm, location: e.target.value })}
              >
                <option value="">Todas las ubicaciones</option>
                {DRESS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio mínimo"
                value={filterForm.price_min}
                onChange={(e) => setFilterForm({ ...filterForm, price_min: e.target.value })}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio máximo"
                value={filterForm.price_max}
                onChange={(e) => setFilterForm({ ...filterForm, price_max: e.target.value })}
              />

              <button type="submit">{t("actions.search") || "Buscar"}</button>
              <button type="button" onClick={clearFilters}>
                {t("actions.clear") || "Limpiar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showList && (
        <>
          {loading && <div>Cargando...</div>}

          <div style={{ marginBottom: 10, opacity: 0.8 }}>
            Total: {total} vestido(s)
          </div>

          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Talle</th>
                <th>Color</th>
                <th>Ubicación</th>
                <th>Cápsula</th>
                <th>Precio</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((d) => (
                <tr
                  key={d.id}
                  className="dress-row"
                  onClick={() => setSelectedDressId(d.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    {d.photo_url ? (
                      <img
                        src={resolvePhoto(d.photo_url, apiBase)}
                        alt={d.name}
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid rgba(0,0,0,.10)"
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ opacity: 0.6 }}>—</span>
                    )}
                  </td>

                  <td>{d.code}</td>
                  <td style={{ fontWeight: 800 }}>{d.name}</td>
                  <td>{d.size || "—"}</td>
                  <td>{d.color || "—"}</td>
                  <td>{d.location || "—"}</td>
                  <td>{d.capsule_name || "—"}</td>
                  <td>{d.price != null ? `U$S ${Number(d.price).toFixed(2)}` : "—"}</td>
                  <td>
                    <DressStatusBadge status={d.status} />
                  </td>

                  <td
                    style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEdit && d.status === "AVAILABLE" && (
                      <>
                        <button
                          onClick={() =>
                            setLoanForm({
                              dress_id: d.id,
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
                          type="button"
                        >
                          Prestar
                        </button>

                        <button
                          onClick={() =>
                            setSaleForm({
                              dress_id: d.id,
                              sold_price: "",
                              buyer_name: "",
                              notes: ""
                            })
                          }
                          type="button"
                        >
                          Vender
                        </button>

                        <button onClick={() => sendToWorkshop(d.id)} type="button">
                          Taller
                        </button>
                      </>
                    )}

                    {canEdit && (d.status === "MAINTENANCE" || d.status === "CLEANING") && (
                      <button onClick={() => markAsAvailable(d.id)} type="button">
                        Volver a disponible
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ opacity: 0.7 }}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 14,
              flexWrap: "wrap"
            }}
          >
            <div style={{ opacity: 0.8 }}>
              Página {page} de {pages}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

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

      <style>{`
        .dress-row:hover td{
          background: rgba(17,17,17,.02);
        }

        .dress-upload-box{
          margin-top: 12px;
          display:grid;
          grid-template-columns: 220px 180px;
          gap: 16px;
          align-items:start;
        }

        .dress-upload-left{
          display:grid;
          gap:10px;
          align-content:start;
        }

        .dress-upload-preview{
          width: 180px;
          height: 220px;
          border-radius: 14px;
          border: 1px dashed rgba(0,0,0,.18);
          overflow:hidden;
          background: rgba(255,255,255,.7);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .dress-upload-image{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .dress-upload-empty{
          opacity:.65;
          font-size: 13px;
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

          .dress-upload-box{
            grid-template-columns: 1fr;
          }

          .dress-upload-preview{
            width: 100%;
            max-width: 220px;
          }
        }
      `}</style>
    </div>
  );
}
