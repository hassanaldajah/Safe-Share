import { useState, useCallback } from "react";
import {
  Share2, X, AtSign, ShieldCheck, Settings2, Eye, Download,
  CheckSquare, Square, Loader2, UserCheck, Lock, Key, Send,
  AlertCircle, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileItem } from "@/components/dashboard/FoldersContext";
import { decryptKeyWithRSA, encryptKeyWithRSA } from "@/lib/encryption";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}

type ShareStep = "idle" | "resolving" | "encrypting" | "sending" | "done" | "error";

const STEP_LABELS: Record<ShareStep, string> = {
  idle: "",
  resolving:  "Looking up recipient...",
  encrypting: "Re-encrypting file key in your browser...",
  sending:    "Sending to server...",
  done:       "Shared successfully!",
  error:      "Something went wrong.",
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export function ShareFileModal({ isOpen, onClose, file }: ShareFileModalProps) {
  const [searchTag, setSearchTag]           = useState("");
  const [step, setStep]                     = useState<ShareStep>("idle");
  const [errorMsg, setErrorMsg]             = useState("");
  const [resolvedUser, setResolvedUser]     = useState<{ name: string; tag: string } | null>(null);

  // Optional access controls
  const [showPermissions, setShowPermissions] = useState(false);
  const [maxViews, setMaxViews]               = useState<string>("");
  const [maxDownloads, setMaxDownloads]       = useState<string>("");
  const [canReshare, setCanReshare]           = useState(false);

  const reset = useCallback(() => {
    setSearchTag("");
    setStep("idle");
    setErrorMsg("");
    setResolvedUser(null);
    setMaxViews("");
    setMaxDownloads("");
    setCanReshare(false);
    setShowPermissions(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  // ── MAIN SHARE HANDLER ────────────────────────
  const handleShare = async () => {
    if (!file || !searchTag.trim()) return;

    const formattedTag = searchTag.trim().startsWith("@")
      ? searchTag.trim()
      : `@${searchTag.trim()}`;

    const token      = localStorage.getItem("token");
    const privateKey = localStorage.getItem("privateKey");

    if (!token || !privateKey) {
      setStep("error");
      setErrorMsg("Security Error: Missing cryptographic keys. Please sign out and sign back in.");
      return;
    }
    if (!file.encryptedFileKey || !file.iv) {
      setStep("error");
      setErrorMsg("Security Error: File is missing cryptographic metadata. Please re-upload this file.");
      return;
    }

    try {
      // ── STEP 1: Resolve recipient ─────────────
      setStep("resolving");
      const searchRes = await fetch(
        `http://localhost:8080/api/v1/files/search-user?searchTag=${encodeURIComponent(formattedTag)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!searchRes.ok) throw new Error("User not found. Check the @username and try again.");
      const receiver = await searchRes.json(); // { searchTag, fullName, publicKey }
      setResolvedUser({ name: receiver.fullName, tag: receiver.searchTag });

      // ── STEP 2: Zero-Knowledge re-encryption ──
      //
      // HOW IT WORKS (Zero-Knowledge):
      //   a. Decrypt YOUR copy of the file's AES key using YOUR private RSA key.
      //   b. Re-encrypt that AES key using the RECIPIENT's public RSA key.
      //   c. Send only the recipient's locked copy to the server.
      //   The server never sees the plaintext AES key at any point.
      //
      setStep("encrypting");
      const aesKey              = await decryptKeyWithRSA(file.encryptedFileKey, privateKey);
      const receiverEncryptedKey = await encryptKeyWithRSA(aesKey, receiver.publicKey);

      // ── STEP 3: Persist share record ─────────
      setStep("sending");
      const shareRes = await fetch(
        `http://localhost:8080/api/v1/files/${file.id}/share`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetSearchTag: receiver.searchTag,
            encryptedKey:    receiverEncryptedKey,
            maxViews:        maxViews      === "" ? null : parseInt(maxViews),
            maxDownloads:    maxDownloads  === "" ? null : parseInt(maxDownloads),
            canReshare,
          }),
        }
      );

      if (!shareRes.ok) {
        const errText = await shareRes.text();
        throw new Error(errText || "Server rejected the share request.");
      }

      // ── STEP 4: Done ─────────────────────────
      setStep("done");
      toast.success(`File shared with ${receiver.fullName}!`);
      setTimeout(() => { handleClose(); }, 2500);

    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  if (!isOpen || !file) return null;

  const isWorking = ["resolving", "encrypting", "sending"].includes(step);
  const isDone    = step === "done";
  const isError   = step === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border">

          {/* ── Header ───────────────────────────── */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Share File Securely</h2>
                  <p className="text-xs text-white/70 truncate max-w-[280px]">{file.name}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isWorking}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-40"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* ── Body ─────────────────────────────── */}
          <div className="p-6 space-y-5">

            {/* ZK Badge */}
            <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Zero-Knowledge Share</span> — The file key is
                re-encrypted in <em>your browser</em> with the recipient's public key.
                The server only ever sees encrypted blobs it cannot read.
              </p>
            </div>

            {/* Recipient Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Recipient's @username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTag}
                  onChange={(e) => { setSearchTag(e.target.value); setStep("idle"); setResolvedUser(null); }}
                  placeholder="username (without @)"
                  disabled={isWorking || isDone}
                  className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition"
                />
              </div>
            </div>

            {/* Progress Steps */}
            {step !== "idle" && (
              <div className="space-y-2">
                {(["resolving", "encrypting", "sending"] as ShareStep[]).map((s, i) => {
                  const stepOrder: ShareStep[] = ["resolving", "encrypting", "sending", "done"];
                  const currentIdx = stepOrder.indexOf(step);
                  const thisIdx    = stepOrder.indexOf(s);
                  const isActive   = step === s;
                  const isPast     = !isError && currentIdx > thisIdx;

                  return (
                    <div key={s} className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                      isActive  && "bg-primary/10 text-foreground",
                      isPast    && "text-muted-foreground",
                      !isActive && !isPast && "text-muted-foreground/40"
                    )}>
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {isPast   ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                         isActive ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> :
                         [<UserCheck />, <Key />, <Send />][i] &&
                           <span className="text-muted-foreground/40">{[<UserCheck className="h-4 w-4" />, <Key className="h-4 w-4" />, <Send className="h-4 w-4" />][i]}</span>
                        }
                      </div>
                      <span className={cn("font-medium", isActive && "text-foreground")}>
                        {STEP_LABELS[s]}
                      </span>
                    </div>
                  );
                })}

                {/* Resolved user */}
                {resolvedUser && !isError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                    <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-foreground font-medium">{resolvedUser.name}</span>
                    <span className="text-muted-foreground">{resolvedUser.tag}</span>
                  </div>
                )}

                {/* Success */}
                {isDone && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-green-600 font-medium">{STEP_LABELS.done}</span>
                  </div>
                )}

                {/* Error */}
                {isError && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-red-600">{errorMsg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Optional Access Controls */}
            {!isDone && (
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                  {showPermissions ? "Hide Access Controls" : "Set Access Controls (Optional)"}
                </button>

                {showPermissions && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-xl space-y-4 border border-border">
                    {/* View limit */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg border border-border text-muted-foreground">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">View Limit</p>
                          <p className="text-xs text-muted-foreground">Max times file can be opened</p>
                        </div>
                      </div>
                      <input
                        type="number" min="1" placeholder="∞"
                        value={maxViews} onChange={(e) => setMaxViews(e.target.value)}
                        className="w-20 px-3 py-1.5 text-sm bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Download limit */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg border border-border text-muted-foreground">
                          <Download className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Download Limit</p>
                          <p className="text-xs text-muted-foreground">Max times file can be saved</p>
                        </div>
                      </div>
                      <input
                        type="number" min="1" placeholder="∞"
                        value={maxDownloads} onChange={(e) => setMaxDownloads(e.target.value)}
                        className="w-20 px-3 py-1.5 text-sm bg-background text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Re-share toggle */}
                    <div
                      className="flex items-center justify-between gap-4 cursor-pointer pt-1"
                      onClick={() => setCanReshare(!canReshare)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg border border-border text-muted-foreground">
                          <Share2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Allow Re-sharing</p>
                          <p className="text-xs text-muted-foreground">Can they share this file with others?</p>
                        </div>
                      </div>
                      <div className="text-primary">
                        {canReshare
                          ? <CheckSquare className="h-5 w-5" />
                          : <Square className="h-5 w-5 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Action Buttons ──────────────────── */}
            {!isDone && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleClose}
                  disabled={isWorking}
                  className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground font-medium rounded-xl hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={!searchTag.trim() || isWorking}
                  className={cn(
                    "flex-1 px-4 py-2.5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2",
                    searchTag.trim() && !isWorking
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isWorking
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Working...</>
                    : <><Lock className="h-4 w-4" /> Share Securely</>
                  }
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
