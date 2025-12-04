import React, { useState, useEffect, useRef } from 'react';
import { Send, Zap, Loader, CheckSquare, Plus, Trash2, Check, LogOut } from 'lucide-react';

export default function SparkSimple() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  // 로그인 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [showTodos, setShowTodos] = useState(false);
  const [todos, setTodos] = useState([]);
  const [pendingTodo, setPendingTodo] = useState(null);
  const messagesEndRef = useRef(null);

  // 로컬스토리지에서 로그인 정보 복원
  useEffect(() => {
    const savedToken = localStorage.getItem('spark-token');
    const savedUsername = localStorage.getItem('spark-username');
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  // 투두 불러오기
  useEffect(() => {
    if (isLoggedIn) {
      const savedTodos = localStorage.getItem(`spark-todos-${username}`);
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
    }
  }, [isLoggedIn, username]);

  // 투두 저장
  useEffect(() => {
    if (isLoggedIn && todos.length > 0) {
      localStorage.setItem(`spark-todos-${username}`, JSON.stringify(todos));
    }
  }, [todos, isLoggedIn, username]);

  useEffect(() => {
    if (isLoggedIn) {
      const initialMessage = {
        id: 1,
        text: `━━━━━━━━━━━━━━━━━━━━\n    ✨ SPARK ✨\n  창업 준비 실행 코치\n━━━━━━━━━━━━━━━━━━━━\n\n안녕 ${username}! 나는 SPARK야 🚀\n\n2025년 목표:\n예비창업패키지 준비 완료!\n\n매주 작은 도전과제로\n조금씩 완성해가자.\n\n오늘은 어떤 이야기를 나눠볼까? 😊`,
        sender: 'spark',
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [isLoggedIn, username]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 로그인 처리
  const handleLogin = async () => {
    setLoginError('');
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUsername(data.username);
        setIsLoggedIn(true);
        
        // 로컬스토리지에 저장
        localStorage.setItem('spark-token', data.token);
        localStorage.setItem('spark-username', data.username);
        
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setLoginError(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('서버 연결 오류');
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setUsername('');
    setMessages([]);
    setConversationHistory([]);
    setTodos([]);
    localStorage.removeItem('spark-token');
    localStorage.removeItem('spark-username');
  };

  // 도전과제 추출
  const extractTodoFromMessage = (text) => {
    if (!text.includes('🎯 이번 주 도전과제')) return null;

    const lines = text.split('\n');
    let title = '';
    let description = '';
    let deadline = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('미션:')) {
        title = line.replace('미션:', '').trim();
      }
      if (line.startsWith('어떻게:')) {
        const steps = [];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const step = lines[j].trim();
          if (step && (step.match(/^\d\./) || step.startsWith('-'))) {
            steps.push(step);
          }
        }
        description = steps.join('\n');
      }
      if (line.startsWith('목표:')) {
        deadline = line.replace('목표:', '').trim();
      }
    }

    return title ? { title, description, deadline } : null;
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
          token: token  // API 키 대신 토큰 전송
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

      // 도전과제 자동 감지
      const todoData = extractTodoFromMessage(assistantMessage);
      if (todoData) {
        setPendingTodo(todoData);
      }

      return assistantMessage;

    } catch (error) {
      console.error('Claude API 에러:', error);
      return `앗, 문제가 생겼어 😅\n\n에러: ${error.message}`;
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    const sparkResponseText = await callClaudeAPI(currentInput);

    const sparkResponse = {
      id: messages.length + 2,
      text: sparkResponseText,
      sender: 'spark',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, sparkResponse]);
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoggedIn) {
        handleLogin();
      } else {
        handleSend();
      }
    }
  };

  const addTodo = () => {
    if (pendingTodo) {
      const newTodo = {
        id: Date.now(),
        ...pendingTodo,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTodos([newTodo, ...todos]);
      setPendingTodo(null);

      const confirmMessage = {
        id: messages.length + 1,
        text: '✅ 투두리스트에 추가했어!\n\n우측 상단 버튼으로 확인해봐!',
        sender: 'spark',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // 로그인 화면
  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '10s'}}></div>
        
        <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-orange-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
              SPARK
            </h1>
            <p className="text-gray-600 font-medium">창업 준비 실행 코치</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="아이디를 입력하세요"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={!loginUsername || !loginPassword}
              className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${
                loginUsername && loginPassword
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              로그인 🚀
            </button>
          </div>

          <div className="mt-6 p-4 bg-orange-50 rounded-xl">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>테스트 계정:</strong><br/>
              아이디: admin<br/>
              비밀번호: spark2025!
            </p>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            관리자에게 계정을 요청하세요
          </p>
        </div>
      </div>
    );
  }

  // 메인 화면
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '8s'}}></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}}></div>

      <header className="relative z-10 bg-white/90 backdrop-blur-md shadow-lg border-b border-orange-100 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap className="w-8 h-8 text-orange-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                  SPARK
                </h1>
                <p className="text-xs text-gray-600 font-medium">안녕, {username}!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTodos(!showTodos)}
                className="relative px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full hover:from-orange-200 hover:to-red-200 transition-all"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-gray-700">도전과제</span>
                </div>
                {todos.filter(t => !t.completed).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {todos.filter(t => !t.completed).length}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 투두리스트 사이드바 */}
      {showTodos && (
        <div className="absolute top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-md shadow-2xl z-50 border-l border-gray-200">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-800">📋 도전과제</h2>
                <button
                  onClick={() => setShowTodos(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {todos.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>전체 {todos.length}개</span>
                  <span className="text-green-600 font-bold">완료 {todos.filter(t => t.completed).length}개</span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {todos.length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">아직 도전과제가 없어요</p>
                  <p className="text-xs text-gray-400 mt-1">SPARK와 대화해보세요!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      todo.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          todo.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-orange-500'
                        }`}
                      >
                        {todo.completed && <Check className="w-3 h-3 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                            {todo.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">⏰ {todo.deadline}</p>
                      </div>

                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-br-md'
                    : 'bg-white/95 text-gray-800 rounded-bl-md border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {message.text}
                </p>
                <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-orange-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {pendingTodo && (
            <div className="flex justify-center animate-fadeIn">
              <div className="bg-orange-50/90 backdrop-blur-sm border-2 border-orange-200 rounded-2xl px-5 py-4 max-w-md shadow-lg">
                <p className="text-sm font-bold text-orange-800 mb-3">
                  📝 이 도전과제를 저장할까?
                </p>
                <div className="bg-white rounded-xl p-3 mb-3">
                  <p className="text-sm font-semibold text-gray-800">{pendingTodo.title}</p>
                  <p className="text-xs text-gray-500 mt-1">⏰ {pendingTodo.deadline}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addTodo}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    추가
                  </button>
                  <button
                    onClick={() => setPendingTodo(null)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-all"
                  >
                    나중에
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white/95 px-5 py-4 rounded-3xl rounded-bl-md shadow-lg backdrop-blur-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 text-orange-500 animate-spin" />
                  <span className="text-sm text-gray-600 font-medium">SPARK가 도전과제 찾는 중</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="relative z-10 bg-white/90 backdrop-blur-md border-t border-orange-100 shadow-2xl flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                rows="1"
                disabled={isLoading}
                className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 resize-none transition-all duration-200 font-medium text-sm text-gray-800 placeholder-gray-400 shadow-md disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '100px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex-shrink-0 ${
                inputValue.trim() && !isLoading
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2 font-medium">
            Claude AI가 맞춤 도전과제를 만들어줘요 🚀
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        textarea { field-sizing: content; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.3); border-radius: 3px; }
      `}</style>
    </div>
  );
}
