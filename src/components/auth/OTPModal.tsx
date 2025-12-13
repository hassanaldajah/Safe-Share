import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  email: string;
  purpose?: "signin" | "unlock";
}

const OTPModal = ({ isOpen, onClose, onVerify, email, purpose = "signin" }: OTPModalProps) => {
  const [otp, setOtp] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResend = async () => {
    setIsResending(true);
    // Simulate resend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsResending(false);
    setResendCooldown(60);
    
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  const purposeText = purpose === "signin" 
    ? "verify your sign in" 
    : "unlock the shared file";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 mx-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Verify Your Identity
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Email info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border mb-6">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    We sent a one-time password to
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {email}
                  </p>
                </div>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center mb-6">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-14 text-lg bg-muted/50 border-border" />
                    <InputOTPSlot index={1} className="w-12 h-14 text-lg bg-muted/50 border-border" />
                    <InputOTPSlot index={2} className="w-12 h-14 text-lg bg-muted/50 border-border" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="w-12 h-14 text-lg bg-muted/50 border-border" />
                    <InputOTPSlot index={4} className="w-12 h-14 text-lg bg-muted/50 border-border" />
                    <InputOTPSlot index={5} className="w-12 h-14 text-lg bg-muted/50 border-border" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Resend */}
              <div className="text-center mb-6">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Resend code in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Verify button */}
              <Button
                onClick={handleVerify}
                disabled={otp.length !== 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                Verify & Continue
              </Button>

              {/* Security hint */}
              <p className="mt-4 text-xs text-center text-muted-foreground">
                This code will {purposeText}. Your encryption keys remain stored securely on your device.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OTPModal;
