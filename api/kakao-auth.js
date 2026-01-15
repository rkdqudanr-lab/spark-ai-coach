// api/kakao-auth.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  try {
    // 1. 카카오 액세스 토큰 받기
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.REACT_APP_KAKAO_REST_API_KEY,
        redirect_uri: process.env.REACT_APP_KAKAO_REDIRECT_URI,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    const accessToken = tokenData.access_token;

    // 2. 카카오 사용자 정보 받기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = await userResponse.json();
    const kakaoId = userData.id;
    const nickname = userData.properties?.nickname || '카카오 사용자';
    const profileImage = userData.properties?.profile_image;

    // 3. Supabase에서 사용자 확인/생성
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('kakao_id', kakaoId)
      .single();

    let user;
    
    if (existingUser) {
      // 기존 사용자
      user = existingUser;
    } else {
      // 신규 사용자
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          kakao_id: kakaoId,
          username: `kakao_${kakaoId}`,
          name: nickname,
          profile_image: profileImage
        }])
        .select()
        .single();

      if (error) throw error;
      user = newUser;
    }

    // 4. 세션 생성을 위한 임시 토큰 생성
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now()
    })).toString('base64');

    return res.status(200).json({
      success: true,
      user: user,
      sessionToken: sessionToken
    });

  } catch (error) {
    console.error('카카오 로그인 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
