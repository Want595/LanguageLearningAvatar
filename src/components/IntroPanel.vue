<template>
  <div class="intro-panel">
    <div class="intro-header">
      <h1 class="title">多语言学习伙伴</h1>
    </div>
    
    <div class="intro-content">
      <section class="intro-section">
        <h3>✨ 功能介绍</h3>
        <ul>
          <li>与AI进行多语言对话练习</li>
          <li>实时语音识别和交互</li>
          <li>友好的对话伙伴，随时陪伴</li>
        </ul>
      </section>
      
      <section class="intro-section">
        <h3>🎯 特色亮点</h3>
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <div class="feature-info">
            <div class="feature-title">AI虚拟人</div>
            <div class="feature-desc">逼真的数字人形象与你对话</div>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎤</div>
          <div class="feature-info">
            <div class="feature-title">语音识别</div>
            <div class="feature-desc">支持语音输入，解放双手</div>
          </div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <div class="feature-info">
            <div class="feature-title">智能对话</div>
            <div class="feature-desc">基于大语言模型的自然交互</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.intro-panel {
  width: 420px;
  max-height: 100vh;
  overflow-y: auto;
  padding: 24px;
  background: #f5f5f7;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.intro-header {
  text-align: center;
  border: none;
  background: transparent;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.015em;
}

.intro-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.intro-section {
  border: none;
  border-radius: 18px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.intro-section h3 {
  margin: 0 0 20px 0;
  font-size: 19px;
  font-weight: 600;
  color: #1d1d1f;
  border-bottom: none;
  padding-bottom: 0;
  letter-spacing: 0.01em;
}

.intro-section ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.intro-section li {
  margin-bottom: 12px;
  position: relative;
  padding-left: 24px;
  line-height: 1.6;
  font-size: 15px;
  color: #424245;
}

.intro-section li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #007aff;
  font-weight: bold;
  font-size: 14px;
}

.feature-card {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 16px;
  background: #fbfbfd;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 122, 255, 0.1);
  background: #ffffff;
}

.feature-card:last-child {
  margin-bottom: 0;
}

.feature-icon {
  font-size: 32px;
  margin-right: 16px;
  flex-shrink: 0;
  background: #fff;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.feature-info {
  flex: 1;
}

.feature-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
  color: #1d1d1f;
}

.feature-desc {
  font-size: 13px;
  color: #86868b;
  line-height: 1.4;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>
