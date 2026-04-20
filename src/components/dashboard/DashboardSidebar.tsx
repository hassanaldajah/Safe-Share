import { 
  FolderOpen, 
  Users, 
  UsersRound, 
  MessageSquare, 
  Trash2, 
  Settings,
  ChevronLeft,
  LayoutDashboard,
  Home,
  Cloud,
  Bot
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (item: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "my-folders", label: "My Folders", icon: FolderOpen, path: "/MyFolders" },
  { id: "groups", label: "Groups", icon: UsersRound, path: "/groups" }, // ✅ FIX
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/chat" },
  { id: "backup", label: "Backup", icon: Cloud, path: "/backup" },
  { id: "ai-assistant", label: "AI Assistant", icon: Bot, path: "/ai-assistant" },
  { id: "trash", label: "Trash", icon: Trash2, path: "/trash" },
];

export function DashboardSidebar({ collapsed, onToggle, activeItem, onItemClick }: SidebarProps) {
  const location = useLocation();

  // Determine which item should be active based on the current route
  const getActiveItem = () => {
    const currentPath = location.pathname;
    
    // Find the nav item that matches the current path
    const matchedItem = navItems.find(item => item.path === currentPath);
    if (matchedItem) {
      return matchedItem.id;
    }
    
    // Fallback to the activeItem prop
    return activeItem;
  };

  const currentActiveItem = getActiveItem();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link 
          to="/" 
          className={cn(
            "flex items-center gap-2 transition-opacity hover:opacity-80",
            collapsed && "mx-auto"
          )}
          title="Go to Home"
        >
          {!collapsed && (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <FolderOpen className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-accent-foreground">SafeShare</span>
            </>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <FolderOpen className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {/* Home Button */}
        {navItems.map((item) => {
          // Check if this item is active based on route
          const isActive = currentActiveItem === item.id;
          
          const linkClasses = cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          );

          // IF ITEM HAS A PATH, RENDER A <LINK>
          if (item.path) {
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => onItemClick(item.id)}
                className={linkClasses}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          // IF NO PATH, RENDER A BUTTON
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={linkClasses}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-3">
       
        <Link
          to="/settings"
          onClick={() => onItemClick("settings")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            activeItem === "settings" || location.pathname === "/settings"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-muted transition-colors hover:text-sidebar-foreground"
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