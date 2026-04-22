import { useState, useEffect } from "react";
import {
  FolderOpen, Upload, Share2, Search, Grid3x3, List, ChevronRight, Home,
  FileText, Image as ImageIcon, File, Video, Music, Archive, Download,
  Trash2, Shield, ShieldCheck, AlertCircle, Package, X, Mail, Copy, Check,
  FolderPlus, ArrowLeft, AlertTriangle, Users, Clock, Eye, Link as LinkIcon, 
  CheckCircle, Loader2, AtSign, Settings2, CheckSquare, Square
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders, FileItem } from "@/components/dashboard/FoldersContext";
import { CreateFolderDialog } from "@/components/dashboard/Createfolderdialog";
import { UploadFileDialog } from "@/components/dashboard/UploadFileDialog";
import { authFetch } from "@/lib/api";
import { decryptKeyWithRSA, decryptFile, encryptKeyWithRSA } from "@/lib/encryption";
import { toast } from "sonner";
import { ShareFileModal } from "@/components/dashboard/ShareFileModal";

export function MyFolders() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); 

  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; itemId: string; itemName: string; }>({ isOpen: false, itemId: "", itemName: "" });
  
  const [shareDialog, setShareDialog] = useState<{ isOpen: boolean; file: FileItem | null; }>({ isOpen: false, file: null });

  // --- GROUP SHARE STATES MOVED INSIDE COMPONENT ---
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedFileIdToShare, setSelectedFileIdToShare] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isSharingToGroup, setIsSharingToGroup] = useState(false);

  const { files, addFolder, addFile, moveToTrash, getFilesInFolder, fetchFiles, isLoading } = useFolders();

  useEffect(() => { fetchFiles(); }, []);

  const currentFiles = currentFolder ? getFilesInFolder(currentFolder.id) : files;

  // --- GROUP SHARE LOGIC MOVED INSIDE COMPONENT ---
  const openGroupShareModal = async (fileId: string) => {
    setSelectedFileIdToShare(fileId);
    setShowGroupModal(true);
    try {
      const res = await authFetch("http://localhost:8080/api/v1/groups");
      if (res.ok) setUserGroups(await res.json());
    } catch (err) {
      console.error("Failed to load groups", err);
    }
  };

  const handleShareToGroup = async () => {
    if (!selectedFileIdToShare || !selectedGroupId) return;
    setIsSharingToGroup(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/files/${selectedFileIdToShare}/share/group/${selectedGroupId}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error(await res.text());
toast.success("File successfully shared to the group!"); 
      setShowGroupModal(false);
    } catch (err: any) {
      toast.error("Error sharing to group: " + err.message);
    } finally {
            setIsSharingToGroup(false);
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
      case "clean": return <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"><ShieldCheck className="h-3.5 w-3.5" />Clean</div>;
      case "scanning": return <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"><Shield className="h-3.5 w-3.5 animate-pulse" />Scanning</div>;
      case "infected": return <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium"><AlertCircle className="h-3.5 w-3.5" />Infected</div>;
    }
  };

  const handleShare = (item: FileItem) => setShareDialog({ isOpen: true, file: item });
  const handleDelete = (id: string, name: string) => setDeleteDialog({ isOpen: true, itemId: id, itemName: name });
  const confirmDelete = () => { moveToTrash(deleteDialog.itemId); setDeleteDialog({ isOpen: false, itemId: "", itemName: "" }); };
  const handleFolderClick = (folder: FileItem) => { if (folder.type === "folder") setCurrentFolder(folder); };
  const handleBackClick = () => setCurrentFolder(null);

  const handleUploadFiles = async (newFiles: any[]) => {
    const token = localStorage.getItem("token"); 
    if (!token) return alert("Authentication error: Please log in again.");

    for (const file of newFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file.encryptedBlob);
        formData.append("originalName", file.name);
        formData.append("fileType", file.fileType);
        formData.append("sizeBytes", file.sizeBytes.toString());
        formData.append("compressed", file.compressed.toString());
        formData.append("encryptedFileKey", file.encryptedFileKey);
        formData.append("iv", file.iv);

        const response = await fetch("http://localhost:8080/api/v1/files/upload", {
          method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData,
        });

        if (!response.ok) throw new Error(await response.text());
        fetchFiles();
      } catch (error) {
        console.error("Upload failed:", error);
        alert(`Failed to upload ${file.name}. Check the console.`);
      }
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      setIsDownloading(file.id);
      const token = localStorage.getItem("token");
      const privateKeyBase64 = localStorage.getItem("privateKey");

      if (!token || !privateKeyBase64 || !file.encryptedFileKey || !file.iv) {
        throw new Error("Missing cryptographic data.");
      }

      const response = await fetch(`http://localhost:8080/api/v1/files/${file.id}/download`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to download file from server");
      
      const encryptedArrayBuffer = await response.arrayBuffer();
      const aesKey = await decryptKeyWithRSA(file.encryptedFileKey, privateKeyBase64);
      const decryptedBlob = await decryptFile(encryptedArrayBuffer, aesKey, file.iv);

      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Decryption/Download failed:", error);
      alert("Failed to decrypt and download the file.");
    } finally {
      setIsDownloading(null);
    }
  };

  const filteredFiles = currentFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          {currentFolder && (
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleBackClick} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to My Folders</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <FolderOpen className="h-6 w-6" />
                {currentFolder ? currentFolder.name : "My Folders"}
              </h1>
              <p className="text-sm text-muted-foreground">{filteredFiles.length} items • {filteredFiles.filter((f) => f.type === "folder").length} folders</p>
            </div>

            <div className="flex items-center gap-3">
              {!currentFolder && (
                <button onClick={() => setIsCreateFolderOpen(true)} className="px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm">
                  <FolderPlus className="h-4 w-4" /> New Folder
                </button>
              )}
              <button onClick={() => setIsUploadDialogOpen(true)} className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm">
                <Upload className="h-4 w-4" /> Upload Files
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search files and folders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <button onClick={() => setViewMode("list")} className={cn("p-2 rounded transition-all", viewMode === "list" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}><List className="h-4 w-4" /></button>
              <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded transition-all", viewMode === "grid" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}><Grid3x3 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 lg:py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-muted-foreground font-medium">Loading your secure files...</span>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-background transition-colors group" onDoubleClick={() => file.type === "folder" && handleFolderClick(file)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => file.type === "folder" && handleFolderClick(file)}>
                        {getFileIcon(file)}
                        <span className="font-medium text-foreground">{file.name}</span>
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
                    <td className="px-6 py-4 text-sm text-muted-foreground">{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ""}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleShare(file)} className="p-1.5 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 rounded-lg transition-colors" title="Share with User">
                          <Share2 className="h-4 w-4" />
                        </button>
                        {/* --- NEW BUTTON: SHARE TO GROUP --- */}
                        {file.type === "file" && (
                          <button onClick={() => openGroupShareModal(file.id)} className="p-1.5 hover:bg-purple-50 text-muted-foreground hover:text-purple-600 rounded-lg transition-colors" title="Share to Group">
                            <Users className="h-4 w-4" />
                          </button>
                        )}
                        {file.type === "file" && (
                          <button onClick={() => handleDownload(file)} disabled={isDownloading === file.id} className="p-1.5 hover:bg-blue-50 text-muted-foreground hover:text-blue-600 rounded-lg transition-colors" title="Download">
                            {isDownloading === file.id ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <Download className="h-4 w-4" />}
                          </button>
                        )}
                        <button onClick={() => handleDelete(file.id, file.name)} className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-background rounded-xl border border-border p-4 hover:shadow-lg transition-all duration-200 group cursor-pointer" onDoubleClick={() => file.type === "folder" && handleFolderClick(file)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-muted rounded-lg" onClick={() => file.type === "folder" && handleFolderClick(file)}>
                    {getFileIcon(file)}
                  </div>
                </div>
                <h3 className="font-medium text-foreground mb-1 truncate">{file.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{file.size || "Folder"}</p>
                <div className="flex items-center gap-2 mb-3">
                  {getVirusScanBadge(file.virusScan)}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button onClick={() => handleShare(file)} className="p-2 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 rounded-lg transition-colors" title="Share with User">
                    <Share2 className="h-4 w-4" />
                  </button>
                  {/* --- NEW BUTTON: SHARE TO GROUP --- */}
                  {file.type === "file" && (
                    <button onClick={() => openGroupShareModal(file.id)} className="p-2 hover:bg-purple-50 text-muted-foreground hover:text-purple-600 rounded-lg transition-colors" title="Share to Group">
                      <Users className="h-4 w-4" />
                    </button>
                  )}
                  {file.type === "file" && (
                    <button onClick={() => handleDownload(file)} disabled={isDownloading === file.id} className="p-2 hover:bg-blue-50 text-muted-foreground hover:text-blue-600 rounded-lg transition-colors">
                      {isDownloading === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>
                  )}
                  <button onClick={() => handleDelete(file.id, file.name)} className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateFolderDialog isOpen={isCreateFolderOpen} onClose={() => setIsCreateFolderOpen(false)} onCreateFolder={(name) => addFolder(name)} />
      <UploadFileDialog isOpen={isUploadDialogOpen} onClose={() => setIsUploadDialogOpen(false)} onUpload={handleUploadFiles} folderName={currentFolder?.name} />

      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="bg-background rounded-2xl p-6 max-w-sm w-full mx-4">
              <h2 className="text-lg font-bold text-foreground mb-2">Move to Trash</h2>
              <p className="text-muted-foreground mb-6">Are you sure you want to move "{deleteDialog.itemName}" to trash?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteDialog({ isOpen: false, itemId: "", itemName: "" })} className="px-4 py-2 font-medium text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                <button onClick={confirmDelete} className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Move to Trash</button>
              </div>
           </div>
        </div>
      )}

      <ShareFileModal isOpen={shareDialog.isOpen} onClose={() => setShareDialog({ isOpen: false, file: null })} file={shareDialog.file} />
      
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-semibold text-foreground text-lg mb-4">Share to Group Drive</h2>
            
            <label className="block text-sm font-medium text-foreground mb-1.5">Select a Group</label>
            <select 
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="" disabled>-- Choose a group --</option>
              {userGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.myRole})</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button onClick={() => setShowGroupModal(false)} className="flex-1 bg-muted hover:bg-muted text-muted-foreground font-medium py-2.5 rounded-xl transition-colors text-sm">Cancel</button>
              <button 
                onClick={handleShareToGroup} 
                disabled={!selectedGroupId || isSharingToGroup} 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {isSharingToGroup ? "Sharing..." : "Share to Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}