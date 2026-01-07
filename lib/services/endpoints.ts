// Helper function to get socket URL (same logic as API base URL)
const getSocketURL = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // If running in browser, check if we're accessing via network IP
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If hostname is not localhost, use the same hostname for backend
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:5001`;
    }
  }
  
  return "http://localhost:5001";
};

const endpoints = {
  auth: {
    // Backend mounts these at: /v1/api/auth/*
    sendOtp: "/v1/api/auth/send-otp",
    verifyOtp: "/v1/api/auth/verify-otp",
    logout: "/v1/api/auth/logout",
  },

  chat: {
    // Chat endpoints (mounted at /v1/api/chat in Express)
    sendMessage: "/v1/api/chat/send",
    getChatHistory: (userId1: string | number, userId2: string | number) =>
      `/v1/api/chat/history/${userId1}/${userId2}`,
    deleteMessage: "/v1/api/chat/delete",
    markAsRead: "/v1/api/chat/read",
    getChatList: "/v1/api/chat/list",
    getAllUsers: "/v1/api/chat/users",
    searchUsers: "/v1/api/chat/search", // Search users endpoint
    accessChat: "/v1/api/chat/access",
    getMessagesByChatId: (chatId: string | number) => `/v1/api/chat/messages/${chatId}`,
    getChattedUsers: (userId: string | number) => `/v1/api/chat/chatted-users/${userId}`,
    getOldChat: (userId1: string | number, userId2: string | number) => `/v1/api/chat/old/${userId1}/${userId2}`,

    // Socket.IO connection - automatically uses network IP if accessing via network
    socketUrl: getSocketURL(),
  },

  admin: {
    users: "/v1/api/users",
    userById: (id: string | number) => `/v1/api/users/${id}`,
    dashboardStats: "/v1/api/admin/dashboard/stats",
    settings: "/v1/api/admin/settings",
  },

  public: {
    users: "/v1/api/public/users",
    userById: (id: string | number) => `/v1/api/public/users/${id}`,
  },
};

export default endpoints;
