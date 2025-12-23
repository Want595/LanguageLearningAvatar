import { reactive, ref } from 'vue'
import type { AppState } from '../types'
import { APP_CONFIG } from '../constants'
import { delay, generateSSML } from '../utils'
import { avatarService } from '../services/avatar'
import { llmService } from '../services/llm'

// 应用状态
export const appState = reactive<AppState>({
  avatar: {
    appId: '', // 填入你的虚拟人 APP ID
    appSecret: '', // 填入你的虚拟人 APP Secret
    connected: false,
    instance: null
  },
  asr: {
    provider: 'tx',
    appId: '', // 填入你的腾讯云 ASR App ID
    secretId: '', // 填入你的腾讯云 Secret ID
    secretKey: '', // 填入你的腾讯云 Secret Key
    isListening: false
  },
  ui: {
    text: '',
    subTitleText: ''
  },
  chatHistory: [], // 初始化对话历史数组
  currentAIReply: '', // 初始化当前AI回复字段
  language: {
    selected: 'en' // 默认选择英语
  },
  
  learningMode: {
    selected: 'conversation' // 默认选择对话模式
  }
})

const MIN_SPLIT_LENGTH = 2 // 最小切分长度
const MAX_SPLIT_LENGTH = 20 // 最大切分长度
function splitSentence(text: string): string[] {
  if (!text) return []

  // 定义中文标点（不需要空格）
  const chinesePunctuations = new Set(['、', '，', '：', '；', '。', '？', '！', '…', '\n'])
  // 定义英文标点（需要后跟空格）
  const englishPunctuations = new Set([',', ':', ';', '.', '?', '!'])

  let count = 0
  let firstValidPunctAfterMin = -1 // 最小长度后第一个有效标点位置
  let forceBreakIndex = -1 // 强制切分位置
  let i = 0
  const n = text.length

  // 扫描文本直到达到最大长度或文本结束
  while (i < n && count < MAX_SPLIT_LENGTH) {
    const char = text[i]

    // 处理汉字
    if (char >= '\u4e00' && char <= '\u9fff') {
      count++
      // 记录达到最大长度时的位置
      if (count === MAX_SPLIT_LENGTH) {
        forceBreakIndex = i + 1 // 在汉字后切分
      }
      i++
    }
    // 处理数字序列
    else if (char >= '0' && char <= '9') {
      count++
      if (count === MAX_SPLIT_LENGTH) {
        forceBreakIndex = i + 1
      }
      i++
    }
    // 处理英文字母序列（单词）
    else if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
      // 扫描整个英文单词
      i++
      while (i < n && ((text[i] >= 'a' && text[i] <= 'z') || (text[i] >= 'A' && text[i] <= 'Z'))) {
        i++
      }
      count++
      if (count === MAX_SPLIT_LENGTH) {
        forceBreakIndex = i // 在单词后切分
      }
    }
    // 处理标点符号
    else {
      if (chinesePunctuations.has(char)) {
        // 达到最小长度后记录第一个有效中文标点
        if (count >= MIN_SPLIT_LENGTH && firstValidPunctAfterMin === -1) {
          firstValidPunctAfterMin = i
        }
        i++
      } else if (englishPunctuations.has(char)) {
        // 英文标点：检查后跟空格或结束
        if (i + 1 >= n || text[i + 1] === ' ') {
          // 达到最小长度后记录第一个有效英文标点
          if (count >= MIN_SPLIT_LENGTH && firstValidPunctAfterMin === -1) {
            firstValidPunctAfterMin = i
          }
        }
        i++
      } else {
        // 其他字符（如空格、符号等），跳过
        i++
      }
    }
  }

  // 确定切分位置
  let splitIndex = -1
  if (firstValidPunctAfterMin !== -1) {
    splitIndex = firstValidPunctAfterMin + 1
  } else if (forceBreakIndex !== -1) {
    splitIndex = forceBreakIndex
  }

  // 返回切分结果
  if (splitIndex > 0 && splitIndex < text.length) {
    return [text.substring(0, splitIndex), text.substring(splitIndex)]
  }
  
  return [text]
}

// 虚拟人状态
export const avatarState = ref('')

// Store类 - 业务逻辑处理
export class AppStore {
  /**
   * 初始化应用配置
   * @returns {Promise<void>} - 返回初始化结果的Promise
   * @throws {Error} - 当获取配置失败时抛出错误
   */
  async initConfig(): Promise<void> {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/config`)
    if (!response.ok) {
      throw new Error('获取应用配置失败')
    }
    const config = await response.json()
    appState.avatar.appId = config.appId
    appState.avatar.appSecret = config.appSecret
    appState.asr.appId = config.asrAppId
    appState.asr.secretId = config.asrSecretId
    appState.asr.secretKey = config.asrSecretKey
  }
  /**
   * 连接虚拟人
   * @returns {Promise<void>} - 返回连接结果的Promise
   * @throws {Error} - 当appId或appSecret为空或连接失败时抛出错误
   */
  async connectAvatar(): Promise<void> {
    await this.initConfig()
    try {
      const avatar = await avatarService.connect({
        onSubtitleOn: (text: string) => {
          appState.ui.subTitleText = text
        },
        onSubtitleOff: () => {
          appState.ui.subTitleText = ''
        },
        onStateChange: (state: string) => {
          avatarState.value = state
        }
      })

      appState.avatar.instance = avatar
      appState.avatar.connected = true
    } catch (error) {
      appState.avatar.connected = false
      throw error
    }
  }

  /**
   * 断开虚拟人连接
   * @returns {void}
   */
  disconnectAvatar(): void {
    if (appState.avatar.instance) {
      avatarService.disconnect(appState.avatar.instance)
      appState.avatar.instance = null
      appState.avatar.connected = false
      avatarState.value = ''
    }
  }

  /**
   * 发送消息到LLM并让虚拟人播报
   * @returns {Promise<string | undefined>} - 返回大语言模型的回复内容，失败时返回undefined
   * @throws {Error} - 当发送消息失败时抛出错误
   */
  async sendMessage(): Promise<string | undefined> {
    const { ui, avatar, language } = appState
    
    if (!ui.text || !avatar.instance) {
      return
    }

    try {
      // 将用户消息添加到对话历史
      appState.chatHistory.push({
        role: 'user',
        content: ui.text
      });

      // 发送到LLM获取回复
      const stream = await llmService.sendMessageWithStream(ui.text, language.selected)

      if (!stream) return

      // 等待虚拟人停止说话
      await this.waitForAvatarReady()

      // 流式播报响应内容
      let buffer = ''
      let isFirstChunk = true
      let fullResponse = ''
      
      // 清空当前AI回复
      appState.currentAIReply = ''
      
      for await (const chunk of stream) {
        buffer += chunk
        fullResponse += chunk
        
        // 更新当前AI回复
        appState.currentAIReply = fullResponse
        
        const arr = splitSentence(buffer)
        
        if(arr.length > 1) {
          const ssml = generateSSML(arr[0] || '')
          if (isFirstChunk) {
            // 第一句话：ssml true false
            avatar.instance.speak(ssml, true, false)
            isFirstChunk = false
          } else {
            // 中间的话：ssml false false
            avatar.instance.speak(ssml, false, false)
          }
          
          buffer = arr[1] || ''
        }   
      }

      // 处理剩余的字符
      if (buffer.length > 0) {
        const ssml = generateSSML(buffer)
        
        if (isFirstChunk) {
          // 第一句话：ssml true false
          avatar.instance.speak(ssml, true, false)
        } else {
          // 中间的话：ssml false false
          avatar.instance.speak(ssml, false, false)
        }
      }

      // 最后一句话：ssml false true
      const finalSsml = generateSSML('')
      avatar.instance.speak(finalSsml, false, true)

      // 将AI回复添加到对话历史
      appState.chatHistory.push({
        role: 'assistant',
        content: fullResponse
      });
      
      // 清空当前AI回复
      appState.currentAIReply = ''

      return fullResponse
    } catch (error) {
      console.error('发送消息失败:', error)
      // 清空当前AI回复
      appState.currentAIReply = ''
      throw error
    }
  }

  /**
   * 开始语音输入
   * @param callbacks - 回调函数集合
   * @param callbacks.onFinished - 语音识别完成回调
   * @param callbacks.onError - 语音识别错误回调
   * @returns {void}
   */
  startVoiceInput(_callbacks: {
    onFinished: (text: string) => void
    onError: (error: any) => void
  }): void {
    appState.asr.isListening = true
    // ASR逻辑由组件处理
  }

  /**
   * 停止语音输入
   * @returns {void}
   */
  stopVoiceInput(): void {
    appState.asr.isListening = false
  }

  /**
   * 等待虚拟人准备就绪（不在说话状态）
   * @returns {Promise<void>} - 返回等待完成的Promise
   */
  async waitForAvatarReady(): Promise<void> {
    if (avatarState.value === 'speak') {
      appState.avatar.instance.think()
      await delay(APP_CONFIG.SPEAK_INTERRUPT_DELAY)
    }
  }
}

// 导出单例
export const appStore = new AppStore()
