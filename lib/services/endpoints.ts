const endpoints = {
  auth: {
    login: "/v1/api/auth/login",
    register: "/v1/api/auth/register",
    logout: "/v1/api/auth/logout",
  },

  chat: {
    sendMessage: "/v1/api/chat/send",
    getChatHistory: (userId1: string, userId2: string) => `/v1/api/chat/history/${userId1}/${userId2}`,
    deleteMessage: "/v1/api/chat/delete",
    markAsRead: "/v1/api/chat/read",
    getChatList: "/v1/api/chat/list",
    getAllUsers: "/v1/api/chat/users",
    searchUsers: "/v1/api/chat/search",
    accessChat: "/v1/api/chat/access",
    getMessagesByChatId: (chatId: string) => `/v1/api/chat/messages/${chatId}`,
    getChattedUsers: (userId: string) => `/v1/api/chat/chatted-users/${userId}`,
    getOldChat: (userId1: string, userId2: string) => `/v1/api/chat/old/${userId1}/${userId2}`,
  },

  admin: {
    users: "/v1/api/users",
    userById: (id: string) => `/v1/api/users/${id}`,
    profile: "/v1/api/users/profile",
  },

  public: {
    users: "/v1/api/public/users",
    userById: (id: string) => `/v1/api/public/users/${id}`,
  },
};

export default endpoints;