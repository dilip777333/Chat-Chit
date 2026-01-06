"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const storedToken = localStorage.getItem("token");
    const userData = localStorage.getItem("currentUser");
    
    if (storedToken && userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
    setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateUser = (user: User) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      currentUser, 
      token,
      isLoading, 
      login, 
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
