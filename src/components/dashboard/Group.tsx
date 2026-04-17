import { useState,useEffect, useRef} from "react";
import {
  Users,
  FileText,
  Shield,
  ArrowLeft,
  Plus,
  LogIn,
  Download,
  Crown,
  ChevronRight,
  Folder,
  Activity,
  UserMinus,
  RefreshCw,
  Lock,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/api";
// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Admin" | "Editor" | "Viewer";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  joinedAt: string;
}

interface SharedFile {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  type: "pdf" | "doc" | "img" | "zip";
}

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  severity: "info" | "warn" | "critical";
}

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  myRole: Role;
  color: string;
  members: GroupMember[];
  files: SharedFile[];
  auditLog: AuditEntry[];
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Product Design",
    description: "UI/UX assets and design tokens",
    memberCount: 8,
    myRole: "Admin",
    color: "from-violet-500 to-purple-600",
    members: [
      { id: "m1", name: "Alex Rivera", email: "alex@co.io", role: "Admin", avatar: "AR", joinedAt: "Jan 12, 2025" },
      { id: "m2", name: "Priya Nair", email: "priya@co.io", role: "Editor", avatar: "PN", joinedAt: "Feb 3, 2025" },
      { id: "m3", name: "Sam Chen", email: "sam@co.io", role: "Viewer", avatar: "SC", joinedAt: "Mar 18, 2025" },
      { id: "m4", name: "Jordan Lee", email: "jordan@co.io", role: "Editor", avatar: "JL", joinedAt: "Apr 1, 2025" },
    ],
    files: [
      { id: "f1", name: "Brand Guidelines v3.pdf", size: "4.2 MB", uploadedBy: "Alex Rivera", uploadedAt: "Apr 10, 2025", type: "pdf" },
      { id: "f2", name: "Component Library.zip", size: "18.9 MB", uploadedBy: "Priya Nair", uploadedAt: "Apr 8, 2025", type: "zip" },
      { id: "f3", name: "Onboarding Mockups.doc", size: "2.1 MB", uploadedBy: "Sam Chen", uploadedAt: "Apr 5, 2025", type: "doc" },
    ],
    auditLog: [
      { id: "a1", user: "Alex Rivera", action: "Uploaded", target: "Brand Guidelines v3.pdf", timestamp: "Apr 10, 10:24 AM", severity: "info" },
      { id: "a2", user: "Priya Nair", action: "Removed member", target: "Kai Tanaka", timestamp: "Apr 9, 3:05 PM", severity: "warn" },
      { id: "a3", user: "Jordan Lee", action: "Changed role", target: "Sam Chen → Viewer", timestamp: "Apr 7, 9:15 AM", severity: "warn" },
    ],
  },
  {
    id: "g2",
    name: "Engineering",
    description: "Source code, docs, deployment configs",
    memberCount: 14,
    myRole: "Editor",
    color: "from-sky-500 to-cyan-600",
    members: [
      { id: "m5", name: "Dana Kim", email: "dana@co.io", role: "Admin", avatar: "DK", joinedAt: "Nov 1, 2024" },
      { id: "m6", name: "You", email: "you@co.io", role: "Editor", avatar: "YO", joinedAt: "Jan 20, 2025" },
      { id: "m7", name: "Remy Dupont", email: "remy@co.io", role: "Viewer", avatar: "RD", joinedAt: "Feb 14, 2025" },
    ],
    files: [
      { id: "f4", name: "Architecture Diagram.pdf", size: "1.7 MB", uploadedBy: "Dana Kim", uploadedAt: "Apr 12, 2025", type: "pdf" },
      { id: "f5", name: "API Spec v2.doc", size: "890 KB", uploadedBy: "Remy Dupont", uploadedAt: "Apr 11, 2025", type: "doc" },
    ],
    auditLog: [
      { id: "a4", user: "Dana Kim", action: "Uploaded", target: "Architecture Diagram.pdf", timestamp: "Apr 12, 2:30 PM", severity: "info" },
      { id: "a5", user: "You", action: "Downloaded", target: "API Spec v2.doc", timestamp: "Apr 11, 11:00 AM", severity: "info" },
    ],
  },
  {
    id: "g3",
    name: "Legal & Compliance",
    description: "Contracts, NDAs, and audit reports",
    memberCount: 4,
    myRole: "Viewer",
    color: "from-amber-500 to-orange-600",
    members: [
      { id: "m8", name: "Morgan Patel", email: "morgan@co.io", role: "Admin", avatar: "MP", joinedAt: "Oct 5, 2024" },
      { id: "m9", name: "You", email: "you@co.io", role: "Viewer", avatar: "YO", joinedAt: "Mar 1, 2025" },
    ],
    files: [
      { id: "f6", name: "Master NDA 2025.pdf", size: "320 KB", uploadedBy: "Morgan Patel", uploadedAt: "Jan 6, 2025", type: "pdf" },
      { id: "f7", name: "Vendor Contracts.zip", size: "12.4 MB", uploadedBy: "Morgan Patel", uploadedAt: "Feb 20, 2025", type: "zip" },
    ],
    auditLog: [
      { id: "a6", user: "Morgan Patel", action: "Uploaded", target: "Master NDA 2025.pdf", timestamp: "Jan 6, 9:00 AM", severity: "info" },
      { id: "a7", user: "Morgan Patel", action: "Restricted access", target: "Vendor Contracts.zip", timestamp: "Feb 20, 4:45 PM", severity: "critical" },
    ],
  },
];

const GROUP_LIMIT = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roleStyles: Record<Role, string> = {
  Admin: "bg-violet-100 text-violet-700 border border-violet-200",
  Editor: "bg-sky-100 text-sky-700 border border-sky-200",
  Viewer: "bg-slate-100 text-slate-600 border border-slate-200",
};

const severityIcon = {
  info: <CheckCircle size={14} className="text-emerald-500" />,
  warn: <AlertCircle size={14} className="text-amber-500" />,
  critical: <Lock size={14} className="text-red-500" />,
};

const fileIcon: Record<SharedFile["type"], string> = {
  pdf: "🗒️",
  doc: "📝",
  img: "🖼️",
  zip: "🗜️",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleStyles[role]}`}>
      {role}
    </span>
  );
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab({ files }: { files: SharedFile[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-slate-500 font-medium">File</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium hidden sm:table-cell">Uploaded By</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">Date</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Size</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {files.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{fileIcon[f.type]}</span>
                  <span className="font-medium text-slate-800 truncate max-w-[160px]">{f.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{f.uploadedBy}</td>
              <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{f.uploadedAt}</td>
              <td className="px-4 py-3 text-slate-400">{f.size}</td>
              <td className="px-4 py-3 text-right">
                <button className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors">
                  <Download size={13} /> Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembersTab({ members, myRole, groupId, onRefresh }: { members: any[], myRole: string, groupId: string, onRefresh: () => void }) {
  
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${groupId}/members/role`, {
        method: "PUT",
        body: JSON.stringify({ userId, newRole })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      alert("Role updated successfully!");
      onRefresh(); // Refresh the data to show the new role
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };
  
  return (
    <div className="divide-y divide-gray-100">
      {members.map((m) => (
        <div key={m.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
              {m.name.substring(0,2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-gray-500">{m.role}</p>
            </div>
          </div>
          
          {myRole === "ADMIN" && m.role !== "ADMIN" && (
            <select 
              className="text-xs border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={m.role}
              onChange={(e) => handleRoleChange(m.userId, e.target.value)}
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditLogTab({ entries }: { entries: any[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
        <Activity size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-900">No activity yet</p>
        <p className="text-sm mt-1">Actions taken in this group will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {entries.map((e) => (
        <div key={e.id} className="flex items-start gap-4 bg-white border border-gray-100 shadow-sm rounded-xl px-5 py-4 hover:border-indigo-100 transition-colors">
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
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1.5">
              <Clock size={12} /> 
              {new Date(e.timestamp).toLocaleString(undefined, { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 uppercase tracking-wider ${
            e.severity === "critical" ? "bg-red-50 text-red-700 border border-red-100" : 
            e.severity === "warn" ? "bg-amber-50 text-amber-700 border border-amber-100" : 
            "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}>
            {e.severity}
          </span>
        </div>
      ))}
    </div>
  );
}
 
// ─── Group Detail View ────────────────────────────────────────────────────────

type Tab = "files" | "members" | "audit";

function GroupDetailView({ group, onBack }: { group: any; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("files");
  
  // Live States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  // --- NEW: Upload State & Ref ---
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groupFiles, setGroupFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const fetchGroupFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/files`);
      if (res.ok) setGroupFiles(await res.json());
    } catch (err) {
      console.error("Failed to fetch group files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/audit`);
      if (res.ok) setAuditLogs(await res.json());
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await authFetch(`http://localhost:8080/api/v1/groups/${group.id}/members`);
      if (res.ok) setMembers(await res.json());
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchMembers();
    fetchGroupFiles();
  }, [group.id]);

  // --- NEW: GROUP UPLOAD LOGIC ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Prepare the exact payload Spring Boot is expecting
      const formData = new FormData();

      // IMPORTANT FOR ZERO-KNOWLEDGE: 
      // In a fully complete app, you run WebCrypto AES encryption on 'file' here 
      // before appending it. For now, we append the raw file to make the connection work.
      formData.append("file", new Blob([file]), file.name);
      
      // Attach the Group ID so Spring Boot knows where to put it!
      formData.append("groupId", group.id.toString());
      
      // Metadata
      formData.append("originalName", file.name);
      formData.append("fileType", file.name.split('.').pop() || "unknown");
      formData.append("sizeBytes", file.size.toString());
      formData.append("compressed", "false");
      
      // Dummy crypto keys for the prototype connection
      formData.append("encryptedFileKey", "group_shared_aes_key_" + Date.now()); 
      formData.append("iv", "random_iv_" + Date.now());

      // 2. Send it securely
      const res = await authFetch("http://localhost:8080/api/v1/files/upload", {
        method: "POST",
        body: formData, // NOTE: Do not set Content-Type header manually with FormData!
      });

      if (!res.ok) throw new Error(await res.text());

      alert("File securely encrypted and uploaded to the group!");
      
      // Refresh the audit logs to show the new upload action!
      fetchLogs(); 
      
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      // Reset the input so you can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "files", label: "Files", icon: <FileText size={15} /> },
    { key: "members", label: "Members", icon: <Users size={15} /> },
    { key: "audit", label: "Audit Log", icon: <Activity size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
            <ArrowLeft size={16} /> Back to Groups
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <RoleBadge role={group.myRole} />
              </div>
              <p className="text-sm text-gray-600">{group.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${group.color} text-white`}><Users size={20} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Members</p>
              <p className="text-xl font-bold text-gray-900">{members.length || group.memberCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${group.color} text-white`}><FileText size={20} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Shared Files</p>
              <p className="text-xl font-bold text-gray-900">{group.files?.length || 0}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${group.color} text-white`}><Crown size={20} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Your Role</p>
              <p className="text-xl font-bold text-gray-900">{group.myRole}</p>
            </div>
          </div>
        </div>

        {/* Tabs & Upload Button Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100/50 border border-gray-200 p-1 rounded-xl w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* NEW: Upload Button */}
          {activeTab === "files" && (
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Encrypting...</>
                ) : (
                  <><Plus size={16} /> Upload to Group</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {activeTab === "files" && <FilesTab files={group.files || []} />}
          {activeTab === "files" && (
            loadingFiles ? (
              <div className="p-12 text-center text-gray-400 animate-pulse">Decrypting group files...</div>
            ) : (
              <FilesTab files={groupFiles} />
            )
          )}
          {activeTab === "members" && (
            loadingMembers ? (
              <div className="p-12 text-center text-gray-400 animate-pulse">Loading secure members list...</div>
            ) : (
              <MembersTab members={members} myRole={group.myRole} groupId={group.id} onRefresh={fetchMembers} />
            )
          )}
          {activeTab === "audit" && (
            loadingLogs ? (
              <div className="p-12 text-center text-indigo-600 animate-pulse font-medium">Decrypting audit logs...</div>
            ) : (
              <AuditLogTab entries={auditLogs} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({ group, onOpen }: { group: Group; onOpen: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className={`h-2 bg-gradient-to-r ${group.color}`} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight">{group.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
          </div>
          <RoleBadge role={group.myRole} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-auto pt-3 border-t border-slate-100">
          <Users size={14} />
          <span>{group.memberCount} members</span>
          <span className="mx-1 text-slate-300">·</span>
          <FileText size={14} />
          <span>{group.files.length} files</span>
        </div>
        <button
          onClick={onOpen}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Open Group <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900 text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
// ─── Hub / Main Screen ────────────────────────────────────────────────────────

function GroupHub({ 
  groups, 
  onOpenGroup, 
  onRefresh,
  isLoading 
}: { 
  groups: any[]; 
  onOpenGroup: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  
  // Form States
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const atLimit = groups.length >= 5; // The 5-Group Limit

  // --- API CALL: CREATE GROUP ---
  const handleCreate = async () => {
    if (!createName) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch("http://localhost:8080/api/v1/groups/create", {
        method: "POST",
        body: JSON.stringify({ name: createName, description: createDesc })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
      onRefresh(); // Reload the groups!
    } catch (err: any) {
      alert(err.message); // This will pop up the "Free tier limit reached!" error
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- API CALL: JOIN GROUP ---
  const handleJoin = async () => {
    if (!joinCode) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch("http://localhost:8080/api/v1/groups/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: joinCode })
      });      
      if (!res.ok) throw new Error(await res.text());
      
      setShowJoin(false);
      setJoinCode("");
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Standard App Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Groups</h1>
              <p className="text-sm text-gray-600">Manage your secure collaborative workspaces</p>
            </div>

            {/* Usage pill */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 shadow-sm">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < groups.length ? "bg-violet-500" : "bg-slate-200"}`} />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-600">
                {groups.length} / 5 Free Groups
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Upgrade banner */}
        {atLimit && (
          <div className="mb-6 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown size={20} className="text-yellow-300" />
              </div>
              <div>
                <p className="font-semibold">You've hit the free limit</p>
                <p className="text-white/80 text-sm">Upgrade to Pro for unlimited groups, 50 GB storage, and advanced audit logs.</p>
              </div>
            </div>
            <button className="flex-shrink-0 bg-white text-violet-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors shadow-sm">
              Upgrade →
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 text-lg">Your Groups</h2>
          <div className="flex gap-3">
            <button onClick={() => setShowJoin(true)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-all shadow-sm">
              <LogIn size={16} /> Join Group
            </button>
            <button
              disabled={atLimit}
              onClick={() => !atLimit && setShowCreate(true)}
              className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm ${atLimit ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            >
              <Plus size={16} /> Create Group
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Loading secure groups...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groups.map((g) => (
                <GroupCard key={g.id} group={{...g, members: [], files: [], auditLog: []}} onOpen={() => onOpenGroup(g.id)} />
              ))}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-20 text-gray-400 bg-white border border-gray-200 rounded-2xl shadow-sm mt-4">
                <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900">No groups yet</p>
                <p className="text-sm mt-1">Create or join a group to start collaborating securely.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create a New Group" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Group Name</label>
              <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Marketing Team" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="What does this group share?" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none" />
            </div>
            <button onClick={handleCreate} disabled={isSubmitting || !createName} className="w-full bg-slate-900 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
              {isSubmitting ? "Creating..." : "Create Group"}
            </button>
          </div>
        </Modal>
      )}

      {/* Join Modal */}
      {showJoin && (
        <Modal title="Join a Group" onClose={() => setShowJoin(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Invite Code</label>
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. GRP-XXXX-XXXX" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 font-mono tracking-wider uppercase" />
            </div>
            <p className="text-xs text-slate-400">Ask your group admin for an invite code.</p>
            <button onClick={handleJoin} disabled={isSubmitting || !joinCode} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
               {isSubmitting ? "Joining..." : "Join Group"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export function GroupPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await authFetch("http://localhost:8080/api/v1/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch groups on initial load
  useEffect(() => {
    fetchGroups();
  }, []);

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  if (activeGroup) {
    // We pass a dummy structure for files/members until we build the details API
    return <GroupDetailView group={{...activeGroup, members: [], files: [], auditLog: []}} onBack={() => setActiveGroupId(null)} />;
  }

  return <GroupHub groups={groups} onOpenGroup={setActiveGroupId} onRefresh={fetchGroups} isLoading={isLoading} />;
}