<script setup lang="ts">
import { provide } from 'vue'
import IntroPanel from './components/IntroPanel.vue'
import Info from './components/ConfigPanel.vue'
import SdkRender from './components/AvatarRender.vue'
import { appState, appStore } from './stores/app'

// 提供全局状态和方法
provide('appState', appState)
provide('appStore', appStore)
</script>

<template>
  <div class="main">
    <IntroPanel />
    <SdkRender/>
    <Info />
  </div>
</template>

<style scoped>
.main {
  display: flex;
  width: 100vw;
  height: 100vh;
}
</style>
