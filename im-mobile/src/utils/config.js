// Configuration for API and WebSocket connections
export default {
  // Development environment
  development: {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8282',
    h5BaseUrl: 'http://localhost:3002',
    // For production, you might want to use the same backend as web version
    // Check im-chat-front/.env.development for the actual URLs
  },

  // Production environment
  production: {
    baseUrl: 'https://your-production-domain.com',
    wsUrl: 'wss://your-production-domain.com',
    h5BaseUrl: 'https://your-production-domain.com/h5'
  },

  // API endpoints
  endpoints: {
    login: '/common/api/login',
    register: '/common/api/register',
    userInfo: '/common/api/user/info',
    contacts: '/common/api/friends',
    messages: '/common/api/messages',
    groups: '/common/api/groups',
    upload: '/common/api/upload',
    socket: '/wss' // WebSocket endpoint
  },

  // App configuration
  app: {
    maxMessageLength: 2000,
    messagePageSize: 20,
    heartbeatInterval: 30000, // 30 seconds
    reconnectInterval: 5000, // 5 seconds
    fileUploadChunkSize: 1024 * 1024 // 1MB
  },

  // Storage keys
  storage: {
    token: 'im-mobile-token',
    user: 'im-mobile-user',
    settings: 'im-mobile-settings'
  }
}