import { useState, useRef } from "react";
import { Upload, X, FileText, Image, Video, Music, Archive, File, AlertCircle, CheckCircle, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileItem } from "@/components/dashboard/FoldersContext";

interface UploadFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileItem[]) => void;
  folderName?: string;
}

interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  virusStatus: "scanning" | "clean" | "infected";
  compressed: boolean;
  compressionRecommended: boolean;
  sizeBytes: number;
}

export function UploadFileDialog({ isOpen, onClose, onUpload, folderName }: UploadFileDialogProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (fileName: string): FileItem["fileType"] => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
    const videoExts = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
    const audioExts = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
    const archiveExts = ["zip", "rar", "7z", "tar", "gz"];
    const docExts = ["pdf", "doc", "docx", "txt", "xls", "xlsx", "ppt", "pptx", "csv"];

    if (ext && imageExts.includes(ext)) return "image";
    if (ext && videoExts.includes(ext)) return "video";
    if (ext && audioExts.includes(ext)) return "audio";
    if (ext && archiveExts.includes(ext)) return "archive";
    if (ext && docExts.includes(ext)) return "document";
    return "other";
  };

  const shouldRecommendCompression = (file: File): boolean => {
    const fileType = getFileType(file.name);
    const sizeMB = file.size / (1024 * 1024);

    // Don't recommend compression for already compressed formats
    if (fileType === "archive") return false;
    if (["jpg", "jpeg", "mp3", "mp4"].some(ext => file.name.toLowerCase().endsWith(ext))) return false;

    // Recommend compression for large uncompressed files
    if (fileType === "document" && sizeMB > 1) return true;
    if (fileType === "image" && sizeMB > 2) return true;
    if (fileType === "video" && sizeMB > 10) return false; // Videos are usually already compressed
    if (fileType === "audio" && sizeMB > 5) return false; // Audio is usually already compressed

    return sizeMB > 5; // General rule: compress files larger than 5MB
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const simulateVirusScan = (fileId: string) => {
    // Simulate virus scanning (1-3 seconds)
    const scanTime = 1000 + Math.random() * 2000;
    setTimeout(() => {
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, virusStatus: "clean", progress: 100 } : f
        )
      );
    }, scanTime);
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadingFile[] = Array.from(fileList).map((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      const compressionRecommended = shouldRecommendCompression(file);

      return {
        file,
        id,
        progress: 0,
        virusStatus: "scanning" as const,
        compressed: compressionRecommended, // Auto-enable compression if recommended
        compressionRecommended,
        sizeBytes: file.size,
      };
    });

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    // Start virus scanning for each file
    newFiles.forEach((f) => {
      simulateVirusScan(f.id);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const toggleCompression = (fileId: string) => {
    setUploadingFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, compressed: !f.compressed } : f))
    );
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleUpload = () => {
    const fileItems: FileItem[] = uploadingFiles
      .filter((f) => f.virusStatus === "clean")
      .map((f) => ({
        id: f.id,
        name: f.file.name,
        type: "file" as const,
        size: formatFileSize(f.compressed ? f.sizeBytes * 0.7 : f.sizeBytes), // Simulate compression
        sizeBytes: f.compressed ? Math.floor(f.sizeBytes * 0.7) : f.sizeBytes,
        compressed: f.compressed,
        virusScan: f.virusStatus,
        uploadedAt: new Date().toISOString().split("T")[0],
        fileType: getFileType(f.file.name),
      }));

    onUpload(fileItems);
    setUploadingFiles([]);
    onClose();
  };

  const allScanned = uploadingFiles.every((f) => f.virusStatus !== "scanning");
  const hasInfected = uploadingFiles.some((f) => f.virusStatus === "infected");
  const canUpload = uploadingFiles.length > 0 && allScanned && !hasInfected;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Upload Files</h2>
                  <p className="text-sm text-white/80">
                    {folderName ? `Uploading to: ${folderName}` : "Upload to My Folders"}
                  </p>
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

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-1">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-600">
                Supports all file types • Automatic virus scanning • Smart compression
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleChange}
                className="hidden"
              />
            </div>

            {/* Uploading Files List */}
            {uploadingFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                  Files ({uploadingFiles.length})
                </h3>
                {uploadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* File Icon */}
                        <div className="p-2 bg-white rounded-lg flex-shrink-0">
                          {getFileType(file.file.name) === "document" && (
                            <FileText className="h-5 w-5 text-blue-500" />
                          )}
                          {getFileType(file.file.name) === "image" && (
                            <Image className="h-5 w-5 text-purple-500" />
                          )}
                          {getFileType(file.file.name) === "video" && (
                            <Video className="h-5 w-5 text-red-500" />
                          )}
                          {getFileType(file.file.name) === "audio" && (
                            <Music className="h-5 w-5 text-green-500" />
                          )}
                          {getFileType(file.file.name) === "archive" && (
                            <Archive className="h-5 w-5 text-orange-500" />
                          )}
                          {getFileType(file.file.name) === "other" && (
                            <File className="h-5 w-5 text-gray-500" />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {file.file.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(file.sizeBytes)}
                            {file.compressed && (
                              <span className="text-green-600">
                                {" "}
                                → ~{formatFileSize(Math.floor(file.sizeBytes * 0.7))} (compressed)
                              </span>
                            )}
                          </p>

                          {/* Virus Scan Status */}
                          <div className="mt-2 flex items-center gap-2">
                            {file.virusStatus === "scanning" && (
                              <div className="flex items-center gap-1.5 text-blue-600 text-xs">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Scanning for viruses...
                              </div>
                            )}
                            {file.virusStatus === "clean" && (
                              <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Clean
                              </div>
                            )}
                            {file.virusStatus === "infected" && (
                              <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Virus detected!
                              </div>
                            )}
                          </div>

                          {/* Compression Toggle */}
                          <div className="mt-2 flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={file.compressed}
                                onChange={() => toggleCompression(file.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700 flex items-center gap-1">
                                <Package className="h-3.5 w-3.5" />
                                Compress file
                              </span>
                            </label>
                            {file.compressionRecommended && (
                              <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Compression Info */}
            {uploadingFiles.some((f) => f.compressionRecommended) && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 Smart Compression:</strong> We've recommended compression for files
                  that will benefit from it. Compressed files save storage space while maintaining
                  quality. Already compressed formats (JPG, MP4, ZIP) won't be compressed further.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {uploadingFiles.length > 0 && (
                  <>
                    {uploadingFiles.filter((f) => f.virusStatus === "clean").length} of{" "}
                    {uploadingFiles.length} files ready
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!canUpload}
                  className={cn(
                    "px-6 py-2.5 font-medium rounded-lg transition-colors",
                    canUpload
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Upload {uploadingFiles.length > 0 && `(${uploadingFiles.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}