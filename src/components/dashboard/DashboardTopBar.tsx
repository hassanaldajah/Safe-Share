import { 
  Search, Bell, ChevronDown, Home, X, FileText, Users, 
  MessageSquare, Clock, LogOut, User, Settings, HelpCircle,
  Copy, Check, ShieldCheck 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// --- IMPORT THE AUTH CONTEXT ---
import { useAuth } from "@/context/AuthContext"; // Adjust this path if your AuthContext is elsewhere!

interface TopBarProps {
  sidebarCollapsed: boolean;
}

interface Notification {
  id: string;
  type: "file" | "share" | "message" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function DashboardTopBar({ sidebarCollapsed }: TopBarProps) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // --- PULL REAL DATA FROM CONTEXT ---
  const { user, logout } = useAuth();
  
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

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 transition-all duration-300"
      style={{ left: sidebarCollapsed ? "64px" : "256px" }}
    >
      <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Home className="h-5 w-5" />
      </Link>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder="Search files and folders..." className="h-10 w-full border-muted bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:ring-primary" />
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">{initials}</AvatarFallback>
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
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">{initials}</AvatarFallback>
                  </Avatar>
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
                  <span>Security Settings</span>
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