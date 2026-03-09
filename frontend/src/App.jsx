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
import {
  IconFabric,
  IconRoll,
  IconMove,
  IconUsers,
  IconReport,
  IconSupplier
} from "./components/Icons";
import Reports from "./pages/Reports";
import Suppliers from "./pages/Suppliers";

// ✅ NUEVO: páginas para Vestidos / Préstamos
import Dresses from "./pages/Dresses";
import DressLoans from "./pages/DressLoans";
import Badge from "./components/Badge";
import Dashboard from "./pages/Dashboard";
import Capsules from "./pages/Capsules";

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://inventory-gf.onrender.com";

export default function App() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [page, setPage] = useState("dashboard");
  const [me, setMe] = useState(null);
  const [sessionMsg, setSessionMsg] = useState("");

  // ✅ NUEVO: contador de vencidos
  const [overdueCount, setOverdueCount] = useState(0);

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

  // ✅ NUEVO: traer vencidos (alerta)
  async function loadOverdueCount() {
    try {
      const data = await api.request(`${API_BASE}/api/alerts/overdue-loans`);
      setOverdueCount(Array.isArray(data) ? data.length : 0);
    } catch {
      // si algo falla, no rompemos la UI
      setOverdueCount(0);
    }
  }

  useEffect(() => {
    if (logged) {
      loadMe().catch(() => {
        // ignore
      });

      // cargar vencidos al inicio y refrescar cada 60s
      loadOverdueCount();
      const id = setInterval(loadOverdueCount, 60000);
      return () => clearInterval(id);
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
  { key: "dashboard", label: "Inicio", icon: <IconReport /> },

  {
    key: "dresses",
    label: "Vestidos",
    icon: <IconFabric />,
    children: [
      { key: "dresses_create", label: "Crear vestido" },
      { key: "dresses_list", label: "Listar vestidos" }
    ]
  },

  { key: "capsules", label: "Cápsulas", icon: <IconFabric /> },

  {
    key: "fabrics_group",
    label: "Telas",
    icon: <IconFabric />,
    children: [
      { key: "fabrics", label: "Telas" },
      { key: "rolls", label: "Rollos" },
      { key: "movements", label: "Movimientos de rollos" }
    ]
  },

  {
    key: "dress_loans",
    label: (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        Préstamos
        {overdueCount > 0 && (
          <Badge variant="red" pulse>
            {overdueCount}
          </Badge>
        )}
      </span>
    ),
    icon: <IconMove />
  },

  {
    key: "reports",
    label: "Reportes",
    icon: <IconReport />,
    children: [
      { key: "reports_stock", label: t("reports.menu.stock.title") || "Stock actual" },
      { key: "reports_valuation", label: t("reports.menu.values.title") || "Valuación" },
      { key: "reports_movements", label: t("reports.menu.movements.title") || "Movimientos" }
    ]
  },

  {
    key: "settings",
    label: "Ajustes",
    icon: <IconUsers />,
    children: [
      { key: "users", label: "Usuarios" },
      { key: "suppliers", label: "Proveedores" },
      { key: "customers", label: "Clientes" }
    ]
  }
];

const pageTitleMap = {
  dashboard: "Inicio",

  dresses: "Vestidos",
  dresses_create: "Crear vestido",
  dresses_list: "Listar vestidos",

  capsules: "Cápsulas",

  fabrics_group: "Telas",
  fabrics: "Telas",
  rolls: "Rollos",
  movements: "Movimientos de rollos",

  dress_loans: "Préstamos",

  reports: "Reportes",
  reports_stock: t("reports.menu.stock.title") || "Stock actual",
  reports_valuation: t("reports.menu.values.title") || "Valuación",
  reports_movements: t("reports.menu.movements.title") || "Movimientos",

  settings: "Ajustes",
  users: "Usuarios",
  suppliers: "Proveedores",
  customers: "Clientes"
};
  return (
    <Layout
      brandTitle="DRESSFLOW"
      brandSubtitle="AI • FASHION • ERP"
      navItems={navItems}
      currentPage={page}
      onNavigate={setPage}
      headerTitle={pageTitleMap[page] || t("app.title")}
      headerSubtitle="AI • FASHION • ERP"
      userLabel={username}
      roleLabel={role}
      onLogout={logout}
    >
    {page === "dashboard" && (
  <Dashboard
    api={api}
    apiBase={API_BASE}
    username={username}
  />
)}

{page === "dresses_create" && <Dresses api={api} apiBase={API_BASE} role={role} mode="create" />}
{page === "dresses_list" && <Dresses api={api} apiBase={API_BASE} role={role} mode="list" />}

{page === "capsules" && <Capsules api={api} apiBase={API_BASE} role={role} />}

{page === "fabrics" && <Fabrics api={api} apiBase={API_BASE} role={role} />}
{page === "rolls" && <Rolls api={api} apiBase={API_BASE} role={role} />}
{page === "movements" && <Movements api={api} apiBase={API_BASE} role={role} />}

{page === "dress_loans" && <DressLoans api={api} apiBase={API_BASE} role={role} />}

{page === "reports" && <Reports api={api} apiBase={API_BASE} role={role} />}
{page === "reports_stock" && <Reports api={api} apiBase={API_BASE} role={role} initial="stock" />}
{page === "reports_valuation" && <Reports api={api} apiBase={API_BASE} role={role} initial="valuation" />}
{page === "reports_movements" && <Reports api={api} apiBase={API_BASE} role={role} initial="movements" />}

{page === "users" && role === "ADMIN" && <Users api={api} apiBase={API_BASE} role={role} />}
{page === "suppliers" && <Suppliers api={api} apiBase={API_BASE} role={role} />}

{page === "customers" && (
  <div className="card">
    <h3>Clientes</h3>
    <div className="page-sub">Próximamente.</div>
  </div>
)}
    </Layout>
  );
}
