// src/App.js - 카카오 로그인 포함 버전 (Supabase OAuth 정석 적용)
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Heart, MapPin, CheckCircle, Circle, Trophy, LogOut, Target, ArrowLeft, X, Plus, Trash2 } from 'lucide-react';
import {
  authHelpers,
  conversationHelpers,
  challengeHelpers,
  profileHelpers,
  supabase
} from './supabaseClient';

const MAX_CONTEXT_MESSAGES = 20;

// 에러 경계 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('앱 에러:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #dbeafe, #c7d2fe, #ddd6fe)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h1 style={{ color: '#dc2626', marginBottom: '20px' }}>⚠️ 오류 발생</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              앱을 불러오는 중 문제가 발생했습니다.
            </p>
            <div style={{
              background: '#fef2f2',
              padding: '15px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#991b1b'
            }}>
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ 카카오 로그인 콜백 컴포넌트 (Supabase OAuth 세션 교환)
function KakaoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get('code');

      if (!code) {
        alert('로그인에 실패했습니다.');
        navigate('/');
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('세션 교환 실패:', error);
          alert('로그인에 실패했습니다: ' + (error.message || 'Unknown error'));
          navigate('/');
          return;
        }

        window.location.href = '/';
      } catch (e) {
        console.error('콜백 처리 실패:', e);
        alert('로그인에 실패했습니다.');
        navigate('/');
      }
    };

    run();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg animate-bounce">
          <Heart className="w-10 h-10 text-blue-500" />
        </div>
        <p className="text-white font-bold text-xl">로그인 중...</p>
      </div>
    </div>
  );
}

// 하트뷰 레벨 시스템
const LEVEL_SYSTEM = {
  1: {
    emoji: "🌱",
    title: "준비: 첫 걸음",
    description: "구직 준비 시작 단계",
    color: "from-blue-400 to-cyan-400",
    bgColor: "from-blue-50 to-cyan-50",
    requirements: [
      "하루 10분 산책하기",
      "관심 있는 직무 3가지 찾아보기",
      "간단한 이력서 초안 작성"
    ],
    requiredChallenges: 3
  },
  2: {
    emoji: "🔍",
    title: "탐색: 일자리 찾기",
    description: "지역 일자리 둘러보기",
    color: "from-cyan-400 to-sky-400",
    bgColor: "from-cyan-50 to-sky-50",
    requirements: [
      "지역 일자리 사이트 둘러보기",
      "관심 기업/가게 3곳 리스트업",
      "자기소개서 한 문장 써보기"
    ],
    requiredChallenges: 5
  },
  3: {
    emoji: "📝",
    title: "시작: 지원해보기",
    description: "첫 지원 경험",
    color: "from-sky-400 to-blue-400",
    bgColor: "from-sky-50 to-blue-50",
    requirements: [
      "이력서 1곳 제출해보기",
      "전화 문의 1곳 해보기",
      "일자리 설명회 참석"
    ],
    requiredChallenges: 8
  },
  4: {
    emoji: "💪",
    title: "도전: 적극 지원",
    description: "여러 곳 지원하기",
    color: "from-blue-400 to-indigo-400",
    bgColor: "from-blue-50 to-indigo-50",
    requirements: [
      "이력서 3곳 이상 제출",
      "면접 1회 경험",
      "청년센터 상담 받기"
    ],
    requiredChallenges: 12
  },
  5: {
    emoji: "🎯",
    title: "성장: 경험 쌓기",
    description: "역량 강화",
    color: "from-indigo-400 to-purple-400",
    bgColor: "from-indigo-50 to-purple-50",
    requirements: [
      "면접 후 피드백 정리",
      "자격증 시험 준비 시작",
      "지역 청년 모임 참여"
    ],
    requiredChallenges: 16
  },
  6: {
    emoji: "📚",
    title: "발전: 자격증/교육",
    description: "스킬 업그레이드",
    color: "from-purple-400 to-pink-400",
    bgColor: "from-purple-50 to-pink-50",
    requirements: [
      "자격증 1개 취득",
      "단기 아르바이트 경험",
      "멘토링 프로그램 참여"
    ],
    requiredChallenges: 20
  },
  7: {
    emoji: "🤝",
    title: "확장: 네트워킹",
    description: "인맥 쌓기",
    color: "from-pink-400 to-rose-400",
    bgColor: "from-pink-50 to-rose-50",
    requirements: [
      "정규직 면접 3회 이상",
      "네트워킹 이벤트 참석",
      "직무 교육 프로그램 수료"
    ],
    requiredChallenges: 24
  },
  8: {
    emoji: "💼",
    title: "안정: 취업 성공",
    description: "일자리 찾기 성공",
    color: "from-rose-400 to-red-400",
    bgColor: "from-rose-50 to-red-50",
    requirements: [
      "정규직/희망 직무 취업",
      "첫 월급 받기",
      "근무 적응 기간 완료"
    ],
    requiredChallenges: 28
  },
  9: {
    emoji: "🌟",
    title: "정착: 지역 적응",
    description: "안정적 근무",
    color: "from-orange-400 to-amber-400",
    bgColor: "from-orange-50 to-amber-50",
    requirements: [
      "3개월 이상 근무",
      "업무 역량 개발",
      "지역 정착 계획 수립"
    ],
    requiredChallenges: 32
  },
  10: {
    emoji: "🏆",
    title: "자립: 완전 독립",
    description: "경제적 자립 달성",
    color: "from-blue-400 via-indigo-400 to-purple-400",
    bgColor: "from-blue-50 via-indigo-50 to-purple-50",
    requirements: [
      "6개월 이상 안정 근무",
      "자립 생활 기반 확보",
      "다른 청년 멘토링"
    ],
    requiredChallenges: 35
  }
};

function calculateLevel(completedCount) {
  if (completedCount >= 35) return 10;
  if (completedCount >= 32) return 9;
  if (completedCount >= 28) return 8;
  if (completedCount >= 24) return 7;
  if (completedCount >= 20) return 6;
  if (completedCount >= 16) return 5;
  if (completedCount >= 12) return 4;
  if (completedCount >= 8) return 3;
  if (completedCount >= 5) return 2;
  if (completedCount >= 3) return 1;
  return 1;
}

function getChallengesUntilNextLevel(currentLevel, completedCount) {
  if (currentLevel >= 10) return 0;
  return LEVEL_SYSTEM[currentLevel + 1].requiredChallenges - completedCount;
}

function MainApp() {
  // 인증
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [userProfile, setUserProfile] = useState({});
  const [suggestedChallenge, setSuggestedChallenge] = useState(null);

  // 뷰
  const [viewMode, setViewMode] = useState('main');
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [hideCompletedChallenges, setHideCompletedChallenges] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false);

  const [showAddChallengeDialog, setShowAddChallengeDialog] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({ title: '', message: '', onConfirm: null });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');

  // 데이터
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, completed: 0, active: 0, level: 1 });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 초기 로드
  useEffect(() => {
    const initApp = async () => {
      try {
        const currentUser = await authHelpers.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await loadUserData(currentUser.id);
        }
      } catch (error) {
        console.error('초기 로드 실패:', error);
        setUser(null);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initApp();
  }, []);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUserData = async (userId) => {
    try {
      const [convs, challs, profile] = await Promise.all([
        conversationHelpers.getConversations(userId),
        challengeHelpers.getChallenges(userId),
        profileHelpers.getProfile(userId)
      ]);

      setConversations(convs);
      setChallenges(challs);
      setUserProfile(profile.profile_data || {});
      setUserInstructions(profile.user_instructions || '');

      const stats = await challengeHelpers.getUserStats(userId);
      setUserStats({ ...stats, level: calculateLevel(stats.completed) });
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      showConfirm('오류', '데이터를 불러오는데 실패했습니다. 다시 로그인해주세요.', () => handleLogout());
    }
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmDialogData({ title, message, onConfirm });
    setShowConfirmDialog(true);
  };

  // ✅ 카카오 로그인 핸들러 (Supabase OAuth)
const handleKakaoLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: 'https://spark-ai-coach.vercel.app/auth/callback',
        skipBrowserRedirect: false, // 명시적으로 설정
      },
    });

    if (error) {
      console.error('❌ 카카오 로그인 실패:', error);
      alert('로그인 실패: ' + error.message);
    }
  } catch (e) {
    console.error('❌ 예외 발생:', e);
    alert('오류 발생: ' + e.message);
  }
};
  const handleSaveUserInstructions = async () => {
    if (!user?.id) {
      alert('❌ 사용자 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profile')
        .update({ user_instructions: userInstructions })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowProfileDialog(false);
      alert('✅ 내 정보가 저장되었습니다!');
    }
    catch (error) {
      console.error('❌ 저장 실패:', error);
      alert(`❌ 저장에 실패했습니다: ${error.message}`);
    }
  };

  const formatProfileForDisplay = () => {
    if (!userProfile || Object.keys(userProfile).length === 0) {
      return "아직 학습된 정보가 없습니다. 대화를 통해 하트뷰가 당신을 알아가고 있어요!";
    }

    const items = [];

    if (userProfile['희망 직무']) items.push(`희망 직무: ${userProfile['희망 직무']}`);
    if (userProfile['거주 지역']) items.push(`거주 지역: ${userProfile['거주 지역']}`);
    if (userProfile['현재 상태']) items.push(`현재 상태: ${userProfile['현재 상태']}`);
    if (userProfile['심리 상태']) items.push(`심리 상태: ${userProfile['심리 상태']}`);
    if (userProfile['근무 조건']) items.push(`근무 조건: ${userProfile['근무 조건']}`);
    if (userProfile['관심 분야']) items.push(`관심 분야: ${userProfile['관심 분야']}`);

    const completedChallenges = challenges
      .filter(c => c.status === 'completed')
      .map(c => c.title);

    const activeChallenges = challenges
      .filter(c => c.status === 'active')
      .map(c => c.title);

    if (completedChallenges.length > 0 || activeChallenges.length > 0) {
      let challengeText = '도전과제:\n';
      if (completedChallenges.length > 0) {
        challengeText += `  완료: ${completedChallenges.join(', ')}\n`;
      }
      if (activeChallenges.length > 0) {
        challengeText += `  진행중: ${activeChallenges.join(', ')}`;
      }
      items.push(challengeText);
    }

    return items.length > 0 ? items.join('\n\n') : "아직 학습된 정보가 없습니다.";
  };

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

  const handleLogout = async () => {
    await authHelpers.signOut();
    setUser(null);
    setViewMode('main');
    setMessages([]);
    setChallenges([]);
  };

  const handleChallengeTextClick = (challenge) => {
    setSelectedChallenge(challenge);
    setShowStartDialog(true);
  };

  const handleConfirmStart = async () => {
    if (!selectedChallenge) return;

    let actualChallenge = selectedChallenge;

    if (selectedChallenge.isTemp) {
      actualChallenge = await challengeHelpers.createChallenge(user.id, null, {
        title: selectedChallenge.title,
        description: selectedChallenge.description,
        level: userStats.level
      });

      setChallenges(prev => [actualChallenge, ...prev]);
      const stats = await challengeHelpers.getUserStats(user.id);
      setUserStats({ ...stats, level: calculateLevel(stats.completed) });
    }

    setActiveChallengeId(actualChallenge.id);
    setViewMode('chat');
    setShowStartDialog(false);

    const conv = await conversationHelpers.createConversation(
      user.id,
      `[도전과제] ${actualChallenge.title}`
    );
    setCurrentConversationId(conv.id);
    setConversations([conv, ...conversations]);

    const welcomeMessage = `좋아! "${actualChallenge.title}" 같이 시작해보자! 💪\n\n어디까지 진행했어? 막히는 부분 있어?`;
    await conversationHelpers.addMessage(conv.id, 'assistant', welcomeMessage);
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
  };

  const handleAddRecommendedChallenge = (requirementText) => {
    showConfirm(
      '도전과제 추가',
      `"${requirementText}"\n\n내 도전과제에 추가하시겠습니까?`,
      async () => {
        try {
          const newChallenge = await challengeHelpers.createChallenge(user.id, null, {
            title: requirementText,
            description: requirementText,
            level: userStats.level
          });

          setChallenges(prev => [newChallenge, ...prev]);
          const stats = await challengeHelpers.getUserStats(user.id);
          setUserStats({ ...stats, level: calculateLevel(stats.completed) });
        } catch (error) {
          console.error('도전과제 추가 실패:', error);
        }
      }
    );
  };

  const handleManualAddChallenge = async () => {
    if (!newChallengeTitle.trim()) return;

    try {
      const newChallenge = await challengeHelpers.createChallenge(user.id, null, {
        title: newChallengeTitle.trim(),
        description: newChallengeTitle.trim(),
        level: userStats.level
      });

      setChallenges(prev => [newChallenge, ...prev]);
      const stats = await challengeHelpers.getUserStats(user.id);
      setUserStats({ ...stats, level: calculateLevel(stats.completed) });

      setNewChallengeTitle('');
      setShowAddChallengeDialog(false);
    } catch (error) {
      console.error('도전과제 추가 실패:', error);
    }
  };

  const handleBackToMain = () => {
    setViewMode('main');
    setActiveChallengeId(null);
    setMessages([]);
    loadUserData(user.id);
  };

  const handleRecommendedChallengeClick = async (requirementText) => {
    const existingChallenge = challenges.find(c =>
      c.title === requirementText || c.description === requirementText
    );

    if (existingChallenge) {
      handleChallengeTextClick(existingChallenge);
    } else {
      const tempChallenge = {
        title: requirementText,
        description: requirementText,
        level: userStats.level,
        isTemp: true
      };

      setSelectedChallenge(tempChallenge);
      setShowStartDialog(true);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      await conversationHelpers.addMessage(currentConversationId, 'user', userMessage);
      const newMessages = [...messages, { role: 'user', content: userMessage }];
      setMessages(newMessages);

      const recentMessages = newMessages.slice(-MAX_CONTEXT_MESSAGES);
      const profileText = profileHelpers.profileToText(userProfile);

      let systemContext = '';

      if (profileText) {
        systemContext += profileText;
      }

      if (userInstructions && userInstructions.trim()) {
        if (systemContext) {
          systemContext += '\n\n[사용자 지침]\n' + userInstructions.trim();
        } else {
          systemContext = '[사용자 지침]\n' + userInstructions.trim();
        }
      }

      const messagesToSend = systemContext
        ? [
          { role: 'user', content: systemContext },
          ...recentMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ]
        : recentMessages.map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSend,
          token: user.id,
          conversation_id: currentConversationId,
          user_level: userStats.level
        })
      });

      if (!response.ok) throw new Error('API 호출 실패');

      const data = await response.json();
      const assistantMessage = data.message.replace(/\*\*/g, '');

      await conversationHelpers.addMessage(currentConversationId, 'assistant', assistantMessage);
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);

      const updatedProfile = await profileHelpers.getProfile(user.id);
      setUserProfile(updatedProfile.profile_data || {});

      if (data.suggested_challenge && data.challenge_added) {
        const updatedChallenges = await challengeHelpers.getChallenges(user.id);
        setChallenges(updatedChallenges);

        const stats = await challengeHelpers.getUserStats(user.id);
        setUserStats({ ...stats, level: calculateLevel(stats.completed) });

        alert(`✅ 새 도전과제 추가: ${data.suggested_challenge.title}`);
      }

      if (activeChallengeId && (userMessage.includes('다했어') || userMessage.includes('완료했어') || userMessage.includes('끝났어'))) {
        showConfirm(
          '🎉 축하해!',
          '이 도전과제를 달성 체크하시겠습니까?',
          async () => {
            await challengeHelpers.completeChallenge(activeChallengeId);
            setChallenges(prev => prev.map(c => c.id === activeChallengeId ? { ...c, status: 'completed' } : c));

            setTimeout(() => {
              showConfirm('완료!', '✅ 도전과제 완료! 계속 화이팅! 💪', () => handleBackToMain());
            }, 500);
          }
        );
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      showConfirm('오류', '메시지 전송에 실패했습니다', null);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

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

      setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, status: newStatus } : c));

      const stats = await challengeHelpers.getUserStats(user.id);
      setUserStats({ ...stats, level: calculateLevel(stats.completed) });
    } catch (error) {
      console.error('도전과제 토글 실패:', error);
    }
  };

  const handleDeleteChallenge = (challenge) => {
    setChallengeToDelete(challenge);
    setShowDeleteDialog(true);
  };

  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete) return;

    try {
      await supabase.from('challenges').delete().eq('id', challengeToDelete.id);
      setChallenges(prev => prev.filter(c => c.id !== challengeToDelete.id));

      const stats = await challengeHelpers.getUserStats(user.id);
      setUserStats({ ...stats, level: calculateLevel(stats.completed) });

      setShowDeleteDialog(false);
      setChallengeToDelete(null);
    } catch (error) {
      console.error('도전과제 삭제 실패:', error);
    }
  };

  const handleResetProgress = async () => {
    if (!window.confirm('⚠️ 경고\n\n모든 도전과제를 삭제하고 처음부터 시작하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
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
      alert('❌ 초기화에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleNewChat = async () => {
    const conv = await conversationHelpers.createConversation(user.id, '새 대화');
    setCurrentConversationId(conv.id);
    setConversations([conv, ...conversations]);
    setMessages([]);
    setViewMode('chat');
    setActiveChallengeId(null);
  };

  // 로딩 화면
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg animate-bounce">
            <Heart className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-white font-bold text-xl">하트뷰 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 화면
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">하트뷰</h1>
            <p className="text-gray-700 font-medium">지역 청년 일자리 매칭</p>
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 animate-shake">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="아이디"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="비밀번호"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-105"
            >
              {isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          {/* ✅ 카카오 로그인 버튼 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <button
              onClick={handleKakaoLogin}
              type="button"
              className="mt-6 w-full py-3 bg-[#FEE500] text-[#000000] rounded-xl font-bold hover:bg-[#FDD835] hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.91 1.88 5.45 4.68 6.93-.2.73-.64 2.54-.73 2.94-.11.48.17.47.36.34.14-.09 2.17-1.45 3.06-2.05.52.07 1.06.11 1.63.11 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
              </svg>
              카카오로 3초만에 시작하기
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
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

  // 메인 화면
  if (viewMode === 'main') {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div
        className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100"
        style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-2xl mx-auto p-4 pb-24 space-y-4">
          {/* 헤더 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">하트뷰</span>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-blue-50 rounded-xl transition-all">
                <LogOut className="w-5 h-5 text-blue-600" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    @{user.username}
                  </p>
                </div>

                <button
                  onClick={() => setShowProfileDialog(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  💼 내 구직 정보
                </button>
              </div>
            </div>
          </div>

          {/* 새 대화 버튼 */}
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-2xl p-4 font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            💬 새 대화 시작
          </button>

          {/* 내 진행상황 헤더 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 animate-fade-in mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">내 진행상황</h2>
            </div>
          </div>

          {/* 레벨 카드 */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 animate-fade-in">
            <button
              onClick={() => setShowLevelRoadmap(true)}
              className={`w-full bg-gradient-to-r ${currentLevelInfo.bgColor} rounded-2xl p-6 mb-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-all transform hover:scale-105`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-6xl">{currentLevelInfo.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-bold bg-gradient-to-r ${currentLevelInfo.color} bg-clip-text text-transparent`}>
                      Level {userStats.level}
                    </span>
                    {userStats.level < 10 && (
                      <span className="text-sm text-gray-600 font-medium">{nextLevelChallenges}개 남음</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">{currentLevelInfo.title}</p>
                  <p className="text-xs text-gray-600">{currentLevelInfo.description}</p>
                </div>
              </div>

              {userStats.level < 10 && (
                <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${currentLevelInfo.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${(userStats.completed / LEVEL_SYSTEM[userStats.level + 1].requiredChallenges) * 100}%` }}
                  />
                </div>
              )}

              <p className="text-xs text-center text-blue-600 font-medium mt-3">클릭하여 전체 로드맵 보기 →</p>
            </button>

            {/* Level 추천 과제 */}
            <div className="bg-gradient-to-r from-cyan-50 to-sky-50 rounded-2xl p-4 border-2 border-cyan-200 mb-4">
              <h3 className="text-sm font-bold text-cyan-900 mb-3 flex items-center gap-2">
                💡 Level {userStats.level} 추천 과제
              </h3>

              <div className="space-y-2">
                {currentLevelInfo.requirements.map((req, idx) => {
                  const alreadyAdded = challenges.some(c =>
                    c.title === req || c.description === req
                  );

                  return (
                    <div
                      key={`rec-${userStats.level}-${idx}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-cyan-100 transition-all"
                    >
                      <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-500" />

                      <div className="flex-1 text-sm text-gray-800">
                        {req}
                      </div>

                      {alreadyAdded ? (
                        <span className="text-xs text-green-600 font-medium">✓ 추가됨</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddRecommendedChallenge(req);
                          }}
                          className="flex-shrink-0 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs rounded-lg transition-all font-medium"
                        >
                          추가
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 내 도전과제 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  내 도전과제
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddChallengeDialog(true)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                    title="도전과제 추가"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setHideCompletedChallenges(!hideCompletedChallenges)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-2 hover:bg-blue-100 rounded-lg"
                  >
                    {hideCompletedChallenges ? '완료 보기' : '완료 숨기기'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {challenges
                  .filter(c => {
                    if (c.level !== userStats.level) return false;
                    if (hideCompletedChallenges && c.status === 'completed') return false;
                    return true;
                  })
                  .map(challenge => (
                    <div
                      key={challenge.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${challenge.status === 'completed'
                        ? 'hover:bg-green-50 opacity-60'
                        : 'hover:bg-blue-100'
                        }`}
                    >
                      <button
                        onClick={() => handleToggleChallenge(challenge.id)}
                        className="flex-shrink-0 transform transition-transform hover:scale-110"
                      >
                        {challenge.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-blue-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleChallengeTextClick(challenge)}
                        className={`flex-1 text-left text-sm transition-colors ${
                          challenge.status === 'completed' 
                            ? 'text-gray-600 line-through' 
                            : 'text-gray-800 hover:text-blue-600'
                        }`}
                      >
                        {challenge.title}
                      </button>

                      <button
                        onClick={() => handleDeleteChallenge(challenge)}
                        className="flex-shrink-0 p-2 hover:bg-red-100 rounded-lg transition-all opacity-70 hover:opacity-100"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}

                {challenges.filter(c => c.level === userStats.level).length === 0 && (
                  <p className="text-center text-gray-400 py-8">
                    아직 추가한 도전과제가 없습니다
                  </p>
                )}
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-3 text-center border border-blue-300 transform transition-transform hover:scale-105">
                <div className="text-2xl font-bold text-blue-700">{userStats.total}</div>
                <div className="text-xs text-blue-700 font-medium">전체</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-3 text-center border border-green-300 transform transition-transform hover:scale-105">
                <div className="text-2xl font-bold text-green-700">{userStats.completed}</div>
                <div className="text-xs text-green-700 font-medium">완료</div>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-3 text-center border border-purple-300 transform transition-transform hover:scale-105">
                <div className="text-2xl font-bold text-purple-700">{userStats.active}</div>
                <div className="text-xs text-purple-700 font-medium">진행중</div>
              </div>
            </div>

            {/* 초기화 버튼 */}
            <button
              onClick={handleResetProgress}
              className="w-full px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl text-xs font-medium transition-all border border-gray-300 hover:border-red-300"
            >
              🔄 진행상황 초기화
            </button>
          </div>

          {/* 최근 대화 */}
          {conversations.length > 0 && (
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-4">최근 대화</h2>
              <div className="space-y-2">
                {conversations.slice(0, 10).map(conv => (
                  <div
                    key={conv.id}
                    className="group flex items-center gap-2 p-3 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <button
                      onClick={async () => {
                        setCurrentConversationId(conv.id);
                        const msgs = await conversationHelpers.getMessages(conv.id);
                        setMessages(msgs);
                        setViewMode('chat');
                        setActiveChallengeId(null);
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</p>
                    </button>
                    
                    <button
                      onClick={async () => {
                        const newTitle = prompt('새 제목을 입력하세요:', conv.title);
                        if (newTitle && newTitle.trim()) {
                          await conversationHelpers.updateConversationTitle(conv.id, newTitle.trim());
                          setConversations(prev => prev.map(c => 
                            c.id === conv.id ? { ...c, title: newTitle.trim() } : c
                          ));
                        }
                      }}
                      className="p-2 hover:bg-blue-200 rounded-lg transition-all opacity-70 hover:opacity-100"
                      title="제목 변경"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (window.confirm('이 대화를 삭제하시겠습니까?')) {
                          await supabase.from('conversations').delete().eq('id', conv.id);
                          setConversations(prev => prev.filter(c => c.id !== conv.id));
                        }
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all opacity-70 hover:opacity-100"
                      title="삭제"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 맨 위로 버튼 */}
          <button
            onClick={scrollToTop}
            className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-2xl p-4 font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            맨 위로
          </button>

          {/* 도전과제 추가 다이얼로그 */}
          {showAddChallengeDialog && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-4">도전과제 추가</h3>
                <input
                  type="text"
                  value={newChallengeTitle}
                  onChange={(e) => setNewChallengeTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualAddChallenge()}
                  placeholder="도전과제 제목을 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddChallengeDialog(false);
                      setNewChallengeTitle('');
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleManualAddChallenge}
                    disabled={!newChallengeTitle.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 내 구직 정보 다이얼로그 */}
          {showProfileDialog && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h3 className="text-xl font-bold text-gray-900">
                    하트뷰가 기억하는 '{user.name}님의 정보'
                  </h3>
                  <button
                    onClick={() => setShowProfileDialog(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    🤖 AI가 기억한 내용
                  </h4>
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                      {formatProfileForDisplay()}
                    </pre>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    ✍️ 내가 직접 작성하는 정보
                  </h4>
                  <textarea
                    value={userInstructions}
                    onChange={(e) => setUserInstructions(e.target.value)}
                    placeholder="예: 원주에 살고 있고, 카페 알바 찾고 있어요. 시간제 근무 희망합니다. 커피에 관심 많아요."
                    className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 하트뷰가 모든 대화에서 이 내용을 참고합니다
                  </p>
                </div>

                <button
                  onClick={handleSaveUserInstructions}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  💾 저장
                </button>
              </div>
            </div>
          )}

          {/* 레벨 로드맵 */}
          {showLevelRoadmap && (
            <div 
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in"
              onClick={() => setShowLevelRoadmap(false)}
            >
              <div 
                className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
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
                  {Object.entries(LEVEL_SYSTEM).map(([level, info]) => {
                    const levelNum = parseInt(level);
                    const isCurrentLevel = levelNum === userStats.level;
                    const isCompleted = userStats.completed >= info.requiredChallenges;
                    
                    return (
                      <div
                        key={level}
                        className={`rounded-2xl p-6 border-2 transition-all ${
                          isCurrentLevel 
                            ? `bg-gradient-to-r ${info.bgColor} border-blue-400 shadow-lg scale-105 animate-pulse-slow` 
                            : isCompleted
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-5xl">{info.emoji}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-lg font-bold bg-gradient-to-r ${info.color} bg-clip-text text-transparent`}>
                                Level {level}
                              </span>
                              {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                              {isCurrentLevel && !isCompleted && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">현재</span>}
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mb-2">{info.title}</p>
                            <p className="text-xs text-gray-600 mb-3">{info.description}</p>
                            
                            <div className="bg-white/80 rounded-xl p-3">
                              <p className="text-xs font-bold text-gray-700 mb-2">필요 도전과제: {info.requiredChallenges}개</p>
                              <ul className="space-y-1">
                                {info.requirements.map((req, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                    <Circle className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                                    <span>{req}</span>
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

          {/* 확인 다이얼로그 */}
          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{confirmDialogData.title}</h3>
                <p className="text-sm text-gray-700 mb-6 whitespace-pre-wrap">{confirmDialogData.message}</p>
                <div className="flex gap-3">
                  {confirmDialogData.onConfirm ? (
                    <>
                      <button
                        onClick={() => setShowConfirmDialog(false)}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          confirmDialogData.onConfirm();
                          setShowConfirmDialog(false);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        확인
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      확인
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 삭제 확인 다이얼로그 */}
          {showDeleteDialog && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ 도전과제 삭제</h3>
                <p className="text-sm text-gray-700 mb-6">
                  "{challengeToDelete?.title}"을(를) 삭제하시겠습니까?<br/>
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmDeleteChallenge}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 대화 시작 다이얼로그 */}
          {showStartDialog && selectedChallenge && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-900 mb-4">💬 대화 시작</h3>
                <p className="text-sm text-gray-700 mb-6">
                  "{selectedChallenge.title}"<br/>
                  이 도전과제에 대해 대화를 시작하시겠습니까?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowStartDialog(false)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmStart}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    시작하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 채팅 화면
  const currentConversation = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-blue-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToMain}
              className="p-2 hover:bg-blue-50 rounded-xl transition-all transform hover:scale-110"
            >
              <ArrowLeft className="w-6 h-6 text-blue-600" />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">하트뷰</span>
                {currentConversation && (
                  <p className="text-xs text-gray-600 truncate">{currentConversation.title}</p>
                )}
              </div>
            </div>
            
            {currentConversationId && (
              <button
                onClick={async () => {
                  const conv = conversations.find(c => c.id === currentConversationId);
                  if (conv) {
                    const newTitle = prompt('새 제목을 입력하세요:', conv.title);
                    if (newTitle && newTitle.trim()) {
                      await conversationHelpers.updateConversationTitle(currentConversationId, newTitle.trim());
                      setConversations(prev => prev.map(c => 
                        c.id === currentConversationId ? { ...c, title: newTitle.trim() } : c
                      ));
                    }
                  }
                }}
                className="p-2 hover:bg-blue-50 rounded-xl transition-all"
                title="제목 변경"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600">대화를 시작해보세요!</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 shadow-lg transition-all transform hover:scale-105 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white'
                      : 'bg-white border-2 border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white border-2 border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {suggestedChallenge && (
          <div className="mx-4 mb-4 animate-slide-up">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900 mb-1">💡 도전과제 제안</p>
                  <p className="text-sm text-gray-700 mb-3">{suggestedChallenge.title}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const newChallenge = await challengeHelpers.createChallenge(
                          user.id, 
                          currentConversationId,
                          {
                            title: suggestedChallenge.title,
                            description: suggestedChallenge.description || suggestedChallenge.title,
                            level: userStats.level
                          }
                        );
                        setChallenges(prev => [newChallenge, ...prev]);
                        setSuggestedChallenge(null);
                        alert('✅ 도전과제에 추가되었습니다!');
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                    >
                      ➕ 도전과제 추가
                    </button>
                    <button
                      onClick={() => setSuggestedChallenge(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      나중에
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-blue-200 shadow-lg z-20">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 transform hover:scale-105"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/auth/callback" element={<KakaoCallback />} />
      </Routes>
    </ErrorBoundary>
  );
}

function AppWithErrorBoundary() {
  return <App />;
}

export default AppWithErrorBoundary;
