"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedRoute from "./ProtectedRoute";
import MessageList from "./MessageList";
import ProfileDetails from "./ProfileDetails";
import ProfileModal from "./ProfileModal";
import ChatWindow from "./messageBox";
import Siderbard from "./Siderbard";
import { chatService } from "@/lib/services/chatService";

// Define the Chat type in the parent component
type Chat = {
  id: number;
  type: string;
  name: string;
  message: string;
  time: string;
  unread?: boolean;
  avatar: string;
  status: "request" | "accepted" | "denied";
  timestamp?: number;
  unread_count?: number;
  is_last_message_from_me?: boolean;
  message_status?: 'sent' | 'seen' | 'received';
};

export default function AuthChatApp() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const router = useRouter();
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newlyCreatedChat, setNewlyCreatedChat] = useState<Chat | null>(null);

    const handleSelectChat = async (userId: number) => {
    try {
      console.log("🔵 Selecting chat with user:", userId);
      const chat = await chatService.accessChat(userId);
      console.log("✅ Chat object received:", chat);
      setActiveChat(chat);

      // Use the other user's ID for the chat list for consistency with getChatList
      const otherUserId = chat.other_user.id;

      // Clear unread status for this chat when opening it
      setChats(prevChats =>
        prevChats.map(c =>
          c.id === otherUserId
            ? { ...c, unread: false, unread_count: 0 }
            : c
        )
      );

      // Add to chat list if it's not already there
      if (!chats.some(c => c.id === otherUserId)) {
        const newChat: Chat = {
          id: otherUserId,
          type: "personal",
          name: chat.other_user.first_name && chat.other_user.last_name 
            ? `${chat.other_user.first_name} ${chat.other_user.last_name}`
            : chat.other_user.user_name || `User ${otherUserId}`,
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
    } catch (error) {
      console.error('❌ Error accessing chat:', error);
    }
  };

  const handleAddNewChat = (newChat: Chat) => {
    if (!chats.some(chat => chat.id === newChat.id)) {
      setNewlyCreatedChat(newChat);
      setChats(prevChats => [newChat, ...prevChats]);
    }
    setActiveChat(newChat.id);
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
        try {
          // Connect to socket and wait for connection
          await chatService.connect(currentUser.id);
          console.log("✓ Socket connected successfully");
          
          // Use the new getChattedUsers API instead of getChatList
          console.log("📞 Calling getChattedUsers with userId:", currentUser.id);
          const chattedUsers = await chatService.getChattedUsers(currentUser.id);
          console.log("📥 getChattedUsers response:", chattedUsers);
          
          if (Array.isArray(chattedUsers) && chattedUsers.length > 0) {
            console.log("✅ Found", chattedUsers.length, "chatted users");
            const transformedChats: Chat[] = chattedUsers.map((chatUser: any) => ({
              id: chatUser.id,
              type: "personal",
              name: chatUser.first_name && chatUser.last_name 
                ? `${chatUser.first_name} ${chatUser.last_name}`
                : chatUser.user_name || `User ${chatUser.id}`,
              message: chatUser.is_last_message_from_me 
                ? `You: ${chatUser.last_message}`
                : chatUser.last_message,
              time: new Date(chatUser.last_message_time || chatUser.last_message_created_at).toLocaleTimeString(),
              unread: chatUser.unread_count > 0,
              avatar: chatUser.profile_picture || "",
              status: "accepted" as const,
              timestamp: new Date(chatUser.last_message_time || chatUser.last_message_created_at).getTime(),
              unread_count: chatUser.unread_count,
              is_last_message_from_me: chatUser.is_last_message_from_me,
              message_status: chatUser.message_status
            }));
            console.log("✅ Transformed chats:", transformedChats);
            setChats(transformedChats);
          } else {
            console.log("⚠️ No chatted users found or response is not an array");
            setChats([]);
          }
        } catch (error) {
          console.error('❌ Error connecting or fetching chatted users:', error);
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
      setChats(prevChats => {
        const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        const existingChatIndex = prevChats.findIndex(c => c.id === otherUserId);
        
        const updatedChat: Chat = existingChatIndex > -1 
          ? { ...prevChats[existingChatIndex] }
          : {
              id: otherUserId,
              type: "personal",
              name: `User ${otherUserId}`, // Fallback if name not known
              avatar: "",
              status: "accepted",
              unread_count: 0
            } as Chat;

        updatedChat.message = msg.senderId === currentUser.id ? `You: ${msg.message}` : msg.message;
        updatedChat.time = new Date(msg.timestamp).toLocaleTimeString();
        updatedChat.timestamp = new Date(msg.timestamp).getTime();
        
        if (msg.senderId !== currentUser.id && activeChat?.other_user?.id !== otherUserId) {
          updatedChat.unread = true;
          updatedChat.unread_count = (updatedChat.unread_count || 0) + 1;
        }

        let newChats = [...prevChats];
        if (existingChatIndex > -1) {
          newChats.splice(existingChatIndex, 1);
        }
        return [updatedChat, ...newChats];
      });
    };

    chatService.onReceiveMessage(handleNewMessage);
    chatService.onMessageSent(handleNewMessage);

    // Listen for messages being marked as read
    const handleMessagesRead = (data: any) => {
      if (activeChat && activeChat.other_user) {
        const otherUserId = activeChat.other_user.id;
        setChats(prevChats =>
          prevChats.map(c =>
            c.id === otherUserId
              ? { ...c, unread: false, unread_count: 0 }
              : c
          )
        );
      }
    };

    chatService.onMessagesRead?.(handleMessagesRead);

    return () => {
      // Cleanup if needed
    };
  }, [currentUser?.id, activeChat]);

  useEffect(() => {
    // Clean up newly created chat once it's in the main chats list
    if (newlyCreatedChat && chats.some(chat => chat.id === newlyCreatedChat.id)) {
      setNewlyCreatedChat(null);
    }
  }, [chats, newlyCreatedChat]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Siderbard 
          onProfileClick={() => setShowProfile(true)}
        />
                <MessageList
          activeChat={activeChat}
          setActiveChat={handleSelectChat}
          isMobile={isMobile}
          onCloseChat={() => setActiveChat(null)}
          chats={chats}
          setChats={setChats}
          onAddNewChat={handleAddNewChat}
          onSelectChat={handleSelectChat}
        />
                {activeChat && activeChat.id && (
          <div className={`${isMobile ? 'fixed inset-0 z-50' : 'flex-1'} bg-white`}>
                        <ChatWindow
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              isMobile={isMobile}
              onOpenList={() => setActiveChat(null)}
              chats={chats}
              newlyCreatedChat={newlyCreatedChat}
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
