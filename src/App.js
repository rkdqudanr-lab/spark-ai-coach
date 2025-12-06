// src/App.js - 새로운 UX 버전
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CheckCircle, Circle, Trophy, LogOut, Eye, EyeOff, Target, ChevronLeft, ArrowLeft, X } from 'lucide-react';
import { 
  authHelpers, 
  conversationHelpers, 
  challengeHelpers,
  supabase
} from './supabaseClient';

// 레벨 시스템 정의
const LEVEL_SYSTEM = {
  1: {
    emoji: "🐣",
    title: "입문: 창업 세계 탐험",
    description: "창업이 뭔지 알아가는 단계",
    color: "from-yellow-400 to-orange-400",
    bgColor: "from-yellow-50 to-orange-50",
    requirements: [
      "창업 관련 영상/기사 5개 읽기",
      "창업 아이템 브레인스토밍 (10개 이상)",
      "나만의 강점 3가지 정리"
    ],
    requiredChallenges: 3
  },
  2: {
    emoji: "🌱",
    title: "초급: 지식 쌓기",
    description: "창업 기본기를 다지는 단계",
    color: "from-green-400 to-emerald-400",
    bgColor: "from-green-50 to-emerald-50",
    requirements: [
      "주 3회 블로그 포스팅 (창업 관련)",
      "창업 관련 책 1권 읽기",
      "온라인 창업 강의 1개 수강"
    ],
    requiredChallenges: 5
  },
  3: {
    emoji: "🌿",
    title: "중급: 아이템 구체화",
    description: "사업 아이템을 명확히 하는 단계",
    color: "from-teal-400 to-cyan-400",
    bgColor: "from-teal-50 to-cyan-50",
    requirements: [
      "IR 설명회 참석",
      "서울기업지원센터 멘토링 3회",
      "경쟁사 분석 보고서 작성",
      "고객 인터뷰 5명 이상"
    ],
    requiredChallenges: 8
  },
  4: {
    emoji: "🌳",
    title: "중상급: 시장 이해",
    description: "시장과 고객을 분석하는 단계",
    color: "from-blue-400 to-indigo-400",
    bgColor: "from-blue-50 to-indigo-50",
    requirements: [
      "시장조사 보고서 완성",
      "MVP 프로토타입 제작",
      "고객 검증 테스트 10명",
      "수익 모델 구체화"
    ],
    requiredChallenges: 12
  },
  5: {
    emoji: "🏗️",
    title: "고급: 비즈니스 모델",
    description: "사업 구조를 설계하는 단계",
    color: "from-purple-400 to-pink-400",
    bgColor: "from-purple-50 to-pink-50",
    requirements: [
      "비즈니스 모델 캔버스 완성",
      "재무 계획 수립",
      "팀 빌딩 (공동창업자 또는 핵심 인력)",
      "법인 설립 준비"
    ],
    requiredChallenges: 17
  },
  6: {
    emoji: "🏢",
    title: "실전 준비: 사업계획서",
    description: "예비창업패키지 신청 준비",
    color: "from-orange-400 to-red-400",
    bgColor: "from-orange-50 to-red-50",
    requirements: [
      "사업계획서 초안 작성",
      "멘토링 피드백 3회 반영",
      "발표 자료 PPT 완성",
      "사업비 예산 상세 계획"
    ],
    requiredChallenges: 21
  },
  7: {
    emoji: "🤝",
    title: "실전 돌입: 신청 준비",
    description: "최종 서류 준비 및 검토",
    color: "from-rose-400 to-pink-400",
    bgColor: "from-rose-50 to-pink-50",
    requirements: [
      "사업계획서 최종본 완성",
      "모의 면접 3회 이상",
      "서류 검토 전문가 피드백",
      "필요 서류 일체 준비"
    ],
    requiredChallenges: 25
  },
  8: {
    emoji: "🎯",
    title: "도전: 신청 완료",
    description: "예비창업패키지 신청",
    color: "from-violet-400 to-purple-400",
    bgColor: "from-violet-50 to-purple-50",
    requirements: [
      "K-Startup 신청서 제출",
      "추가 자료 준비",
      "면접 연습 (최소 5회)",
      "비상 연락망 구성"
    ],
    requiredChallenges: 28
  },
  9: {
    emoji: "📝",
    title: "최종 준비: 면접 대비",
    description: "면접 완벽 대비",
    color: "from-indigo-400 to-blue-400",
    bgColor: "from-indigo-50 to-blue-50",
    requirements: [
      "예상 질문 50개 답변 준비",
      "1분 자기소개 완벽 암기",
      "사업 핵심 수치 암기",
      "모의 면접 10회"
    ],
    requiredChallenges: 32
  },
  10: {
    emoji: "🚀",
    title: "최종 목표: 합격!",
    description: "예비창업패키지 합격 및 사업 시작",
    color: "from-yellow-400 via-orange-400 to-red-400",
    bgColor: "from-yellow-50 via-orange-50 to-red-50",
    requirements: [
      "면접 참석",
      "합격 통보 수령",
      "사업자 등록",
      "사업 시작!"
    ],
    requiredChallenges: 35
  }
};

// 레벨 계산
function calculateLevel(completedCount) {
  if (completedCount >= 35) return 10;
  if (completedCount >= 32) return 9;
  if (completedCount >= 28) return 8;
  if (completedCount >= 25) return 7;
  if (completedCount >= 21) return 6;
  if (completedCount >= 17) return 5;
  if (completedCount >= 12) return 4;
  if (completedCount >= 8) return 3;
  if (completedCount >= 5) return 2;
  if (completedCount >= 3) return 1;
  return 1;
}

// 다음 레벨까지 필요한 도전과제 수
function getChallengesUntilNextLevel(currentLevel, completedCount) {
  if (currentLevel >= 10) return 0;
  const nextLevel = currentLevel + 1;
  return LEVEL_SYSTEM[nextLevel].requiredChallenges - completedCount;
}

function App() {
  // 인증 상태
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // 뷰 모드
  const [viewMode, setViewMode] = useState('main'); // 'main' | 'chat'
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [hideCompletedChallenges, setHideCompletedChallenges] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false);

  // 데이터
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, completed: 0, active: 0, level: 1 });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
      const [convs, challs] = await Promise.all([
        conversationHelpers.getConversations(userId),
        challengeHelpers.getChallenges(userId)
      ]);
      
      setConversations(convs);
      setChallenges(challs);
      
      const stats = await challengeHelpers.getUserStats(userId);
      const actualLevel = calculateLevel(stats.completed);
      setUserStats({ ...stats, level: actualLevel });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  // 로그인
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    const result = await authHelpers.signIn(username, password);
    if (result.success) {
      setUser(result.user);
      loadUserData(result.user.id);
    } else {
      setAuthError(result.error);
    }
  };

  // 회원가입
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!name || !username || !password) {
      setAuthError('모든 필드를 입력해주세요');
      return;
    }
    const result = await authHelpers.signUp(username, password, name);
    if (result.success) {
      setUser(result.user);
      loadUserData(result.user.id);
    } else {
      setAuthError(result.error);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    authHelpers.signOut();
    setUser(null);
    setViewMode('main');
    setMessages([]);
    setChallenges([]);
  };

  // 도전과제 글씨 클릭 → 확인창 표시
  const handleChallengeTextClick = (challenge) => {
    setSelectedChallenge(challenge);
    setShowStartDialog(true);
  };

  // 도전과제 시작 확인
  const handleConfirmStart = async () => {
    if (!selectedChallenge) return;
    
    setActiveChallengeId(selectedChallenge.id);
    setViewMode('chat');
    setShowStartDialog(false);
    
    // 새 대화 시작
    const conv = await conversationHelpers.createConversation(
      user.id, 
      `[도전과제] ${selectedChallenge.title}`
    );
    setCurrentConversationId(conv.id);
    setConversations([conv, ...conversations]);
    
    // SPARK의 첫 메시지
    const welcomeMessage = `좋아! "${selectedChallenge.title}" 같이 시작해보자! 💪\n\n어디까지 진행했어? 막히는 부분 있어?`;
    
    await conversationHelpers.addMessage(conv.id, 'assistant', welcomeMessage);
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
  };

  // 필수 과제 생성 + 시작
  const handleRequiredChallengeStart = async (requirementText) => {
    try {
      // 이미 존재하는지 확인
      const existing = challenges.find(c => 
        c.title === requirementText || c.description === requirementText
      );
      
      if (existing) {
        setSelectedChallenge(existing);
        setShowStartDialog(true);
        return;
      }
      
      // 새로 생성
      const newChallenge = await challengeHelpers.createChallenge(
        user.id,
        null,
        {
          title: requirementText,
          description: requirementText,
          level: userStats.level
        }
      );
      
      setChallenges(prev => [newChallenge, ...prev]);
      
      // 바로 대화 시작 확인
      setSelectedChallenge(newChallenge);
      setShowStartDialog(true);
    } catch (error) {
      console.error('도전과제 생성 실패:', error);
    }
  };

  // 메인 화면으로 돌아가기
  const handleBackToMain = () => {
    setViewMode('main');
    setActiveChallengeId(null);
    setMessages([]);
    loadUserData(user.id); // 데이터 새로고침
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await conversationHelpers.addMessage(currentConversationId, 'user', userMessage);
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
      let assistantMessage = data.message.replace(/\*\*/g, '');

      await conversationHelpers.addMessage(currentConversationId, 'assistant', assistantMessage);
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);

      // "다했어" 감지
      if (activeChallengeId && (
          userMessage.includes('다했어') || 
          userMessage.includes('완료했어') ||
          userMessage.includes('끝났어') ||
          userMessage.includes('다 했어')
      )) {
        const shouldComplete = window.confirm(
          '🎉 축하해!\n\n이 도전과제를 달성 체크하시겠습니까?'
        );
        
        if (shouldComplete) {
          await challengeHelpers.completeChallenge(activeChallengeId);
          setChallenges(prev => 
            prev.map(c => c.id === activeChallengeId ? { ...c, status: 'completed' } : c)
          );
          
          setTimeout(() => {
            alert('✅ 도전과제 완료! 계속 화이팅! 💪');
            handleBackToMain();
          }, 500);
        }
      }

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다');
    } finally {
      setIsLoading(false);
      // 입력창에 포커스 유지
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // 도전과제 토글
  const handleToggleChallenge = async (challengeId) => {
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;
      
      const newStatus = challenge.status === 'completed' ? 'active' : 'completed';
      
      if (newStatus === 'completed') {
        await challengeHelpers.completeChallenge(challengeId);
      } else {
        await challengeHelpers.updateChallengeStatus(challengeId, 'active');
      }
      
      setChallenges(prev => 
        prev.map(c => c.id === challengeId ? { ...c, status: newStatus } : c)
      );
      
      const stats = await challengeHelpers.getUserStats(user.id);
      const actualLevel = calculateLevel(stats.completed);
      setUserStats({ ...stats, level: actualLevel });
    } catch (error) {
      console.error('도전과제 토글 실패:', error);
    }
  };

  // 진행상황 초기화
  const handleResetProgress = async () => {
    if (!window.confirm('⚠️ 모든 도전과제를 삭제하고 처음부터 시작하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      for (const challenge of challenges) {
        await supabase.from('challenges').delete().eq('id', challenge.id);
      }
      
      setChallenges([]);
      setUserStats({ total: 0, completed: 0, active: 0, level: 1 });
      
      alert('✅ 진행상황이 초기화되었습니다.');
    } catch (error) {
      console.error('초기화 실패:', error);
    }
  };

  // 새 대화 시작
  const handleNewChat = async () => {
    const conv = await conversationHelpers.createConversation(user.id, '새 대화');
    setCurrentConversationId(conv.id);
    setConversations([conv, ...conversations]);
    setMessages([]);
    setViewMode('chat');
    setActiveChallengeId(null);
  };

  // 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 로그인 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              SPARK
            </h1>
            <p className="text-gray-700 font-medium">창업 여정의 시작</p>
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="아이디"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="비밀번호"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-xl transition-all"
            >
              {isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-600 hover:text-orange-700 text-sm font-semibold"
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
  const levelChallenges = challenges.filter(c => c.level === userStats.level);

  // ====== 메인 화면 ======
  if (viewMode === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100 p-2 sm:p-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">SPARK</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-orange-50 rounded-xl transition-all"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </button>
            </div>

            <div className="mt-3 sm:mt-4 bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <p className="font-bold text-sm sm:text-base text-gray-900">{user.name}</p>
              <p className="text-xs sm:text-sm text-gray-600">@{user.username}</p>
            </div>
          </div>

          {/* 새 대화 버튼 */}
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold text-base sm:text-lg hover:shadow-xl transition-all mb-3 sm:mb-4"
          >
            💬 새 대화 시작
          </button>

          {/* 내 진행상황 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">내 진행상황</h2>
            </div>

            {/* 레벨 카드 */}
            <button
              onClick={() => setShowLevelRoadmap(true)}
              className={`w-full bg-gradient-to-r ${currentLevelInfo.bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border-2 border-orange-200 shadow-md hover:shadow-lg transition-all`}
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-4xl sm:text-6xl">{currentLevelInfo.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className={`text-base sm:text-lg font-bold bg-gradient-to-r ${currentLevelInfo.color} bg-clip-text text-transparent`}>
                      Level {userStats.level}
                    </span>
                    {userStats.level < 10 && (
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">
                        {nextLevelChallenges}개 남음
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-0.5 sm:mb-1">{currentLevelInfo.title}</p>
                  <p className="text-xs text-gray-600 hidden sm:block">{currentLevelInfo.description}</p>
                </div>
              </div>
              
              {userStats.level < 10 && (
                <div className="w-full bg-white/50 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div 
                    className={`bg-gradient-to-r ${currentLevelInfo.color} h-2 sm:h-3 rounded-full transition-all duration-500`}
                    style={{ 
                      width: `${(userStats.completed / LEVEL_SYSTEM[userStats.level + 1].requiredChallenges) * 100}%` 
                    }}
                  />
                </div>
              )}
              
              <p className="text-xs text-center text-orange-600 font-medium mt-2 sm:mt-3">클릭하여 전체 로드맵 보기 →</p>
            </button>

            {/* 이번 레벨 도전과제 */}
            <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 border-orange-200 mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-bold text-orange-900 flex items-center gap-1 sm:gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  이번 레벨 도전과제
                </h3>
                <button
                  onClick={() => setHideCompletedChallenges(!hideCompletedChallenges)}
                  className="text-xs text-orange-600 hover:text-orange-800 font-medium transition-colors whitespace-nowrap"
                >
                  {hideCompletedChallenges ? '완료 보기' : '완료 숨기기'}
                </button>
              </div>
              
              <div className="space-y-2">
                {/* 미완료 과제들 (위) */}
                {currentLevelInfo.requirements.map((req, idx) => {
                  const matchingChallenge = levelChallenges.find(c => {
                    const reqLower = req.toLowerCase();
                    const titleLower = c.title.toLowerCase();
                    const descLower = c.description.toLowerCase();
                    
                    if (titleLower === reqLower || descLower === reqLower) return true;
                    
                    const reqWords = reqLower.split(' ').filter(w => w.length > 2);
                    const matchCount = reqWords.filter(word => 
                      titleLower.includes(word) || descLower.includes(word)
                    ).length;
                    
                    return reqWords.length > 0 && matchCount >= Math.ceil(reqWords.length / 2);
                  });
                  
                  const isCompleted = matchingChallenge?.status === 'completed';
                  
                  // 완료된 것은 나중에 표시
                  if (isCompleted && !hideCompletedChallenges) return null;
                  if (isCompleted && hideCompletedChallenges) return null;
                  
                  return (
                    <div
                      key={`req-active-${userStats.level}-${idx}`}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-orange-100 transition-all"
                    >
                      {/* 체크박스 영역 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (matchingChallenge) {
                            handleToggleChallenge(matchingChallenge.id);
                          } else {
                            // 없으면 생성 후 완료
                            handleRequiredChallengeStart(req);
                          }
                        }}
                        className="flex-shrink-0"
                      >
                        <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                      </button>
                      
                      {/* 글씨 영역 */}
                      <button
                        onClick={() => {
                          if (matchingChallenge) {
                            handleChallengeTextClick(matchingChallenge);
                          } else {
                            handleRequiredChallengeStart(req);
                          }
                        }}
                        className="flex-1 text-left text-xs sm:text-sm text-gray-800 hover:text-orange-600 transition-colors"
                      >
                        {req}
                      </button>
                    </div>
                  );
                })}

                {/* 추가 도전과제 (미완료) */}
                {levelChallenges.filter(c => {
                  const isExtra = !currentLevelInfo.requirements.some(req => {
                    const reqLower = req.toLowerCase();
                    const titleLower = c.title.toLowerCase();
                    const descLower = c.description.toLowerCase();
                    
                    if (titleLower === reqLower || descLower === reqLower) return true;
                    
                    const reqWords = reqLower.split(' ').filter(w => w.length > 2);
                    const matchCount = reqWords.filter(word => 
                      titleLower.includes(word) || descLower.includes(word)
                    ).length;
                    
                    return reqWords.length > 0 && matchCount >= Math.ceil(reqWords.length / 2);
                  });
                  
                  return isExtra && c.status !== 'completed';
                }).map(challenge => (
                  <div
                    key={`extra-active-${challenge.id}`}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-orange-100 transition-all"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleChallenge(challenge.id);
                      }}
                      className="flex-shrink-0"
                    >
                      <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    </button>
                    
                    <button
                      onClick={() => handleChallengeTextClick(challenge)}
                      className="flex-1 text-left text-xs sm:text-sm text-gray-800 hover:text-orange-600 transition-colors"
                    >
                      {challenge.title}
                    </button>
                  </div>
                ))}

                {!hideCompletedChallenges && (
                  <>
                    {/* 완료된 필수 과제들 (아래) */}
                    {currentLevelInfo.requirements.map((req, idx) => {
                      const matchingChallenge = levelChallenges.find(c => {
                        const reqLower = req.toLowerCase();
                        const titleLower = c.title.toLowerCase();
                        const descLower = c.description.toLowerCase();
                        
                        if (titleLower === reqLower || descLower === reqLower) return true;
                        
                        const reqWords = reqLower.split(' ').filter(w => w.length > 2);
                        const matchCount = reqWords.filter(word => 
                          titleLower.includes(word) || descLower.includes(word)
                        ).length;
                        
                        return reqWords.length > 0 && matchCount >= Math.ceil(reqWords.length / 2);
                      });
                      
                      if (!matchingChallenge || matchingChallenge.status !== 'completed') return null;
                      
                      return (
                        <div
                          key={`req-completed-${userStats.level}-${idx}`}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-green-50 transition-all opacity-60"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleChallenge(matchingChallenge.id);
                            }}
                            className="flex-shrink-0"
                          >
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </button>
                          
                          <span className="flex-1 text-xs sm:text-sm text-gray-600 line-through">
                            {req}
                          </span>
                        </div>
                      );
                    })}

                    {/* 완료된 추가 도전과제 */}
                    {levelChallenges.filter(c => {
                      const isExtra = !currentLevelInfo.requirements.some(req => {
                        const reqLower = req.toLowerCase();
                        const titleLower = c.title.toLowerCase();
                        const descLower = c.description.toLowerCase();
                        
                        if (titleLower === reqLower || descLower === reqLower) return true;
                        
                        const reqWords = reqLower.split(' ').filter(w => w.length > 2);
                        const matchCount = reqWords.filter(word => 
                          titleLower.includes(word) || descLower.includes(word)
                        ).length;
                        
                        return reqWords.length > 0 && matchCount >= Math.ceil(reqWords.length / 2);
                      });
                      
                      return isExtra && c.status === 'completed';
                    }).map(challenge => (
                      <div
                        key={`extra-completed-${challenge.id}`}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-green-50 transition-all opacity-60"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleChallenge(challenge.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </button>
                        
                        <span className="flex-1 text-xs sm:text-sm text-gray-600 line-through">
                          {challenge.title}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-orange-300">
                <div className="text-xl sm:text-2xl font-bold text-orange-700">{userStats.total}</div>
                <div className="text-xs text-orange-700 font-medium">전체</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-green-300">
                <div className="text-xl sm:text-2xl font-bold text-green-700">{userStats.completed}</div>
                <div className="text-xs text-green-700 font-medium">완료</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-blue-300">
                <div className="text-xl sm:text-2xl font-bold text-blue-700">{userStats.active}</div>
                <div className="text-xs text-blue-700 font-medium">진행중</div>
              </div>
            </div>

            {/* 초기화 버튼 */}
            <button
              onClick={handleResetProgress}
              className="w-full px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg sm:rounded-xl text-xs font-medium transition-all border border-gray-300 hover:border-red-300"
            >
              🔄 진행상황 초기화
            </button>
          </div>

          {/* 최근 대화 */}
          {conversations.length > 0 && (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">최근 대화</h2>
              <div className="space-y-2">
                {conversations.slice(0, 5).map(conv => (
                  <button
                    key={conv.id}
                    onClick={async () => {
                      setCurrentConversationId(conv.id);
                      const msgs = await conversationHelpers.getMessages(conv.id);
                      setMessages(msgs);
                      setViewMode('chat');
                      setActiveChallengeId(null);
                    }}
                    className="w-full text-left p-2 sm:p-3 hover:bg-orange-50 rounded-xl transition-all"
                  >
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 대화 시작 확인 다이얼로그 */}
        {showStartDialog && selectedChallenge && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">도전과제 시작</h3>
              <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4">
                "{selectedChallenge.title}"
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6">
                이 도전과제에 대해 SPARK와 대화해볼까요?
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowStartDialog(false);
                    setSelectedChallenge(null);
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmStart}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all"
                >
                  시작하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 레벨 로드맵 */}
        {showLevelRoadmap && (
          <div 
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setShowLevelRoadmap(false)}
          >
            <div 
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white pb-3 sm:pb-4 border-b">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">레벨 로드맵</h3>
                </div>
                <button
                  onClick={() => setShowLevelRoadmap(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {Object.entries(LEVEL_SYSTEM).map(([level, info]) => {
                  const levelNum = parseInt(level);
                  const isCurrentLevel = levelNum === userStats.level;
                  const isCompleted = userStats.completed >= info.requiredChallenges;
                  
                  return (
                    <div
                      key={level}
                      className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 transition-all ${
                        isCurrentLevel 
                          ? `bg-gradient-to-r ${info.bgColor} border-orange-400 shadow-lg sm:scale-105` 
                          : isCompleted
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="text-3xl sm:text-5xl">{info.emoji}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <span className={`text-base sm:text-lg font-bold bg-gradient-to-r ${info.color} bg-clip-text text-transparent`}>
                              Level {level}
                            </span>
                            {isCompleted && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                            {isCurrentLevel && !isCompleted && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-bold">현재</span>}
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-2">{info.title}</p>
                          <p className="text-xs text-gray-600 mb-2 sm:mb-3">{info.description}</p>
                          
                          <div className="bg-white/80 rounded-lg sm:rounded-xl p-2 sm:p-3">
                            <p className="text-xs font-bold text-gray-700 mb-1 sm:mb-2">필요 도전과제: {info.requiredChallenges}개</p>
                            <ul className="space-y-0.5 sm:space-y-1">
                              {info.requirements.map((req, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5 sm:gap-2">
                                  <Circle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mt-0.5 flex-shrink-0 text-orange-500" />
                                  <span className="leading-tight">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====== 채팅 화면 ======
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* 헤더 */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-orange-200 shadow-lg flex-shrink-0">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleBackToMain}
            className="p-1.5 sm:p-2 hover:bg-orange-50 rounded-lg sm:rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">SPARK</span>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ minHeight: 0 }}>
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">대화를 시작해보세요!</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] sm:max-w-[80%]">
                <div
                  className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white'
                      : 'bg-white border-2 border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-xs sm:text-sm">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
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
      </div>

      {/* 입력 영역 */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-orange-200 shadow-lg flex-shrink-0">
        <div className="max-w-2xl mx-auto p-2 sm:p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white rounded-lg sm:rounded-xl hover:shadow-xl transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
