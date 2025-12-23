// 虚拟人相关类型定义

export interface AvatarState {
  connected: boolean
  speaking: boolean
  thinking: boolean
}

// ASR相关类型定义
export interface AsrConfig {
  provider: 'tx' // 目前只支持腾讯云
  appId: string | number
  secretId: string
  secretKey: string
  vadSilenceTime?: number
}

export interface AsrCallbacks {
  onFinished: (text: string) => void
  onError: (error: any) => void
}

// LLM相关类型定义
export interface LlmConfig {
  provider?: string
  baseURL?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Store类型定义
export interface AppStore {
  initConfig(): Promise<void>
  connectAvatar(): Promise<void>
  disconnectAvatar(): void
  sendMessage(): Promise<string | undefined>
  startVoiceInput(callbacks: AsrCallbacks): void
  stopVoiceInput(): void
  waitForAvatarReady(): Promise<void>
}

// Store状态类型定义
export interface AppState {
  // 虚拟人配置
  avatar: {
    appId: string
    appSecret: string
    connected: boolean
    instance: any
  }
  
  // ASR配置
  asr: {
    provider: string
    appId: string | number
    secretId: string
    secretKey: string
    isListening: boolean
  }
  
  // UI状态
  ui: {
    text: string
    subTitleText: string
  }
  
  // 对话历史
  chatHistory: ChatMessage[]
  
  // 当前AI回复
  currentAIReply: string
  
  // 语言设置
  language: {
    selected: string // 当前选择的语言代码
  }
  
  // 学习模式设置
  learningMode: {
    selected: 'translation' | 'conversation' // 学习模式：翻译或对话
  }
}

// SDK事件类型定义
export interface SdkEvent {
  type: 'subtitle_on' | 'subtitle_off' | string
  text?: string
  [key: string]: any
}

// 全局窗口类型扩展
declare global {
  interface Window {
    XmovAvatar: any
    CryptoJSTest: any
    CryptoJS: any
    WebAudioSpeechRecognizer: any
    VideoDecoder: any
  }
}
