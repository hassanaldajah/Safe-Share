import { motion } from "framer-motion";
import { Eye, FileKey, Timer, ClipboardList, Key, Clock } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Zero-Knowledge Encryption",
    description: "Files are encrypted on your device before upload. We never see your encryption keys — only you and your recipients can decrypt.",
  },
  {
    icon: ClipboardList,
    title: "Audit Logs & Permissions",
    description: "Track every access, download, and share. Set granular permissions for who can view, edit, or forward your files.",
  },
  {
    icon: Timer,
    title: "Time-Limited & OTP Links",
    description: "Create self-destructing links with expiration dates. Add one-time passwords for an extra layer of security.",
  },
];

const FeatureCards = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Security That <span className="text-primary">Just Works</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security features that protect your most sensitive files without complexity.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;