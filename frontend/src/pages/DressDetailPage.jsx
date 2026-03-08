import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
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
    }

    if (dressId) {
      loadDetail();
    }

    return () => {
      cancelled = true;
    };
  }, [api, apiBase, dressId]);

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

  const imgSrc = resolvePhoto(dress.photo_url);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <button className="btn" type="button" onClick={onBack}>
          ← Volver
        </button>

        <button className="btn" type="button" onClick={onRefresh}>
          Refrescar lista
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20
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
                  borderRadius: 12,
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
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.7
                }}
              >
                Sin foto
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0 }}>{dress.name}</h2>
                <div style={{ opacity: 0.7, marginTop: 4 }}>{dress.code}</div>
              </div>
               <span className={badgeClass(dress.status)}>
                     Disponible
               </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 14,
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
                <div style={{ opacity: 0.7 }}>Notas</div>
                <div style={{ fontWeight: 700 }}>{dress.notes || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px){
          .card > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
