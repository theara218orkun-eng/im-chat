import axios from 'axios'
import {
    Message,
    MessageBox
} from 'element-ui'
import {
    removeAuth
} from '@/utils/auth'
import qs from 'qs'
import { debounce } from 'throttle-debounce'
import router from '../router'
import Lockr from 'lockr'

/**
 * 检查dom是否忽略
 * @param {*} e
 */
const clearCacheEnterLogin = debounce(500, () => {
    removeAuth().then(() => {
        location.reload() // 为了重新实例化vue-router对象 避免bug
    }).catch(() => {
        location.reload()
    })

})

const errorMessage = debounce(500, (message, type = 'error') => {
    Message({
        message: message,
        duration: 1500,
        type: type
    })
})

const confirmMessage = debounce(1000, (message) => {
    MessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        showCancelButton: false,
        type: 'warning'
    }).then(() => {
        clearCacheEnterLogin()
    }).catch(() => {})
})

axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'

// Get base URL from environment variable
let apiUrl = process.env.VUE_APP_BASE_API;

// If in production, use the current host, otherwise use the VUE_APP_BASE_API
if (process.env.NODE_ENV === 'production') {
    apiUrl = `${window.location.protocol}//${window.location.host}`;
} else {
    // Ensure the development API URL has the correct protocol
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
        apiUrl = `http://${apiUrl}`; // Default to http for development
    }
}

// Remove any trailing slashes
apiUrl = apiUrl.replace(/\/+$/, '');

window.BASE_URL = apiUrl;
const service = axios.create({
    baseURL: apiUrl, // api 的 base_url
    timeout: 60000 // 请求超时时间
})
// request拦截器
service.interceptors.request.use(
    config => {
        const sessionId = Lockr.get('sessionId');
        const authToken = Lockr.get('authToken');
        if (sessionId && authToken) {
            config.headers['sessionId'] = sessionId;
            config.headers['Authorization'] = authToken;
        }

        // Determine the Content-Type.
        // An explicit header on the request (e.g., for file uploads) takes precedence.
        let contentType = config.headers['Content-Type'];
        if (!contentType && config.method.toLowerCase() === 'post') {
            // If not set, use the axios default for POST requests.
            contentType = axios.defaults.headers.post['Content-Type'];
        }

        // Process data based on Content-Type.
        if (contentType && contentType.includes('application/json')) {
            // For JSON requests, if data is missing, send an empty object
            // to prevent errors from empty request bodies.
            if (config.data === undefined || config.data === null) {
                config.data = {};
            }
        } else if (contentType && contentType.includes('multipart/form-data')) {
            // For multipart/form-data (file uploads), do not modify the data.
            // It is already in the correct FormData format.
        } else {
            // For all other cases, including the old default 'application/x-www-form-urlencoded',
            // stringify the data.
            config.data = qs.stringify(config.data);
        }

        return config
    },
    error => {
        // Do something with request error
        return Promise.reject(error)
    }
)

// response 拦截器
service.interceptors.response.use(
    response => {
        /**
         * code为非20000是抛错 可结合自己业务进行修改
         */
        const res = response.data
        if (response.status === 200 && response.config.responseType === 'blob') { // 文件类型特殊处理
            if (response.headers['content-disposition'] || (response.headers['content-type'] && response.headers['content-type'].indexOf('application/pdf') != -1)) {
                return response
            } else {
                const resultBlob = new Blob([response.data], { type: 'application/json' })
                const fr = new FileReader()
                fr.onload = function() {
                    const result = JSON.parse(this.result)
                    if (result.msg) {
                        errorMessage(result.msg, result.code == 1 ? 'success' : 'error')
                    }
                }
                fr.readAsText(resultBlob)
            }
        } else if (res.code !== 0) {
            // 302\t登录已失效
            if (res.code === -1) {
                confirmMessage(res.msg)
            }else if([400, 402, 403, 404, 405, 502, 500].includes(res.code)) {
                errorMessage(res.msg, 'warning')
            } else {
                errorMessage(res.msg)
            }
            return res;
        } else {
            return res
        }
    },
    error => {
        if (error.response) {
            const response = error.response
            if (response.status == 500) {
                errorMessage('服务器返回错误，请检查！')
            } else if (response.data && response.data.msg) {
                errorMessage(response.data.msg)
            }
        }
        return Promise.reject(error)
    }
)

export default service