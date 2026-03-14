import { useState } from "react";
import { Search, ChevronDown, ChevronRight, MessageCircle, Mail, BookOpen, Video, ExternalLink, FileQuestion, Zap, Shield, HardDrive } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I upload files to the dashboard?",
    answer: "You can upload files by navigating to any folder and clicking the 'Upload' button, or simply drag and drop files directly into the dashboard. Supported formats include documents, images, videos, and archives up to 5GB per file.",
  },
  {
    category: "Getting Started",
    question: "How do I share a folder with someone?",
    answer: "Open any folder, click the '...' menu or right-click it, then select 'Share'. Enter the email address of the person you want to share with and choose their permission level (View, Edit, or Admin).",
  },
  {
    category: "Storage",
    question: "What happens when I reach my storage limit?",
    answer: "When you reach your storage limit, you won't be able to upload new files. You'll receive email warnings at 80% and 95% usage. You can free up space by deleting unused files or upgrade your plan for more storage.",
  },
  {
    category: "Storage",
    question: "How is storage calculated?",
    answer: "Storage is calculated based on the total size of all files you own, including files in trash that haven't been permanently deleted. Shared files you don't own don't count towards your quota.",
  },
  {
    category: "Security",
    question: "How secure are my files?",
    answer: "All files are encrypted at rest using AES-256 encryption and in transit using TLS 1.3. We perform regular security audits and maintain SOC 2 Type II compliance. Your private key is never stored on our servers.",
  },
  {
    category: "Security",
    question: "What is my public and private key used for?",
    answer: "Your key pair is used for end-to-end encryption of sensitive documents. Your public key can be shared with others to send you encrypted files. Your private key must never be shared — it's the only way to decrypt files sent to you.",
  },
  {
    category: "Account",
    question: "How do I change my account email?",
    answer: "Go to Settings > Personal Information and click on your email field to edit it. A verification email will be sent to both your old and new address. The change takes effect once confirmed.",
  },
  {
    category: "Account",
    question: "Can I have multiple accounts?",
    answer: "Each person is allowed one account per email address. If you need a separate workspace for a team or organization, consider upgrading to a Team or Enterprise plan which supports multiple members.",
  },
];

const categories = [
  { label: "All", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Getting Started", icon: <Zap className="h-4 w-4" /> },
  { label: "Storage", icon: <HardDrive className="h-4 w-4" /> },
  { label: "Security", icon: <Shield className="h-4 w-4" /> },
  { label: "Account", icon: <FileQuestion className="h-4 w-4" /> },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const filtered = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Hero */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-8 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">How can we help you?</h1>
            <p className="text-sm text-muted-foreground mt-2 mb-6">Search our knowledge base or browse categories below</p>
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for answers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
        </div>

        {/* Quick Contact */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: <MessageCircle className="h-5 w-5" />, label: "Live Chat", description: "Chat with support", action: "Start Chat", color: "text-blue-500 bg-blue-500/10" },
            { icon: <Mail className="h-5 w-5" />, label: "Email Support", description: "support@example.com", action: "Send Email", color: "text-purple-500 bg-purple-500/10" },
            { icon: <Video className="h-5 w-5" />, label: "Video Guides", description: "Watch tutorials", action: "View Guides", color: "text-green-500 bg-green-500/10" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/50 group"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                {item.action} <ExternalLink className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto px-6 py-3 border-b border-border scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">No results found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term or category</p>
              </div>
            ) : (
              filtered.map((faq, index) => (
                <div key={index} className="px-6">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="flex w-full items-center justify-between py-4 text-left"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                      <ChevronRight
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-transform ${
                          openFAQ === index ? "rotate-90" : ""
                        }`}
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">{faq.question}</span>
                        <span className="ml-2 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{faq.category}</span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
                        openFAQ === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="pb-4 pl-7">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="rounded-2xl border border-border bg-card px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Still need help?</p>
            <p className="text-xs text-muted-foreground">Our support team typically responds within 2–4 hours.</p>
          </div>
          <button className="flex-shrink-0 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
}