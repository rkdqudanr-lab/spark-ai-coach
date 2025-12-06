// src/supabaseClient.js - 완전판

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// 인증 헬퍼
// ========================================
export const authHelpers = {
  // 로그인
  signIn: async (username, password) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !users) {
        return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' };
      }

      localStorage.setItem('spark_user', JSON.stringify(users));
      return { success: true, user: users };
    } catch (error) {
      return { success: false, error: '로그인 중 오류가 발생했습니다' };
    }
  },

  // 회원가입
  signUp: async (username, password, name) => {
    try {
      // 중복 확인
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existing) {
        return { success: false, error: '이미 존재하는 아이디입니다' };
      }

      // 새 사용자 생성
      const { data, error } = await supabase
        .from('users')
        .insert([{ username, password, name }])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('spark_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: '회원가입 중 오류가 발생했습니다' };
    }
  },

  // 로그아웃
  signOut: () => {
    localStorage.removeItem('spark_user');
  },

  // 현재 사용자
  getCurrentUser: () => {
    const userStr = localStorage.getItem('spark_user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// ========================================
// 대화 헬퍼
// ========================================
export const conversationHelpers = {
  // 모든 대화 가져오기
  getConversations: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('대화 목록 로드 실패:', error);
      return [];
    }
  },

  // 새 대화 생성
  createConversation: async (userId, title = '새 대화') => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          title: title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('대화 생성 실패:', error);
      throw error;
    }
  },

  // 대화 제목 변경
  updateConversationTitle: async (conversationId, newTitle) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({ 
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('제목 변경 실패:', error);
      throw error;
    }
  },

  // 대화 삭제
  deleteConversation: async (conversationId) => {
    try {
      // 먼저 관련 메시지 삭제
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
      
      // 대화 삭제
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('대화 삭제 실패:', error);
      throw error;
    }
  },

  // 대화의 메시지 가져오기
  getMessages: async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('메시지 로드 실패:', error);
      return [];
    }
  },

  // 메시지 추가
  addMessage: async (conversationId, role, content) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          role: role,
          content: content,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 대화 updated_at 업데이트
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('메시지 추가 실패:', error);
      throw error;
    }
  }
};

// ========================================
// 도전과제 헬퍼
// ========================================
export const challengeHelpers = {
  // 모든 도전과제 가져오기
  getChallenges: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('도전과제 로드 실패:', error);
      return [];
    }
  },

  // 도전과제 생성
  createChallenge: async (userId, conversationId, challengeData) => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert([{
          user_id: userId,
          conversation_id: conversationId,
          title: challengeData.title,
          description: challengeData.description || challengeData.title,
          level: challengeData.level || 1,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('도전과제 생성 실패:', error);
      throw error;
    }
  },

  // 도전과제 완료
  completeChallenge: async (challengeId) => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('도전과제 완료 실패:', error);
      throw error;
    }
  },

  // 도전과제 상태 변경
  updateChallengeStatus: async (challengeId, status) => {
    try {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      };

      // 완료 해제 시 completed_at 제거
      if (status === 'active') {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', challengeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('도전과제 상태 변경 실패:', error);
      throw error;
    }
  },

  // 도전과제 삭제
  deleteChallenge: async (challengeId) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('도전과제 삭제 실패:', error);
      throw error;
    }
  },

  // 사용자 통계
  getUserStats: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const challenges = data || [];
      const total = challenges.length;
      const completed = challenges.filter(c => c.status === 'completed').length;
      const active = challenges.filter(c => c.status === 'active').length;

      return { total, completed, active };
    } catch (error) {
      console.error('통계 로드 실패:', error);
      return { total: 0, completed: 0, active: 0 };
    }
  }
};

// ========================================
// 유틸리티
// ========================================
export const utils = {
  // 날짜 포맷
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // 시간 포맷
  formatTime: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 상대 시간 (예: "3일 전")
  formatRelativeTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  }
};

export default supabase;
