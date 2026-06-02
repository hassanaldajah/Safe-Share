import { useState, useEffect } from "react";
import {
  Database, RefreshCw, X, FolderOpen, FileText, Image as ImageIcon,
  File, Video, Music, Archive, AlertTriangle, Search, Grid3x3, List,
  Package, Shield, ShieldCheck, AlertCircle, Loader2, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileItem } from "@/components/dashboard/FoldersContext";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";

export function BackupPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [backupFiles, setBackupFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Custom Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileId: string | null }>({ isOpen: false, fileId: null });

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("/api/v1/files/backups");
      if (response.ok) {
        const data = await response.json();
        // Map the backend data to FileItem format
        const mappedFiles = data.map((f: any): FileItem => ({
          id: f.id.toString(),
          name: f.name,
          type: "file",
          size: f.sizeBytes ? `${(f.sizeBytes / 1024 / 1024).toFixed(2)} MB` : "Unknown",
          sizeBytes: f.sizeBytes,
          compressed: f.compressed || false,
          virusScan: f.virusScan || "clean",
          uploadedAt: f.uploadedAt ? f.uploadedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          fileType: f.fileType || "other",
          encryptedFileKey: f.encryptedFileKey,
          iv: f.iv
        }));
        setBackupFiles(mappedFiles);
      }
    } catch (error) {
      console.error("Failed to fetch backups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRestore = async (id: string) => {
    setIsProcessing(id);
    try {
      const response = await authFetch(`/api/v1/files/${id}/restore-backup`, { method: "POST" });
      if (response.ok) {
        // True Snapshot: Keep the backup file in the UI list and show a toast
        toast.success("A copy has been restored to your dashboard");
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error("Failed to restore", error);
      toast.error("Failed to restore the file.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, fileId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.fileId) return;
    
    setIsProcessing(deleteModal.fileId);
    try {
      const response = await authFetch(`/api/v1/files/${deleteModal.fileId}/permanent`, { method: "DELETE" });
      if (response.ok) {
        setBackupFiles(prev => prev.filter(f => f.id !== deleteModal.fileId));
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Failed to delete the backup.");
    } finally {
      setIsProcessing(null);
      setDeleteModal({ isOpen: false, fileId: null });
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") return <FolderOpen className="h-5 w-5 text-amber-500" />;
    switch (item.fileType) {
      case "document": return <FileText className="h-5 w-5 text-blue-500" />;
      case "image": return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case "video": return <Video className="h-5 w-5 text-red-500" />;
      case "audio": return <Music className="h-5 w-5 text-green-500" />;
      case "archive": return <Archive className="h-5 w-5 text-orange-500" />;
      default: return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getVirusScanBadge = (status: FileItem["virusScan"]) => {
    switch (status) {
      case "clean":
        return <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"><ShieldCheck className="h-3.5 w-3.5" />Clean</div>;
      case "scanning":
        return <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"><Shield className="h-3.5 w-3.5 animate-pulse" />Scanning</div>;
      case "infected":
        return <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"><AlertCircle className="h-3.5 w-3.5" />Infected</div>;
    }
  };

  const filteredFiles = backupFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Database className="h-6 w-6 text-indigo-600" /> My Vault
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredFiles.length} backed up items • Zero-space deduplication
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search backups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <button onClick={() => setViewMode("list")} className={cn("p-2 rounded transition-all duration-200", viewMode === "list" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}><List className="h-4 w-4" /></button>
              <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded transition-all duration-200", viewMode === "grid" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}><Grid3x3 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 lg:py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compressed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Backed Up On</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <span className="font-medium text-foreground">{file.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{file.size || "—"}</td>
                    <td className="px-6 py-4">
                      {file.type === "file" && (
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", file.compressed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                          <Package className="h-3.5 w-3.5" />{file.compressed ? "Yes" : "No"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getVirusScanBadge(file.virusScan)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{file.uploadedAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRestore(file.id)} 
                          disabled={isProcessing === file.id}
                          className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                        >
                          {isProcessing === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Restore
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          disabled={isProcessing === file.id}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                        >
                          {isProcessing === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFiles.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                No backups found.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-background rounded-xl border border-border p-4 hover:shadow-lg transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg">{getFileIcon(file)}</div>
                </div>

                <h3 className="font-medium text-foreground mb-1 truncate">{file.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{file.size}</p>

                <div className="flex items-center gap-2 mb-3">
                  {getVirusScanBadge(file.virusScan)}
                  {file.type === "file" && (
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", file.compressed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                      <Package className="h-3 w-3" />{file.compressed ? "Compressed" : "Uncompressed"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <button 
                    onClick={() => handleRestore(file.id)} 
                    disabled={isProcessing === file.id}
                    className="w-full px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Restore
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={isProcessing === file.id}
                    className="w-full px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No backups found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CUSTOM DELETE MODAL --- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background w-full max-w-md rounded-2xl shadow-xl border border-border p-6 overflow-hidden relative">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full flex-shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Backup?</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you sure you want to remove this file from your Vault? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, fileId: null })}
                disabled={!!isProcessing}
                className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!isProcessing}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50 shadow-sm"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}