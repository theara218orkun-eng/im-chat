export default {
  development: {
    baseUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8282',
    h5BaseUrl: 'http://localhost:5173'
  },
  production: {
    baseUrl: 'https://your-production-domain.com',
    wsUrl: 'wss://your-production-domain.com',
    h5BaseUrl: 'https://your-production-domain.com/h5'
  },
  endpoints: {
    login: '/common/api/login',
    register: '/common/api/register',
    userInfo: '/common/api/user/info',
    conversations: '/common/api/conversations',
    messages: '/common/api/messages',
    contacts: '/common/api/friends',
    groups: '/common/api/groups',
    upload: '/common/api/upload',
    socket: '/wss'
  },
  app: {
    maxMessageLength: 2000,
    messagePageSize: 20,
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    fileUploadChunkSize: 1024 * 1024
  },
  storage: {
    token: 'im-mobile-token',
    user: 'im-mobile-user',
    settings: 'im-mobile-settings'
  }
}