<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '../store/user'
import { useMessageStore } from '../store/message'
import { useSocketStore } from '../store/socket'

const props = defineProps({
  conversationId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['send', 'height-change'])

const userStore = useUserStore()
const messageStore = useMessageStore()
const socketStore = useSocketStore()

const message = ref('')
const isRecording = ref(false)
const recordingTimer = ref(null)
const recordingDuration = ref(0)
const inputHeight = ref(60)
const showMoreOptions = ref(false)
const showEmojiPicker = ref(false)

const inputStyle = computed(() => {
  return {
    height: `${inputHeight.value}px`,
    minHeight: '60px',
    maxHeight: '150px'
  }
})

const canSend = computed(() => {
  return message.value.trim().length > 0
})

const handleInput = (e) => {
  message.value = e.detail.value
  adjustInputHeight()
}

const adjustInputHeight = () => {
  // This would be more sophisticated in a real implementation
  const lines = message.value.split('\n').length
  const newHeight = Math.min(60 + (lines - 1) * 20, 150)
  if (newHeight !== inputHeight.value) {
    inputHeight.value = newHeight
    emit('height-change', newHeight)
  }
}

const sendMessage = () => {
  if (!canSend.value) return

  const content = message.value.trim()
  if (!content) return

  // Send typing status - stopped
  socketStore.sendTypingStatus(props.conversationId, false)

  // Send message
  messageStore.sendMessage(content, 'text', props.conversationId)
    .then(() => {
      message.value = ''
      inputHeight.value = 60
      emit('height-change', 60)
    })
    .catch(error => {
      console.error('Failed to send message:', error)
      uni.showToast({
        title: '发送失败',
        icon: 'none'
      })
    })
}

const startRecording = () => {
  isRecording.value = true
  recordingDuration.value = 0

  // Start recording timer
  recordingTimer.value = setInterval(() => {
    recordingDuration.value++
  }, 1000)

  // Start voice recording
  uni.startRecord({
    success: (res) => {
      const { tempFilePath, duration } = res
      sendVoiceMessage(tempFilePath, duration)
    },
    fail: (err) => {
      console.error('Recording failed:', err)
      uni.showToast({
        title: '录音失败',
        icon: 'none'
      })
    }
  })
}

const stopRecording = () => {
  if (!isRecording.value) return

  clearInterval(recordingTimer.value)
  isRecording.value = false

  uni.stopRecord()
}

const sendVoiceMessage = (filePath, duration) => {
  // Upload voice file
  messageStore.sendMessage(filePath, 'voice', props.conversationId, {
    duration: Math.ceil(duration / 1000)
  })
}

const toggleMoreOptions = () => {
  showMoreOptions.value = !showMoreOptions.value
  showEmojiPicker.value = false
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
  showMoreOptions.value = false
}

const selectEmoji = (emoji) => {
  message.value += emoji
  showEmojiPicker.value = false
  adjustInputHeight()
}

const sendImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      messageStore.sendMessage(tempFilePath, 'image', props.conversationId)
    }
  })
}

const sendFile = () => {
  uni.chooseMessageFile({
    count: 1,
    type: 'all',
    success: (res) => {
      const tempFilePath = res.tempFiles[0].path
      messageStore.sendMessage(tempFilePath, 'file', props.conversationId, {
        name: res.tempFiles[0].name,
        size: formatFileSize(res.tempFiles[0].size)
      })
    }
  })
}

const formatFileSize = (size) => {
  if (size < 1024) return size + 'B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + 'KB'
  return (size / (1024 * 1024)).toFixed(2) + 'MB'
}

const handleInputFocus = () => {
  // Send typing status when user starts typing
  socketStore.sendTypingStatus(props.conversationId, true)
}

const handleInputBlur = () => {
  // Send typing status - stopped when input loses focus
  socketStore.sendTypingStatus(props.conversationId, false)
}

// Watch for message changes to send typing status
watch(() => message.value, (newVal) => {
  if (newVal.trim().length > 0) {
    socketStore.sendTypingStatus(props.conversationId, true)
  }
})
</script>

<template>
  <view class="chat-input-container" :style="{ height: `${inputHeight + (showMoreOptions || showEmojiPicker ? 200 : 0)}px` }">
    <!-- More options panel -->
    <view v-if="showMoreOptions" class="more-options">
      <view class="options-grid">
        <view class="option-item" @click="sendImage">
          <image src="/static/images/image.png" mode="widthFix" />
          <text>图片</text>
        </view>
        <view class="option-item" @click="startRecording">
          <image src="/static/images/voice.png" mode="widthFix" />
          <text>语音</text>
        </view>
        <view class="option-item" @click="sendFile">
          <image src="/static/images/file.png" mode="widthFix" />
          <text>文件</text>
        </view>
        <view class="option-item">
          <image src="/static/images/camera.png" mode="widthFix" />
          <text>拍摄</text>
        </view>
      </view>
    </view>

    <!-- Emoji picker -->
    <view v-if="showEmojiPicker" class="emoji-picker">
      <scroll-view scroll-y class="emoji-scroll">
        <view class="emoji-grid">
          <view
            v-for="emoji in ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🤗', '🤔', '🤨', '😐', '😑', '😶', '😶‍🌫️', '😏', '😒', '😓', '😔', '😕', '🙂', '🙃', '😖', '😞', '😟', '😤', '😥', '😦', '😧', '😨', '😩', '🤯', '😵', '😵‍💫', '😴', '😪', '🤠', '😌', '😛', '😜', '🤪', '😝', '🤑', '🤓', '🤫', '🤭', '🫢', '🫣', '🫤', '🫥', '🫦', '🫧', '🫨', '😇', '🙈', '🙉', '🙊', '🤐', '🤨', '😒', '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚', '😛', '😜', '😝', '😞', '😟', '😠', '😡', '😢', '😣', '😤', '😥', '😦', '😧', '😨', '😩', '😪', '😫', '😬', '😭', '😮', '😯', '😲', '😳', '😴', '😵', '😶', '😷', '😸', '😹', '😺', '😻', '😼', '😽', '😾', '😿', '🙀', '🙁', '🙂', '🙃']"
            :key="emoji"
            @click="selectEmoji(emoji)"
          >
            {{ emoji }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Main input area -->
    <view class="input-area">
      <!-- Voice recording button -->
      <view v-if="isRecording" class="recording-indicator" @click="stopRecording">
        <view class="recording-icon">
          <image src="/static/images/voice-recording.gif" mode="widthFix" />
        </view>
        <view class="recording-text">
          {{ recordingDuration }}"
        </view>
        <view class="recording-cancel" @click.stop="stopRecording">
          取消
        </view>
      </view>

      <!-- Regular input -->
      <view v-else class="input-wrapper">
        <view class="input-icons">
          <view class="icon-btn" @click="toggleMoreOptions">
            <image src="/static/images/add.png" mode="widthFix" />
          </view>
          <view class="icon-btn" @click="toggleEmojiPicker">
            <image src="/static/images/emoji.png" mode="widthFix" />
          </view>
        </view>

        <textarea
          v-model="message"
          class="message-input"
          :style="inputStyle"
          placeholder="输入消息..."
          auto-height
          cursor-spacing="10"
          @input="handleInput"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @confirm="sendMessage"
          confirm-type="send"
          confirm-hold
          :hold-keyboard="true"
        />

        <view class="send-btn" :class="{ 'active': canSend }" @click="sendMessage">
          发送
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import '../static/css/variables.scss';

.chat-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top: 1px solid #eeeeee;
  transition: height 0.3s;
  z-index: 100;

  .more-options {
    height: 200rpx;
    background: #f8f8f8;
    padding: 20rpx;

    .options-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20rpx;
      height: 100%;

      .option-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        image {
          width: 60rpx;
          height: 60rpx;
          margin-bottom: 10rpx;
        }

        text {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
  }

  .emoji-picker {
    height: 200rpx;
    background: #f8f8f8;
    padding: 10rpx;

    .emoji-scroll {
      height: 100%;

      .emoji-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 10rpx;

        view {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40rpx;
          height: 60rpx;
        }
      }
    }
  }

  .input-area {
    display: flex;
    align-items: flex-end;
    padding: 10rpx 20rpx;
    min-height: 60rpx;

    .recording-indicator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 10rpx 20rpx;
      background: #f0f0f0;
      border-radius: 30rpx;

      .recording-icon {
        width: 40rpx;
        height: 40rpx;

        image {
          width: 100%;
          height: 100%;
        }
      }

      .recording-text {
        flex: 1;
        text-align: center;
        font-size: 28rpx;
        color: #333;
      }

      .recording-cancel {
        font-size: 28rpx;
        color: $primary-color;
      }
    }

    .input-wrapper {
      display: flex;
      align-items: flex-end;
      width: 100%;

      .input-icons {
        display: flex;
        align-items: flex-end;
        margin-right: 10rpx;

        .icon-btn {
          width: 50rpx;
          height: 50rpx;
          margin-bottom: 5rpx;

          image {
            width: 100%;
            height: 100%;
          }
        }
      }

      .message-input {
        flex: 1;
        min-height: 60rpx;
        max-height: 150rpx;
        padding: 10rpx 15rpx;
        background: #f8f8f8;
        border-radius: 30rpx;
        font-size: 28rpx;
        line-height: 1.4;
        overflow-y: auto;
      }

      .send-btn {
        margin-left: 10rpx;
        padding: 10rpx 20rpx;
        font-size: 28rpx;
        color: #999;
        transition: color 0.2s;

        &.active {
          color: $primary-color;
        }
      }
    }
  }
}
</style>