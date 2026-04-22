import { 
  FolderOpen, 
  Users, 
  UsersRound, 
  MessageSquare, 
  Trash2, 
  Settings,
  ChevronLeft,
  LayoutDashboard,
  Cloud,
  Bot,
  X
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (item: string) => void;
  // Mobile-specific props
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "my-folders", label: "My Folders", icon: FolderOpen, path: "/MyFolders" },
  { id: "groups", label: "Groups", icon: UsersRound, path: "/groups" },
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/chat" },
  { id: "backup", label: "Backup", icon: Cloud, path: "/backup" },
  { id: "ai-assistant", label: "AI Assistant", icon: Bot, path: "/ai-assistant" },
  { id: "trash", label: "Trash", icon: Trash2, path: "/trash" },
];

export function DashboardSidebar({
  collapsed,
  onToggle,
  activeItem,
  onItemClick,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();

  const getActiveItem = () => {
    const currentPath = location.pathname;
    if (currentPath.startsWith("/settings")) return "settings";
    if (currentPath.startsWith("/profile")) return "profile";
    const matchedItem = navItems.find(item => item.path === currentPath);
    if (matchedItem) return matchedItem.id;
    return activeItem;
  };

  const currentActiveItem = getActiveItem();

  const handleItemClick = (id: string) => {
    onItemClick(id);
    onMobileClose(); // always close mobile drawer on nav
  };

  return (
    <aside
      className={cn(
        // Base: fixed, full height, sidebar bg, smooth transitions
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out",
        // Desktop: always visible, width controlled by collapsed state
        "hidden lg:block",
        collapsed ? "lg:w-16" : "lg:w-64",
        // Mobile: shown as overlay slide-in when mobileOpen
        mobileOpen && "!block w-64"
      )}
    >
      {/* Logo / Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 transition-opacity hover:opacity-80",
            collapsed && !mobileOpen && "mx-auto"
          )}
          title="Go to Home"
        >
          {(!collapsed || mobileOpen) && (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary flex-shrink-0">
                <FolderOpen className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-accent-foreground">SafeShare</span>
            </>
          )}
          {collapsed && !mobileOpen && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <FolderOpen className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = currentActiveItem === item.id;
          const linkClasses = cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          );

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => handleItemClick(item.id)}
              className={linkClasses}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  collapsed && !mobileOpen && "mx-auto"
                )}
              />
              {(!collapsed || mobileOpen) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + Collapse toggle */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3">
        <Link
          to="/settings"
          onClick={() => handleItemClick("settings")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            currentActiveItem === "settings"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className={cn("h-5 w-5 flex-shrink-0", collapsed && !mobileOpen && "mx-auto")} />
          {(!collapsed || mobileOpen) && <span>Settings</span>}
        </Link>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="mt-2 hidden lg:flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-muted transition-colors hover:text-sidebar-foreground"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}