import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  FileSearch,
  FolderTree,
  Shield,
  Zap,
  TrendingUp,
  Loader2,
  User,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Package,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/components/dashboard/FoldersContext";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  fileResults?: {
    name: string;
    size: string;
    type: string;
  }[];
}

interface SuggestedAction {
  id: string;
  icon: any;
  title: string;
  description: string;
  prompt: string;
}

const suggestedActions: SuggestedAction[] = [
  {
    id: "search",
    icon: FileSearch,
    title: "Smart Search",
    description: "Find files with natural language",
    prompt: "Find all my PDF documents from this month",
  },
  {
    id: "organize",
    icon: FolderTree,
    title: "Organize Files",
    description: "Auto-categorize and organize",
    prompt: "Help me organize my files into folders",
  },
  {
    id: "optimize",
    icon: Zap,
    title: "Storage Optimization",
    description: "Free up space intelligently",
    prompt: "What files should I compress to save space?",
  },
  {
    id: "security",
    icon: Shield,
    title: "Security Check",
    description: "Scan for sensitive data",
    prompt: "Check my files for sensitive information",
  },
];

export function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hi! I'm your SafeShare AI assistant. I can help you search files, organize your storage, optimize space, and keep your data secure. What would you like to do today?",
      timestamp: new Date(),
      suggestions: [
        "Find large files",
        "Organize my documents",
        "What's using the most space?",
        "Show recent uploads",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { files, getTotalStorage } = useFolders();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Storage queries
    if (lowerMessage.includes("space") || lowerMessage.includes("storage")) {
      const storage = getTotalStorage();
      const breakdown = storage.activeFormatted 
        ? `\n\n**Breakdown:**\n- Active files: ${storage.activeFormatted}\n- Trash: ${storage.trashedFormatted}`
        : `\n- Total storage used: ${storage.usedFormatted}`;
      
      return `You're currently using **${storage.usedFormatted}** of storage.${breakdown}\n\nTo free up space, you could:\n1. Empty your trash (${storage.trashedFormatted})\n2. Compress large uncompressed files\n3. Delete old files you no longer need`;
    }

    // Find large files
    if (lowerMessage.includes("large") || lowerMessage.includes("biggest")) {
      const largeFiles = files
        .filter((f) => f.type === "file" && f.sizeBytes && f.sizeBytes > 5000000)
        .sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0))
        .slice(0, 5);

      if (largeFiles.length === 0) {
        return "You don't have any particularly large files (>5MB). Your storage is well optimized!";
      }

      return `I found ${largeFiles.length} large files:\n\n${largeFiles
        .map((f, i) => `${i + 1}. **${f.name}** - ${f.size} ${f.compressed ? "(compressed)" : ""}`)
        .join("\n")}\n\nWould you like me to suggest which ones to compress or delete?`;
    }

    // Compression suggestions
    if (lowerMessage.includes("compress")) {
      const uncompressedLarge = files.filter(
        (f) =>
          f.type === "file" &&
          !f.compressed &&
          f.sizeBytes &&
          f.sizeBytes > 1000000 &&
          f.fileType !== "archive"
      );

      if (uncompressedLarge.length === 0) {
        return "Great news! All your large files are already compressed or are archive files. No compression needed.";
      }

      return `I recommend compressing these ${uncompressedLarge.length} files to save space:\n\n${uncompressedLarge
        .slice(0, 5)
        .map(
          (f, i) =>
            `${i + 1}. **${f.name}** - ${f.size} → ~${((f.sizeBytes || 0) * 0.7 / (1024 * 1024)).toFixed(1)} MB (save ~30%)`
        )
        .join("\n")}\n\nThis could save you approximately **${(
        uncompressedLarge.reduce((sum, f) => sum + (f.sizeBytes || 0), 0) *
        0.3 /
        (1024 * 1024)
      ).toFixed(1)} MB**!`;
    }

    // File organization
    if (lowerMessage.includes("organize") || lowerMessage.includes("categorize")) {
      const fileTypes = files.reduce((acc, f) => {
        if (f.type === "file" && f.fileType) {
          acc[f.fileType] = (acc[f.fileType] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return `I analyzed your files. Here's what I found:\n\n${Object.entries(fileTypes)
        .map(([type, count]) => `📁 **${type.charAt(0).toUpperCase() + type.slice(1)}s**: ${count} files`)
        .join("\n")}\n\nI recommend creating folders for:\n1. Documents\n2. Images\n3. Archives\n4. Media (videos/audio)\n\nWould you like me to suggest a folder structure?`;
    }

    // Recent files
    if (lowerMessage.includes("recent") || lowerMessage.includes("latest")) {
      const recentFiles = [...files]
        .filter((f) => f.type === "file")
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5);

      return `Here are your most recent uploads:\n\n${recentFiles
        .map((f, i) => {
          const daysAgo = Math.floor(
            (new Date().getTime() - new Date(f.uploadedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return `${i + 1}. **${f.name}** - ${f.size} (${daysAgo === 0 ? "today" : `${daysAgo}d ago`})`;
        })
        .join("\n")}`;
    }

    // Security check
    if (lowerMessage.includes("security") || lowerMessage.includes("sensitive")) {
      const infectedFiles = files.filter((f) => f.virusScan === "infected");
      const scanningFiles = files.filter((f) => f.virusScan === "scanning");

      if (infectedFiles.length > 0) {
        return `⚠️ **Security Alert!** I found ${infectedFiles.length} infected file(s):\n\n${infectedFiles
          .map((f) => `- **${f.name}**`)
          .join("\n")}\n\nPlease delete these files immediately to protect your data.`;
      }

      if (scanningFiles.length > 0) {
        return `🔍 Currently scanning ${scanningFiles.length} file(s) for viruses. I'll let you know once complete.\n\nAll other files are clean and secure! ✅`;
      }

      return "✅ **All Clear!** All your files have been scanned and are virus-free. Your data is secure.\n\nSecurity tips:\n- Keep sensitive files compressed\n- Use password protection for shared links\n- Regularly review shared files";
    }

    // File count
    if (lowerMessage.includes("how many")) {
      const fileCount = files.filter((f) => f.type === "file").length;
      const folderCount = files.filter((f) => f.type === "folder").length;

      return `You have:\n- 📄 **${fileCount} files**\n- 📁 **${folderCount} folders**\n\nTotal items: **${files.length}**`;
    }

    // Default response
    return `I can help you with:\n\n🔍 **Smart Search** - Find files with natural language\n📊 **Storage Analysis** - See what's using space\n⚡ **Optimization** - Compress and clean up files\n🛡️ **Security** - Check for threats and sensitive data\n📁 **Organization** - Auto-categorize your files\n\nWhat would you like to know about your files?`;
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateResponse(textToSend),
        timestamp: new Date(),
        suggestions: [
          "Tell me more",
          "Show me large files",
          "What else can you do?",
          "Help me optimize storage",
        ],
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  AI Assistant
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </h1>
                <p className="text-sm text-gray-600">
                  Smart file management powered by AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {/* Suggested Actions - Show only at start */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {suggestedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <action.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.type === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-3xl rounded-2xl px-5 py-4 group",
                  message.type === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                )}
              >
                <div
                  className="prose prose-sm max-w-none"
                  style={{
                    whiteSpace: "pre-wrap",
                    color: message.type === "user" ? "white" : "inherit",
                  }}
                >
                  {message.content.split("\n").map((line, i) => {
                    // Handle bold text
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <p key={i} className="mb-2 last:mb-0">
                        {parts.map((part, j) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={j}>
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          return part;
                        })}
                      </p>
                    );
                  })}
                </div>

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    {message.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Copy button for assistant messages */}
                {message.type === "assistant" && (
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              {message.type === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about your files..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                input.trim() && !isLoading
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI responses are generated based on your file data. Always verify
            important information.
          </p>
        </div>
      </div>
    </div>
  );
}