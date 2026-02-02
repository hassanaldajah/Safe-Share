import { useState } from "react";
import {
  Cloud,
  CloudDownload,
  CloudUpload,
  Database,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Download,
  Upload,
  Calendar,
  History,
  Shield,
  Zap,
  Info,
  ChevronRight,
  Loader2,
  RefreshCw,
  FolderOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/components/dashboard/FoldersContext";

interface BackupJob {
  id: string;
  name: string;
  type: "full" | "incremental" | "differential";
  status: "completed" | "in-progress" | "failed" | "scheduled";
  startTime: string;
  endTime?: string;
  size: string;
  filesCount: number;
  includesTrash: boolean;
}

interface BackupSchedule {
  id: string;
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  enabled: boolean;
  nextRun: string;
  type: "full" | "incremental";
}

export function BackupPage() {
  const { files, trashedFiles, getTotalStorage } = useFolders();
  const storage = getTotalStorage();

  const [activeTab, setActiveTab] = useState<"overview" | "history" | "schedule">("overview");
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Mock backup history
  const [backupHistory] = useState<BackupJob[]>([
    {
      id: "1",
      name: "Full Backup - January 27, 2026",
      type: "full",
      status: "completed",
      startTime: "2026-01-27T02:00:00",
      endTime: "2026-01-27T02:15:00",
      size: "171.3 MB",
      filesCount: 5,
      includesTrash: true,
    },
    {
      id: "2",
      name: "Incremental Backup - January 26, 2026",
      type: "incremental",
      status: "completed",
      startTime: "2026-01-26T02:00:00",
      endTime: "2026-01-26T02:05:00",
      size: "23.4 MB",
      filesCount: 2,
      includesTrash: true,
    },
    {
      id: "3",
      name: "Full Backup - January 20, 2026",
      type: "full",
      status: "completed",
      startTime: "2026-01-20T02:00:00",
      endTime: "2026-01-20T02:12:00",
      size: "148.7 MB",
      filesCount: 4,
      includesTrash: false,
    },
  ]);

  const [backupSchedule] = useState<BackupSchedule[]>([
    {
      id: "1",
      frequency: "daily",
      time: "02:00",
      enabled: true,
      nextRun: "2026-01-28T02:00:00",
      type: "incremental",
    },
    {
      id: "2",
      frequency: "weekly",
      time: "03:00",
      enabled: true,
      nextRun: "2026-02-01T03:00:00",
      type: "full",
    },
  ]);

  const handleBackupNow = () => {
    setIsBackingUp(true);
    // Simulate backup process
    setTimeout(() => {
      setIsBackingUp(false);
    }, 3000);
  };

  const getStatusIcon = (status: BackupJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in-progress":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "scheduled":
        return <Clock className="h-5 w-5 text-orange-600" />;
    }
  };

  const getBackupTypeColor = (type: BackupJob["type"]) => {
    switch (type) {
      case "full":
        return "bg-purple-100 text-purple-700";
      case "incremental":
        return "bg-blue-100 text-blue-700";
      case "differential":
        return "bg-green-100 text-green-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateBackupCoverage = () => {
    const activeFiles = files.filter((f) => f.type === "file").length;
    const trashedItems = trashedFiles.length;
    return {
      active: activeFiles,
      trashed: trashedItems,
      total: activeFiles + trashedItems,
    };
  };

  const coverage = calculateBackupCoverage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Backup & Recovery</h1>
                <p className="text-sm text-gray-600">
                  Automatic backups • 30-day retention • Point-in-time recovery
                </p>
              </div>
            </div>

            <button
              onClick={handleBackupNow}
              disabled={isBackingUp}
              className={cn(
                "px-4 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md",
                isBackingUp
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" />
                  Backup Now
                </>
              )}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
            >
              Backup History
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "schedule"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
            >
              Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Last Backup */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-500">Last 24 hours</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Last Backup</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(backupHistory[0].endTime!).split(",")[0]}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {backupHistory[0].filesCount} files • {backupHistory[0].size}
                </p>
              </div>

              {/* Next Backup */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Scheduled</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Next Backup</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(backupSchedule[0].nextRun).split(",")[0]}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {backupSchedule[0].frequency.charAt(0).toUpperCase() +
                    backupSchedule[0].frequency.slice(1)}{" "}
                  at {backupSchedule[0].time}
                </p>
              </div>

              {/* Total Backed Up */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <HardDrive className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-500">Current</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Backup Size</h3>
                <p className="text-2xl font-bold text-gray-900">{storage.usedFormatted}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Active + Trash
                </p>
              </div>
            </div>

            {/* Backup Strategy Info */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Comprehensive Backup Strategy
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>All active files backed up:</strong> {coverage.active} active files
                        including folders and all file types
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Trash included:</strong> {coverage.trashed} items in trash are backed
                        up for 30-day retention period
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Automatic cleanup:</strong> Files permanently deleted are removed from
                        backups immediately
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>Group files included:</strong> All shared and group files are backed up
                        automatically
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Coverage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                Backup Coverage
              </h3>
              <div className="space-y-4">
                {/* Active Files */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Active Files & Folders</p>
                      <p className="text-sm text-gray-600">Currently in use</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">{coverage.active}</p>
                    <p className="text-sm text-green-600">files</p>
                  </div>
                </div>

                {/* Trash Files */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Database className="h-5 w-5 text-orange-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Trash Files (30-day retention)</p>
                      <p className="text-sm text-gray-600">Recoverable backups</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-700">{coverage.trashed}</p>
                    <p className="text-sm text-orange-600">items</p>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CloudUpload className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Total Backed Up</p>
                      <p className="text-sm text-gray-600">Complete protection</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-700">{coverage.total}</p>
                    <p className="text-sm text-blue-600">items</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <CloudDownload className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Restore from Backup</h4>
                  <p className="text-sm text-gray-600">Recover files from previous backups</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left group">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Download Backup</h4>
                  <p className="text-sm text-gray-600">Export backup archive locally</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Recent Backups</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {backupHistory.map((backup) => (
                  <div
                    key={backup.id}
                    className="p-6 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{getStatusIcon(backup.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">{backup.name}</h4>
                            <span
                              className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                getBackupTypeColor(backup.type)
                              )}
                            >
                              {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Started</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(backup.startTime)}
                              </p>
                            </div>
                            {backup.endTime && (
                              <div>
                                <p className="text-gray-500">Completed</p>
                                <p className="font-medium text-gray-900">
                                  {formatDate(backup.endTime)}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-500">Size</p>
                              <p className="font-medium text-gray-900">{backup.size}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Files</p>
                              <p className="font-medium text-gray-900">
                                {backup.filesCount} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            {backup.includesTrash && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Database className="h-3.5 w-3.5" />
                                Includes trash
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors">
                          <CloudDownload className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-purple-50 text-gray-600 hover:text-purple-600 rounded-lg transition-colors">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Automatic Backup Schedule</h3>
              <div className="space-y-4">
                {backupSchedule.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {schedule.frequency.charAt(0).toUpperCase() +
                            schedule.frequency.slice(1)}{" "}
                          Backup
                        </p>
                        <p className="text-sm text-gray-600">
                          {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} •
                          Every day at {schedule.time}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Next run: {formatDate(schedule.nextRun)}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schedule.enabled}
                        className="sr-only peer"
                        readOnly
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">Backup Types Explained:</p>
                  <ul className="space-y-2">
                    <li>
                      <strong>Full Backup:</strong> Complete copy of all files and folders. Takes
                      longer but provides complete restoration point.
                    </li>
                    <li>
                      <strong>Incremental Backup:</strong> Only backs up files changed since last
                      backup. Faster and uses less storage.
                    </li>
                    <li>
                      <strong>Differential Backup:</strong> Backs up all changes since last full
                      backup. Balance between speed and completeness.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}