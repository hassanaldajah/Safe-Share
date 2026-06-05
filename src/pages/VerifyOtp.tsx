import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import AuthLayout from "@/components/auth/AuthLayout";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingVerificationEmail");
    if (!pendingEmail) {
      navigate("/signup");
    } else {
      setEmail(pendingEmail);
    }
  }, [navigate]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      if (!response.ok) {
        throw new Error("Invalid or expired code");
      }

      localStorage.removeItem("pendingVerificationEmail");
      navigate("/signin", {
        state: { message: "Email verified successfully! Please log in to initialize your cryptographic vault." },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend OTP");
      }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send a new code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <AuthLayout
      title="Verify Your Account"
      subtitle="Enter the verification code we sent you"
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Email info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
             <p className="text-sm text-muted-foreground">
               We sent a verification code to
             </p>
            <p className="text-sm font-medium text-foreground truncate">
              {email}
            </p>
          </div>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center py-4">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
        <div className="text-center">
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
              Resend verification code
            </button>
          )}
        </div>

        {/* Verify button */}
        <Button
          onClick={() => handleVerify()}
          disabled={otp.length !== 6 || isLoading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Continue"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          This code will verify your new account. Your encryption keys will be generated securely on your device.
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtp;
