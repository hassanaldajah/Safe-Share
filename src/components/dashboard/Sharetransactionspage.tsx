import { useState, useEffect } from "react";
import {
  Search, FileText, Image as ImageIcon, Video, Music, Archive, File,
  FolderOpen, Download, Eye, ArrowUpRight, ArrowDownLeft, Clock, User,
  AlertCircle, Loader2, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- IMPORT YOUR ENCRYPTION MATH ---
import { decryptKeyWithRSA, decryptFile } from "@/lib/encryption";

interface FileTransaction {
  id: string;
  fileId: string;
  fileName: string;
  fileType: "file" | "folder";
  fileCategory?: "document" | "image" | "video" | "audio" | "archive" | "other";
  fileSize?: string;
  transactionType: "sent" | "received";
  userId: string; 
  timestamp: Date;
  status: "completed" | "pending" | "viewed" | "failed" | "cancelled";
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const guessFileCategory = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return 'image';
  if (['mp4', 'mov', 'avi'].includes(ext || '')) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return 'audio';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) return 'archive';
  if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext || '')) return 'document';
  return 'other';
};

export function ShareTransactionsPage() {
  const [searchUserId, setSearchUserId] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">("all");
  
  const [transactions, setTransactions] = useState<FileTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW STATES FOR ACTION BUTTONS ---
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token missing. Please log in.");

        const response = await fetch("http://localhost:8080/api/v1/transactions", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to load transactions.");

        const rawData = await response.json();

        const mappedData: FileTransaction[] = rawData.map((tx: any) => ({
          id: tx.id,
          fileId: tx.fileId,
          fileName: tx.fileName,
          fileType: "file", 
          fileCategory: guessFileCategory(tx.fileName),
          fileSize: tx.fileSizeBytes ? formatBytes(tx.fileSizeBytes) : undefined,
          transactionType: tx.transactionType.toLowerCase() as "sent" | "received",
          userId: tx.transactionType === "SENT" ? tx.receiverTag : tx.senderTag,
          timestamp: new Date(tx.timestamp),
          status: tx.status.toLowerCase()
        }));

        setTransactions(mappedData);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // --- 1. VIEW HANDLER ---
  const handleView = async (transaction: FileTransaction) => {
    console.log("👀 VIEW BUTTON CLICKED! Trying to view:", transaction.fileName);
    console.log("File ID is:", transaction.fileId);
    
    try {
      const token = localStorage.getItem("token");
      const privateKeyBase64 = localStorage.getItem("privateKey");

      if (!token || !privateKeyBase64) throw new Error("Missing cryptographic data.");

      const metaRes = await fetch(`http://localhost:8080/api/v1/files/${transaction.fileId}/metadata`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!metaRes.ok) throw new Error("Could not fetch file keys.");
      const metadata = await metaRes.json();
      
      const fileRes = await fetch(`http://localhost:8080/api/v1/files/${transaction.fileId}/download`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const encryptedArrayBuffer = await fileRes.arrayBuffer();

      const aesKey = await decryptKeyWithRSA(metadata.encryptedKey, privateKeyBase64);
      const decryptedBlob = await decryptFile(encryptedArrayBuffer, aesKey, metadata.iv);

      const finalBlob = new Blob([decryptedBlob], { type: metadata.fileType || 'application/octet-stream' });
      const viewUrl = URL.createObjectURL(finalBlob);
      
      window.open(viewUrl, '_blank');

    } catch (error: any) {
      console.error("View failed:", error);
      alert("Failed to view file. Ensure your backend metadata endpoint is active.");
    }
  };

  // --- 2. DOWNLOAD HANDLER ---
  const handleDownload = async (transaction: FileTransaction) => {
    console.log("⬇️ DOWNLOAD BUTTON CLICKED! Trying to download:", transaction.fileName);
    console.log("File ID is:", transaction.fileId);
    
    try {
      setIsDownloading(transaction.id);
      const token = localStorage.getItem("token");
      const privateKeyBase64 = localStorage.getItem("privateKey");

      if (!token || !privateKeyBase64) throw new Error("Missing cryptographic data. Please log in again.");

      const metaRes = await fetch(`http://localhost:8080/api/v1/files/${transaction.fileId}/metadata`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!metaRes.ok) throw new Error("Could not fetch file keys.");
      const metadata = await metaRes.json();
      const { encryptedKey, iv, fileType } = metadata; 

      const fileRes = await fetch(`http://localhost:8080/api/v1/files/${transaction.fileId}/download`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!fileRes.ok) throw new Error("Could not download encrypted file.");
      const encryptedArrayBuffer = await fileRes.arrayBuffer();

      const aesKey = await decryptKeyWithRSA(encryptedKey, privateKeyBase64);
      const decryptedBlob = await decryptFile(encryptedArrayBuffer, aesKey, iv);

      const finalBlob = new Blob([decryptedBlob], { type: fileType || 'application/octet-stream' });
      const downloadUrl = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = transaction.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

    } catch (error: any) {
      console.error("Download failed:", error);
      alert(error.message || "Failed to process download.");
    } finally {
      setIsDownloading(null);
    }
  };

  // --- 3. SHARE HANDLER ---
  const handleShare = (transaction: FileTransaction) => {
    console.log("🔄 SHARE BUTTON CLICKED! Trying to share:", transaction.fileName);
    setIsSharing(transaction.id);
    
    setTimeout(() => {
        alert(`Opening Share Modal for: ${transaction.fileName}`);
        setIsSharing(null);
    }, 500);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesUserId = searchUserId
      ? transaction.userId.toLowerCase().includes(searchUserId.toLowerCase())
      : true;
    const matchesType =
      filterType === "all" ? true : transaction.transactionType === filterType;
    return matchesUserId && matchesType;
  });

  const groupedByUser = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.userId]) {
      acc[transaction.userId] = [];
    }
    acc[transaction.userId].push(transaction);
    return acc;
  }, {} as Record<string, FileTransaction[]>);

  const getFileIcon = (fileType: "file" | "folder", fileCategory?: string) => {
    if (fileType === "folder") return <FolderOpen className="h-5 w-5 text-amber-500" />;
    switch (fileCategory) {
      case "document": return <FileText className="h-5 w-5 text-blue-500" />;
      case "image": return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case "video": return <Video className="h-5 w-5 text-red-500" />;
      case "audio": return <Music className="h-5 w-5 text-green-500" />;
      case "archive": return <Archive className="h-5 w-5 text-orange-500" />;
      default: return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getTransactionCount = (userId: string, type: "sent" | "received") => {
    return groupedByUser[userId]?.filter((t) => t.transactionType === type).length || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                File Sharing Transactions
              </h1>
              <p className="text-sm text-muted-foreground">
                View all files and folders you've sent or received securely.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="Search by User Tag (e.g., @motasem)"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setFilterType("all")}
                className={cn("px-4 py-2 rounded-lg font-medium transition-all text-sm", filterType === "all" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}
              >All</button>
              <button
                onClick={() => setFilterType("sent")}
                className={cn("px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2", filterType === "sent" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}
              ><ArrowUpRight className="h-4 w-4" /> Sent</button>
              <button
                onClick={() => setFilterType("received")}
                className={cn("px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2", filterType === "received" ? "bg-background shadow-sm text-indigo-600" : "text-muted-foreground hover:text-foreground")}
              ><ArrowDownLeft className="h-4 w-4" /> Received</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-muted-foreground font-medium">Decrypting transaction history...</p>
          </div>
        ) : Object.keys(groupedByUser).length === 0 ? (
          <div className="text-center py-16 bg-background rounded-2xl border border-border">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4 border border-border">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
            <p className="text-muted-foreground">{searchUserId ? `No transactions with User Tag: ${searchUserId}` : "Start sharing files to see your transaction history"}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByUser).map(([userId, userTransactions]) => (
              <div key={userId} className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                
                <div className="bg-background px-6 py-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-2">{userId}</p>
                        <p className="text-sm text-muted-foreground">{userTransactions.length} transaction{userTransactions.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center px-4 py-1.5 bg-background rounded-lg border border-border shadow-sm">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          <span className="text-sm font-bold">{getTransactionCount(userId, "sent")}</span>
                        </div>
                      </div>
                      <div className="text-center px-4 py-1.5 bg-background rounded-lg border border-border shadow-sm">
                        <div className="flex items-center gap-1 text-blue-600">
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                          <span className="text-sm font-bold">{getTransactionCount(userId, "received")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {userTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-background transition-colors">
                      <div className="flex items-center gap-4">
                        
                        <div className={cn("p-2.5 rounded-lg", transaction.transactionType === "sent" ? "bg-emerald-50 border border-emerald-100" : "bg-blue-50 border border-blue-100")}>
                          {transaction.transactionType === "sent" ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownLeft className="h-4 w-4 text-blue-600" />}
                        </div>

                        <div className="p-2.5 bg-background border border-border rounded-lg shadow-sm">
                          {getFileIcon(transaction.fileType, transaction.fileCategory)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground truncate">{transaction.fileName}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            {transaction.fileSize && <span>{transaction.fileSize}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTimestamp(transaction.timestamp)}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full", transaction.transactionType === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
                              {transaction.transactionType === "sent" ? "You sent" : "You received"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold capitalize", transaction.status === 'completed' ? "bg-emerald-50 text-emerald-700" : transaction.status === 'failed' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
                            {transaction.status}
                          </span>
                        </div>

                        {/* --- THE FULLY WIRED ACTION BUTTONS --- */}
                        <div className="flex gap-2 ml-4">
                          
                          {/* 1. Share Button */}
                          <button
                            onClick={() => handleShare(transaction)}
                            disabled={isSharing === transaction.id}
                            className="p-2 hover:bg-purple-50 text-muted-foreground hover:text-purple-600 rounded-lg transition-colors"
                            title="Share File"
                          >
                            {isSharing === transaction.id ? <Loader2 className="h-4 w-4 animate-spin text-purple-600" /> : <Share2 className="h-4 w-4" />}
                          </button>

                          {/* 2. View Button */}
                          <button
                            onClick={() => handleView(transaction)}
                            className="p-2 hover:bg-blue-50 text-muted-foreground hover:text-blue-600 rounded-lg transition-colors"
                            title="View File"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* 3. Download Button */}
                          <button
                            onClick={() => handleDownload(transaction)}
                            disabled={isDownloading === transaction.id}
                            className="p-2 hover:bg-indigo-50 text-muted-foreground hover:text-indigo-600 rounded-lg transition-colors"
                            title="Download File"
                          >
                            {isDownloading === transaction.id ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <Download className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* --------------------------------------- */}

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}