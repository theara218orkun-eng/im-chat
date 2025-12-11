import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

// Create Pinia store
const pinia = createPinia()

export function createApp() {
  const app = createSSRApp(App)

  app.use(pinia)

  return {
    app,
    pinia
  }
}

// For H5 and other platforms
const { app } = createApp()
app.mount('#app')