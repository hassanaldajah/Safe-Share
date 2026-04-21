import { useState, useEffect } from "react";
import { FileText, Folder, Share2, Download, Eye, Activity } from "lucide-react";
import { authFetch } from "@/lib/api";

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await authFetch("http://localhost:8080/api/v1/activity/recent");
        if (res.ok) {
          setActivities(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch recent activity", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, []);

  // Helper to pick the right icon based on the target name
  const getIcon = (target: string) => {
    if (target.toLowerCase().includes("group")) return <Folder size={14} className="text-amber-500" />;
    return <FileText size={14} className="text-emerald-500" />;
  };

  // Helper to color-code the action words
  const getActionColor = (action: string) => {
    switch (action) {
      case "created": return "text-emerald-500";
      case "shared": return "text-blue-500";
      case "downloaded": return "text-sky-500";
      case "opened": return "text-teal-500";
      case "joined": return "text-indigo-500";
      default: return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-400 animate-pulse">Loading live activity...</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 flex flex-col items-center">
        <Activity size={32} className="mb-2 text-gray-300" />
        <p className="text-sm">No recent activity found.</p>
        <p className="text-xs mt-1">Create groups and files to see activity here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start justify-between group">
          <div className="flex items-start gap-3">
            {/* Generate a quick avatar based on the user's initials */}
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
              {activity.user.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            
            <div>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{activity.user}</span>{" "}
                <span className={getActionColor(activity.action)}>{activity.action}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                {getIcon(activity.target)}
                <span>{activity.target}</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{activity.timeAgo}</span>
        </div>
      ))}
    </div>
  );
}