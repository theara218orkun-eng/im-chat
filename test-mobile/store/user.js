import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'
import config from '../utils/config'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref('')
  const userInfo = ref(null)
  const settings = ref({
    language: 'zh-CN',
    notificationSound: true,
    vibration: true,
    messagePreview: true
  })

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => userInfo.value?.id || 0)
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')

  // Actions
  const init = () => {
    // Load from storage
    const storedToken = uni.getStorageSync(config.storage.token)
    const storedUser = uni.getStorageSync(config.storage.user)
    const storedSettings = uni.getStorageSync(config.storage.settings)

    if (storedToken) {
      token.value = storedToken
    }

    if (storedUser) {
      userInfo.value = storedUser
    }

    if (storedSettings) {
      settings.value = { ...settings, ...storedSettings }
    }
  }

  const login = async (credentials) => {
    try {
      const response = await request.post('login', credentials)
      token.value = response.token
      userInfo.value = response.user

      // Save to storage
      uni.setStorageSync(config.storage.token, token.value)
      uni.setStorageSync(config.storage.user, userInfo.value)

      return response
    } catch (error) {
      logout()
      throw error
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null

    // Clear storage
    uni.removeStorageSync(config.storage.token)
    uni.removeStorageSync(config.storage.user)
  }

  const fetchUserInfo = async () => {
    try {
      const response = await request.get('userInfo')
      userInfo.value = response

      // Update storage
      uni.setStorageSync(config.storage.user, userInfo.value)

      return response
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      throw error
    }
  }

  const updateUserInfo = async (data) => {
    const response = await request.put('userInfo', data)
    userInfo.value = { ...userInfo.value, ...response }

    // Update storage
    uni.setStorageSync(config.storage.user, userInfo.value)

    return response
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }

    // Save to storage
    uni.setStorageSync(config.storage.settings, settings.value)
  }

  const setToken = (newToken) => {
    token.value = newToken
    uni.setStorageSync(config.storage.token, newToken)
  }

  return {
    token,
    userInfo,
    settings,
    isLoggedIn,
    userId,
    username,
    avatar,
    init,
    login,
    logout,
    fetchUserInfo,
    updateUserInfo,
    updateSettings,
    setToken
  }
})