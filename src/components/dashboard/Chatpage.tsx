import { useState } from "react";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File,
  FolderOpen,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  User,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Transaction types
interface FileTransaction {
  id: string;
  fileId: string;
  fileName: string;
  fileType: "file" | "folder";
  fileCategory?: "document" | "image" | "video" | "audio" | "archive" | "other";
  fileSize?: string;
  transactionType: "sent" | "received";
  userId: string; // The other user's ID
  timestamp: Date;
  status: "completed" | "pending" | "viewed";
}

export function ShareTransactionsPage() {
  const [searchUserId, setSearchUserId] = useState("");
  const [filterType, setFilterType] = useState<"all" | "sent" | "received">("all");

  // Mock transaction data
  const [transactions] = useState<FileTransaction[]>([
    {
      id: "t1",
      fileId: "f1",
      fileName: "Project_Proposal.pdf",
      fileType: "file",
      fileCategory: "document",
      fileSize: "2.4 MB",
      transactionType: "sent",
      userId: "U001",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: "viewed",
    },
    {
      id: "t2",
      fileId: "f2",
      fileName: "Design_Mockups.zip",
      fileType: "file",
      fileCategory: "archive",
      fileSize: "15.3 MB",
      transactionType: "sent",
      userId: "U002",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: "completed",
    },
    {
      id: "t3",
      fileId: "f3",
      fileName: "Team_Photos",
      fileType: "folder",
      transactionType: "received",
      userId: "U001",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      status: "completed",
    },
    {
      id: "t4",
      fileId: "f4",
      fileName: "Report_Q4.docx",
      fileType: "file",
      fileCategory: "document",
      fileSize: "3.1 MB",
      transactionType: "received",
      userId: "U003",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: "pending",
    },
    {
      id: "t5",
      fileId: "f5",
      fileName: "Presentation.pptx",
      fileType: "file",
      fileCategory: "document",
      fileSize: "8.7 MB",
      transactionType: "sent",
      userId: "U002",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      status: "completed",
    },
  ]);

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesUserId = searchUserId
      ? transaction.userId.toLowerCase().includes(searchUserId.toLowerCase())
      : true;

    const matchesType =
      filterType === "all" ? true : transaction.transactionType === filterType;

    return matchesUserId && matchesType;
  });

  // Group by user ID
  const groupedByUser = filteredTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.userId]) {
      acc[transaction.userId] = [];
    }
    acc[transaction.userId].push(transaction);
    return acc;
  }, {} as Record<string, FileTransaction[]>);

  const getFileIcon = (
    fileType: "file" | "folder",
    fileCategory?: FileTransaction["fileCategory"]
  ) => {
    if (fileType === "folder") {
      return <FolderOpen className="h-5 w-5 text-amber-500" />;
    }

    switch (fileCategory) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "image":
        return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-green-500" />;
      case "archive":
        return <Archive className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                File Sharing Transactions
              </h1>
              <p className="text-sm text-gray-600">
                View all files and folders you've sent or received
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-4">
            {/* Search by User ID */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="Search by User ID (e.g., U001)"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setFilterType("all")}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all text-sm",
                  filterType === "all"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("sent")}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
                  filterType === "sent"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Sent
              </button>
              <button
                onClick={() => setFilterType("received")}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2",
                  filterType === "received"
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Received
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {Object.keys(groupedByUser).length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600">
              {searchUserId
                ? `No transactions with User ID: ${searchUserId}`
                : "Start sharing files to see your transaction history"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByUser).map(([userId, userTransactions]) => (
              <div
                key={userId}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* User Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          User ID: {userId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {userTransactions.length} transaction
                          {userTransactions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Summary */}
                    <div className="flex items-center gap-4">
                      <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1.5 text-green-600 mb-1">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-lg font-bold">
                            {getTransactionCount(userId, "sent")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Sent</p>
                      </div>
                      <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                          <ArrowDownLeft className="h-4 w-4" />
                          <span className="text-lg font-bold">
                            {getTransactionCount(userId, "received")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Received</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="divide-y divide-gray-200">
                  {userTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Transaction Type Indicator */}
                        <div
                          className={cn(
                            "p-3 rounded-lg",
                            transaction.transactionType === "sent"
                              ? "bg-green-50"
                              : "bg-blue-50"
                          )}
                        >
                          {transaction.transactionType === "sent" ? (
                            <ArrowUpRight
                              className={cn(
                                "h-5 w-5",
                                "text-green-600"
                              )}
                            />
                          ) : (
                            <ArrowDownLeft
                              className={cn(
                                "h-5 w-5",
                                "text-blue-600"
                              )}
                            />
                          )}
                        </div>

                        {/* File Icon */}
                        <div className="p-2.5 bg-gray-50 rounded-lg">
                          {getFileIcon(transaction.fileType, transaction.fileCategory)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">
                              {transaction.fileName}
                            </p>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                transaction.fileType === "folder"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {transaction.fileType === "folder" ? "Folder" : "File"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            {transaction.fileSize && (
                              <span className="flex items-center gap-1">
                                {transaction.fileSize}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTimestamp(transaction.timestamp)}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                transaction.transactionType === "sent"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {transaction.transactionType === "sent" ? "You sent" : "You received"}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {transaction.status === "viewed" && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                              <Eye className="h-3.5 w-3.5" />
                              Viewed
                            </span>
                          )}
                          {transaction.status === "pending" && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">
                              <Clock className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {transaction.transactionType === "received" && (
                            <button
                              className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
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