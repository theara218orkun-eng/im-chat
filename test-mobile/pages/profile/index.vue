<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../store/user'
import { useSocketStore } from '../../store/socket'

const userStore = useUserStore()
const socketStore = useSocketStore()

const userInfo = ref({
  username: '',
  avatar: '',
  email: '',
  phone: '',
  bio: ''
})

const isEditing = ref(false)
const isLoading = ref(false)

onMounted(() => {
  loadUserInfo()
})

const loadUserInfo = () => {
  userInfo.value = {
    username: userStore.username,
    avatar: userStore.avatar,
    email: userStore.userInfo?.email || '',
    phone: userStore.userInfo?.phone || '',
    bio: userStore.userInfo?.bio || ''
  }
}

const handleEdit = () => {
  isEditing.value = true
}

const handleSave = async () => {
  try {
    isLoading.value = true

    const updatedInfo = {
      username: userInfo.value.username,
      email: userInfo.value.email,
      phone: userInfo.value.phone,
      bio: userInfo.value.bio
    }

    await userStore.updateUserInfo(updatedInfo)

    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })

    isEditing.value = false

  } catch (error) {
    console.error('Failed to update user info:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  isEditing.value = false
  loadUserInfo()
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    socketStore.disconnect()

    uni.reLaunch({
      url: '/pages/login/index'
    })

  } catch (error) {
    console.error('Logout failed:', error)
    uni.showToast({
      title: '退出失败',
      icon: 'none'
    })
  }
}

const handleAvatarChange = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        isLoading.value = true

        // Upload avatar
        const uploadRes = await userStore.updateUserInfo({
          avatar: res.tempFilePaths[0]
        })

        userInfo.value.avatar = uploadRes.avatar
        userStore.userInfo.avatar = uploadRes.avatar

        uni.showToast({
          title: '头像更新成功',
          icon: 'success'
        })

      } catch (error) {
        console.error('Avatar upload failed:', error)
        uni.showToast({
          title: '头像更新失败',
          icon: 'none'
        })
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<template>
  <view class="profile-container">
    <!-- Header -->
    <view class="profile-header">
      <view class="header-title">个人资料</view>
    </view>

    <!-- Profile content -->
    <view class="profile-content">
      <!-- Avatar section -->
      <view class="avatar-section">
        <view class="avatar-wrapper">
          <image
            :src="userInfo.avatar || '/static/images/default-avatar.png'"
            mode="aspectFill"
            class="avatar"
            @click="handleAvatarChange"
          />
          <view class="avatar-overlay" @click="handleAvatarChange">
            <image src="/static/images/camera.png" mode="widthFix" class="camera-icon" />
          </view>
        </view>
        <text class="username">{{ userInfo.username }}</text>
      </view>

      <!-- User info form -->
      <view class="user-info-form">
        <view class="form-group">
          <view class="form-label">用户名</view>
          <input
            v-if="isEditing"
            type="text"
            v-model="userInfo.username"
            class="form-input"
            placeholder="请输入用户名"
          />
          <view v-else class="form-value">{{ userInfo.username }}</view>
        </view>

        <view class="form-group">
          <view class="form-label">邮箱</view>
          <input
            v-if="isEditing"
            type="text"
            v-model="userInfo.email"
            class="form-input"
            placeholder="请输入邮箱"
          />
          <view v-else class="form-value">{{ userInfo.email || '未设置' }}</view>
        </view>

        <view class="form-group">
          <view class="form-label">手机号</view>
          <input
            v-if="isEditing"
            type="text"
            v-model="userInfo.phone"
            class="form-input"
            placeholder="请输入手机号"
          />
          <view v-else class="form-value">{{ userInfo.phone || '未设置' }}</view>
        </view>

        <view class="form-group">
          <view class="form-label">个人简介</view>
          <textarea
            v-if="isEditing"
            v-model="userInfo.bio"
            class="form-textarea"
            placeholder="请输入个人简介"
            auto-height
          />
          <view v-else class="form-value">{{ userInfo.bio || '未设置' }}</view>
        </view>

        <!-- Edit buttons -->
        <view v-if="isEditing" class="form-actions">
          <button class="save-button" :loading="isLoading" @click="handleSave">
            保存
          </button>
          <button class="cancel-button" @click="handleCancel">
            取消
          </button>
        </view>

        <view v-else class="form-actions">
          <button class="edit-button" @click="handleEdit">
            编辑资料
          </button>
        </view>
      </view>

      <!-- Settings section -->
      <view class="settings-section">
        <view class="settings-header">设置</view>

        <view class="settings-item" @click="uni.navigateTo({ url: '/pages/settings/index' })">
          <view class="settings-label">账号设置</view>
          <image src="/static/images/arrow-right.png" mode="widthFix" class="arrow-icon" />
        </view>

        <view class="settings-item" @click="uni.navigateTo({ url: '/pages/settings/notification' })">
          <view class="settings-label">通知设置</view>
          <image src="/static/images/arrow-right.png" mode="widthFix" class="arrow-icon" />
        </view>

        <view class="settings-item" @click="uni.navigateTo({ url: '/pages/settings/about' })">
          <view class="settings-label">关于</view>
          <image src="/static/images/arrow-right.png" mode="widthFix" class="arrow-icon" />
        </view>
      </view>

      <!-- Logout button -->
      <view class="logout-section">
        <button class="logout-button" @click="handleLogout">
          退出登录
        </button>
      </view>
    </view>

    <!-- Loading overlay -->
    <view v-if="isLoading" class="loading-overlay">
      <view class="loading-content">
        <image src="/static/images/loading.gif" mode="widthFix" class="loading-icon" />
        <text>处理中...</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import '../../static/css/variables.scss';

.profile-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f8f8;

  .profile-header {
    padding: 20rpx 30rpx;
    background: #ffffff;
    border-bottom: 1px solid #f0f0f0;

    .header-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      text-align: center;
    }
  }

  .profile-content {
    flex: 1;
    overflow-y: auto;
    padding: 20rpx 0;

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40rpx 0;
      background: #ffffff;
      margin-bottom: 20rpx;

      .avatar-wrapper {
        position: relative;
        width: 160rpx;
        height: 160rpx;
        margin-bottom: 20rpx;

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .avatar-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 60rpx;
          height: 60rpx;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;

          .camera-icon {
            width: 30rpx;
            height: 30rpx;
          }
        }
      }

      .username {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .user-info-form {
      background: #ffffff;
      margin-bottom: 20rpx;
      padding: 0 30rpx;

      .form-group {
        padding: 20rpx 0;
        border-bottom: 1px solid #f0f0f0;

        .form-label {
          font-size: 28rpx;
          color: #666;
          margin-bottom: 10rpx;
        }

        .form-input, .form-textarea {
          width: 100%;
          font-size: 28rpx;
          color: #333;
        }

        .form-textarea {
          min-height: 100rpx;
          padding: 10rpx 0;
        }

        .form-value {
          font-size: 28rpx;
          color: #333;
        }
      }

      .form-actions {
        padding: 30rpx 0;
        display: flex;
        justify-content: center;

        button {
          width: 200rpx;
          height: 60rpx;
          line-height: 60rpx;
          border-radius: 30rpx;
          font-size: 28rpx;
          margin: 0 20rpx;
        }

        .save-button {
          background: $primary-color;
          color: white;
        }

        .cancel-button {
          background: #f0f0f0;
          color: #666;
        }

        .edit-button {
          background: $primary-color;
          color: white;
        }
      }
    }

    .settings-section {
      background: #ffffff;
      margin-bottom: 20rpx;
      padding: 0 30rpx;

      .settings-header {
        padding: 20rpx 0;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        border-bottom: 1px solid #f0f0f0;
      }

      .settings-item {
        padding: 20rpx 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;

        .settings-label {
          font-size: 28rpx;
          color: #333;
        }

        .arrow-icon {
          width: 30rpx;
          height: 30rpx;
        }
      }
    }

    .logout-section {
      padding: 40rpx 30rpx;
      background: #ffffff;

      .logout-button {
        width: 100%;
        height: 80rpx;
        line-height: 80rpx;
        background: #ff4d4f;
        color: white;
        font-size: 32rpx;
        border-radius: 10rpx;
      }
    }
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #ffffff;
      padding: 40rpx;
      border-radius: 20rpx;

      .loading-icon {
        width: 60rpx;
        height: 60rpx;
        margin-bottom: 20rpx;
      }

      text {
        font-size: 28rpx;
        color: #666;
      }
    }
  }
}
</style>