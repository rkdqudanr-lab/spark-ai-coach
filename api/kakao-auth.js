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

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    // 환경변수 확인
    console.log('Environment check:', {
      hasRestApiKey: !!process.env.REACT_APP_KAKAO_REST_API_KEY,
      hasRedirectUri: !!process.env.REACT_APP_KAKAO_REDIRECT_URI,
      redirectUri: process.env.REACT_APP_KAKAO_REDIRECT_URI
    });

    // 1. 카카오 액세스 토큰 받기
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.REACT_APP_KAKAO_REST_API_KEY,
        redirect_uri: process.env.REACT_APP_KAKAO_REDIRECT_URI,
        code: code
      }).toString()
    });

    const tokenData = await tokenResponse.json();
    console.log('Kakao token response status:', tokenResponse.status);
    
    if (!tokenData.access_token) {
      console.error('Kakao token error:', tokenData);
      throw new Error('Failed to get access token from Kakao: ' + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;

    // 2. 카카오 사용자 정보 받기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = await userResponse.json();
    console.log('Kakao user data received:', { id: userData.id });

    const kakaoId = userData.id;
    const nickname = userData.properties?.nickname || userData.kakao_account?.profile?.nickname || '카카오 사용자';
    const profileImage = userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url;

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
      console.log('Existing user found:', user.id);
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

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      user = newUser;
      console.log('New user created:', user.id);
    }

    // 4. 세션 토큰 생성
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
