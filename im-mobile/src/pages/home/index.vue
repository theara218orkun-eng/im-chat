<script setup>
import { ref, onMounted, onShow } from 'vue'
import { useUserStore } from '../../store/user'
import { useMessageStore } from '../../store/message'
import { useSocketStore } from '../../store/socket'
import ConversationList from '../../components/ConversationList.vue'

const userStore = useUserStore()
const messageStore = useMessageStore()
const socketStore = useSocketStore()

const isLoading = ref(true)
const showActionSheet = ref(false)

onMounted(async () => {
  await loadData()
})

onShow(async () => {
  // Refresh data when page shows
  await loadData()
})

const loadData = async () => {
  try {
    isLoading.value = true

    // Check if user is logged in
    if (!userStore.isLoggedIn) {
      uni.reLaunch({
        url: '/pages/login/index'
      })
      return
    }

    // Connect to WebSocket if not connected
    if (!socketStore.isConnected) {
      await socketStore.connect()
    }

    // Load conversations
    await messageStore.fetchConversations()

  } catch (error) {
    console.error('Failed to load home data:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const handleConversationSelect = (conversation) => {
  messageStore.setCurrentConversation(conversation)

  uni.navigateTo({
    url: `/pages/chat/index?conversationId=${conversation.id}&type=${conversation.type}`
  })
}

const handleRefresh = async () => {
  await loadData()
}

const showMoreActions = () => {
  showActionSheet.value = true
}

const handleActionSelect = (index) => {
  showActionSheet.value = false

  switch (index) {
    case 0:
      // Start new chat
      uni.navigateTo({
        url: '/pages/contacts/index?mode=select'
      })
      break
    case 1:
      // Create group
      uni.navigateTo({
        url: '/pages/group/create'
      })
      break
    case 2:
      // Settings
      uni.navigateTo({
        url: '/pages/settings/index'
      })
      break
  }
}

const navigateToProfile = () => {
  uni.navigateTo({
    url: '/pages/profile/index'
  })
}
</script>

<template>
  <view class="home-container">
    <!-- Header -->
    <view class="home-header">
      <view class="header-title">消息</view>
      <view class="header-actions">
        <view class="action-icon" @click="showMoreActions">
          <image src="/static/images/add.png" mode="widthFix" />
        </view>
        <view class="action-icon" @click="navigateToProfile">
          <image :src="userStore.avatar || '/static/images/default-avatar.png'" mode="aspectFill" class="avatar" />
        </view>
      </view>
    </view>

    <!-- Search bar -->
    <view class="search-bar">
      <view class="search-input">
        <image src="/static/images/search.png" mode="widthFix" class="search-icon" />
        <input
          type="text"
          placeholder="搜索"
          confirm-type="search"
          class="search-input-field"
          disabled
          @click="uni.navigateTo({ url: '/pages/search/index' })"
        />
      </view>
    </view>

    <!-- Conversation list -->
    <view class="conversation-container">
      <ConversationList
        :conversations="messageStore.conversations"
        @select="handleConversationSelect"
        @refresh="handleRefresh"
      />
    </view>

    <!-- Loading -->
    <view v-if="isLoading" class="loading-overlay">
      <view class="loading-content">
        <image src="/static/images/loading.gif" mode="widthFix" class="loading-icon" />
        <text>加载中...</text>
      </view>
    </view>

    <!-- Action sheet -->
    <uni-popup ref="actionSheet" type="bottom" v-model="showActionSheet">
      <view class="action-sheet">
        <view class="action-sheet-item" @click="handleActionSelect(0)">
          <image src="/static/images/chat.png" mode="widthFix" />
          <text>发起聊天</text>
        </view>
        <view class="action-sheet-item" @click="handleActionSelect(1)">
          <image src="/static/images/group.png" mode="widthFix" />
          <text>创建群聊</text>
        </view>
        <view class="action-sheet-item" @click="handleActionSelect(2)">
          <image src="/static/images/setting.png" mode="widthFix" />
          <text>设置</text>
        </view>
        <view class="action-sheet-cancel" @click="showActionSheet = false">
          <text>取消</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss">
@import '../../static/css/variables.scss';

.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f8f8;

  .home-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 30rpx;
    background: #ffffff;

    .header-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }

    .header-actions {
      display: flex;
      align-items: center;

      .action-icon {
        width: 50rpx;
        height: 50rpx;
        margin-left: 20rpx;

        image {
          width: 100%;
          height: 100%;
        }

        .avatar {
          border-radius: 50%;
        }
      }
    }
  }

  .search-bar {
    padding: 10rpx 30rpx;
    background: #ffffff;
    border-bottom: 1px solid #f0f0f0;

    .search-input {
      display: flex;
      align-items: center;
      background: #f8f8f8;
      border-radius: 30rpx;
      padding: 0 20rpx;
      height: 60rpx;

      .search-icon {
        width: 30rpx;
        height: 30rpx;
        margin-right: 10rpx;
      }

      .search-input-field {
        flex: 1;
        font-size: 28rpx;
        height: 60rpx;
        line-height: 60rpx;
      }
    }
  }

  .conversation-container {
    flex: 1;
    overflow: hidden;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;

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

  .action-sheet {
    background: #ffffff;
    border-radius: 20rpx 20rpx 0 0;

    .action-sheet-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      font-size: 32rpx;

      image {
        width: 40rpx;
        height: 40rpx;
        margin-right: 20rpx;
      }

      &:active {
        background: #f8f8f8;
      }
    }

    .action-sheet-cancel {
      padding: 20rpx 0;
      text-align: center;
      font-size: 32rpx;
      color: #666;
      border-top: 1px solid #f0f0f0;
      margin-top: 20rpx;

      &:active {
        background: #f8f8f8;
      }
    }
  }
}
</style>