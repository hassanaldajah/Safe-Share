// src/lib/api.ts
import { useNavigate } from 'react-router-dom';

// A helper function to handle API calls with automatic token injection and error handling
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  // Automatically attach the Bearer token to headers
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Ensure Content-Type is application/json unless it's FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });

  // --- THE SAFETY NET: Catch Expired Tokens Globally ---
  if (response.status === 401 || response.status === 403) {
    // 1. Clear the stale data
    localStorage.removeItem("token");
    localStorage.removeItem("privateKey");
    localStorage.removeItem("publicKey");
    localStorage.removeItem("user");

    // 2. We can't use `useNavigate` outside of a React component easily, 
    // so we force a hard reload to the sign-in page.
    window.location.href = "/signin?expired=true"; 
    
    throw new Error("Session expired. Please log in again.");
  }

  return response;
};