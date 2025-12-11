// Helper functions for the mobile app

/**
 * Format time for display
 * @param {string|Date} time - Time to format
 * @param {string} format - Format string (optional)
 * @returns {string} Formatted time
 */
export function formatTime(time, format = 'YYYY-MM-DD HH:mm') {
  if (!time) return ''

  const date = new Date(time)
  const now = new Date()

  // Today
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: '2-digit', day: '2-digit' })
  }

  // Older
  return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

/**
 * Format file size
 */
export function formatFileSize(size) {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + 'KB'
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + 'MB'
  return (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
}

/**
 * Generate unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout
  return function() {
    const context = this
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let lastFunc
  let lastRan
  return function() {
    const context = this
    const args = arguments
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

/**
 * Validate email
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validate phone number
 */
export function validatePhone(phone) {
  const re = /^1[3456789]\d{9}$/
  return re.test(phone)
}

/**
 * Validate username
 */
export function validateUsername(username) {
  return username.length >= 3 && username.length <= 20
}

/**
 * Validate password
 */
export function validatePassword(password) {
  return password.length >= 6 && password.length <= 20
}

/**
 * Get user avatar URL
 */
export function getAvatarUrl(avatar) {
  if (!avatar) return '/static/images/default-avatar.png'
  if (avatar.startsWith('http')) return avatar
  return `/static/images/${avatar}`
}

/**
 * Get message preview text
 */
export function getMessagePreview(message) {
  if (!message) return ''

  switch (message.type) {
    case 'image':
      return '[图片]'
    case 'voice':
      return '[语音]'
    case 'video':
      return '[视频]'
    case 'file':
      return '[文件]'
    default:
      return message.content || ''
  }
}

/**
 * Check if message is from current user
 */
export function isCurrentUserMessage(message, currentUserId) {
  return message.sender_id === currentUserId
}

/**
 * Format duration for voice messages
 */
export function formatVoiceDuration(duration) {
  if (duration < 60) return `${duration}"`
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Get conversation display name
 */
export function getConversationDisplayName(conversation, currentUserId) {
  if (conversation.type === 'group') {
    return conversation.group_name || `群聊(${conversation.member_count || 0})`
  } else {
    // For single chat, get the other user's name
    const otherUser = conversation.members.find(member => member.id !== currentUserId)
    return otherUser ? otherUser.username : '未知用户'
  }
}

/**
 * Get conversation avatar
 */
export function getConversationAvatar(conversation, currentUserId) {
  if (conversation.type === 'group') {
    return conversation.group_avatar || '/static/images/group-avatar.png'
  } else {
    // For single chat, get the other user's avatar
    const otherUser = conversation.members.find(member => member.id !== currentUserId)
    return otherUser ? otherUser.avatar : '/static/images/default-avatar.png'
  }
}