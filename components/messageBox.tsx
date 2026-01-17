"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Smile, Menu } from "lucide-react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/lib/services/chatService";
import { Chat } from "@/types/chat";

type Message = {
  id?: string | number;
  cid?: string | number;
  sender: string;
  text: string;
  time: string;
  timestamp?: Date;
  isYou?: boolean;
  type?: 'text';
  status?: 'sent' | 'delivered' | 'seen';
  isRead?: boolean;
};

export default function ChatWindow({ 
  activeChat, 
  setActiveChat,
  isMobile,
  onOpenList,
  chats,
  setChats
}: { 
  activeChat: any | null; 
  setActiveChat?: (chat: any | null) => void;
  isMobile?: boolean;
  onOpenList?: () => void;
  chats: Chat[];
  setChats?: (chats: any) => void;
}) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentChat = activeChat && activeChat.other_user ? {
    id: activeChat.id,
    name: activeChat.other_user.first_name ? `${activeChat.other_user.first_name} ${activeChat.other_user.last_name}` : activeChat.other_user.user_name,
    avatar: activeChat.other_user.profile_picture,
    status: 'accepted'
  } : null;

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeChat && currentUser) {
        try {
          const otherUserId = activeChat.other_user?.id || activeChat.id;

          console.log('🔄 Fetching messages for chat:', { currentUserId: currentUser.id, otherUserId });

          chatService.openChat({ userId: currentUser.id as any, otherUserId });

          const history = await chatService.getOldChat(currentUser.id, otherUserId, 100, 0);
          
          console.log('📨 Received chat history:', history);
          
          if (history && history.success && history.messages) {
            const transformedMessages = history.messages
              .reverse()
              .map((msg: any) => ({
                id: msg.id,
                sender: msg.sender_id === currentUser.id ? "You" : currentChat?.name || "Other",
                text: msg.message_text,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: msg.timestamp,
                isYou: msg.sender_id === currentUser.id,
                type: msg.message_type as 'text',
                isRead: msg.is_read,
                status: (msg.is_read ? 'seen' : 'sent') as 'seen' | 'sent'
              }));
            
            console.log('✨ Transformed messages:', transformedMessages);
            setMessages(transformedMessages);
            chatService.markAllRead(currentUser.id as any, otherUserId as any);
          } else {
            console.log('📭 No messages found');
            setMessages([]);
          }
        } catch (error) {
          console.error('❌ Error fetching messages:', error);
          setMessages([]);
        }
      }
    };

    fetchMessages();

    return () => {
      if (activeChat && currentUser?.id) {
        const otherUserId = activeChat.other_user?.id || activeChat.id;
        chatService.closeChat({ userId: currentUser.id as any, otherUserId: otherUserId as any });
      }
    };
  }, [activeChat, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 useEffect(() => {
  const handleMessagesRead = (data: any) => {
    const otherUserId = activeChat?.other_user?.id || activeChat?.id;
    if (String(data.readBy) === String(otherUserId)) {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.isYou ? { ...msg, status: 'seen' as const, isRead: true } : msg
        )
      );
    }
  };

  const handleSingleMessageRead = (data: any) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        (msg.id && String(msg.id) === String(data.messageId)) 
          ? { ...msg, status: 'seen' as const, isRead: true } 
          : msg
      )
    );
  };

  const handleNewMessage = (msg: any) => {
    const otherUserId = activeChat?.other_user?.id || activeChat?.id;
    
    // Only handle if message belongs to this chat
    if (msg.chatId === activeChat?.id || 
        msg.chatId === [String(currentUser?.id), String(otherUserId)].sort().join('_')) {
      
      // If it's from the other user, mark it as read immediately since we have the chat open
      if (String(msg.senderId) !== String(currentUser?.id)) {
        chatService.markAllRead(currentUser?.id as any, otherUserId as any);
      }

      setMessages(prev => {
        // Avoid duplicates
        if (msg.id && prev.some(m => m.id && String(m.id) === String(msg.id))) return prev;
        
        const isMsgRead = String(msg.senderId) === String(currentUser?.id) 
          ? (msg.isRead || msg.is_read || false) 
          : true; // If we receive it and chat is open, it's read

        const newMsg: Message = {
          id: msg.id,
          cid: msg.cid,
          sender: String(msg.senderId) === String(currentUser?.id) ? "You" : currentChat?.name || "Other",
          text: msg.message || msg.message_text || msg.text,
          time: new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(msg.timestamp || msg.createdAt),
          isYou: String(msg.senderId) === String(currentUser?.id),
          type: msg.message_type || msg.messageType || 'text',
          isRead: isMsgRead,
          status: isMsgRead ? 'seen' : 'sent'
        };

        // If it's our own message, try to find and replace the optimistic one
        if (newMsg.isYou) {
          const optimisticIndex = prev.findIndex(m => 
            (m.cid && newMsg.cid && String(m.cid) === String(newMsg.cid)) || 
            (!m.id && !m.cid && m.isYou && m.text === newMsg.text)
          );
          
          if (optimisticIndex !== -1) {
            const newMessages = [...prev];
            // Preserve seen status if it was already updated by a concurrent messages_read event
            if (prev[optimisticIndex].status === 'seen') {
              newMsg.status = 'seen';
              newMsg.isRead = true;
            }
            newMessages[optimisticIndex] = newMsg;
            return newMessages;
          }
        }
        
        return [...prev, newMsg];
      });
    }
  };

  chatService.onMessagesRead(handleMessagesRead);
  chatService.onMessageRead(handleSingleMessageRead);
  chatService.onReceiveMessage(handleNewMessage);
  chatService.onMessageSent(handleNewMessage);

  return () => {
    chatService.offMessagesRead(handleMessagesRead);
    chatService.offMessageRead(handleSingleMessageRead);
    chatService.offReceiveMessage(handleNewMessage);
    chatService.offMessageSent(handleNewMessage);
  };
}, [activeChat, currentUser, currentChat]);

  const handleSendMessage = async () => {
    
    const receiverId = activeChat.other_user?.id || activeChat.id;
    const chatId = activeChat.id || activeChat.chat_id;
    
    const messageText = newMessage.trim();
    const timestamp = new Date();
    
    const tempMessage: Message = {
      sender: "You",
      text: messageText,
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp,
      isYou: true,
      type: 'text',
      status: 'sent'
    };
    setMessages(prev => [...prev, tempMessage]);
    
    setNewMessage("");
    setShowEmojiPicker(false);

    try {
      await chatService.sendMessage({
        senderId: currentUser.id,
        receiverId: receiverId,
        message: messageText,
        messageType: "text",
        chatId: chatId
      });
    } catch (error) {
      setNewMessage(messageText);
      setMessages(prev => prev.filter(m => m !== tempMessage));
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const timeAgo = (timestamp: Date | string | number | undefined): string => {
    if (!timestamp) return '';
    
    const now = new Date();
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

  const getMessageStatus = (msg: Message): string => {
    if (msg.isYou) {
      if (msg.status === 'seen') {
        return `seen ${timeAgo(msg.timestamp)}`;
      } else {
        return `sent ${timeAgo(msg.timestamp)}`;
      }
    }
    return '';
  };

  return (
    <div className="flex-1 h-screen flex flex-col" style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
      {activeChat ? (
        <>
          <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0" style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
            <div className="flex items-center gap-3">
              {isMobile && (
                <button 
                  onClick={onOpenList}
                  className="mr-2 text-gray-300"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-linear-to-b from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                {currentChat?.avatar ? (
                  <img 
                    src={currentChat.avatar}
                    alt={currentChat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentChat?.name.charAt(0)
                )}
              </div>
              <div className="font-semibold text-white">
                {currentChat?.name || "Chat"}
              </div>
            </div>

          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
            <div ref={messagesEndRef} />
            {[...messages].reverse().map((msg, idx) => {
              const isLastMessage = idx === 0;
              return (
              <div
                key={`${msg.time}-${idx}`}
                className={`flex ${msg.isYou ? "justify-end" : "justify-start"} mb-4`}
              >
                <div className="max-w-[80%]">
                  {!msg.isYou && (
                    <div className="text-xs text-gray-400 mb-1">
                      {msg.sender}
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      msg.isYou
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-800 text-gray-100 shadow rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {isLastMessage && msg.isYou && (
                    <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end`}>
                      <span className={msg.status === 'seen' ? 'text-blue-400 font-medium' : 'text-gray-500'}>
                        {getMessageStatus(msg)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-700 sticky bottom-0" style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 z-10">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  width={300} 
                  height={350}
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <button 
                className={`text-gray-400 hover:text-blue-400 p-2 rounded-full hover:bg-gray-800 transition-colors ${showEmojiPicker ? 'bg-blue-900' : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label="Emoji picker"
              >
                <Smile size={20} />
              </button>
              
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                className="flex-1 border border-gray-600 bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              
              <button
                className={`p-2 rounded-full transition-colors ${
                  newMessage.trim()
                    ? 'text-blue-500 hover:text-blue-700' 
                    : 'text-gray-400'
                }`}
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a user to chat
        </div>
      )}
    </div>
  );
}