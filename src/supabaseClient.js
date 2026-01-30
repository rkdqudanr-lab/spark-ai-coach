import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jpwydqfkvhglwmlkesla.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd3lkcWZrdmhnbHdtbGtlc2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDczNTcsImV4cCI6MjA1MzAyMzM1N30.ELjqUWXqWn59zYcB8kHQMw_JxC1S4dKyWxT9VCU5lEQ';

// ✅ Supabase 클라이언트 생성 (OAuth 지원 옵션 추가)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // 이메일 없이도 작동하도록 설정
    storage: window.localStorage,
  }
});

// 인증 헬퍼
export const authHelpers = {
  async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session?.user) return null;

      // user_profile에서 사용자 정보 가져오기
      const { data: profile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      return {
        id: session.user.id,
        username: profile?.username || session.user.email?.split('@')[0] || 'user',
        name: profile?.name || session.user.user_metadata?.full_name || '사용자',
        email: session.user.email,
      };
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  },

  async signIn(username, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@heartview.local`,
        password: password,
      });

      if (error) throw error;

      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: error.message };
    }
  },

  async signUp(username, password, name) {
    try {
      const email = `${username}@heartview.local`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            name: name,
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from('user_profile')
        .insert([
          {
            user_id: userId,
            username: username,
            name: name,
            profile_data: {},
            user_instructions: ''
          }
        ]);

      if (profileError) throw profileError;

      return {
        success: true,
        user: {
          id: userId,
          username: username,
          name: name,
        }
      };
    } catch (error) {
      console.error('회원가입 실패:', error);
      return { success: false, error: error.message };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('로그아웃 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ OAuth 콜백 처리
  async handleOAuthCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      if (!session) return { success: false, error: '세션이 없습니다.' };

      // OAuth로 로그인한 사용자의 프로필 생성 또는 업데이트
      const userId = session.user.id;
      const email = session.user.email;
      const name = session.user.user_metadata?.full_name || 
                   session.user.user_metadata?.name || 
                   email?.split('@')[0] || '사용자';

      // 기존 프로필 확인
      const { data: existingProfile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        // 새 프로필 생성
        await supabase.from('user_profile').insert([{
          user_id: userId,
          username: email?.split('@')[0] || `user_${userId.substring(0, 8)}`,
          name: name,
          profile_data: {},
          user_instructions: ''
        }]);
      }

      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error) {
      console.error('OAuth 콜백 처리 실패:', error);
      return { success: false, error: error.message };
    }
  }
};

// 대화 헬퍼
export const conversationHelpers = {
  async getConversations(userId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('대화 목록 조회 실패:', error);
      return [];
    }
  },

  async createConversation(userId, title) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id: userId, title: title }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('대화 생성 실패:', error);
      throw error;
    }
  },

  async getMessages(conversationId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('메시지 조회 실패:', error);
      return [];
    }
  },

  async addMessage(conversationId, role, content) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          role: role,
          content: content
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
  },

  async updateConversationTitle(conversationId, title) {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: title })
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('대화 제목 업데이트 실패:', error);
      throw error;
    }
  }
};

// 도전과제 헬퍼
export const challengeHelpers = {
  async getChallenges(userId) {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('도전과제 조회 실패:', error);
      return [];
    }
  },

  async createChallenge(userId, conversationId, challengeData) {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert([{
          user_id: userId,
          conversation_id: conversationId,
          title: challengeData.title,
          description: challengeData.description,
          level: challengeData.level,
          status: 'active'
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

  async completeChallenge(challengeId) {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;
    } catch (error) {
      console.error('도전과제 완료 실패:', error);
      throw error;
    }
  },

  async updateChallengeStatus(challengeId, status) {
    try {
      const updateData = { status: status };
      if (status === 'active') {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('challenges')
        .update(updateData)
        .eq('id', challengeId);

      if (error) throw error;
    } catch (error) {
      console.error('도전과제 상태 업데이트 실패:', error);
      throw error;
    }
  },

  async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('status')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(c => c.status === 'completed').length;
      const active = data.filter(c => c.status === 'active').length;

      return { total, completed, active };
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return { total: 0, completed: 0, active: 0 };
    }
  }
};

// 프로필 헬퍼
export const profileHelpers = {
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data || { profile_data: {}, user_instructions: '' };
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      return { profile_data: {}, user_instructions: '' };
    }
  },

  profileToText(profileData) {
    if (!profileData || Object.keys(profileData).length === 0) {
      return '';
    }

    const parts = [];
    if (profileData['희망 직무']) parts.push(`희망 직무: ${profileData['희망 직무']}`);
    if (profileData['거주 지역']) parts.push(`거주 지역: ${profileData['거주 지역']}`);
    if (profileData['현재 상태']) parts.push(`현재 상태: ${profileData['현재 상태']}`);
    if (profileData['심리 상태']) parts.push(`심리 상태: ${profileData['심리 상태']}`);
    if (profileData['근무 조건']) parts.push(`근무 조건: ${profileData['근무 조건']}`);
    if (profileData['관심 분야']) parts.push(`관심 분야: ${profileData['관심 분야']}`);

    return parts.length > 0 ? `[사용자 프로필]\n${parts.join('\n')}` : '';
  }
};

export default supabase;
