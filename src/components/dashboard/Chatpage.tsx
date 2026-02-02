import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  X,
  Mail,
  User,
  File,
  Download,
  Eye,
  Upload,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Paperclip,
  Users,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders, FileItem } from "@/components/dashboard/FoldersContext";

interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
  lastSeen?: string;
}

interface FileActivity {
  type: "sent" | "received" | "opened" | "downloaded";
  timestamp: Date;
  user: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message?: string;
  file?: {
    id: string;
    name: string;
    size: string;
    type: string;
    fileType?: FileItem["fileType"];
  };
  activity?: FileActivity;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read";
}

interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
}

export function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { files } = useFolders();

  // Mock data
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      contact: {
        id: "user1",
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        online: true,
      },
      unreadCount: 2,
      lastMessage: {
        id: "msg1",
        senderId: "user1",
        recipientId: "me",
        file: {
          id: "f1",
          name: "Q4_Report.pdf",
          size: "2.4 MB",
          type: "pdf",
          fileType: "document",
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: "delivered",
      },
      messages: [
        {
          id: "msg1",
          senderId: "user1",
          recipientId: "me",
          message: "Hi! Here's the Q4 report you requested.",
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          status: "read",
        },
        {
          id: "msg2",
          senderId: "user1",
          recipientId: "me",
          file: {
            id: "f1",
            name: "Q4_Report.pdf",
            size: "2.4 MB",
            type: "pdf",
            fileType: "document",
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          status: "delivered",
        },
      ],
    },
    {
      id: "2",
      contact: {
        id: "user2",
        name: "Michael Chen",
        email: "michael.chen@agency.com",
        online: false,
        lastSeen: "2 hours ago",
      },
      unreadCount: 0,
      lastMessage: {
        id: "msg3",
        senderId: "me",
        recipientId: "user2",
        file: {
          id: "f2",
          name: "Design_Mockups.zip",
          size: "15.3 MB",
          type: "zip",
          fileType: "archive",
        },
        activity: {
          type: "downloaded",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          user: "Michael Chen",
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: "read",
      },
      messages: [
        {
          id: "msg3",
          senderId: "me",
          recipientId: "user2",
          message: "Here are the latest design mockups",
          timestamp: new Date(Date.now() - 1000 * 60 * 65),
          status: "read",
        },
        {
          id: "msg4",
          senderId: "me",
          recipientId: "user2",
          file: {
            id: "f2",
            name: "Design_Mockups.zip",
            size: "15.3 MB",
            type: "zip",
            fileType: "archive",
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          status: "read",
        },
        {
          id: "msg5",
          senderId: "me",
          recipientId: "user2",
          activity: {
            type: "downloaded",
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            user: "Michael Chen",
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: "read",
        },
      ],
    },
  ]);

  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const getFileIcon = (fileType?: FileItem["fileType"]) => {
    switch (fileType) {
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

  const getStatusIcon = (status: ChatMessage["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3.5 w-3.5 text-gray-400" />;
      case "sent":
        return <Check className="h-3.5 w-3.5 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      recipientId: currentConversation!.contact.id,
      message: messageInput,
      timestamp: new Date(),
      status: "sent",
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: newMessage,
            }
          : conv
      )
    );

    setMessageInput("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      recipientId: currentConversation!.contact.id,
      file: {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.name.split(".").pop() || "file",
        fileType: "document", // Would determine based on file type
      },
      timestamp: new Date(),
      status: "sending",
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: newMessage,
            }
          : conv
      )
    );

    // Simulate upload
    setTimeout(() => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === newMessage.id ? { ...msg, status: "sent" as const } : msg
                ),
              }
            : conv
        )
      );
    }, 1000);
  };

  const handleStartNewChat = () => {
    if (!newChatEmail.trim()) return;

    const newConversation: Conversation = {
      id: Date.now().toString(),
      contact: {
        id: Date.now().toString(),
        name: newChatEmail.split("@")[0].replace(".", " "),
        email: newChatEmail,
        online: false,
      },
      unreadCount: 0,
      lastMessage: {
        id: "init",
        senderId: "me",
        recipientId: Date.now().toString(),
        message: "Started conversation",
        timestamp: new Date(),
        status: "sent",
      },
      messages: [],
    };

    setConversations((prev) => [newConversation, ...prev]);
    setSelectedConversation(newConversation.id);
    setShowNewChat(false);
    setNewChatEmail("");
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex">
      {/* Sidebar - Conversations List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Messages
            </h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={cn(
                "w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-l-4",
                selectedConversation === conversation.id
                  ? "bg-blue-50 border-blue-600"
                  : "border-transparent"
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {conversation.contact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                {conversation.contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {conversation.contact.name}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessage.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conversation.contact.email}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage.file
                      ? `📎 ${conversation.lastMessage.file.name}`
                      : conversation.lastMessage.message}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation && currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentConversation.contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {currentConversation.contact.name}
                    </p>
                    <p className="text-sm text-gray-600">{currentConversation.contact.email}</p>
                    <p className="text-xs text-gray-500">
                      {currentConversation.contact.online
                        ? "Online"
                        : `Last seen ${currentConversation.contact.lastSeen || "recently"}`}
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.messages.map((message) => {
                const isMine = message.senderId === "me";

                // Activity message
                if (message.activity) {
                  const activityIcons = {
                    sent: <Upload className="h-4 w-4" />,
                    received: <Download className="h-4 w-4" />,
                    opened: <Eye className="h-4 w-4" />,
                    downloaded: <Download className="h-4 w-4" />,
                  };

                  const activityText = {
                    sent: "sent",
                    received: "received",
                    opened: "opened",
                    downloaded: "downloaded",
                  };

                  return (
                    <div key={message.id} className="flex items-center justify-center">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {activityIcons[message.activity.type]}
                        <span>
                          {message.activity.user} {activityText[message.activity.type]} the file
                        </span>
                        <span className="text-blue-500">
                          • {formatTime(message.activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={cn("flex", isMine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-lg rounded-2xl px-4 py-3",
                        isMine
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      )}
                    >
                      {/* Text Message */}
                      {message.message && (
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      )}

                      {/* File Attachment */}
                      {message.file && (
                        <div
                          className={cn(
                            "mt-2 p-3 rounded-lg border",
                            isMine
                              ? "bg-blue-700 border-blue-500"
                              : "bg-gray-50 border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                isMine ? "bg-blue-600" : "bg-white"
                              )}
                            >
                              {getFileIcon(message.file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{message.file.name}</p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isMine ? "text-blue-200" : "text-gray-500"
                                )}
                              >
                                {message.file.size}
                              </p>
                            </div>
                            <button
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                isMine
                                  ? "hover:bg-blue-500"
                                  : "hover:bg-gray-200"
                              )}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Timestamp and Status */}
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs",
                            isMine ? "text-blue-200" : "text-gray-500"
                          )}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                        {isMine && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message or attach a file..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={1}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={cn(
                    "p-2.5 rounded-lg transition-all",
                    messageInput.trim()
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-600 mb-6">
                Choose a conversation or start a new one to share files
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">New Conversation</h2>
                      <p className="text-sm text-white/80">Start sharing files with someone</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={newChatEmail}
                    onChange={(e) => setNewChatEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartNewChat}
                    disabled={!newChatEmail.trim()}
                    className={cn(
                      "flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors",
                      newChatEmail.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}