import React, { useState, useEffect, useRef } from 'react';
import { Send, Rocket, CheckSquare, MessageCircle, Plus, Trash2, Check } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('chat'); // 'chat' or 'todos'
  const [todos, setTodos] = useState([]);
  const [pendingTodo, setPendingTodo] = useState(null);
  const messagesEndRef = useRef(null);

  // 로컬스토리지에서 투두리스트 불러오기
  useEffect(() => {
    const savedTodos = localStorage.getItem('spark-todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // 투두리스트 저장
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem('spark-todos', JSON.stringify(todos));
    }
  }, [todos]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
      setConversationHistory([
        {
          role: 'assistant',
          content: '안녕! 나는 SPARK야 🚀\n\n2025년 목표:\n예비창업패키지 준비 완료!\n\n같이 한 걸음씩 가보자.\n\n먼저, 이름이 뭐야?'
        }
      ]);
    }
  };

  const callClaudeAPI = async (userMessage) => {
    try {
      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newHistory,
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API 호출 실패');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '알 수 없는 오류');
      }

      const assistantMessage = data.message;

      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: assistantMessage }
      ]);

      // 도전과제 감지
      if (assistantMessage.includes('🎯 이번 주 도전과제')) {
        extractAndShowTodo(assistantMessage);
      }

      return assistantMessage;

    } catch (error) {
      console.error('Claude API 에러:', error);
      return `앗, 문제가 생겼어 😅\n\n에러: ${error.message}\n\nAPI 키가 올바른지 확인해줘!`;
    }
  };

  // 도전과제 추출
  const extractAndShowTodo = (message) => {
    const lines = message.split('\n');
    let title = '';
    let description = '';
    let deadline = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('미션:')) {
        title = line.replace('미션:', '').trim();
      }
      if (line.startsWith('어떻게?')) {
        // 다음 3줄 수집
        description = lines.slice(i + 1, i + 4).join('\n').trim();
      }
      if (line.startsWith('목표:')) {
        deadline = line.replace('목표:', '').trim();
      }
    }

    if (title) {
      setPendingTodo({
        title,
        description,
        deadline,
        createdAt: new Date().toISOString()
      });
    }
  };

  // 투두 추가
  const addTodo = () => {
    if (pendingTodo) {
      const newTodo = {
        id: Date.now(),
        ...pendingTodo,
        completed: false
      };
      setTodos([newTodo, ...todos]);
      setPendingTodo(null);
      
      // 확인 메시지
      setConversationHistory([
        ...conversationHistory,
        {
          role: 'assistant',
          content: '✅ 투두리스트에 추가했어!\n\n[✅ 도전과제] 탭에서 확인해봐!'
        }
      ]);
    }
  };

  // 투두 삭제
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 투두 완료 토글
  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const message = userInput;
    setUserInput('');
    setIsLoading(true);

    const newHistory = [
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    setConversationHistory(newHistory);

    await callClaudeAPI(message);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // API 키 입력 화면
  if (!isApiKeySet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
              <Rocket className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">SPARK</h1>
            <p className="text-gray-600">창업 준비 실행 코치</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claude API Key 입력
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                placeholder="sk-ant-api03-..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleApiKeySubmit}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              시작하기 🚀
            </button>

            <div className="text-sm text-gray-500 space-y-2">
              <p className="font-semibold">API 키 발급 방법:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>console.anthropic.com 접속</li>
                <li>로그인 후 "API Keys" 클릭</li>
                <li>"Create Key" 버튼 클릭</li>
                <li>발급받은 키 복사해서 붙여넣기</li>
              </ol>
              <p className="text-xs">💰 $5 무료 크레딧 = 약 5,000회 대화</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 화면
  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Rocket className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl font-bold text-gray-800">SPARK</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-green-600">● 연결됨</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setCurrentTab('chat')}
            className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
              currentTab === 'chat'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>💬 채팅</span>
          </button>
          <button
            onClick={() => setCurrentTab('todos')}
            className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors relative ${
              currentTab === 'todos'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span>✅ 도전과제</span>
            {todos.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {todos.filter(t => !t.completed).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 채팅 탭 */}
      {currentTab === 'chat' && (
        <>
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 space-y-4">
              {conversationHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {/* 투두 추가 제안 */}
              {pendingTodo && (
                <div className="flex justify-center">
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-6 py-4 max-w-md">
                    <p className="text-sm font-medium text-orange-800 mb-3">
                      📝 이 도전과제를 투두리스트에 추가할래?
                    </p>
                    <div className="bg-white rounded-lg p-3 mb-3 text-sm">
                      <p className="font-semibold text-gray-800">{pendingTodo.title}</p>
                      <p className="text-xs text-gray-500 mt-1">⏰ {pendingTodo.deadline}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={addTodo}
                        className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>추가</span>
                      </button>
                      <button
                        onClick={() => setPendingTodo(null)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        나중에
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* 투두리스트 탭 */}
      {currentTab === 'todos' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 나의 도전과제</h2>
              <p className="text-gray-600">SPARK와 함께 한 걸음씩 완성해가는 목표들</p>
            </div>

            {todos.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">아직 도전과제가 없어요</p>
                <p className="text-sm text-gray-400">채팅에서 SPARK와 대화하며 도전과제를 받아보세요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`bg-white rounded-xl p-4 border-2 transition-all ${
                      todo.completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-orange-500'
                        }`}
                      >
                        {todo.completed && <Check className="w-4 h-4 text-white" />}
                      </button>

                      <div className="flex-1">
                        <h3 className={`font-semibold ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">⏰ {todo.deadline}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(todo.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 통계 */}
            {todos.length > 0 && (
              <div className="mt-6 bg-white rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    전체: {todos.length}개
                  </span>
                  <span className="text-green-600 font-medium">
                    완료: {todos.filter(t => t.completed).length}개
                  </span>
                  <span className="text-orange-600 font-medium">
                    진행 중: {todos.filter(t => !t.completed).length}개
                  </span>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{
                      width: `${(todos.filter(t => t.completed).length / todos.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
