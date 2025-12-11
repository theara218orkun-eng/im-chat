import config from './config'
import { useUserStore } from '../store/user'

let socketTask = null
let reconnectTimer = null
let heartbeatTimer = null
let isConnecting = false

export const createSocketConnection = () => {
  const userStore = useUserStore()
  const { wsUrl } = config.development

  return new Promise((resolve, reject) => {
    if (socketTask) {
      if (socketTask.readyState === 0) {
        return
      } else if (socketTask.readyState === 1) {
        resolve(socketTask)
        return
      }
    }

    if (isConnecting) return
    isConnecting = true

    console.log(`[Socket] Connecting to ${wsUrl}`)

    closeSocketConnection()

    socketTask = uni.connectSocket({
      url: `${wsUrl}?token=${userStore.token}`,
      success: () => {
        console.log('[Socket] Connection established')
        isConnecting = false
        resolve(socketTask)
      },
      fail: (err) => {
        console.error('[Socket] Connection failed:', err)
        isConnecting = false
        reject(err)
        scheduleReconnect()
      }
    })

    socketTask.onOpen(() => {
      console.log('[Socket] Connection opened')
      isConnecting = false
      startHeartbeat()
      resolve(socketTask)
    })

    socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        console.log('[Socket] Message received:', data)
      } catch (e) {
        console.error('[Socket] Error parsing message:', e, res.data)
      }
    })

    socketTask.onClose((res) => {
      console.log('[Socket] Connection closed:', res)
      clearHeartbeat()
      if (res.code !== 1000) {
        scheduleReconnect()
      }
    })

    socketTask.onError((err) => {
      console.error('[Socket] Error:', err)
      scheduleReconnect()
    })
  })
}

export const closeSocketConnection = () => {
  if (socketTask) {
    console.log('[Socket] Closing connection')
    clearReconnect()
    clearHeartbeat()

    if (socketTask.readyState === 1) {
      socketTask.close({
        code: 1000,
        reason: 'Normal closure'
      })
    }

    socketTask = null
  }
}

export const sendSocketMessage = (data) => {
  if (!socketTask || socketTask.readyState !== 1) {
    console.error('[Socket] Not connected')
    return Promise.reject(new Error('WebSocket not connected'))
  }

  return new Promise((resolve, reject) => {
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    console.log('[Socket] Sending message:', message)

    socketTask.send({
      data: message,
      success: () => resolve(),
      fail: (err) => reject(err)
    })
  })
}

const startHeartbeat = () => {
  const { heartbeatInterval } = config.app

  clearHeartbeat()

  heartbeatTimer = setInterval(() => {
    if (socketTask && socketTask.readyState === 1) {
      sendSocketMessage({
        type: 'heartbeat',
        timestamp: Date.now()
      }).catch(err => {
        console.error('[Socket] Heartbeat failed:', err)
      })
    }
  }, heartbeatInterval)
}

const clearHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const scheduleReconnect = () => {
  const { reconnectInterval } = config.app

  clearReconnect()

  reconnectTimer = setTimeout(() => {
    if (!socketTask || socketTask.readyState !== 1) {
      console.log('[Socket] Attempting to reconnect...')
      createSocketConnection().catch(err => {
        console.error('[Socket] Reconnect failed:', err)
      })
    }
  }, reconnectInterval)
}

const clearReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}