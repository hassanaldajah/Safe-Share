import { useState, useEffect } from "react";
import { X, ShieldAlert, Trash2, Users, Loader2, Eye, Download, Share2 } from "lucide-react";

interface AccessRecord {
  receiverTag: string;
  maxViews: number | null;
  maxDownloads: number | null;
  canReshare: boolean;
}

interface ManageAccessProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

export function ManageAccessDialog({ isOpen, onClose, fileId, fileName }: ManageAccessProps) {
  const [accessList, setAccessList] = useState<AccessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchAccessList();
  }, [isOpen, fileId]);

  const fetchAccessList = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/v1/files/${fileId}/shares`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load access list");
      const data = await res.json();
      setAccessList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

 const handleRevoke = async (receiverTag: string) => {
    if (!confirm(`Are you sure you want to permanently revoke access for ${receiverTag}?`)) return;
    
    setRevokingUser(receiverTag);
    try {
      const token = localStorage.getItem("token");
      
      // FIX 1: Use encodeURIComponent to safely send the '@' symbol to Spring Boot!
      const res = await fetch(`/api/v1/files/${fileId}/shares/${encodeURIComponent(receiverTag)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // FIX 2: Actually read the Spring Boot error message so we aren't guessing
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to revoke access");
      }
      
      // Remove the user from the local state list immediately
      setAccessList((prev) => prev.filter(a => a.receiverTag !== receiverTag));
    } catch (err: any) {
      // Show the real error!
      alert(err.message || "Error revoking access.");
    } finally {
      setRevokingUser(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background/20 backdrop-blur-sm rounded-lg"><ShieldAlert className="h-5 w-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Manage Access</h2>
              <p className="text-sm text-white/80">{fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-background/20 rounded-lg transition-colors"><X className="h-5 w-5 text-white" /></button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
          ) : accessList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
              <Users className="h-10 w-10 mb-2 text-muted-foreground" />
              <p>This file is not currently shared with anyone.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessList.map((access) => (
                <div key={access.receiverTag} className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  
                  <div>
                    <p className="font-semibold text-foreground">{access.receiverTag}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {access.maxViews === null ? "Unlimited" : `${access.maxViews} left`}</span>
                      <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {access.maxDownloads === null ? "Unlimited" : `${access.maxDownloads} left`}</span>
                      {access.canReshare && <span className="flex items-center gap-1 text-purple-600 bg-purple-100 px-2 rounded-full"><Share2 className="h-3 w-3" /> Reshare active</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(access.receiverTag)}
                    disabled={revokingUser === access.receiverTag}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors"
                  >
                    {revokingUser === access.receiverTag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}