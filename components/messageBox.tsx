"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, Phone, Video, Mic, MapPin, FileText, Menu } from "lucide-react";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
// import CallScreen from "@/components/callmodel/page";
import { useRouter } from "next/navigation";
type Message = {
  sender: string;
  text: string;
  time: string;
  isYou?: boolean;
  type?: 'text' | 'image' | 'document' | 'location' | 'audio';
  content?: string;
};

type Chat = {
  id: number;
  name: string;
  status: 'request' | 'accepted' | 'denied';
};

const chatData: Record<number, Message[]> = {
  1: [
    { sender: "You", text: "Are you joining the run tomorrow?", time: "11:30 AM", isYou: true },
    { sender: "Running Partner", text: "I'll be there! 7am at the park?", time: "11:35 AM" },
    { sender: "You", text: "Can we make it 7:30? I have to drop my kids first", time: "11:40 AM", isYou: true },
    { sender: "Running Partner", text: "7:30 works for me", time: "11:45 AM" },
    { sender: "You", text: "Let's meet at 7:30 tomorrow", time: "11:42 AM", isYou: true }
  ],
  2: [
    { sender: "Andre Silva", text: "Hey, did you see the game last night?", time: "12:00 AM" },
    { sender: "You", text: "Yeah! That last goal was incredible", time: "12:02 AM", isYou: true },
    { sender: "Andre Silva", text: "Right? Best match of the season", time: "12:05 AM" },
    { sender: "You", text: "Sounds good!", time: "12:11 AM", isYou: true }
  ],
  3: [
    { sender: "Work Colleague", text: "I've finished the quarterly report", time: "9:25 AM" },
    { sender: "You", text: "Great, I'll review it after lunch", time: "9:30 AM", isYou: true },
    { sender: "Work Colleague", text: "The report is ready for review", time: "9:30 AM" },
    { sender: "You", text: "I've added the financials section", time: "10:00 AM", isYou: true }
  ],
  4: [
    { sender: "Maria Garcia", text: "Are you free for lunch tomorrow?", time: "1:25 PM" },
    { sender: "You", text: "What time were you thinking?", time: "1:28 PM", isYou: true },
    { sender: "Maria Garcia", text: "Are we still on for lunch?", time: "1:30 PM" },
    { sender: "You", text: "1pm at the usual place?", time: "1:35 PM", isYou: true }
  ],
  5: [
    { sender: "Book Friend", text: "Just finished chapter 5 - what a plot twist!", time: "8:40 PM" },
    { sender: "You", text: "I know! Didn't see that coming", time: "8:42 PM", isYou: true },
    { sender: "Book Friend", text: "Finished chapter 5 last night", time: "8:45 PM" },
    { sender: "You", text: "Wait till you get to chapter 7!", time: "8:50 PM", isYou: true }
  ],
  6: [
    { sender: "Yoga Friend", text: "Don't forget mats for tomorrow's session", time: "2:25 PM" },
    { sender: "You", text: "I'll bring two extra mats", time: "2:28 PM", isYou: true },
    { sender: "Yoga Friend", text: "Don't forget mats for tomorrow", time: "2:30 PM" },
    { sender: "You", text: "I can bring the essential oils", time: "2:35 PM", isYou: true }
  ],
  7: [
    { sender: "Project Lead", text: "Good news - client extended the deadline", time: "10:10 AM" },
    { sender: "You", text: "That's a relief!", time: "10:12 AM", isYou: true },
    { sender: "Project Lead", text: "Deadline moved to Friday", time: "10:15 AM" },
    { sender: "You", text: "Let's use the extra time for QA", time: "10:20 AM", isYou: true }
  ],
  8: [
    { sender: "Foodie Friend", text: "Just tried the new Italian place downtown", time: "7:40 PM" },
    { sender: "You", text: "How was the pasta?", time: "7:42 PM", isYou: true },
    { sender: "Foodie Friend", text: "The new Italian place is amazing!", time: "7:45 PM" },
    { sender: "You", text: "Their tiramisu is to die for", time: "7:50 PM", isYou: true }
  ],
  9: [
    { sender: "Travel Companion", text: "Just booked our flights!", time: "Yesterday 3:00 PM" },
    { sender: "You", text: "What dates did you get?", time: "Yesterday 3:05 PM", isYou: true },
    { sender: "Travel Companion", text: "Flights are booked for Bali!", time: "Yesterday 3:10 PM" },
    { sender: "You", text: "I'll handle the villa booking", time: "Yesterday 3:15 PM", isYou: true }
  ],
  10: [
    { sender: "Study Buddy", text: "I've uploaded the practice exam", time: "4:15 PM" },
    { sender: "You", text: "Thanks! These look challenging", time: "4:18 PM", isYou: true },
    { sender: "Study Buddy", text: "Practice exam uploaded", time: "4:20 PM" },
    { sender: "You", text: "Let's review together tomorrow", time: "4:25 PM", isYou: true }
  ],
  11: [
    { sender: "Olivia Wilson", text: "That restaurant you recommended was perfect!", time: "9:25 AM" },
    { sender: "You", text: "Glad you liked it!", time: "9:28 AM", isYou: true },
    { sender: "Olivia Wilson", text: "Thanks for the recommendation!", time: "9:30 AM" },
    { sender: "You", text: "We should go together next time", time: "9:32 AM", isYou: true }
  ],
  12: [
    { sender: "Kwame Mensah", text: "Need to discuss the contract terms", time: "Yesterday 2:00 PM" },
    { sender: "You", text: "I'm in meetings all afternoon", time: "Yesterday 2:05 PM", isYou: true },
    { sender: "Kwame Mensah", text: "Call me when you're free", time: "Yesterday 2:10 PM" },
    { sender: "You", text: "Will do after 6pm", time: "Yesterday 2:12 PM", isYou: true }
  ],
  13: [
    { sender: "Sophie Chen", text: "The legal team has approved everything", time: "3:10 PM" },
    { sender: "You", text: "That was fast!", time: "3:12 PM", isYou: true },
    { sender: "Sophie Chen", text: "The documents are signed", time: "3:15 PM" },
    { sender: "You", text: "I'll notify the client", time: "3:18 PM", isYou: true }
  ],
  14: [
    { sender: "Diego Rodriguez", text: "Can we move our meeting to Thursday?", time: "11:15 AM" },
    { sender: "You", text: "Let me check my calendar", time: "11:18 AM", isYou: true },
    { sender: "Diego Rodriguez", text: "Morning would work best", time: "11:19 AM" },
    { sender: "You", text: "Let's reschedule for Thursday", time: "11:20 AM", isYou: true }
  ],
  15: [
    { sender: "Fatima Al-Mansoori", text: "Your order has been delivered", time: "Monday 10:00 AM" },
    { sender: "You", text: "Great! Was everything included?", time: "Monday 10:05 AM", isYou: true },
    { sender: "Fatima Al-Mansoori", text: "The package has arrived", time: "Monday 10:10 AM" },
    { sender: "You", text: "Perfect, thanks!", time: "Monday 10:12 AM", isYou: true }
  ]
};

const chats: Chat[] = [
  {
    id: 1,
    name: "Running Club Member",
    status: "accepted"
  },
  {
    id: 2,
    name: "Andre Silva",
    status: "accepted"
  },
  {
    id: 3,
    name: "Work Team Member",
    status: "accepted"
  },
  {
    id: 4,
    name: "Maria Garcia",
    status: "accepted"
  },
  {
    id: 5,
    name: "Book Club Member",
    status: "accepted"
  },
  {
    id: 6,
    name: "Yoga Enthusiast",
    status: "accepted"
  },
  {
    id: 7,
    name: "Project Manager",
    status: "accepted"
  },
  {
    id: 8,
    name: "Foodie Friend",
    status: "accepted"
  },
  {
    id: 9,
    name: "Travel Buddy",
    status: "accepted"
  },
  {
    id: 10,
    name: "Study Partner",
    status: "accepted"
  },
  {
    id: 11,
    name: "Olivia Wilson",
    status: "accepted"
  },
  {
    id: 12,
    name: "Kwame Mensah",
    status: "accepted"
  },
  {
    id: 13,
    name: "Sophie Chen",
    status: "request"
  },
  {
    id: 14,
    name: "Diego Rodriguez",
    status: "request"
  },
  {
    id: 15,
    name: "Fatima Al-Mansoori",
    status: "request"
  },
  {
    id: 16,
    name: "Sophie Williams",
    status: "request"
  },
  {
    id: 17,
    name: "Diego Rodriguez",
    status: "request"
  },
  {
    id: 18,
    name: "Fatima Al-Mansoori",
    status: "request"
  },
  {
    id: 19,
    name: "Diego Rodriguez",
    status: "request"
  },
  {
    id: 20,
    name: "Fatima",
    status: "request"
  }
];

export default function ChatWindow({ 
  activeChat, 
  setActiveChat,
  isMobile,
  onOpenList
}: { 
  activeChat: number | null; 
  setActiveChat?: (id: number | null) => void;
  isMobile?: boolean;
  onOpenList?: () => void;
}) {
  const router = useRouter();
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

  const currentChat = chats.find(chat => chat.id === activeChat);
  const isRequest = currentChat?.status === 'request' && !acceptedChats.includes(activeChat!);

  useEffect(() => {
    if (activeChat) {
      setMessages(chatData[activeChat] || []);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;
    
    const newMsg: Message = {
      sender: "You",
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isYou: true,
      type: 'text'
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
    setShowEmojiPicker(false);
    
    if (Math.random() > 0.3) {
      setTimeout(() => {
        const replies = [
          "That's interesting!",
          "I'll get back to you on that",
          "Thanks for letting me know",
          "Can we discuss this later?",
          "I agree with you",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const replyMsg: Message = {
          sender: chats.find(chat => chat.id === activeChat)?.name || "Contact",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        
        setMessages(prev => [...prev, replyMsg]);
      }, 1000 + Math.random() * 2000);
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
      
      setTimeout(() => {
        const replyMsg: Message = {
          sender: chats.find(chat => chat.id === activeChat)?.name || "Contact",
          text: "Thanks for the voice message!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        setMessages(prev => [...prev, replyMsg]);
      }, 2000);
    }, 1000);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioUrl(null);
    setAudioChunks([]);
    setRecordingTime(0);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
    <div className={`flex-1 h-screen bg-gray-50 flex flex-col ${isMobile ? 'fixed inset-0 z-50' : ''}`}>
      {activeChat ? (
        <>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button 
                  onClick={onOpenList}
                  className="mr-2 text-gray-600"
                >
                  <Menu size={20} />
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {getInitials(chats.find(chat => chat.id === activeChat)?.name || "C")}
              </div>
              <div 
                className="font-semibold cursor-pointer"
                onClick={() => handleNameClick(activeChat)}
              >
                {chats.find(chat => chat.id === activeChat)?.name || "Chat"}
              </div>
            </div>
            {!isRequest && (
              <div className="flex items-center gap-4">
                <button 
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                  onClick={() => handleStartCall(false)}
                  aria-label="Audio call"
                >
                  <Phone size={20} />
                </button>
                <button 
                  className="text-gray-600 hover:text-blue-500 transition-colors"
                  onClick={() => handleStartCall(true)}
                  aria-label="Video call"
                >
                  <Video size={20} />
                </button>
              </div>
            )}
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
                    <div className="text-xs text-gray-600 mb-1">
                      {msg.sender}
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      msg.isYou
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white shadow rounded-bl-none"
                    }`}
                  >
                    {renderMessageContent(msg)}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${msg.isYou ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isRequest ? (
            <div className="p-4 border-t bg-white sticky bottom-0">
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
            <div className="p-4 border-t bg-white sticky bottom-0">
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
              
              {showAttachmentMenu && (
                <div className="absolute bottom-16 left-12 bg-white shadow-lg rounded-lg p-2 z-10 w-48">
                  <button 
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                  >
                    <FileText size={16} /> Send File
                  </button>
                  <button 
                    onClick={handleLocationShare}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                  >
                    <MapPin size={16} /> Share Location
                  </button>
                </div>
              )}
              
              {audioUrl && (
                <div className="mb-3 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <audio src={audioUrl} controls className="w-40" />
                    <span className="text-sm text-gray-600">
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
                  className="text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  aria-label="Attachments"
                >
                  <Paperclip size={20} />
                </button>
                
                <button 
                  className={`text-gray-500 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition-colors ${showEmojiPicker ? 'bg-blue-100' : ''}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  aria-label="Emoji picker"
                >
                  <Smile size={20} />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isRecording ? "Recording..." : "Type your message..."}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
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
                      : 'text-gray-500 hover:text-blue-500'
                  }`}
                  onClick={toggleRecording}
                  aria-label={isRecording ? "Stop recording" : "Record voice message"}
                >
                  <Mic size={20} />
                </button>
              </div>
            </div>
          )}

          {/*
            <CallScreen
              contactName={chats.find(chat => chat.id === activeChat)?.name || "Contact"}
              contactInitials={getInitials(chats.find(chat => chat.id === activeChat)?.name || "C")}
              isVideoCall={isVideoCall}
              onEndCall={handleEndCall}
              onToggleVideo={handleToggleVideo}
              onMinimize={handleToggleMinimize}
            />
          */}

        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a chat to start messaging
        </div>
      )}
    </div>
  );
}