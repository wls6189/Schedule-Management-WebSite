# 인터넷 접근 설정 가이드

## 방법 1: ngrok 사용 (빠른 테스트용) ⚡

ngrok은 로컬 서버를 인터넷에 노출시켜주는 터널링 서비스입니다.

### 설치 및 사용

1. **ngrok 다운로드**
   - https://ngrok.com/download 에서 다운로드
   - 또는 Chocolatey 사용: `choco install ngrok`
   - 또는 npm으로 설치: `npm install -g ngrok`

2. **ngrok 계정 생성** (무료)
   - https://dashboard.ngrok.com/signup
   - 인증 토큰 받기

3. **ngrok 인증**
   ```bash
   ngrok config add-authtoken [당신의_토큰]
   ```

4. **서버 실행**
   ```bash
   npm start
   ```

5. **ngrok 터널 시작** (새 터미널에서)
   ```bash
   ngrok http 3000
   ```

6. **공유할 주소**
   - ngrok이 생성한 `https://xxxx-xxxx.ngrok-free.app` 주소를 공유
   - 이 주소는 인터넷 어디서나 접근 가능합니다!

### 주의사항
- 무료 플랜은 세션이 2시간 후 종료됩니다
- 재시작하면 새로운 주소가 생성됩니다
- 프로덕션에는 클라우드 배포를 권장합니다
