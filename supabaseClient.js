// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// ⚠️ 여기에 너의 Supabase 정보 입력!
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // 예: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // eyJhbGc... 로 시작

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 인증 헬퍼 함수들
export const authHelpers = {
  // 회원가입
  async signUp(username, password, name) {
    try {
      // 1. 비밀번호 해시 (간단한 방법)
      const passwordHash = btoa(password); // Base64 인코딩 (실제로는 bcrypt 사용 권장)
      
      // 2. 사용자 생성
      const { data, error } = await supabase
        .from('users')
        .insert([{ username, password_hash: passwordHash, name }])
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 로그인
  async signIn(username, password) {
    try {
      const passwordHash = btoa(password);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .single();
      
      if (error) throw new Error('아이디 또는 비밀번호가 잘못되었습니다');
      
      // 로컬스토리지에 저장
      localStorage.setItem('spark_user', JSON.stringify(data));
      
      return { success: true, user: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 로그아웃
  signOut() {
    localStorage.removeItem('spark_user');
  },

  // 현재 사용자
  getCurrentUser() {
    const userJson = localStorage.getItem('spark_user');
    return userJson ? JSON.parse(userJson) : null;
  }
};

// 대화 관련 함수들
export const conversationHelpers = {
  // 새 대화 생성
  async createConversation(userId, title = '새 대화') {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: userId, title }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자의 모든 대화 가져오기
  async getConversations(userId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // 특정 대화의 메시지 가져오기
  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // 메시지 추가
  async addMessage(conversationId, role, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, role, content }])
      .select()
      .single();
    
    if (error) throw error;

    // 대화 updated_at 업데이트
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    return data;
  },

  // 대화 삭제
  async deleteConversation(conversationId) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) throw error;
  }
};

// 도전과제 관련 함수들
export const challengeHelpers = {
  // 새 도전과제 생성
  async createChallenge(userId, conversationId, challenge) {
    const { data, error } = await supabase
      .from('challenges')
      .insert([{
        user_id: userId,
        conversation_id: conversationId,
        title: challenge.title,
        description: challenge.description,
        level: challenge.level || 1,
        deadline: challenge.deadline
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자의 모든 도전과제 가져오기
  async getChallenges(userId) {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // 도전과제 완료 처리
  async completeChallenge(challengeId) {
    const { data, error } = await supabase
      .from('challenges')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 도전과제 건너뛰기
  async skipChallenge(challengeId) {
    const { data, error } = await supabase
      .from('challenges')
      .update({ status: 'skipped' })
      .eq('id', challengeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // 사용자 통계
  async getUserStats(userId) {
    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId);
    
    if (!challenges) return { total: 0, completed: 0, active: 0 };

    return {
      total: challenges.length,
      completed: challenges.filter(c => c.status === 'completed').length,
      active: challenges.filter(c => c.status === 'active').length,
      level: Math.floor(challenges.filter(c => c.status === 'completed').length / 3) + 1
    };
  }
};
