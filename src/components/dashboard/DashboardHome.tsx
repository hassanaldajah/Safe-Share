import { useState, useEffect } from "react";
import { 
  HardDrive, 
  Database, 
  Send, 
  Inbox, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { QuickCreateButtons } from "@/components/dashboard/QuickCreateButtons";
import { Progress } from "@/components/ui/progress";
import { authFetch } from "@/lib/api";
// --- TYPES ---
interface DashboardStats {
  totalFiles: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  totalSharedSent: number;
  totalSharedReceived: number;
}

// --- HELPER FUNCTION ---
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await authFetch("http://localhost:8080/api/v1/files/stats");

        if (!response.ok) throw new Error("Failed to load dashboard statistics");

        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculate storage percentage safely
  const storagePercentage = stats 
    ? Math.min((stats.storageUsedBytes / stats.storageLimitBytes) * 100, 100) 
    : 0;

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-slate-50/50">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1 text-slate-500">
          Here is an overview of your secure vault and sharing activity.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* --- DYNAMIC STATS SECTION --- */}
      {isLoading ? (
        // Loading Skeleton
        <div className="mb-8 space-y-6">
          <div className="h-40 bg-slate-200 rounded-2xl animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      ) : stats ? (
        <div className="mb-8 space-y-6">
          
          {/* Storage Hero Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <HardDrive className="h-32 w-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Database className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Storage Overview</h2>
              </div>

              <div className="mb-3 flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold text-slate-900">
                    {formatBytes(stats.storageUsedBytes)}
                  </span>
                  <span className="text-slate-500 ml-2 font-medium">
                    used of {formatBytes(stats.storageLimitBytes)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {storagePercentage.toFixed(1)}%
                </span>
              </div>
              
              <Progress value={storagePercentage} className="h-3 bg-slate-100" />
            </div>
          </div>

          {/* 3 Quick Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Files */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Files</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalFiles}</p>
              </div>
            </div>

            {/* Links Sent */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Files Shared By You</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalSharedSent}</p>
              </div>
            </div>

            {/* Links Received */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Inbox className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Files Received</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalSharedReceived}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* --- BOTTOM GRID (Existing Components) --- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityFeed />
        </div>

        {/* Right Column - Quick Actions */}
        <div>
          <QuickCreateButtons />
        </div>
      </div>

    </div>
  );
}