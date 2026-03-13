import { useEffect, useMemo, useState } from "react";

function getInitial(userLabel) {
  if (!userLabel) return "U";
  return String(userLabel).trim().charAt(0).toUpperCase();
}

function greeting() {
  const h = new Date().getHours();

  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Layout({
  brandTitle = "DressFlow",
  brandSubtitle = "AI • FASHION • ERP",
  navItems,
  currentPage,
  onNavigate,
  userLabel,
  onLogout,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  function go(pageKey) {
    onNavigate(pageKey);
    setSidebarOpen(false);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function getPageTitle(pageKey) {
    if (pageKey === "dashboard") return `${greeting()}, ${userLabel} ✧`;

    for (const item of navItems) {
      if (item.key === pageKey) return item.label;

      if (Array.isArray(item.children)) {
        for (const child of item.children) {
          if (child.key === pageKey) return child.label;

          if (Array.isArray(child.children)) {
            const grandChild = child.children.find((g) => g.key === pageKey);
            if (grandChild) return grandChild.label;
          }
        }
      }
    }

    return brandTitle;
  }

  function getPageSubtitle(pageKey) {
    switch (pageKey) {
      case "dashboard":
        return "Bienvenido a tu panel de control de DressFlow";

      case "dresses":
      case "dresses_create":
      case "dresses_list":
        return "Gestioná tu catálogo de vestidos, estados y disponibilidad.";

      case "capsules":
        return "Organizá cápsulas y colecciones.";

      case "fabrics_group":
      case "fabrics":
      case "rolls":
      case "movements":
        return "Controlá telas, rollos y movimientos de stock.";

      case "dress_loans":
        return "Administrá préstamos y devoluciones de prendas.";

      case "reports":
        return "Visualizá reportes y métricas de tu operación.";

      case "reports_dresses_status":
        return "Estado general y distribución del inventario de vestidos.";

      case "reports_dress_loans":
        return "Consultá préstamos activos, vencidos y devueltos.";

      case "reports_dresses_popularity":
        return "Identificá los vestidos con mayor rotación y uso.";

      case "reports_dress_sales":
        return "Analizá ventas y facturación de vestidos.";

      case "reports_stock":
      case "reports_valuation":
      case "reports_movements":
        return "Reportes operativos y de control de telas y rollos.";

      case "settings":
      case "users":
      case "suppliers":
      case "customers":
        return "Configurá usuarios, clientes y parámetros del sistema.";

      default:
        return "";
    }
  }

  const dressesChildren = useMemo(() => {
    const item = navItems.find((x) => x.key === "dresses");
    return item?.children || [];
  }, [navItems]);

  const fabricsChildren = useMemo(() => {
    const item = navItems.find((x) => x.key === "fabrics_group");
    return item?.children || [];
  }, [navItems]);

  const reportsChildren = useMemo(() => {
    const item = navItems.find((x) => x.key === "reports");
    if (!item?.children) return [];

    return item.children.flatMap((child) =>
      Array.isArray(child.children) ? child.children : [child]
    );
  }, [navItems]);

  const settingsChildren = useMemo(() => {
    const item = navItems.find((x) => x.key === "settings");
    return item?.children || [];
  }, [navItems]);

  const isDressesSection =
    currentPage === "dresses" || dressesChildren.some((c) => c.key === currentPage);

  const isFabricsSection =
    currentPage === "fabrics_group" || fabricsChildren.some((c) => c.key === currentPage);

  const isReportsSection =
    currentPage === "reports" || reportsChildren.some((c) => c.key === currentPage);

  const isSettingsSection =
    currentPage === "settings" || settingsChildren.some((c) => c.key === currentPage);

  function renderNavItem(it) {
    const isGroup =
      (it.key === "dresses" ||
        it.key === "fabrics_group" ||
        it.key === "reports" ||
        it.key === "settings") &&
      Array.isArray(it.children) &&
      it.children.length > 0;

    if (!isGroup) {
      return (
        <button
          key={it.key}
          className={`nav-btn ${currentPage === it.key ? "active" : ""}`}
          onClick={() => go(it.key)}
          type="button"
        >
          <span className="nav-icon">{it.icon}</span>
          <span className="nav-label">{it.label}</span>

          {it.badge ? (
            <span className="df-nav-badge-wrap">
              <span className="df-nav-badge-pulse" />
              <span className="df-nav-badge">{it.badge}</span>
            </span>
          ) : null}
        </button>
      );
    }

    const parentActive =
      it.key === "dresses"
        ? isDressesSection
        : it.key === "fabrics_group"
          ? isFabricsSection
          : it.key === "reports"
            ? isReportsSection
            : isSettingsSection;

    return (
      <div key={it.key} className="nav-group">
        <button
          className={`nav-btn ${parentActive ? "active" : ""}`}
          onClick={() => go(it.key)}
          type="button"
        >
          <span className="nav-icon">{it.icon}</span>
          <span className="nav-label">{it.label}</span>
        </button>

        {parentActive && (
          <div className="nav-sub">
            {it.children.map((ch) => {
              const hasNestedChildren = Array.isArray(ch.children) && ch.children.length > 0;

              if (!hasNestedChildren) {
                return (
                  <button
                    key={ch.key}
                    className={`nav-sub-btn ${currentPage === ch.key ? "active" : ""}`}
                    onClick={() => go(ch.key)}
                    type="button"
                  >
                    <span className="nav-sub-dot" />
                    <span className="nav-sub-label">{ch.label}</span>
                  </button>
                );
              }

              const nestedActive = ch.children.some((g) => g.key === currentPage);

              return (
                <div key={ch.key} className="nav-sub-group">
                  <div className={`nav-sub-group-title ${nestedActive ? "active" : ""}`}>
                    {ch.label}
                  </div>

                  <div className="nav-sub-nested">
                    {ch.children.map((g) => (
                      <button
                        key={g.key}
                        className={`nav-sub-btn nav-sub-btn-nested ${currentPage === g.key ? "active" : ""}`}
                        onClick={() => go(g.key)}
                        type="button"
                      >
                        <span className="nav-sub-dot" />
                        <span className="nav-sub-label">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="overlay" onClick={() => setSidebarOpen(false)} />

      <aside className="sidebar">
        <div className="brand">
          <div className="sidebar-logo">
            <img src="/dressflow_favicon.png" alt="DressFlow" />
          </div>

          <div className="brand-copy">
            <div className="brand-title">
              <span style={{ fontWeight: 700 }}>DRESS</span>
              <span style={{ fontWeight: 300 }}>FLOW</span>
            </div>
            <div className="brand-sub">{brandSubtitle}</div>
          </div>
        </div>

        <nav className="nav">{navItems.map((it) => renderNavItem(it))}</nav>
      </aside>

      <main className="main">
        <header className="df-topbar">
          <button
            className="btn btn-icon hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
            type="button"
            aria-label="Menu"
            title="Menu"
          >
            ☰
          </button>

          <img
            src="/dressflow_topbar_logo_optical.png"
            alt="DressFlow"
            className="df-topbar-logo"
          />
        </header>

        <section className="df-pagebar">
          <div className="df-pagebar-row">
            <div className="df-pagebar-left">
              <h1 className="df-pagebar-title">{getPageTitle(currentPage)}</h1>
              <div className="df-pagebar-subtitle">{getPageSubtitle(currentPage)}</div>
            </div>

            <div className="df-pagebar-right">
              <div className="df-pagebar-search">
                <span className="df-pagebar-search-icon">⌕</span>
                <input
                  className="df-pagebar-search-input"
                  type="text"
                  placeholder="Buscar..."
                />
              </div>

              <div className="df-pagebar-user">
                <span className="df-pagebar-user-name">{userLabel}</span>

                <div className="df-pagebar-avatar" aria-label={userLabel || "Usuario"}>
                  {!avatarError ? (
                    <img
                      src="/user-avatar.png"
                      alt={userLabel || "Usuario"}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span>{getInitial(userLabel)}</span>
                  )}
                </div>
              </div>

              <button
                className="btn btn-icon"
                onClick={onLogout}
                type="button"
                title="Salir"
                aria-label="Salir"
              >
                ⎋
              </button>
            </div>
          </div>
        </section>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
