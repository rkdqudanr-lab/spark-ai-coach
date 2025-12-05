// src/App.js - 최종 개선 버전
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CheckCircle, Circle, Trophy, LogOut, Menu, X, Eye, EyeOff, Target, Info, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  authHelpers, 
  conversationHelpers, 
  challengeHelpers 
} from './supabaseClient';

// 레벨 시스템 정의
const LEVEL_SYSTEM = {
  1: {
    title: "입문: 창업 세계 탐험",
    description: "창업이 뭔지 알아가는 단계",
    requirements: [
      "창업 관련 영상/기사 5개 읽기",
      "창업 아이템 브레인스토밍 (10개 이상)",
      "나만의 강점 3가지 정리"
    ],
    requiredChallenges: 3
  },
  2: {
    title: "초급: 지식 쌓기",
    description: "창업 기본기를 다지는 단계",
    requirements: [
      "주 3회 블로그 포스팅 (창업 관련)",
      "창업 관련 책 1권 읽기",
      "온라인 창업 강의 1개 수강"
    ],
    requiredChallenges: 5
  },
  3: {
    title: "중급: 아이템 구체화",
    description: "사업 아이템을 명확히 하는 단계",
    requirements: [
      "IR 설명회 참석",
      "서울기업지원센터 멘토링 3회",
      "경쟁사 분석 보고서 작성",
      "고객 인터뷰 5명 이상"
    ],
    requiredChallenges: 8
  },
  4: {
    title: "중상급: 시장 검증",
    description: "시장성을 검증하는 단계",
    requirements: [
      "시장조사 보고서 완성",
      "타겟 고객 페르소나 3개 작성",
      "MVP 기획서 작성",
      "사업 타당성 분석"
    ],
    requiredChallenges: 12
  },
  5: {
    title: "고급: 비즈니스 모델 설계",
    description: "수익 모델을 만드는 단계",
    requirements: [
      "비즈니스 모델 캔버스 완성",
      "수익 구조 설계",
      "예상 손익계산서 작성",
      "투자 계획서 초안"
    ],
    requiredChallenges: 16
  },
  6: {
    title: "실전 준비: 자료 구축",
    description: "실제 사업을 준비하는 단계",
    requirements: [
      "사업계획서 1차 완성",
      "재무 계획 수립",
      "마케팅 전략 수립",
      "팀 구성 계획"
    ],
    requiredChallenges: 20
  },
  7: {
    title: "실전 돌입: 네트워킹",
    description: "실전 경험을 쌓는 단계",
    requirements: [
      "창업 네트워킹 행사 3회 참석",
      "예비 창업자 커뮤니티 가입",
      "멘토 1명 확보",
      "파트너/팀원 모집"
    ],
    requiredChallenges: 24
  },
  8: {
    title: "도전: 공모전 참가",
    description: "실전 테스트하는 단계",
    requirements: [
      "창업 공모전 1개 제출",
      "피칭 연습 10회 이상",
      "피드백 반영한 사업계획서 2차 완성",
      "IR 덱 완성"
    ],
    requiredChallenges: 28
  },
  9: {
    title: "최종 준비: 예창패 서류",
    description: "예비창업패키지 서류 완성 단계",
    requirements: [
      "예비창업패키지 한글 파일 완성",
      "예비창업패키지 PPT 완성",
      "최종 검토 및 피드백 반영",
      "제출 서류 체크리스트 완료"
    ],
    requiredChallenges: 32
  },
  10: {
    title: "최종 목표: 예창패 도전!",
    description: "예비창업패키지 신청 단계",
    requirements: [
      "예비창업패키지 신청 완료",
      "서류 심사 준비 완료",
      "발표 심사 준비 완료",
      "최종 점검 완료"
    ],
    requiredChallenges: 35
  }
};

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
  const [conversationToDelete, setConversationToDelete] = useState(null);
  
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
  const [showStats, setShowStats] = useState(true);
  
  const messagesEndRef = useRef(null);

  // 초기 로드
  useEffect(() => {
    const currentUser = authHelpers.getCurrentUser();
    
    if (currentUser) {
      setUser(currentUser);
      loadUserData(currentUser.id);
    }
  }, []);

  // 레벨 계산
  const calculateLevel = (completedCount) => {
    for (let level = 10; level >= 1; level--) {
      if (completedCount >= LEVEL_SYSTEM[level].requiredChallenges) {
        return level;
      }
    }
    return 1;
  };

  // 다음 레벨까지 필요한 과제 수
  const getChallengesUntilNextLevel = (currentLevel, completedCount) => {
    if (currentLevel >= 10) return 0;
    return LEVEL_SYSTEM[currentLevel + 1].requiredChallenges - completedCount;
  };

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
      
      // 레벨 재계산
      const actualLevel = calculateLevel(stats.completed);
      setUserStats({ ...stats, level: actualLevel });
      
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
      setShowSidebar(false);
    } catch (error) {
      console.error('대화 로드 실패:', error);
    }
  };

  // 대화 삭제
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await conversationHelpers.deleteConversation(conversationToDelete);
      
      setConversations(conversations.filter(c => c.id !== conversationToDelete));
      
      if (currentConversationId === conversationToDelete) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      setConversationToDelete(null);
    } catch (error) {
      console.error('대화 삭제 실패:', error);
      alert('대화 삭제에 실패했습니다');
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
        const actualLevel = calculateLevel(stats.completed);
        setUserStats({ ...stats, level: actualLevel });
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
      const actualLevel = calculateLevel(stats.completed);
      setUserStats({ ...stats, level: actualLevel });
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
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-2xl mb-4 shadow-lg animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              SPARK
            </h1>
            <p className="text-gray-700 font-medium">창업 여정의 시작</p>
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/50"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/50"
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
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/50"
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
              className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
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

  const currentLevelInfo = LEVEL_SYSTEM[userStats.level];
  const nextLevelChallenges = getChallengesUntilNextLevel(userStats.level, userStats.completed);

  // 메인 앱 화면
  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100">
      {/* 사이드바 */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-80 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl border-r border-orange-200/50 transition-transform z-20 shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b border-orange-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">SPARK</span>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 사용자 정보 */}
            <div className="bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100 rounded-2xl p-4 mb-3 border-2 border-orange-200/50 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/80 rounded-xl transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5 text-orange-600" />
                </button>
              </div>
            </div>

            {/* 통계 (접기/펼치기) */}
            <div className="bg-gradient-to-br from-white/80 to-white/60 rounded-2xl border-2 border-orange-200/50 shadow-md overflow-hidden">
              <button
                onClick={() => setShowStats(!showStats)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">내 진행상황</span>
                </div>
                {showStats ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
              </button>
              
              {showStats && (
                <div className="p-4 pt-0 space-y-3">
                  {/* 레벨 정보 */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-purple-900">Level {userStats.level}</span>
                      {userStats.level < 10 && (
                        <span className="text-xs text-purple-700">{nextLevelChallenges}개 남음</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-purple-800 mb-1">{currentLevelInfo.title}</p>
                    <p className="text-xs text-purple-700">{currentLevelInfo.description}</p>
                    
                    {/* 프로그레스 바 */}
                    {userStats.level < 10 && (
                      <div className="mt-2">
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(userStats.completed / LEVEL_SYSTEM[userStats.level + 1].requiredChallenges) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 현재 레벨 도전과제 */}
                  <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl p-3 border-2 border-orange-200">
                    <h4 className="text-xs font-bold text-orange-900 mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      이번 레벨 도전과제
                    </h4>
                    <div className="space-y-1.5">
                      {currentLevelInfo.requirements.slice(0, 3).map((req, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(`${req}에 대해 알려줘`);
                          }}
                          className="w-full text-left text-xs text-gray-700 hover:text-orange-700 hover:bg-orange-100 p-2 rounded-lg transition-all flex items-start gap-2"
                        >
                          <Circle className="w-3 h-3 flex-shrink-0 mt-0.5 text-orange-500" />
                          <span>{req}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowChallengeMenu(true);
                        setShowStats(false);
                      }}
                      className="w-full mt-2 text-xs text-orange-600 hover:text-orange-700 font-semibold text-center"
                    >
                      전체 보기 →
                    </button>
                  </div>

                  {/* 통계 */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-2 border border-orange-300">
                      <div className="text-xl font-bold text-orange-700">{userStats.total}</div>
                      <div className="text-xs text-orange-700 font-medium">전체</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-2 border border-green-300">
                      <div className="text-xl font-bold text-green-700">{userStats.completed}</div>
                      <div className="text-xs text-green-700 font-medium">완료</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-2 border border-blue-300">
                      <div className="text-xl font-bold text-blue-700">{userStats.active}</div>
                      <div className="text-xs text-blue-700 font-medium">진행중</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 메뉴 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2 mb-4">
              <button
                onClick={startNewConversation}
                className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white py-3 rounded-xl font-bold text-base hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                + 새 대화
              </button>

              <button
                onClick={() => setShowChallengeMenu(true)}
                className="w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white py-3 rounded-xl font-bold text-base hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                도전과제 보기
              </button>
            </div>

            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`w-full text-left p-3 rounded-xl transition-all group ${
                    currentConversationId === conv.id
                      ? 'bg-gradient-to-r from-orange-200 via-rose-200 to-pink-200 border-2 border-orange-400 shadow-lg'
                      : 'bg-white/70 hover:bg-white border-2 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => loadConversation(conv.id)}
                      className="flex-1 text-left"
                    >
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => setConversationToDelete(conv.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="대화 삭제"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
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
        <div className="bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl border-b border-orange-200/50 p-4 flex items-center shadow-lg">
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent mb-3">
                안녕, {user.name}! 👋
              </h2>
              <p className="text-gray-700 text-lg mb-2">
                2025년 예비창업패키지,
              </p>
              <p className="text-gray-700 text-lg">
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
                className={`max-w-[85%] sm:max-w-2xl rounded-2xl px-4 py-3 shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 text-gray-900'
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
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 */}
        <div className="border-t border-orange-200/50 p-4 bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl shadow-lg">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/80"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 대화 삭제 확인 모달 */}
      {conversationToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-200 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">대화 삭제</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              대화는 <span className="font-bold text-red-600">삭제 후 복구가 불가능</span>합니다.<br />
              정말 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConversationToDelete(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConversation}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 도전과제 추가 확인 모달 */}
      {showAddChallengePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-purple-200 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">도전과제 추가</h3>
            </div>
            <p className="text-gray-700 mb-6">
              새로운 도전과제를 내 목록에 추가할까요?
            </p>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 도전과제 상세 모달 */}
      {showChallengeDetail && selectedChallenge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">내 도전과제</h3>
                  <p className="text-sm text-gray-600">Level {userStats.level}: {currentLevelInfo.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowChallengeMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 레벨별 도전과제 */}
            {Object.keys(LEVEL_SYSTEM).map(level => {
              const levelNum = parseInt(level);
              const levelChallenges = challenges.filter(c => c.level === levelNum);
              const levelInfo = LEVEL_SYSTEM[levelNum];
              
              return (
                <div key={level} className="mb-6">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-3 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold">
                          Level {levelNum}
                        </span>
                        <span className="font-bold text-gray-900">{levelInfo.title}</span>
                      </div>
                      <span className="text-sm text-purple-700 font-medium">
                        {levelChallenges.length}개 / {levelInfo.requiredChallenges}개 필요
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{levelInfo.description}</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      {levelInfo.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {levelChallenges.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300'
                              : 'bg-gradient-to-r from-orange-100 to-rose-100 border-orange-300'
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
                  )}
                </div>
              );
            })}

            {challenges.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">아직 도전과제가 없어요</p>
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

        /* 스크롤바 스타일링 */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f97316, #ec4899);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ea580c, #db2777);
        }
      `}</style>
    </div>
  );
}

export default App;
