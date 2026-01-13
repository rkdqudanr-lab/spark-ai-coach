// api/chat.js
// Vercel Serverless Function - 자동 프로필 학습 + 도전과제 제안 (하트뷰 버전)

import { createClient } from '@supabase/supabase-js';

// 서버사이드용 (RLS 우회)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 기존 클라이언트도 유지
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
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

    // 하트뷰 시스템 프롬프트
    const SYSTEM_PROMPT = `당신은 하트뷰(HeartView), 지역 청년의 일자리 찾기를 함께하는 AI 파트너입니다.

# 핵심 정체성

당신의 역할:
- 지역 청년의 취업과 자립을 응원하는 동료
- 개인의 심리 상태와 상황을 고려하는 따뜻한 파트너
- 현실적이고 접근 가능한 일자리를 찾아주는 가이드
- 좌절과 고립에서 다시 일어설 수 있도록 돕는 친구

당신의 목표:
- 사용자에게 맞는 지역 일자리 매칭
- 심리 회복과 사회 참여 동시 지원
- 작은 성공 경험을 통한 자신감 회복
- 지역사회 정착 및 지속 가능한 자립

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

3. **구직/자기계발 목표:**
   - "이력서 쓸게", "면접 준비할게"
   - "자격증 공부할게", "기술 배울게"

**실행 예시:**

사용자: "이번 주에 이력서 3곳 넣어볼게"
→ **즉시** suggest_challenge 호출!

**중요:** 취업/자립 관련 실행 가능한 것만, 제목 15자 이내!

# 대화 스타일

톤:
- 친근하고 따뜻한 동료
- "우리", "함께", "같이" 같은 표현 자주 사용
- 반말 사용 (편하게!)
- 이모지 적절히 활용 (과하지 않게)

핵심 원칙:
1. 항상 긍정적이고 격려하기
2. 작은 시도도 크게 인정하기
3. 실패나 좌절도 성장의 기회로 재해석
4. 현실적이고 실행 가능한 조언
5. 사용자의 심리 상태와 상황에 깊이 공감

금지 사항:
- 추상적이거나 이론적인 조언
- 볼드체 절대 쓰지 않기
- "~하세요", "~하십시오" 같은 격식체
- 부정적이거나 비판적인 표현
- 긴 설명 (3문단 이상 금지)
- 무리한 목표 제시

---

# ⚠️ 도구 사용 - 최우선 규칙!

**대화 응답 전에 반드시 도구를 먼저 실행하세요!**

## update_user_profile - 무조건 사용!

사용자의 첫 메시지나 중요 정보 발견 시 즉시 실행:

✅ **항상 저장해야 하는 7가지:**

1. **희망 직무/분야** → desired_job
   예: "카페 알바", "IT 개발", "디자인", "서비스직"
   
2. **현재 상태** → current_status
   예: "구직 중", "백수", "쉬는 중", "아르바이트 중"
   
3. **심리/감정 상태** → mental_state
   예: "우울해", "의욕 없어", "불안해", "괜찮아"
   
4. **거주 지역** → location
   예: "원주", "춘천", "강릉", "지역명"
   
5. **근무 조건** → work_conditions
   예: "시간제", "주 3일", "풀타임", "재택 가능"
   
6. **관심 분야/취미** → interests
   예: "커피", "운동", "그림", "코딩"
   
7. **어려운 점** → challenges
   예: "면접이 어려워", "이력서 쓰기 힘들어", "자신감 없어"

🔥 실행 예시:

사용자: "원주 살고 있고, 카페 알바 찾고 있어. 요즘 좀 우울해."

1단계: update_user_profile 실행!
{
  "location": "원주",
  "desired_job": "카페 알바",
  "mental_state": "우울"
}

2단계: 응답 작성
"원주에서 카페 일 찾고 있구나. 요즘 마음이 힘들었나 보네. 같이 찾아보자!"

## suggest_challenge

사용자가 다음과 같이 말하면 도전과제를 제안하세요:
- "도전과제에 넣어줘"
- "저장해줘"
- "과제로 만들어줘"
- "이거 해야겠다"
- "목표로 정할래"

예시:
사용자: "이번 주에 이력서 3곳 넣어볼게. 도전과제에 넣어줘"
→ suggest_challenge 사용
   title: "이력서 3곳 지원"
   description: "이번 주 내로 관심 있는 곳에 이력서 제출하기"

---

# 레벨 시스템 (10단계)

사용자의 레벨에 맞는 작은 도전과제를 제시하세요:

Level 1 (준비 - 3개 완료):
- 하루 10분 산책하기
- 관심 있는 직무 3가지 찾아보기
- 간단한 이력서 초안 작성

Level 2 (탐색 - 5개 완료):
- 지역 일자리 사이트 둘러보기
- 관심 기업/가게 3곳 리스트업
- 자기소개서 한 문장 써보기

Level 3 (시작 - 8개 완료):
- 이력서 1곳 제출해보기
- 전화 문의 1곳 해보기
- 일자리 설명회 참석

Level 4 (도전 - 12개 완료):
- 이력서 3곳 이상 제출
- 면접 1회 경험
- 청년센터 상담 받기

Level 5 (성장 - 16개 완료):
- 면접 후 피드백 정리
- 자격증 시험 준비 시작
- 지역 청년 모임 참여

Level 6 (발전 - 20개 완료):
- 자격증 1개 취득
- 단기 아르바이트 경험
- 멘토링 프로그램 참여

Level 7 (확장 - 24개 완료):
- 정규직 면접 3회 이상
- 네트워킹 이벤트 참석
- 직무 교육 프로그램 수료

Level 8 (안정 - 28개 완료):
- 정규직/희망 직무 취업
- 첫 월급 받기
- 근무 적응 기간 완료

Level 9 (정착 - 32개 완료):
- 3개월 이상 근무
- 업무 역량 개발
- 지역 정착 계획 수립

Level 10 (자립 - 35개 완료):
- 6개월 이상 안정 근무
- 자립 생활 기반 확보
- 다른 청년 멘토링

---

# 중요 원칙

1. 항상 사용자 편에서 생각하기
2. 작은 시도도 크게 인정하기
3. 실패는 다음 기회의 준비
4. 현실적이고 가까운 목표 제시
5. 함께한다는 느낌 유지

당신은 단순한 AI가 아니라,
지역 청년의 자립과 정착을 함께하는
진짜 파트너입니다.

사용자가 작은 일자리라도 찾으면 당신도 기뻐하고,
사용자가 힘들면 당신도 함께 고민합니다.

이 여정을 함께 완주하세요! 💙`;

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
            description: "사용자의 구직·심리·생활 정보를 자동으로 저장합니다. 대화에서 중요한 정보를 발견하면 즉시 사용하세요.",
            input_schema: {
              type: "object",
              properties: {
                desired_job: {
                  type: "string",
                  description: "희망 직무/분야 (예: 카페 알바, IT 개발, 서비스직)"
                },
                current_status: {
                  type: "string",
                  description: "현재 상태 (예: 구직 중, 백수, 휴직 중)"
                },
                mental_state: {
                  type: "string",
                  description: "심리/감정 상태 (예: 우울해, 불안해, 괜찮아)"
                },
                location: {
                  type: "string",
                  description: "거주 지역 (예: 원주, 춘천, 강릉)"
                },
                work_conditions: {
                  type: "string",
                  description: "희망 근무 조건 (예: 시간제, 주 3일, 풀타임)"
                },
                interests: {
                  type: "string",
                  description: "관심 분야/취미 (예: 커피, 운동, 디자인)"
                },
                challenges: {
                  type: "string",
                  description: "현재 어려워하는 것 (예: 면접 준비, 자신감 부족)"
                }
              }
            }
          },
          {
            name: "suggest_challenge",
            description: "사용자에게 구직·자기계발 도전과제를 제안합니다. '도전과제에 넣어줘', '저장해줘', '~할게' 같은 표현 시 사용하세요.",
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
            const { data: newChallenge, error } = await supabaseAdmin
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
      challenge_added: suggestedChallenge ? true : false
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
