"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import AuthChatApp from "./AuthChatApp";

export default function App() {
  return (
    <AuthProvider>
      <AuthChatApp />
    </AuthProvider>
  );
}
