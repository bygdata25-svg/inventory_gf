import { useEffect, useMemo, useState } from "react";
import Login from "./pages/Login";
import Movements from "./pages/Movements";
import Rolls from "./pages/Rolls";
import Fabrics from "./pages/Fabrics";
import Users from "./pages/Users";
import Layout from "./components/Layout";
import { clearAuth, getRole, isLoggedIn } from "./auth";
import { makeApiClient } from "./api";
import { t } from "./i18n";
import { IconFabric, IconRoll, IconMove, IconUsers, IconReport } from "./components/Icons";
import Reports from "./pages/Reports";
import Suppliers from "./pages/Suppliers";
import { IconSupplier } from "./components/Icons";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://gilbert-hands-charleston-review.trycloudflare.com";

export default function App() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [page, setPage] = useState("movements");
  const [me, setMe] = useState(null);
  const [sessionMsg, setSessionMsg] = useState("");

  const api = useMemo(
    () =>
      makeApiClient({
        onUnauthorized: () => {
          setSessionMsg(t("ui.sessionExpired"));
          setLogged(false);
          setMe(null);
        }
      }),
    []
  );

  async function loadMe() {
    const data = await api.request(`${API_BASE}/api/auth/me`);
    setMe(data);
  }

  useEffect(() => {
    if (logged) {
      loadMe().catch(() => {
        // ignore
      });
    }
  }, [logged]);

  function logout() {
    clearAuth();
    setLogged(false);
    setMe(null);
  }

  if (!logged) {
    return (
      <>
        {sessionMsg && (
          <div className="alert alert-warn" style={{ margin: 12 }}>
            {sessionMsg}
          </div>
        )}
        <Login
          onLoggedIn={() => {
            setSessionMsg("");
            setLogged(true);
          }}
        />
      </>
    );
  }

  const role = me?.role || getRole();
  const username = me?.username || "-";

  const navItems = [
    { key: "fabrics", label: t("nav.fabrics"), icon: <IconFabric /> },
    { key: "suppliers", label: t("nav.suppliers"), icon: <IconSupplier /> },
    { key: "rolls", label: t("nav.rolls"), icon: <IconRoll /> },
    { key: "movements", label: t("nav.movements"), icon: <IconMove /> },

    // ✅ Reportes con submenu
    {
      key: "reports",
      label: t("nav.reports"),
      icon: <IconReport />,
      children: [
        { key: "reports_stock", label: t("reports.menu.stock.title") || "Stock actual" },
        { key: "reports_valuation", label: t("reports.menu.values.title") || "Valuación" },
        { key: "reports_movements", label: t("reports.menu.movements.title") || "Movimientos" }
      ]
    }
  ];

  if (role === "ADMIN") {
    navItems.push({ key: "users", label: t("nav.users"), icon: <IconUsers /> });
  }

  const pageTitleMap = {
    fabrics: t("nav.fabrics"),
    suppliers: t("nav.suppliers"),
    rolls: t("nav.rolls"),
    movements: t("nav.movements"),
    users: t("nav.users"),

    reports_stock: t("reports.menu.stock.title") || t("nav.reports"),
    reports_valuation: t("reports.menu.values.title") || t("nav.reports"),
    reports_movements: t("reports.menu.movements.title") || t("nav.reports")
  };

  return (
    <Layout
      brandTitle={t("app.title")}
      brandSubtitle={t("app.subtitle")}
      navItems={navItems}
      currentPage={page}
      onNavigate={setPage}
      headerTitle={pageTitleMap[page] || t("app.title")}
      headerSubtitle={t("app.subtitle")}
      userLabel={username}
      roleLabel={role}
      onLogout={logout}
    >
      {page === "fabrics" && <Fabrics api={api} apiBase={API_BASE} role={role} />}
      {page === "rolls" && <Rolls api={api} apiBase={API_BASE} role={role} />}
      {page === "movements" && <Movements api={api} apiBase={API_BASE} role={role} />}
      {page === "users" && role === "ADMIN" && <Users api={api} apiBase={API_BASE} role={role} />}
      {page === "suppliers" && <Suppliers api={api} apiBase={API_BASE} role={role} />}

      {/* ✅ Los 3 reportes usan la misma página Reports, que decide qué mostrar */}
      {page === "reports" && <Reports api={api} apiBase={API_BASE} role={role} />}
      {page === "reports-stock" && <Reports api={api} apiBase={API_BASE} role={role} initial="stock" />}
      {page === "reports-valuation" && <Reports api={api} apiBase={API_BASE} role={role} initial="valuation" />}
      {page === "reports-movements" && <Reports api={api} apiBase={API_BASE} role={role} initial="movements" />}

    </Layout>
  );
}

