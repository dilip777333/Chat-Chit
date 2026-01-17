export interface Chat {
  id: string;
  type: "personal" | "group";
  name: string; 
  participants?: any[];
  lastMessage?: string;
  message?: string;
  lastMessageTime?: string;
  last_message_time?: string; 
  time?: string;
  timestamp?: string | number;
  unreadCount?: number;
  unread?: number | boolean;
  unread_count?: number;
  isActive?: boolean;
  avatar?: any;
  status?: string;
  is_last_message_from_me?: any;
  message_status?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "file";
  isOwn?: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  profile_picture?: string;
  isOnline?: boolean;
  lastSeen?: string;
}
