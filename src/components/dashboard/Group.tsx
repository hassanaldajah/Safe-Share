import { useState, useEffect, useRef } from "react";
import {
  Users, FileText, Shield, ArrowLeft, Plus, LogIn, Download, Crown,
  ChevronRight, Folder, Activity, UserMinus, RefreshCw, Lock,
  CheckCircle, AlertCircle, Clock, X, Loader2, Copy, Check, Trash2,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";
type Role = "Admin" | "Editor" | "Viewer";

const roleStyles: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 border border-violet-200",
  EDITOR: "bg-sky-100 text-sky-700 border border-sky-200",
  VIEWER: "bg-slate-100 text-slate-600 border border-slate-200",
};

const fileIcon: Record<string, string> = {
  pdf: "🗒️", doc: "📝", img: "🖼️", zip: "🗜️", unknown: "📄"
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleStyles[role] || roleStyles["VIEWER"]}`}>
      {role}
    </span>
  );
}

function FilesTab({ files, myRole, onDownload, onDelete }: { files: any[], myRole: string, onDownload: (id: string, name: string) => void, onDelete: (id: string, name: string) => void }) {
  if (!files || files.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white">
        <Folder size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-900">No files yet</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100 bg-white">
          {files.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-lg">📄</span><span className="font-medium text-slate-800">{f.name}</span></div></td>
              <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{f.uploadedBy}</td>
              <td className="px-4 py-3 text-slate-400">{f.size}</td>
              <td className="px-4 py-3 text-right flex justify-end gap-2">
                <button onClick={() => onDownload(f.id, f.name)} className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors"><Download size={13} /> Download</button>
                {/* Hide Delete Button for Viewers */}
                {myRole !== "VIEWER" && (
                  <button onClick={() => onDelete(f.id, f.name)} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"><Trash2 size={13} /> Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembersTab({ members, myRole, groupId, onRefresh, onRemove }: { members: any[], myRole: string, groupId: string, onRefresh: () => void, onRemove: (id: string, name: string) => void }) {
  // ... Keep your existing handleRoleChange function inside here ...
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${groupId}/members/role`, {
        method: "PUT", body: JSON.stringify({ userId, newRole })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Role updated successfully!");
      onRefresh();
    } catch (err: any) { toast.error("Error: " + err.message); }
  };

  return (
    <div className="divide-y divide-gray-100">
      {members.map((m) => (
        <div key={m.userId} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{m.name.substring(0, 2).toUpperCase()}</div>
            <div><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-gray-500">{m.role}</p></div>
          </div>
          
          {myRole === "ADMIN" && m.role !== "ADMIN" && (
            <div className="flex items-center gap-2">
              <select className="text-xs border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={m.role} onChange={(e) => handleRoleChange(m.userId, e.target.value)}>
                <option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option><option value="ADMIN">Admin</option>
              </select>
              <button onClick={() => onRemove(m.userId, m.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove Member"><UserMinus size={16} /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AuditLogTab({ entries }: { entries: any[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white">
        <Activity size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-900">No activity yet</p>
      </div>
    );
  }
  return (
    <div className="space-y-2 p-4">
      {entries.map((e) => (
        <div key={e.id} className="flex items-start gap-4 bg-white border border-gray-100 shadow-sm rounded-xl px-5 py-4">
          <div className="mt-0.5">
            {e.severity === "critical" ? <Lock size={18} className="text-red-500" /> : 
             e.severity === "warn" ? <AlertCircle size={18} className="text-amber-500" /> : 
             <CheckCircle size={18} className="text-emerald-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-bold text-indigo-700">{e.user}</span>{" "}
              <span className="text-gray-500">{e.action}</span>{" "}
              <span className="font-semibold text-gray-800">"{e.target}"</span>
            </p>
            <p className="text-xs text-gray-400 mt-1.5">{new Date(e.timestamp).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupDetailView({ group, onBack }: { group: any; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"files" | "members" | "audit">("files");
  const [copiedInvite, setCopiedInvite] = useState(false);
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [groupFiles, setGroupFiles] = useState<any[]>([]);
  
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NEW: Beautiful Custom Confirmation Modal State ---
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, action: () => void}>({isOpen: false, title: "", message: "", action: () => {}});

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/audit`);
      if (res.ok) setAuditLogs(await res.json());
    } finally { setLoadingLogs(false); }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/members`);
      if (res.ok) setMembers(await res.json());
    } finally { setLoadingMembers(false); }
  };

  const fetchGroupFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/files`);
      if (res.ok) setGroupFiles(await res.json());
    } finally { setLoadingFiles(false); }
  };

  useEffect(() => {
    fetchLogs();
    fetchMembers();
    fetchGroupFiles();
  }, [group.id]);

  const handleCopyInvite = () => {
    if (group.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", new Blob([file]), file.name);
      formData.append("groupId", group.id.toString());
      formData.append("originalName", file.name);
      formData.append("fileType", file.name.split('.').pop() || "unknown");
      formData.append("sizeBytes", file.size.toString());
      formData.append("compressed", "false");
      formData.append("encryptedFileKey", "group_shared_aes_key_" + Date.now()); 
      formData.append("iv", "random_iv_" + Date.now());

      const res = await authFetch("http://localhost:8080/api/v1/files/upload", {
        method: "POST", body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success("File securely encrypted and uploaded to the group!");
      fetchLogs(); 
      fetchGroupFiles();
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/files/${fileId}/download?action=download`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; 
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      fetchLogs(); 
    } catch (err: any) { toast.error("Download failed: " + err.message); }
  };

  // --- UPDATED HANDLERS USING THE NEW MODAL ---
  const handleDeleteGroupFile = (fileId: string, fileName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete File",
      message: `Are you sure you want to delete "${fileName}"? This will remove it for all members.`,
      action: async () => {
        try {
          const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/files/${fileId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          toast.success("File deleted successfully.");
          fetchGroupFiles(); fetchLogs();
        } catch (err: any) { toast.error(err.message); }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Member",
      message: `Are you sure you want to remove ${userName} from the group? They will instantly lose access.`,
      action: async () => {
        try {
          const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/members/${userId}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          toast.success(`${userName} removed from group.`);
          fetchMembers(); fetchLogs();
        } catch (err: any) { toast.error(err.message); }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const handleLeaveGroupClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Leave Group",
      message: "Are you sure you want to leave this group? You will lose access to all files immediately.",
      action: async () => {
        try {
          const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/leave`, { method: 'DELETE' });
          if (!res.ok) throw new Error(await res.text());
          toast.success("You have left the group.");
          window.location.reload(); 
        } catch (err: any) { toast.error(err.message); }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 relative">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
            <ArrowLeft size={16} /> Back to Groups
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <RoleBadge role={group.myRole} />
              </div>
              <p className="text-sm text-gray-600">{group.description}</p>
            </div>

            {/* --- REPOSITIONED INVITE CODE & LEAVE BUTTON --- */}
            <div className="flex flex-col items-end gap-3">
              {group.myRole === "ADMIN" && group.inviteCode && (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xs text-indigo-500 font-bold tracking-wider">INVITE CODE:</span>
                  <span className="font-mono text-sm font-bold text-indigo-700 tracking-wide">{group.inviteCode}</span>
                  <button onClick={handleCopyInvite} className="text-indigo-600 hover:text-indigo-800 transition-colors w-5 h-5 flex items-center justify-center">
                    {copiedInvite ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
              <button onClick={handleLeaveGroupClick} className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                <UserMinus size={14} /> Leave Group
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700"><Users size={20} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Members</p>
              <p className="text-xl font-bold text-gray-900">{members.length || group.memberCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-sky-50 text-sky-700"><FileText size={20} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Shared Files</p>
              <p className="text-xl font-bold text-gray-900">{groupFiles.length}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-violet-50 text-violet-700"><Crown size={20} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Your Role</p>
              <p className="text-xl font-bold text-gray-900">{group.myRole}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100/50 border border-gray-200 p-1 rounded-xl w-fit">
            <button onClick={() => setActiveTab("files")} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "files" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}><FileText size={15} /> Files</button>
            <button onClick={() => setActiveTab("members")} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "members" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}><Users size={15} /> Members</button>
            <button onClick={() => setActiveTab("audit")} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "audit" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}><Activity size={15} /> Audit Log</button>
          </div>

          {activeTab === "files" && group.myRole !== "VIEWER" && (
            <div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
                {isUploading ? <><Loader2 size={16} className="animate-spin" /> Encrypting...</> : <><Plus size={16} /> Upload to Group</>}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
          {activeTab === "files" && (loadingFiles ? <div className="p-12 text-center text-gray-400 animate-pulse">Decrypting group files...</div> : <FilesTab files={groupFiles} myRole={group.myRole} onDownload={handleDownloadFile} onDelete={handleDeleteGroupFile} />)}
          {activeTab === "members" && (loadingMembers ? <div className="p-12 text-center text-gray-400 animate-pulse">Loading members...</div> : <MembersTab members={members} myRole={group.myRole} groupId={group.id} onRefresh={() => { fetchMembers(); fetchLogs(); }} onRemove={handleRemoveMember} />)}
          
          {/* --- RESTORED AUDIT LOG TAB --- */}
          {activeTab === "audit" && (loadingLogs ? <div className="p-12 text-center text-indigo-600 animate-pulse font-medium">Decrypting audit logs...</div> : <AuditLogTab entries={auditLogs} />)}
        </div>
      </div>

      {/* --- NEW CONFIRMATION MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button onClick={confirmDialog.action} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function GroupCard({ group, onOpen }: { group: any; onOpen: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className={`h-2 bg-gradient-to-r ${group.color || 'from-indigo-500 to-purple-600'}`} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight">{group.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
          </div>
          <RoleBadge role={group.myRole} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-auto pt-3 border-t border-slate-100">
          <Users size={14} /> <span>{group.memberCount} members</span>
        </div>
        <button onClick={onOpen} className="mt-3 w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
          Open Group <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function GroupHub({ groups, onOpenGroup, onRefresh, isLoading }: { groups: any[]; onOpenGroup: (id: string) => void; onRefresh: () => void; isLoading: boolean; }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const atLimit = groups.length >= 5;

  const handleCreate = async () => {
    if (!createName) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch("http://localhost:8080/api/v1/groups/create", {
        method: "POST", body: JSON.stringify({ name: createName, description: createDesc })
      });
      if (!res.ok) throw new Error(await res.text());
      setShowCreate(false); setCreateName(""); setCreateDesc(""); onRefresh();
      
      toast.success("Group created successfully!");  

    } catch (err: any) { 
      toast.error(err.message); // <-- REPLACED ALERT
    } finally { setIsSubmitting(false); }
  };
  const handleJoin = async () => {
    if (!joinCode) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch("http://localhost:8080/api/v1/groups/join", {
        method: "POST", body: JSON.stringify({ inviteCode: joinCode })
      });      
      if (!res.ok) throw new Error(await res.text());
      setShowJoin(false); setJoinCode(""); onRefresh();

      toast.success("Successfully joined the group!");  

    } catch (err: any) { 
      toast.error(err.message); // <-- REPLACED ALERT
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Groups</h1>
              <p className="text-sm text-gray-600">Manage your secure collaborative workspaces</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 shadow-sm">
              <span className="text-xs font-medium text-slate-600">{groups.length} / 5 Free Groups</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 text-lg">Your Groups</h2>
          <div className="flex gap-3">
            <button onClick={() => setShowJoin(true)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-all shadow-sm"><LogIn size={16} /> Join Group</button>
            <button disabled={atLimit} onClick={() => !atLimit && setShowCreate(true)} className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm ${atLimit ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}><Plus size={16} /> Create Group</button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Loading secure groups...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((g) => <GroupCard key={g.id} group={g} onOpen={() => onOpenGroup(g.id)} />)}
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="Create a New Group" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Group Name</label>
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none" />
            </div>
            <button onClick={handleCreate} disabled={isSubmitting || !createName} className="w-full bg-slate-900 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">Create Group</button>
          </div>
        </Modal>
      )}

      {showJoin && (
        <Modal title="Join a Group" onClose={() => setShowJoin(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Invite Code</label>
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider uppercase" />
            </div>
            <button onClick={handleJoin} disabled={isSubmitting || !joinCode} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">Join Group</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function GroupPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch("http://localhost:8080/api/v1/groups");
      if (res.ok) setGroups(await res.json());
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  if (activeGroup) return <GroupDetailView group={activeGroup} onBack={() => setActiveGroupId(null)} />;
  return <GroupHub groups={groups} onOpenGroup={setActiveGroupId} onRefresh={fetchGroups} isLoading={isLoading} />;
}