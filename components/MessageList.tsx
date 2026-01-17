"use client";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/lib/services/chatService";
import { Chat } from "@/types/chat";

const timeAgo = (timestamp: Date | string | number | undefined, now: Date = new Date()): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function MessageList({ 
  activeChat, 
  setActiveChat,
  isMobile,
  onCloseChat,
  chats,
  setChats,
  onAddNewChat,
  onSelectChat
}: { 
  activeChat: { id: string | number } | null; 
  setActiveChat: (id: string) => void;
  isMobile?: boolean;
  onCloseChat?: () => void;
  chats: Chat[];
  setChats: (chats: any) => void;
  onAddNewChat: (chat: Chat) => void;
  onSelectChat: (id: string) => Promise<void>;
}) {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!Array.isArray(chats)) return;
    
    const sortedChats = [...chats].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    
    if (searchTerm) {
      setFilteredChats(
        sortedChats.filter((chat) =>
          chat.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredChats(sortedChats);
    }
  }, [searchTerm, chats]);

  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length >= 2) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(async () => {
        try {
          const users = await chatService.searchUsers(q);
          
          const existingChatIds = new Set(chats.map(c => c.id));
          
          const transformedUsers = users
            .filter((user: any) => user.id !== currentUser?.id && !existingChatIds.has(user.id))
            .map((user: any) => ({
              id: user.id,
              type: "personal",
              name: user.first_name ? `${user.first_name} ${user.last_name}` : user.user_name || `User ${user.id}`,
              message: '',
              time: '',
              avatar: user.profile_picture || "",
              status: "accepted" as const,
            }));
          setSearchResults(transformedUsers);
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, chats, currentUser?.id]);

  const handleChatClick = async (userId: string) => {
    try {
      await onSelectChat(userId);
      setSearchTerm("");
      setSearchResults([]);

      // Mark chat as read when opened
      setChats((prevChats: Chat[]) => 
        prevChats.map(chat => 
          String(chat.id) === String(userId) 
            ? { ...chat, unread: 0, unreadCount: 0, unread_count: 0 }
            : chat
        )
      );

      if (isMobile && onCloseChat) {
        onCloseChat();
      }
    } catch (error: any) {
      alert(error.message || "Failed to start chat. Please try again.");
    }
  };

  // Helper function to get the status text
  const getStatusText = (chat: Chat): string => {
    if (chat.is_last_message_from_me) {
      const time = timeAgo(chat.last_message_time, currentTime);
      if (chat.message_status === 'seen') {
        return `seen ${time}`;
      } else {
        return `sent ${time}`;
      }
    } else {
      return timeAgo(chat.last_message_time, currentTime);
    }
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'w-75'} border-r border-gray-700 h-screen flex flex-col`} style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
      <div className="p-4 border-b border-gray-700 bg-linear-to-r from-purple-600 via-pink-600 to-pink-500">
        <div className="text-lg font-semibold flex justify-between items-center text-white">
          Messages
        </div>
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-600 focus:outline-none bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {searchTerm && (
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="p-3 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-300">Search Results</h3>
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              )}
            </div>
            
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={`search-${user.id}`}
                  className="p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => handleChatClick(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-semibold overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-gray-200">{user.name}</div>
                      <div className="text-xs text-gray-500">Start new chat</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              !isSearching && searchTerm.length >= 2 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">No users found for "{searchTerm}"</p>
                </div>
              )
            )}
          </div>
        )}

        {filteredChats.length > 0 ? (
          <div>
            {searchTerm && <h3 className="p-3 text-sm font-semibold text-gray-300 bg-gray-800">Recent Chats</h3>}
            {filteredChats.map((chat) => {
              const isActive = activeChat && String(activeChat.id) === String(chat.id);
              const statusText = getStatusText(chat);
              const isSeen = chat.is_last_message_from_me && chat.message_status === 'seen';
              const hasUnread = (chat.unread_count || chat.unreadCount || 0) > 0 && !chat.is_last_message_from_me;
              
              return (
                <div
                  key={`chat-${chat.id}`}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer ${
                    isActive ? "bg-gray-800 border-l-2 border-l-blue-500" : ""
                  }`}
                  onClick={() => handleChatClick(chat.id.toString())}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-300">{chat.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="font-medium truncate text-gray-200">{chat.name}</div>
                        <div className="flex flex-col items-end">
                          <div className={`text-xs ${isSeen ? 'text-blue-400 font-medium' : 'text-gray-500'}`}>
                            {statusText}
                          </div>
                          {hasUnread && (chat.unread_count || chat.unreadCount || 0) > 0 && (
                            <div className="mt-1 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {chat.unread_count || chat.unreadCount || 0}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-400 text-xs truncate">
                          {chat.message}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !searchTerm && (
            <div className="p-10 text-center">
              <p className="text-gray-500 text-sm">No chats yet. Search for someone to start chatting!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}