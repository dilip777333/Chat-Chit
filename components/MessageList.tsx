"use client";
import { Search, UserPlus, X, Phone, PhoneMissed, PhoneOutgoing } from "lucide-react";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/lib/services/chatService";

type CallHistory = {
  id: number;
  contactId: number;
  name: string;
  type: "incoming" | "outgoing" | "missed";
  time: string;
  duration: string;
};

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

const initialCallHistory: CallHistory[] = [
  { id: 1, contactId: 1, name: "Running Club Member", type: "outgoing", time: "Today, 11:42 AM", duration: "5:32" },
  { id: 2, contactId: 2, name: "Andre Silva", type: "incoming", time: "Today, 12:11 AM", duration: "2:15" },
  { id: 3, contactId: 3, name: "Work Team Member", type: "missed", time: "Yesterday", duration: "" },
  { id: 4, contactId: 4, name: "Maria Garcia", type: "outgoing", time: "Yesterday", duration: "7:45" },
];

export default function ChatListPanel({ 
  activeChat, 
  setActiveChat,
  isMobile,
  onCloseChat,
  chats,
  setChats,
  onAddNewChat,
  onSelectChat
}: { 
  activeChat: { id: number } | null; 
  setActiveChat: (id: number) => void;
  isMobile?: boolean;
  onCloseChat?: () => void;
  chats: Chat[];
  setChats: Dispatch<SetStateAction<Chat[]>>;
  onAddNewChat: (chat: Chat) => void;
  onSelectChat: (id: number) => Promise<void>;
}) {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [requests, setRequests] = useState<Chat[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistory[]>(initialCallHistory);
  const [showRequests, setShowRequests] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!Array.isArray(chats)) return;
    const sortedChats = [...chats].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
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
      const delayDebounceFn = setTimeout(() => {
        const fetchUsers = async () => {
          try {
            const users = await chatService.searchUsers(q);
            
            // Filter out users that are already in our chat list
            const existingChatIds = new Set(chats.map(c => c.id));
            
            const transformedUsers = users
              .filter((user: any) => !existingChatIds.has(user.id))
              .map((user: any) => ({
                id: user.id,
                type: "personal",
                name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.user_name,
                message: ``,
                time: '',
                avatar: user.profile_picture || "",
                status: "accepted" as const,
              }));
            setSearchResults(transformedUsers);
          } catch (error) {
            console.error('Error searching users:', error);
          } finally {
            setIsSearching(false);
          }
        };
        fetchUsers();
      }, 500);

      return () => {
        clearTimeout(delayDebounceFn);
        // We don't want to set isSearching false here because the next effect will set it true
      };
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, chats]);

  const handleAccept = (requestId: number) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      const newChat = { 
        ...request, 
        unread: true, 
        status: "accepted" as const,
        timestamp: Date.now()
      };
      setChats((prev: Chat[]) => [...prev, newChat]);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSelectedRequest(null);
      setActiveChat(requestId);
    }
  };

  const handleDeny = (requestId: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setSelectedRequest(null);
    if (activeChat?.id === requestId) {
      if (onCloseChat) onCloseChat();
    }
  };

  const handleRequestClick = (requestId: number) => {
    setSelectedRequest(requestId);
    // This component should not set the active chat directly for requests.
    // It should be handled by the parent component or another mechanism.
    // For now, we just select it visually.
    // setActiveChat(requestId);
  };

  const handleChatClick = (id: number) => {
    onSelectChat(id);
    setSearchTerm("");
    setSearchResults([]);

    if (isMobile && onCloseChat) {
      onCloseChat();
    }
  };

  const oldHandleChatClick = (id: number) => {
    const chatExists = Array.isArray(chats) && chats.some(chat => chat.id === id);

    if (chatExists) {
      setActiveChat(id);
      setChats((prevChats: Chat[]) =>
        prevChats.map((chat: Chat) =>
          chat.id === id ? { ...chat, unread: false } : chat
        )
      );
    } else {
      const userFromSearch = searchResults.find(user => user.id === id);
      if (userFromSearch) {
        const newChat: Chat = {
          ...userFromSearch,
          timestamp: Date.now(),
        };
        onAddNewChat(newChat);
      }
    }

    setSearchTerm("");
    setSearchResults([]);

    if (isMobile && onCloseChat) {
      onCloseChat();
    }
  };

  const unreadCount = Array.isArray(chats) ? chats.filter((chat) => chat.unread).length : 0;

  if (loading) {
    return (
      <div className={`${isMobile ? 'w-full' : 'w-75'} border-r border-gray-200 h-screen bg-white flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="text-lg font-semibold">Messages</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading chats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'w-full' : 'w-75'} border-r border-gray-700 h-screen flex flex-col`} style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
      <style jsx>{`
        .thin-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4a5568;
          border-radius: 2px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background-color: #1a202c;
        }
      `}</style>

      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500">
        <div className="text-lg font-semibold flex justify-between items-center text-white">
          Messages
          
        </div>
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-600 focus:outline-none bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500 w-4 h-4" />
        </div>
      </div>

      {showCallHistory && (
        <div className="p-4 border-b border-gray-700 bg-gray-900 shadow-md z-10 h-screen overflow-y-auto thin-scrollbar">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Call History</h3>
            <button onClick={() => setShowCallHistory(false)} className="p-1 hover:bg-gray-800 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {callHistory.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No call history.</div>
          ) : (
            <div className="space-y-3">
              {callHistory.map((call) => (
                <div
                  key={call.id}
                  className="p-2 rounded-lg border border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                      {call.type === "incoming" ? (
                        <Phone className="w-4 h-4 text-green-500" />
                      ) : call.type === "outgoing" ? (
                        <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                      ) : (
                        <PhoneMissed className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-800">{call.name}</p>
                        <p className="text-xs text-gray-500">{call.time}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {call.type === "incoming" ? "Incoming" : call.type === "outgoing" ? "Outgoing" : "Missed"}
                        </p>
                        {call.duration && (
                          <p className="text-xs text-gray-500">{call.duration}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRequests && (
        <div className="p-4 border border-gray-700 bg-gray-900 shadow-md z-10 h-screen overflow-y-auto thin-scrollbar">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Connection Requests</h3>
            <button onClick={() => setShowRequests(false)} className="p-1 hover:bg-gray-800 rounded-full">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {requests.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No new requests.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className={`p-3 rounded-lg border border-gray-700 hover:shadow-sm transition-all ${
                    selectedRequest === req.id ? "bg-blue-900" : ""
                  }`}
                  onClick={() => handleRequestClick(req.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-gray-300">
                      {req.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{req.name}</p>
                      <p className="text-xs text-gray-500 truncate">{req.message}</p>
                    </div>
                    <div className="flex gap-2">
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showRequests && !showCallHistory && (
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {searchTerm && (
            <div className="bg-gray-800 border-b border-gray-700">
              <div className="p-3 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-300">Global Search</h3>
                {isSearching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </div>
              
              {searchResults.length > 0 ? (
                searchResults.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors`}
                    onClick={() => handleChatClick(chat.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-semibold overflow-hidden">
                        {chat.avatar ? (
                          <img
                            src={chat.avatar}
                            alt={chat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">{chat.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-gray-200">{chat.name}</div>
                        <div className="text-xs text-gray-500">New Chat</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                !isSearching && searchTerm.length >= 2 && filteredChats.length === 0 && (
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
                const isActive = activeChat && (
                  (typeof activeChat === 'number' && activeChat === chat.id) ||
                  (activeChat.id === chat.id) ||
                  (activeChat.other_user && activeChat.other_user.id === chat.id)
                );
                
                return (
                  <div
                    key={chat.id}
                    className={`p-3 border-b border-gray-700 hover:bg-gray-800 cursor-pointer ${
                      isActive ? "bg-gray-800 border-l-2 border-l-blue-500" : ""
                    }`}
                    onClick={() => handleChatClick(chat.id)}
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
                          <div className="text-xs text-gray-500">{chat.time}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-gray-400 text-xs truncate">
                            {chat.message}
                          </div>
                          {chat.unread && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
                          )}
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
      )}
    </div>
  );
}