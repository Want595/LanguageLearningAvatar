<template>
  <div ref="containerRef" class="avatar-render">
    <!-- SDK 渲染容器 -->
    <div :id="containerId" class="sdk-container" />
    
    <!-- 字幕显示 -->
    <div v-show="appState.ui.subTitleText" class="subtitle">
      {{ appState.ui.subTitleText }}
    </div>
    
    <!-- 语音输入动画 -->
    <div v-show="appState.asr.isListening" class="voice-animation">
      <img :src="siriIcon" alt="语音输入" />
    </div>
    
    <!-- 加载状态 -->
    <div v-if="!appState.avatar.connected" class="loading-placeholder">
      <div class="loading-text">-- 正在连接 --</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import { avatarService } from '../services/avatar'
import type { AppState } from '../types'
import siriIcon from '../assets/siri.png'

// 注入全局状态
const appState = inject<AppState>('appState')!

// 获取容器ID
const containerId = computed(() => avatarService.getContainerId())
</script>

<style scoped>
.avatar-render {
  flex: 1;
  position: relative;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  background: #f5f5f7;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.sdk-container {
  width: 60%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.subtitle {
  position: absolute;
  z-index: 100;
  bottom: 15vh;
  left: 50%;
  width: auto;
  min-width: 300px;
  max-width: 90%;
  word-break: break-word;
  text-align: center;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 500;
  color: #1d1d1f;
  padding: 16px 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.voice-animation {
  position: absolute;
  left: 50%;
  top: 70%;
  transform: translateX(-50%);
  width: min(360px, 60vw);
  max-width: 90%;
  z-index: 101;
  opacity: 0.9;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.voice-animation > img {
  width: 100%;
  height: auto;
}

.loading-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(245, 245, 247, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.loading-text {
  font-size: 16px;
  color: #86868b;
  font-weight: 500;
  background: white;
  padding: 12px 24px;
  border-radius: 980px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
