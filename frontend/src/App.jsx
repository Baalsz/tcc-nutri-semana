import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Container from "./components/Container.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import { useAuth } from "./state/auth.jsx";
import { useDevice } from "./hooks/useDevice.js";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PlanoPage from "./pages/PlanoPage.jsx";
import ComprasPage from "./pages/ComprasPage.jsx";
import PerfilPage from "./pages/PerfilPage.jsx";
import AdminFoodsPage from "./pages/AdminFoodsPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminDatabasePage from "./pages/AdminDatabasePage.jsx";

function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <Navigate to="/app/dashboard" replace />;
  return children;
}

function AppShell() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDesktop } = useDevice();

  const onNavigate = () => setMobileOpen(false);
  const sidebarNode = useMemo(
    () => <Sidebar user={user} onLogout={logout} onNavigate={onNavigate} />,
    [user],
  );

  // Se virar desktop (resize/orientação), fecha menu mobile automaticamente
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  return (
    <div className="min-h-dvh">
      <Navbar onOpenMenu={() => setMobileOpen(true)} />

      <div className="w-full">
        <aside className="fixed inset-y-0 left-0 hidden w-[280px] border-r-2 border-emerald-100/80 bg-gradient-to-b from-emerald-50/90 via-white/80 to-amber-50/50 pt-16 backdrop-blur-md lg:block xl:w-[300px] 2xl:w-[320px]">
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">{sidebarNode}</div>
        </aside>

        <main className="py-4 sm:py-6 lg:pb-8 lg:pl-[280px] xl:pl-[300px] 2xl:pl-[320px]">
          <Container className="mx-0">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/plano" element={<PlanoPage />} />
              <Route path="/compras" element={<ComprasPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route
                path="/admin/painel"
                element={
                  <AdminOnly>
                    <AdminDashboardPage />
                  </AdminOnly>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <AdminOnly>
                    <AdminUsersPage />
                  </AdminOnly>
                }
              />
              <Route
                path="/admin/alimentos"
                element={
                  <AdminOnly>
                    <AdminFoodsPage />
                  </AdminOnly>
                }
              />
              <Route
                path="/admin/banco"
                element={
                  <AdminOnly>
                    <AdminDatabasePage />
                  </AdminOnly>
                }
              />
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
            <SiteFooter />
          </Container>
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-emerald-100/80 bg-white/95 shadow-soft backdrop-blur-lg">
            <Sidebar
              user={user}
              onLogout={() => {
                setMobileOpen(false);
                logout();
              }}
              onNavigate={onNavigate}
              compact
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/app/*"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

