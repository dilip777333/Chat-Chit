"use client";

import { useState } from "react";
import { request } from "@/lib/services/request";
import endpoints from "@/lib/services/endpoints";
import { chatService } from "@/lib/services/chatService";
import { formatRelativeTime, formatMessageStatus, formatChatListTime } from "@/lib/utils/timeUtils";
import { Phone, Mail, Loader2, MessageCircle, Users, Send, Camera } from "lucide-react";

interface User {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  user_name: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  messageType: "text" | "image" | "video" | "audio";
  chatId: number;
  timestamp: string;
  createdAt: string;
  is_read?: boolean;
}

export default function AuthChatApp() {
  const [step, setStep] = useState<"auth" | "otp" | "chat">("auth");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chatList, setChatList] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // Send OTP
  const handleSendOtp = async () => {
    if (!contact) {
      alert("Please enter email or phone number");
      return;
    }

    setLoading(true);
    try {
      const payload = contactType === "email" ? { email: contact } : { phone: contact };
      const response = await request.post(endpoints.auth.sendOtp, payload);
      
      if (response.success) {
        setStep("otp");
        if (response.otp && process.env.NODE_ENV === 'development') {
          console.log(`Development OTP: ${response.otp}`);
        }
      }
    } catch (error: any) {
      alert(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      alert("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const payload = contactType === "email" ? { email: contact, otp } : { phone: contact, otp };
      const response = await request.post(endpoints.auth.verifyOtp, payload);
      
      if (response.success) {
        setCurrentUser(response.user);
        localStorage.setItem("token", response.token);
        await connectToChat(response.user.id);
        await loadUsers();
        await loadChatList(); // Load Telegram style chat list
        setStep("chat");
      }
    } catch (error: any) {
      alert(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  // Connect to chat
  const connectToChat = async (userId: number) => {
    try {
      await chatService.connect(userId);
      setIsConnected(true);
      
      // Listen for new messages
      chatService.onReceiveMessage((message: Message) => {
        if (selectedUser && (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
          setMessages(prev => [...prev, message]);
        }
      });

      chatService.onMessageDeleted((data) => {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      });
    } catch (error) {
      console.error("Failed to connect to chat:", error);
    }
  };

  // Load users for chat
  const loadUsers = async () => {
    try {
      const response = await request.get(endpoints.chat.getAllUsers);
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      // Fallback to sample users for demo
      const sampleUsers: User[] = [
        { id: 2, name: "Alice Johnson", email: "alice@example.com", user_name: "alice", profile_picture: "" },
        { id: 3, name: "Bob Smith", phone_number: "+1234567890", user_name: "bob", profile_picture: "" },
        { id: 4, name: "Carol Davis", email: "carol@example.com", user_name: "carol", profile_picture: "" },
      ];
      setUsers(sampleUsers);
    }
  };

  // Load chat list (Telegram style)
  const loadChatList = async () => {
    try {
      const response = await request.get(endpoints.chat.getChatList);
      if (response.success) {
        setChatList(response.chatList);
      }
    } catch (error) {
      console.error("Failed to load chat list:", error);
    }
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await chatService.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  // Select user and load chat history
  const selectUser = async (user: User) => {
    setSelectedUser(user);
    if (currentUser) {
      try {
        const response = await request.get(
          endpoints.chat.getChatHistory(currentUser.id, user.id)
        );
        if (response.success) {
          setMessages(response.messages.reverse());
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    try {
      const response = await chatService.sendMessage({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        message: newMessage.trim(),
        messageType: "text"
      });

      if (response.success) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage("");
      }
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    }
  };

  // Render auth form
  if (step === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Chat App</h1>
            <p className="text-gray-600 mt-2">Enter your email or phone to continue</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setContactType("email")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  contactType === "email"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </button>
              <button
                onClick={() => setContactType("phone")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  contactType === "phone"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </button>
            </div>

            <input
              type={contactType === "email" ? "email" : "tel"}
              placeholder={contactType === "email" ? "Enter your email" : "Enter your phone"}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={handleSendOtp}
              disabled={loading || !contact}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render OTP verification
  if (step === "otp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
            <p className="text-gray-600 mt-2">Enter the 6-digit code sent to {contact}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 text-center text-2xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            <button
              onClick={() => setStep("auth")}
              className="w-full text-gray-600 py-2 hover:text-gray-800 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render chat interface
  return (
    <div className="h-screen flex bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Chat App</h2>
              <p className="text-sm text-gray-400">
                {currentUser?.name} • {isConnected ? "🟢 Online" : "🔴 Offline"}
              </p>
            </div>
            <button
              onClick={() => {
                chatService.disconnect();
                localStorage.removeItem("token");
                setStep("auth");
                setCurrentUser(null);
              }}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-white placeholder-gray-400"
            />
            {isSearching && (
              <div className="text-xs text-gray-500 mt-1">Searching...</div>
            )}
          </div>

          {/* Show search results or chat list */}
          {searchQuery.length >= 2 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Search Results</h3>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      selectUser(user);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedUser?.id === user.id
                        ? "bg-gray-700 border border-gray-600"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-600 rounded-full mr-3 flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-400">@{user.user_name}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && !isSearching && (
                  <p className="text-sm text-gray-500 text-center py-2">No users found</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Chats</h3>
              <div className="space-y-2">
                {chatList.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => selectUser(chat)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedUser?.id === chat.id
                        ? "bg-gray-700 border border-gray-600"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-600 rounded-full mr-3 flex items-center justify-center relative overflow-hidden">
                        {chat.profile_picture ? (
                          <img
                            src={chat.profile_picture}
                            alt={chat.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-gray-400" />
                        )}
                        {chat.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-white truncate">
                            {chat.first_name} {chat.last_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatChatListTime(chat.last_message_time)}
                            </span>
                            <Camera className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400 truncate">
                            {chat.is_last_message_from_me ? "You: " : ""}
                            {chat.last_message || "Start a conversation"}
                          </p>
                          {chat.unread_count > 0 && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {chat.is_last_message_from_me && chat.last_message && (
                            <span>
                              {formatMessageStatus(
                                true,
                                chat.unread_count === 0,
                                chat.last_message_time
                              )}
                            </span>
                          )}
                          {!chat.is_last_message_from_me && chat.unread_count > 0 && (
                            <span className="text-blue-400">New message</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {chatList.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No chats yet. Search for users above!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-600 rounded-full mr-3 flex items-center justify-center overflow-hidden">
                  {selectedUser.profile_picture ? (
                    <img
                      src={selectedUser.profile_picture}
                      alt={selectedUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{selectedUser.name}</p>
                  <p className="text-sm text-gray-400">@{selectedUser.user_name}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.senderId === currentUser?.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <p>{message.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.senderId === currentUser?.id ? "text-blue-200" : "text-gray-400"
                      }`}>
                        {formatRelativeTime(message.timestamp)}
                      </p>
                      {message.senderId === currentUser?.id && (
                        <p className="text-xs text-blue-200 ml-2">
                          {formatMessageStatus(
                            true,
                            message.is_read || false,
                            message.timestamp
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Select a user to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
