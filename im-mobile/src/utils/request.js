import config from './config'
import { useUserStore } from '../store/user'

// Create request instance
const request = (options) => {
  const userStore = useUserStore()
  const { baseUrl, endpoints } = config[process.env.NODE_ENV] || config.development

  return new Promise((resolve, reject) => {
    // Set default options
    const defaultOptions = {
      url: '',
      method: 'GET',
      data: {},
      header: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    }

    // Merge options
    const mergedOptions = { ...defaultOptions, ...options }

    // Add authentication token if available
    if (userStore.token) {
      mergedOptions.header.Authorization = `Bearer ${userStore.token}`
    }

    // Handle endpoint shortcuts
    if (endpoints[mergedOptions.url]) {
      mergedOptions.url = endpoints[mergedOptions.url]
    }

    // Full URL
    const fullUrl = `${baseUrl}${mergedOptions.url}`

    console.log(`[API] ${mergedOptions.method} ${fullUrl}`, mergedOptions.data)

    // Make the request
    uni.request({
      ...mergedOptions,
      url: fullUrl,
      success: (res) => {
        const { data, statusCode } = res

        if (statusCode >= 200 && statusCode < 300) {
          // Handle token refresh if needed
          if (data.token) {
            userStore.setToken(data.token)
          }
          resolve(data)
        } else {
          // Handle error responses
          if (statusCode === 401) {
            userStore.logout()
            uni.reLaunch({
              url: '/pages/login/index'
            })
          }
          reject(new Error(data.message || `Request failed with status ${statusCode}`))
        }
      },
      fail: (err) => {
        console.error('[API Error]', err)
        reject(new Error(err.errMsg || 'Network request failed'))
      }
    })
  })
}

// Export request methods
export default {
  get(url, data = {}, options = {}) {
    return request({ url, method: 'GET', data, ...options })
  },
  post(url, data = {}, options = {}) {
    return request({ url, method: 'POST', data, ...options })
  },
  put(url, data = {}, options = {}) {
    return request({ url, method: 'PUT', data, ...options })
  },
  delete(url, data = {}, options = {}) {
    return request({ url, method: 'DELETE', data, ...options })
  },
  upload(filePath, url, name = 'file', formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const { baseUrl } = config[process.env.NODE_ENV] || config.development
      const fullUrl = `${baseUrl}${endpoints[url] || url}`

      uni.uploadFile({
        url: fullUrl,
        filePath,
        name,
        formData,
        header: {
          Authorization: `Bearer ${useUserStore().token}`
        },
        ...options,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (e) {
              resolve(res.data)
            }
          } else {
            reject(new Error(res.data || 'Upload failed'))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || 'Upload failed'))
        }
      })
    })
  }
}