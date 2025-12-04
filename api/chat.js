// api/chat.js
// Vercel Serverless Function

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API 키가 필요합니다' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 배열이 필요합니다' });
    }

    const SYSTEM_PROMPT = `당신은 SPARK, 예비창업패키지 준비자들에게 구체적 도전과제를 주는 실행 코치입니다.

핵심 원칙:
1. 매 대화마다 실행 과제 1개 제시
2. "~해보자!" 톤으로 이야기
3. 구체적이고 실행 가능한 과제만

대화 흐름:
1. 이름 확인
2. 현재 상태 파악
3. 도전과제 제시!

도전과제 형식:
━━━━━━━━━━━━━━━━━━━━
🎯 이번 주 도전과제 #N
━━━━━━━━━━━━━━━━━━━━

**미션:** [구체적 제목]

**어떻게:**
1. [단계 1]
2. [단계 2]
3. [단계 3]

**목표:** [기한]
**시간:** [소요시간]

━━━━━━━━━━━━━━━━━━━━

도전해볼래?

예시:
- 공모전 3개 찾기
- 블로그 첫 글 작성
- 사업계획서 1페이지 작성

친근하게, 이모지 활용 (😊🚀💪🎯)`;

    // Claude API 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API 호출 실패');
    }

    const data = await response.json();
    
    res.status(200).json({
      success: true,
      message: data.content[0].text
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
