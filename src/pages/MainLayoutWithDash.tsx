import { useState } from "react";
import { Outlet } from "react-router-dom"; // Don't forget this import!
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";

const MainLayoutWithDash = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

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