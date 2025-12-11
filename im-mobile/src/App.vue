<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from './store/user'
import { useSocketStore } from './store/socket'

const userStore = useUserStore()
const socketStore = useSocketStore()

onLaunch(() => {
  console.log('App Launch')
  // Initialize app
  userStore.init()
})

onShow(() => {
  console.log('App Show')
  // Reconnect socket if needed
  if (userStore.isLoggedIn) {
    socketStore.connect()
  }
})

onHide(() => {
  console.log('App Hide')
  // Disconnect socket when app goes to background
  socketStore.disconnect()
})
</script>

<template>
  <view class="app-container">
    <router-view />
  </view>
</template>

<style lang="scss">
@import './static/css/variables.scss';

.app-container {
  width: 100%;
  height: 100%;
  background-color: $bg-color;
  font-family: $font-family;
}
</style>