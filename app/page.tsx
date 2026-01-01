"use client";
import { useState, useEffect } from "react";
import MessageList from "@/components/MessageList";
import MessageBox from "@/components/messageBox";

export default function Home() {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

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
  );
}
