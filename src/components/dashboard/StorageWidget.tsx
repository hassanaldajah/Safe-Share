import { HardDrive, Archive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export function StorageWidget() {
  const [compressEnabled, setCompressEnabled] = useState(false);
  const usedStorage = 68.4;
  const totalStorage = 100;
  const usedGB = 68.4;
  const totalGB = 100;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <HardDrive className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Storage</h3>
          <p className="text-sm text-muted-foreground">Manage your space</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">{usedGB} GB</span>
          <span className="text-sm text-muted-foreground">of {totalGB} GB used</span>
        </div>
        <Progress value={usedStorage} className="h-3" />
      </div>

      {/* Storage breakdown */}
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">24.2 GB</p>
          <p className="text-xs text-muted-foreground">Documents</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="text-lg font-semibold text-foreground">31.8 GB</p>
          <p className="text-xs text-muted-foreground">Media</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">12.4 GB</p>
          <p className="text-xs text-muted-foreground">Other</p>
        </div>
      </div>

      {/* Compress Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Compress files</p>
            <p className="text-xs text-muted-foreground">Save up to 15% space</p>
          </div>
        </div>
        <Switch
          checked={compressEnabled}
          onCheckedChange={setCompressEnabled}
        />
      </div>
    </div>
  );
}
