import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Lock, User, Server, FileText, Key, Check, X } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const HEX = "0123456789abcdef";
const randomCipher = () =>
  Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => HEX[Math.floor(Math.random() * 16)]).join("")).join(" ");

// Ciphertext that keeps changing while it is on screen, to show the file is unreadable
function CipherText() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [text, setText] = useState("8f3a 91c4 e07b");

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const id = window.setInterval(() => setText(randomCipher()), 140);
    return () => window.clearInterval(id);
  }, [inView, reduceMotion]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className="font-mono tabular-nums">
        {text}
      </span>
      <span className="sr-only">Encrypted data</span>
    </>
  );
}

function Step({
  icon: Icon,
  title,
  caption,
  highlight,
  denied,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  caption: ReactNode;
  highlight?: boolean;
  denied?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`relative mb-3 p-4 rounded-2xl border ${
          highlight ? "bg-primary/15 border-primary/40 glow-primary" : "bg-secondary border-border"
        }`}
      >
        <Icon className={`h-8 w-8 ${highlight ? "text-primary" : denied ? "text-muted-foreground" : "text-foreground"}`} />
        {denied && (
          <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-card border border-border">
            <X className="h-3 w-3 text-destructive" aria-hidden="true" />
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <div className={`flex items-center gap-1.5 mt-2 text-xs ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {caption}
      </div>
    </div>
  );
}

// Connector with a light that travels along it: vertical on phones, horizontal from md up
function Flow({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:gap-2 md:pt-[33px]" aria-hidden="true">
      <div className="flow-track h-12 w-px md:h-px md:w-28" data-muted={muted ? "" : undefined}>
        <span className="flow-dot" />
      </div>
      <span className={`text-xs font-medium ${muted ? "text-muted-foreground" : "text-primary"}`}>{label}</span>
    </div>
  );
}

const ZeroKnowledgeDiagram = () => {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background accent */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal className="text-center mb-14 lg:mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">Architecture</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            How <span className="text-primary">Zero-Knowledge</span> Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your files are encrypted before they leave your device. We only store encrypted data — the keys never touch
            our servers.
          </p>
        </Reveal>

        <Reveal y={32} className="max-w-5xl mx-auto">
          <div className="relative p-6 sm:p-10 rounded-3xl bg-card/70 border border-border shadow-2xl shadow-black/30">
            <div className="grid gap-4 md:gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center md:items-start">
              <Step
                icon={User}
                title="Your Device"
                caption={
                  <>
                    <FileText className="h-3 w-3" aria-hidden="true" />
                    <span className="font-mono">report.pdf</span>
                  </>
                }
              />
              <Flow label="Encrypt" />
              <Step
                icon={Lock}
                title="Encrypted in Your Browser"
                highlight
                caption={
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" />
                    <CipherText />
                  </>
                }
              />
              <Flow label="Upload" muted />
              <Step
                icon={Server}
                title="Our Servers"
                denied
                caption={
                  <>
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>No Access</span>
                  </>
                }
              />
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Key className="h-4 w-4" aria-hidden="true" />
                  <span>Encryption key stays on your device</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Server className="h-4 w-4" aria-hidden="true" />
                  <span>We store only encrypted blobs</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default ZeroKnowledgeDiagram;
