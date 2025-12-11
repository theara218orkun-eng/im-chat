import { useUserStore } from '../store/user'

/**
 * Notification utilities for mobile app
 */

// Check notification permissions
export function checkNotificationPermissions() {
  return new Promise((resolve) => {
    const userStore = useUserStore()

    // Check if notifications are enabled in app settings
    if (!userStore.settings.notificationSound && !userStore.settings.vibration) {
      resolve({ enabled: false, reason: 'disabled_in_settings' })
      return
    }

    // For Android, check system permissions
    #ifdef APP-PLUS
    const main = plus.android.runtimeMainActivity()
    const NotificationManagerCompat = plus.android.importClass('androidx.core.app.NotificationManagerCompat')

    if (NotificationManagerCompat.from(main).areNotificationsEnabled()) {
      resolve({ enabled: true })
    } else {
      resolve({ enabled: false, reason: 'disabled_in_system' })
    }
    #endif

    // For iOS, we can't check programmatically, assume enabled
    #ifdef APP-PLUS && (IOS || IPHONE)
    resolve({ enabled: true })
    #endif

    // For H5, notifications are not supported
    #ifdef H5
    resolve({ enabled: false, reason: 'h5_not_supported' })
    #endif

    // Default fallback
    resolve({ enabled: true })
  })
}

// Request notification permissions
export function requestNotificationPermissions() {
  return new Promise((resolve) => {
    #ifdef APP-PLUS
    const main = plus.android.runtimeMainActivity()
    const Intent = plus.android.importClass('android.content.Intent')
    const Settings = plus.android.importClass('android.provider.Settings')

    // Open notification settings
    const intent = new Intent()
    intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
    intent.putExtra(Settings.EXTRA_APP_PACKAGE, main.getPackageName())
    main.startActivity(intent)

    resolve({ success: true })
    #endif

    #ifdef APP-PLUS && (IOS || IPHONE)
    // iOS doesn't have a direct way to request notification permissions programmatically
    // We need to show instructions to the user
    uni.showModal({
      title: '通知权限',
      content: '请前往设置 > 通知，开启IM Mobile的通知权限',
      showCancel: false,
      confirmText: '好的'
    })
    resolve({ success: true })
    #endif

    #ifdef H5
    uni.showToast({
      title: 'H5版本不支持通知',
      icon: 'none'
    })
    resolve({ success: false, reason: 'h5_not_supported' })
    #endif

    resolve({ success: true })
  })
}

// Show local notification
export function showLocalNotification(title, content, options = {}) {
  const userStore = useUserStore()

  // Check if notifications are enabled
  if (!userStore.settings.notificationSound && !userStore.settings.vibration) {
    return Promise.resolve({ success: false, reason: 'disabled_in_settings' })
  }

  return new Promise((resolve) => {
    #ifdef APP-PLUS
    const { id = Date.now(), sound = true, vibrate = true } = options

    // Create notification
    const ncm = plus.android.importClass('android.app.NotificationChannel')
    const nb = plus.android.importClass('android.app.Notification.Builder')
    const nm = plus.android.importClass('android.app.NotificationManager')
    const context = plus.android.runtimeMainActivity()

    // Create notification channel (for Android 8+)
    const channelId = 'im_mobile_messages'
    const channel = new ncm(channelId, '消息通知', nm.IMPORTANCE_DEFAULT)
    const notificationManager = context.getSystemService('notification')

    // Build notification
    const notification = new nb(context, channelId)
      .setContentTitle(title)
      .setContentText(content)
      .setSmallIcon('notification_icon') // You need to define this in your Android manifest
      .setAutoCancel(true)

    if (sound && userStore.settings.notificationSound) {
      notification.setSound(plus.android.importClass('android.net.Uri').parse('android.resource://' + context.getPackageName() + '/raw/notify'))
    }

    if (vibrate && userStore.settings.vibration) {
      notification.setVibrate([0, 300, 200, 300])
    }

    // Show notification
    notificationManager.notify(id, notification.build())

    resolve({ success: true })
    #endif

    #ifdef APP-PLUS && (IOS || IPHONE)
    // iOS local notification
    const UNUserNotificationCenter = plus.ios.importClass('UNUserNotificationCenter')
    const UNMutableNotificationContent = plus.ios.importClass('UNMutableNotificationContent')
    const UNTimeIntervalNotificationTrigger = plus.ios.importClass('UNTimeIntervalNotificationTrigger')
    const UNNotificationRequest = plus.ios.importClass('UNNotificationRequest')

    const center = UNUserNotificationCenter.currentNotificationCenter()

    center.requestAuthorizationWithOptionsCompletionHandler(
      7, // UNAuthorizationOptionBadges | UNAuthorizationOptionSound | UNAuthorizationOptionAlert
      (granted, error) => {
        if (granted) {
          const content = new UNMutableNotificationContent()
          content.setTitle(title)
          content.setBody(content)
          content.setSound(UNNotificationSound.defaultSound())

          if (userStore.settings.notificationSound) {
            content.setSound(UNNotificationSound.defaultSound())
          }

          const trigger = UNTimeIntervalNotificationTrigger.triggerWithTimeIntervalRepeats(1, false)
          const request = UNNotificationRequest.requestWithIdentifierContentTrigger(options.id || Date.now().toString(), content, trigger)

          center.addNotificationRequestWithCompletionHandler(request, (error) => {
            if (error) {
              resolve({ success: false, error: error.localizedDescription })
            } else {
              resolve({ success: true })
            }
          })
        } else {
          resolve({ success: false, reason: 'permission_denied' })
        }
      }
    )
    #endif

    #ifdef H5
    // For H5, use browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: content,
        icon: '/static/images/logo.png'
      })
      resolve({ success: true })
    } else {
      resolve({ success: false, reason: 'permission_denied' })
    }
    #endif

    // Default fallback - just show toast
    uni.showToast({
      title: content,
      icon: 'none'
    })
    resolve({ success: true })
  })
}

// Play notification sound
export function playNotificationSound() {
  const userStore = useUserStore()

  if (!userStore.settings.notificationSound) {
    return Promise.resolve({ success: false, reason: 'disabled_in_settings' })
  }

  return new Promise((resolve) => {
    const innerAudioContext = uni.createInnerAudioContext()
    innerAudioContext.src = '/static/audio/notify.mp3'

    innerAudioContext.onCanplay(() => {
      innerAudioContext.play()
      resolve({ success: true })
    })

    innerAudioContext.onError((err) => {
      console.error('Notification sound error:', err)
      resolve({ success: false, error: err })
    })
  })
}

// Vibrate device
export function vibrateDevice() {
  const userStore = useUserStore()

  if (!userStore.settings.vibration) {
    return Promise.resolve({ success: false, reason: 'disabled_in_settings' })
  }

  return new Promise((resolve) => {
    #ifdef APP-PLUS
    // Long vibration pattern
    plus.device.vibrate(300)
    resolve({ success: true })
    #endif

    #ifdef H5
    // Browser vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate(300)
      resolve({ success: true })
    } else {
      resolve({ success: false, reason: 'not_supported' })
    }
    #endif

    resolve({ success: true })
  })
}

// Check and request notification permissions if needed
export async function ensureNotificationPermissions() {
  const { enabled } = await checkNotificationPermissions()

  if (!enabled) {
    await requestNotificationPermissions()
    return await checkNotificationPermissions()
  }

  return { enabled: true }
}