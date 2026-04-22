import { useState, useRef, useEffect } from "react";
import { Camera, Mail, Shield, Key, Edit3, Check, X, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Motasem from "@/assets/Motasem.jpg"; // Default fallback
import { authFetch } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // --- GRABBING REAL USER DATA ---

interface EditableField {
  label: string;
  value: string;
  icon: React.ReactNode;
  type?: string;
  isReadOnly?: boolean;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth(); // Get the real logged-in user!
  
  const [editingField, setEditingField] = useState<string | null>(null);
  
 const [fields, setFields] = useState<Record<string, string>>({
    fullName: user?.name || "Loading...",
    email: user?.email || "Loading...",
    searchTag: user?.searchTag || "Loading...", // <-- Changed this line
    publicKey: localStorage.getItem("publicKey") || "Key not generated yet",
    privateKey: localStorage.getItem("privateKey") || "Key not generated yet",
  });
  
  const [tempValue, setTempValue] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Image Upload State
  const [profileImg, setProfileImg] = useState<string>(localStorage.getItem("profileImage") || Motasem);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFields(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        searchTag: user.searchTag || prev.searchTag // <-- Added this line
      }));
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large! Please choose an image under 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // 1. Instant UI Update
        setProfileImg(base64String);
        localStorage.setItem("profileImage", base64String); 
        window.dispatchEvent(new Event("profileImageUpdated")); 

        // 2. Save it permanently to Spring Boot
        try {
          await authFetch("http://localhost:8080/api/v1/users/profile/image", {
            method: "PUT",
            body: JSON.stringify({ profileImage: base64String })
          });
          console.log("Image saved to database successfully!");
        } catch (error) {
          console.error("Failed to save image to server", error);
          alert("Failed to save image permanently. It may reset on your next login.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (field: string) => {
    setEditingField(field);
    setTempValue(fields[field]);
  };

  const saveEdit = async () => {
    if (editingField) {
      const fieldToUpdate = editingField;
      const newValue = tempValue;
      
      try {
        if (fieldToUpdate === "fullname" || fieldToUpdate === "fullName") {
          const res = await authFetch("http://localhost:8080/api/v1/users/profile", {
            method: "PUT",
            body: JSON.stringify({ fullName: newValue })
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Failed to update profile on server.");
          }
          
          // Update global auth state so the TopBar reflects immediately
          updateUser({ name: newValue });
          // Update local state too
          setFields((prev) => ({ ...prev, fullName: newValue }));
          toast.success("Profile updated successfully!");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update profile");
      } finally {
        setEditingField(null);
      }
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const infoRows: EditableField[] = [
    { label: "Full Name", value: fields.fullName, icon: <Edit3 className="h-4 w-4" /> },
    { label: "Email", value: fields.email, icon: <Mail className="h-4 w-4" />, type: "email", isReadOnly: true },
  ];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

          <div className="px-6 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4 -mt-10">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-20 w-20 ring-4 ring-card transition-transform group-hover:scale-105">
                    <AvatarImage src={profileImg} alt="Profile" className="object-cover" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {fields.fullName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden bg-background text-foreground placeholder:text-muted-foreground" />
                </div>
                <div className="mb-1">
                  <h1 className="text-xl font-bold text-foreground">{fields.fullName}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Personal Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click any field to edit</p>
          </div>
          <div className="divide-y divide-border">
            {infoRows.map((row) => {
              const fieldKey = row.label.toLowerCase().replace(" ", "");
              const key = Object.keys(fields).find((k) => fields[k] === row.value && k !== "publicKey" && k !== "privateKey" && k !== "userId") ?? fieldKey;
              const isEditing = editingField === key;

              return (
                <div key={key} className="flex items-center gap-4 px-6 py-3.5 group transition-colors hover:bg-muted/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground flex-shrink-0">
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{row.label}</p>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          type={row.type ?? "text"}
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="h-7 text-sm py-0"
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        />
                        <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600"><Check className="h-4 w-4" /></button>
                        <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground truncate">{row.value}</p>
                    )}
                  </div>
                  {!isEditing && !row.isReadOnly && (
                    <button
                      onClick={() => startEdit(key)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {row.isReadOnly && (
                    <div className="text-muted-foreground cursor-help" title="Email is tied to your cryptographic identity and cannot be changed.">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Security / Keys */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Security & Keys</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {/* REAL SEARCH TAG */}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground flex-shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Search Tag</p>
                <p className="text-sm font-mono font-bold text-foreground">{fields.searchTag}</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(fields.searchTag)} className="text-xs text-primary hover:underline flex-shrink-0">
                Copy
              </button>
            </div>

            {/* REAL PUBLIC KEY */}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Public Key</p>
                <p className="text-sm font-mono text-foreground truncate">{fields.publicKey}</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(fields.publicKey)} className="text-xs text-primary hover:underline flex-shrink-0">
                Copy
              </button>
            </div>

            {/* REAL PRIVATE KEY */}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 flex-shrink-0">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Private Key</p>
                <p className="text-sm font-mono text-foreground truncate">
                  {showPrivateKey ? fields.privateKey : "sk_live_••••••••••••••••••••••"}
                </p>
              </div>
              <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-xs text-primary hover:underline flex-shrink-0">
                {showPrivateKey ? "Hide" : "Reveal"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}