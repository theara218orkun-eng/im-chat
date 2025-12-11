import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createSocketConnection, closeSocketConnection, sendSocketMessage } from '../utils/socket'

export const useSocketStore = defineStore('socket', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref(null)
  const reconnectCount = ref(0)

  // Getters
  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  // Actions
  const connect = async () => {
    if (isConnected.value) return true

    try {
      isConnecting.value = true
      connectionError.value = null

      await createSocketConnection()

      isConnected.value = true
      isConnecting.value = false
      reconnectCount.value = 0

      return true
    } catch (error) {
      isConnecting.value = false
      connectionError.value = error.message || 'Connection failed'
      reconnectCount.value++

      console.error('Socket connection error:', error)
      return false
    }
  }

  const disconnect = () => {
    closeSocketConnection()
    isConnected.value = false
    isConnecting.value = false
    reconnectCount.value = 0
  }

  const send = (data) => {
    if (!isConnected.value) {
      return Promise.reject(new Error('Not connected to socket'))
    }

    return sendSocketMessage(data)
  }

  const sendMessage = (message, conversationId) => {
    return send({
      type: 'message',
      conversation_id: conversationId,
      content: message,
      timestamp: Date.now()
    })
  }

  const sendTypingStatus = (conversationId, isTyping) => {
    return send({
      type: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping
    })
  }

  const sendReadReceipt = (messageId) => {
    return send({
      type: 'message_read',
      message_id: messageId,
      timestamp: Date.now()
    })
  }

  const resetConnection = () => {
    disconnect()
    setTimeout(() => {
      connect()
    }, 1000)
  }

  return {
    isConnected,
    isConnecting,
    connectionError,
    reconnectCount,
    connectionStatus,
    connect,
    disconnect,
    send,
    sendMessage,
    sendTypingStatus,
    sendReadReceipt,
    resetConnection
  }
})