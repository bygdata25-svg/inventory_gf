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
import Suppliers from "./pages/Suppliers";
import Dresses from "./pages/Dresses";
import DressLoans from "./pages/DressLoans";
import Badge from "./components/Badge";
import Dashboard from "./pages/Dashboard";
import Capsules from "./pages/Capsules";
import ReportsStock from "./pages/ReportsStock";
import ReportsValuation from "./pages/ReportsValuation";
import ReportsMovements from "./pages/ReportsMovements";
import ReportsDressesStatus from "./pages/ReportsDressesStatus";
import ReportsDressLoans from "./pages/ReportsDressLoans";
import ReportsDressesPopularity from "./pages/ReportsDressesPopularity";
import ReportsDressSales from "./pages/ReportsDressSales";
import { ToastProvider } from "./context/ToastContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://inventory-gf.onrender.com";

export default function App() {
  const [logged, setLogged] = useState(isLoggedIn());
  const [page, setPage] = useState("dashboard");
  const [me, setMe] = useState(null);
  const [sessionMsg, setSessionMsg] = useState("");
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

  async function loadOverdueCount() {
    try {
      const data = await api.request(`${API_BASE}/api/alerts/overdue-loans`);
      setOverdueCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setOverdueCount(0);
    }
  }

  useEffect(() => {
    if (logged) {
      loadMe().catch(() => {});
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
        {
          key: "reports_dresses_group",
          label: "Vestidos",
          children: [
            { key: "reports_dresses_status", label: "Estado de vestidos" },
            { key: "reports_dress_loans", label: "Préstamos" },
            { key: "reports_dresses_popularity", label: "Vestidos más usados" },
            { key: "reports_dress_sales", label: "Ventas de vestidos" }
          ]
        },
        {
          key: "reports_fabrics_group",
          label: "Telas",
          children: [
            { key: "reports_stock", label: t("reports.menu.stock.title") || "Stock actual" },
            { key: "reports_valuation", label: t("reports.menu.values.title") || "Valuación" },
            { key: "reports_movements", label: t("reports.menu.movements.title") || "Movimientos" }
          ]
        }
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
    reports_dresses_status: "Estado de vestidos",
    reports_dress_loans: "Préstamos",
    reports_dresses_popularity: "Vestidos más usados",
    reports_dress_sales: "Ventas de vestidos",
    reports_stock: t("reports.menu.stock.title") || "Stock actual",
    reports_valuation: t("reports.menu.values.title") || "Valuación",
    reports_movements: t("reports.menu.movements.title") || "Movimientos",

    settings: "Ajustes",
    users: "Usuarios",
    suppliers: "Proveedores",
    customers: "Clientes"
  };

  return (
    <ToastProvider>
      <Layout
        brandTitle="DRESSFLOW"
        brandSubtitle="AI • FASHION • ERP"
        navItems={navItems}
        currentPage={page}
        onNavigate={setPage}
        headerTitle={pageTitleMap[page] || "DRESSFLOW"}
        headerSubtitle="AI • FASHION • ERP"
        userLabel={username}
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

        {page === "reports" && (
          <div className="card">
            Seleccioná un reporte desde el menú lateral.
          </div>
        )}
        {page === "reports_dresses_status" && (
          <ReportsDressesStatus api={api} apiBase={API_BASE} role={role} />
        )}
        {page === "reports_dress_loans" && <ReportsDressLoans />}
        {page === "reports_dresses_popularity" && <ReportsDressesPopularity />}
        {page === "reports_dress_sales" && <ReportsDressSales />}

        {page === "reports_stock" && (
          <ReportsStock api={api} apiBase={API_BASE} role={role} />
        )}

        {page === "reports_valuation" && (
          <ReportsValuation api={api} apiBase={API_BASE} role={role} />
        )}

        {page === "reports_movements" && (
          <ReportsMovements api={api} apiBase={API_BASE} role={role} />
        )}

        {page === "users" && role === "ADMIN" && <Users api={api} apiBase={API_BASE} role={role} />}
        {page === "suppliers" && <Suppliers api={api} apiBase={API_BASE} role={role} />}

        {page === "customers" && (
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              Clientes
            </div>
            <div className="page-sub">Próximamente.</div>
          </div>
        )}
      </Layout>
    </ToastProvider>
  );
}
