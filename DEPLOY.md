# 🚀 SPARK 배포 완전 가이드 (그림으로 보기)

## 📦 방금 만든 파일들

```
spark-deploy/
├── package.json          ← React 설정
├── README.md             ← 프로젝트 설명
├── .gitignore            ← Git 제외 파일
├── public/
│   └── index.html        ← 메인 HTML
└── src/
    ├── index.js          ← React 시작점
    └── App.js            ← SPARK 앱 (메인 코드)
```

---

## 🎯 배포 방법 선택

### 방법 1: Vercel (추천! ⭐⭐⭐⭐⭐)

**장점:**
✅ 완전 무료
✅ 클릭 몇 번이면 끝
✅ 자동 HTTPS
✅ 자동 업데이트
✅ https://your-app.vercel.app 링크

**시간:** 10분

---

### 방법 2: Netlify (비슷함 ⭐⭐⭐⭐)

**장점:**
✅ 완전 무료
✅ 드래그 앤 드롭 배포
✅ https://your-app.netlify.app 링크

**시간:** 10분

---

### 방법 3: GitHub Pages (조금 복잡 ⭐⭐⭐)

**장점:**
✅ 무료
✅ GitHub 계정만 있으면 됨

**단점:**
❌ 설정 조금 복잡

**시간:** 15분

---

## 📝 Vercel 배포 (자세한 단계)

### Step 1: 파일 다운로드 (1분)

아래 링크 클릭:
👉 **[spark-deploy.zip 다운로드]**

또는 파일 직접 복사

---

### Step 2: GitHub 업로드 (5분)

#### 2-1. GitHub 접속
https://github.com → 로그인

#### 2-2. 새 저장소 만들기
1. 오른쪽 위 "+" 버튼
2. "New repository" 클릭
3. 이름: `spark-ai-coach`
4. Public 선택
5. "Create repository" 클릭

#### 2-3. 파일 업로드
1. "uploading an existing file" 클릭
2. spark-deploy 폴더 안 파일 **모두** 드래그
3. 아래로 스크롤
4. "Commit changes" 클릭

완료! ✅

---

### Step 3: Vercel 배포 (3분)

#### 3-1. Vercel 가입
https://vercel.com

1. "Sign Up" 클릭
2. "Continue with GitHub" 선택
3. GitHub 계정으로 로그인
4. 권한 허용

#### 3-2. 프로젝트 가져오기
1. "Add New..." 클릭
2. "Project" 선택
3. `spark-ai-coach` 저장소 찾기
4. "Import" 클릭

#### 3-3. 배포 설정
1. Framework Preset: **Create React App** 자동 선택
2. 다른 건 건드리지 말고
3. "Deploy" 버튼 클릭!

#### 3-4. 기다리기
```
⏳ Building... (30초)
⏳ Deploying... (10초)
✅ Ready! (완료!)
```

#### 3-5. 완성!
```
🎉 https://spark-ai-coach-xxxxx.vercel.app
```

이 링크가 너의 앱 주소!

---

## 🎨 도메인 이름 예쁘게 바꾸기 (선택)

Vercel 대시보드에서:

1. 프로젝트 클릭
2. "Settings" 탭
3. "Domains" 메뉴
4. "Add" 클릭
5. 원하는 이름 입력
   - 예: `spark-coach`
   - 결과: `spark-coach.vercel.app`
6. "Add" 버튼

완료! ✨

---

## 📱 테스트

### 링크 열기
https://spark-coach.vercel.app

### 확인사항
✅ API 키 입력 화면 나옴
✅ API 키 입력 후 대화 가능
✅ 모바일에서도 잘 보임

---

## 🔄 코드 수정하려면?

### 방법 1: GitHub 웹에서
1. GitHub 저장소 접속
2. 파일 클릭
3. 연필 아이콘 (편집)
4. 수정
5. "Commit changes"

→ Vercel이 **자동으로** 새로 배포! (1분 소요)

### 방법 2: 로컬에서
1. 파일 수정
2. GitHub에 다시 업로드
3. Vercel 자동 배포

---

## 🌍 링크 공유하기

### 사용자에게 전달할 내용:

```
━━━━━━━━━━━━━━━━━━━━
🚀 SPARK 사용 방법
━━━━━━━━━━━━━━━━━━━━

1. 링크 접속
   https://spark-coach.vercel.app

2. Claude API 키 발급
   - console.anthropic.com 접속
   - 로그인 (구글 계정 가능)
   - "API Keys" 클릭
   - "Create Key" 클릭
   - 키 복사

3. SPARK에 키 입력
   - 시작하기 클릭
   - 대화 시작!

━━━━━━━━━━━━━━━━━━━━
💡 팁:
- API 키는 본인만 사용
- 비용: 대화 1000회 약 $1
- $5 무료 크레딧 제공

문의: [너의 연락처]
━━━━━━━━━━━━━━━━━━━━
```

---

## 💰 비용

### Vercel
- **월 비용: $0** (무료!)
- 대역폭: 100GB/월
- 프로젝트: 무제한
- 빌드 시간: 6000분/월

→ 사용자 100명까지도 무료!

### Claude API
- 각 사용자가 **본인 API 키** 사용
- 병묵님 비용 없음!
- 사용자당 $5 무료 크레딧

---

## 🎉 완료 체크리스트

배포 완료 확인:

- [ ] GitHub 저장소 생성
- [ ] 파일 업로드 완료
- [ ] Vercel 배포 성공
- [ ] 링크 접속 가능
- [ ] API 키 입력 화면 나옴
- [ ] 대화 테스트 성공
- [ ] 모바일 테스트 성공

모두 체크되면 **배포 완료!** 🎉

---

## 🆘 문제 해결

### 문제 1: "Deploy Failed"
**원인:** 파일 누락

**해결:**
- 모든 파일 업로드했는지 확인
- 특히 package.json 있는지 확인

### 문제 2: 화면이 깨져 보임
**원인:** Tailwind CDN 로딩 실패

**해결:**
- 인터넷 연결 확인
- 새로고침 (Ctrl+Shift+R)

### 문제 3: API 키 입력해도 작동 안함
**원인:** API 키 오류

**해결:**
- API 키 다시 발급
- `sk-ant-api03-`로 시작하는지 확인
- 공백 없는지 확인

---

## 📞 도움이 필요하면

1. Vercel 문서: https://vercel.com/docs
2. React 문서: https://react.dev
3. Claude API: https://docs.anthropic.com

또는 나한테 물어봐! 😊

---

## 🎊 다음 단계

배포 완료했으면:

1. ✅ 청창아 수료생들에게 링크 공유
2. 🔲 피드백 받기
3. 🔲 기능 개선
4. 🔲 사용자 통계 추가
5. 🔲 레벨 시스템 강화

화이팅! 🚀
