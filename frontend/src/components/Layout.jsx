import { useEffect, useMemo, useState } from "react";

export default function Layout({
  brandTitle,
  brandSubtitle,
  navItems,
  currentPage,
  onNavigate,
  headerTitle,
  headerSubtitle,
  userLabel,
  onLogout,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    const dressesItem = navItems.find((x) => x.key === "dresses");
    return dressesItem?.children || [];
  }, [navItems]);

  const fabricsChildren = useMemo(() => {
    const fabricsItem = navItems.find((x) => x.key === "fabrics_group");
    return fabricsItem?.children || [];
  }, [navItems]);

  const reportsChildren = useMemo(() => {
    const reportsItem = navItems.find((x) => x.key === "reports");
    return reportsItem?.children || [];
  }, [navItems]);

  const settingsChildren = useMemo(() => {
    const settingsItem = navItems.find((x) => x.key === "settings");
    return settingsItem?.children || [];
  }, [navItems]);

  const isDressesSection = useMemo(() => {
    if (currentPage === "dresses") return true;
    return dressesChildren.some((c) => c.key === currentPage);
  }, [currentPage, dressesChildren]);

  const isFabricsSection = useMemo(() => {
    if (currentPage === "fabrics_group") return true;
    return fabricsChildren.some((c) => c.key === currentPage);
  }, [currentPage, fabricsChildren]);

  const isReportsSection = useMemo(() => {
    if (currentPage === "reports") return true;
    return reportsChildren.some((c) => c.key === currentPage);
  }, [currentPage, reportsChildren]);

  const isSettingsSection = useMemo(() => {
    if (currentPage === "settings") return true;
    return settingsChildren.some((c) => c.key === currentPage);
  }, [currentPage, settingsChildren]);

  function renderNavItem(it) {
    const isGroup =
      (it.key === "dresses" || it.key === "fabrics_group" || it.key === "reports" || it.key === "settings") &&
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
            {it.children.map((ch) => {
              const childActive = currentPage === ch.key;
              return (
                <button
                  key={ch.key}
                  className={`nav-sub-btn ${childActive ? "active" : ""}`}
                  onClick={() => go(ch.key)}
                  type="button"
                >
                  <span className="nav-sub-dot" />
                  <span className="nav-sub-label">{ch.label}</span>
                </button>
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
            <img src="/dressflow-logo-black.png" alt="DressFlow" />
          </div>
          <div>
            <div className="brand-title">{brandTitle}</div>
            <div className="brand-sub">{brandSubtitle}</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((it) => renderNavItem(it))}
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            <button
              className="btn btn-icon hamburger"
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Menu"
              title="Menu"
            >
              ☰
            </button>

            <div className="header-brand-block">
              <div className="header-brand-title">DRESSFLOW</div>
              <div className="header-brand-sub">AI • FASHION • ERP</div>
            </div>
          </div>

          <div className="header-right">
            <div className="header-search">
              <span className="header-search-icon">⌕</span>
              <input
                className="header-search-input"
                type="text"
                placeholder="Buscar..."
              />
            </div>

            <div className="header-user">
              <div className="header-user-name">{userLabel}</div>
              <div className="header-user-avatar">
                <img src="/user-avatar.png" alt={userLabel || "Usuario"} />
              </div>
            </div>

            <button className="btn btn-icon" onClick={onLogout} type="button" title="Salir">
              ⎋
            </button>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
