import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/AuthLayout";
import { buildRegistrationPayload, decryptPrivateKeyFromServer } from "@/services/cryptoService";
import { useAuth } from "@/context/AuthContext";

// ─── Password Strength Hook ───────────────────────────────────────────────────
const usePasswordStrength = (password: string) => {
  if (!password) return { strength: 0, label: "", color: "" };
  if (password.length < 6) return { strength: 1, label: "Weak", color: "bg-destructive" };
  if (password.length < 10) return { strength: 2, label: "Medium", color: "bg-yellow-500" };
  if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
    return { strength: 3, label: "Strong", color: "bg-green-500" };
  return { strength: 2, label: "Medium", color: "bg-yellow-500" };
};

// ─── SignUp Component ─────────────────────────────────────────────────────────
const SignUp = () => {
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm,  setShowConfirm]    = useState(false);
  const [isLoading,    setIsLoading]      = useState(false);
  const [error,        setError]          = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName:        "",
    email:           "",
    password:        "",
    confirmPassword: "",
  });

  const { strength, label, color } = usePasswordStrength(formData.password);

  const passwordsMatch    = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const passwordsMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Simplified since searchTag is gone
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordsMismatch) return;
    setIsLoading(true);
    setError(null);

   try {
      // Passed "" as the first argument so your cryptoService doesn't break
      const payload = await buildRegistrationPayload(
        "", 
        formData.fullName,
        formData.email,
        formData.password
      );

      const res = await fetch("http://localhost:8080/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Registration failed");
      }

      const data = await res.json();

      const privateKey = await decryptPrivateKeyFromServer(
        formData.password,
        data.encryptedPrivateKey,
        data.keySalt,
        data.keyIv
      );
      localStorage.setItem("publicKey", data.publicKey);
      localStorage.setItem("token", data.token); // <--- ADD THIS LINE!
      login(data.token, privateKey);
      navigate("/dashboard");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start securing your files with zero-knowledge encryption"
    >
      <form onSubmit={handleSubmit} className="space-y-5">

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Ada Lovelace"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary"
          />
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
          {formData.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      lvl <= strength ? color : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Strength: <span className="font-medium">{label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`h-12 bg-muted/50 border-border focus:border-primary focus:ring-primary pr-12 transition-colors ${
                passwordsMismatch
                  ? "border-destructive focus:border-destructive"
                  : passwordsMatch
                  ? "border-green-500 focus:border-green-500"
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {passwordsMismatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading || passwordsMismatch || !passwordsMatch}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>

      </form>
    </AuthLayout>
  );
};

export default SignUp;