import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Lock, Globe, Palette, Eye, EyeOff, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/api"; 
import { toast } from "sonner"; 
import { useTheme } from "@/context/ThemeProvider";

type Theme = "light" | "dark" | "system";
type Language = "en" | "ar" | "fr";

// --- 1. MOVED OUTSIDE TO FIX THE JUMPING BUG ---
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

// --- 2. MAIN COMPONENT ---
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<Language>("en");
  
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [passError, setPassError] = useState("");
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme); 
  };
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch("http://localhost:8080/api/v1/users/preferences");
        if (res.ok) {
          const data = await res.json();
          // We do not call setTheme(data.theme) here because it would overwrite
          // the user's current unsaved local theme preview.
          // The theme is already managed locally by ThemeProvider.
          if (data.language) setLanguage(data.language);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSettings();
  }, []); // Removed setTheme to prevent infinite re-rendering loop when context updates
  // --- 2. THE MASTER SAVE FUNCTION ---
  const handleSave = async () => {
    setIsSaving(true);
    setPassError("");

    try {
      // A. IF CHANGING PASSWORD -> CALL THE PASSWORD ENDPOINT
      if (passwords.current || passwords.newPass) {
        if (passwords.newPass !== passwords.confirm) {
          setPassError("New passwords do not match.");
          setIsSaving(false);
          return;
        }

        const passRes = await authFetch("http://localhost:8080/api/v1/users/change-password", {  
          method: "PUT",
          body: JSON.stringify({
            currentPassword: passwords.current,
            newPassword: passwords.newPass
          })
        });

        if (!passRes.ok) throw new Error(await passRes.text());
        toast.success("Password updated securely!");
        setPasswords({ current: "", newPass: "", confirm: "" }); 
      }

      // B. SAVE UI PREFERENCES TO THE DATABASE
      const prefRes = await authFetch("http://localhost:8080/api/v1/users/preferences", {
        method: "PUT",
        body: JSON.stringify({ theme, language })
      });

      if (!prefRes.ok) throw new Error("Failed to save preferences.");

      toast.success("Settings saved to your account!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

    } catch (err: any) {
      setPassError(err.message);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-6">

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
                {([{ value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> }, { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> }, { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> }].map((t) => (
                  <button key={t.value} onClick={() => handleThemeChange(t.value as Theme)} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${theme === t.value ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted"}`}>
                    {t.icon} <span className="text-xs font-medium">{t.label}</span>
                  </button>
                )))}
              </div>
            </div>
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
                  <Input type={showPass[key] ? "text" : "password"} value={passwords[key]} onChange={(e) => setPasswords(p => ({ ...p, [key]: e.target.value }))} placeholder="••••••••" className="pr-10" />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
            {passError && <p className="text-xs text-destructive">{passError}</p>}
          </div>
        </SectionCard>

        {/* Save Button */}
        <div className="flex justify-end pb-12">
          <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${saved ? "bg-green-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"} disabled:opacity-70`}>
            {isSaving ? "Saving..." : saved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}