import { useState } from "react";
import { Moon, Sun, Monitor, Bell, Lock, Globe, Palette, Shield, Eye, EyeOff, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Theme = "light" | "dark" | "system";
type Language = "en" | "ar" | "fr";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const [language, setLanguage] = useState<Language>("en");
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifs: true,
    pushNotifs: true,
    fileUploads: true,
    sharedWithMe: true,
    comments: false,
    storageWarnings: true,
    weeklyDigest: false,
  });

  const [privacy, setPrivacy] = useState({
    twoFactor: false,
    loginAlerts: true,
    activityLog: true,
    publicProfile: false,
  });

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [passError, setPassError] = useState("");

  const handleSave = () => {
    if (passwords.newPass && passwords.newPass !== passwords.confirm) {
      setPassError("New passwords do not match.");
      return;
    }
    setPassError("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 mt-0.5 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );

  const SectionCard = ({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const ToggleRow = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
        </div>

        {/* Appearance */}
        <SectionCard icon={<Palette className="h-4 w-4" />} title="Appearance" description="Customize how the app looks">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
                  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
                  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                      theme === t.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted"
                    }`}
                  >
                    {t.icon}
                    <span className="text-xs font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Language */}
        <SectionCard icon={<Globe className="h-4 w-4" />} title="Language & Region" description="Set your preferred language">
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "en", label: "English" },
              { value: "ar", label: "العربية" },
              { value: "fr", label: "Français" },
            ] as const).map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={`rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                  language === l.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={<Bell className="h-4 w-4" />} title="Notifications" description="Choose what you want to be notified about">
          <div className="divide-y divide-border">
            <ToggleRow label="Email Notifications" description="Receive notifications via email" checked={notifications.emailNotifs} onChange={() => setNotifications(p => ({ ...p, emailNotifs: !p.emailNotifs }))} />
            <ToggleRow label="Push Notifications" description="Browser push notifications" checked={notifications.pushNotifs} onChange={() => setNotifications(p => ({ ...p, pushNotifs: !p.pushNotifs }))} />
            <ToggleRow label="File Uploads" checked={notifications.fileUploads} onChange={() => setNotifications(p => ({ ...p, fileUploads: !p.fileUploads }))} />
            <ToggleRow label="Shared with me" checked={notifications.sharedWithMe} onChange={() => setNotifications(p => ({ ...p, sharedWithMe: !p.sharedWithMe }))} />
            <ToggleRow label="Comments" checked={notifications.comments} onChange={() => setNotifications(p => ({ ...p, comments: !p.comments }))} />
            <ToggleRow label="Storage Warnings" checked={notifications.storageWarnings} onChange={() => setNotifications(p => ({ ...p, storageWarnings: !p.storageWarnings }))} />
            <ToggleRow label="Weekly Digest" description="Summary of activity every week" checked={notifications.weeklyDigest} onChange={() => setNotifications(p => ({ ...p, weeklyDigest: !p.weeklyDigest }))} />
          </div>
        </SectionCard>

        {/* Privacy & Security */}
        <SectionCard icon={<Shield className="h-4 w-4" />} title="Privacy & Security" description="Control your security settings">
          <div className="divide-y divide-border">
            <ToggleRow
              label="Two-Factor Authentication"
              description={
                <span className="flex items-center gap-1">
                  Extra login security
                  {privacy.twoFactor && <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] py-0 px-1.5">Enabled</Badge>}
                </span> as unknown as string
              }
              checked={privacy.twoFactor}
              onChange={() => setPrivacy(p => ({ ...p, twoFactor: !p.twoFactor }))}
            />
            <ToggleRow label="Login Alerts" description="Email me on new sign-ins" checked={privacy.loginAlerts} onChange={() => setPrivacy(p => ({ ...p, loginAlerts: !p.loginAlerts }))} />
            <ToggleRow label="Activity Log" description="Keep a record of your actions" checked={privacy.activityLog} onChange={() => setPrivacy(p => ({ ...p, activityLog: !p.activityLog }))} />
            <ToggleRow label="Public Profile" description="Allow others to see your profile" checked={privacy.publicProfile} onChange={() => setPrivacy(p => ({ ...p, publicProfile: !p.publicProfile }))} />
          </div>
        </SectionCard>

        {/* Change Password */}
        <SectionCard icon={<Lock className="h-4 w-4" />} title="Change Password" description="Update your account password">
          <div className="space-y-3">
            {(["current", "newPass", "confirm"] as const).map((key) => (
              <div key={key} className="relative">
                <label className="text-xs text-muted-foreground mb-1 block">
                  {key === "current" ? "Current Password" : key === "newPass" ? "New Password" : "Confirm New Password"}
                </label>
                <div className="relative">
                  <Input
                    type={showPass[key] ? "text" : "password"}
                    value={passwords[key]}
                    onChange={(e) => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            {passError && <p className="text-xs text-destructive">{passError}</p>}
          </div>
        </SectionCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
              saved
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}