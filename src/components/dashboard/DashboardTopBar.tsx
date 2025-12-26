import { Search, Bell, ChevronDown, Home, X, FileText, Users, MessageSquare, Clock, LogOut, User, Settings, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Motasem from "@/assets/Motasem.jpg";

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

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "file",
    title: "New file uploaded",
    description: "Project_Report.pdf was uploaded to Marketing folder",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "share",
    title: "Folder shared with you",
    description: "Sarah Johnson shared 'Q4 Analytics' with you",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    type: "message",
    title: "New comment",
    description: "Alex commented on your document 'Budget_2024.xlsx'",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "4",
    type: "system",
    title: "Storage limit warning",
    description: "You've used 85% of your storage space",
    time: "1 day ago",
    read: true,
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "file":
      return <FileText className="h-4 w-4" />;
    case "share":
      return <Users className="h-4 w-4" />;
    case "message":
      return <MessageSquare className="h-4 w-4" />;
    case "system":
      return <Clock className="h-4 w-4" />;
  }
};

export function DashboardTopBar({ sidebarCollapsed }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close notification popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showNotifications || showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showProfileMenu]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 transition-all duration-300"
      style={{ left: sidebarCollapsed ? "64px" : "256px" }}
    >
      {/* Home Button */}
      <Link
        to="/"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Go to Home"
      >
        <Home className="h-5 w-5" />
      </Link>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search files and folders..."
          className="h-10 w-full border-muted bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center border-2 border-card bg-destructive p-0 text-[10px] font-semibold text-destructive-foreground">
                {unreadCount}
              </Badge>
            )}
          </button>

          {/* Notification Popup */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-96 rounded-lg border border-border bg-card shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Notifications ({unreadCount} unread)
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative border-b border-border px-4 py-3 transition-colors hover:bg-muted/50 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                            notification.type === "file"
                              ? "bg-blue-500/10 text-blue-500"
                              : notification.type === "share"
                              ? "bg-green-500/10 text-green-500"
                              : notification.type === "message"
                              ? "bg-purple-500/10 text-purple-500"
                              : "bg-orange-500/10 text-orange-500"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-foreground">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-border px-4 py-2 text-center">
                  <button className="text-xs text-primary hover:underline">
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={Motasem} alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start lg:flex">
              <span className="text-sm font-medium text-foreground">Motasem Atawna</span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 text-muted-foreground transition-transform lg:block ${
                showProfileMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Menu Popup */}
          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-64 rounded-lg border border-border bg-card shadow-lg">
              {/* User Info */}
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={Motasem} alt="User" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-foreground">Motasem Atawna</p>
                    <p className="text-xs text-muted-foreground">motasem@safeshare.com</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/help"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Help & Support</span>
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-border py-2">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  onClick={() => {
                    // Add logout logic here
                    console.log("Logging out...");
                    setShowProfileMenu(false);
                  }}
                >
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