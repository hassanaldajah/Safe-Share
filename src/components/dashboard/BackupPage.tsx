import { useState } from "react";
import { Cloud, CloudUpload, KeyRound, ShieldCheck, AlertTriangle, Loader2, CloudDownload } from "lucide-react";
import { cn } from "@/lib/utils";

// --- NATIVE WEB CRYPTO MATH FOR PASSWORD-BASED ENCRYPTION ---
const deriveKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    // Added "as any" here to bypass the strict SharedArrayBuffer TS check!
    { name: "PBKDF2", salt: salt as any, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
};
export function BackupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [mode, setMode] = useState<"backup" | "restore">("backup");

  const handleBackup = async () => {
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const privateKey = localStorage.getItem("privateKey");
      if (!privateKey) throw new Error("No Private Key found on this device to backup!");

      // 1. Generate Salt & Derive AES Key from Password
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const aesKey = await deriveKey(password, salt);

      // 2. Encrypt the Private Key
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const enc = new TextEncoder();
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, aesKey, enc.encode(privateKey)
      );

      // 3. Package it all into a single Base64 string to send to Spring Boot
      const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
      const payload = JSON.stringify({
        salt: Array.from(salt),
        iv: Array.from(iv),
        data: encryptedArray
      });
      const finalBlob = btoa(payload);

      // 4. Send to Server
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/v1/backup/save", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedPrivateKey: finalBlob })
      });

      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: "success", text: "Success! Your key is securely backed up to the cloud." });
      setPassword(""); setConfirmPassword("");

    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Backup failed." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Fetch from Server
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/v1/backup/restore", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(await res.text());
      const { encryptedPrivateKey } = await res.json();

      // 2. Unpack the Base64 string
      const { salt, iv, data } = JSON.parse(atob(encryptedPrivateKey));
      
      // 3. Derive Key & Decrypt
      const aesKey = await deriveKey(password, new Uint8Array(salt));
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) }, aesKey, new Uint8Array(data)
      );

      // 4. Restore to LocalStorage
      const dec = new TextDecoder();
      const recoveredPrivateKey = dec.decode(decryptedBuffer);
      localStorage.setItem("privateKey", recoveredPrivateKey);

      setMessage({ type: "success", text: "Key Restored! You can now access all your files on this device." });
      setPassword("");

    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to restore. Are you sure that is the correct Master Password?" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Cloud className="h-8 w-8 text-indigo-600" />
            Cloud Key Escrow
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Securely back up your cryptographic keys so you never lose access to your files.</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Zero-Knowledge Guarantee</h3>
            <p className="text-amber-700/80 text-sm mt-1">Your key is encrypted in your browser using the Master Password below. Our servers never see your password or your actual keys. <strong>If you forget this password, your backup cannot be recovered.</strong></p>
          </div>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="flex border-b border-border">
            <button onClick={() => setMode("backup")} className={cn("flex-1 py-4 font-medium text-center transition-colors", mode === "backup" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-muted-foreground hover:bg-background")}>Backup Key to Cloud</button>
            <button onClick={() => setMode("restore")} className={cn("flex-1 py-4 font-medium text-center transition-colors", mode === "restore" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50" : "text-muted-foreground hover:bg-background")}>Restore Key from Cloud</button>
          </div>

          <div className="p-8 space-y-6">
            {message.text && (
              <div className={cn("p-4 rounded-xl text-sm font-medium flex items-center gap-2", message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200")}>
                {message.type === "success" && <ShieldCheck className="h-5 w-5" />}
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Master Recovery Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a strong password" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            {mode === "backup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            )}

            <button 
              onClick={mode === "backup" ? handleBackup : handleRestore} 
              disabled={isLoading || !password || (mode === "backup" && !confirmPassword)}
              className={cn("w-full py-3.5 rounded-xl font-medium text-white shadow-sm flex items-center justify-center gap-2 transition-colors", isLoading || !password ? "bg-gray-300 cursor-not-allowed" : mode === "backup" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700")}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "backup" ? <CloudUpload className="h-5 w-5" /> : <CloudDownload className="h-5 w-5" />}
              {isLoading ? "Processing..." : mode === "backup" ? "Encrypt & Backup to Cloud" : "Download & Unlock Key"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}