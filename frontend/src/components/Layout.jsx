// frontend/src/components/Layout.jsx
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
  roleLabel,
  onLogout,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar sidebar al navegar (mobile)
  function go(pageKey) {
    onNavigate(pageKey);
    setSidebarOpen(false);
  }

  // Cerrar con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Detectar si el currentPage pertenece a reportes
  const reportChildren = useMemo(() => {
    const reportsItem = navItems.find((x) => x.key === "reports");
    return reportsItem?.children || [];
  }, [navItems]);

  const isReportsSection = useMemo(() => {
    if (currentPage === "reports") return true;
    return reportChildren.some((c) => c.key === currentPage);
  }, [currentPage, reportChildren]);

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* overlay (solo mobile) */}
      <div className="overlay" onClick={() => setSidebarOpen(false)} />

      <aside className="sidebar">
        <div className="brand">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Fabric Inventory" />
          </div>
          <div>
            <div className="brand-title">{brandTitle}</div>
            <div className="brand-sub">{brandSubtitle}</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((it) => {
            // Reportes: render padre + hijos
            if (it.key === "reports" && Array.isArray(it.children) && it.children.length > 0) {
              const parentActive = isReportsSection;

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

                  {/* Opción 1: mostrar hijos cuando estás en Reportes */}
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

            // Default item
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
          })}
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <div className="header-left">
            {/* botón hamburguesa (solo mobile) */}
            <button
              className="btn btn-icon hamburger"
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Menu"
              title="Menu"
            >
              ☰
            </button>

            <div>
              <div className="page-title">{headerTitle}</div>
              <div className="page-sub">{headerSubtitle}</div>
            </div>
          </div>

          <div className="header-right">
            <span className="pill">
              {userLabel}: <b style={{ marginLeft: 4 }}>{roleLabel}</b>
            </span>

            <button className="btn" onClick={onLogout} type="button" title="Salir">
              ⎋
            </button>
          </div>
        </header>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}

