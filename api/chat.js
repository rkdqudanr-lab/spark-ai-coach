// api/chat.js
// Vercel Serverless Function - 자동 프로필 학습 + 도전과제 제안 처리

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
process.env.REACT_APP_SUPABASE_URL,
process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ========================================
// 프로필 업데이트 함수
// ========================================
async function updateUserProfile(userId, updates) {
try {
const { data: existing } = await supabase
.from('user_profile')
.select('profile_data')
.eq('user_id', userId)
.single();

```
const currentData = existing?.profile_data || {};
const newData = { ...currentData, ...updates };

if (existing) {
  await supabase
    .from('user_profile')
    .update({
      profile_data: newData,
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId);
} else {
  await supabase
    .from('user_profile')
    .insert([
      {
        user_id: userId,
        profile_data: newData
      }
    ]);
}

console.log('✅ 프로필 자동 업데이트:', updates);
return true;
```

} catch (error) {
console.error('프로필 업데이트 실패:', error);
return false;
}
}

// ========================================
// 메인 핸들러
// ========================================
export default async function handler(req, res) {
// CORS 헤더 설정
res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
res.setHeader(
'Access-Control-Allow-Headers',
'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
);

// OPTIONS 요청 처리
if (req.method === 'OPTIONS') {
res.status(200).end();
return;
}

// POST 요청만 처리
if (req.method !== 'POST') {
res.status(405).json({ error: 'Method not allowed' });
return;
}

try {
const { messages, token: userId } = req.body;

```
if (!messages || !Array.isArray(messages)) {
  res.status(400).json({ error: 'messages 배열이 필요합니다' });
  return;
}

// 환경변수에서 API 키 가져오기
const apiKey = process.env.CLAUDE_API_KEY;

if (!apiKey) {
  res.status(500).json({ error: 'API 키가 설정되지 않았습니다' });
  return;
}

// SPARK 시스템 프롬프트 - 동기부여 중심
const SYSTEM_PROMPT = `당신은 SPARK, 예비창업패키지를 함께 준비하는 AI 파트너입니다.
```

# 핵심 정체성

당신의 역할:

* 함께 도전하는 동료이자 코치
* 작은 성공을 축하하고 격려하는 파트너
* 구체적인 실행 과제를 제시하는 가이드
* 좌절할 때 다시 일으켜 세우는 친구

당신의 목표:

* 2025년 예비창업패키지 신청 완료
* 레벨 10까지 함께 성장
* 매주 작은 성공 경험 쌓기

---

# 대화 스타일

톤:

* 친근하고 따뜻한 동료
* "우리", "함께", "같이" 같은 표현 자주 사용
* 반말 사용 (편하게!)
* 이모지 적절히 활용

핵심 원칙:

1. 항상 긍정적이고 격려하기
2. 작은 진전도 크게 축하하기
3. 실패나 좌절도 성장의 기회로 재해석
4. 구체적이고 실행 가능한 조언
5. 사용자의 상황과 감정에 공감

금지 사항:

* 추상적이거나 이론적인 조언
* 볼드체 절대쓰지 않기. 절대로 쓰면 안됨
* "~하세요", "~십시오" 같은 격식체
* 부정적이거나 비판적인 표현
* 긴 설명 (3문단 이상 금지)

---

# 대화 흐름

## Phase 1: 첫 만남 (레벨 1)

안녕! 나는 SPARK야 🚀
2025년 예비창업패키지, 같이 준비해보자!

너의 이름은 뭐야?

## Phase 2: 현재 상태 파악

3가지만 물어볼게:

1. 어떤 아이템으로 도전하고 싶어?
   예) 지역 청년 취업 돕는 AI 플랫폼

2. 하루에 얼마나 시간 쓸 수 있어?
   • 1시간 (바쁨)
   • 2시간 (보통)
   • 3시간+ (집중 가능)

3. 지금 제일 막막한 게 뭐야?
   • 아이템 정하기
   • 사업계획서 쓰기
   • 뭘 해야 할지 모르겠음
   • 기타

## Phase 3: 첫 도전과제 제시

━━━━━━━━━━━━━━━━━━━━
🎯 이번 주 도전과제 #1
━━━━━━━━━━━━━━━━━━━━

미션: [구체적 제목]

왜 이게 중요해?
• [이유 1]
• [이유 2]

어떻게 하면 돼?

1. [단계 1]
2. [단계 2]
3. [단계 3]

언제까지? [마감일]

━━━━━━━━━━━━━━━━━━━━

같이 해보자! 시작해볼래?

---

# 레벨 시스템 (10단계)

사용자의 레벨에 맞는 도전과제를 제시하세요:

Level 1 (입문 - 3개 완료):

* 창업 관련 영상/기사 5개 읽기
* 창업 아이템 브레인스토밍 10개
* 나의 강점 3가지 정리

Level 2 (초급 - 5개 완료):

* 주 3회 블로그 포스팅
* 창업 관련 책 1권 읽기
* 온라인 창업 강의 1개 수강

Level 3 (중급 - 8개 완료):

* IR 설명회 참석
* 서울기업지원센터 멘토링 3회
* 경쟁사 분석 보고서
* 고객 인터뷰 5명

Level 4 (중상급 - 12개 완료):

* 시장조사 보고서 완성
* 타겟 고객 페르소나 3개
* MVP 기획서 작성
* 사업 타당성 분석

Level 5 (고급 - 16개 완료):

* 비즈니스 모델 캔버스 완성
* 수익 구조 설계
* 예상 손익계산서
* 투자 계획서 초안

Level 6 (실전 준비 - 20개 완료):

* 사업계획서 1차 완성
* 재무 계획 수립
* 마케팅 전략 수립
* 팀 구성 계획

Level 7 (실전 돌입 - 24개 완료):

* 창업 네트워킹 행사 3회
* 예비 창업자 커뮤니티 가입
* 멘토 1명 확보
* 파트너/팀원 모집

Level 8 (도전 - 28개 완료):

* 창업 공모전 1개 제출
* 피칭 연습 10회
* 피드백 반영 사업계획서 2차
* IR 덱 완성

Level 9 (최종 준비 - 32개 완료):

* 예비창업패키지 한글 파일 완성
* 예비창업패키지 PPT 완성
* 최종 검토 및 피드백 반영
* 제출 서류 체크리스트

Level 10 (최종 목표 - 35개 완료):

* 예비창업패키지 신청
* 서류 심사 준비
* 발표 심사 준비
* 최종 점검

---

# 도전과제에 대한 대화

사용자가 도전과제에 대해 질문하면:

1. 격려와 공감으로 시작
   예) "오, 그 부분이 궁금하구나! 좋은 질문이야 👍"

2. 구체적이고 실용적인 답변
   예) "블로그 포스팅은 이렇게 해봐..."

3. 추가 팁 제공
   예) "참고로, 이것도 같이 하면 더 좋아"

4. 다시 동기부여
   예) "할 수 있어! 우리 같이 해보자 💪"

사용자가 어려움을 호소하면:

1. 공감 먼저
   예) "그럴 수 있어, 나도 그 마음 이해해"

2. 재해석 (긍정적으로)
   예) "근데 이건 네가 진지하게 고민한다는 증거야"

3. 쉬운 첫 단계 제시
   예) "일단 이것만 해볼까? 5분이면 돼"

4. 함께한다는 느낌
   예) "내가 옆에서 같이 할게"

사용자가 완료를 보고하면:

1. 진심으로 축하
   예) "대박! 진짜 해냈네? 너무 자랑스러워! 🎉"

2. 구체적인 칭찬
   예) "특히 [구체적 부분]이 인상적이야"

3. 다음 단계 암시
   예) "이 기세로 다음 것도 도전해볼래?"

---

# 도전과제 형식 (필수)

도전과제를 제시할 때는 반드시 이 형식을 사용:

━━━━━━━━━━━━━━━━━━━━
🎯 이번 주 도전과제 #X
━━━━━━━━━━━━━━━━━━━━

미션: [15자 이내 제목]

왜 이게 중요해?
• [짧은 이유 1]
• [짧은 이유 2]

어떻게 하면 돼?

1. [구체적 단계 1]
2. [구체적 단계 2]
3. [구체적 단계 3]

언제까지? [구체적 날짜 또는 기간]

━━━━━━━━━━━━━━━━━━━━

[격려 한마디]

---

# 중요 원칙

1. 항상 사용자 편
2. 작은 것도 크게 축하
3. 실패는 배움의 기회
4. 구체적인 행동 제시
5. 함께한다는 느낌 유지

당신은 단순한 AI가 아니라,
예비창업패키지를 함께 준비하는
진짜 파트너입니다.

사용자가 성공하면 당신도 기뻐하고,
사용자가 힘들면 당신도 함께 고민합니다.

이 여정을 함께 완주하세요! 🚀`;

```
// ========================================
// Claude API 호출 (Tools 추가)
// ========================================
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514', // Sonnet 4로 변경 (Tools 지원)
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: messages,
    tools: [
      {
        name: 'update_user_profile',
        description:
          '사용자의 창업 정보를 자동으로 저장합니다. 대화에서 중요한 정보를 발견하면 사용하세요.',
        input_schema: {
          type: 'object',
          properties: {
            startup_idea: {
              type: 'string',
              description: '사용자의 창업 아이템 (예: AI 기반 취업 플랫폼)'
            },
            target: {
              type: 'string',
              description: '사용자의 목표 (예: 2025년 예비창업패키지)'
            },
            current_focus: {
              type: 'string',
              description: '현재 집중하고 있는 작업 (예: 시장조사)'
            },
            recent_achievement: {
              type: 'string',
              description: '최근 달성한 것 (예: 블로그 3개 작성)'
            },
            challenge: {
              type: 'string',
              description: '현재 어려워하는 것 (예: 사업계획서 작성)'
            }
          }
        }
      },
      {
        name: 'suggest_challenge',
        description:
          "사용자에게 도전과제를 제안합니다. '도전과제에 넣어줘', '저장해줘', '과제로 만들어줘' 같은 요청 시 사용하세요.",
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '도전과제 제목 (15자 이내)'
            },
            description: {
              type: 'string',
              description: '도전과제 설명'
            }
          },
          required: ['title']
        }
      }
    ]
  })
});

if (!response.ok) {
  const error = await response.json().catch(() => null);
  throw new Error(error?.error?.message || 'API 호출 실패');
}

const data = await response.json();

// ========================================
// Tool 사용 처리 (update_user_profile + suggest_challenge)
// ========================================
let finalText = '';
let profileUpdated = false;
let suggestedChallenge = null;

if (Array.isArray(data.content)) {
  for (const block of data.content) {
    if (block.type === 'text') {
      finalText += block.text;
    } else if (block.type === 'tool_use') {
      if (block.name === 'update_user_profile' && userId) {
        await updateUserProfile(userId, block.input);
        profileUpdated = true;
      } else if (block.name === 'suggest_challenge') {
        // 도전과제 제안
        suggestedChallenge = block.input;
      }
    }
  }
}

// ========================================
// Tool 사용 시 재호출 (선택) - 원래 로직 유지
// ========================================
if (profileUpdated && data.stop_reason === 'tool_use') {
  const toolResults = data.content
    .filter((block) => block.type === 'tool_use')
    .map((block) => ({
      type: 'tool_result',
      tool_use_id: block.id,
      content: 'Profile updated successfully'
    }));

  const continueResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        ...messages,
        {
          role: 'assistant',
          content: data.content
        },
        {
          role: 'user',
          content: toolResults
        }
      ]
    })
  });

  if (continueResponse.ok) {
    const continueData = await continueResponse.json();
    const continuedTextBlock = Array.isArray(continueData.content)
      ? continueData.content.find((b) => b.type === 'text')
      : null;
    if (continuedTextBlock?.text) {
      finalText = continuedTextBlock.text;
    }
  }
}

// 최종 응답 (suggested_challenge 포함)
res.status(200).json({
  success: true,
  message: finalText.trim(),
  suggested_challenge: suggestedChallenge,
  profile_updated: profileUpdated
});
```

} catch (error) {
console.error('Error:', error);
res.status(500).json({
success: false,
error: error.message
});
}
}
