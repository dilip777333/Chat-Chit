"use client";

import {
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar({ onProfileClick }: { onProfileClick: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const { isAuthenticated, currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="h-screen w-16 bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500 shadow-md flex flex-col items-center py-4 border-r border-gray-200">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-2 rounded-xl">
        <MessageSquare className="text-white w-6 h-6" />
      </div>
      
      {/* Profile Section - Only show when authenticated */}
      {isAuthenticated && (
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30 overflow-hidden"
          >
            {currentUser?.profile_picture ? (
              <img
                src={currentUser.profile_picture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="text-white w-5 h-5" />
            )}
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/30"
            title="Logout"
          >
            <LogOut className="text-white w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
}


