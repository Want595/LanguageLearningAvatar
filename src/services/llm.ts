class LlmService {
  /**
   * 发送消息到后端服务 (非流式)
   * @param userMessage - 用户输入的消息内容
   * @param language - 语言代码，默认为'en'
   * @returns Promise<string | null> - 返回模型的回复内容，失败时返回null
   */
  async sendMessage(userMessage: string, language: string = 'en'): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          language: language
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const content = await response.text()
      return content || null
    } catch (error: any) {
      console.error('LLM请求失败:', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * 流式发送消息到后端服务
   * @param userMessage - 用户输入的消息内容
   * @param language - 语言代码，默认为'en'
   * @returns Promise<AsyncIterable<string>> - 返回异步可迭代的字符串流
   */
  async sendMessageWithStream(userMessage: string, language: string = 'en'): Promise<AsyncIterable<string>> {
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          language: language
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend Error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      return {
        [Symbol.asyncIterator]: async function* () {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            if (chunk) {
              yield chunk
            }
          }
        }
      }
    } catch (error: any) {
      console.error('LLM请求失败:', {
        error: error.message
      })
      throw error
    }
  }
}

export const llmService = new LlmService()
