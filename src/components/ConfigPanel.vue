<template>
  <div class="config-panel">

    <!-- 对话历史 -->
    <section class="history-section">
      <h3 class="section-title">对话历史</h3>
      <div class="history-container">
        <div 
          v-for="(message, index) in appState.chatHistory" 
          :key="index"
          :class="['message-item', message.role]"
        >
          <div class="message-content">{{ message.content }}</div>
        </div>
        <div v-if="appState.chatHistory.length === 0" class="empty-history">
          暂无对话历史
        </div>
      </div>
    </section>

    <!-- 消息交互 -->
    <section class="message-section">
      <h3 class="section-title">消息交互</h3>
      
      <!-- 学习内容和语言选择 -->
      <div class="form-row">
        <div class="form-group-inline">
          <label>学习内容</label>
          <select v-model="selectedLearningMode" @change="handleLearningModeChange">
            <option value="translation">翻译</option>
            <option value="conversation">对话</option>
          </select>
        </div>
        
        <div class="form-group-inline">
          <label>学习语言</label>
          <select v-model="selectedLanguage" @change="handleLanguageChange">
            <option value="en">英语</option>
            <option value="zh">中文</option>
            <option value="ja">日语</option>
            <option value="ko">韩语</option>
            <option value="fr">法语</option>
            <option value="de">德语</option>
            <option value="es">西班牙语</option>
          </select>
        </div>
      </div>
      
      <div class="form-group">
        <label>输入消息</label>
        <textarea 
          v-model="appState.ui.text" 
          rows="4" 
          placeholder="请输入您的消息..."
        />
      </div>
      
      <div class="button-group">
        <button 
          @click="handleVoiceInput" 
          :disabled="!appState.avatar.connected || appState.asr.isListening"
          class="btn btn-voice"
        >
          {{ appState.asr.isListening ? '正在听...' : '语音输入' }}
        </button>
        
        <button 
          @click="handleSendMessage" 
          :disabled="!appState.avatar.connected || !appState.ui.text.trim() || isSending"
          class="btn btn-primary"
        >
          {{ isSending ? '发送中...' : '发送' }}
        </button>

        <button 
          @click="handleClearHistory" 
          :disabled="appState.chatHistory.length === 0"
          class="btn btn-secondary"
        >
          清空
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, watch } from 'vue'
import { useAsr } from '../composables/useAsr'
import type { AppState, AppStore } from '../types'
import { generateSSML } from '../utils'

const appState = inject<AppState>('appState')!
const appStore = inject<AppStore>('appStore')!

const isSending = ref(false)
const selectedLanguage = ref(appState.language.selected) // 从应用状态获取默认语言
const selectedLearningMode = ref(appState.learningMode.selected) // 从应用状态获取默认学习模式
let currentAsr: ReturnType<typeof useAsr> | null = null

// 监听应用状态中的语言变化
watch(() => appState.language.selected, (newLang) => {
  selectedLanguage.value = newLang
})

// 监听应用状态中的学习模式变化
watch(() => appState.learningMode.selected, (newMode) => {
  selectedLearningMode.value = newMode
})

// 语言选择变更处理
function handleLanguageChange() {
  // 更新应用状态中的语言选择
  appState.language.selected = selectedLanguage.value
  console.log('语言已切换到:', selectedLanguage.value)
}

// 学习模式变更处理
function handleLearningModeChange() {
  // 更新应用状态中的学习模式选择
  appState.learningMode.selected = selectedLearningMode.value
  console.log('学习模式已切换到:', selectedLearningMode.value)
}

function handleClearHistory() {
  if (confirm('确定要清空所有对话记录吗？')) {
    // 假设 chatHistory 是一个数组，直接赋值为空数组来清空
    // 如果它是通过 reactive 创建的数组，可能需要使用 splice
    if (Array.isArray(appState.chatHistory)) {
      appState.chatHistory.splice(0, appState.chatHistory.length)
    } else {
      // 兼容其他可能的情况
      ;(appState.chatHistory as any).length = 0
    }
  }
}

function handleVoiceInput() {
  if (appState.asr.isListening) {
    currentAsr?.stop()
    appStore.stopVoiceInput()
    return
  }

  const { appId, secretId, secretKey } = appState.asr
  const needInit = !appId || !secretId || !secretKey
  const ensureConfig = needInit ? appStore.initConfig() : Promise.resolve()

  ensureConfig.then(() => {
    const { appId, secretId, secretKey } = appState.asr
    if (!appId || !secretId || !secretKey) {
      alert('后端ASR配置缺失，请检查服务器环境变量')
      return
    }

    currentAsr = useAsr({
      provider: 'tx',
      appId: appId,
      secretId: secretId,
      secretKey: secretKey
    })

    appStore.startVoiceInput({
      onFinished: (text: string) => {
        appState.ui.text = text
        currentAsr?.stop()
        appStore.stopVoiceInput()
      },
      onError: (error: any) => {
        console.error('语音识别错误:', error)
        currentAsr?.stop()
        appStore.stopVoiceInput()
      }
    })

    currentAsr.start({
      onFinished: (text: string) => {
        appState.ui.text = text
        appStore.stopVoiceInput()
      },
      onError: (error: any) => {
        console.error('语音识别错误:', error)
        appStore.stopVoiceInput()
      }
    })
  })
}

async function handleSendMessage() {
  if (isSending.value || !appState.ui.text.trim()) return
  isSending.value = true
  
  try {
    // 根据学习模式执行不同操作
    if (appState.learningMode.selected === 'translation') {
      // 翻译模式：调用翻译API
      await handleTranslation()
    } else {
      // 对话模式：使用现有逻辑
      await appStore.sendMessage()
    }
    
    appState.ui.text = ''
  } catch (error) {
    console.error('发送消息失败:', error)
    alert('发送消息失败')
  } finally {
    isSending.value = false
  }
}

/**
 * 处理翻译请求
 */
async function handleTranslation() {
  const { ui, language, avatar } = appState
  if (!ui.text) return

  try {
    // 将用户消息添加到对话历史
    appState.chatHistory.push({
      role: 'user',
      content: `翻译请求: ${ui.text}`
    })

    // 构造翻译提示词
    const languageMap: Record<string, string> = {
      'en': '英语',
      'zh': '中文',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语'
    }

    const targetLanguage = languageMap[language.selected] || '英语'
    
    // 调用现有的聊天接口进行翻译
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `请将以下内容翻译成${targetLanguage}:\n\n${ui.text}`,
        language: 'zh' // 使用中文作为基础语言来请求翻译
      })
    })

    if (!response.ok) {
      throw new Error(`翻译请求失败: ${response.status}`)
    }

    const translationResult = await response.text()
    
    // 将翻译结果添加到对话历史
    appState.chatHistory.push({
      role: 'assistant',
      content: `翻译结果: ${translationResult}`
    })
    
    // 同时更新当前AI回复字段，以便在界面中显示翻译结果
    appState.currentAIReply = translationResult
    
    // 如果数字人已连接，则让数字人播报翻译结果
    if (avatar.instance && avatar.connected) {
      // 等待虚拟人停止说话
      await appStore.waitForAvatarReady()
      
      // 生成SSML格式的文本
      const ssml = generateSSML(translationResult)
      
      // 让数字人播报翻译结果
      // 第一个参数是SSML文本，第二个参数true表示这是第一句话，第三个参数false表示不是最后一句话
      avatar.instance.speak(ssml, true, false)
      
      // 添加一个空的speak调用作为结束标记
      // 第二个参数false表示这不是第一句话，第三个参数true表示这是最后一句话
      avatar.instance.speak(generateSSML(''), false, true)
    }
  } catch (error) {
    console.error('翻译失败:', error)
    throw error
  }
}
</script>

<style scoped>
.config-panel {
  width: 420px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.history-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 20px;
}

.message-section {
  flex-shrink: 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 0;
  border-bottom: none;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group-inline {
  flex: 1;
}

.form-group-inline label,
label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
}

input,
select,
textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  font-size: 14px;
  color: #1d1d1f;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  font-family: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  background: #ffffff;
}

textarea {
  resize: none;
  min-height: 100px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 980px; /* Pill shape */
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 90px;
  letter-spacing: -0.01em;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0062cc;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.btn-secondary {
  background: #e5e5ea;
  color: #1d1d1f;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d1d6;
}

.btn-voice {
  background: #34c759;
  color: white;
}

.btn-voice:hover:not(:disabled) {
  background: #248a3d;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.history-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: none;
  background: transparent;
}

.message-item {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  word-wrap: break-word;
}

.message-item.user {
  align-self: flex-end;
  background-color: #007aff;
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
}

.message-item.assistant {
  align-self: flex-start;
  background-color: #e9e9eb;
  color: #1d1d1f;
  border-bottom-left-radius: 4px;
}

.message-role {
  display: none; /* Hide role label for cleaner look */
}

.message-content {
  color: inherit;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.empty-history {
  text-align: center;
  color: #86868b;
  font-size: 14px;
  margin-top: 40px;
}
</style>
