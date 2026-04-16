import { useState } from "react";
import {
  Cloud, CloudDownload, CloudUpload, Database, HardDrive, Clock, CheckCircle,
  AlertCircle, Settings, Download, Upload, Calendar, History, Shield, Zap, Info,
  ChevronRight, Loader2, RefreshCw, FolderOpen, FileText, KeyRound, ShieldCheck, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/components/dashboard/FoldersContext";

// --- NATIVE WEB CRYPTO MATH FOR PASSWORD-BASED ENCRYPTION ---
const deriveKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as any, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
};

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

  // Added "key-recovery" to your tabs!
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "schedule" | "key-recovery">("overview");
  const [isBackingUp, setIsBackingUp] = useState(false);

  // --- KEY ESCROW STATES ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isKeyLoading, setIsKeyLoading] = useState(false);
  const [keyMessage, setKeyMessage] = useState({ type: "", text: "" });
  const [keyMode, setKeyMode] = useState<"backup" | "restore">("backup");

  // Mock backup history
  const [backupHistory] = useState<BackupJob[]>([
    {
      id: "1", name: "Full Backup - January 27, 2026", type: "full", status: "completed",
      startTime: "2026-01-27T02:00:00", endTime: "2026-01-27T02:15:00", size: "171.3 MB", filesCount: 5, includesTrash: true,
    },
    {
      id: "2", name: "Incremental Backup - January 26, 2026", type: "incremental", status: "completed",
      startTime: "2026-01-26T02:00:00", endTime: "2026-01-26T02:05:00", size: "23.4 MB", filesCount: 2, includesTrash: true,
    },
  ]);

  const [backupSchedule] = useState<BackupSchedule[]>([
    { id: "1", frequency: "daily", time: "02:00", enabled: true, nextRun: "2026-01-28T02:00:00", type: "incremental" },
  ]);

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setTimeout(() => setIsBackingUp(false), 3000);
  };

  // --- KEY ESCROW FUNCTIONS ---
  const handleKeyBackup = async () => {
    if (password !== confirmPassword) {
      setKeyMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }
    setIsKeyLoading(true);
    setKeyMessage({ type: "", text: "" });

    try {
      const privateKey = localStorage.getItem("privateKey");
      if (!privateKey) throw new Error("No Private Key found on this device to backup!");

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const aesKey = await deriveKey(password, salt);

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv as any }, aesKey, enc.encode(privateKey)
      );

      const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
      const payload = JSON.stringify({ salt: Array.from(salt), iv: Array.from(iv), data: encryptedArray });
      const finalBlob = btoa(payload);

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/v1/backup/save", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedPrivateKey: finalBlob })
      });

      if (!res.ok) throw new Error(await res.text());
      setKeyMessage({ type: "success", text: "Success! Your key is securely backed up to the cloud." });
      setPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setKeyMessage({ type: "error", text: err.message || "Backup failed." });
    } finally {
      setIsKeyLoading(false);
    }
  };

  const handleKeyRestore = async () => {
    setIsKeyLoading(true);
    setKeyMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/v1/backup/restore", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(await res.text());
      const { encryptedPrivateKey } = await res.json();

      const { salt, iv, data } = JSON.parse(atob(encryptedPrivateKey));
      const aesKey = await deriveKey(password, new Uint8Array(salt));
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) as any }, aesKey, new Uint8Array(data) as any
      );

      const dec = new TextDecoder();
      const recoveredPrivateKey = dec.decode(decryptedBuffer);
      localStorage.setItem("privateKey", recoveredPrivateKey);

      setKeyMessage({ type: "success", text: "Key Restored! You can now access all your files on this device." });
      setPassword("");
    } catch (err: any) {
      setKeyMessage({ type: "error", text: "Failed to restore. Are you sure that is the correct Master Password?" });
    } finally {
      setIsKeyLoading(false);
    }
  };

  // UI Helpers
  const getStatusIcon = (status: BackupJob["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in-progress": return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "failed": return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "scheduled": return <Clock className="h-5 w-5 text-orange-600" />;
    }
  };

  const getBackupTypeColor = (type: BackupJob["type"]) => {
    switch (type) {
      case "full": return "bg-purple-100 text-purple-700";
      case "incremental": return "bg-blue-100 text-blue-700";
      case "differential": return "bg-green-100 text-green-700";
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  const coverage = { active: files.filter((f) => f.type === "file").length, trashed: trashedFiles.length, total: files.filter((f) => f.type === "file").length + trashedFiles.length };

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
                <p className="text-sm text-gray-600">Automatic backups • 30-day retention • Point-in-time recovery</p>
              </div>
            </div>

            <button onClick={handleBackupNow} disabled={isBackingUp} className={cn("px-4 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md", isBackingUp ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700")}>
              {isBackingUp ? <><Loader2 className="h-4 w-4 animate-spin" /> Backing up...</> : <><CloudUpload className="h-4 w-4" /> Backup Now</>}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-gray-200">
            {["overview", "history", "schedule", "key-recovery"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                  activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
                )}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4"><div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div><span className="text-xs text-gray-500">Last 24 hours</span></div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Last Backup</h3>
                <p className="text-2xl font-bold text-gray-900">{formatDate(backupHistory[0].endTime!).split(",")[0]}</p>
                <p className="text-sm text-gray-600 mt-1">{backupHistory[0].filesCount} files • {backupHistory[0].size}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4"><div className="p-2 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div><span className="text-xs text-gray-500">Scheduled</span></div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Next Backup</h3>
                <p className="text-2xl font-bold text-gray-900">{formatDate(backupSchedule[0].nextRun).split(",")[0]}</p>
                <p className="text-sm text-gray-600 mt-1">{backupSchedule[0].frequency} at {backupSchedule[0].time}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4"><div className="p-2 bg-purple-50 rounded-lg"><HardDrive className="h-5 w-5 text-purple-600" /></div><span className="text-xs text-gray-500">Current</span></div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Backup Size</h3>
                <p className="text-2xl font-bold text-gray-900">{storage.usedFormatted}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === "history" && (
           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             <div className="p-4 bg-gray-50 border-b border-gray-200"><h3 className="font-semibold text-gray-900">Recent Backups</h3></div>
             <div className="divide-y divide-gray-200">
               {backupHistory.map((backup) => (
                 <div key={backup.id} className="p-6 hover:bg-gray-50 transition-colors group">
                   <div className="flex items-start gap-4">
                     {getStatusIcon(backup.status)}
                     <div>
                       <h4 className="font-medium text-gray-900">{backup.name}</h4>
                       <p className="text-sm text-gray-500">{formatDate(backup.startTime)} • {backup.size}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* --- SCHEDULE TAB --- */}
        {activeTab === "schedule" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
             <h3 className="font-semibold text-gray-900 mb-4">Automatic Backup Schedule</h3>
             {backupSchedule.map((schedule) => (
               <div key={schedule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                 <div>
                   <p className="font-medium text-gray-900">{schedule.frequency} Backup</p>
                   <p className="text-sm text-gray-600">Every day at {schedule.time}</p>
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* --- NEW KEY RECOVERY TAB --- */}
        {activeTab === "key-recovery" && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Zero-Knowledge Escrow</h3>
                <p className="text-amber-700/80 text-sm mt-1">Your cryptographic key is encrypted in your browser using the Master Password below. Our servers never see your password or your actual keys. <strong>If you forget this password, your backup cannot be recovered.</strong></p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button onClick={() => setKeyMode("backup")} className={cn("flex-1 py-4 font-medium text-center transition-colors", keyMode === "backup" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-gray-500 hover:bg-gray-50")}>Backup Key to Cloud</button>
                <button onClick={() => setKeyMode("restore")} className={cn("flex-1 py-4 font-medium text-center transition-colors", keyMode === "restore" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-gray-500 hover:bg-gray-50")}>Restore Key from Cloud</button>
              </div>

              <div className="p-8 space-y-6">
                {keyMessage.text && (
                  <div className={cn("p-4 rounded-xl text-sm font-medium flex items-center gap-2", keyMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200")}>
                    {keyMessage.type === "success" && <ShieldCheck className="h-5 w-5" />}
                    {keyMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Master Recovery Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a strong password" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                {keyMode === "backup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                )}

                <button 
                  onClick={keyMode === "backup" ? handleKeyBackup : handleKeyRestore} 
                  disabled={isKeyLoading || !password || (keyMode === "backup" && !confirmPassword)}
                  className={cn("w-full py-3.5 rounded-xl font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-colors", isKeyLoading || !password ? "bg-gray-300 cursor-not-allowed" : keyMode === "backup" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700")}
                >
                  {isKeyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : keyMode === "backup" ? <CloudUpload className="h-5 w-5" /> : <CloudDownload className="h-5 w-5" />}
                  {isKeyLoading ? "Processing..." : keyMode === "backup" ? "Encrypt & Backup to Cloud" : "Download & Unlock Key"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}