<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { useMessageStore } from '../../store/message'
import { useUserStore } from '../../store/user'
import { useSocketStore } from '../../store/socket'
import MessageBubble from '../../components/MessageBubble.vue'
import ChatInput from '../../components/ChatInput.vue'

const messageStore = useMessageStore()
const userStore = useUserStore()
const socketStore = useSocketStore()

const conversationId = ref('')
const conversationType = ref('single')
const messages = ref([])
const isLoading = ref(true)
const hasMore = ref(true)
const inputHeight = ref(60)
const showScrollToBottom = ref(false)
const typingStatus = ref('')

onLoad((options) => {
  conversationId.value = options.conversationId || ''
  conversationType.value = options.type || 'single'
})

onMounted(async () => {
  await loadMessages()
  setupSocketListeners()

  // Scroll to bottom after messages load
  nextTick(() => {
    scrollToBottom()
  })
})

onShow(() => {
  // Mark conversation as read when shown
  if (conversationId.value) {
    messageStore.markConversationAsRead(conversationId.value)
  }
})

onHide(() => {
  // Send typing status - stopped when leaving
  if (conversationId.value) {
    socketStore.sendTypingStatus(conversationId.value, false)
  }
})

onUnmounted(() => {
  cleanupSocketListeners()
})

const loadMessages = async (reset = true) => {
  if (!conversationId.value) return

  try {
    isLoading.value = true
    await messageStore.fetchMessages(conversationId.value, reset)
    messages.value = messageStore.currentMessages
    hasMore.value = messageStore.hasMore

    // Scroll to bottom if reset, otherwise maintain position
    if (reset) {
      nextTick(() => {
        scrollToBottom()
      })
    }
  } catch (error) {
    console.error('Failed to load messages:', error)
    uni.showToast({
      title: '加载消息失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

const scrollToBottom = () => {
  uni.pageScrollTo({
    scrollTop: 99999,
    duration: 100
  })
}

const handleInputHeightChange = (height) => {
  inputHeight.value = height
}

const handleSendMessage = (content, type) => {
  if (!content || !conversationId.value) return

  messageStore.sendMessage(content, type, conversationId.value)
    .then(() => {
      // Scroll to bottom after sending
      nextTick(() => {
        scrollToBottom()
      })
    })
}

const handleResendMessage = (message) => {
  // Implement message resend logic
  messageStore.sendMessage(message.content, message.type, conversationId.value)
    .then(() => {
      // Remove the failed message or update its status
      const index = messages.value.findIndex(m => m.created_at === message.created_at)
      if (index !== -1) {
        messages.value.splice(index, 1)
      }
    })
}

const handleDownloadFile = (message) => {
  // Implement file download
  uni.showLoading({
    title: '下载中...'
  })

  uni.downloadFile({
    url: message.content,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: () => {
            uni.showToast({
              title: '下载成功',
              icon: 'success'
            })
          },
          fail: (err) => {
            console.error('Save failed:', err)
            uni.showToast({
              title: '保存失败',
              icon: 'none'
            })
          }
        })
      }
    },
    fail: (err) => {
      console.error('Download failed:', err)
      uni.showToast({
        title: '下载失败',
        icon: 'none'
      })
    },
    complete: () => {
      uni.hideLoading()
    }
  })
}

const loadMoreMessages = () => {
  if (isLoading.value || !hasMore.value) return

  loadMessages(false)
}

const setupSocketListeners = () => {
  // Listen for typing status updates
  // This would be implemented in the socket store
  console.log('Setting up socket listeners for conversation:', conversationId.value)
}

const cleanupSocketListeners = () => {
  // Clean up socket listeners
  console.log('Cleaning up socket listeners')
}

const getConversationTitle = () => {
  if (conversationType.value === 'group') {
    return messageStore.currentConversation?.group_name || '群聊'
  } else {
    return messageStore.currentConversation?.target_name || '聊天'
  }
}

const navigateBack = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="chat-container">
    <!-- Header -->
    <view class="chat-header">
      <view class="header-left" @click="navigateBack">
        <image src="/static/images/back.png" mode="widthFix" class="back-icon" />
      </view>
      <view class="header-title">
        {{ getConversationTitle() }}
      </view>
      <view class="header-right">
        <image src="/static/images/more.png" mode="widthFix" class="more-icon" />
      </view>
    </view>

    <!-- Messages list -->
    <scroll-view
      scroll-y
      class="messages-list"
      :style="{ bottom: `${inputHeight}px` }"
      @scrolltolower="loadMoreMessages"
      @scroll="handleScroll"
    >
      <!-- Loading indicator -->
      <view v-if="isLoading && messages.length === 0" class="loading-indicator">
        <image src="/static/images/loading.gif" mode="widthFix" class="loading-icon" />
        <text>加载中...</text>
      </view>

      <!-- Load more indicator -->
      <view v-if="hasMore && !isLoading" class="load-more" @click="loadMoreMessages">
        <text>加载更多消息</text>
      </view>

      <!-- Messages -->
      <view v-for="(message, index) in messages" :key="message.id || index">
        <MessageBubble
          :message="message"
          :show-time="shouldShowTime(index)"
          :show-avatar="shouldShowAvatar(index)"
          @resend="handleResendMessage"
          @download="handleDownloadFile"
        />
      </view>

      <!-- Typing indicator -->
      <view v-if="typingStatus" class="typing-indicator">
        <image src="/static/images/typing.gif" mode="widthFix" class="typing-icon" />
        <text>{{ typingStatus }}</text>
      </view>

      <!-- Scroll to bottom button -->
      <view v-if="showScrollToBottom" class="scroll-to-bottom" @click="scrollToBottom">
        <image src="/static/images/down.png" mode="widthFix" />
      </view>
    </scroll-view>

    <!-- Chat input -->
    <view class="chat-input-container">
      <ChatInput
        :conversation-id="conversationId"
        @send="handleSendMessage"
        @height-change="handleInputHeightChange"
      />
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    shouldShowTime(index) {
      if (index === 0) return true

      const currentMessage = this.messages[index]
      const previousMessage = this.messages[index - 1]

      // Show time if different sender or more than 5 minutes apart
      if (currentMessage.sender_id !== previousMessage.sender_id) return true

      const currentTime = new Date(currentMessage.created_at).getTime()
      const previousTime = new Date(previousMessage.created_at).getTime()

      return (currentTime - previousTime) > 5 * 60 * 1000
    },

    shouldShowAvatar(index) {
      if (index === 0) return true

      const currentMessage = this.messages[index]
      const previousMessage = this.messages[index - 1]

      // Show avatar if different sender or more than 5 minutes apart
      if (currentMessage.sender_id !== previousMessage.sender_id) return true

      const currentTime = new Date(currentMessage.created_at).getTime()
      const previousTime = new Date(previousMessage.created_at).getTime()

      return (currentTime - previousTime) > 5 * 60 * 1000
    },

    handleScroll(e) {
      // Show scroll to bottom button when scrolled up
      const scrollTop = e.detail.scrollTop
      const scrollHeight = e.detail.scrollHeight
      const clientHeight = e.detail.height

      showScrollToBottom.value = scrollTop < (scrollHeight - clientHeight - 100)
    }
  }
}
</script>

<style lang="scss">
@import '../../static/css/variables.scss';

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f8f8;

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 30rpx;
    background: #ffffff;
    border-bottom: 1px solid #f0f0f0;

    .header-left, .header-right {
      width: 50rpx;
      height: 50rpx;

      image {
        width: 100%;
        height: 100%;
      }
    }

    .header-title {
      flex: 1;
      text-align: center;
      font-size: 32rpx;
      font-weight: 500;
      margin: 0 20rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .messages-list {
    flex: 1;
    padding: 20rpx 0;
    overflow-y: auto;
    position: relative;

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40rpx;

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

    .load-more {
      text-align: center;
      padding: 20rpx;
      font-size: 24rpx;
      color: #999;
      background: #f0f0f0;
      border-radius: 10rpx;
      margin: 10rpx 20rpx;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 10rpx 20rpx;

      .typing-icon {
        width: 40rpx;
        height: 40rpx;
        margin-right: 10rpx;
      }

      text {
        font-size: 24rpx;
        color: #999;
      }
    }

    .scroll-to-bottom {
      position: fixed;
      bottom: 120rpx;
      right: 30rpx;
      width: 60rpx;
      height: 60rpx;
      background: $primary-color;
      border-radius: 30rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;

      image {
        width: 30rpx;
        height: 30rpx;
      }
    }
  }

  .chat-input-container {
    position: relative;
    z-index: 10;
  }
}
</style>