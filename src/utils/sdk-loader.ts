/**
 * SDK加载工具
 * 确保必要的SDK正确加载
 */

// 检查SDK是否已加载
export function checkSDKStatus() {
  const status = {
    cryptoJS: !!window.CryptoJSTest,
    speechRecognizer: !!window.WebAudioSpeechRecognizer,
    xmovAvatar: !!window.XmovAvatar
  }
  
  console.log('SDK加载状态:', status)
  return status
}

// 等待SDK加载
export function waitForSDK(sdkName: keyof ReturnType<typeof checkSDKStatus>, timeout = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const check = () => {
      const status = checkSDKStatus()
      
      if (status[sdkName]) {
        resolve(true)
        return
      }
      
      if (Date.now() - startTime > timeout) {
        console.error(`${sdkName} SDK加载超时`)
        resolve(false)
        return
      }
      
      setTimeout(check, 100)
    }
    
    check()
  })
}

// 动态加载SDK
export function loadSDK(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    const existingScript = document.querySelector(`script[src="${src}"]`)
    if (existingScript) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    
    document.head.appendChild(script)
  })
}

// 确保所有SDK加载完成
export async function ensureSDKsLoaded(): Promise<boolean> {
  try {
    // 尝试加载本地SDK
    await Promise.all([
      loadSDK('/cryptojs.js').catch(() => {
        console.warn('本地cryptojs.js加载失败，尝试CDN')
        return loadSDK('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js')
      }),
      loadSDK('/speechrecognizer.js'),
      loadSDK('https://media.xingyun3d.com/xingyun3d/general/litesdk/xmovAvatar.0.1.0-alpha.63.js')
    ])
    
    // 等待SDK初始化
    await Promise.all([
      waitForSDK('cryptoJS'),
      waitForSDK('speechRecognizer'),
      waitForSDK('xmovAvatar')
    ])
    
    console.log('所有SDK加载完成')
    return true
  } catch (error) {
    console.error('SDK加载失败:', error)
    return false
  }
}

// 检查运行环境
export function checkEnvironment() {
  // 检查安全上下文
  if (!window.isSecureContext) {
    const msg = '当前环境不安全（非 HTTPS 或 Localhost），导致 VideoDecoder API 不可用。请使用 http://localhost:7860 或启用 HTTPS 访问。'
    console.error(msg)
    alert(msg)
    return false
  }

  // 检查 VideoDecoder 支持
  if (typeof window.VideoDecoder === 'undefined') {
    const msg = '当前浏览器不支持 VideoDecoder API，虚拟人无法正常渲染。请使用最新版本的 Chrome 或 Edge 浏览器。'
    console.error(msg)
    alert(msg)
    return false
  }

  return true
}

// 初始化SDK
export async function initSDKs() {
  // 检查环境
  if (!checkEnvironment()) {
    return false
  }

  const loaded = await ensureSDKsLoaded()
  
  if (!loaded) {
    console.error('SDK初始化失败')
    return false
  }
  
  // 设置CryptoJS全局变量（如果使用CDN版本）
  if (!window.CryptoJSTest && window.CryptoJS) {
    window.CryptoJSTest = window.CryptoJS
  }
  
  return true
}
