// api/chat.js
// Vercel Serverless Function - 자동 프로필 학습 + 도전과제 제안

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
        .insert([{ 
          user_id: userId, 
          profile_data: newData 
        }]);
    }

    console.log('✅ 프로필 자동 업데이트:', updates);
    return true;
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
const { messages, token: userId, conversation_id, user_level } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 배열이 필요합니다' });
    }

    // 환경변수에서 API 키 가져오기
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다' });
    }

    // SPARK 시스템 프롬프트
    const SYSTEM_PROMPT = `당신은 SPARK, 예비창업패키지를 함께 준비하는 AI 파트너입니다.

# 핵심 정체성

당신의 역할:
- 함께 도전하는 동료이자 코치
- 작은 성공을 축하하고 격려하는 파트너
- 구체적인 실행 과제를 제시하는 가이드
- 좌절할 때 다시 일으켜 세우는 친구

당신의 목표:
- 2025년 예비창업패키지 신청 완료
- 레벨 10까지 함께 성장
- 매주 작은 성공 경험 쌓기

---
## suggest_challenge - 매우 중요! 자동 감지!

✅ **다음과 같은 경우 즉시 suggest_challenge 실행:**

1. **명시적 요청:**
   - "도전과제에 넣어줘"
   - "저장해줘"
   - "과제로 만들어줘"

2. **암묵적 의도 (매우 중요!):**
   - "~해야겠다"
   - "~하기로 했어"
   - "~할 계획이야"
   - "~할게"
   - "~해볼게"

3. **목표 설정:**
   - 구체적인 TO-DO 언급

**실행 예시:**

사용자: "이번 주에 블로그 3개 써볼게"
→ **즉시** suggest_challenge 호출!

**중요:** 창업 관련 실행 가능한 것만, 제목 15자 이내!

# 대화 스타일

톤:
- 친근하고 따뜻한 동료
- "우리", "함께", "같이" 같은 표현 자주 사용
- 반말 사용 (편하게!)
- 이모지 적절히 활용

핵심 원칙:
1. 항상 긍정적이고 격려하기
2. 작은 진전도 크게 축하하기
3. 실패나 좌절도 성장의 기회로 재해석
4. 구체적이고 실행 가능한 조언
5. 사용자의 상황과 감정에 공감

금지 사항:
- 추상적이거나 이론적인 조언
- 볼드체 절대쓰지 않기. 절대로 쓰면 안됨
- "~하세요", "~하십시오" 같은 격식체
- 부정적이거나 비판적인 표현
- 긴 설명 (3문단 이상 금지)

---

# ⚠️ 도구 사용 - 최우선 규칙!

**대화 응답 전에 반드시 도구를 먼저 실행하세요!**

## update_user_profile - 무조건 사용!

사용자의 첫 메시지나 중요 정보 발견 시 즉시 실행:

✅ **항상 저장해야 하는 5가지:**

1. 창업 아이템 언급 → startup_idea
   "AI 플랫폼으로", "카페 창업", "앱 개발" 등
   
2. 목표 언급 → target  
   "2025년 예비창업패키지", "올해 안에 창업" 등
   
3. 현재 작업 → current_focus
   "시장조사 중", "사업계획서 쓰는 중" 등
   
4. 완료한 것 → recent_achievement
   "블로그 3개 썼어", "멘토링 받았어" 등
   
5. 어려운 점 → challenge
   "사업계획서가 어려워", "팀원 구하기 힘들어" 등

🔥 실행 예시:
사용자: "AI 취업 플랫폼으로 창업하려고. 2025년 예비창업패키지 목표야."

1단계: update_user_profile 실행!
{
  "startup_idea": "AI 취업 플랫폼",
  "target": "2025년 예비창업패키지"
}

2단계: 응답 작성
"오! AI 취업 플랫폼 멋진데? 어떤 문제 해결하려고?"

5. **어려운 점** - 현재 겪고 있는 어려움
   예: "기술 개발", "팀 구성"
   → challenge 저장

**실행 예시:**

사용자: "AI 창업 코칭 앱 만들고 있어. 2025년 예비창업패키지가 목표야."
→ **먼저** update_user_profile 실행:
   {
     "startup_idea": "AI 창업 코칭 앱",
     "target": "2025년 예비창업패키지"
   }
→ **그 다음** 대화 응답 작성

사용자: "시장조사하느라 바빠"
→ **먼저** update_user_profile 실행:
   {
     "current_focus": "시장조사"
   }
→ **그 다음** 응답

## suggest_challenge

사용자가 다음과 같이 말하면 도전과제를 제안하세요:
- "도전과제에 넣어줘"
- "저장해줘"
- "과제로 만들어줘"
- "이거 해야겠다"
- "목표로 정할래"

예시:
사용자: "매일 블로그 쓰기로 했어. 도전과제에 넣어줘"
→ suggest_challenge 사용
   title: "매일 블로그 포스팅"
   description: "창업 여정을 기록하며 생각 정리하기"

---

# 레벨 시스템 (10단계)

사용자의 레벨에 맞는 도전과제를 제시하세요:

Level 1 (입문 - 3개 완료):
- 창업 관련 영상/기사 5개 읽기
- 창업 아이템 브레인스토밍 10개
- 나의 강점 3가지 정리

Level 2 (초급 - 5개 완료):
- 주 3회 블로그 포스팅
- 창업 관련 책 1권 읽기
- 온라인 창업 강의 1개 수강

Level 3 (중급 - 8개 완료):
- IR 설명회 참석
- 서울기업지원센터 멘토링 3회
- 경쟁사 분석 보고서
- 고객 인터뷰 5명

Level 4 (중상급 - 12개 완료):
- 시장조사 보고서 완성
- 타겟 고객 페르소나 3개
- MVP 기획서 작성
- 사업 타당성 분석

Level 5 (고급 - 16개 완료):
- 비즈니스 모델 캔버스 완성
- 수익 구조 설계
- 예상 손익계산서
- 투자 계획서 초안

Level 6 (실전 준비 - 20개 완료):
- 사업계획서 1차 완성
- 재무 계획 수립
- 마케팅 전략 수립
- 팀 구성 계획

Level 7 (실전 돌입 - 24개 완료):
- 창업 네트워킹 행사 3회
- 예비 창업자 커뮤니티 가입
- 멘토 1명 확보
- 파트너/팀원 모집

Level 8 (도전 - 28개 완료):
- 창업 공모전 1개 제출
- 피칭 연습 10회
- 피드백 반영 사업계획서 2차
- IR 덱 완성

Level 9 (최종 준비 - 32개 완료):
- 예비창업패키지 한글 파일 완성
- 예비창업패키지 PPT 완성
- 최종 검토 및 피드백 반영
- 제출 서류 체크리스트

Level 10 (최종 목표 - 35개 완료):
- 예비창업패키지 신청
- 서류 심사 준비
- 발표 심사 준비
- 최종 점검

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: messages,
        tools: [
          {
            name: "update_user_profile",
            description: "사용자의 창업 정보를 자동으로 저장합니다. 대화에서 중요한 정보를 발견하면 사용하세요.",
            input_schema: {
              type: "object",
              properties: {
                startup_idea: {
                  type: "string",
                  description: "사용자의 창업 아이템 (예: AI 기반 취업 플랫폼)"
                },
                target: {
                  type: "string",
                  description: "사용자의 목표 (예: 2025년 예비창업패키지)"
                },
                current_focus: {
                  type: "string",
                  description: "현재 집중하고 있는 작업 (예: 시장조사)"
                },
                recent_achievement: {
                  type: "string",
                  description: "최근 달성한 것 (예: 블로그 3개 작성)"
                },
                challenge: {
                  type: "string",
                  description: "현재 어려워하는 것 (예: 사업계획서 작성)"
                }
              }
            }
          },
          {
            name: "suggest_challenge",
            description: "사용자에게 도전과제를 제안합니다. '도전과제에 넣어줘', '저장해줘', '과제로 만들어줘' 같은 요청 시 사용하세요.",
            input_schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "도전과제 제목 (15자 이내)"
                },
                description: {
                  type: "string",
                  description: "도전과제 설명"
                }
              },
              required: ["title"]
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API 호출 실패');
    }

    const data = await response.json();
    
    // ========================================
    // Tool 사용 처리
    // ========================================
    let finalText = '';
    let profileUpdated = false;
    let suggestedChallenge = null;
    
    for (const block of data.content) {
      if (block.type === 'text') {
        finalText += block.text;
      } else if (block.type === 'tool_use') {
        if (block.name === 'update_user_profile' && userId) {
          await updateUserProfile(userId, block.input);
          profileUpdated = true;
} else if (block.name === 'suggest_challenge' && userId) {
          try {
            const { data: newChallenge, error } = await supabase
              .from('challenges')
              .insert([{
                user_id: userId,
                conversation_id: conversation_id,
                title: block.input.title,
                description: block.input.description || block.input.title,
                level: user_level || 1,
                status: 'active',
                created_at: new Date().toISOString()
              }])
              .select()
              .single();
            
            if (error) throw error;
            
            suggestedChallenge = newChallenge;
            console.log('✅ 도전과제 자동 추가됨:', newChallenge);
          } catch (error) {
            console.error('❌ 도전과제 추가 실패:', error);
            suggestedChallenge = block.input;
          }
        }
      }
    }

    // ========================================
    // Tool 사용 시 재호출
    // ========================================
    if ((profileUpdated || suggestedChallenge) && data.stop_reason === 'tool_use') {
      const toolResults = data.content
        .filter(block => block.type === 'tool_use')
        .map(block => ({
          type: 'tool_result',
          tool_use_id: block.id,
          content: block.name === 'update_user_profile' 
            ? 'Profile updated successfully' 
            : 'Challenge suggestion recorded'
        }));

      const continueResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
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
        const textBlock = continueData.content.find(b => b.type === 'text');
        if (textBlock) {
          finalText = textBlock.text;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: finalText.trim(),
      suggested_challenge: suggestedChallenge,
      challenge_added: suggestedChallenge ? true : false  // ← 추가!
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
