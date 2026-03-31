import { useState, useEffect } from "react";
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
  Users,
  Clock,
  Eye,
  Link as LinkIcon,
  CheckCircle,
  Loader2
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
  const [shareMethod, setShareMethod] = useState<"user" | "group">("user");
  const [userIdSearch, setUserIdSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [expiryType, setExpiryType] = useState<"downloads" | "time" | "views">("downloads");
  const [expiryValue, setExpiryValue] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock users database
  const availableUsers = [
    { id: "U001", name: "Sarah Johnson" },
    { id: "U002", name: "Michael Chen" },
    { id: "U003", name: "Emily Davis" },
    { id: "U004", name: "James Wilson" },
    { id: "U005", name: "Lisa Anderson" },
  ];

  // Mock groups database
  const availableGroups = [
    { id: "G001", name: "Engineering Team" },
    { id: "G002", name: "Marketing Department" },
    { id: "G003", name: "ACM Research Team" },
    { id: "G004", name: "Design Studio" },
  ];

  const filteredUsers = availableUsers.filter(
    (user) =>
      user.id.toLowerCase().includes(userIdSearch.toLowerCase()) ||
      user.name.toLowerCase().includes(userIdSearch.toLowerCase())
  );

  const handleGenerateLink = () => {
    const randomId = Math.random().toString(36).substr(2, 9);
    let link = `https://safeshare.app/share/${randomId}`;
    
    // Add expiry parameters to link
    if (expiryType === "downloads" && expiryValue) {
      link += `?maxDownloads=${expiryValue}`;
    } else if (expiryType === "time" && expiryValue) {
      link += `?expiresInMinutes=${expiryValue}`;
    } else if (expiryType === "views" && expiryValue) {
      link += `?maxViews=${expiryValue}`;
    }

    setShareLink(link);
    setLinkGenerated(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    // In production, this would make an API call to share the file/folder
    alert(
      `Sharing "${itemName}" with ${
        shareMethod === "user" ? `User ID: ${userIdSearch}` : `Group: ${selectedGroup}`
      }`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-5 sticky top-0 z-10">
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

          <div className="p-6 space-y-6">
            {/* Share Method Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setShareMethod("user")}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                  shareMethod === "user"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Mail className="h-4 w-4" />
                Share with User
              </button>
              <button
                onClick={() => setShareMethod("group")}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                  shareMethod === "group"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Users className="h-4 w-4" />
                Share with Group
              </button>
            </div>

            {/* Share with User */}
            {shareMethod === "user" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search User by ID or Name
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={userIdSearch}
                      onChange={(e) => setUserIdSearch(e.target.value)}
                      placeholder="Enter User ID (e.g., U001)"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* User Search Results */}
                {userIdSearch && (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setUserIdSearch(user.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-indigo-600">ID: {user.id}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Share with Group */}
            {shareMethod === "group" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <div className="space-y-2">
                  {availableGroups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="group"
                        value={group.id}
                        checked={selectedGroup === group.id}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-600">ID: {group.id}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Expiration Controls */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Link Expiration Settings
              </h3>

              <div className="space-y-4">
                {/* Expiry Type Selection */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExpiryType("downloads")}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      expiryType === "downloads"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Download className="h-5 w-5 text-indigo-600 mb-2" />
                    <p className="font-medium text-sm text-gray-900">Downloads</p>
                    <p className="text-xs text-gray-600">Limit by downloads</p>
                  </button>

                  <button
                    onClick={() => setExpiryType("time")}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      expiryType === "time"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Clock className="h-5 w-5 text-purple-600 mb-2" />
                    <p className="font-medium text-sm text-gray-900">Time</p>
                    <p className="text-xs text-gray-600">Expire after X min</p>
                  </button>

                  <button
                    onClick={() => setExpiryType("views")}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-left",
                      expiryType === "views"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Eye className="h-5 w-5 text-pink-600 mb-2" />
                    <p className="font-medium text-sm text-gray-900">Views</p>
                    <p className="text-xs text-gray-600">One-time view</p>
                  </button>
                </div>

                {/* Expiry Value Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {expiryType === "downloads" && "Maximum Downloads"}
                    {expiryType === "time" && "Expire After (minutes)"}
                    {expiryType === "views" && "Maximum Views"}
                  </label>
                  <input
                    type="number"
                    value={expiryValue}
                    onChange={(e) => setExpiryValue(e.target.value)}
                    placeholder={
                      expiryType === "downloads"
                        ? "e.g., 5"
                        : expiryType === "time"
                        ? "e.g., 60"
                        : "e.g., 1"
                    }
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {expiryType === "downloads" &&
                      "Link will expire after this many downloads"}
                    {expiryType === "time" &&
                      "Link will expire after this many minutes from now"}
                    {expiryType === "views" && "Link will expire after this many views (1 = one-time view)"}
                  </p>
                </div>

                {/* Quick Presets for Time */}
                {expiryType === "time" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpiryValue("30")}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      30 min
                    </button>
                    <button
                      onClick={() => setExpiryValue("60")}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      1 hour
                    </button>
                    <button
                      onClick={() => setExpiryValue("1440")}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      24 hours
                    </button>
                    <button
                      onClick={() => setExpiryValue("10080")}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      7 days
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Link Section */}
            {!linkGenerated ? (
              <button
                onClick={handleGenerateLink}
                disabled={!expiryValue}
                className={cn(
                  "w-full px-4 py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                  expiryValue
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <LinkIcon className="h-4 w-4" />
                Generate Secure Link
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Secure Share Link
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
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-green-800">
                    <p className="font-semibold mb-1">Link Generated Successfully</p>
                    <p>
                      Expires after{" "}
                      {expiryType === "downloads" && `${expiryValue} downloads`}
                      {expiryType === "time" && `${expiryValue} minutes`}
                      {expiryType === "views" && `${expiryValue} view(s)`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={
                  (shareMethod === "user" && !userIdSearch) ||
                  (shareMethod === "group" && !selectedGroup)
                }
                className={cn(
                  "flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
                  (shareMethod === "user" && userIdSearch) ||
                    (shareMethod === "group" && selectedGroup)
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Share2 className="h-4 w-4" />
                Share Now
              </button>
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

  // --- ADDED fetchFiles AND isLoading HERE ---
  const { files, addFolder, addFile, moveToTrash, getFilesInFolder, fetchFiles, isLoading } = useFolders();

  // --- ADDED THIS USE EFFECT TO LOAD FILES WHEN PAGE OPENS ---
  useEffect(() => {
    fetchFiles();
  }, []);

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

  const handleUploadFiles = async (newFiles: any[]) => {
    // 1. Get the JWT token to prove the user is logged in
    const token = localStorage.getItem("token"); 
    
    if (!token) {
      alert("Authentication error: Please log in again.");
      return;
    }

    for (const file of newFiles) {
      try {
        // 2. Build the exact package Spring Boot is expecting
        const formData = new FormData();
        formData.append("file", file.encryptedBlob);
        formData.append("originalName", file.name);
        formData.append("fileType", file.fileType);
        formData.append("sizeBytes", file.sizeBytes.toString());
        formData.append("compressed", file.compressed.toString());
        
        // The Zero-Knowledge Metadata
        formData.append("encryptedFileKey", file.encryptedFileKey);
        formData.append("iv", file.iv);

        // 3. Send the encrypted package to Spring Boot
        const response = await fetch("http://localhost:8080/api/v1/files/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        // 4. Refresh the list straight from the server to guarantee it shows up properly!
        fetchFiles();

      } catch (error) {
        console.error("Upload failed for file:", file.name, error);
        alert(`Failed to upload ${file.name}. Check the console.`);
      }
    }
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

            {/* Action buttons - New Folder only shows at root level */}
            <div className="flex items-center gap-3">
              {!currentFolder && (
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <FolderPlus className="h-4 w-4" />
                  New Folder
                </button>
              )}
              <button
                onClick={() => setIsUploadDialogOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Upload className="h-4 w-4" />
                Upload Files
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
        
        {/* ADDED A LOADING INDICATOR SO YOU CAN SEE THE FETCH HAPPENING */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600 font-medium">Loading your secure files...</span>
          </div>
        ) : viewMode === "list" ? (
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
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ""}
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

        {!isLoading && filteredFiles.length === 0 && (
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
                {!currentFolder && (
                  <button
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2 mr-3"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Create Folder
                  </button>
                )}
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

      {/* Create Folder Dialog - Only creates at root */}
      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreateFolder={(name) => addFolder(name)}
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