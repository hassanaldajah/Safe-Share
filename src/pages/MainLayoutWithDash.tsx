import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { QuickCreateButtons } from "@/components/dashboard/QuickCreateButtons";
import { StorageWidget } from "@/components/dashboard/StorageWidget";
import { ActivityLogWidget } from "@/components/dashboard/ActivityLogWidget";
const MainLayoutWithDash = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeItem={activeNavItem}
        onItemClick={setActiveNavItem}
      />

      {/* Top Bar */}
      <DashboardTopBar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <main
        className="pt-16 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "64px" : "256px" }}
      >
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Welcome back, Motasem</h1>
            <p className="mt-1 text-muted-foreground">Here's what's happening with your files today.</p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Activity Feed */}
            <div className="lg:col-span-2 space-y-6">
              <RecentActivityFeed />
              <ActivityLogWidget />
            </div>

            {/* Right Column - Quick Actions & Storage */}
            <div className="space-y-6">
              <QuickCreateButtons />
              <StorageWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayoutWithDash;
