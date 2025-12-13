import { FileText, Folder, Image, Eye, Download, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  action: "opened" | "created" | "shared" | "downloaded" | "deleted";
  target: {
    type: "file" | "folder" | "image";
    name: string;
  };
  timestamp: string;
}

const recentActivities: Activity[] = [
  {
    id: "1",
    user: { name: "Sarah Chen", initials: "SC", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    action: "opened",
    target: { type: "file", name: "Q4 Report.pdf" },
    timestamp: "2 min ago",
  },
  {
    id: "2",
    user: { name: "Hassan Dajah", initials: "MJ" },
    action: "created",
    target: { type: "folder", name: "Marketing Assets" },
    timestamp: "15 min ago",
  },
  {
    id: "3",
    user: { name: "Emily Davis", initials: "ED", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
    action: "shared",
    target: { type: "image", name: "Brand Logo.png" },
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    user: { name: "Alex Turner", initials: "AT" },
    action: "downloaded",
    target: { type: "file", name: "Invoice_2024.xlsx" },
    timestamp: "2 hours ago",
  },
  {
    id: "5",
    user: { name: "Lisa Wang", initials: "LW", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" },
    action: "opened",
    target: { type: "folder", name: "Design System" },
    timestamp: "3 hours ago",
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "folder":
      return <Folder className="h-4 w-4 text-warning" />;
    case "image":
      return <Image className="h-4 w-4 text-info" />;
    default:
      return <FileText className="h-4 w-4 text-primary" />;
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case "opened":
      return <Eye className="h-3 w-3" />;
    case "downloaded":
      return <Download className="h-3 w-3" />;
    case "shared":
      return <Share2 className="h-3 w-3" />;
    default:
      return null;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "created":
      return "text-activity-create";
    case "opened":
      return "text-activity-view";
    case "shared":
      return "text-activity-edit";
    case "downloaded":
      return "text-info";
    case "deleted":
      return "text-activity-delete";
    default:
      return "text-muted-foreground";
  }
};

export function RecentActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Activity</h3>
        <button className="text-sm font-medium text-primary hover:underline">View all</button>
      </div>

      <div className="space-y-4">
        {recentActivities.map((activity, index) => (
          <div
            key={activity.id}
            className="animate-fade-in flex items-start gap-3"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                {activity.user.initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium text-foreground">{activity.user.name}</span>
                <span className={`mx-1.5 ${getActionColor(activity.action)}`}>
                  {activity.action}
                </span>
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {getFileIcon(activity.target.type)}
                <span className="truncate text-sm text-muted-foreground">{activity.target.name}</span>
              </div>
            </div>

            <span className="flex-shrink-0 text-xs text-muted-foreground">{activity.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
