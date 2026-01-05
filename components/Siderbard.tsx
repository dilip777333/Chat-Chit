"use client";

import {
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar({ onProfileClick }: { onProfileClick: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <aside className="h-screen w-16 bg-linear-to-b from-purple-500 via-pink-500 to-blue-500 shadow-md flex flex-col items-center py-4 border-r border-gray-200">
      <div className="bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 p-2 rounded-xl">
        <MessageSquare className="text-white w-6 h-6" />
      </div>
      
      {/* Profile Section - Only show when authenticated */}
      {isAuthenticated && (
        <div className="mt-8">
          <button
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
          >
            <User className="text-white w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
}


