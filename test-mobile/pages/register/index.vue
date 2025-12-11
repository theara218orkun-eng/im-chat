<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../store/user'
import request from '../../utils/request'

const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: ''
})

const isLoading = ref(false)

const handleRegister = async () => {
  if (!validateForm()) return

  try {
    isLoading.value = true

    const response = await request.post('register', {
      username: form.value.username,
      password: form.value.password,
      email: form.value.email,
      phone: form.value.phone
    })

    uni.showToast({
      title: '注册成功',
      icon: 'success'
    })

    // Auto login after registration
    await userStore.login({
      username: form.value.username,
      password: form.value.password
    })

    // Redirect to home
    uni.switchTab({
      url: '/pages/home/index'
    })

  } catch (error) {
    console.error('Registration failed:', error)
    uni.showToast({
      title: error.message || '注册失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const validateForm = () => {
  if (!form.value.username) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'none'
    })
    return false
  }

  if (!form.value.password) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none'
    })
    return false
  }

  if (form.value.password !== form.value.confirmPassword) {
    uni.showToast({
      title: '密码不一致',
      icon: 'none'
    })
    return false
  }

  if (form.value.password.length < 6) {
    uni.showToast({
      title: '密码至少6位',
      icon: 'none'
    })
    return false
  }

  if (!form.value.email || !validateEmail(form.value.email)) {
    uni.showToast({
      title: '请输入有效邮箱',
      icon: 'none'
    })
    return false
  }

  return true
}

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const navigateToLogin = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="register-container">
    <view class="register-header">
      <image src="/static/images/logo.png" mode="widthFix" class="logo" />
      <text class="title">创建账号</text>
    </view>

    <view class="register-form">
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

      <view class="form-group">
        <view class="form-label">确认密码</view>
        <input
          type="password"
          v-model="form.confirmPassword"
          placeholder="请再次输入密码"
          class="form-input"
          :disabled="isLoading"
        />
      </view>

      <view class="form-group">
        <view class="form-label">邮箱</view>
        <input
          type="text"
          v-model="form.email"
          placeholder="请输入邮箱"
          class="form-input"
          :disabled="isLoading"
        />
      </view>

      <view class="form-group">
        <view class="form-label">手机号（选填）</view>
        <input
          type="text"
          v-model="form.phone"
          placeholder="请输入手机号"
          class="form-input"
          :disabled="isLoading"
        />
      </view>

      <button
        class="register-button"
        :loading="isLoading"
        :disabled="isLoading"
        @click="handleRegister"
      >
        注册
      </button>

      <view class="login-link" @click="navigateToLogin">
        <text>已有账号？立即登录</text>
      </view>
    </view>
  </view>
</template>

<style>
.register-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  padding: 40rpx;
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 60rpx;
}

.logo {
  width: 100rpx;
  height: 100rpx;
  margin-bottom: 20rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #4a90e2;
}

.register-form {
  flex: 1;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.form-input {
  height: 80rpx;
  padding: 0 20rpx;
  background: #f8f8f8;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.register-button {
  height: 80rpx;
  line-height: 80rpx;
  background: #4a90e2;
  color: white;
  font-size: 32rpx;
  border-radius: 10rpx;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.login-link {
  text-align: center;
  font-size: 28rpx;
  color: #4a90e2;
  text-decoration: underline;
}
</style>