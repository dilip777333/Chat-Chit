import { io, Socket } from "socket.io-client";
import API from "./api";

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: "text";
  chatId: string;
  timestamp: string;
  createdAt: string;
  isRead?: boolean;
}

interface ChatHistoryResponse {
  success: boolean;
  messages: Message[];
  total?: number;
}

interface SendMessageResponse {
  success: boolean;
  message: Message;
}

interface DeleteMessageResponse {
  success: boolean;
  deletedBy: "sender" | "receiver" | "both";
  error?: string;
}

class ChatService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private receiveMessageCallbacks: Array<(message: Message) => void> = [];
  private messageSentCallbacks: Array<(message: Message) => void> = [];
  private messageReadCallbacks: Array<(data: { messageId: number; readBy: number; readAt: string }) => void> = [];
  private messagesReadCallbacks: Array<(data: { readBy: number; count: number }) => void> = [];

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.socket.disconnect();
      }

      this.currentUserId = userId;
      
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
        auth: {
          userId: userId
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        this.socket?.emit("join_chat", userId);
        this.setupListeners();
        resolve();
      });

      this.socket.on("connect_error", (error: any) => {
        reject(error);
      });
    });
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.off("receive_message");
    this.socket.on("receive_message", (msg: any) => {
      this.receiveMessageCallbacks.forEach(cb => cb(msg));
    });

    this.socket.off("message_sent");
    this.socket.on("message_sent", (msg: any) => {
      this.messageSentCallbacks.forEach(cb => cb(msg));
    });

    this.socket.off("message_read");
    this.socket.on("message_read", (data: any) => {
      this.messageReadCallbacks.forEach(cb => cb(data));
    });

    this.socket.off("messages_read");
    this.socket.on("messages_read", (data: any) => {
      this.messagesReadCallbacks.forEach(cb => cb(data));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      this.receiveMessageCallbacks = [];
      this.messageSentCallbacks = [];
      this.messageReadCallbacks = [];
      this.messagesReadCallbacks = [];
    }
  }

  async sendMessage(data: {
    senderId: string;
    receiverId: string;
    message: string;
    messageType?: "text";
    chatId?: string;
  }): Promise<SendMessageResponse> {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Not connected to chat server");
    }

    return new Promise((resolve, reject) => {
      this.socket?.emit("send_message", data, (response: SendMessageResponse) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error((response as any).error || "Failed to send message"));
        }
      });
    });
  }

  async deleteMessage(data: {
    messageId: number;
    userId: number;
    deleteFor?: "me" | "everyone";
  }): Promise<DeleteMessageResponse> {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Not connected to chat server");
    }

    return new Promise((resolve, reject) => {
      this.socket?.emit("delete_message", data, (response: DeleteMessageResponse) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || "Failed to delete message"));
        }
      });
    });
  }

  async accessChat(userId: string): Promise<any> {
    const response = await API.post<any>("/v1/api/chat/access", { userId });
    return response.data.chat || response.data;
  }

  async getMessagesByChatId(
    chatId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    const response = await API.get<ChatHistoryResponse>(
      `/v1/api/chat/messages/${chatId}`,
      { params: { limit, offset } }
    );
    return response.data;
  }

  async getChatHistory(
    userId1: string, 
    userId2: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    const response = await API.get<ChatHistoryResponse>(
      `/v1/api/chat/history/${userId1}/${userId2}`,
      { params: { limit, offset } }
    );
    return response.data;
  }

  async searchUsers(query: string): Promise<any[]> {
    const response = await API.get<any>("/v1/api/chat/search", { params: { q: query.trim() } });
    return response.data.users || response.data || [];
  }

  async getChatList(): Promise<any[]> {
    const response = await API.get<any[]>("/v1/api/chat/list");
    return response.data;
  }

  async getChattedUsers(userId: string): Promise<any[]> {
    const response = await API.get<any>("/v1/api/chat/chatted-users/" + userId);
    return response.data.chattedUsers || response.data || [];
  }

  async getOldChat(
    userId1: string,
    userId2: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryResponse> {
    try {
      console.log('🌐 Calling getOldChat API:', { userId1, userId2, limit, offset });
      const response = await API.get<ChatHistoryResponse>(
        `/v1/api/chat/old/${userId1}/${userId2}`,
        { params: { limit, offset } }
      );
      console.log('📡 API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ getOldChat API Error:', error);
      throw error;
    }
  }

  markMessageRead(messageId: string | number, userId: string | number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("mark_message_read", { messageId, userId });
    }
  }

  markAllRead(userId: string | number, otherUserId: string | number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("mark_all_read", { userId: String(userId), otherUserId: String(otherUserId) });
    }
  }

  openChat(data: { userId: string; otherUserId: string }): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("open_chat", data);
    }
  }

  closeChat(data: { userId: string; otherUserId: string }): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("close_chat", data);
    }
  }

  async markAsRead(chatId: string, userId: number): Promise<void> {
    await API.post("/v1/api/chat/read", { chatId, userId });
  }

  onReceiveMessage(callback: (message: Message) => void): void {
    this.receiveMessageCallbacks.push(callback);
  }

  offReceiveMessage(callback: (message: Message) => void): void {
    this.receiveMessageCallbacks = this.receiveMessageCallbacks.filter(cb => cb !== callback);
  }

  onMessageSent(callback: (message: Message) => void): void {
    this.messageSentCallbacks.push(callback);
  }

  offMessageSent(callback: (message: Message) => void): void {
    this.messageSentCallbacks = this.messageSentCallbacks.filter(cb => cb !== callback);
  }

  onMessageRead(callback: (data: { messageId: number; readBy: number; readAt: string }) => void): void {
    this.messageReadCallbacks.push(callback);
  }

  offMessageRead(callback: (data: { messageId: number; readBy: number; readAt: string }) => void): void {
    this.messageReadCallbacks = this.messageReadCallbacks.filter(cb => cb !== callback);
  }

  onMessagesRead(callback: (data: { readBy: number; count: number }) => void): void {
    this.messagesReadCallbacks.push(callback);
  }

  offMessagesRead(callback: (data: { readBy: number; count: number }) => void): void {
    this.messagesReadCallbacks = this.messagesReadCallbacks.filter(cb => cb !== callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatService = new ChatService();