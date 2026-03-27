import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom"; // Added Navigate here
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { useAuth } from "@/context/AuthContext"; // Import your auth hook

const MainLayoutWithDash = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

  // Grab the authentication status from your global state
  const { isAuthenticated } = useAuth();

  // 🔒 THE GUARD: If they are not logged in, kick them to the sign-in page
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // If they ARE logged in, render the layout normally
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Persists across pages */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activeNavItem}
        onItemClick={setActiveNavItem}
      />

      {/* Top Bar - Persists across pages */}
      <DashboardTopBar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content Area - Changes based on route */}
      <main
        className="pt-16 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "64px" : "256px" }}
      >
        {/* The Outlet renders either <DashboardHome /> or <MyFolders /> */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayoutWithDash;