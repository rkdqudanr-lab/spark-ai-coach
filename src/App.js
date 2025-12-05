// src/App.js - Supabase 버전 (기존 api/chat.js 호환)
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CheckCircle, Circle, Trophy, LogOut, Menu, X } from 'lucide-react';
import { 
  authHelpers, 
  conversationHelpers, 
  challengeHelpers 
} from './supabaseClient';

function App() {
  // 인증 상태
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  
  // 폼 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 대화 상태
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 도전과제 상태
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, completed: 0, active: 0, level: 1 });
  
  // UI 상태
  const [showSidebar, setShowSidebar] = useState(false);
  
  const messagesEndRef = useRef(null);

  // 초기 로드
  useEffect(() => {
    const currentUser = authHelpers.getCurrentUser();
    
    if (currentUser) {
      setUser(currentUser);
      loadUserData(currentUser.id);
    }
  }, []);

  // 사용자 데이터 로드
  const loadUserData = async (userId) => {
    try {
      const [convs, chals, stats] = await Promise.all([
        conversationHelpers.getConversations(userId),
        challengeHelpers.getChallenges(userId),
        challengeHelpers.getUserStats(userId)
      ]);
      
      setConversations(convs);
      setChallenges(chals);
      setUserStats(stats);
      
      if (convs.length > 0) {
        await loadConversation(convs[0].id);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  // 대화 로드
  const loadConversation = async (conversationId) => {
    try {
      const msgs = await conversationHelpers.getMessages(conversationId);
      setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('대화 로드 실패:', error);
    }
  };

  // 회원가입
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (!username || !password || !name) {
      setAuthError('모든 항목을 입력해주세요');
      setAuthLoading(false);
      return;
    }

    if (password.length < 4) {
      setAuthError('비밀번호는 4자 이상이어야 합니다');
      setAuthLoading(false);
      return;
    }

    const result = await authHelpers.signUp(username, password, name);
    setAuthLoading(false);

    if (result.success) {
      const loginResult = await authHelpers.signIn(username, password);
      if (loginResult.success) {
        setUser(loginResult.user);
        await loadUserData(loginResult.user.id);
      }
    } else {
      setAuthError(result.error);
    }
  };

  // 로그인
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const result = await authHelpers.signIn(username, password);
    setAuthLoading(false);

    if (result.success) {
      setUser(result.user);
      await loadUserData(result.user.id);
    } else {
      setAuthError(result.error);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    authHelpers.signOut();
    setUser(null);
    setConversations([]);
    setMessages([]);
    setChallenges([]);
    setCurrentConversationId(null);
  };

  // 새 대화 시작
  const startNewConversation = async () => {
    try {
      const conv = await conversationHelpers.createConversation(user.id);
      setConversations([conv, ...conversations]);
      setCurrentConversationId(conv.id);
      setMessages([]);
      setShowSidebar(false);
    } catch (error) {
      console.error('새 대화 생성 실패:', error);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      let convId = currentConversationId;
      if (!convId) {
        const conv = await conversationHelpers.createConversation(user.id);
        convId = conv.id;
        setCurrentConversationId(convId);
        setConversations([conv, ...conversations]);
      }

      await conversationHelpers.addMessage(convId, 'user', userMessage);
      const newMessages = [...messages, { role: 'user', content: userMessage }];
      setMessages(newMessages);

      // 기존 api/chat.js 호출 (token 포함)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          token: user.id  // 기존 API는 token 필요
        })
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      await conversationHelpers.addMessage(convId, 'assistant', assistantMessage);
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);

      if (assistantMessage.includes('🎯 이번 주 도전과제')) {
        await extractAndSaveChallenge(convId, assistantMessage);
      }

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 도전과제 추출 및 저장
  const extractAndSaveChallenge = async (conversationId, message) => {
    try {
      const titleMatch = message.match(/미션: (.+)/);
      const title = titleMatch ? titleMatch[1] : '새 도전과제';
      
      const challenge = await challengeHelpers.createChallenge(
        user.id,
        conversationId,
        {
          title,
          description: message,
          level: userStats.level
        }
      );

      setChallenges([challenge, ...challenges]);
      
      const stats = await challengeHelpers.getUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('도전과제 저장 실패:', error);
    }
  };

  // 도전과제 완료
  const handleCompleteChallenge = async (challengeId) => {
    try {
      await challengeHelpers.completeChallenge(challengeId);
      
      setChallenges(challenges.map(c => 
        c.id === challengeId ? { ...c, status: 'completed' } : c
      ));
      
      const stats = await challengeHelpers.getUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('도전과제 완료 실패:', error);
    }
  };

  // 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 로그인/회원가입 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SPARK</h1>
            <p className="text-gray-600 mt-2">창업 준비 실행 코치</p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="아이디"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="비밀번호"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {authLoading ? '처리중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              className="text-orange-500 hover:text-orange-600 text-sm font-medium"
            >
              {isLogin ? '회원가입하기' : '이미 계정이 있나요? 로그인'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 메인 앱 화면
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-gray-200 transition-transform z-20`}>
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <span className="font-bold text-lg">SPARK</span>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="bg-orange-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5 text-orange-600" />
                </button>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-2xl font-bold text-orange-500">{userStats.level}</div>
                <div className="text-xs text-gray-600">레벨</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-2xl font-bold text-green-500">{userStats.completed}</div>
                <div className="text-xs text-gray-600">완료</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-2xl font-bold text-blue-500">{userStats.active}</div>
                <div className="text-xs text-gray-600">진행중</div>
              </div>
            </div>
          </div>

          {/* 대화 목록 */}
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={startNewConversation}
              className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors mb-4"
            >
              + 새 대화
            </button>

            <div className="space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentConversationId === conv.id
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 도전과제 */}
          <div className="border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
            <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              도전과제
            </h3>
            <div className="space-y-2">
              {challenges.filter(c => c.status === 'active').slice(0, 3).map(challenge => (
                <div key={challenge.id} className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => handleCompleteChallenge(challenge.id)}
                      className="mt-1"
                    >
                      <Circle className="w-4 h-4 text-gray-400 hover:text-orange-500" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {challenge.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        레벨 {challenge.level}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Sparkles className="w-6 h-6 text-orange-500" />
          <div>
            <h1 className="font-bold text-lg">SPARK</h1>
            <p className="text-xs text-gray-600">창업 준비 실행 코치</p>
          </div>
        </div>

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                안녕! 나는 SPARK야 🚀
              </h2>
              <p className="text-gray-600">
                2025년 예비창업패키지 준비, 함께 시작해보자!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
