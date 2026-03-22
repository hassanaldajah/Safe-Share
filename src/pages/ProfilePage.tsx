import { useState } from "react";
import { Camera, Mail, Phone, MapPin, Calendar, Shield, Key, Edit3, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Motasem from "@/assets/Motasem.jpg";

interface EditableField {
  label: string;
  value: string;
  icon: React.ReactNode;
  type?: string;
}

export default function ProfilePage() {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({
    fullName: "Motasem Atawna",
    email: "motasem.atawna@example.com",
     
   
    joinDate: "January 2024",
    publicKey: "pk_live_aB3xK9mN2pQ7rS1tU5vW8y",
    privateKey: "sk_live_••••••••••••••••••••••",
  });
  const [tempValue, setTempValue] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const startEdit = (field: string) => {
    setEditingField(field);
    setTempValue(fields[field]);
  };

  const saveEdit = () => {
    if (editingField) {
      setFields((prev) => ({ ...prev, [editingField]: tempValue }));
      setEditingField(null);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const infoRows: EditableField[] = [
    { label: "Full Name", value: fields.fullName, icon: <Edit3 className="h-4 w-4" /> },
    { label: "Email", value: fields.email, icon: <Mail className="h-4 w-4" />, type: "email" },
   ];

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

          {/* Avatar + Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4 -mt-10">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-card">
                    <AvatarImage src={Motasem} alt="Motasem" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">MA</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110">
                    <Camera className="h-3 w-3" />
                  </button>
                </div>
                <div className="mb-1">
                  <h1 className="text-xl font-bold text-foreground">{fields.fullName}</h1>
                   
                </div>
              </div>
               
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Personal Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click any field to edit</p>
          </div>
          <div className="divide-y divide-border">
            {infoRows.map((row) => {
              const fieldKey = row.label.toLowerCase().replace(" ", "");
              const key = Object.keys(fields).find((k) => fields[k] === row.value && k !== "publicKey" && k !== "privateKey") ?? fieldKey;
              const isEditing = editingField === key;

              return (
                <div key={key} className="flex items-center gap-4 px-6 py-3.5 group">
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
                        <button onClick={saveEdit} className="text-green-500 hover:text-green-600"><Check className="h-4 w-4" /></button>
                        <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-foreground truncate">{row.value}</p>
                    )}
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(key)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Security / Keys */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Security & Keys</h2>
            </div>
          </div>
          <div className="divide-y divide-border">
            {/* ID */}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground flex-shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">User ID</p>
                <p className="text-sm font-mono font-medium text-foreground">2220784</p>
              </div>
            </div>

            {/* Public Key */}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Public Key</p>
                <p className="text-sm font-mono text-foreground truncate">{fields.publicKey}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(fields.publicKey)}
                className="text-xs text-primary hover:underline flex-shrink-0"
              >
                Copy
              </button>
            </div>

            {/* Private Key */}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 flex-shrink-0">
                <Key className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Private Key</p>
                <p className="text-sm font-mono text-foreground truncate">
                  {showPrivateKey ? "sk_live_xY9mK3pQ7rS2tU8vW1yZ4b" : "sk_live_••••••••••••••••••••••"}
                </p>
              </div>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="text-xs text-primary hover:underline flex-shrink-0"
              >
                {showPrivateKey ? "Hide" : "Reveal"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}