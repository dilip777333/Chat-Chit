"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
  setChats,
  newlyCreatedChat
}: { 
  activeChat: any | null; 
  setActiveChat?: (chat: any | null) => void;
  isMobile?: boolean;
  onOpenList?: () => void;
  chats: Chat[];
  setChats?: (chats: any) => void;
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
  const isRequest = currentChat?.status === 'request' && !acceptedChats.includes(activeChat?.id ?? 0);

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
                status: (msg.is_read ? 'read' : 'delivered') as 'read' | 'delivered' // Default status based on is_read
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
                  status: (msg.is_read ? 'read' : 'delivered') as 'read' | 'delivered'
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

    // Set up periodic refresh every 3 seconds to check for message status updates
    const refreshInterval = setInterval(() => {
      if (activeChat && currentUser) {
        const otherUserId = activeChat.other_user?.id || activeChat.receiverId || activeChat.id;
        if (otherUserId) {
          chatService.getOldChat(currentUser.id, otherUserId, 100, 0).then(history => {
            if (history && history.messages) {
              setMessages(prevMessages => {
                const updatedMessages = prevMessages.map(prevMsg => {
                  const serverMsg = history.messages.find((m: any) => m.id === prevMsg.id);
                  if (serverMsg && serverMsg.isRead !== prevMsg.isRead) {
                    console.log('🔄 Status updated for message:', prevMsg.id, '- Now read:', serverMsg.isRead);
                    return {
                      ...prevMsg,
                      isRead: serverMsg.isRead,
                      status: serverMsg.isRead ? 'read' : prevMsg.status
                    };
                  }
                  return prevMsg;
                });
                return updatedMessages;
              });
            }
          }).catch(err => console.log('Periodic refresh error:', err));
        }
      }
    }, 3000);

    return () => clearInterval(refreshInterval);
  }, [activeChat, currentUser]);

  useEffect(() => {
    const handleReceiveMessage = (msg: any) => {
      console.log('📨 handleReceiveMessage called in messageBox with:', msg);
      
      // Only add message if it belongs to the active chat
      // AND it's not a message we just sent (to avoid duplicates)
      if (!activeChat || !currentUser) {
        console.log('⚠️ No activeChat or currentUser', { activeChat: !!activeChat, currentUser: !!currentUser });
        return;
      }
      
      const senderId = msg.senderId;
      const activeChatUserId = activeChat.other_user?.id || activeChat.id;
      
      console.log('📨 Checking message:', { 
        senderId, 
        activeChatUserId, 
        currentUserId: currentUser.id,
        isFromActiveUser: senderId === activeChatUserId,
        isNotFromMe: senderId !== currentUser.id
      });
      
      // Check if message is from the person we're chatting with
      const isFromActiveChatUser = senderId === activeChatUserId;
      const isNotFromMe = senderId !== currentUser.id;
      
      if (isFromActiveChatUser && isNotFromMe) {
        console.log('✅ Message is for active chat, adding to messageBox');
        
        // Immediately mark the message as read since the chat is open
        console.log('👀 Marking message as read:', msg.id);
        chatService.markMessageRead(msg.id, currentUser.id);
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          if (prev.some(m => m.id === msg.id)) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          const newMsg: Message = {
            id: msg.id,
            sender: currentChat?.name || "Other",
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isYou: false,
            type: msg.messageType as any || 'text',
            status: 'read', // Mark as read since we're viewing the chat
            isRead: true,
          };
          console.log('✅ Adding new message:', newMsg);
          return [...prev, newMsg];
        });
      } else {
        console.log('❌ Message not for this chat or from me');
      }
    };

    const handleMessageSent = (msg: any) => {
      // Update the temp message with the actual ID and timestamp from server
      if (!activeChat || !currentUser) return;
      
      const receiverId = msg.receiverId;
      const activeChatUserId = activeChat.other_user?.id || activeChat.id;
      const isFromMe = msg.senderId === currentUser.id;
      
      // Check if message was sent to the person we're chatting with
      if (receiverId === activeChatUserId && isFromMe) {
        setMessages(prev => {
          // Update the last message (which is our temp message) with actual server data
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.isYou && !lastMsg.id) {
            // Update temp message with actual ID and timestamp
            return prev.map((m, idx) => 
              idx === prev.length - 1 
                ? {
                    ...m,
                    id: msg.id,
                    time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'delivered'
                  }
                : m
            );
          }
          return prev;
        });
      }
    };

    const handleMessageRead = (data: any) => {
      // Update message status to read when sender receives this event
      const { messageId } = data;
      console.log('✅ Message marked as read by receiver:', messageId);
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          console.log('📖 Updating message status to read:', messageId);
          return { ...msg, status: 'read', isRead: true };
        }
        return msg;
      }));
    };

    const handleMessagesRead = (data: any) => {
      // Multiple messages marked as read
      const { count } = data;
      setMessages(prev => prev.map(msg => 
        msg.isYou ? { ...msg, status: 'read', isRead: true } : msg
      ));
      console.log(`✅ ${count} messages marked as read`);
    };

    // Always register listeners with latest state to ensure closures are fresh
    console.log('🔧 Registering socket listeners for activeChat:', activeChat?.id);
    chatService.onReceiveMessage(handleReceiveMessage);
    chatService.onMessageSent(handleMessageSent);
    chatService.onMessageRead?.(handleMessageRead);
    chatService.onMessagesRead?.(handleMessagesRead);
    console.log('✅ Socket listeners registered in messageBox');

    return () => {
      chatService.offReceiveMessage(handleReceiveMessage);
      chatService.offMessageSent(handleMessageSent);
      chatService.offMessageRead(handleMessageRead);
      chatService.offMessagesRead(handleMessagesRead);
      console.log('🗑️ Socket listeners unregistered in messageBox');
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

  // Prevent duplicate message sends with debouncing
  const isSendingRef = useRef(false);

  const handleSendMessage = async () => {
    // Prevent duplicate sends if already sending
    if (isSendingRef.current) {
      console.warn("⚠️ Message send already in progress, ignoring duplicate request");
      return;
    }

    if (!newMessage.trim() || !activeChat || !currentUser) return;
    
    // Determine receiver ID based on activeChat structure
    const receiverId = activeChat.other_user?.id || activeChat.receiverId || activeChat.id;
    const chatId = activeChat.id || activeChat.chat_id;
    
    if (!receiverId) {
      console.error("Receiver ID not found in active chat");
      return;
    }
    
    // Mark as sending to prevent duplicates
    isSendingRef.current = true;
    
    const messageText = newMessage.trim();
    const timestamp = new Date();
    
    // Add message to state immediately for instant UI feedback
    const tempMessage: Message = {
      sender: "You",
      text: messageText,
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isYou: true,
      type: 'text',
      status: 'sent'
    };
    setMessages(prev => [...prev, tempMessage]);
    
    setNewMessage("");
    setShowEmojiPicker(false);

    try {
      // Update the chat list with the latest message
      if (setChats) {
        setChats((prevChats: Chat[]) => {
          const updatedChats = prevChats.map(chat =>
            chat.id === receiverId
              ? {
                  ...chat,
                  message: `You: ${messageText}`,
                  time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: timestamp.getTime()
                }
              : chat
          );
          // Move the updated chat to the top
          const chatIndex = updatedChats.findIndex(c => c.id === receiverId);
          if (chatIndex > 0) {
            const [chat] = updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(chat);
          }
          return updatedChats;
        });
      }

      console.log("📤 Sending message...");
      // Try Socket.IO first
      if (chatService.isConnected()) {
        await chatService.sendMessage({
          senderId: currentUser.id,
          receiverId: receiverId,
          message: messageText,
          messageType: "text",
          chatId: chatId
        });
        console.log("✅ Message sent successfully via socket");
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
        console.log("✅ Message sent successfully after reconnect");
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message text so user can retry
      setNewMessage(messageText);
      // Remove the temp message on error
      setMessages(prev => prev.filter(m => m !== tempMessage));
    } finally {
      // Always reset sending flag
      isSendingRef.current = false;
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
              <div className="w-10 h-10 rounded-full bg-linear-to-b from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden">
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
                      <span className={`flex gap-0.5 font-bold ${msg.status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
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
          Select a user to chat
        </div>
      )}
    </div>
  );
}