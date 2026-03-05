import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function resolvePhoto(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  return `/${photoUrl.replace(/^\/+/, "")}`; // rutas en frontend/public
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
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function DressDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dresses/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setDress(data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const imgSrc = useMemo(() => resolvePhoto(dress?.photo_url), [dress?.photo_url]);

  // Acción principal (por ahora placeholders)
  const primaryActionLabel = useMemo(() => {
    if (!dress) return "";
    switch (dress.status) {
      case "AVAILABLE":
        return "Crear préstamo";
      case "LOANED":
        return "Registrar devolución";
      case "CLEANING":
        return "Marcar disponible";
      case "MAINTENANCE":
        return "Finalizar mantenimiento";
      default:
        return "";
    }
  }, [dress]);

  const showPrimaryAction = Boolean(primaryActionLabel);

  if (loading) {
    return (
      <div className="content">
        <div className="card">Cargando vestido...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="content">
        <div className="card alert alert-error">
          <b>Error:</b> {err}
        </div>
        <div>
          <button className="btn" onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </div>
    );
  }

  if (!dress) {
    return (
      <div className="content">
        <div className="card">Vestido no encontrado.</div>
        <div>
          <button className="btn" onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* TOP BAR */}
      <div className="dress-detail-top">
        <button className="btn" onClick={() => navigate(-1)}>← Volver</button>

        <div className="dress-detail-actions">
          {showPrimaryAction && (
            <button
              className="btn btn-primary"
              onClick={() => {
                // TODO: conectar con tu flujo real
                // navigate(`/loans/new?dress_id=${dress.id}`)
                alert(`Acción: ${primaryActionLabel} (pendiente de conectar)`);
              }}
            >
              {primaryActionLabel}
            </button>
          )}
          <button
            className="btn"
            onClick={() => {
              // TODO: conectar edición real
              // navigate(`/dresses/${dress.id}/edit`)
              alert("Editar (pendiente de conectar)");
            }}
          >
            Editar
          </button>
        </div>
      </div>

      {/* HEADER CARD */}
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
            <span className={badgeClass(dress.status)}>{dress.status}</span>
          </div>

          {/* KPI cards */}
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
          </div>

          {/* Details */}
          <div className="dress-meta">
            <div className="dress-meta-row">
              <div className="dress-meta-label">Creado</div>
              <div className="dress-meta-value">
                {dress.created_at ? new Date(dress.created_at).toLocaleString("es-AR") : "-"}
              </div>
            </div>

            <div className="dress-meta-row">
              <div className="dress-meta-label">Notas</div>
              <div className="dress-meta-value dress-notes">{dress.notes || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* NEXT: Historial / préstamos / ventas */}
      <div className="card">
        <h3>Historial</h3>
        <div className="page-sub" style={{ marginBottom: 10 }}>
          Próximo paso: mostrar préstamos y ventas del vestido.
        </div>

        <div className="grid grid-2">
          <button className="btn" onClick={() => alert("Ver préstamos (pendiente)")}>Ver préstamos</button>
          <button className="btn" onClick={() => alert("Ver ventas (pendiente)")}>Ver ventas</button>
        </div>
      </div>
    </div>
  );
}
