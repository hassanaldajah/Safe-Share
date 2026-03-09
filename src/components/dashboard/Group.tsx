import { useState } from "react";
import {
  Users,
  Shield,
  Clock,
  Download,
  Eye,
  Upload,
  FolderPlus,
  Link2,
  Settings,
  MoreVertical,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Crown,
  Edit3,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  UserPlus,
  Calendar,
  Activity,
  Lock,
  Key,
  Timer,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type UserRole = "Viewer" | "Editor" | "Co-Owner";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastActive: Date;
  joinedAt: Date;
}

interface SharedFile {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: "document" | "image" | "video" | "audio" | "archive" | "other";
  size?: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloadCount: number;
  lastAccessed?: Date;
  isEncrypted: true;
}

interface FileExchange {
  id: string;
  fileName: string;
  sentBy: string;
  sentAt: Date;
  size: string;
}

interface AuditLogEntry {
  id: string;
  action: "uploaded" | "downloaded" | "opened" | "permission_changed" | "member_added" | "member_removed";
  user: string;
  target: string;
  timestamp: Date;
  details?: string;
}

interface SecuritySettings {
  linkExpiry?: number;
  otpRequired: boolean;
  downloadLimit?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GroupPage() {
  const currentUser = {
    id: "current",
    role: "Co-Owner" as UserRole,
  };

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [hasGroup, setHasGroup] = useState(false);
  const [groupMode, setGroupMode] = useState<"create" | "join" | null>(null);
  const [joinGroupId, setJoinGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@university.edu",
      role: "Co-Owner",
      lastActive: new Date(Date.now() - 1000 * 60 * 5),
      joinedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael.chen@university.edu",
      role: "Editor",
      lastActive: new Date(Date.now() - 1000 * 60 * 30),
      joinedAt: new Date("2024-01-18"),
    },
    {
      id: "3",
      name: "Emily Davis",
      email: "emily.davis@university.edu",
      role: "Viewer",
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
      joinedAt: new Date("2024-01-20"),
    },
    {
      id: "4",
      name: "James Wilson",
      email: "james.wilson@university.edu",
      role: "Editor",
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24),
      joinedAt: new Date("2024-01-22"),
    },
  ]);

  const [sharedFiles] = useState<SharedFile[]>([
    {
      id: "f1",
      name: "Research Paper Draft v3.pdf",
      type: "file",
      fileType: "document",
      size: "2.4 MB",
      uploadedBy: "Sarah Johnson",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      downloadCount: 7,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 45),
      isEncrypted: true,
    },
    {
      id: "f2",
      name: "Dataset Analysis",
      type: "folder",
      uploadedBy: "Michael Chen",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      downloadCount: 3,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 5),
      isEncrypted: true,
    },
    {
      id: "f3",
      name: "Experiment_Results.xlsx",
      type: "file",
      fileType: "document",
      size: "1.8 MB",
      uploadedBy: "Emily Davis",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      downloadCount: 12,
      lastAccessed: new Date(Date.now() - 1000 * 60 * 30),
      isEncrypted: true,
    },
  ]);

  const [fileExchanges] = useState<FileExchange[]>([
    {
      id: "e1",
      fileName: "Meeting_Notes.pdf",
      sentBy: "Sarah Johnson",
      sentAt: new Date(Date.now() - 1000 * 60 * 15),
      size: "156 KB",
    },
    {
      id: "e2",
      fileName: "Code_Review.zip",
      sentBy: "Michael Chen",
      sentAt: new Date(Date.now() - 1000 * 60 * 60),
      size: "4.2 MB",
    },
  ]);

  const [auditLog] = useState<AuditLogEntry[]>([
    {
      id: "a1",
      action: "downloaded",
      user: "Michael Chen",
      target: "Research Paper Draft v3.pdf",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "a2",
      action: "uploaded",
      user: "Sarah Johnson",
      target: "Research Paper Draft v3.pdf",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
      id: "a3",
      action: "opened",
      user: "Emily Davis",
      target: "Experiment_Results.xlsx",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "a4",
      action: "permission_changed",
      user: "Sarah Johnson",
      target: "Michael Chen",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      details: "Changed role to Editor",
    },
  ]);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    linkExpiry: 24,
    otpRequired: true,
    downloadLimit: 10,
  });

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("Viewer");

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case "Co-Owner":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Editor":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Viewer":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "Co-Owner":
        return <Crown className="h-3.5 w-3.5" />;
      case "Editor":
        return <Edit3 className="h-3.5 w-3.5" />;
      case "Viewer":
        return <Eye className="h-3.5 w-3.5" />;
    }
  };

  const getFileIcon = (fileType?: SharedFile["fileType"]) => {
    switch (fileType) {
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

  const getActionIcon = (action: AuditLogEntry["action"]) => {
    switch (action) {
      case "uploaded":
        return <Upload className="h-4 w-4 text-green-600" />;
      case "downloaded":
        return <Download className="h-4 w-4 text-blue-600" />;
      case "opened":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "permission_changed":
        return <Settings className="h-4 w-4 text-orange-600" />;
      case "member_added":
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case "member_removed":
        return <X className="h-4 w-4 text-red-600" />;
    }
  };

  const canManageMembers = currentUser.role === "Co-Owner";
  const canUploadFiles = currentUser.role === "Co-Owner" || currentUser.role === "Editor";

  // ============================================================================
  // NO GROUP YET — LANDING SCREEN
  // ============================================================================

  if (!hasGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Groups</h1>
            <p className="text-gray-600">Create a new group or join an existing one</p>
          </div>

          {!groupMode && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGroupMode("create")}
                className="p-6 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <FolderPlus className="h-6 w-6 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-900">Create Group</p>
                <p className="text-sm text-gray-500 mt-1">Start a new group</p>
              </button>

              <button
                onClick={() => setGroupMode("join")}
                className="p-6 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900">Join Group</p>
                <p className="text-sm text-gray-500 mt-1">Enter a group ID</p>
              </button>
            </div>
          )}

          {groupMode === "create" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg">Create a New Group</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Research Team"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setGroupMode(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => { if (newGroupName.trim()) setHasGroup(true); }}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Group
                </button>
              </div>
            </div>
          )}

          {groupMode === "join" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg">Join a Group</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group ID
                </label>
                <input
                  type="text"
                  value={joinGroupId}
                  onChange={(e) => setJoinGroupId(e.target.value)}
                  placeholder="Enter group ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setGroupMode(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => { if (joinGroupId.trim()) setHasGroup(true); }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Join Group
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER — MAIN GROUP PAGE
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* ============================================================================
          HEADER SECTION
          ============================================================================ */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {newGroupName || "ACM Research Team"}
                </h1>
                <p className="text-gray-600 mb-2">
                  Collaborative space for ACM research project - Secure encrypted file sharing
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>Created January 15, 2024</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{members.length} members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">End-to-end encrypted</span>
                  </div>
                </div>
              </div>
            </div>

            {canManageMembers && (
              <button
                onClick={() => setShowInviteDialog(true)}
                className="px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <UserPlus className="h-4 w-4" />
                Invite Members
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ============================================================================
              LEFT COLUMN: Members & File Exchange
              ============================================================================ */}
          <div className="space-y-6">
            {/* MEMBERS PANEL */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Group Members ({members.length})
                </h3>
              </div>

              <div className="divide-y divide-gray-200">
                {members.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">{member.name}</p>
                          {member.id === currentUser.id && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{member.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                              getRoleBadgeColor(member.role)
                            )}
                          >
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            • Active {formatTimeAgo(member.lastActive)}
                          </span>
                        </div>
                      </div>

                      {canManageMembers && member.id !== currentUser.id && (
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FILE EXCHANGE PANEL */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Secure File Exchange
                </h3>
                <p className="text-xs text-gray-600">
                  Share encrypted files instantly with group members
                </p>
              </div>

              <div className="p-4 border-b border-gray-200">
                <button className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  Send Encrypted File
                </button>
              </div>

              <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {fileExchanges.map((exchange) => (
                  <div key={exchange.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <File className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {exchange.fileName}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {exchange.sentBy} • {exchange.size}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatTimeAgo(exchange.sentAt)}
                        </p>
                      </div>
                      <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================================
              CENTER & RIGHT COLUMNS: Shared Files & Activity Log
              ============================================================================ */}
          <div className="lg:col-span-2 space-y-6">
            {/* SHARED GROUP FOLDER AREA */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Shared Group Files
                </h3>
                <div className="flex gap-2">
                  {canUploadFiles && (
                    <>
                      <button className="px-3 py-1.5 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 text-sm">
                        <FolderPlus className="h-4 w-4" />
                        New Folder
                      </button>
                      <button className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                        <Upload className="h-4 w-4" />
                        Upload File
                      </button>
                    </>
                  )}
                  {canManageMembers && (
                    <button
                      onClick={() => setShowSecurityDialog(true)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Uploaded By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Upload Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Downloads
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Last Accessed
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sharedFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {file.type === "folder" ? (
                              <div className="p-2 bg-amber-50 rounded-lg">
                                <ChevronRight className="h-5 w-5 text-amber-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-50 rounded-lg">
                                {getFileIcon(file.fileType)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              {file.size && (
                                <p className="text-xs text-gray-500">{file.size}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{file.uploadedBy}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatTimeAgo(file.uploadedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Download className="h-3.5 w-3.5" />
                            {file.downloadCount}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {file.lastAccessed ? formatTimeAgo(file.lastAccessed) : "Never"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
                              title="Share Link"
                            >
                              <Link2 className="h-4 w-4" />
                            </button>
                            {canManageMembers && (
                              <button
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECURITY WARNING */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 mb-1">
                    Zero-Knowledge Encryption Active
                  </p>
                  <p className="text-green-700">
                    All files remain end-to-end encrypted. SafeShare cannot decrypt shared data.
                    Only group members with proper permissions can access files.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIVITY & AUDIT LOG */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Activity & Audit Log
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Full accountability tracking for all group actions
                </p>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0 mt-0.5">
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">{entry.user}</span>{" "}
                          <span className="text-gray-600">
                            {entry.action.replace("_", " ")}
                          </span>{" "}
                          <span className="font-medium">{entry.target}</span>
                        </p>
                        {entry.details && (
                          <p className="text-xs text-gray-600 mt-0.5">{entry.details}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(entry.timestamp)} •{" "}
                          {entry.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================
          INVITE MEMBERS DIALOG
          ============================================================================ */}
      {showInviteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Invite Member</h2>
                      <p className="text-sm text-white/80">Add someone to this group</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowInviteDialog(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* User ID Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      placeholder="e.g. USR-84729"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Ask your colleague for their User ID from their profile settings.
                  </p>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <div className="space-y-2">
                    {(["Viewer", "Editor", "Co-Owner"] as UserRole[]).map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={inviteRole === role}
                          onChange={() => setInviteRole(role)}
                          className="text-purple-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {getRoleIcon(role)}
                            {role}
                          </p>
                          <p className="text-xs text-gray-600">
                            {role === "Viewer" && "Can view and download files"}
                            {role === "Editor" && "Can upload, edit, and download files"}
                            {role === "Co-Owner" && "Full control including member management"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowInviteDialog(false)}
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================
          SECURITY SETTINGS DIALOG
          ============================================================================ */}
      {showSecurityDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Group Sharing Security
                      </h2>
                      <p className="text-sm text-white/80">Configure access controls</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSecurityDialog(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Link Expiry */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Timer className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Link Expiry Time</p>
                      <p className="text-sm text-gray-600">
                        Shared links expire after this duration
                      </p>
                    </div>
                  </div>
                  <select
                    value={securitySettings.linkExpiry || ""}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        linkExpiry: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No expiry</option>
                    <option value="1">1 hour</option>
                    <option value="24">24 hours</option>
                    <option value="168">7 days</option>
                    <option value="720">30 days</option>
                  </select>
                </div>

                {/* OTP Requirement */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.otpRequired}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          otpRequired: e.target.checked,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Require OTP</p>
                        <p className="text-sm text-gray-600">
                          Recipients must verify email with one-time password
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Download Limit */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Download Limit</p>
                      <p className="text-sm text-gray-600">
                        Maximum downloads per shared link
                      </p>
                    </div>
                  </div>
                  <select
                    value={securitySettings.downloadLimit || ""}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        downloadLimit: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Unlimited</option>
                    <option value="1">1 download</option>
                    <option value="5">5 downloads</option>
                    <option value="10">10 downloads</option>
                    <option value="50">50 downloads</option>
                  </select>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                      These settings apply to new shared links. Existing links retain their
                      original settings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSecurityDialog(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowSecurityDialog(false)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}