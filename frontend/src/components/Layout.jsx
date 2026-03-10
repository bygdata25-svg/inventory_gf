import { useEffect, useMemo, useState } from "react";

function getInitial(userLabel) {
  if (!userLabel) return "U";
  return String(userLabel).trim().charAt(0).toUpperCase();
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

  /* -------------------------------------------------- */
  /* PAGE TITLE / SUBTITLE */
  /* -------------------------------------------------- */

  function getPageTitle(pageKey) {

    if (pageKey === "dashboard") {
      return `Hola, ${userLabel} ✦`;
    }

    for (const item of navItems) {

      if (item.key === pageKey) return item.label;

      if (Array.isArray(item.children)) {
        const child = item.children.find((c) => c.key === pageKey);
        if (child) return child.label;
      }

    }

    return brandTitle;
  }

  function getPageSubtitle(pageKey) {

    switch (pageKey) {

      case "dashboard":
        return "Bienvenido a tu panel de control de DressFlow";

      case "dresses":
      case "dress_create":
      case "dress_list":
        return "Gestioná tu catálogo de vestidos, estados y disponibilidad.";

      case "capsules":
        return "Organizá cápsulas y colecciones.";

      case "fabrics_group":
      case "fabrics":
      case "fabric_rolls":
      case "fabric_movements":
        return "Controlá telas, rollos y movimientos de stock.";

      case "loans":
        return "Administrá préstamos y devoluciones de prendas.";

      case "reports":
        return "Visualizá reportes y métricas de tu operación.";

      case "settings":
      case "users":
      case "suppliers":
      case "clients":
        return "Configurá usuarios, clientes y parámetros del sistema.";

      default:
        return "";

    }

  }

  /* -------------------------------------------------- */
  /* NAVIGATION */
  /* -------------------------------------------------- */

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
    return item?.children || [];
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
            <span className="nav-badge-wrap">
              <span className="nav-badge-pulse" />
              <span className="nav-badge">{it.badge}</span>
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

            {it.children.map((ch) => (

              <button
                key={ch.key}
                className={`nav-sub-btn ${currentPage === ch.key ? "active" : ""}`}
                onClick={() => go(ch.key)}
                type="button"
              >
                <span className="nav-sub-dot" />
                <span className="nav-sub-label">{ch.label}</span>
              </button>

            ))}

          </div>

        )}

      </div>
    );
  }

  /* -------------------------------------------------- */
  /* RENDER */
  /* -------------------------------------------------- */

  return (

    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>

      <div className="overlay" onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="sidebar-logo">
            <img src="/dressflow_favicon.png" alt="DressFlow" />
          </div>

          <div className="brand-copy">
            <div className="brand-title">
              <span className="brand-title-strong">DRESS</span>
              <span className="brand-title-light">FLOW</span>
            </div>

            <div className="brand-sub">{brandSubtitle}</div>
          </div>

        </div>

        <nav className="nav">
          {navItems.map((it) => renderNavItem(it))}
        </nav>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <button
            className="btn btn-icon hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>

          <img
            src="/dressflow_topbar_logo_optical.png"
            alt="DressFlow"
            className="topbar-logo"
          />

        </header>

        {/* PAGE HEADER */}

        <section className="page-header">

          <div className="page-header-row">

            <div className="page-header-left">

              <h1 className="page-title">
                {getPageTitle(currentPage)}
              </h1>

              <div className="page-subtitle">
                {getPageSubtitle(currentPage)}
              </div>

            </div>

            <div className="page-header-right">

              <div className="page-search">

                <span className="page-search-icon">⌕</span>

                <input
                  className="page-search-input"
                  type="text"
                  placeholder="Buscar..."
                />

              </div>

              <div className="page-user">

                <span className="page-user-name">{userLabel}</span>

                <div className="page-avatar">

                  {!avatarError ? (

                    <img
                      src="/user-avatar.png"
                      alt={userLabel}
                      onError={() => setAvatarError(true)}
                    />

                  ) : (

                    <span>{getInitial(userLabel)}</span>

                  )}

                </div>

              </div>

              <button
                className="btn btn-icon logout-btn"
                onClick={onLogout}
              >
                ⎋
              </button>

            </div>

          </div>

        </section>

        {/* CONTENT */}

        <div className="content">
          {children}
        </div>

      </main>

    </div>

  );
}
