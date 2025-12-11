import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createUniApp } from '@dcloudio/uni-app'
import messages from './locales'

// Import global styles
import './static/css/main.css'

// Create Pinia store
const pinia = createPinia()

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages
})

export function createApp() {
  const app = createSSRApp(App)

  app.use(pinia)
  app.use(i18n)

  return {
    app,
    pinia,
    i18n
  }
}

// For H5 and other platforms
const { app } = createApp()
app.mount('#app')