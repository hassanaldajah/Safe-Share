import { Search, Bell, ChevronDown, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Motasem from "@/assets/Motasem.jpg"

interface TopBarProps {
  sidebarCollapsed: boolean;
}

export function DashboardTopBar({ sidebarCollapsed }: TopBarProps) {
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
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-5 w-5" />
          <Badge 
            className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center border-2 border-card bg-destructive p-0 text-[10px] font-semibold text-destructive-foreground"
          >
            3
          </Badge>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={Motasem} alt="User" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">JD</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start lg:flex">
            <span className="text-sm font-medium text-foreground">Motasem Atawna</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
        </button>
      </div>
    </header>
  );
}
