"use client";
import { Search, UserPlus, X, Phone, PhoneMissed, PhoneOutgoing } from "lucide-react";
import { useState, useEffect } from "react";

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
};

const initialChats: Chat[] = [
  {
    id: 1,
    type: "personal",
    name: "Running Club Member",
    message: "Let's meet at 7am tomorrow",
    time: "11:42 AM",
    unread: true,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(11, 42, 0) // Today 11:42 AM
  },
  {
    id: 2,
    type: "personal",
    name: "Andre Silva",
    message: "You: Sounds good!",
    time: "12:11 AM",
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(0, 11, 0) // Today 12:11 AM
  },
  {
    id: 3,
    type: "personal",
    name: "Work Team Member",
    message: "The report is ready for review",
    time: "Yesterday",
    unread: false,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setDate(new Date().getDate() - 1) // Yesterday
  },
  {
    id: 4,
    type: "personal",
    name: "Maria Garcia",
    message: "Are we still on for lunch?",
    time: "Yesterday",
    avatar: "",
    status: "accepted",
    timestamp: new Date().setDate(new Date().getDate() - 1) // Yesterday
  },
  {
    id: 5,
    type: "personal",
    name: "Book Club Member",
    message: "Finished chapter 5 last night",
    time: "Monday",
    unread: true,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setDate(new Date().getDate() - 3) // 3 days ago (Monday)
  },
  {
    id: 6,
    type: "personal",
    name: "Yoga Enthusiast",
    message: "Don't forget mats for tomorrow",
    time: "2:30 PM",
    unread: false,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(14, 30, 0) // Today 2:30 PM
  },
  {
    id: 7,
    type: "personal",
    name: "Project Manager",
    message: "Deadline moved to Friday",
    time: "10:15 AM",
    unread: true,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(10, 15, 0) // Today 10:15 AM
  },
  {
    id: 8,
    type: "personal",
    name: "Foodie Friend",
    message: "The new Italian place is amazing!",
    time: "7:45 PM",
    unread: true,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(19, 45, 0) // Today 7:45 PM
  },
  {
    id: 9,
    type: "personal",
    name: "Travel Buddy",
    message: "Flights are booked for Bali!",
    time: "Yesterday",
    unread: false,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setDate(new Date().getDate() - 1) // Yesterday
  },
  {
    id: 10,
    type: "personal",
    name: "Study Partner",
    message: "Practice exam uploaded",
    time: "4:20 PM",
    unread: true,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(16, 20, 0) // Today 4:20 PM
  },
  {
    id: 11,
    type: "personal",
    name: "Olivia Wilson",
    message: "You: Thanks for the recommendation!",
    time: "9:30 AM",
    unread: false,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setHours(9, 30, 0) // Today 9:30 AM
  },
  {
    id: 12,
    type: "personal",
    name: "Kwame Mensah",
    message: "Call me when you're free",
    time: "Yesterday",
    unread: true,
    avatar: "",
    status: "accepted",
    timestamp: new Date().setDate(new Date().getDate() - 1) // Yesterday
  },
];

const initialRequests: Chat[] = [
  {
    id: 13,
    type: "personal",
    name: "Sophie Chen",
    message: "legal team approved everything",
    time: "3:15 PM",
    unread: false,
    avatar: "",
    status: "request",
    timestamp: new Date().setHours(15, 15, 0) // Today 3:15 PM
  },
  {
    id: 14,
    type: "personal",
    name: "Diego Rodriguez",
    message: "Let's reschedule for Thursday",
    time: "11:20 AM",
    unread: true,
    avatar: "",
    status: "request",
    timestamp: new Date().setHours(11, 20, 0) // Today 11:20 AM
  },
  {
    id: 15,
    type: "personal",
    name: "Fatima Al-Mansoori",
    message: "The package has arrived",
    time: "Monday",
    unread: false,
    avatar: "",
    status: "request",
    timestamp: new Date().setDate(new Date().getDate() - 3) // 3 days ago (Monday)
  },
  {
    id: 16,
    type: "personal",
    name: "Sophie Williams",
    message: "The documents are signed",
    time: "3:15 PM",
    unread: false,
    avatar: "",
    status: "request",
    timestamp: new Date().setHours(15, 15, 0) // Today 3:15 PM
  },
  {
    id: 17,
    type: "personal",
    name: "Diego Rodriguez",
    message: "Morning would work best",
    time: "11:20 AM",
    unread: true,
    avatar: "",
    status: "request",
    timestamp: new Date().setHours(11, 20, 0) // Today 11:20 AM
  },
  {
    id: 18,
    type: "personal",
    name: "Fatima Al-Mansoori",
    message: "Your order has been delivered",
    time: "Monday",
    unread: false,
    avatar: "",
    status: "request",
    timestamp: new Date().setDate(new Date().getDate() - 3) // 3 days ago (Monday)
  },
  {
    id: 19,
    type: "personal",
    name: "Diego Rodriguez",
    message: "Can we move our meeting?",
    time: "11:20 AM",
    unread: true,
    avatar: "",
    status: "request",
    timestamp: new Date().setHours(11, 20, 0) // Today 11:20 AM
  },
  {
    id: 20,
    type: "personal",
    name: "Fatima",
    message: "The package is ready",
    time: "Monday",
    unread: false,
    avatar: "",
    status: "request",
    timestamp: new Date().setDate(new Date().getDate() - 3) // 3 days ago (Monday)
  },
];

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
  onCloseChat
}: { 
  activeChat: number | null; 
  setActiveChat: (id: number | null) => void;
  isMobile?: boolean;
  onCloseChat?: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [requests, setRequests] = useState<Chat[]>(initialRequests);
  const [callHistory, setCallHistory] = useState<CallHistory[]>(initialCallHistory);
  const [showRequests, setShowRequests] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  useEffect(() => {
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

  const handleAccept = (requestId: number) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      const newChat = { 
        ...request, 
        unread: true, 
        status: "accepted" as const,
        timestamp: Date.now()
      };
      setChats((prev) => [...prev, newChat]);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSelectedRequest(null);
      setActiveChat(requestId);
    }
  };

  const handleDeny = (requestId: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setSelectedRequest(null);
    if (activeChat === requestId) {
      setActiveChat(null);
    }
  };

  const handleRequestClick = (requestId: number) => {
    setSelectedRequest(requestId);
    setActiveChat(requestId);
  };

  const handleChatClick = (id: number) => {
    setActiveChat(id);
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === id ? { ...chat, unread: false } : chat
      )
    );
    if (isMobile && onCloseChat) {
      onCloseChat();
    }
  };

  const unreadCount = chats.filter((chat) => chat.unread).length;

  return (
    <div className={`${isMobile ? 'w-full' : 'w-[300px]'} border-r border-gray-200 h-screen bg-white flex flex-col`}>
      <style jsx>{`
        .thin-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background-color: #c1c1c1;
          border-radius: 2px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background-color: #f1f1f1;
        }
      `}</style>

      <div className="p-4 border-b border-gray-200">
        <div className="text-lg font-semibold flex justify-between items-center">
          Messages
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCallHistory(!showCallHistory);
                setShowRequests(false);
              }}
              className="relative"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setShowRequests(!showRequests);
                setShowCallHistory(false);
              }}
              className="relative"
            >
              <UserPlus className="w-5 h-5 text-gray-600" />
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
            <span className="text-xs text-white bg-blue-600 px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          </div>
        </div>
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {showCallHistory && (
        <div className="p-4 border-b border-gray-200 bg-white shadow-md z-10 h-screen overflow-y-auto thin-scrollbar">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Call History</h3>
            <button onClick={() => setShowCallHistory(false)} className="p-1 hover:bg-gray-100 rounded-full">
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
        <div className="p-4 border border-gray-200 bg-white shadow-md z-10 h-screen overflow-y-auto thin-scrollbar">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Connection Requests</h3>
            <button onClick={() => setShowRequests(false)} className="p-1 hover:bg-gray-100 rounded-full">
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
                  className={`p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all ${
                    selectedRequest === req.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleRequestClick(req.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      {req.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{req.name}</p>
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
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                activeChat === chat.id ? "bg-blue-50" : ""
              }`}
              onClick={() => handleChatClick(chat.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
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
                  <div className="flex justify-between items-center">
                    <div className="font-medium truncate">{chat.name}</div>
                    <div className="text-xs text-gray-500">{chat.time}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-gray-500 text-xs truncate">
                      {chat.message}
                    </div>
                    {chat.unread && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}