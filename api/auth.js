// api/auth.js
// 하트뷰 로그인 API

// 환경변수에서 설정 불러오기
const USERS = {
  // 기본 관리자 계정
  'admin': 'heartview2025!',
  
  // 지역별 테스트 계정
  'wonju': '원주청년!',      // 원주
  'chuncheon': '춘천청년!',  // 춘천
  'gangneung': '강릉청년!',  // 강릉
  'chungju': '충주청년!',    // 충주
  
  // 개발/테스트 계정
  'bm': 'bm!',
  'test': 'test1234!',
  
  // 실제 사용자는 여기에 추가
  // 'username': 'password'
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

    // 입력값 검증
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
      
      // 사용자 지역 추출 (선택사항)
      let userRegion = null;
      if (username === 'wonju' || username.includes('원주')) {
        userRegion = '원주';
      } else if (username === 'chuncheon' || username.includes('춘천')) {
        userRegion = '춘천';
      } else if (username === 'gangneung' || username.includes('강릉')) {
        userRegion = '강릉';
      } else if (username === 'chungju' || username.includes('충주')) {
        userRegion = '충주';
      }

      return res.status(200).json({
        success: true,
        token: token,
        username: username,
        region: userRegion,  // 지역 정보 추가
        message: '하트뷰에 오신 걸 환영합니다! 💙'
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
