# 🚀 빠른 시작 가이드 - 인터넷 접근

## 가장 빠른 방법: ngrok 사용

### 1단계: ngrok 설치 및 설정

**옵션 A: npm으로 설치 (권장)**
```bash
npm install -g ngrok
```

**옵션 B: 직접 다운로드**
- https://ngrok.com/download 에서 다운로드
- 압축 해제 후 실행 파일 경로를 PATH에 추가

### 2단계: ngrok 계정 생성
1. https://dashboard.ngrok.com/signup 방문
2. 무료 계정 생성
3. 인증 토큰 복사

### 3단계: ngrok 인증
```bash
ngrok config add-authtoken [당신의_토큰]
```

### 4단계: 서버 실행
```bash
npm start
```

### 5단계: ngrok 터널 시작 (새 터미널)
```bash
ngrok http 3000
```

또는 npm 스크립트 사용:
```bash
npm run tunnel
```

### 6단계: 주소 공유
ngrok이 생성한 주소를 복사하여 다른 사용자에게 공유하세요!

예: `https://abc123.ngrok-free.app`

---

## 영구적인 해결책: Render 배포

### 1단계: GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [당신의_깃허브_레포지토리_URL]
git push -u origin main
```

### 2단계: Render에서 배포
1. https://render.com 에서 GitHub로 로그인
2. "New +" → "Web Service" 클릭
3. 레포지토리 선택
4. 설정:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
5. "Create Web Service" 클릭

### 3단계: 완료!
Render가 제공하는 주소를 공유하세요!

---

## 문제 해결

**ngrok 오류가 발생하면:**
- 토큰이 올바르게 설정되었는지 확인
- `ngrok config add-authtoken [토큰]` 다시 실행

**Render 배포 오류가 발생하면:**
- Build Command와 Start Command가 올바른지 확인
- 로그에서 오류 메시지 확인
