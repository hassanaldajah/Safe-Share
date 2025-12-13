import { FolderPlus, Upload, UsersRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    id: "new-folder",
    label: "New Folder",
    icon: FolderPlus,
    description: "Create a new folder",
    variant: "primary" as const,
  },
  {
    id: "upload-file",
    label: "Upload File",
    icon: Upload,
    description: "Upload from your device",
    variant: "secondary" as const,
  },
  {
    id: "new-group",
    label: "New Group",
    icon: UsersRound,
    description: "Create a sharing group",
    variant: "secondary" as const,
  },
];

export function QuickCreateButtons() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Quick Actions</h3>

      <div className="grid gap-3">
        {quickActions.map((action, index) => (
          <button
            key={action.id}
            className={`animate-scale-in group flex items-center gap-4 rounded-lg border p-4 text-left transition-all duration-200 ${
              action.variant === "primary"
                ? "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10"
                : "border-border bg-background hover:border-primary/30 hover:bg-muted/50"
            }`}
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                action.variant === "primary"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{action.label}</p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      <Button variant="outline" className="mt-4 w-full gap-2">
        <Plus className="h-4 w-4" />
        More Actions
      </Button>
    </div>
  );
}
