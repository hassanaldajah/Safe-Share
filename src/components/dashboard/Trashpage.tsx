import { useState, useEffect } from "react";
import {
  Trash2,
  RefreshCw,
  X,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  File,
  Video,
  Music,
  Archive,
  AlertTriangle,
  Search,
  Grid3x3,
  List,
  Package,
  Shield,
  ShieldCheck,
  AlertCircle,
  Loader2 // Imported the loader for visual feedback
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders, FileItem } from "@/components/dashboard/FoldersContext";
import { authFetch } from "@/lib/api";

export function TrashPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track deletion state
  const [isEmptying, setIsEmptying] = useState(false); // Track empty trash state
  
  const { trashedFiles, restoreFromTrash, getTotalStorage, fetchFiles, removeFromTrashState, clearTrashState } = useFolders();

  // --- NEW: Fetch files on mount if the state is empty (survives hard refresh) ---
  useEffect(() => {
    fetchFiles();
  }, []);
  // -----------------------------------------------------------------------------

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

  const getDaysInTrash = (deletedAt?: string) => {
    if (!deletedAt) return 0;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - deleted.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleRestore = (id: string) => {
    restoreFromTrash(id);
  };

  // --- UPDATED: ASYNC SINGLE DELETE ---
  const handlePermanentDelete = (id: string, name: string) => {
    setDeleteConfirmItem({ id, name });
  };

  const handleDeleteForever = async (fileId: string) => {
    try {
      setIsDeleting(fileId);
      const response = await authFetch(`/api/v1/files/${fileId}/permanent`, {
        method: "DELETE"
      });
      if (response.ok) {
        removeFromTrashState(fileId);
      } else {
        const text = await response.text();
        throw new Error(text);
      }
    } catch (error) {
      console.error("Failed to delete permanently", error);
      alert("Failed to delete the file permanently.");
    } finally {
      setIsDeleting(null);
      setDeleteConfirmItem(null);
    }
  };

  const confirmPermanentDelete = () => {
    if (!deleteConfirmItem) return;
    handleDeleteForever(deleteConfirmItem.id);
  };

  // --- UPDATED: ASYNC EMPTY TRASH ---
  const handleEmptyTrash = async () => {
    if (trashedFiles.length === 0) return;
    try {
      setIsEmptying(true);
      const response = await authFetch(`/api/v1/files/trash/empty`, {
        method: "DELETE"
      });
      if (response.ok) {
        clearTrashState();
        setShowEmptyConfirm(false);
      } else {
        const text = await response.text();
        throw new Error(text);
      }
    } catch (error) {
      console.error("Failed to empty trash", error);
      alert("Failed to empty trash.");
    } finally {
      setIsEmptying(false);
    }
  };

  const filteredFiles = trashedFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const storageInfo = getTotalStorage();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Trash2 className="h-6 w-6" /> Trash
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredFiles.length} items • Items are deleted forever after 30 days
              </p>
            </div>

            <div className="flex items-center gap-3">
              {trashedFiles.length > 0 && (
                <button
                  onClick={() => setShowEmptyConfirm(true)}
                  className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Trash2 className="h-4 w-4" /> Empty Trash
                </button>
              )}
            </div>
          </div>

          {trashedFiles.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">Items in trash still use storage space</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    <span className="font-semibold">{storageInfo.trashedFormatted}</span> is being
                    used by trashed items. Empty trash to free up space.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search trash..."
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
        {viewMode === "list" ? (
          <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compressed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deleted</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => {
                  const daysInTrash = getDaysInTrash(file.deletedAt);
                  const daysRemaining = 30 - daysInTrash;

                  return (
                    <tr key={file.id} className="hover:bg-background transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file)}
                          <div>
                            <span className="font-medium text-foreground">{file.name}</span>
                            {file.originalParentId && <p className="text-xs text-muted-foreground mt-0.5">From folder</p>}
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground">
                          {daysInTrash === 0 ? "Today" : `${daysInTrash}d ago`}
                          <p className={cn("text-xs mt-0.5", daysRemaining <= 7 ? "text-red-600" : "text-muted-foreground")}>{daysRemaining}d left</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleRestore(file.id)} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium" title="Restore">
                            <RefreshCw className="h-3.5 w-3.5" /> Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(file.id, file.name)}
                            disabled={isDeleting === file.id}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                            title="Delete Forever"
                          >
                            {isDeleting === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            {isDeleting === file.id ? "Deleting..." : "Delete Forever"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const daysInTrash = getDaysInTrash(file.deletedAt);
              const daysRemaining = 30 - daysInTrash;

              return (
                <div key={file.id} className="bg-background rounded-xl border border-border p-4 hover:shadow-lg transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">{getFileIcon(file)}</div>
                    <div className={cn("text-xs px-2 py-1 rounded-full font-medium", daysRemaining <= 7 ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground")}>{daysRemaining}d left</div>
                  </div>

                  <h3 className="font-medium text-foreground mb-1 truncate">{file.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{file.size || "Folder"}</p>

                  <div className="flex items-center gap-2 mb-3">
                    {getVirusScanBadge(file.virusScan)}
                    {file.type === "file" && (
                      <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", file.compressed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                        <Package className="h-3 w-3" />{file.compressed ? "Compressed" : "Uncompressed"}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-border">
                    <button onClick={() => handleRestore(file.id)} className="w-full px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5" /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(file.id, file.name)}
                      disabled={isDeleting === file.id}
                      className="w-full px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      {isDeleting === file.id ? "Deleting..." : "Delete Forever"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Trash is empty</h3>
            <p className="text-muted-foreground">{searchQuery ? "No items match your search" : "Deleted items will appear here"}</p>
          </div>
        )}
      </div>

      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-background rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-pink-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background/20 backdrop-blur-sm rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Empty Trash</h2>
                    <p className="text-sm text-white/80">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-muted-foreground mb-4">
                  Are you sure you want to permanently delete all {trashedFiles.length} items in
                  trash? You'll free up <strong>{storageInfo.trashedFormatted}</strong> of storage.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  This will permanently delete all files and folders. This action cannot be undone.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmptyConfirm(false)}
                    disabled={isEmptying}
                    className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmptyTrash}
                    disabled={isEmptying}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isEmptying && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEmptying ? "Emptying..." : "Empty Trash"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-background rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-pink-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-background/20 backdrop-blur-sm rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Permanently Delete</h2>
                    <p className="text-sm text-white/80">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-muted-foreground mb-4">
                  Are you sure you want to permanently delete <strong>{deleteConfirmItem.name}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  This file will be erased forever. You won't be able to recover it.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmItem(null)}
                    disabled={isDeleting === deleteConfirmItem.id}
                    className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPermanentDelete}
                    disabled={isDeleting === deleteConfirmItem.id}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting === deleteConfirmItem.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isDeleting === deleteConfirmItem.id ? "Deleting..." : "Delete Forever"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}