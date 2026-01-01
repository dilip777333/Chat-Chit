"use client";
import { useState, useEffect } from "react";
import MessageList from "@/components/MessageList";
import MessageBox from "@/components/messageBox";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfileModal from "@/components/ProfileModal";

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowChatList(activeChat === null);
    } else {
      setShowChatList(true);
    }
  }, [activeChat, isMobile]);

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full bg-gray-50">
        {showChatList && (
          <div className={`${isMobile ? 'w-full' : 'w-[300px]'} shrink-0`}>
            <MessageList
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              isMobile={isMobile}
              onCloseChat={() => setShowChatList(false)}
            />
          </div>
        )}
        <div className={`${isMobile && showChatList ? 'hidden' : 'flex-1'}`}>
          <MessageBox
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            isMobile={isMobile}
            onOpenList={() => setShowChatList(true)}
          />
        </div>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </ProtectedRoute>
  );
}
