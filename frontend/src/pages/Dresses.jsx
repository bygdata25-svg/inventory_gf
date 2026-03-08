import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";
import { t } from "../i18n";
import DressDetail from "./DressDetailPage";

function resolvePhoto(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `/${photoUrl.replace(/^\/+/, "")}`;
}

function buildDressQuery({ filters, page, pageSize }) {
  const params = new URLSearchParams();

  const capsuleId = String(filters.capsule_id || "").trim();
  const color = String(filters.color || "").trim();
  const location = String(filters.location || "").trim();
  const priceMin = String(filters.price_min ?? "").trim();
  const priceMax = String(filters.price_max ?? "").trim();

  if (capsuleId) params.set("capsule_id", capsuleId);
  if (color) params.set("color", color);
  if (location) params.set("location", location);
  if (priceMin !== "") params.set("price_min", priceMin);
  if (priceMax !== "") params.set("price_max", priceMax);

  params.set("page", String(page));
  params.set("page_size", String(pageSize));

  return params.toString();
}

export default function Dresses({ api, apiBase, role, mode = "list" }) {
  const canEdit = role === "ADMIN" || role === "OPERATOR";
  const pageSize = 15;
  const showCreate = mode === "create";
  const showList = mode === "list";

  const [items, setItems] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCapsules, setLoadingCapsules] = useState(false);
  const [error, setError] = useState("");

  const [selectedDressId, setSelectedDressId] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // filtros editables en pantalla
  const [filterForm, setFilterForm] = useState({
    capsule_id: "",
    color: "",
    location: "",
    price_min: "",
    price_max: ""
  });

  // filtros realmente aplicados al request
  const [appliedFilters, setAppliedFilters] = useState({
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
    photo_url: "",
    price: "",
    capsule_id: ""
  });

  const [loanForm, setLoanForm] = useState(null);
  const [saleForm, setSaleForm] = useState(null);

  async function load({ pageToLoad = 1, filtersToUse = appliedFilters } = {}) {
    setLoading(true);
    setError("");

    try {
      const query = buildDressQuery({
        filters: filtersToUse,
        page: pageToLoad,
        pageSize
      });

      const url = `${apiBase}/api/dresses?${query}`;
      const data = await api.request(url);

      if (Array.isArray(data)) {
        // compatibilidad si el backend devuelve lista plana
        setItems(data);
        setTotal(data.length);
        setPage(1);
        setPages(1);
      } else {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
        setPage(Number(data?.page || pageToLoad));
        setPages(Number(data?.pages || 1));
      }
    } catch (e) {
      console.error("Error loading dresses", e);
      setError(e?.detail || t("ui.error"));
      setItems([]);
      setTotal(0);
      setPage(1);
      setPages(1);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showList) {
      load({ pageToLoad: 1, filtersToUse: appliedFilters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showList]);

  async function createDress(e) {
    e.preventDefault();
    if (!canEdit) return;

    try {
      await api.request(`${apiBase}/api/dresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          size: form.size || null,
          color: form.color || null,
          location: form.location || null,
          notes: form.notes || null,
          photo_url: form.photo_url || null,
          price: form.price === "" ? null : Number(form.price),
          capsule_id: form.capsule_id === "" ? null : Number(form.capsule_id)
        })
      });

      setForm({
        code: "",
        name: "",
        size: "",
        color: "",
        location: "",
        notes: "",
        photo_url: "",
        price: "",
        capsule_id: ""
      });

      if (showList) {
        load({ pageToLoad: page, filtersToUse: appliedFilters });
      }
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
      load({ pageToLoad: page, filtersToUse: appliedFilters });
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
      load({ pageToLoad: page, filtersToUse: appliedFilters });
    } catch (e) {
      alert(e?.detail || "Error registrando venta");
    }
  }

  async function sendToWorkshop(dressId) {
    if (!canEdit) return;
    alert(`Enviar a Taller para vestido #${dressId} (pendiente de conectar con backend)`);
  }

  function applyFilters(e) {
    e.preventDefault();

    const normalized = {
      capsule_id: String(filterForm.capsule_id || "").trim(),
      color: String(filterForm.color || "").trim(),
      location: String(filterForm.location || "").trim(),
      price_min: String(filterForm.price_min ?? "").trim(),
      price_max: String(filterForm.price_max ?? "").trim()
    };

    setAppliedFilters(normalized);
    load({ pageToLoad: 1, filtersToUse: normalized });
  }

  function clearFilters() {
    const empty = {
      capsule_id: "",
      color: "",
      location: "",
      price_min: "",
      price_max: ""
    };

    setFilterForm(empty);
    setAppliedFilters(empty);
    load({ pageToLoad: 1, filtersToUse: empty });
  }

  function DressStatusBadge({ status }) {
    if (status === "AVAILABLE") {
      return <Badge variant="green">{dressStatusLabel(status)}</Badge>;
    }
    if (status === "LOANED") {
      return <Badge variant="orange">{dressStatusLabel(status)}</Badge>;
    }
    if (status === "SOLD") {
      return <Badge variant="blue">{dressStatusLabel(status)}</Badge>;
    }
    if (status === "CLEANING") {
      return <Badge variant="yellow">{dressStatusLabel(status)}</Badge>;
    }
    if (status === "MAINTENANCE") {
      return <Badge variant="default">{dressStatusLabel(status)}</Badge>;
    }
    if (status === "RETIRED") {
      return <Badge variant="default">{dressStatusLabel(status)}</Badge>;
    }
    return <Badge variant="default">{status}</Badge>;
  }

  const tableRows = useMemo(() => items || [], [items]);

  if (selectedDressId) {
    return (
      <DressDetail
        api={api}
        apiBase={apiBase}
        role={role}
        dressId={selectedDressId}
        onBack={() => setSelectedDressId(null)}
        onRefresh={() => load({ pageToLoad: page, filtersToUse: appliedFilters })}
      />
    );
  }

  return (
    <div>
      <h2>{showCreate ? "Crear vestido" : "Listado y filtros"}</h2>

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

            <input
              placeholder="Ubicación"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

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
              placeholder="Foto (URL o ruta relativa)"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              style={{ minWidth: 260 }}
            />

            <input
              placeholder="Notas"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ minWidth: 240 }}
            />

            <button type="submit">{t("actions.create") || "Crear"}</button>
          </div>

          {loadingCapsules && (
            <div style={{ marginTop: 8, opacity: 0.7 }}>Cargando cápsulas...</div>
          )}
        </form>
      )}

      {showList && (
        <div className="card" style={{ marginBottom: 18 }}>
          <form onSubmit={applyFilters}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

              <input
                placeholder="Filtrar por ubicación"
                value={filterForm.location}
                onChange={(e) => setFilterForm({ ...filterForm, location: e.target.value })}
              />

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
              {tableRows.map((d) => (
                <tr
                  key={d.id}
                  className="dress-row"
                  onClick={() => setSelectedDressId(d.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    {d.photo_url ? (
                      <img
                        src={resolvePhoto(d.photo_url)}
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

                        <button
                          onClick={() => sendToWorkshop(d.id)}
                          type="button"
                        >
                          Taller
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && tableRows.length === 0 && (
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
                onClick={() => load({ pageToLoad: page - 1, filtersToUse: appliedFilters })}
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={page >= pages || loading}
                onClick={() => load({ pageToLoad: page + 1, filtersToUse: appliedFilters })}
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
