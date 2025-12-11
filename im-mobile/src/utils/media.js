import { useUserStore } from '../store/user'

/**
 * Media utilities for handling images, audio, video, and files
 */

// Capture or select image
export function captureImage(options = {}) {
  const {
    sourceType = ['album', 'camera'],
    count = 1,
    sizeType = ['original', 'compressed'],
    camera = 'back'
  } = options

  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType,
      sourceType,
      camera,
      success: (res) => {
        resolve(res.tempFilePaths)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '选择图片失败'))
      }
    })
  })
}

// Capture video
export function captureVideo(options = {}) {
  const {
    sourceType = ['album', 'camera'],
    maxDuration = 60,
    camera = 'back'
  } = options

  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType,
      maxDuration,
      camera,
      success: (res) => {
        resolve({
          tempFilePath: res.tempFilePath,
          duration: res.duration,
          size: res.size,
          width: res.width,
          height: res.height
        })
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '选择视频失败'))
      }
    })
  })
}

// Record audio
export function recordAudio(options = {}) {
  const {
    duration = 60000, // 60 seconds
    sampleRate = 44100,
    numberOfChannels = 1,
    encodeBitRate = 128000,
    format = 'mp3'
  } = options

  return new Promise((resolve, reject) => {
    const recorderManager = uni.getRecorderManager()

    recorderManager.onStart(() => {
      console.log('Recording started')
    })

    recorderManager.onError((err) => {
      console.error('Recording error:', err)
      reject(new Error(err.errMsg || '录音失败'))
    })

    recorderManager.onStop((res) => {
      if (res.duration < 1000) {
        reject(new Error('录音时间太短'))
        return
      }

      resolve({
        tempFilePath: res.tempFilePath,
        duration: res.duration,
        fileSize: res.fileSize
      })
    })

    recorderManager.start({
      duration,
      sampleRate,
      numberOfChannels,
      encodeBitRate,
      format
    })

    // Return stop function
    return {
      stop: () => {
        recorderManager.stop()
      }
    }
  })
}

// Play audio
export function playAudio(src, options = {}) {
  const {
    autoplay = true,
    loop = false,
    volume = 1.0
  } = options

  return new Promise((resolve, reject) => {
    const innerAudioContext = uni.createInnerAudioContext()

    innerAudioContext.autoplay = autoplay
    innerAudioContext.loop = loop
    innerAudioContext.volume = volume
    innerAudioContext.src = src

    innerAudioContext.onCanplay(() => {
      if (autoplay) {
        innerAudioContext.play()
      }
      resolve(innerAudioContext)
    })

    innerAudioContext.onError((err) => {
      console.error('Audio play error:', err)
      reject(new Error(err.errMsg || '播放失败'))
    })

    innerAudioContext.onEnded(() => {
      console.log('Audio playback ended')
    })
  })
}

// Select file
export function selectFile(options = {}) {
  const {
    count = 1,
    type = 'all',
    extension = []
  } = options

  return new Promise((resolve, reject) => {
    uni.chooseMessageFile({
      count,
      type,
      extension,
      success: (res) => {
        resolve(res.tempFiles.map(file => ({
          path: file.path,
          name: file.name,
          size: file.size,
          type: file.type
        })))
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '选择文件失败'))
      }
    })
  })
}

// Upload media file
export function uploadMedia(filePath, options = {}) {
  const userStore = useUserStore()
  const {
    url = '/common/api/upload',
    name = 'file',
    formData = {},
    header = {}
  } = options

  return new Promise((resolve, reject) => {
    if (!userStore.token) {
      reject(new Error('用户未登录'))
      return
    }

    uni.uploadFile({
      url: getApiUrl(url),
      filePath,
      name,
      formData: {
        ...formData,
        token: userStore.token
      },
      header: {
        ...header,
        Authorization: `Bearer ${userStore.token}`
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (e) {
            resolve(res.data)
          }
        } else {
          reject(new Error(res.data || '上传失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })
  })
}

// Get media URL
export function getMediaUrl(path) {
  if (!path) return '/static/images/default-media.png'

  if (path.startsWith('http')) return path

  // Check if it's a local file
  if (path.startsWith('/static/') || path.startsWith('static/')) {
    return path
  }

  // Assume it's an API URL
  return getApiUrl(`/common/api/media/${path}`)
}

// Get API URL
function getApiUrl(path) {
  const config = require('./config').default
  const { baseUrl } = config[process.env.NODE_ENV] || config.development
  return `${baseUrl}${path}`
}

// Compress image
export function compressImage(filePath, options = {}) {
  const {
    quality = 0.8,
    maxWidth = 1024,
    maxHeight = 1024
  } = options

  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success: (imageInfo) => {
        const { width, height } = imageInfo

        // Calculate new dimensions
        let newWidth = width
        let newHeight = height

        if (width > maxWidth) {
          newWidth = maxWidth
          newHeight = (height * maxWidth) / width
        }

        if (newHeight > maxHeight) {
          newHeight = maxHeight
          newWidth = (width * maxHeight) / height
        }

        // Create canvas
        const canvas = uni.createCanvasContext('compressCanvas')

        canvas.drawImage(filePath, 0, 0, newWidth, newHeight)
        canvas.draw(false, () => {
          uni.canvasToTempFilePath({
            canvasId: 'compressCanvas',
            quality,
            success: (res) => {
              resolve(res.tempFilePath)
            },
            fail: (err) => {
              reject(new Error(err.errMsg || '图片压缩失败'))
            }
          })
        })
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '获取图片信息失败'))
      }
    })
  })
}

// Get video thumbnail
export function getVideoThumbnail(filePath, options = {}) {
  const {
    time = 1, // seconds
    quality = 0.8
  } = options

  return new Promise((resolve, reject) => {
    const videoContext = uni.createVideoContext('videoThumbnail')

    videoContext.requestThumbnail({
      filePath,
      time,
      quality,
      success: (res) => {
        resolve(res.thumbTempFilePath)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '获取视频缩略图失败'))
      }
    })
  })
}

// Check media permissions
export function checkMediaPermissions() {
  return new Promise((resolve) => {
    #ifdef APP-PLUS
    const main = plus.android.runtimeMainActivity()
    const ContextCompat = plus.android.importClass('androidx.core.content.ContextCompat')
    const PackageManager = plus.android.importClass('android.content.pm.PackageManager')

    const cameraPermission = ContextCompat.checkSelfPermission(main, 'android.permission.CAMERA')
    const storagePermission = ContextCompat.checkSelfPermission(main, 'android.permission.READ_EXTERNAL_STORAGE')
    const recordPermission = ContextCompat.checkSelfPermission(main, 'android.permission.RECORD_AUDIO')

    const permissions = {
      camera: cameraPermission === PackageManager.PERMISSION_GRANTED,
      storage: storagePermission === PackageManager.PERMISSION_GRANTED,
      microphone: recordPermission === PackageManager.PERMISSION_GRANTED
    }

    resolve(permissions)
    #endif

    #ifdef APP-PLUS && (IOS || IPHONE)
    // iOS permissions are requested at runtime
    resolve({
      camera: true,
      storage: true,
      microphone: true
    })
    #endif

    #ifdef H5
    // H5 permissions are handled by browser
    resolve({
      camera: true,
      storage: true,
      microphone: true
    })
    #endif
  })
}

// Request media permissions
export function requestMediaPermissions() {
  return new Promise((resolve) => {
    #ifdef APP-PLUS
    const main = plus.android.runtimeMainActivity()
    const ActivityCompat = plus.android.importClass('androidx.core.app.ActivityCompat')

    ActivityCompat.requestPermissions(
      main,
      [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO'
      ],
      100
    )

    resolve({ success: true })
    #endif

    #ifdef APP-PLUS && (IOS || IPHONE)
    // iOS permissions are requested when using the features
    resolve({ success: true })
    #endif

    #ifdef H5
    // H5 permissions are handled by browser
    resolve({ success: true })
    #endif
  })
}