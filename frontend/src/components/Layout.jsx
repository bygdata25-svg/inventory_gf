import { useEffect, useMemo, useState } from "react";

function getInitial(userLabel) {
  if (!userLabel) return "U";
  return String(userLabel).trim().charAt(0).toUpperCase();
}

export default function Layout({
  brandTitle,
  brandSubtitle,
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
              <span className="brand-title-strong">{brandTitle || "DRESS"}</span>
              <span className="brand-title-light">
                {brandTitle ? "" : "FLOW"}
              </span>
              {brandTitle === "DRESSFLOW" ? "" : null}
            </div>

            <div className="brand-sub">{brandSubtitle || "AI • FASHION • ERP"}</div>
          </div>
        </div>

        <nav className="nav">{navItems.map((it) => renderNavItem(it))}</nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="btn btn-icon hamburger"
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Menu"
            title="Menu"
          >
            ☰
          </button>

          <img
            src="/dressflow_topbar_logo_optical.png"
            alt="DressFlow"
            className="topbar-logo"
          />
        </header>

        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Hola, {userLabel} ✦</h1>
            <div className="page-subtitle">
              Bienvenido a tu panel de control de DressFlow
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

              <div className="page-avatar" aria-label={userLabel || "Usuario"}>
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
              className="btn btn-icon logout-btn"
              onClick={onLogout}
              type="button"
              title="Salir"
              aria-label="Salir"
            >
              ⎋
            </button>
          </div>
        </div>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
