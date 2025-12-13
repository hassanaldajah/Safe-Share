import { 
  FileText, 
  Folder, 
  Upload, 
  Trash2, 
  Share2, 
  Eye, 
  Download, 
  Edit, 
  UserPlus,
  LogIn
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LogEntry {
  id: string;
  user: {
    name: string;
    initials: string;
    avatar?: string;
  };
  action: string;
  icon: React.ElementType;
  timestamp: string;
  color: string;
}

const activityLog: LogEntry[] = [
  {
    id: "1",
    user: { name: "Sarah Chen", initials: "SC", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    action: "Viewed Q4 Report.pdf",
    icon: Eye,
    timestamp: "09:42 AM",
    color: "text-activity-view",
  },
  {
    id: "2",
    user: { name: "Hassan", initials: "MJ" },
    action: "Created Marketing folder",
    icon: Folder,
    timestamp: "09:38 AM",
    color: "text-activity-create",
  },
  {
    id: "3",
    user: { name: "Emily Davis", initials: "ED", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
    action: "Shared Brand Logo.png",
    icon: Share2,
    timestamp: "09:15 AM",
    color: "text-activity-edit",
  },
  {
    id: "4",
    user: { name: "Alex Turner", initials: "AT" },
    action: "Downloaded Invoice.xlsx",
    icon: Download,
    timestamp: "08:52 AM",
    color: "text-info",
  },
  {
    id: "5",
    user: { name: "Lisa Wang", initials: "LW", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" },
    action: "Uploaded 3 files",
    icon: Upload,
    timestamp: "08:30 AM",
    color: "text-activity-create",
  },
  {
    id: "6",
    user: { name: "John Doe", initials: "JD" },
    action: "Edited Project Plan.docx",
    icon: Edit,
    timestamp: "08:15 AM",
    color: "text-activity-edit",
  },
  {
    id: "7",
    user: { name: "Sarah Chen", initials: "SC", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    action: "Deleted old backups",
    icon: Trash2,
    timestamp: "Yesterday",
    color: "text-activity-delete",
  },
  {
    id: "8",
    user: { name: "Hassan", initials: "MJ" },
    action: "Added team member",
    icon: UserPlus,
    timestamp: "Yesterday",
    color: "text-activity-create",
  },
  {
    id: "9",
    user: { name: "Emily Davis", initials: "ED", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
    action: "Logged in",
    icon: LogIn,
    timestamp: "Yesterday",
    color: "text-muted-foreground",
  },
  {
    id: "10",
    user: { name: "Alex Turner", initials: "AT" },
    action: "Created Weekly Report",
    icon: FileText,
    timestamp: "Yesterday",
    color: "text-activity-create",
  },
];

export function ActivityLogWidget() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Activity Log</h3>
        <span className="text-xs text-muted-foreground">Last 10 events</span>
      </div>

      <div className="scrollbar-thin -mx-2 max-h-[320px] space-y-1 overflow-y-auto px-2">
        {activityLog.map((entry, index) => (
          <div
            key={entry.id}
            className="animate-slide-in flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
              <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                {entry.user.initials}
              </AvatarFallback>
            </Avatar>

            <div className={`flex h-6 w-6 items-center justify-center rounded ${entry.color}`}>
              <entry.icon className="h-3.5 w-3.5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-foreground">
                <span className="font-medium">{entry.user.name.split(" ")[0]}</span>
                <span className="text-muted-foreground"> · {entry.action}</span>
              </p>
            </div>

            <span className="flex-shrink-0 text-xs text-muted-foreground">{entry.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
