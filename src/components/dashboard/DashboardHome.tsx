import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { QuickCreateButtons } from "@/components/dashboard/QuickCreateButtons";
import { StorageWidget } from "@/components/dashboard/StorageWidget";
import { ActivityLogWidget } from "@/components/dashboard/ActivityLogWidget";

const DashboardHome = () => {
  return (
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
  );
};

export default DashboardHome;