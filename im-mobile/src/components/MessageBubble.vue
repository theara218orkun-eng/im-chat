<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/user'
import { formatTime } from '../utils/helpers'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  showTime: {
    type: Boolean,
    default: false
  },
  showAvatar: {
    type: Boolean,
    default: false
  }
})

const userStore = useUserStore()

const isCurrentUser = computed(() => props.message.sender_id === userStore.userId)
const messageTime = computed(() => formatTime(props.message.created_at))
const messageStatus = computed(() => {
  if (props.message.status === 'sending') return '发送中...'
  if (props.message.status === 'failed') return '发送失败'
  if (props.message.read_at) return '已读'
  return ''
})

const bubbleClass = computed(() => {
  return {
    'message-bubble': true,
    'current-user': isCurrentUser.value,
    'other-user': !isCurrentUser.value,
    'text-message': props.message.type === 'text',
    'image-message': props.message.type === 'image',
    'voice-message': props.message.type === 'voice',
    'video-message': props.message.type === 'video',
    'file-message': props.message.type === 'file',
    'system-message': props.message.type === 'system'
  }
})

const handleResend = () => {
  emit('resend', props.message)
}

const handleImagePreview = () => {
  if (props.message.type === 'image') {
    uni.previewImage({
      urls: [props.message.content],
      current: props.message.content
    })
  }
}

const handleVoicePlay = () => {
  if (props.message.type === 'voice') {
    const innerAudioContext = uni.createInnerAudioContext()
    innerAudioContext.src = props.message.content
    innerAudioContext.play()
  }
}
</script>

<template>
  <view :class="bubbleClass">
    <!-- Time stamp -->
    <view v-if="showTime" class="message-time">
      {{ messageTime }}
    </view>

    <!-- Avatar -->
    <view v-if="showAvatar && !isCurrentUser" class="message-avatar">
      <image :src="message.sender_avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
    </view>

    <!-- Message content -->
    <view class="message-content">
      <!-- Text message -->
      <template v-if="message.type === 'text'">
        <view class="text-content">
          {{ message.content }}
        </view>
      </template>

      <!-- Image message -->
      <template v-if="message.type === 'image'">
        <image
          :src="message.content"
          mode="aspectFill"
          class="image-content"
          @click="handleImagePreview"
        />
      </template>

      <!-- Voice message -->
      <template v-if="message.type === 'voice'">
        <view class="voice-content" @click="handleVoicePlay">
          <view class="voice-icon">
            <image
              :src="isCurrentUser ? '/static/images/voice-right.png' : '/static/images/voice-left.png'"
              mode="widthFix"
            />
          </view>
          <view class="voice-duration">
            {{ message.duration || '0' }}"
          </view>
        </view>
      </template>

      <!-- Video message -->
      <template v-if="message.type === 'video'">
        <view class="video-content">
          <video
            :src="message.content"
            controls
            class="video-player"
          />
          <view class="video-cover">
            <image :src="message.cover" mode="aspectFill" />
            <view class="play-icon">
              <image src="/static/images/play.png" mode="widthFix" />
            </view>
          </view>
        </view>
      </template>

      <!-- File message -->
      <template v-if="message.type === 'file'">
        <view class="file-content">
          <view class="file-icon">
            <image src="/static/images/file.png" mode="widthFix" />
          </view>
          <view class="file-info">
            <view class="file-name">{{ message.name }}</view>
            <view class="file-size">{{ message.size }}</view>
          </view>
          <view class="file-action">
            <button size="mini" @click="$emit('download', message)">下载</button>
          </view>
        </view>
      </template>

      <!-- System message -->
      <template v-if="message.type === 'system'">
        <view class="system-content">
          {{ message.content }}
        </view>
      </template>
    </view>

    <!-- Status -->
    <view v-if="isCurrentUser && message.status" class="message-status">
      {{ messageStatus }}
      <text v-if="message.status === 'failed'" class="resend-btn" @click="handleResend">重发</text>
    </view>

    <!-- Avatar for current user -->
    <view v-if="showAvatar && isCurrentUser" class="message-avatar">
      <image :src="userStore.avatar || '/static/images/default-avatar.png'" mode="aspectFill" />
    </view>
  </view>
</template>

<style lang="scss">
@import '../static/css/variables.scss';

.message-bubble {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
  padding: 0 24rpx;
  width: 100%;
  box-sizing: border-box;

  &.current-user {
    flex-direction: row-reverse;
  }

  .message-time {
    font-size: 24rpx;
    color: #999;
    text-align: center;
    margin-bottom: 10rpx;
    width: 100%;
  }

  .message-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 20rpx;

    image {
      width: 100%;
      height: 100%;
    }
  }

  .message-content {
    max-width: 70%;
    position: relative;

    .text-content {
      padding: 20rpx;
      border-radius: 16rpx;
      font-size: 30rpx;
      line-height: 1.5;
      word-break: break-word;
    }

    .image-content {
      width: 400rpx;
      height: 400rpx;
      border-radius: 12rpx;
    }

    .voice-content {
      display: flex;
      align-items: center;
      padding: 20rpx;
      border-radius: 16rpx;

      .voice-icon {
        width: 40rpx;
        height: 40rpx;
        margin-right: 10rpx;

        image {
          width: 100%;
          height: 100%;
        }
      }

      .voice-duration {
        font-size: 28rpx;
        color: #666;
      }
    }

    .video-content {
      position: relative;
      width: 400rpx;
      height: 400rpx;
      border-radius: 12rpx;
      overflow: hidden;

      .video-player {
        width: 100%;
        height: 100%;
      }

      .video-cover {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);

        image {
          width: 100%;
          height: 100%;
        }

        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80rpx;
          height: 80rpx;
        }
      }
    }

    .file-content {
      display: flex;
      align-items: center;
      padding: 20rpx;
      border-radius: 16rpx;
      background: #f8f8f8;

      .file-icon {
        width: 60rpx;
        height: 60rpx;
        margin-right: 16rpx;

        image {
          width: 100%;
          height: 100%;
        }
      }

      .file-info {
        flex: 1;
        overflow: hidden;

        .file-name {
          font-size: 28rpx;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 24rpx;
          color: #999;
        }
      }

      .file-action {
        margin-left: 16rpx;
      }
    }

    .system-content {
      padding: 10rpx 20rpx;
      border-radius: 8rpx;
      font-size: 24rpx;
      color: #999;
      text-align: center;
      background: #f0f0f0;
    }
  }

  .message-status {
    font-size: 24rpx;
    color: #999;
    margin-left: 16rpx;
    display: flex;
    align-items: center;

    .resend-btn {
      color: $primary-color;
      margin-left: 8rpx;
    }
  }
}

// Current user styles
.current-user {
  .message-content {
    .text-content,
    .voice-content,
    .file-content {
      background: $primary-color;
      color: white;

      .voice-duration,
      .file-name,
      .file-size {
        color: white;
      }
    }
  }

  .message-status {
    color: #999;
  }
}

// Other user styles
.other-user {
  .message-content {
    .text-content,
    .voice-content,
    .file-content {
      background: #f8f8f8;
      color: #333;
    }
  }
}
</style>