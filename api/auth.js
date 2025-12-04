// api/auth.js
// 로그인 API

// 환경변수에서 설정 불러오기
const USERS = {
  // 여기에 사용자 추가
  'admin': 'spark2025!',  // 아이디: 비밀번호
  '병묵': '창업준비!',
  '원주': '창업준비!',
  // 더 추가 가능
};

// 실제 Claude API 키 (환경변수로 관리)
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: '아이디와 비밀번호를 입력해주세요' 
      });
    }

    // 사용자 확인
    if (USERS[username] && USERS[username] === password) {
      // 간단한 토큰 생성 (실제로는 JWT 사용 추천)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      return res.status(200).json({
        success: true,
        token: token,
        username: username,
        message: '로그인 성공!'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: '아이디 또는 비밀번호가 잘못되었습니다'
      });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다'
    });
  }
}
