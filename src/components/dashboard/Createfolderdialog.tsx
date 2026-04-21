import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Essential for modals
import { FolderPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  onCreateFolder,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");

  // Accessibility: Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError("Folder name is required");
      return;
    }

    if (folderName.length > 100) {
      setError("Folder name is too long");
      return;
    }

    onCreateFolder(folderName.trim());
    setFolderName("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setFolderName("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  // Render into document.body to avoid Z-index issues with the Sidebar
  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose} // Click backdrop to close
    >
      <div 
        className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside the modal from closing it
      >
        <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background/20 backdrop-blur-sm rounded-lg">
                  <FolderPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Create New Folder</h2>
                  <p className="text-sm text-white/80">Organize your files</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-background/20 rounded-lg transition-colors text-white"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter folder name"
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                  "text-foreground placeholder:text-gray-400 bg-background", // Added specific colors for clarity
                  error ? "border-red-300 bg-red-50/30" : "border-gray-300"
                )}
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}