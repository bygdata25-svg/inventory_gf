import { useEffect, useState } from "react";

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

  function isGroupActive(item) {
    if (currentPage === item.key) return true;
    return Array.isArray(item.children) && item.children.some((c) => c.key === currentPage);
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
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
            if (Array.isArray(it.children) && it.children.length > 0) {
              const parentActive = isGroupActive(it);

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
