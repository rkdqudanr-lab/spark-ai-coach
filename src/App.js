// src/App.js - 개선 버전
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CheckCircle, Circle, Trophy, LogOut, Menu, X, Eye, EyeOff, Target, Info, Plus } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
  const [showChallengeMenu, setShowChallengeMenu] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [showAddChallengePrompt, setShowAddChallengePrompt] = useState(false);
  
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

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          token: user.id
        })
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      await conversationHelpers.addMessage(convId, 'assistant', assistantMessage);
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);

      // 도전과제 감지 및 확인
      if (assistantMessage.includes('🎯 이번 주 도전과제')) {
        const titleMatch = assistantMessage.match(/미션: (.+)/);
        const title = titleMatch ? titleMatch[1] : '새 도전과제';
        
        setPendingChallenge({
          conversationId: convId,
          title,
          description: assistantMessage,
          level: userStats.level
        });
        setShowAddChallengePrompt(true);
      }

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 도전과제 추가 확인
  const handleAddChallenge = async (add) => {
    setShowAddChallengePrompt(false);
    
    if (add && pendingChallenge) {
      try {
        const challenge = await challengeHelpers.createChallenge(
          user.id,
          pendingChallenge.conversationId,
          pendingChallenge
        );

        setChallenges([challenge, ...challenges]);
        const stats = await challengeHelpers.getUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('도전과제 저장 실패:', error);
      }
    }
    
    setPendingChallenge(null);
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

  // 도전과제 상세 설명 생성
  const getChallengeExplanation = (challenge) => {
    const lines = [
      `🎯 ${challenge.title}`,
      '',
      '📝 수행 방법:',
      challenge.description.includes('어떻게?') 
        ? challenge.description.split('어떻게?')[1].split('목표:')[0].trim()
        : '1. 도전과제를 읽고 이해하기\n2. 필요한 자료 준비하기\n3. 단계별로 실행하기\n4. 완료 후 체크하기',
      '',
      '✨ 이점:',
      '• 실전 경험을 쌓을 수 있어요',
      '• 포트폴리오에 추가할 수 있어요',
      '• 예비창업패키지 준비가 진행돼요',
      '• 실행력이 향상돼요',
      '• 다음 단계로 나아갈 수 있어요',
      '',
      `⏰ 레벨: ${challenge.level}`,
      `📅 등록일: ${new Date(challenge.created_at).toLocaleDateString()}`
    ];
    return lines.join('\n');
  };

  // 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 로그인/회원가입 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-orange-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              SPARK
            </h1>
            <p className="text-gray-600 mt-2 font-medium">창업 여정의 시작</p>
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="아이디"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            >
              {authLoading ? '처리중...' : isLogin ? '시작하기 →' : '가입하기 →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              className="text-orange-600 hover:text-orange-700 text-sm font-semibold transition-colors"
            >
              {isLogin ? '새로 시작하기 →' : '이미 계정이 있어요 →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 메인 앱 화면
  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-rose-50">
      {/* 사이드바 */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-80 bg-white/80 backdrop-blur-lg border-r border-orange-100 transition-transform z-20 shadow-xl`}>
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">SPARK</span>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-4 mb-3 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5 text-orange-600" />
                </button>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{userStats.level}</div>
                <div className="text-xs text-orange-700 font-medium">레벨</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-600">{userStats.completed}</div>
                <div className="text-xs text-green-700 font-medium">완료</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{userStats.active}</div>
                <div className="text-xs text-blue-700 font-medium">진행중</div>
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={startNewConversation}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all mb-3"
            >
              + 새 대화
            </button>

            <button
              onClick={() => setShowChallengeMenu(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all mb-4 flex items-center justify-center gap-2"
            >
              <Target className="w-5 h-5" />
              도전과제 보기
            </button>

            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    currentConversationId === conv.id
                      ? 'bg-gradient-to-r from-orange-100 to-rose-100 border-2 border-orange-300 shadow-md'
                      : 'bg-white/50 hover:bg-white/80 border border-gray-200'
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

          {/* 빠른 도전과제 */}
          <div className="border-t border-orange-100 p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-500" />
              진행 중인 도전과제
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {challenges.filter(c => c.status === 'active').slice(0, 3).map(challenge => (
                <div 
                  key={challenge.id} 
                  className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl p-3 border border-orange-200 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setShowChallengeDetail(true);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteChallenge(challenge.id);
                      }}
                      className="mt-1"
                    >
                      <Circle className="w-4 h-4 text-orange-400 hover:text-orange-600 transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {challenge.title}
                      </p>
                      <p className="text-xs text-orange-600 font-medium">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-orange-100 p-4 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">SPARK</h1>
            <p className="text-xs text-gray-600">함께 성장하는 창업 코치</p>
          </div>
        </div>

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                안녕, {user.name}! 👋
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                2025년 예비창업패키지,
              </p>
              <p className="text-gray-600 text-lg">
                함께 준비해보자!
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-200 text-gray-900 shadow-md'
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-md">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 */}
        <div className="border-t border-orange-100 p-4 bg-white/80 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 도전과제 추가 확인 모달 */}
      {showAddChallengePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-orange-200 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">도전과제 추가</h3>
            </div>
            <p className="text-gray-600 mb-6">
              새로운 도전과제를 내 목록에 추가할까요?
            </p>
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl p-4 mb-6 border border-orange-200">
              <p className="font-semibold text-gray-900">{pendingChallenge?.title}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAddChallenge(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                나중에
              </button>
              <button
                onClick={() => handleAddChallenge(true)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 도전과제 상세 모달 */}
      {showChallengeDetail && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-orange-200 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">도전과제 상세</h3>
              </div>
              <button
                onClick={() => setShowChallengeDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-2xl p-6 border-2 border-orange-200">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                {getChallengeExplanation(selectedChallenge)}
              </pre>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowChallengeDetail(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                닫기
              </button>
              {selectedChallenge.status === 'active' && (
                <button
                  onClick={() => {
                    handleCompleteChallenge(selectedChallenge.id);
                    setShowChallengeDetail(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  완료 표시
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 도전과제 메뉴 모달 */}
      {showChallengeMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-orange-200 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">내 도전과제</h3>
              </div>
              <button
                onClick={() => setShowChallengeMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 레벨별 도전과제 */}
            {[1, 2, 3].map(level => {
              const levelChallenges = challenges.filter(c => c.level === level);
              if (levelChallenges.length === 0) return null;

              return (
                <div key={level} className="mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full text-sm">
                      레벨 {level}
                    </span>
                    <span className="text-gray-600 text-sm">({levelChallenges.length}개)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {levelChallenges.map(challenge => (
                      <div
                        key={challenge.id}
                        onClick={() => {
                          setSelectedChallenge(challenge);
                          setShowChallengeDetail(true);
                          setShowChallengeMenu(false);
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                          challenge.status === 'completed'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                            : 'bg-gradient-to-r from-orange-50 to-rose-50 border-orange-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {challenge.status === 'completed' ? (
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 mb-1">
                              {challenge.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(challenge.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {challenges.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">아직 도전과제가 없어요</p>
                <p className="text-gray-400 text-sm mt-2">SPARK와 대화하며 도전과제를 받아보세요!</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
