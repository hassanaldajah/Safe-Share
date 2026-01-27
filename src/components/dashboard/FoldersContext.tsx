import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

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
}

interface FoldersContextType {
  files: FileItem[];
  trashedFiles: FileItem[];
  addFolder: (name: string, parentId?: string) => void;
  addFile: (file: FileItem, parentId?: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  updateFileStatus: (id: string, updates: Partial<FileItem>) => void;
  getFilesInFolder: (folderId: string) => FileItem[];
  getFolderSize: (folderId: string) => { size: string; sizeBytes: number };
  getTotalStorage: () => { used: number; usedFormatted: string; activeFormatted: string; trashedFormatted: string };
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "Project Proposal.pdf",
      type: "file",
      size: "2.4 MB",
      sizeBytes: 2400000,
      compressed: true,
      virusScan: "clean",
      uploadedAt: "2024-01-20",
      fileType: "document",
    },
    {
      id: "2",
      name: "Team Photos",
      type: "folder",
      size: "0 B",
      sizeBytes: 0,
      compressed: false,
      virusScan: "clean",
      uploadedAt: "2024-01-18",
      children: [],
    },
    {
      id: "3",
      name: "presentation.pptx",
      type: "file",
      size: "8.7 MB",
      sizeBytes: 8700000,
      compressed: false,
      virusScan: "clean",
      uploadedAt: "2024-01-19",
      fileType: "document",
    },
    {
      id: "4",
      name: "vacation.jpg",
      type: "file",
      size: "4.2 MB",
      sizeBytes: 4200000,
      compressed: true,
      virusScan: "clean",
      uploadedAt: "2024-01-17",
      fileType: "image",
    },
    {
      id: "5",
      name: "database_backup.zip",
      type: "file",
      size: "156 MB",
      sizeBytes: 156000000,
      compressed: false,
      virusScan: "scanning",
      uploadedAt: "2024-01-21",
      fileType: "archive",
    },
  ]);

  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const calculateFolderSize = (children: FileItem[] = []): number => {
    return children.reduce((total, item) => {
      if (item.type === "file") {
        return total + (item.sizeBytes || 0);
      }
      return total;
    }, 0);
  };

  const calculateItemSize = (item: FileItem): number => {
    if (item.type === "file") {
      return item.sizeBytes || 0;
    } else if (item.type === "folder" && item.children) {
      return calculateFolderSize(item.children);
    }
    return 0;
  };

  const getFolderSize = (folderId: string): { size: string; sizeBytes: number } => {
    const folder = files.find((f) => f.id === folderId && f.type === "folder");
    if (!folder || !folder.children) {
      return { size: "0 B", sizeBytes: 0 };
    }
    
    const totalBytes = calculateFolderSize(folder.children);
    return {
      size: formatFileSize(totalBytes),
      sizeBytes: totalBytes,
    };
  };

  const getTotalStorage = () => {
    const activeStorage = files.reduce((total, item) => {
      return total + calculateItemSize(item);
    }, 0);

    const trashedStorage = trashedFiles.reduce((total, item) => {
      return total + calculateItemSize(item);
    }, 0);

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
        return {
          ...file,
          size: formatFileSize(totalBytes),
          sizeBytes: totalBytes,
        };
      }
      return file;
    });
  };

  const addFolder = (name: string, parentId?: string) => {
    const newFolder: FileItem = {
      id: Date.now().toString(),
      name,
      type: "folder",
      size: "0 B",
      sizeBytes: 0,
      compressed: false,
      virusScan: "clean",
      uploadedAt: new Date().toISOString().split("T")[0],
      parentId,
      children: [],
    };
    
    if (parentId) {
      console.warn("Nested folders not supported - creating at root level");
      setFiles((prev) => updateFolderSizes([newFolder, ...prev]));
    } else {
      setFiles((prev) => updateFolderSizes([newFolder, ...prev]));
    }
  };

  const addFile = (file: FileItem, parentId?: string) => {
    if (parentId) {
      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.id === parentId && f.type === "folder") {
            const newChildren = [file, ...(f.children || [])];
            return { ...f, children: newChildren };
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
          itemToTrash = { 
            ...file, 
            deletedAt: new Date().toISOString(),
            originalParentId: undefined
          };
          return false;
        }
        return true;
      });
      
      const updated = filtered.map((file) => {
        if (file.type === "folder" && file.children) {
          const childToTrash = file.children.find((child) => child.id === id);
          if (childToTrash) {
            itemToTrash = { 
              ...childToTrash, 
              deletedAt: new Date().toISOString(),
              originalParentId: file.id
            };
          }
          return {
            ...file,
            children: file.children.filter((child) => child.id !== id),
          };
        }
        return file;
      });
      
      if (itemToTrash) {
        setTrashedFiles((prevTrash) => [itemToTrash!, ...prevTrash]);
      }
      
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
            return {
              ...file,
              children: [restoredItem, ...(file.children || [])],
            };
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

  const permanentlyDelete = (id: string) => {
    setTrashedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const emptyTrash = () => {
    setTrashedFiles([]);
  };

  const updateFileStatus = (id: string, updates: Partial<FileItem>) => {
    setFiles((prev) => {
      const updated = prev.map((file) => {
        if (file.id === id) {
          return { ...file, ...updates };
        }
        if (file.type === "folder" && file.children) {
          return {
            ...file,
            children: file.children.map((child) =>
              child.id === id ? { ...child, ...updates } : child
            ),
          };
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
        files, 
        trashedFiles,
        addFolder, 
        addFile, 
        moveToTrash,
        restoreFromTrash,
        permanentlyDelete,
        emptyTrash,
        updateFileStatus, 
        getFilesInFolder, 
        getFolderSize,
        getTotalStorage
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FoldersContext);
  if (context === undefined) {
    throw new Error("useFolders must be used within a FoldersProvider");
  }
  return context;
}