import { motion } from "framer-motion";
import { Lock, Cloud, Share2, User, Server, FileText, Key, ArrowRight, Check, X } from "lucide-react";

const ZeroKnowledgeDiagram = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How <span className="text-primary">Zero-Knowledge</span> Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your files are encrypted before they leave your device. We only store encrypted data — 
            the keys never touch our servers.
          </p>
        </motion.div>

        {/* Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative p-8 rounded-2xl bg-card border border-border">
            {/* Flow diagram */}
            <div className="grid md:grid-cols-5 gap-4 items-center">
              {/* Step 1: User with file */}
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-xl bg-secondary mb-3">
                  <User className="h-8 w-8 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Your Device</span>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>Original File</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-primary font-medium">Encrypt</span>
                </div>
              </div>

              {/* Step 2: Encrypted on device */}
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-xl bg-primary/20 border border-primary/30 mb-3 glow-primary">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Client-Side</span>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <Check className="h-3 w-3" />
                  <span>Encrypted</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              </div>

              {/* Step 3: Server */}
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-xl bg-secondary mb-3 relative">
                  <Server className="h-8 w-8 text-muted-foreground" />
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-card border border-border">
                    <X className="h-3 w-3 text-destructive" />
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">Our Servers</span>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>No Access</span>
                </div>
              </div>
            </div>

            {/* Key stays with user indicator */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Key className="h-4 w-4" />
                  <span>Encryption key stays on your device</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Server className="h-4 w-4" />
                  <span>We store only encrypted blobs</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ZeroKnowledgeDiagram;