import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Wizard State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ newPass: false, confirm: false });

  // --- STEP 1: Request OTP ---
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // NOTE: We use standard fetch here, NOT authFetch, because the user is not logged in!
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Failed to request password reset.");
      
      setStep(2); // Move to OTP entry
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: Verify OTP Length ---
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError(null);
    setStep(3); // Move to New Password entry
  };

  // --- STEP 3: Submit Final Reset Request ---
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (passwords.newPass !== passwords.confirm) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          otpCode: otp,
          newPassword: passwords.newPass,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Invalid or expired OTP code.");
      }

      setStep(4); // Move to Success Screen
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={step === 4 ? "Password Reset!" : "Forgot Password"} 
      subtitle={
        step === 1 ? "Enter your email to receive a recovery code" :
        step === 2 ? `Enter the 6-digit code sent to ${email}` :
        step === 3 ? "Create a new secure password" :
        "You can now sign in with your new password"
      }
    >
      <div className="space-y-6">
        
        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ================= STEP 1: EMAIL ================= */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-muted/50 border-border focus:border-primary pl-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !email} className="w-full h-12 bg-primary hover:bg-primary/90">
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</> : "Send Recovery Code"}
            </Button>
          </form>
        )}

        {/* ================= STEP 2: OTP ================= */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="otp">Recovery Code</Label>
              <div className="relative">
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                  required
                  className="h-12 bg-muted/50 border-border focus:border-primary text-center tracking-widest text-lg font-semibold"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" disabled={otp.length !== 6} className="w-full h-12 bg-primary hover:bg-primary/90">
              Verify Code
            </Button>
          </form>
        )}

        {/* ================= STEP 3: NEW PASSWORD ================= */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            {(["newPass", "confirm"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label>{key === "newPass" ? "New Password" : "Confirm New Password"}</Label>
                <div className="relative">
                  <Input
                    type={showPass[key] ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwords[key]}
                    onChange={(e) => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                    required
                    className="h-12 bg-muted/50 border-border focus:border-primary pl-10 pr-12"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90">
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Resetting...</> : "Reset Password"}
            </Button>
          </form>
        )}

        {/* ================= STEP 4: SUCCESS ================= */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Your password has been securely reset. Due to Zero-Knowledge security protocols, previous encrypted files will remain locked, but your account is fully recovered.
            </p>
            <Button onClick={() => navigate("/signin")} className="w-full h-12 bg-primary hover:bg-primary/90">
              Return to Sign In
            </Button>
          </div>
        )}

        {/* Back to Login Link (Only show on steps 1-3) */}
        {step < 4 && (
          <div className="mt-6 text-center">
            <Link to="/signin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}