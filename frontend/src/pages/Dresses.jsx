// frontend/src/pages/Dresses.jsx
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import { dressStatusLabel } from "../utils/status";
import { t } from "../i18n";
import DressDetail from "./DressDetailPage";

function resolvePhoto(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `/${photoUrl.replace(/^\/+/, "")}`;
}

export default function Dresses({ api, apiBase, role }) {
  const canEdit = role === "ADMIN" || role === "OPERATOR";

  const [items, setItems] = useState([]);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCapsules, setLoadingCapsules] = useState(false);
  const [error, setError] = useState("");

  const [selectedDressId, setSelectedDressId] = useState(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    size: "",
    color: "",
    notes: "",
    photo_url: "",
    price: "",
    capsule_id: ""
  });

  const [loanForm, setLoanForm] = useState(null);
  const [saleForm, setSaleForm] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.request(`${apiBase}/api/dresses`);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.detail || t("ui.error"));
      setItems([]);
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
    load();
    loadCapsules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        notes: "",
        photo_url: "",
        price: "",
        capsule_id: ""
      });

      load();
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
      load();
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
      load();
    } catch (e) {
      alert(e?.detail || "Error registrando venta");
    }
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

  const tableRows = items || [];

  if (selectedDressId) {
    return (
      <DressDetail
        api={api}
        apiBase={apiBase}
        role={role}
        dressId={selectedDressId}
        onBack={() => setSelectedDressId(null)}
        onRefresh={load}
      />
    );
  }

  return (
    <div>
      <h2>Vestidos</h2>

      {error && <div className="alert alert-error">{String(error)}</div>}

      {canEdit && (
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

      {loading && <div>Cargando...</div>}

      <table>
        <thead>
          <tr>
            <th>Foto</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Talle</th>
            <th>Color</th>
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
              <td>{d.capsule_name || "—"}</td>
              <td>{d.price != null ? `$ ${Number(d.price).toFixed(2)}` : "—"}</td>
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
                  </>
                )}
              </td>
            </tr>
          ))}

          {!loading && tableRows.length === 0 && (
            <tr>
              <td colSpan={9} style={{ opacity: 0.7 }}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
