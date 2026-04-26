import {
  Bell, ChevronDown, X, FileText, Users,
  MessageSquare, Clock, LogOut, User, Settings, HelpCircle,
  Copy, Check, ShieldCheck, Menu, Camera, Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// --- IMPORT THE AUTH CONTEXT ---
import { useAuth } from "@/context/AuthContext"; // Adjust this path if your AuthContext is elsewhere!

interface TopBarProps {
  sidebarCollapsed: boolean;
  onHamburgerClick: () => void;
}

interface Notification {
  id: string;
  type: "file" | "share" | "message" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function DashboardTopBar({ sidebarCollapsed, onHamburgerClick }: TopBarProps) {
  const navigate = useNavigate();
  const [profileImg, setProfileImg] = useState<string | null>(localStorage.getItem("profileImage"));
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // --- PULL REAL DATA FROM CONTEXT ---
  const { user, logout, updateUser } = useAuth();

  // Fallback just in case the context hasn't loaded yet
  const currentUser = user || {
    name: "Loading...",
    email: "...",
    searchTag: "...",
  };

  // Dynamically get their initials for the avatar
  const getInitials = (name: string) => {
    if (!name || name === "Loading...") return "U";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };
  const initials = getInitials(currentUser.name);

  const unreadCount = notifications.filter((n) => !n.read).length;
  useEffect(() => {
    const handleImageUpdate = () => {
      setProfileImg(localStorage.getItem("profileImage"));
    };

    // Listen for the signal from ProfilePage
    window.addEventListener("profileImageUpdated", handleImageUpdate);

    // Cleanup
    return () => window.removeEventListener("profileImageUpdated", handleImageUpdate);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileMenu(false);
    };
    if (showNotifications || showProfileMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showProfileMenu]);

  const handleCopyTag = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(currentUser.searchTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout(); // Let the AuthContext handle the cleanup!
    setShowProfileMenu(false);
    navigate("/");
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await authFetch("http://localhost:8080/api/v1/users/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || await res.text());
      }
      
      const data = await res.json();
      const newUrl = data.url;
      
      setProfileImg(newUrl);
      localStorage.setItem("profileImage", newUrl);
      
      // Best effort context update if the context supports mutating
      updateUser({ profilePictureUrl: newUrl });
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <header
      className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-end border-b border-border bg-card px-4 lg:px-6 transition-all duration-300 left-0 ${sidebarCollapsed ? 'lg:left-16' : 'lg:left-64'}`}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onHamburgerClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden mr-auto"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5">{unreadCount} New</Badge>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0 ${!notification.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{notification.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Bell className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No new notifications</p>
                    <p className="text-xs text-muted-foreground mt-1">We'll notify you when something important happens.</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="border-t border-border p-2 bg-muted/10">
                  <button className="w-full py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 border border-background shadow-sm">
              {(currentUser.profilePictureUrl && currentUser.profilePictureUrl !== "null") ? (
                <AvatarImage src={currentUser.profilePictureUrl} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold border border-primary/20">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start lg:flex">
              <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground">User</span>
            </div>
            <ChevronDown className={`hidden h-4 w-4 text-muted-foreground transition-transform lg:block ${showProfileMenu ? "rotate-180" : ""}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="border-b border-border p-4 bg-muted/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative group cursor-pointer h-12 w-12">
                    <label htmlFor="profile-upload" className="cursor-pointer block w-full h-full relative">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20 absolute inset-0 border border-background shadow-sm">
                        {(currentUser.profilePictureUrl && currentUser.profilePictureUrl !== "null") ? (
                          <AvatarImage src={currentUser.profilePictureUrl} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold border border-primary/20">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </div>
                    </label>
                    <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} disabled={isUploading} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Search Tag</span>
                    <button onClick={handleCopyTag} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-sm font-mono font-bold text-foreground bg-muted/50 p-1.5 rounded text-center border border-border/50">
                    {currentUser.searchTag}
                  </p>
                  <div className="pt-2 mt-2 border-t border-border flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">E2E Encryption Active</span>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted" onClick={() => setShowProfileMenu(false)}>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>
                <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted" onClick={() => setShowProfileMenu(false)}>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>

              <div className="border-t border-border py-2 bg-muted/10">
                <button className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}