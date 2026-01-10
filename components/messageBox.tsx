"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, Phone, Video, Mic, MapPin, FileText, Menu } from "lucide-react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
// import CallScreen from "@/components/callmodel/page";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/lib/services/chatService";

type Message = {
  id?: number;
  sender: string;
  text: string;
  time: string;
  isYou?: boolean;
  type?: 'text' | 'image' | 'document' | 'location' | 'audio';
  content?: string;
  status?: 'sent' | 'delivered' | 'read'; // WhatsApp-style status
  isRead?: boolean;
};

type Chat = {
  id: number;
  name: string;
  status: 'request' | 'accepted' | 'denied';
  avatar?: string;
};

export default function ChatWindow({ 
  activeChat, 
  setActiveChat,
  isMobile,
  onOpenList,
  chats,
  newlyCreatedChat
}: { 
  activeChat: any | null; 
  setActiveChat?: (chat: any | null) => void;
  isMobile?: boolean;
  onOpenList?: () => void;
  chats: Chat[];
  newlyCreatedChat?: Chat | null;
}) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [acceptedChats, setAcceptedChats] = useState<number[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSendingRecording, setIsSendingRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentChat = activeChat && activeChat.other_user ? {
    id: activeChat.id,
    name: activeChat.other_user.first_name ? `${activeChat.other_user.first_name} ${activeChat.other_user.last_name}` : activeChat.other_user.user_name,
    avatar: activeChat.other_user.profile_picture,
    status: 'accepted'
  } : null;
  const isRequest = currentChat?.status === 'request' && !acceptedChats.includes(activeChat!);

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeChat && currentUser) {
        try {
          // Get the other user's ID
          const otherUserId = activeChat.other_user?.id || activeChat.receiverId || activeChat.id;
          
          if (!otherUserId) {
            setMessages([]);
            return;
          }

          console.log("Fetching old chat between userId:", currentUser.id, "and", otherUserId);
          
          // Use getOldChat API - NEW API for fetching messages
          const history = await chatService.getOldChat(currentUser.id, otherUserId, 100, 0);
          
          if (history && history.messages) {
            const transformedMessages = history.messages
              .map((msg: any) => ({
                id: msg.id,
                sender: msg.sender_id === currentUser.id ? "You" : currentChat?.name || "Other",
                text: msg.message_text,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isYou: msg.sender_id === currentUser.id,
                type: msg.message_type as 'text' | 'image' | 'document' | 'location' | 'audio',
                isRead: msg.is_read,
                status: msg.is_read ? 'read' : 'delivered' // Default status based on is_read
              }));
            console.log("✅ Old messages fetched:", transformedMessages.length);
            setMessages(transformedMessages);
            
            // Mark all unread messages from other user as read
            if (chatService.isConnected()) {
              console.log("📬 Marking all messages as read...");
              chatService.markAllRead(currentUser.id, otherUserId);
            }
          } else {
            setMessages([]);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
          // Fallback to getChatHistory API if getOldChat fails
          try {
            const fallbackHistory = await chatService.getChatHistory(currentUser.id, activeChat.other_user?.id || activeChat.id, 100, 0);
            if (fallbackHistory && fallbackHistory.messages) {
              const transformedMessages = fallbackHistory.messages
                .reverse()
                .map((msg: any) => ({
                  id: msg.id,
                  sender: msg.sender_id === currentUser.id ? "You" : currentChat?.name || "Other",
                  text: msg.message_text,
                  time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isYou: msg.sender_id === currentUser.id,
                  type: msg.message_type as 'text' | 'image' | 'document' | 'location' | 'audio',
                  isRead: msg.is_read,
                  status: msg.is_read ? 'read' : 'delivered'
                }));
              setMessages(transformedMessages);
            }
          } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
            setMessages([]);
          }
        }
      }
    };

    fetchMessages();
  }, [activeChat, currentUser]);

  useEffect(() => {
    const handleReceiveMessage = (msg: any) => {
      // Only add message if it belongs to the active chat
      // AND it's not a message we just sent (to avoid duplicates)
      if (activeChat && msg.chatId === activeChat.id && msg.senderId !== currentUser?.id) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          if (prev.some(m => m.id === msg.id)) {
            return prev;
          }
          const newMsg: Message = {
            id: msg.id,
            sender: currentChat?.name || "Other",
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isYou: false,
            type: msg.messageType as any || 'text',
            status: 'delivered',
            isRead: false,
          };
          return [...prev, newMsg];
        });
      }
    };

    const handleMessageSent = (msg: any) => {
      // Add our sent messages to the chat (from message_sent event)
      if (activeChat && msg.chatId === activeChat.id && msg.senderId === currentUser?.id) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          if (prev.some(m => m.id === msg.id)) {
            return prev;
          }
          const newMsg: Message = {
            id: msg.id,
            sender: "You",
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isYou: true,
            type: msg.messageType as any || 'text',
            status: 'delivered',
            isRead: false,
          };
          return [...prev, newMsg];
        });
      }
    };

    const handleMessageRead = (data: any) => {
      // Update message status to read when sender receives this event
      const { messageId } = data;
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read', isRead: true } : msg
      ));
    };

    const handleMessagesRead = (data: any) => {
      // Multiple messages marked as read
      const { count } = data;
      setMessages(prev => prev.map(msg => 
        msg.isYou ? { ...msg, status: 'read', isRead: true } : msg
      ));
      console.log(`✅ ${count} messages marked as read`);
    };

    // Only register listeners if we have an active chat
    if (activeChat && currentUser) {
      chatService.onReceiveMessage(handleReceiveMessage);
      chatService.onMessageSent(handleMessageSent);
      chatService.onMessageRead?.(handleMessageRead);
      chatService.onMessagesRead?.(handleMessagesRead);
    }

    return () => {
      // Note: chatService listeners should be unregistered here if supported
      // For now, we rely on the checks inside handlers to prevent duplicate processing
    };
  }, [activeChat, currentChat?.name, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartCall = (video: boolean) => {
    if (isRequest) return;
    setIsVideoCall(video);
    setIsCallActive(true);
    setIsCallMinimized(false);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsCallMinimized(false);
  };

  const handleToggleVideo = () => {
    setIsVideoCall(!isVideoCall);
  };

  const handleToggleMinimize = () => {
    setIsCallMinimized(!isCallMinimized);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !currentUser) return;
    
    // Determine receiver ID based on activeChat structure
    const receiverId = activeChat.other_user?.id || activeChat.receiverId || activeChat.id;
    const chatId = activeChat.id || activeChat.chat_id;
    
    if (!receiverId) {
      console.error("Receiver ID not found in active chat");
      return;
    }
    
    const messageText = newMessage.trim();
    setNewMessage("");
    setShowEmojiPicker(false);

    try {
      // Try Socket.IO first
      if (chatService.isConnected()) {
        await chatService.sendMessage({
          senderId: currentUser.id,
          receiverId: receiverId,
          message: messageText,
          messageType: "text",
          chatId: chatId
        });
        // Don't add message to state here - let the socket listener handle it
        // This prevents duplicate messages
      } else {
        console.warn("Socket not connected, attempting to reconnect...");
        // Fallback: Try to reconnect and resend
        await chatService.connect(currentUser.id);
        
        await chatService.sendMessage({
          senderId: currentUser.id,
          receiverId: receiverId,
          message: messageText,
          messageType: "text",
          chatId: chatId
        });
        // Don't add message to state here
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message text so user can retry
      setNewMessage(messageText);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && activeChat) {
      Array.from(files).forEach(file => {
        const isImage = file.type.startsWith('image/');
        const newMsg: Message = {
          sender: "You",
          text: isImage ? "Image sent" : "Document sent",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isYou: true,
          type: isImage ? 'image' : 'document',
          content: file.name
        };
        setMessages(prev => [...prev, newMsg]);
      });
    }
  };

  const handleLocationShare = () => {
    if (!activeChat) return;
    const newMsg: Message = {
      sender: "You",
      text: "Location shared",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isYou: true,
      type: 'location',
      content: "https://maps.google.com"
    };
    setMessages(prev => [...prev, newMsg]);
    setShowAttachmentMenu(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setAudioChunks(chunks);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    // Stop speech recognition if active
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
      (window as any).currentRecognition = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    setIsRecording(false);
  };

  const sendRecording = () => {
    if (!audioUrl || !activeChat) return;
    
    setIsSendingRecording(true);
    
    setTimeout(() => {
      const newMsg: Message = {
        sender: "You",
        text: "Voice message",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isYou: true,
        type: 'audio',
        content: audioUrl
      };
      
      setMessages(prev => [...prev, newMsg]);
      setAudioUrl(null);
      setAudioChunks([]);
      setIsSendingRecording(false);
    }, 1000);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioUrl(null);
    setAudioChunks([]);
    setRecordingTime(0);
  };

  const toggleRecording = () => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (isRecording) {
      stopRecording();
    } else {
      // Try to use speech-to-text first
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        let interimTranscript = '';
        
        recognition.onstart = () => {
          setIsRecording(true);
          setRecordingTime(0);
          recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
        };
        
        recognition.onresult = (event: any) => {
          interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setNewMessage(prev => prev + transcript + ' ');
            } else {
              interimTranscript += transcript;
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
          }
        };
        
        recognition.onend = () => {
          setIsRecording(false);
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
          }
          recordingIntervalRef.current = null;
        };
        
        recognition.start();
        // Store recognition instance for stopping later
        (window as any).currentRecognition = recognition;
      } else {
        // Fallback to regular audio recording
        startRecording();
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleNameClick = (chatId: number) => {
    router.push(`/vendor/${chatId}`);
  };

  const renderMessageContent = (msg: Message) => {
    switch (msg.type) {
      case 'image':
        return (
          <div className="relative">
            <div className="w-64 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Image: {msg.content}</span>
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
            <FileText size={20} className="text-blue-500" />
            <span className="text-sm">{msg.content}</span>
          </div>
        );
      case 'location':
        return (
          <a 
            href={msg.content} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            <MapPin size={20} className="text-red-500" />
            <span className="text-sm">View Location</span>
          </a>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-2">
            <audio 
              src={msg.content} 
              controls
              className="w-48"
            />
          </div>
        );
      default:
        return msg.text;
    }
  };

  const handleAcceptRequest = () => {
    if (activeChat) {
      setAcceptedChats(prev => [...prev, activeChat]);
    }
  };

  const handleDenyRequest = () => {
    if (activeChat && setActiveChat) {
      setActiveChat(null);
    }
  };

  return (
   <div
  className={`flex-1 h-screen flex flex-col ${isMobile ? 'fixed inset-0 z-50' : ''}`}
  style={{
    background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"
  }}
>

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
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                {currentChat?.avatar ? (
                  <img 
                    src={currentChat.avatar}
                    alt={currentChat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(currentChat?.name || "C")
                )}
              </div>
              <div 
                className="font-semibold cursor-pointer text-white"
                onClick={() => handleNameClick(activeChat)}
              >
                {currentChat?.name || "Chat"}
              </div>
            </div>

          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
            <div ref={messagesEndRef} />
            {[...messages].reverse().map((msg, idx) => (
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
                    {renderMessageContent(msg)}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 flex items-center gap-1 ${msg.isYou ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.time}</span>
                    {msg.isYou && (
                      <span className={`flex gap-0.5 ${msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
                        <span>✓</span>
                        <span>✓</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isRequest ? (
            <div className="p-4 border-t border-gray-700 sticky bottom-0" style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleAcceptRequest}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Accept Request
                </button>
                <button
                  onClick={handleDenyRequest}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Deny Request
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-700 sticky bottom-0" style={{background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)"}}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileInput}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                multiple
              />
              
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
              
              
              {audioUrl && (
                <div className="mb-3 p-3 bg-gray-800 rounded-lg flex items-center justify-between border border-gray-700">
                  <div className="flex items-center gap-3">
                    <audio src={audioUrl} controls className="w-40" />
                    <span className="text-sm text-gray-400">
                      {formatRecordingTime(recordingTime)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={sendRecording}
                      disabled={isSendingRecording}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      {isSendingRecording ? 'Sending...' : 'Send'}
                    </button>
                    <button
                      onClick={cancelRecording}
                      className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
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
                  placeholder={isRecording ? "Recording..." : "Type your message..."}
                  className="flex-1 border border-gray-600 bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isRecording}
                />
                
                {!isRecording ? (
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
                ) : (
                  <div className="text-sm text-red-500 px-2">
                    {formatRecordingTime(recordingTime)}
                  </div>
                )}
                
                <button 
                  className={`p-2 rounded-full transition-colors ${
                    isRecording 
                      ? 'text-red-500 animate-pulse' 
                      : 'text-gray-400 hover:text-blue-400'
                  }`}
                  onClick={toggleRecording}
                  aria-label={isRecording ? "Stop recording" : "Record voice message"}
                >
                  <Mic size={20} />
                </button>
              </div>
            </div>
          )}

       

        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a chat to start messaging
        </div>
      )}
    </div>
  );
}