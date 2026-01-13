import { request } from "./request";
import endpoints from "./endpoints";
import { io, Socket } from "socket.io-client";

// Types
export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  messageType: "text" | "image" | "video" | "audio";
  chatId: number;
  timestamp: string;
  createdAt: string;
  isRead?: boolean;
}

export interface ChatUser {
  id: number;
  userName: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  messages: Message[];
  total?: number;
}

export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

export interface DeleteMessageResponse {
  success: boolean;
  deletedBy: "sender" | "receiver" | "both";
  error?: string;
}

// Chat Service Class
class ChatService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private receiveMessageCallbacks: Array<(message: Message) => void> = [];
  private messageSentCallbacks: Array<(message: Message) => void> = [];
  private messageReadCallbacks: Array<(data: { messageId: number; readBy: number; readAt: string }) => void> = [];
  private messagesReadCallbacks: Array<(data: { readBy: number; count: number }) => void> = [];

  // Initialize Socket.IO connection
  connect(userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentUserId = userId;
      
      this.socket = io(endpoints.chat.socketUrl, {
        auth: {
          userId: userId
        }
      });

      this.socket.on("connect", () => {
        console.log("Connected to chat server");
        // Join user room
        this.socket?.emit("join_chat", userId);
        resolve();
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("Socket connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from chat server");
      });
    });
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
    }
  }

  // Send message via Socket.IO
  sendMessage(data: {
    senderId: number;
    receiverId: number;
    message: string;
    messageType?: "text" | "image" | "video" | "audio";
    chatId?: number;
  }): Promise<SendMessageResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected to chat server"));
        return;
      }

      this.socket.emit("send_message", data, (response: SendMessageResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error((response as any).error || "Failed to send message"));
        }
      });
    });
  }

  // Delete message
  deleteMessage(data: {
    messageId: number;
    userId: number;
    deleteFor?: "me" | "everyone";
  }): Promise<DeleteMessageResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected to chat server"));
        return;
      }

      this.socket.emit("delete_message", data, (response: DeleteMessageResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error((response as any).error || "Failed to delete message"));
        }
      });
    });
  }

  // Access or create a chat
  async accessChat(userId: number): Promise<any> {
    try {
      const response = await request.post<{ success: boolean; chat: any }>(endpoints.chat.accessChat, { userId });
      return response.chat;
    } catch (error) {
      throw error;
    }
  }

  // Get messages by chat ID
  async getMessagesByChatId(
    chatId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    try {
      const response = await request.get<ChatHistoryResponse>(
        endpoints.chat.getMessagesByChatId(chatId),
        { limit, offset }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get chat history via API
  async getChatHistory(
    userId1: number, 
    userId2: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    try {
      const response = await request.get<ChatHistoryResponse>(
        endpoints.chat.getChatHistory(userId1, userId2),
        { limit, offset }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Search users by name, email, or phone
  async searchUsers(query: string): Promise<any[]> {
    try {
      const response = await request.get<any>(endpoints.chat.searchUsers, { q: query });

      // Response shape may vary; normalize it.
      if (response && Array.isArray(response.users)) {
        return response.users;
      }

      // Some backends may return users directly or nested differently.
      if (response && Array.isArray(response)) {
        return response;
      }

      if (response && response.data && Array.isArray(response.data.users)) {
        return response.data.users;
      }

      // Fallback: fetch all users and do a client-side filter if search endpoint didn't return users
      try {
        const all = await request.get<any>(endpoints.chat.getAllUsers);
        const users = Array.isArray(all.users) ? all.users : (Array.isArray(all) ? all : []);
        const qLower = (query || "").toLowerCase();
        return users.filter((u: any) => {
          return (
            (u.user_name && u.user_name.toLowerCase().includes(qLower)) ||
            (u.first_name && u.first_name.toLowerCase().includes(qLower)) ||
            (u.last_name && u.last_name.toLowerCase().includes(qLower)) ||
            (u.email && u.email.toLowerCase().includes(qLower)) ||
            (u.phone_number && u.phone_number.toLowerCase().includes(qLower))
          );
        }).slice(0, 20);
      } catch (innerErr) {
        console.error("Failed to fallback to getAllUsers:", innerErr);
      }

      return [];
    } catch (error) {
      console.error("searchUsers error:", error);
      throw error;
    }
  }

  // Get user's chat list
  async getChatList(): Promise<any[]> {
    try {
      const response = await request.get<any[]>(endpoints.chat.getChatList);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get chatted users list (users current user has chatted with)
  async getChattedUsers(userId: number): Promise<any[]> {
    try {
      const response = await request.get<any>(endpoints.chat.getChattedUsers(userId));
      if (response && Array.isArray(response.chattedUsers)) {
        return response.chattedUsers;
      }
      return [];
    } catch (error) {
      console.error("Error fetching chatted users:", error);
      throw error;
    }
  }

  // Get old chat messages between two users
  async getOldChat(
    userId1: number,
    userId2: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    try {
      const response = await request.get<ChatHistoryResponse>(
        endpoints.chat.getOldChat(userId1, userId2),
        { limit, offset }
      );
      return response;
    } catch (error) {
      console.error("Error fetching old chat:", error);
      throw error;
    }
  }

  // Mark single message as read
  markMessageRead(messageId: number, userId: number): void {
    if (this.socket) {
      console.log('📤 Emitting mark_message_read:', { messageId, userId });
      this.socket.emit("mark_message_read", { messageId, userId });
    } else {
      console.warn('⚠️ Socket not connected, cannot mark message as read');
    }
  }

  // Mark all messages from a user as read
  markAllRead(userId: number, otherUserId: number): void {
    if (this.socket) {
      this.socket.emit("mark_all_read", { userId, otherUserId });
    }
  }

  // Emit open_chat event to notify server that chat is active
  openChat(data: { userId: number; otherUserId: number }): void {
    if (this.socket) {
      console.log('📂 Emitting open_chat:', data);
      this.socket.emit("open_chat", data);
    }
  }

  // Emit close_chat event to notify server that chat is closed
  closeChat(data: { userId: number; otherUserId: number }): void {
    if (this.socket) {
      console.log('📤 Emitting close_chat:', data);
      this.socket.emit("close_chat", data);
    }
  }

  // Mark messages as read
  async markAsRead(chatId: number, userId: number): Promise<void> {
    try {
      await request.post(endpoints.chat.markAsRead, { chatId, userId });
    } catch (error) {
      throw error;
    }
  }

  // Socket event listeners
  onReceiveMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      // Add to callbacks array
      this.receiveMessageCallbacks.push(callback);
      console.log(`✅ receive_message callback registered`);
      
      // Set up the socket listener if not already
      this.socket.off("receive_message");
      this.socket.on("receive_message", (msg: any) => {
        console.log('🔵 Socket: receive_message event fired');
        // Call all registered callbacks
        this.receiveMessageCallbacks.forEach(cb => cb(msg));
      });
    }
  }

  offReceiveMessage(callback: (message: Message) => void): void {
    this.receiveMessageCallbacks = this.receiveMessageCallbacks.filter(cb => cb !== callback);
  }

  onMessageSent(callback: (message: Message) => void): void {
    if (this.socket) {
      // Add to callbacks array
      this.messageSentCallbacks.push(callback);
      console.log(`✅ message_sent callback registered`);
      
      // Set up the socket listener if not already
      this.socket.off("message_sent");
      this.socket.on("message_sent", (msg: any) => {
        console.log('🔵 Socket: message_sent event fired');
        // Call all registered callbacks
        this.messageSentCallbacks.forEach(cb => cb(msg));
      });
    }
  }

  offMessageSent(callback: (message: Message) => void): void {
    this.messageSentCallbacks = this.messageSentCallbacks.filter(cb => cb !== callback);
  }

  onMessageRead(callback: (data: { messageId: number; readBy: number; readAt: string }) => void): void {
    if (this.socket) {
      // Add to callbacks array
      this.messageReadCallbacks.push(callback);
      console.log(`✅ message_read callback registered`);
      
      // Set up the socket listener if not already
      this.socket.off("message_read");
      this.socket.on("message_read", (data: any) => {
        console.log('🔵 Socket: message_read event fired with data:', data);
        // Call all registered callbacks
        this.messageReadCallbacks.forEach(cb => cb(data));
      });
    }
  }

  offMessageRead(callback: (data: { messageId: number; readBy: number; readAt: string }) => void): void {
    this.messageReadCallbacks = this.messageReadCallbacks.filter(cb => cb !== callback);
  }

  onMessagesRead(callback: (data: { readBy: number; count: number }) => void): void {
    if (this.socket) {
      // Add to callbacks array
      this.messagesReadCallbacks.push(callback);
      console.log(`✅ messages_read callback registered`);
      
      // Set up the socket listener if not already
      this.socket.off("messages_read");
      this.socket.on("messages_read", (data: any) => {
        console.log('🔵 Socket: messages_read event fired with data:', data);
        // Call all registered callbacks
        this.messagesReadCallbacks.forEach(cb => cb(data));
      });
    }
  }

  offMessagesRead(callback: (data: { readBy: number; count: number }) => void): void {
    this.messagesReadCallbacks = this.messagesReadCallbacks.filter(cb => cb !== callback);
  }

  onMessageDeleted(callback: (data: { messageId: number; deletedBy: string }) => void): void {
    if (this.socket) {
      // Remove old listener if it exists, then add new one
      this.socket.off("message_deleted");
      this.socket.on("message_deleted", callback);
    }
  }

  onUserTyping(callback: (data: { senderId: number; isTyping: boolean }) => void): void {
    if (this.socket) {
      // Remove old listener if it exists, then add new one
      this.socket.off("user_typing");
      this.socket.on("user_typing", callback);
    }
  }

  // Send typing indicator
  sendTyping(data: { senderId: number; receiverId: number; isTyping: boolean }): void {
    if (this.socket) {
      this.socket.emit("typing", data);
    }
  }

  // Remove event listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current user ID
  getCurrentUserId(): number | null {
    return this.currentUserId;
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;