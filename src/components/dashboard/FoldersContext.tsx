import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { authFetch } from "@/lib/api";
export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: string;
  sizeBytes?: number;
  compressed: boolean;
  virusScan: "clean" | "scanning" | "infected";
  uploadedAt: string;
  fileType?: "document" | "image" | "video" | "audio" | "archive" | "other";
  parentId?: string;
  children?: FileItem[];
  deletedAt?: string;
  originalParentId?: string;
  encryptedFileKey?: string;
  iv?: string;
}

interface FoldersContextType {
  files: FileItem[];
  trashedFiles: FileItem[];
  addFolder: (name: string, parentId?: string) => void;
  addFile: (file: FileItem, parentId?: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  // --- CHANGED TO PROMISES FOR ASYNC BACKEND CALLS ---
  permanentlyDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  // ---------------------------------------------------
  updateFileStatus: (id: string, updates: Partial<FileItem>) => void;
  getFilesInFolder: (folderId: string) => FileItem[];
  getFolderSize: (folderId: string) => { size: string; sizeBytes: number };
  getTotalStorage: () => { used: number; usedFormatted: string; activeFormatted: string; trashedFormatted: string };
  fetchFiles: () => Promise<void>;
  isLoading: boolean;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

 const fetchFiles = async () => {
    setIsLoading(true);
    try {
      // Clean and simple using authFetch!
      const response = await authFetch("http://localhost:8080/api/v1/files");
      
      if (response.ok) {
        const data = await response.json();
        const mappedFiles: FileItem[] = data.map((f: any) => ({
          id: f.id.toString(),
          name: f.name,
          type: "file",
          size: formatFileSize(f.sizeBytes),
          sizeBytes: f.sizeBytes,
          compressed: f.compressed,
          virusScan: f.virusScan || "clean",
          uploadedAt: f.uploadedAt ? f.uploadedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          fileType: f.fileType || "other",
          encryptedFileKey: f.encryptedFileKey,
          iv: f.iv
        }));
        setFiles(mappedFiles);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFolderSize = (children: FileItem[] = []): number => {
    return children.reduce((total, item) => {
      if (item.type === "file") return total + (item.sizeBytes || 0);
      return total;
    }, 0);
  };

  const calculateItemSize = (item: FileItem): number => {
    if (item.type === "file") return item.sizeBytes || 0;
    else if (item.type === "folder" && item.children) return calculateFolderSize(item.children);
    return 0;
  };

  const getFolderSize = (folderId: string): { size: string; sizeBytes: number } => {
    const folder = files.find((f) => f.id === folderId && f.type === "folder");
    if (!folder || !folder.children) return { size: "0 B", sizeBytes: 0 };
    const totalBytes = calculateFolderSize(folder.children);
    return { size: formatFileSize(totalBytes), sizeBytes: totalBytes };
  };

  const getTotalStorage = () => {
    const activeStorage = files.reduce((total, item) => total + calculateItemSize(item), 0);
    const trashedStorage = trashedFiles.reduce((total, item) => total + calculateItemSize(item), 0);
    const totalUsed = activeStorage + trashedStorage;
    return {
      used: totalUsed,
      usedFormatted: formatFileSize(totalUsed),
      activeFormatted: formatFileSize(activeStorage),
      trashedFormatted: formatFileSize(trashedStorage),
    };
  };

  const updateFolderSizes = (fileList: FileItem[]): FileItem[] => {
    return fileList.map((file) => {
      if (file.type === "folder" && file.children) {
        const totalBytes = calculateFolderSize(file.children);
        return { ...file, size: formatFileSize(totalBytes), sizeBytes: totalBytes };
      }
      return file;
    });
  };

  const addFolder = (name: string, parentId?: string) => {
    const newFolder: FileItem = {
      id: Date.now().toString(), name, type: "folder", size: "0 B", sizeBytes: 0,
      compressed: false, virusScan: "clean", uploadedAt: new Date().toISOString().split("T")[0],
      parentId, children: [],
    };
    setFiles((prev) => updateFolderSizes([newFolder, ...prev]));
  };

  const addFile = (file: FileItem, parentId?: string) => {
    if (parentId) {
      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.id === parentId && f.type === "folder") {
            return { ...f, children: [file, ...(f.children || [])] };
          }
          return f;
        });
        return updateFolderSizes(updated);
      });
    } else {
      setFiles((prev) => updateFolderSizes([file, ...prev]));
    }
  };

  const moveToTrash = (id: string) => {
    setFiles((prev) => {
      let itemToTrash: FileItem | null = null;
      const filtered = prev.filter((file) => {
        if (file.id === id) {
          itemToTrash = { ...file, deletedAt: new Date().toISOString(), originalParentId: undefined };
          return false;
        }
        return true;
      });
      const updated = filtered.map((file) => {
        if (file.type === "folder" && file.children) {
          const childToTrash = file.children.find((child) => child.id === id);
          if (childToTrash) itemToTrash = { ...childToTrash, deletedAt: new Date().toISOString(), originalParentId: file.id };
          return { ...file, children: file.children.filter((child) => child.id !== id) };
        }
        return file;
      });
      if (itemToTrash) setTrashedFiles((prevTrash) => [itemToTrash!, ...prevTrash]);
      return updateFolderSizes(updated);
    });
  };

  const restoreFromTrash = (id: string) => {
    const itemToRestore = trashedFiles.find((item) => item.id === id);
    if (!itemToRestore) return;
    const restoredItem = { ...itemToRestore };
    delete restoredItem.deletedAt;
    const originalParentId = restoredItem.originalParentId;
    delete restoredItem.originalParentId;

    if (originalParentId) {
      setFiles((prev) => {
        const updated = prev.map((file) => {
          if (file.id === originalParentId && file.type === "folder") {
            return { ...file, children: [restoredItem, ...(file.children || [])] };
          }
          return file;
        });
        return updateFolderSizes(updated);
      });
    } else {
      setFiles((prev) => updateFolderSizes([restoredItem, ...prev]));
    }
    setTrashedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // --- NEW: THE MAGIC DELETE FUNCTION ---
  const permanentlyDelete = async (id: string) => {
    try {
      // Tell Spring Boot to physically destroy the file using authFetch
      const response = await authFetch(`http://localhost:8080/api/v1/files/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        // If successful, wipe it from the React UI
        setTrashedFiles((prev) => prev.filter((item) => item.id !== id));
      } else {
        const errorText = await response.text();
        console.error("Delete failed:", errorText);
        alert("Failed to delete the file from the server.");
      }
    } catch (error) {
      console.error("Network error during delete:", error);
    }
  };

  // --- NEW: THE MAGIC EMPTY TRASH FUNCTION ---
  const emptyTrash = async () => {
    // Loop through all trashed items and destroy them on the server one by one
    for (const file of trashedFiles) {
      if (file.type === "file") {
        await permanentlyDelete(file.id);
      }
    }
  };

  const updateFileStatus = (id: string, updates: Partial<FileItem>) => {
    setFiles((prev) => {
      const updated = prev.map((file) => {
        if (file.id === id) return { ...file, ...updates };
        if (file.type === "folder" && file.children) {
          return { ...file, children: file.children.map((c) => c.id === id ? { ...c, ...updates } : c) };
        }
        return file;
      });
      return updateFolderSizes(updated);
    });
  };

  const getFilesInFolder = (folderId: string): FileItem[] => {
    const folder = files.find((f) => f.id === folderId && f.type === "folder");
    return folder?.children || [];
  };

  return (
    <FoldersContext.Provider
      value={{ 
        files, trashedFiles, addFolder, addFile, moveToTrash, restoreFromTrash,
        permanentlyDelete, emptyTrash, updateFileStatus, getFilesInFolder, 
        getFolderSize, getTotalStorage, fetchFiles, isLoading
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) throw new Error("useFolders must be used within a FoldersProvider");
  return context;
}