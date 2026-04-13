import { useState } from "react";
import { Share2, X, AtSign, Settings2, Eye, Download, CheckSquare, Square, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// --- IMPORT YOUR ENCRYPTION MATH ---
import { decryptKeyWithRSA, encryptKeyWithRSA } from "@/lib/encryption";

interface FileTransaction {
  id: string;
  fileId: string;
  fileName: string;
}

interface ChatShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FileTransaction | null;
}

export function ChatShareDialog({ isOpen, onClose, transaction }: ChatShareDialogProps) {
  const [searchTag, setSearchTag] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState({ type: "", text: "" });
  
  const [showPermissions, setShowPermissions] = useState(false);
  const [maxViews, setMaxViews] = useState<string>(""); 
  const [maxDownloads, setMaxDownloads] = useState<string>("");
  const [canReshare, setCanReshare] = useState(false);

  const handleShareSubmit = async () => {
    const formattedTag = searchTag.startsWith("@") ? searchTag : `@${searchTag}`;
    
    if (!transaction || !searchTag) return;
    setIsSharing(true);
    setShareMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const privateKey = localStorage.getItem("privateKey");

      if (!token || !privateKey) throw new Error("Security Error: Missing cryptographic keys.");

      // 1. Fetch Receiver's Public Key
      const searchRes = await fetch(`http://localhost:8080/api/v1/files/search-user?searchTag=${encodeURIComponent(formattedTag)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!searchRes.ok) throw new Error("User not found! Check the @SearchTag.");
      const receiver = await searchRes.json();

// 2. Fetch the File's Metadata to get the Encrypted Key!
      const metaRes = await fetch(`http://localhost:8080/api/v1/files/${transaction.fileId}/metadata`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // READ THE ACTUAL BACKEND ERROR!
      if (!metaRes.ok) {
          const errText = await metaRes.text();
          throw new Error(errText || "Could not fetch file keys to reshare.");
      }
      const metadata = await metaRes.json();
      // 3. Decrypt with your private key, Encrypt with their public key
      const aesKey = await decryptKeyWithRSA(metadata.encryptedKey, privateKey);
      const receiverEncryptedKey = await encryptKeyWithRSA(aesKey, receiver.publicKey);

      // 4. Send to backend
      const shareRes = await fetch(`http://localhost:8080/api/v1/files/${transaction.fileId}/share`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetSearchTag: receiver.searchTag || formattedTag,
          encryptedKey: receiverEncryptedKey,
          maxViews: maxViews === "" ? null : parseInt(maxViews),
          maxDownloads: maxDownloads === "" ? null : parseInt(maxDownloads),
          canReshare: canReshare
        })
      });

      if (!shareRes.ok) {
        const errText = await shareRes.text();
        throw new Error(errText);
      }

      setShareMessage({ type: "success", text: `Successfully shared with ${formattedTag}!` });
      setTimeout(() => {
        onClose();
        setShareMessage({ type: "", text: "" });
        setSearchTag("");
        setMaxViews("");
        setMaxDownloads("");
        setCanReshare(false);
        setShowPermissions(false);
      }, 2000);

    } catch (err: any) {
      setShareMessage({ type: "error", text: err.message || "Failed to share file" });
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Share2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Share Securely</h2>
                  <p className="text-sm text-white/80">{transaction.fileName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {shareMessage.text && (
              <div className={cn("p-4 rounded-lg text-sm font-medium", shareMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200")}>
                {shareMessage.text}
              </div>
            )}

            {/* Recipient Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter recipient's Search Tag
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  placeholder="username (e.g., mo_alatawnah)"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Advanced Permissions Toggle */}
            <div className="border-t border-gray-100 pt-4">
              <button 
                onClick={() => setShowPermissions(!showPermissions)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                {showPermissions ? "Hide Access Controls" : "Set Access Controls (Optional)"}
              </button>

              {/* Permissions Panel */}
              {showPermissions && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                  
                  {/* View Limits */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md shadow-sm text-gray-500"><Eye className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">View Limit</p>
                        <p className="text-xs text-gray-500">Max times file can be opened</p>
                      </div>
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Unlimited" 
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value)}
                      className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500"
                    />
                  </div>

                  {/* Download Limits */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md shadow-sm text-gray-500"><Download className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Download Limit</p>
                        <p className="text-xs text-gray-500">Max times file can be saved</p>
                      </div>
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Unlimited" 
                      value={maxDownloads}
                      onChange={(e) => setMaxDownloads(e.target.value)}
                      className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500"
                    />
                  </div>

                  {/* Reshare Permission */}
                  <div 
                    className="flex items-center justify-between gap-4 cursor-pointer pt-2"
                    onClick={() => setCanReshare(!canReshare)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md shadow-sm text-gray-500"><Share2 className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Allow Re-sharing</p>
                        <p className="text-xs text-gray-500">Can they share this with others?</p>
                      </div>
                    </div>
                    <div className="text-indigo-600">
                      {canReshare ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>

                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1.5 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
              End-to-End Encrypted: The file key is re-encrypted in your browser using the recipient's public key. The server cannot read the contents.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShareSubmit}
                disabled={!searchTag || isSharing}
                className={cn(
                  "flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
                  searchTag && !isSharing ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {isSharing ? "Encrypting..." : "Share Securely"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}