// src/supabaseClient.js - Supabase Auth 버전 (이메일 수정)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// 인증 헬퍼 (Supabase Auth 사용)
// ========================================
export const authHelpers = {
  // 회원가입
  signUp: async (username, password, name) => {
    try {
      // 1. Supabase Auth로 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${username}@sparkapp.com`, // ✅ 수정: .local → .com
        password: password,
        options: {
          data: {
            username: username,
            name: name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('사용자 생성 실패');

      // 2. users 테이블에 정보 저장
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          username: username,
          name: name
        }]);

      if (userError) {
        // username 중복이면 더 명확한 메시지
        if (userError.code === '23505') {
          throw new Error('이미 존재하는 아이디입니다');
        }
        throw userError;
      }

      return { 
        success: true, 
        user: {
          id: authData.user.id,
          username: username,
          name: name
        }
      };
    } catch (error) {
      console.error('회원가입 실패:', error);
      return { 
        success: false, 
        error: error.message || '회원가입에 실패했습니다' 
      };
    }
  },

  // 로그인
  signIn: async (username, password) => {
    try {
      // 1. Supabase Auth로 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `${username}@sparkapp.com`, // ✅ 수정: .local → .com
        password: password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('로그인 실패');

      // 2. users 테이블에서 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;

      return { 
        success: true, 
        user: userData
      };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { 
        success: false, 
        error: '아이디 또는 비밀번호가 올바르지 않습니다' 
      };
    }
  },

  // 로그아웃
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  },

  // 현재 사용자 (세션에서)
  getCurrentUser: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return null;

      // users 테이블에서 사용자 정보 가져오기
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return userData;
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return null;
    }
  }
};

// ========================================
// 대화 헬퍼 (변경 없음 - RLS가 자동으로 처리)
// ========================================
export const conversationHelpers = {
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

  deleteConversation: async (conversationId) => {
    try {
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
// 도전과제 헬퍼 (변경 없음 - RLS가 자동으로 처리)
// ========================================
export const challengeHelpers = {
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

// supabaseClient.js - 프로필 헬퍼 추가

// ========================================
// 프로필 헬퍼 (사용자 학습 정보)
// ========================================
export const profileHelpers = {
  // 프로필 가져오기
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // 프로필 없으면 빈 객체
        if (error.code === 'PGRST116') {
          return { profile_data: {} };
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('프로필 가져오기 실패:', error);
      return { profile_data: {} };
    }
  },

  // 프로필 업데이트
  updateProfile: async (userId, profileData) => {
    try {
      // 프로필 존재 확인
      const { data: existing } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('user_profile')
          .update({
            profile_data: profileData,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase
          .from('user_profile')
          .insert([{
            user_id: userId,
            profile_data: profileData
          }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      return false;
    }
  },

  // 프로필 필드 추가/수정
  updateProfileField: async (userId, key, value) => {
    try {
      const profile = await profileHelpers.getProfile(userId);
      const newData = {
        ...profile.profile_data,
        [key]: value
      };
      
      return await profileHelpers.updateProfile(userId, newData);
    } catch (error) {
      console.error('프로필 필드 업데이트 실패:', error);
      return false;
    }
  },

  // 프로필을 텍스트로 변환 (Claude에게 전달용)
  profileToText: (profileData) => {
    if (!profileData || Object.keys(profileData).length === 0) {
      return '';
    }

    let text = '# 사용자 정보\n\n';

    if (profileData.startup_idea) {
      text += `창업 아이템: ${profileData.startup_idea}\n`;
    }
    if (profileData.target) {
      text += `목표: ${profileData.target}\n`;
    }
    if (profileData.progress) {
      text += `진행상황:\n`;
      Object.entries(profileData.progress).forEach(([key, val]) => {
        text += `- ${key}: ${val}\n`;
      });
    }
    if (profileData.strengths && profileData.strengths.length > 0) {
      text += `강점: ${profileData.strengths.join(', ')}\n`;
    }
    if (profileData.challenges && profileData.challenges.length > 0) {
      text += `고민/과제: ${profileData.challenges.join(', ')}\n`;
    }

    return text;
  }
};

// supabaseClient.js 맨 아래에 추가:
export default supabase;
