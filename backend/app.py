from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# LLM Config
BASE_URL = 'https://api-inference.modelscope.cn/v1'
DEFAULT_MODEL = 'Qwen/Qwen3-235B-A22B-Instruct-2507'
# API Key from environment variable
API_KEY = os.environ.get('DASHSCOPE_API_KEY', '')

@app.route('/config', methods=['GET'])
def get_config():
    config = {
        'appId': os.environ.get('APP_ID', ''),
        'appSecret': os.environ.get('APP_SECRET', ''),
        'asrAppId': os.environ.get('ASR_APP_ID', ''),
        'asrSecretId': os.environ.get('ASR_SECRET_ID', ''),
        'asrSecretKey': os.environ.get('ASR_SECRET_KEY', ''),
    }
    # Removed environment variable check for direct configuration
    return config

# Language configurations
LANGUAGE_INSTRUCTIONS = {
    'en': 'You are an English speaking practice assistant. Your task is to engage in a conversation with the user, helping them practice their English. The user will ask a question in English, and you should respond in English. Please be friendly, patient, and encouraging. Do not use any emojis in your responses.',
    'zh': '你是中文对话练习助手。你的任务是与用户进行对话，帮助他们练习中文。用户会用中文提问，你应该用中文回答。请保持友好、耐心和鼓励的态度。不要使用任何表情符号。',
    'ja': 'あなたは日本語会話練習アシスタントです。ユーザーとの会話に参加し、日本語の練習をサポートすることがあなたのタスクです。ユーザーは日本語で質問し、あなたも日本語で答えてください。フレンドリーで、忍耐強く、励ましの態度を保ってください。絵文字は使用しないでください。',
    'ko': '귀하는 한국어 대화 연습 어시스턴트입니다. 사용자와의 대화에 참여하여 한국어 연습을 도와주는 것이 귀하의 임무입니다. 사용자가 한국어로 질문하면 귀하도 한국어로 답변해야 합니다. 친근하고, 인내심을 갖고, 격려하는 태도를 유지해 주세요. 이모티콘은 사용하지 마세요.',
    'fr': 'Vous êtes un assistant de pratique de conversation en français. Votre tâche est d\'engager une conversation avec l\'utilisateur pour l\'aider à pratiquer le français. L\'utilisateur posera des questions en français et vous devrez répondre en français. Soyez sympathique, patient et encourageant. N\'utilisez pas d\'emojis.',
    'de': 'Sie sind ein Deutsch-Konversationsübungsassistent. Ihre Aufgabe ist es, sich mit dem Benutzer zu unterhalten und ihm beim Üben der deutschen Sprache zu helfen. Der Benutzer wird Fragen auf Deutsch stellen, und Sie sollten auf Deutsch antworten. Seien Sie freundlich, geduldig und ermutigend. Verwenden Sie keine Emojis.',
    'es': 'Eres un asistente de práctica de conversación en español. Tu tarea es entablar una conversación con el usuario para ayudarle a practicar el español. El usuario hará preguntas en español y tú deberás responder en español. Sé amable, paciente y alentador. No utilices ningún emoji.'
}

conversation_history = []


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    language = data.get('language', 'en')  # Default to English
    if not user_message:
        return {'error': 'Missing message'}, 400

    try:
        print(f"Processing message: {user_message} in language: {language}")

        # Check if this is a translation request
        is_translation = "请将以下内容翻译成" in user_message
        
        messages = []
        
        if is_translation:
            system_instruction = "You are a professional translator. Translate the following text accurately. Only provide the translated text without any explanations or additional content."
            messages.append({'role': 'system', 'content': system_instruction})
            messages.append({'role': 'user', 'content': user_message})
        else:
            base_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS['en'])
            messages.append({'role': 'system', 'content': base_instruction})
            
            # Add history
            messages.extend(conversation_history)
            messages.append({'role': 'user', 'content': user_message})

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        }

        payload = {
            'model': DEFAULT_MODEL,
            'messages': messages,
            'stream': True
        }

        print(f"Sending request to LLM: {payload['model']}")
        response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=payload, stream=True)

        if response.status_code != 200:
            error_msg = f"LLM Error: {response.status_code} - {response.text}"
            print(error_msg)
            return {'error': error_msg}, 500

        def generate():
            full_response = ""
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            json_data = json.loads(data_str)
                            delta = json_data['choices'][0]['delta']
                            if 'content' in delta:
                                content = delta['content']
                                full_response += content
                                yield content
                        except json.JSONDecodeError:
                            continue
            
            # Update history after full response
            if not is_translation:
                conversation_history.append({'role': 'user', 'content': user_message})
                conversation_history.append({'role': 'assistant', 'content': full_response})
                if len(conversation_history) > 20:
                    conversation_history[:] = conversation_history[-20:]
            
            print(f"Final response length: {len(full_response)}")

        return Response(stream_with_context(generate()), content_type='text/plain')

    except Exception as e:
        print(f"Error: {e}")
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
