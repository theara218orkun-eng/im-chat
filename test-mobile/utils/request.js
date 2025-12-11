import config from './config'
import { useUserStore } from '../store/user'

const request = (options) => {
  const userStore = useUserStore()
  const { baseUrl, endpoints } = config.development

  return new Promise((resolve, reject) => {
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

    const mergedOptions = { ...defaultOptions, ...options }

    if (userStore.token) {
      mergedOptions.header.Authorization = `Bearer ${userStore.token}`
    }

    if (endpoints[mergedOptions.url]) {
      mergedOptions.url = endpoints[mergedOptions.url]
    }

    const fullUrl = `${baseUrl}${mergedOptions.url}`

    uni.request({
      ...mergedOptions,
      url: fullUrl,
      success: (res) => {
        const { data, statusCode } = res

        if (statusCode >= 200 && statusCode < 300) {
          if (data.token) {
            userStore.setToken(data.token)
          }
          resolve(data)
        } else {
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
        reject(new Error(err.errMsg || 'Network request failed'))
      }
    })
  })
}

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
  }
}