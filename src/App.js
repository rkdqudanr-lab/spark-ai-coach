// src/App.js - 최종 개편 버전
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, CheckCircle, Circle, Trophy, LogOut, Menu, X, Eye, EyeOff, Target, Info, Plus, Trash2, ChevronDown, ChevronUp, MoreVertical, Edit2, Check, Clock, Link as LinkIcon, Folder, FolderPlus, ExternalLink } from 'lucide-react';
import { 
  authHelpers, 
  conversationHelpers, 
  challengeHelpers 
} from './supabaseClient';

// 레벨 시스템 정의 (이모티콘 추가)
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
    title: "중상급: 시장 검증",
    description: "시장성을 검증하는 단계",
    color: "from-blue-400 to-indigo-400",
    bgColor: "from-blue-50 to-indigo-50",
    requirements: [
      "시장조사 보고서 완성",
      "타겟 고객 페르소나 3개 작성",
      "MVP 기획서 작성",
      "사업 타당성 분석"
    ],
    requiredChallenges: 12
  },
  5: {
    emoji: "🏗️",
    title: "고급: 비즈니스 모델 설계",
    description: "수익 모델을 만드는 단계",
    color: "from-purple-400 to-pink-400",
    bgColor: "from-purple-50 to-pink-50",
    requirements: [
      "비즈니스 모델 캔버스 완성",
      "수익 구조 설계",
      "예상 손익계산서 작성",
      "투자 계획서 초안"
    ],
    requiredChallenges: 16
  },
  6: {
    emoji: "🏢",
    title: "실전 준비: 자료 구축",
    description: "실제 사업을 준비하는 단계",
    color: "from-orange-400 to-red-400",
    bgColor: "from-orange-50 to-red-50",
    requirements: [
      "사업계획서 1차 완성",
      "재무 계획 수립",
      "마케팅 전략 수립",
      "팀 구성 계획"
    ],
    requiredChallenges: 20
  },
  7: {
    emoji: "🤝",
    title: "실전 돌입: 네트워킹",
    description: "실전 경험을 쌓는 단계",
    color: "from-rose-400 to-pink-400",
    bgColor: "from-rose-50 to-pink-50",
    requirements: [
      "창업 네트워킹 행사 3회 참석",
      "예비 창업자 커뮤니티 가입",
      "멘토 1명 확보",
      "파트너/팀원 모집"
    ],
    requiredChallenges: 24
  },
  8: {
    emoji: "🎯",
    title: "도전: 공모전 참가",
    description: "실전 테스트하는 단계",
    color: "from-violet-400 to-purple-400",
    bgColor: "from-violet-50 to-purple-50",
    requirements: [
      "창업 공모전 1개 제출",
      "피칭 연습 10회 이상",
      "피드백 반영한 사업계획서 2차 완성",
      "IR 덱 완성"
    ],
    requiredChallenges: 28
  },
  9: {
    emoji: "📝",
    title: "최종 준비: 예창패 서류",
    description: "예비창업패키지 서류 완성 단계",
    color: "from-indigo-400 to-blue-400",
    bgColor: "from-indigo-50 to-blue-50",
    requirements: [
      "예비창업패키지 한글 파일 완성",
      "예비창업패키지 PPT 완성",
      "최종 검토 및 피드백 반영",
      "제출 서류 체크리스트 완료"
    ],
    requiredChallenges: 32
  },
  10: {
    emoji: "🚀",
    title: "최종 목표: 예창패 도전!",
    description: "예비창업패키지 신청 단계",
    color: "from-yellow-400 via-orange-400 to-red-400",
    bgColor: "from-yellow-50 via-orange-50 to-red-50",
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
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingConvTitle, setEditingConvTitle] = useState('');
  
  // 도전과제 상태
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, completed: 0, active: 0, level: 1 });
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false);
  const [pendingChallengeText, setPendingChallengeText] = useState('');
  
  // UI 상태
  const [showSidebar, setShowSidebar] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [challengeMenuId, setChallengeMenuId] = useState(null);
  
  // 뽀모도로 타이머
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showTimerComplete, setShowTimerComplete] = useState(false);
  
  // 링크 관리
  const [links, setLinks] = useState([]);
  const [folders, setFolders] = useState([{ id: 'default', name: '기본' }]);
  const [showLinkManager, setShowLinkManager] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkFolder, setNewLinkFolder] = useState('default');
  const [newFolderName, setNewFolderName] = useState('');
  
  const messagesEndRef = useRef(null);
  const timerInterval = useRef(null);

  // 초기 로드
  useEffect(() => {
    const currentUser = authHelpers.getCurrentUser();
    
    if (currentUser) {
      setUser(currentUser);
      loadUserData(currentUser.id);
      
      // localStorage에서 링크/폴더 불러오기
      const savedLinks = localStorage.getItem(`links_${currentUser.id}`);
      const savedFolders = localStorage.getItem(`folders_${currentUser.id}`);
      if (savedLinks) setLinks(JSON.parse(savedLinks));
      if (savedFolders) setFolders(JSON.parse(savedFolders));
    }
  }, []);

  // 타이머 효과
  useEffect(() => {
    if (timerActive) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev === 0) {
            if (timerMinutes === 0) {
              setTimerActive(false);
              setShowTimerComplete(true);
              return 0;
            }
            setTimerMinutes(m => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timerActive, timerMinutes]);

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

  // 대화 제목 변경
  const handleRenameConversation = async (convId, newTitle) => {
    try {
      await conversationHelpers.updateConversationTitle(convId, newTitle);
      setConversations(conversations.map(c => 
        c.id === convId ? { ...c, title: newTitle } : c
      ));
      setEditingConvId(null);
    } catch (error) {
      console.error('제목 변경 실패:', error);
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
      let assistantMessage = data.message;
      
      // ** 제거 (볼드 마크다운)
      assistantMessage = assistantMessage.replace(/\*\*/g, '');

      await conversationHelpers.addMessage(convId, 'assistant', assistantMessage);
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);

      // 도전과제 감지
      if (assistantMessage.includes('🎯 이번 주 도전과제')) {
        setPendingChallengeText(assistantMessage);
      }

    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 대화에서 도전과제 추가
  const handleAddChallengeFromChat = async () => {
    if (!pendingChallengeText) return;

    try {
      const titleMatch = pendingChallengeText.match(/미션: (.+)/);
      const title = titleMatch ? titleMatch[1] : '새 도전과제';
      
      const challenge = await challengeHelpers.createChallenge(
        user.id,
        currentConversationId,
        {
          title,
          description: pendingChallengeText,
          level: userStats.level
        }
      );

      setChallenges([challenge, ...challenges]);
      const stats = await challengeHelpers.getUserStats(user.id);
      const actualLevel = calculateLevel(stats.completed);
      setUserStats({ ...stats, level: actualLevel });
      
      setPendingChallengeText('');
    } catch (error) {
      console.error('도전과제 저장 실패:', error);
    }
  };

  // 도전과제 완료/취소 토글
  const handleToggleChallenge = async (challengeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
      
      if (newStatus === 'completed') {
        await challengeHelpers.completeChallenge(challengeId);
      } else {
        // 취소 로직 (DB에 uncomplete 함수 필요하면 추가)
        await challengeHelpers.updateChallengeStatus(challengeId, 'active');
      }
      
      setChallenges(challenges.map(c => 
        c.id === challengeId ? { ...c, status: newStatus } : c
      ));
      
      const stats = await challengeHelpers.getUserStats(user.id);
      const actualLevel = calculateLevel(stats.completed);
      setUserStats({ ...stats, level: actualLevel });
    } catch (error) {
      console.error('도전과제 상태 변경 실패:', error);
    }
  };

  // 도전과제 레벨 변경
  const handleMoveChallengeToLevel = async (challengeId, newLevel) => {
    try {
      await challengeHelpers.updateChallengeLevel(challengeId, newLevel);
      
      setChallenges(challenges.map(c => 
        c.id === challengeId ? { ...c, level: newLevel } : c
      ));
    } catch (error) {
      console.error('도전과제 레벨 변경 실패:', error);
    }
  };

  // 링크 추가
  const handleAddLink = () => {
    if (!newLinkName || !newLinkUrl) return;
    
    const newLink = {
      id: Date.now(),
      name: newLinkName,
      url: newLinkUrl,
      folderId: newLinkFolder
    };
    
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    localStorage.setItem(`links_${user.id}`, JSON.stringify(updatedLinks));
    
    setNewLinkName('');
    setNewLinkUrl('');
  };

  // 폴더 추가
  const handleAddFolder = () => {
    if (!newFolderName) return;
    
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName
    };
    
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem(`folders_${user.id}`, JSON.stringify(updatedFolders));
    
    setNewFolderName('');
  };

  // 타이머 시작/정지
  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  // 타이머 리셋
  const resetTimer = () => {
    setTimerActive(false);
    setTimerMinutes(25);
    setTimerSeconds(0);
  };

  // 새로고침
  const handleRefresh = () => {
    window.location.reload();
  };

  // 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 로그인/회원가입 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500 flex items-center justify-center p-4 transition-all duration-500">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-2xl mb-4 shadow-lg animate-pulse-slow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              SPARK
            </h1>
            <p className="text-gray-700 font-medium">창업 여정의 시작</p>
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm animate-shake">
              {authError}
            </div>
          )}

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div className="animate-slide-down">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-all"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
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
  const levelChallenges = challenges.filter(c => c.level === userStats.level);

  // 메인 앱 화면
  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100">
      {/* 사이드바 */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-80 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl border-r border-orange-200/50 transition-all duration-300 ease-out z-20 shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b border-orange-200/50">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">SPARK</span>
              </button>
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
                  className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200"
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
                className="w-full p-3 flex items-center justify-between hover:bg-white/80 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">내 진행상황</span>
                </div>
                {showStats ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
              </button>
              
              <div className={`transition-all duration-300 ease-out ${showStats ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 space-y-3">
                  {/* 레벨 카드 */}
                  <button
                    onClick={() => setShowLevelRoadmap(true)}
                    className={`w-full bg-gradient-to-r ${currentLevelInfo.bgColor} rounded-2xl p-4 border-2 border-opacity-30 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-5xl">{currentLevelInfo.emoji}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-bold bg-gradient-to-r ${currentLevelInfo.color} bg-clip-text text-transparent`}>
                            Level {userStats.level}
                          </span>
                          {userStats.level < 10 && (
                            <span className="text-xs text-gray-600 font-medium">
                              {nextLevelChallenges}개 남음
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-800">{currentLevelInfo.title}</p>
                        <p className="text-xs text-gray-600">{currentLevelInfo.description}</p>
                      </div>
                    </div>
                    
                    {/* 프로그레스 바 */}
                    {userStats.level < 10 && (
                      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`bg-gradient-to-r ${currentLevelInfo.color} h-2 rounded-full transition-all duration-500 ease-out`}
                          style={{ 
                            width: `${(userStats.completed / LEVEL_SYSTEM[userStats.level + 1].requiredChallenges) * 100}%` 
                          }}
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-center text-gray-500 mt-2">클릭하여 전체 로드맵 보기 →</p>
                  </button>

                  {/* 이번 레벨 도전과제 */}
                  <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-xl p-3 border-2 border-orange-200">
                    <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      이번 레벨 도전과제
                    </h4>
                    
                    <div className="space-y-2 mb-3">
                      {currentLevelInfo.requirements.map((req, idx) => {
                        const matchingChallenge = levelChallenges.find(c => 
                          c.title.includes(req.split(' ')[0]) || c.description.includes(req)
                        );
                        
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-100 transition-all duration-200 group"
                          >
                            <button
                              onClick={() => matchingChallenge && handleToggleChallenge(matchingChallenge.id, matchingChallenge.status)}
                              className="mt-0.5"
                            >
                              {matchingChallenge?.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-orange-500" />
                              )}
                            </button>
                            <span className="flex-1 text-xs text-gray-700">{req}</span>
                            {matchingChallenge && (
                              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setChallengeMenuId(challengeMenuId === matchingChallenge.id ? null : matchingChallenge.id)}
                                  className="p-1 hover:bg-orange-200 rounded"
                                >
                                  <MoreVertical className="w-3 h-3 text-gray-600" />
                                </button>
                                {challengeMenuId === matchingChallenge.id && (
                                  <div className="absolute right-0 mt-1 bg-white border-2 border-orange-200 rounded-lg shadow-lg p-2 z-10 whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        const nextLevel = userStats.level + 1;
                                        if (nextLevel <= 10) {
                                          handleMoveChallengeToLevel(matchingChallenge.id, nextLevel);
                                        }
                                        setChallengeMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 rounded transition-colors"
                                    >
                                      다음 레벨로 이동
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 추가 도전과제 */}
                    {levelChallenges.filter(c => 
                      !currentLevelInfo.requirements.some(req => 
                        c.title.includes(req.split(' ')[0]) || c.description.includes(req)
                      )
                    ).map(challenge => (
                      <div
                        key={challenge.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-orange-100 transition-all duration-200 mb-2 group"
                      >
                        <button
                          onClick={() => handleToggleChallenge(challenge.id, challenge.status)}
                          className="mt-0.5"
                        >
                          {challenge.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-orange-500" />
                          )}
                        </button>
                        <span className="flex-1 text-xs text-gray-700">{challenge.title}</span>
                        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setChallengeMenuId(challengeMenuId === challenge.id ? null : challenge.id)}
                            className="p-1 hover:bg-orange-200 rounded"
                          >
                            <MoreVertical className="w-3 h-3 text-gray-600" />
                          </button>
                          {challengeMenuId === challenge.id && (
                            <div className="absolute right-0 mt-1 bg-white border-2 border-orange-200 rounded-lg shadow-lg p-2 z-10 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  const nextLevel = userStats.level + 1;
                                  if (nextLevel <= 10) {
                                    handleMoveChallengeToLevel(challenge.id, nextLevel);
                                  }
                                  setChallengeMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 rounded transition-colors"
                              >
                                다음 레벨로 이동
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
              </div>
            </div>
          </div>

          {/* 메뉴 */}
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={startNewConversation}
              className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white py-3 rounded-xl font-bold text-base hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 mb-4"
            >
              + 새 대화
            </button>

            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">최근 대화</h3>
            <div className="space-y-2">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`w-full rounded-xl transition-all duration-200 group ${
                    currentConversationId === conv.id
                      ? 'bg-gradient-to-r from-orange-200 via-rose-200 to-pink-200 border-2 border-orange-400 shadow-lg'
                      : 'bg-white/70 hover:bg-white border-2 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between p-3">
                    <button
                      onClick={() => loadConversation(conv.id)}
                      className="flex-1 text-left"
                    >
                      {editingConvId === conv.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingConvTitle}
                            onChange={(e) => setEditingConvTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRenameConversation(conv.id, editingConvTitle)}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameConversation(conv.id, editingConvTitle)}
                            className="p-1 hover:bg-green-100 rounded"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => {
                          setEditingConvId(conv.id);
                          setEditingConvTitle(conv.title);
                        }}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="이름 변경"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => setConversationToDelete(conv.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="대화 삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
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
        <div className="bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl border-b border-orange-200/50 p-4 flex items-center justify-between shadow-lg">
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* 추가 기능 버튼 */}
          <div className="ml-auto flex items-center gap-2">
            {/* 집중 타이머 */}
            <div className="relative">
              <button
                onClick={() => setShowTimerSettings(!showTimerSettings)}
                className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-2"
                title="집중 타이머"
              >
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">집중 타이머</span>
              </button>
              
              {showTimerSettings && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTimerSettings(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-orange-200 p-4 z-50 animate-slide-down">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">집중 타이머</h4>
                    <div className="bg-gradient-to-r from-orange-50 to-rose-50 rounded-lg p-3 border border-orange-200">
                      <div className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                        {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                      </div>
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={toggleTimer}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          {timerActive ? '일시정지' : '시작'}
                        </button>
                        <button
                          onClick={resetTimer}
                          className="px-3 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all"
                        >
                          리셋
                        </button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600 font-medium">시간 설정</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[15, 25, 45].map(mins => (
                            <button
                              key={mins}
                              onClick={() => {
                                setTimerMinutes(mins);
                                setTimerSeconds(0);
                                setTimerActive(false);
                              }}
                              className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                                timerMinutes === mins && timerSeconds === 0 && !timerActive
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {mins}분
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 링크 관리 */}
            <div className="relative">
              <button
                onClick={() => setShowLinkMenu(!showLinkMenu)}
                className="p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-2"
                title="링크 관리"
              >
                <LinkIcon className="w-5 h-5 text-gray-600" />
                <span className="hidden sm:inline text-sm font-medium text-gray-700">링크</span>
              </button>
              
              {showLinkMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLinkMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-purple-200 p-4 z-50 animate-slide-down max-h-[80vh] overflow-y-auto">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">링크 관리</h4>
                    
                    {/* 새 링크 추가 */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 mb-3 border border-purple-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">새 링크 추가</p>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="링크 이름"
                          value={newLinkName}
                          onChange={(e) => setNewLinkName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          value={newLinkUrl}
                          onChange={(e) => setNewLinkUrl(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                        <div className="flex gap-2">
                          <select
                            value={newLinkFolder}
                            onChange={(e) => setNewLinkFolder(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          >
                            {folders.map(folder => (
                              <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={handleAddLink}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                          >
                            추가
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 새 폴더 추가 */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 mb-3 border border-blue-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">새 폴더</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="폴더 이름"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <button
                          onClick={handleAddFolder}
                          className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 링크 목록 */}
                    <div className="space-y-2">
                      {folders.map(folder => {
                        const folderLinks = links.filter(link => link.folderId === folder.id);
                        if (folderLinks.length === 0) return null;
                        
                        return (
                          <div key={folder.id} className="border border-gray-200 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Folder className="w-3 h-3 text-orange-600" />
                              <h5 className="font-semibold text-xs text-gray-900">{folder.name}</h5>
                            </div>
                            <div className="space-y-1">
                              {folderLinks.map(link => (
                                <a
                                  key={link.id}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors group"
                                >
                                  <span className="text-xs text-gray-700 group-hover:text-orange-600 truncate">{link.name}</span>
                                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-orange-600 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {links.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">추가된 링크가 없습니다</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 px-4 animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse-slow">
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
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className="max-w-[85%] sm:max-w-2xl">
                <div
                  className={`rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white'
                      : 'bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{msg.content}</p>
                </div>
                
                {/* 도전과제 추가 버튼 */}
                {msg.role === 'assistant' && msg.content.includes('🎯 이번 주 도전과제') && (
                  <button
                    onClick={() => {
                      setPendingChallengeText(msg.content);
                      handleAddChallengeFromChat();
                    }}
                    className="mt-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    + 도전과제에 추가
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-slide-up">
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
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white/80"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      
      {/* 대화 삭제 확인 */}
      {conversationToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
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
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConversation}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 레벨 로드맵 */}
      {showLevelRoadmap && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowLevelRoadmap(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">레벨 로드맵</h3>
              </div>
              <button
                onClick={() => setShowLevelRoadmap(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(LEVEL_SYSTEM).map(level => {
                const levelNum = parseInt(level);
                const levelInfo = LEVEL_SYSTEM[levelNum];
                const isCurrentLevel = levelNum === userStats.level;
                const isCompleted = levelNum < userStats.level;
                
                return (
                  <div
                    key={level}
                    className={`rounded-2xl p-4 border-2 transition-all duration-300 ${
                      isCurrentLevel
                        ? `bg-gradient-to-r ${levelInfo.bgColor} border-opacity-50 shadow-lg scale-105`
                        : isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-5xl">{levelInfo.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold bg-gradient-to-r ${levelInfo.color} bg-clip-text text-transparent`}>
                            Level {levelNum}
                          </span>
                          {isCurrentLevel && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-bold">
                              현재
                            </span>
                          )}
                          {isCompleted && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <p className="font-bold text-gray-900 mb-1">{levelInfo.title}</p>
                        <p className="text-sm text-gray-600">{levelInfo.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">필요 과제</p>
                        <p className="text-2xl font-bold text-gray-900">{levelInfo.requiredChallenges}개</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {levelInfo.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className={`mt-1 ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>•</span>
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 타이머 완료 */}
      {showTimerComplete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => {
            setShowTimerComplete(false);
            resetTimer();
          }}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-green-200 animate-scale-in text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">수고했어요! 🎉</h3>
            <p className="text-gray-700 mb-6">
              오늘의 창업 몰입 시간이 종료되었습니다.<br />
              <span className="font-bold text-green-600">대단해요!</span>
            </p>
            <button
              onClick={() => {
                setShowTimerComplete(false);
                resetTimer();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        /* 스크롤바 스타일링 */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
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
