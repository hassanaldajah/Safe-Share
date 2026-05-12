import { useState, useEffect } from "react";
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

  // Dynamic backup history and info
  const [backupHistory, setBackupHistory] = useState<BackupJob[]>([]);
  const [backupInfo, setBackupInfo] = useState<{nextScheduledBackup: string, totalStorageSize: string} | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchBackupHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("token");
      const [historyRes, infoRes] = await Promise.all([
        fetch("/api/v1/backup/status", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("/api/v1/backup/info", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);
      
      if (historyRes.ok) {
        const data = await historyRes.json();
        setBackupHistory(data);
      }
      
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setBackupInfo(infoData);
      }
    } catch (err) {
      console.error("Failed to fetch backup history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const [backupSchedule] = useState<BackupSchedule[]>([
    { id: "1", frequency: "daily", time: "02:00", enabled: true, nextRun: "", type: "incremental" },
  ]);

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/v1/backup/trigger", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Backup failed");
      }
      // Refresh the backup history list instead of just pushing locally
      await fetchBackupHistory();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to trigger backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  // --- UTILITY FOR BASE64 ---
  const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
    let binary = '';
    // This safely handles both ArrayBuffer and Uint8Array!
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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

      const token = localStorage.getItem("token");
      const res = await fetch("/api/v1/backup/save", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          encryptedPrivateKey: arrayBufferToBase64(encryptedBuffer),
          keySalt: arrayBufferToBase64(salt),
          keyIv: arrayBufferToBase64(iv)
        })
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
      const res = await fetch("/api/v1/backup/restore", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(await res.text());
      const { encryptedPrivateKey, keySalt, keyIv } = await res.json();

      const saltBuffer = base64ToArrayBuffer(keySalt);
      const ivBuffer = base64ToArrayBuffer(keyIv);
      const dataBuffer = base64ToArrayBuffer(encryptedPrivateKey);

      const aesKey = await deriveKey(password, new Uint8Array(saltBuffer));
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(ivBuffer) as any }, aesKey, new Uint8Array(dataBuffer) as any
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };
  const coverage = { active: files.filter((f) => f.type === "file").length, trashed: trashedFiles.length, total: files.filter((f) => f.type === "file").length + trashedFiles.length };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Database className="h-6 w-6" />
                Backup &amp; Recovery
              </h1>
              <p className="text-sm text-muted-foreground">Automatic backups • 30-day retention • Point-in-time recovery</p>
            </div>

            <button onClick={handleBackupNow} disabled={isBackingUp} className={cn("px-4 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md", isBackingUp ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700")}>
              {isBackingUp ? <><Loader2 className="h-4 w-4 animate-spin" /> Backing up...</> : <><CloudUpload className="h-4 w-4" /> Backup Now</>}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-border">
            {["overview", "history", "schedule", "key-recovery"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                  activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 lg:px-8 py-6 lg:py-8">
        
        {/* --- OVERVIEW TAB --- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-background rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4"><div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div><span className="text-xs text-muted-foreground">Last 24 hours</span></div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Backup</h3>
                {backupHistory.length > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-foreground">{formatDate(backupHistory[0].endTime || backupHistory[0].startTime).split(",")[0]}</p>
                    <p className="text-sm text-muted-foreground mt-1">{backupHistory[0].filesCount} files • {backupHistory[0].size || '0 B'}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground">No Backups Yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Trigger a backup to get started</p>
                  </>
                )}
              </div>
              <div className="bg-background rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4"><div className="p-2 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div><span className="text-xs text-muted-foreground">Scheduled</span></div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Next Backup</h3>
                <p className="text-2xl font-bold text-foreground">
                  {backupInfo ? formatDate(backupInfo.nextScheduledBackup).split(",")[0] : 'Loading...'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{backupSchedule[0].frequency} at {backupSchedule[0].time}</p>
              </div>
              <div className="bg-background rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4"><div className="p-2 bg-purple-50 rounded-lg"><HardDrive className="h-5 w-5 text-purple-600" /></div><span className="text-xs text-muted-foreground">Current</span></div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Backup Size</h3>
                <p className="text-2xl font-bold text-foreground">
                  {backupInfo?.totalStorageSize || storage.usedFormatted}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === "history" && (
           <div className="bg-background rounded-xl border border-border overflow-hidden">
             <div className="p-4 bg-background border-b border-border"><h3 className="font-semibold text-foreground">Recent Backups</h3></div>
             <div className="divide-y divide-gray-200">
               {isLoadingHistory ? (
                 <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
               ) : backupHistory.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">No backup history available.</div>
               ) : (
                 backupHistory.map((backup) => (
                   <div key={backup.id} className="p-6 hover:bg-background transition-colors group">
                     <div className="flex items-start gap-4">
                       {getStatusIcon(backup.status)}
                       <div>
                         <h4 className="font-medium text-foreground">{backup.name}</h4>
                         <p className="text-sm text-muted-foreground">{formatDate(backup.startTime)} • {backup.size || 'Pending size'}</p>
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        )}

        {/* --- SCHEDULE TAB --- */}
        {activeTab === "schedule" && (
          <div className="bg-background rounded-xl border border-border p-6">
             <h3 className="font-semibold text-foreground mb-4">Automatic Backup Schedule</h3>
             {backupSchedule.map((schedule) => (
               <div key={schedule.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                 <div>
                   <p className="font-medium text-foreground">{schedule.frequency} Backup</p>
                   <p className="text-sm text-muted-foreground">Every day at {schedule.time}</p>
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

            <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="flex border-b border-border">
                <button onClick={() => setKeyMode("backup")} className={cn("flex-1 py-4 font-medium text-center transition-colors", keyMode === "backup" ? "text-primary border-b-2 border-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>Backup Key to Cloud</button>
                <button onClick={() => setKeyMode("restore")} className={cn("flex-1 py-4 font-medium text-center transition-colors", keyMode === "restore" ? "text-primary border-b-2 border-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>Restore Key from Cloud</button>
              </div>

              <div className="p-8 space-y-6">
                {keyMessage.text && (
                  <div className={cn("p-4 rounded-xl text-sm font-medium flex items-center gap-2", keyMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200")}>
                    {keyMessage.type === "success" && <ShieldCheck className="h-5 w-5" />}
                    {keyMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Master Recovery Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a strong password" className="w-full pl-11 pr-4 py-3 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                </div>

                {keyMode === "backup" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Confirm Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className="w-full pl-11 pr-4 py-3 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" />
                    </div>
                  </div>
                )}

                <button 
                  onClick={keyMode === "backup" ? handleKeyBackup : handleKeyRestore} 
                  disabled={isKeyLoading || !password || (keyMode === "backup" && !confirmPassword)}
                  className={cn("w-full py-3.5 rounded-xl font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-colors", isKeyLoading || !password ? "bg-secondary cursor-not-allowed" : keyMode === "backup" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700")}
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