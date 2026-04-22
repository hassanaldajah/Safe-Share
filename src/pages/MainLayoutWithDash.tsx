import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { useAuth } from "@/context/AuthContext";

const MainLayoutWithDash = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");
  const { isAuthenticated } = useAuth();

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // On mobile: sidebar is an overlay controlled by mobileOpen.
  // On desktop: sidebar is always visible, width driven by sidebarCollapsed.
  const desktopMargin = sidebarCollapsed ? "lg:ml-16" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Mobile Overlay Backdrop ─────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activeNavItem}
        onItemClick={(item) => {
          setActiveNavItem(item);
          setMobileOpen(false); // close on mobile after navigation
        }}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Top Bar ─────────────────────────────────── */}
      <DashboardTopBar
        sidebarCollapsed={sidebarCollapsed}
        onHamburgerClick={() => setMobileOpen(!mobileOpen)}
      />

      {/* ── Main Content ────────────────────────────── */}
      <main
        className={`pt-16 transition-all duration-300 ${desktopMargin}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayoutWithDash;