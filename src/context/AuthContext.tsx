import React, { createContext, useContext, useState, ReactNode } from "react";

// Define what our authentication state looks like
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  privateKey: CryptoKey | null; // This is the crucial E2EE key!
}

interface AuthContextType extends AuthState {
  login: (token: string, privateKey: CryptoKey) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    privateKey: null,
  });

  const login = (token: string, privateKey: CryptoKey) => {
    // Save the token to session storage so they stay logged in upon refresh
    // Note: The privateKey will be lost on refresh for security, requiring them to unlock it again
    sessionStorage.setItem("jwt", token);
    
    setAuthState({
      isAuthenticated: true,
      token,
      privateKey,
    });
  };

  const logout = () => {
    sessionStorage.removeItem("jwt");
    setAuthState({
      isAuthenticated: false,
      token: null,
      privateKey: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// A custom hook to make using this context super easy in your components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};