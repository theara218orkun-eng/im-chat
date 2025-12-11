<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessageStore } from '../store/message'
import { useUserStore } from '../store/user'
import { formatTime } from '../utils/helpers'

const messageStore = useMessageStore()
const userStore = useUserStore()

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  showSearch: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select', 'refresh'])

const searchQuery = ref('')
const isRefreshing = ref(false)

const filteredConversations = computed(() => {
  if (!searchQuery.value) return props.conversations

  return props.conversations.filter(conv => {
    const targetName = getConversationName(conv)
    return targetName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           (conv.last_message && conv.last_message.toLowerCase().includes(searchQuery.value.toLowerCase()))
  })
})

const getConversationName = (conversation) => {
  if (conversation.type === 'group') {
    return conversation.group_name || `群聊(${conversation.member_count || 0})`
  } else {
    // For single chat, we need to get the other user's name
    // In a real app, this would come from the conversation data or require a separate API call
    return conversation.target_name || `用户${conversation.target_id}`
  }
}

const getConversationAvatar = (conversation) => {
  if (conversation.type === 'group') {
    return conversation.group_avatar || '/static/images/group-avatar.png'
  } else {
    return conversation.target_avatar || '/static/images/default-avatar.png'
  }
}

const getLastMessageTime = (conversation) => {
  if (!conversation.last_message_time) return ''
  return formatTime(conversation.last_message_time)
}

const handleSelect = (conversation) => {
  emit('select', conversation)
}

const handleRefresh = async () => {
  try {
    isRefreshing.value = true
    await messageStore.fetchConversations()
    emit('refresh')
  } catch (error) {
    console.error('Refresh failed:', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'none'
    })
  } finally {
    isRefreshing.value = false
  }
}

const handleSearch = (e) => {
  searchQuery.value = e.detail.value
}

onMounted(() => {
  // Initial load
  if (props.conversations.length === 0) {
    messageStore.fetchConversations()
  }
})
</script>

<template>
  <view class="conversation-list">
    <!-- Search bar -->
    <view v-if="showSearch" class="search-bar">
      <view class="search-input">
        <image src="/static/images/search.png" mode="widthFix" class="search-icon" />
        <input
          type="text"
          :value="searchQuery"
          @input="handleSearch"
          placeholder="搜索联系人或群聊"
          confirm-type="search"
          class="search-input-field"
        />
      </view>
    </view>

    <!-- Conversation list -->
    <scroll-view
      scroll-y
      class="conversation-scroll"
      @scrolltolower="handleRefresh"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="handleRefresh"
    >
      <view v-if="filteredConversations.length === 0" class="empty-state">
        <image src="/static/images/empty-conversation.png" mode="widthFix" />
        <text>暂无会话</text>
      </view>

      <view
        v-for="conversation in filteredConversations"
        :key="conversation.id"
        class="conversation-item"
        @click="handleSelect(conversation)"
      >
        <!-- Avatar -->
        <view class="conversation-avatar">
          <image :src="getConversationAvatar(conversation)" mode="aspectFill" />
          <view v-if="conversation.unread_count > 0" class="unread-badge">
            {{ conversation.unread_count > 99 ? '99+' : conversation.unread_count }}
          </view>
        </view>

        <!-- Content -->
        <view class="conversation-content">
          <view class="conversation-header">
            <view class="conversation-name">
              {{ getConversationName(conversation) }}
            </view>
            <view class="conversation-time">
              {{ getLastMessageTime(conversation) }}
            </view>
          </view>
          <view class="conversation-preview">
            <view v-if="conversation.last_message_type === 'image'" class="message-type-indicator">
              [图片]
            </view>
            <view v-else-if="conversation.last_message_type === 'voice'" class="message-type-indicator">
              [语音]
            </view>
            <view v-else-if="conversation.last_message_type === 'file'" class="message-type-indicator">
              [文件]
            </view>
            <view v-else class="message-text">
              {{ conversation.last_message || ' ' }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
@import '../static/css/variables.scss';

.conversation-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;

  .search-bar {
    padding: 20rpx;
    background: #f8f8f8;

    .search-input {
      display: flex;
      align-items: center;
      background: #ffffff;
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

  .conversation-scroll {
    flex: 1;
    overflow-y: auto;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 40rpx;

      image {
        width: 200rpx;
        height: 200rpx;
        margin-bottom: 20rpx;
      }

      text {
        font-size: 28rpx;
        color: #999;
      }
    }

    .conversation-item {
      display: flex;
      align-items: center;
      padding: 20rpx;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;

      &:active {
        background: #f8f8f8;
      }

      .conversation-avatar {
        position: relative;
        width: 90rpx;
        height: 90rpx;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 20rpx;

        image {
          width: 100%;
          height: 100%;
        }

        .unread-badge {
          position: absolute;
          top: -10rpx;
          right: -10rpx;
          min-width: 30rpx;
          height: 30rpx;
          background: #ff4d4f;
          color: white;
          font-size: 20rpx;
          border-radius: 15rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6rpx;
        }
      }

      .conversation-content {
        flex: 1;
        overflow: hidden;

        .conversation-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8rpx;

          .conversation-name {
            font-size: 32rpx;
            font-weight: 500;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 70%;
          }

          .conversation-time {
            font-size: 24rpx;
            color: #999;
          }
        }

        .conversation-preview {
          display: flex;
          align-items: center;

          .message-type-indicator {
            font-size: 24rpx;
            color: #999;
            margin-right: 8rpx;
          }

          .message-text {
            font-size: 28rpx;
            color: #666;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
</style>