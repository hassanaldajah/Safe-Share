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
import { authFetch } from "@/lib/api";

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



 const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    // 1. Add user message to the chat UI instantly
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Prepare the Zero-Knowledge Metadata Payload
      // We ONLY send names, sizes, and types. We NEVER send the actual file contents!
      const fileMetadata = files.filter(f => f.type === "file").map(f => ({
        name: f.name,
        size: f.size || "Unknown",
        type: f.fileType || "other"
      }));

      // 3. Call your Spring Boot AI endpoint
      const res = await authFetch("http://localhost:8080/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          prompt: textToSend,
          files: fileMetadata
        })
      });

      if (!res.ok) {
        throw new Error("Failed to connect to the AI server.");
      }

      const data = await res.json();

      // 4. Display Gemini's response!
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.reply,
        timestamp: new Date(),
        suggestions: [
          "What is taking up the most space?",
          "How should I organize my files?",
          "Are there any duplicate files?",
        ],
      };

      setMessages((prev) => [...prev, aiResponse]);

    } catch (error: any) {
      console.error("AI Communication Error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "⚠️ Secure connection failed. I am having trouble connecting to the AI brain right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Bot className="h-6 w-6" />
                AI Assistant
              </h1>
              <p className="text-sm text-muted-foreground">
                Smart file management powered by AI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 lg:px-8 py-6 space-y-6">
          {/* Suggested Actions - Show only at start */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {suggestedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <action.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
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
                    : "bg-background border border-border text-foreground"
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
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
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
                    className="mt-3 text-xs text-muted-foreground hover:text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <div className="bg-background border border-border rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
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
      <div className="bg-background border-t border-border flex-shrink-0">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about your files..."
              className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                input.trim() && !isLoading
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI responses are generated based on your file data. Always verify
            important information.
          </p>
        </div>
      </div>
    </div>
  );
}