import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import { useUserStore } from './user'

export const useMessageStore = defineStore('message', () => {
  const userStore = useUserStore()

  // State
  const conversations = ref([])
  const currentConversation = ref(null)
  const messages = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)

  // Getters
  const currentMessages = computed(() => {
    if (!currentConversation.value) return []
    return messages.value.filter(m => m.conversation_id === currentConversation.value.id)
  })

  const conversationUnreadCount = computed(() => {
    if (!currentConversation.value) return 0
    const conv = conversations.value.find(c => c.id === currentConversation.value.id)
    return conv ? conv.unread_count : 0
  })

  const totalUnreadCount = computed(() => {
    return conversations.value.reduce((total, conv) => total + conv.unread_count, 0)
  })

  // Actions
  const init = () => {
    conversations.value = []
    messages.value = []
    unreadCount.value = 0
    page.value = 1
    hasMore.value = true
  }

  const fetchConversations = async () => {
    try {
      isLoading.value = true
      const response = await request.get('conversations')
      conversations.value = response.data || []
      calculateUnreadCount()
      return response
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchMessages = async (conversationId, reset = true) => {
    if (reset) {
      page.value = 1
      hasMore.value = true
    }

    try {
      isLoading.value = true
      const response = await request.get('messages', {
        conversation_id: conversationId,
        page: page.value,
        page_size: 20
      })

      if (reset) {
        messages.value = response.data || []
      } else {
        messages.value = [...response.data, ...messages.value]
      }

      page.value++
      hasMore.value = response.data.length >= 20

      // Mark conversation as read
      if (currentConversation.value && currentConversation.value.id === conversationId) {
        await markConversationAsRead(conversationId)
      }

      return response
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const sendMessage = async (content, type = 'text', conversationId) => {
    const message = {
      conversation_id: conversationId,
      sender_id: userStore.userId,
      content,
      type,
      created_at: new Date().toISOString(),
      status: 'sending'
    }

    // Add to local messages immediately
    messages.value.push(message)

    try {
      const response = await request.post('messages', {
        conversation_id: conversationId,
        content,
        type
      })

      // Update message with server data
      const index = messages.value.findIndex(m => m.created_at === message.created_at)
      if (index !== -1) {
        messages.value[index] = { ...response, status: 'sent' }
      }

      return response
    } catch (error) {
      console.error('Failed to send message:', error)
      // Update message status
      const index = messages.value.findIndex(m => m.created_at === message.created_at)
      if (index !== -1) {
        messages.value[index].status = 'failed'
      }
      throw error
    }
  }

  const markConversationAsRead = async (conversationId) => {
    try {
      await request.put(`conversations/${conversationId}/read`)
      const convIndex = conversations.value.findIndex(c => c.id === conversationId)
      if (convIndex !== -1) {
        conversations.value[convIndex].unread_count = 0
        calculateUnreadCount()
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  const handleSocketMessage = (data) => {
    console.log('Handling socket message:', data)

    switch (data.type) {
      case 'message':
        handleNewMessage(data)
        break
      case 'message_read':
        handleMessageRead(data)
        break
      case 'typing':
        handleTypingIndicator(data)
        break
      case 'online_status':
        handleOnlineStatus(data)
        break
      default:
        console.warn('Unknown message type:', data.type)
    }
  }

  const handleNewMessage = (message) => {
    // Check if conversation exists
    let conversation = conversations.value.find(c => c.id === message.conversation_id)

    if (!conversation) {
      // Create new conversation
      conversation = {
        id: message.conversation_id,
        type: message.conversation_type,
        target_id: message.sender_id === userStore.userId ? message.receiver_id : message.sender_id,
        unread_count: 1,
        last_message: message.content,
        last_message_time: message.created_at,
        updated_at: message.created_at
      }

      // Add to conversations
      conversations.value = [conversation, ...conversations.value]
    } else {
      // Update existing conversation
      const convIndex = conversations.value.findIndex(c => c.id === message.conversation_id)
      conversations.value[convIndex] = {
        ...conversation,
        unread_count: conversation.id === currentConversation.value?.id ? 0 : conversation.unread_count + 1,
        last_message: message.content,
        last_message_time: message.created_at,
        updated_at: message.created_at
      }
    }

    // Add message to list
    messages.value.push({
      ...message,
      is_new: conversation.id !== currentConversation.value?.id
    })

    calculateUnreadCount()

    // Show notification if not in current conversation
    if (conversation.id !== currentConversation.value?.id) {
      showNotification(message)
    }
  }

  const handleMessageRead = (data) => {
    // Update message read status
    const messageIndex = messages.value.findIndex(m => m.id === data.message_id)
    if (messageIndex !== -1) {
      messages.value[messageIndex].read_at = data.read_at
    }
  }

  const showNotification = (message) => {
    if (!userStore.settings.notificationSound && !userStore.settings.vibration) return

    // Show system notification
    uni.showToast({
      title: `新消息: ${message.content}`,
      icon: 'none',
      duration: 3000
    })

    // Play sound if enabled
    if (userStore.settings.notificationSound) {
      const innerAudioContext = uni.createInnerAudioContext()
      innerAudioContext.src = '/static/audio/notify.mp3'
      innerAudioContext.play()
    }

    // Vibrate if enabled
    if (userStore.settings.vibration) {
      uni.vibrateLong()
    }
  }

  const calculateUnreadCount = () => {
    unreadCount.value = conversations.value.reduce((total, conv) => total + conv.unread_count, 0)
  }

  const setCurrentConversation = (conversation) => {
    currentConversation.value = conversation

    // Mark as read when opening conversation
    if (conversation.unread_count > 0) {
      markConversationAsRead(conversation.id)
    }
  }

  return {
    conversations,
    currentConversation,
    messages,
    currentMessages,
    unreadCount,
    conversationUnreadCount,
    totalUnreadCount,
    isLoading,
    hasMore,
    init,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markConversationAsRead,
    handleSocketMessage,
    setCurrentConversation
  }
})