import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, AtSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/auth/AuthLayout";

// ─── Username Step Modal (shown after Google OAuth) ───────────────────────────
const UsernameModal = ({
  isOpen,
  onComplete,
}: {
  isOpen: boolean;
  onComplete: (username: string) => void;
}) => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const validate = (val: string) => {
    if (val.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return "Only letters, numbers, and underscores";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate(username);
    if (err) return setError(err);
    setIsLoading(true);
    // Simulate availability check
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    onComplete(username);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl mx-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <AtSign className="w-7 h-7 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-1">One last step</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Your Google account is connected. Choose a username to complete your profile.
        </p>

        <div className="space-y-2 mb-5">
          <Label htmlFor="modal-username">Username</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              @
            </span>
            <Input
              id="modal-username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setError("");
              }}
              placeholder="your_username"
              className="h-12 pl-8 bg-muted/50 border-border focus:border-primary"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Letters, numbers, and underscores only. This will be your public handle.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || username.length < 3}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking availability...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Sign Up
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// ─── Google Button ─────────────────────────────────────────────────────────────
const GoogleButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-12 flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-sm font-medium text-foreground"
  >
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
    Continue with Google
  </button>
);

// ─── Password Strength ─────────────────────────────────────────────────────────
const usePasswordStrength = (password: string) => {
  if (!password) return { strength: 0, label: "", color: "" };
  if (password.length < 6) return { strength: 1, label: "Weak", color: "bg-destructive" };
  if (password.length < 10) return { strength: 2, label: "Medium", color: "bg-yellow-500" };
  if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/))
    return { strength: 3, label: "Strong", color: "bg-green-500" };
  return { strength: 2, label: "Medium", color: "bg-yellow-500" };
};

// ─── Main SignUp Component ─────────────────────────────────────────────────────
const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { strength, label, color } = usePasswordStrength(formData.password);

  const passwordsMatch =
    formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const passwordsMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordsMismatch) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    // TODO: redirect to dashboard
  };

  const handleGoogleClick = async () => {
    // Simulate Google OAuth popup
    await new Promise((r) => setTimeout(r, 500));
    // After OAuth succeeds, prompt for username
    setShowUsernameModal(true);
  };

  const handleUsernameComplete = (username: string) => {
    setShowUsernameModal(false);
    console.log("Google signup complete with username:", username);
    // TODO: finalize account + redirect
  };

  return (
    <>
      <AuthLayout
        title="Create your account"
        subtitle="Start securing your files with zero-knowledge encryption"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                @
              </span>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="your_username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value.toLowerCase(),
                  }))
                }
                required
                className="h-12 pl-8 bg-muted/50 border-border focus:border-primary focus:ring-primary"
              />
            </div>
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
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength ? color : "bg-muted"
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

          {/* Confirm Password */}
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
            disabled={isLoading || passwordsMismatch}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating account...
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

          {/* Google */}
          <GoogleButton onClick={handleGoogleClick} />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:text-primary/80 font-medium">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </form>
      </AuthLayout>

      {/* Username modal — only appears after Google OAuth */}
      <UsernameModal isOpen={showUsernameModal} onComplete={handleUsernameComplete} />
    </>
  );
};

export default SignUp;