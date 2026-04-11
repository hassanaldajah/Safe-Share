import React, { createContext, useContext, useState, ReactNode } from "react";

// 1. Define the User Profile
export interface UserProfile {
  name: string;
  email: string;
  searchTag: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  privateKey: any | null;
  user: UserProfile | null; // <-- This is what the Top Bar is begging for!
}

interface AuthContextType extends AuthState {
  login: (token: string, privateKey: any, user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // 2. Initialize from localStorage on page load
    const token = localStorage.getItem("token");
    const privateKey = localStorage.getItem("privateKey");
    const userStr = localStorage.getItem("user");
    
    let user = null;
    if (userStr) {
      try { 
        user = JSON.parse(userStr); 
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }

    return {
      isAuthenticated: !!token,
      token,
      privateKey,
      user, // <-- Loads it into state instantly
    };
  });

  const login = (token: string, privateKey: any, user: UserProfile) => {
    localStorage.setItem("token", token);
    if (typeof privateKey === 'string') {
      localStorage.setItem("privateKey", privateKey);
    }
    localStorage.setItem("user", JSON.stringify(user));
    
    setAuthState({
      isAuthenticated: true,
      token,
      privateKey,
      user,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("privateKey");
    localStorage.removeItem("publicKey");
    localStorage.removeItem("user");
    setAuthState({
      isAuthenticated: false,
      token: null,
      privateKey: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};