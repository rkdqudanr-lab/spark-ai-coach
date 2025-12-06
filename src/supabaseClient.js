// src/supabaseClient.js - 완전 최종 버전

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// 인증 헬퍼
// ========================================
export const authHelpers = {
  // 회원가입
  signUp: async (username, password, name) => {
    try {
      // 1. 중복 확인
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existing) {
        return { success: false, error: '이미 존재하는 아이디입니다' };
      }

      // 2. 사용자 생성
      const { data, error } = await supabase
        .from('users')
        .insert([{ username, password, name }])
        .select()
        .single();

      if (error) throw error;

      // 3. 로컬스토리지 저장
      localStorage.setItem('spark_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      console.error('회원가입 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // 로그인
  signIn: async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' };
      }

      localStorage.setItem('spark_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // 로그아웃
  signOut: () => {
    localStorage.removeItem('spark_user');
  },

  // 현재 사용자
  getCurrentUser: () => {
    const user = localStorage.getItem('spark_user');
    return user ? JSON.parse(user) : null;
  }
};

// ========================================
// 대화 헬퍼
// ========================================
export const conversationHelpers = {
  // 대화 목록 가져오기
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
      console.error('대화 목록 가져오기 실패:', error);
      return [];
    }
  },

  // 대화 생성
  createConversation: async (userId, title = '새 대화') => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ 
          user_id: userId, 
          title,
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
      const { error } = await supabase
        .from('conversations')
        .update({ 
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('제목 변경 실패:', error);
      return false;
    }
  },

  // 대화 삭제
  deleteConversation: async (conversationId) => {
    try {
      // 메시지도 함께 삭제
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('대화 삭제 실패:', error);
      return false;
    }
  },

  // 메시지 가져오기
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
      console.error('메시지 가져오기 실패:', error);
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
          role, 
          content,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 대화 업데이트 시간 갱신
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
  // 도전과제 목록 가져오기
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
      console.error('도전과제 가져오기 실패:', error);
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
          created_at: new Date().toISOString()
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
      const { error } = await supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('도전과제 완료 실패:', error);
      return false;
    }
  },

  // 도전과제 상태 변경
  updateChallengeStatus: async (challengeId, status) => {
    try {
      const updateData = { status };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', challengeId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('도전과제 상태 변경 실패:', error);
      return false;
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
      console.error('통계 가져오기 실패:', error);
      return { total: 0, completed: 0, active: 0 };
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
      return false;
    }
  }
};

export default supabase;
