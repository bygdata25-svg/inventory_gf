import { useEffect, useState } from "react";

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
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(n);
}

export default function DressDetailPage({ api, apiBase, dressId, onBack, onRefresh }) {
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadDetail() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.request(`${apiBase}/api/dresses/${dressId}`);
      setDress(data || null);
    } catch (e) {
      console.error("Error loading dress detail", e);
      setErr(e?.detail || e?.message || "No se pudo cargar el detalle del vestido");
      setDress(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (dressId) {
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dressId]);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <button className="btn" type="button" onClick={onBack}>
            ← Volver
          </button>
        </div>
        <div className="card">Cargando vestido #{dressId}...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div>
        <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <button className="btn" type="button" onClick={onBack}>
            ← Volver
          </button>
          <button className="btn" type="button" onClick={loadDetail}>
            Reintentar
          </button>
        </div>

        <div className="card alert alert-error">
          <b>Error:</b> {err}
        </div>
      </div>
    );
  }

  if (!dress) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <button className="btn" type="button" onClick={onBack}>
            ← Volver
          </button>
        </div>
        <div className="card">No se encontró el vestido #{dressId}.</div>
      </div>
    );
  }

  const imgSrc = resolvePhoto(dress.photo_url);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap"
        }}
      >
        <button className="btn" type="button" onClick={onBack}>
          ← Volver
        </button>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={onRefresh}>
            Refrescar lista
          </button>
          <button className="btn" type="button" onClick={loadDetail}>
            Actualizar detalle
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20,
            alignItems: "start"
          }}
        >
          <div>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={dress.name}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.12)",
                  objectFit: "cover"
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: 320,
                  height: 320,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.6
                }}
              >
                Sin foto
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 6px 0" }}>{dress.name}</h2>
                <div style={{ opacity: 0.75 }}>Código: {dress.code}</div>
              </div>
              <span className={badgeClass(dress.status)}>{dress.status}</span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginTop: 18
              }}
            >
              <div>
                <div style={{ opacity: 0.7 }}>Cápsula</div>
                <div style={{ fontWeight: 700 }}>{dress.capsule_name || "-"}</div>
              </div>

              <div>
                <div style={{ opacity: 0.7 }}>Precio</div>
                <div style={{ fontWeight: 700 }}>{formatPrice(dress.price)}</div>
              </div>

              <div>
                <div style={{ opacity: 0.7 }}>Talle</div>
                <div style={{ fontWeight: 700 }}>{dress.size || "-"}</div>
              </div>

              <div>
                <div style={{ opacity: 0.7 }}>Color</div>
                <div style={{ fontWeight: 700 }}>{dress.color || "-"}</div>
              </div>

              <div>
                <div style={{ opacity: 0.7 }}>Creado</div>
                <div style={{ fontWeight: 700 }}>
                  {dress.created_at ? new Date(dress.created_at).toLocaleString("es-AR") : "-"}
                </div>
              </div>

              <div>
                <div style={{ opacity: 0.7 }}>ID</div>
                <div style={{ fontWeight: 700 }}>{dress.id}</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ opacity: 0.7, marginBottom: 4 }}>Notas</div>
              <div>{dress.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Historial</h3>
        <div style={{ opacity: 0.75 }}>
          Próximo paso: mostrar préstamos y ventas del vestido.
        </div>
      </div>

      <style>{`
        @media (max-width: 720px){
          .card > div[style*="grid-template-columns: 320px 1fr"]{
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
