"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "./ProtectedRoute";
import MessageList from "./MessageList";
import ProfileModal from "./ProfileModal";
import ChatWindow from "./messageBox";
import Sidebar from "./Siderbord";
import { chatService } from "@/lib/services/chatService";
import { Chat } from "@/types/chat";

export default function AuthChatApp() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);

  const handleSelectChat = async (userId: string) => {
    try {
      console.log(' User selected for chat:', userId);
      
      if (!currentUser?.id) {
        alert("Authentication error. Please login again.");
        return;
      }

      setSelectedChat(userId);
      
      console.log('🔗 Accessing chat for user:', userId);
      const chat = await chatService.accessChat(userId);
      console.log('💬 Chat access response:', chat);
      
      setActiveChat(chat);

      const otherUserId = chat.other_user?.id || userId;

      console.log('🔌 Opening chat socket:', { userId: currentUser.id, otherUserId });
      chatService.openChat({ userId: currentUser.id as any, otherUserId: otherUserId as any });

      setChats(prevChats =>
        prevChats.map(c =>
          String(c.id) === String(otherUserId)
            ? { ...c, unread: false, unread_count: 0 }
            : c
        )
      );

      if (!chats.some(c => String(c.id) === String(otherUserId))) {
        const newChat: Chat = {
          id: otherUserId,
          type: "personal",
          name: chat.other_user.first_name ? `${chat.other_user.first_name} ${chat.other_user.last_name}` : chat.other_user.user_name || `User ${otherUserId}`,
          message: "",
          time: "",
          avatar: chat.other_user.profile_picture || "",
          status: "accepted" as const,
          timestamp: Date.now(),
          unread: false,
          unread_count: 0,
        };
        setChats(prevChats => [newChat, ...prevChats]);
      }
    } catch (error: any) {
      console.error('❌ Error in handleSelectChat:', error);
      alert(error.message || "Failed to start chat. Please try again.");
    }
  };

  const handleCloseChat = () => {
    if (activeChat && currentUser?.id) {
      const otherUserId = activeChat.other_user?.id || activeChat.id;
      chatService.closeChat({ userId: currentUser.id as any, otherUserId: otherUserId as any });
    }
    setActiveChat(null);
    setSelectedChat(null);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchChatList = async () => {
      if (currentUser?.id) {
        await chatService.connect(currentUser.id as any);
        
        const chattedUsers = await chatService.getChattedUsers(currentUser.id as any);
        
        if (Array.isArray(chattedUsers) && chattedUsers.length > 0) {
          const transformedChats: Chat[] = chattedUsers.map((chatUser: any) => ({
            id: chatUser.id,
            type: "personal",
            name: chatUser.first_name ? `${chatUser.first_name} ${chatUser.last_name}` : chatUser.user_name || `User ${chatUser.id}`,
            message: chatUser.is_last_message_from_me ? `You: ${chatUser.last_message}` : chatUser.last_message,
            time: new Date(chatUser.last_message_time || chatUser.last_message_created_at).toLocaleTimeString(),
            avatar: chatUser.profile_picture || "",
            status: "accepted" as const,
            timestamp: new Date(chatUser.last_message_time || chatUser.last_message_created_at).getTime(),
            last_message_time: chatUser.last_message_time || chatUser.last_message_created_at,
            unread: chatUser.unread_count > 0,
            unread_count: chatUser.unread_count,
            is_last_message_from_me: chatUser.is_last_message_from_me,
            message_status: chatUser.message_status
          }));
          setChats(transformedChats);
        } else {
          setChats([]);
        }
      }
    };
    
    fetchChatList();
    
    return () => {
      chatService.disconnect();
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const handleNewMessage = (msg: any) => {
      const currentUserIdStr = String(currentUser.id);
      const senderIdStr = String(msg.senderId);
      const receiverIdStr = String(msg.receiverId);
      
      const otherUserId = senderIdStr === currentUserIdStr ? receiverIdStr : senderIdStr;
      
      setChats(prevChats => {
        const updatedExistingIndex = prevChats.findIndex(c => String(c.id) === String(otherUserId));
        
        const updatedChat: Chat = updatedExistingIndex > -1 
          ? { ...prevChats[updatedExistingIndex] }
          : {
              id: otherUserId,
              type: "personal",
              name: msg.senderName || `User ${otherUserId}`,
              avatar: msg.senderAvatar || "",
              status: "accepted",
              unread_count: 0
            } as Chat;

        updatedChat.message = senderIdStr === currentUserIdStr ? `You: ${msg.message}` : msg.message;
        updatedChat.time = new Date(msg.timestamp).toLocaleTimeString();
        updatedChat.timestamp = new Date(msg.timestamp).getTime();
        updatedChat.last_message_time = msg.timestamp;
        updatedChat.is_last_message_from_me = senderIdStr === currentUserIdStr;
        
        if (senderIdStr === currentUserIdStr) {
          updatedChat.message_status = msg.isRead || msg.is_read ? 'seen' : 'sent';
        } else {
          updatedChat.message_status = 'received';
        }
        
        // Use a ref-like approach to get current activeChat if possible, but for now we use the one from closure
        // Note: activeChat might be stale here if we don't include it in dependencies
        const isActiveChat = activeChat && String(activeChat.other_user?.id || activeChat.id) === String(otherUserId);

        if (senderIdStr !== currentUserIdStr && !isActiveChat) {
          updatedChat.unread = true;
          updatedChat.unread_count = (updatedChat.unread_count || 0) + 1;
        } else if (senderIdStr !== currentUserIdStr && isActiveChat) {
          chatService.markAllRead(currentUserIdStr, otherUserId);
          updatedChat.unread = false;
          updatedChat.unread_count = 0;
        }

        const newChats = [...prevChats];
        if (updatedExistingIndex > -1) {
          newChats.splice(updatedExistingIndex, 1);
        }
        return [updatedChat, ...newChats];
      });
    };

    const handleMessagesRead = (data: any) => {
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat.is_last_message_from_me && String(chat.id) === String(data.readBy)) {
            return { 
              ...chat, 
              message_status: 'seen',
              last_message_time: chat.last_message_time || new Date().toISOString()
            };
          }
          return chat;
        })
      );
    };

    const handleSingleMessageRead = (data: any) => {
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.is_last_message_from_me && String(chat.id) === String(data.readBy)) {
            return { ...chat, message_status: 'seen' };
          }
          return chat;
        })
      );
    };

    chatService.onReceiveMessage(handleNewMessage);
    chatService.onMessageSent(handleNewMessage);
    chatService.onMessagesRead(handleMessagesRead);
    chatService.onMessageRead(handleSingleMessageRead);

    return () => {
      chatService.offReceiveMessage(handleNewMessage);
      chatService.offMessageSent(handleNewMessage);
      chatService.offMessagesRead(handleMessagesRead);
      chatService.offMessageRead(handleSingleMessageRead);
    };
  }, [currentUser?.id, activeChat?.id, activeChat?.other_user?.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={handleSelectChat}
          currentUser={currentUser}
          onLogout={() => {
            // Handle logout logic here
          }}
          onProfileClick={() => setShowProfile(true)}
        />
        <MessageList
          activeChat={activeChat}
          setActiveChat={handleSelectChat}
          isMobile={isMobile}
          onCloseChat={handleCloseChat}
          chats={chats}
          setChats={setChats}
          onAddNewChat={(chat) => setChats(prev => [chat, ...prev])}
          onSelectChat={handleSelectChat}
        />
        {(!isMobile || activeChat) && (
          <div className={`${isMobile ? 'fixed inset-0 z-50' : 'flex-1'} bg-white`}>
            <ChatWindow
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              isMobile={isMobile}
              onOpenList={handleCloseChat}
              chats={chats}
              setChats={setChats}
            />
          </div>
        )}
        {showProfile && (
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}