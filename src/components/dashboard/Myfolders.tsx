import { useState } from "react";
import {
  FolderOpen,
  Upload,
  Share2,
  Search,
  Grid3x3,
  List,
  ChevronRight,
  Home,
  FileText,
  Image as ImageIcon,
  File,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  MoreVertical,
  Shield,
  ShieldCheck,
  AlertCircle,
  Package,
  X,
  Mail,
  Copy,
  Check,
  FolderPlus,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders, FileItem } from "@/components/dashboard/FoldersContext";
import { CreateFolderDialog } from "@/components/dashboard/Createfolderdialog";
import { UploadFileDialog } from "@/components/dashboard/UploadFileDialog";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemType: "file" | "folder";
}

function ShareDialog({ isOpen, onClose, itemName, itemType }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const shareLink = `https://safeshare.app/shared/${Math.random().toString(36).substr(2, 9)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Share {itemType}</h2>
                  <p className="text-sm text-white/80">{itemName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share with people
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  Invite
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600"
                />
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "px-4 py-2.5 font-medium rounded-lg transition-all duration-200 flex items-center gap-2",
                    copied
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" />
                Allow recipients to download
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <input type="checkbox" className="rounded border-gray-300" />
                Require password to access
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyFolders() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    itemName: string;
  }>({
    isOpen: false,
    itemId: "",
    itemName: "",
  });
  const [shareDialog, setShareDialog] = useState<{
    isOpen: boolean;
    itemName: string;
    itemType: "file" | "folder";
  }>({
    isOpen: false,
    itemName: "",
    itemType: "file",
  });

  const { files, addFolder, addFile, moveToTrash, getFilesInFolder } = useFolders();

  // Get current files (either root or folder contents)
  const currentFiles = currentFolder ? getFilesInFolder(currentFolder.id) : files;

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") {
      return <FolderOpen className="h-5 w-5 text-amber-500" />;
    }

    switch (item.fileType) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-green-500" />;
      case "archive":
        return <Archive className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVirusScanBadge = (status: FileItem["virusScan"]) => {
    switch (status) {
      case "clean":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Clean
          </div>
        );
      case "scanning":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            <Shield className="h-3.5 w-3.5 animate-pulse" />
            Scanning
          </div>
        );
      case "infected":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            Infected
          </div>
        );
    }
  };

  const handleShare = (item: FileItem) => {
    setShareDialog({
      isOpen: true,
      itemName: item.name,
      itemType: item.type,
    });
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteDialog({
      isOpen: true,
      itemId: id,
      itemName: name,
    });
  };

  const confirmDelete = () => {
    moveToTrash(deleteDialog.itemId);
    setDeleteDialog({ isOpen: false, itemId: "", itemName: "" });
  };

  const handleFolderClick = (folder: FileItem) => {
    if (folder.type === "folder") {
      setCurrentFolder(folder);
    }
  };

  const handleBackClick = () => {
    setCurrentFolder(null);
  };

  const handleUploadFiles = (newFiles: FileItem[]) => {
    newFiles.forEach((file) => {
      addFile(file, currentFolder?.id);
    });
  };

  const filteredFiles = currentFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumbs */}
          {currentFolder && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to My Folders</span>
              </button>
            </div>
          )}

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Home className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span>My Folders</span>
            {currentFolder && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-gray-900">{currentFolder.name}</span>
              </>
            )}
          </div>

          {/* Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {currentFolder ? currentFolder.name : "My Folders"}
              </h1>
              <p className="text-sm text-gray-600">
                {filteredFiles.length} items • {filteredFiles.filter((f) => f.type === "folder").length} folders
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateFolderOpen(true)}
                className="px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <FolderPlus className="h-4 w-4" />
                New Folder
              </button>
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </button>
              <button
                onClick={() =>
                  setShareDialog({
                    isOpen: true,
                    itemName: currentFolder ? currentFolder.name : "My Folders",
                    itemType: "folder",
                  })
                }
                className="px-4 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Folder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded transition-all duration-200",
                  viewMode === "list"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded transition-all duration-200",
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === "list" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Compressed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-gray-50 transition-colors group"
                    onDoubleClick={() => file.type === "folder" && handleFolderClick(file)}
                  >
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => file.type === "folder" && handleFolderClick(file)}
                      >
                        {getFileIcon(file)}
                        <span className="font-medium text-gray-900">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{file.size || "—"}</td>
                    <td className="px-6 py-4">
                      {file.type === "file" && (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            file.compressed
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          )}
                        >
                          <Package className="h-3.5 w-3.5" />
                          {file.compressed ? "Yes" : "No"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getVirusScanBadge(file.virusScan)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleShare(file)}
                          className="p-1.5 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        {file.type === "file" && (
                          <button
                            className="p-1.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="p-1.5 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                          title="More"
                        >
                          <MoreVertical className="h-4 w-4" />
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
              <div
                key={file.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200 group cursor-pointer"
                onDoubleClick={() => file.type === "folder" && handleFolderClick(file)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg"
                    onClick={() => file.type === "folder" && handleFolderClick(file)}
                  >
                    {getFileIcon(file)}
                  </div>
                  <button className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all">
                    <MoreVertical className="h-4 w-4 text-gray-600" />
                  </button>
                </div>

                <h3 className="font-medium text-gray-900 mb-1 truncate">{file.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{file.size || "Folder"}</p>

                <div className="flex items-center gap-2 mb-3">
                  {getVirusScanBadge(file.virusScan)}
                  {file.type === "file" && (
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        file.compressed
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      <Package className="h-3 w-3" />
                      {file.compressed ? "Compressed" : "Uncompressed"}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleShare(file)}
                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </button>
                  {file.type === "file" && (
                    <button className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(file.id, file.name)}
                    className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FolderOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search"
                : currentFolder
                ? "This folder is empty. Upload files to get started."
                : "Upload your first file to get started"}
            </p>
            {!searchQuery && (
              <>
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 mr-3"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create Folder
                </button>
                <button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Files
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreateFolder={(name) => addFolder(name, currentFolder?.id)}
      />

      {/* Upload File Dialog */}
      <UploadFileDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUploadFiles}
        folderName={currentFolder?.name}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Trash2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Move to Trash</h2>
                      <p className="text-sm text-white/80">This item will be moved to trash</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDeleteDialog({ isOpen: false, itemId: "", itemName: "" })
                    }
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-orange-50 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-2">
                      Are you sure you want to move this item to trash?
                    </p>
                    <p className="text-gray-700 mb-3">
                      <span className="font-semibold">"{deleteDialog.itemName}"</span>
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                      <p className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">ℹ️</span>
                        <span>
                          Items in trash can be restored within 30 days. After 30 days, they'll be
                          permanently deleted. Items in trash still count toward your storage quota.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() =>
                      setDeleteDialog({ isOpen: false, itemId: "", itemName: "" })
                    }
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Move to Trash
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareDialog.isOpen}
        onClose={() =>
          setShareDialog({ isOpen: false, itemName: "", itemType: "file" })
        }
        itemName={shareDialog.itemName}
        itemType={shareDialog.itemType}
      />
    </div>
  );
}