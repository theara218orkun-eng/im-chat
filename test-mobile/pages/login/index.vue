<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../store/user'
import { useSocketStore } from '../../store/socket'

const userStore = useUserStore()
const socketStore = useSocketStore()

const form = ref({
  username: '',
  password: '',
  remember: true
})

const isLoading = ref(false)

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none'
    })
    return
  }

  try {
    isLoading.value = true

    const response = await userStore.login({
      username: form.value.username,
      password: form.value.password
    })

    // Connect to WebSocket after successful login
    await socketStore.connect()

    // Redirect to home page
    uni.switchTab({
      url: '/pages/home/index'
    })

  } catch (error) {
    console.error('Login failed:', error)
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const navigateToRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index'
  })
}
</script>

<template>
  <view class="login-container">
    <view class="login-header">
      <image src="/static/images/logo.png" mode="widthFix" class="logo" />
      <text class="title">IM Mobile</text>
    </view>

    <view class="login-form">
      <view class="form-group">
        <view class="form-label">用户名</view>
        <input
          type="text"
          v-model="form.username"
          placeholder="请输入用户名"
          class="form-input"
          :disabled="isLoading"
        />
      </view>

      <view class="form-group">
        <view class="form-label">密码</view>
        <input
          type="password"
          v-model="form.password"
          placeholder="请输入密码"
          class="form-input"
          :disabled="isLoading"
        />
      </view>

      <view class="form-options">
        <view class="remember-me">
          <checkbox :checked="form.remember" @click="form.remember = !form.remember" />
          <text>记住我</text>
        </view>
        <view class="forgot-password" @click="navigateToRegister">
          <text>注册账号</text>
        </view>
      </view>

      <button
        class="login-button"
        :loading="isLoading"
        :disabled="isLoading"
        @click="handleLogin"
      >
        登录
      </button>
    </view>

    <view class="login-footer">
      <text class="footer-text">© 2023 IM Mobile</text>
    </view>
  </view>
</template>

<style>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  padding: 40rpx;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #4a90e2;
}

.login-form {
  flex: 1;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.form-input {
  height: 80rpx;
  padding: 0 20rpx;
  background: #f8f8f8;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me text {
  font-size: 24rpx;
  color: #666;
  margin-left: 10rpx;
}

.forgot-password text {
  font-size: 24rpx;
  color: #4a90e2;
}

.login-button {
  height: 80rpx;
  line-height: 80rpx;
  background: #4a90e2;
  color: white;
  font-size: 32rpx;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
}

.login-footer {
  text-align: center;
  margin-bottom: 20rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #999;
}
</style>