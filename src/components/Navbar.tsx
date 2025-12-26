import { Shield, Menu, X, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type AuthView = "login" | "signup" | "forgot-password" | "reset-success";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Only apply scroll hide/show on landing page
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    if (!isLandingPage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } 
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isLandingPage]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!showAuthDialog) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setAgreeToTerms(false);
      setRememberMe(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setAuthView("login");
    }
  }, [showAuthDialog]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  // Google OAuth Login Handler
  const handleGoogleAuth = () => {
    setIsLoading(true);
    
    // Simulate Google OAuth
    setTimeout(() => {
      const mockUser = {
        id: "google_" + Math.random().toString(36).substr(2, 9),
        name: "Google User",
        email: "user@gmail.com",
        provider: "google",
        profilePicture: "https://via.placeholder.com/150"
      };
      
      localStorage.setItem("auth_token", "google_oauth_token_" + Date.now());
      localStorage.setItem("user", JSON.stringify(mockUser));
      
      setIsLoading(false);
      setShowAuthDialog(false);
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in with Google.",
      });
      
      navigate("/dashboard");
    }, 1500);
  };

  // Email/Password Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePassword(password)) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Error",
        description: "Please agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newUser = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        name: fullName,
        email: email,
        provider: "email",
      };

      localStorage.setItem("auth_token", "email_token_" + Date.now());
      localStorage.setItem("user", JSON.stringify(newUser));
      
      setIsLoading(false);
      setShowAuthDialog(false);
      
      toast({
        title: "Account created!",
        description: "Welcome to SafeShare. Your account has been created successfully.",
      });
      
      navigate("/dashboard");
    }, 1500);
  };

  // Email/Password Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Check if user exists (in real app, this would be server-side)
      const mockUser = {
        id: "user_123",
        name: "John Doe",
        email: email,
        provider: "email",
      };

      localStorage.setItem("auth_token", "email_token_" + Date.now());
      localStorage.setItem("user", JSON.stringify(mockUser));
      
      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      }
      
      setIsLoading(false);
      setShowAuthDialog(false);
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      
      navigate("/dashboard");
    }, 1500);
  };

  // Forgot Password
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate sending reset email
    setTimeout(() => {
      setIsLoading(false);
      setAuthView("reset-success");
      
      toast({
        title: "Check your email",
        description: "Password reset instructions have been sent to your email.",
      });
    }, 1500);
  };

  const openAuthDialog = (view: AuthView) => {
    setAuthView(view);
    setShowAuthDialog(true);
    setIsOpen(false);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 glass transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">SafeShare</span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link 
                to="/dashboard" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Go To Dashboard
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => openAuthDialog("login")}
              >
                Login
              </Button>
              <Button 
                size="sm"
                onClick={() => openAuthDialog("signup")}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How it Works
                </a>
                <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Testimonials
                </a>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
                <Link 
                  to="/dashboard" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Go To Dashboard
                </Link>
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openAuthDialog("login")}
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openAuthDialog("signup")}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          {/* LOGIN VIEW */}
          {authView === "login" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">Welcome Back</DialogTitle>
                <DialogDescription className="text-center">
                  Sign in to your SafeShare account
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 py-4">
                {/* Google Sign In Button */}
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full h-11 text-sm font-medium gap-3"
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email/Password Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthView("forgot-password")}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setAuthView("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          )}

          {/* SIGNUP VIEW */}
          {authView === "signup" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">Create Account</DialogTitle>
                <DialogDescription className="text-center">
                  Get started with SafeShare today
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 py-4">
                {/* Google Sign Up Button */}
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full h-11 text-sm font-medium gap-3"
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign up with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or sign up with email
                    </span>
                  </div>
                </div>

                {/* Email/Password Signup Form */}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I agree to the{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthView("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {authView === "forgot-password" && (
            <>
              <DialogHeader>
                <button
                  onClick={() => setAuthView("login")}
                  className="absolute left-6 top-6 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <DialogTitle className="text-center text-2xl">Reset Password</DialogTitle>
                <DialogDescription className="text-center">
                  Enter your email and we'll send you a reset link
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 py-4">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>

                <p className="text-xs text-center text-muted-foreground">
                  Remember your password?{" "}
                  <button
                    onClick={() => setAuthView("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}

          {/* RESET SUCCESS VIEW */}
          {authView === "reset-success" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-2xl">Check Your Email</DialogTitle>
                <DialogDescription className="text-center">
                  We've sent password reset instructions to your email
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col gap-4 py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to
                  </p>
                  <p className="text-sm font-medium text-foreground">{email}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setAuthView("forgot-password")}
                    className="text-primary hover:underline font-medium"
                  >
                    try again
                  </button>
                </p>

                <Button
                  onClick={() => setAuthView("login")}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Back to Sign In
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;