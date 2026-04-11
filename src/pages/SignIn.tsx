import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AuthLayout from "@/components/auth/AuthLayout";
import OTPModal from "@/components/auth/OTPModal";
import { decryptPrivateKeyFromServer } from "@/services/cryptoService";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom"; 

/**
 * Shape of the JWT response from POST /api/auth/login.
 */
interface AuthResponse {
  token: string;
  publicKey: string; 
  encryptedPrivateKey: string;
  keySalt: string;
  keyIv: string;
  // --- ADDED THESE THREE FIELDS FOR THE TOP BAR ---
  fullName: string;
  email: string;
  searchTag: string;
}

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [showOTP,      setShowOTP]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email:      "",
    password:   "",
    rememberMe: false,
  });
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  // ── Step 1: credentials → backend ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const message = await response.text(); 
      console.log(message); 

      setShowOTP(true); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: OTP verified → decrypt private key ────────────────────────────
  const handleOTPVerify = async (otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: otp,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid or expired code");
      }

      // We cast the response to our updated interface
      const data: AuthResponse = await response.json();

      // 1. Decrypt the private key using the password they just typed
      const decryptedKey = await decryptPrivateKeyFromServer(
        formData.password, 
        data.encryptedPrivateKey,
        data.keySalt,
        data.keyIv
      );
      
      const exportedKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", decryptedKey as any);
      const exportedKeyArray = Array.from(new Uint8Array(exportedKeyBuffer));
      const privateKeyBase64 = btoa(String.fromCharCode.apply(null, exportedKeyArray));
      
      // 3. Save the keys for the Zero-Knowledge File Uploader/Downloader!
      localStorage.setItem("publicKey", data.publicKey);
      localStorage.setItem("privateKey", privateKeyBase64); 
      localStorage.setItem("token", data.token);      
      const userProfile = {
        name: data.fullName,
        email: data.email,
        searchTag: data.searchTag
      };
      localStorage.setItem("user", JSON.stringify(userProfile));
      login(data.token, decryptedKey as any, userProfile);
      
        
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title="Welcome back" subtitle="Sign in to access your encrypted files">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
              Remember me for 30 days
            </Label>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            {isLoading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Signing in…</>) : ("Sign In")}
          </Button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">Create one</Link>
          </p>
        </form>
      </AuthLayout>

      <OTPModal isOpen={showOTP} onClose={() => setShowOTP(false)} onVerify={handleOTPVerify} email={formData.email} purpose="signin" />
    </>
  );
};

export default SignIn;