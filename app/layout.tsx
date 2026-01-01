"use client";

import "./globals.css";
import Sidebar from "@/components/Siderbard";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";
import ProfileModal from "@/components/ProfileModal";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <html lang="en">
      <body className="flex">
        <Sidebar onProfileClick={() => setShowProfile(true)} />
        <main className="flex-1 bg-gray-50">{children}</main>
        <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      </body>
    </html>
  );
}
