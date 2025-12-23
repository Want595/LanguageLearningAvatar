import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initSDKs, checkSDKStatus } from './utils/sdk-loader'
import { appStore } from './stores/app'

// 初始化应用
async function initApp() {
  console.log('开始初始化应用...')
  
  // 初始化SDK
  const sdkLoaded = await initSDKs()
  
  if (sdkLoaded) {
    console.log('SDK初始化成功')
    checkSDKStatus()
  } else {
    console.error('SDK初始化失败，应用可能无法正常工作')
  }
  
  // 创建Vue应用
  const app = createApp(App)
  app.mount('#app')
  
  console.log('应用初始化完成')

  try {
    await appStore.connectAvatar()
  } catch (e) {
    console.error('自动连接失败:', e)
  }
}

// 启动应用
initApp().catch(error => {
  console.error('应用初始化失败:', error)
})
