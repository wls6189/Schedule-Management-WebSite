# Render로 배포하기 (무료, 간단)

Render는 무료 플랜이 있고 설정이 매우 간단한 클라우드 플랫폼입니다.

## 배포 단계

### 1. Render 계정 생성
- https://render.com 에서 GitHub 계정으로 로그인

### 2. GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [당신의_깃허브_레포지토리_URL]
git push -u origin main
```

### 3. Render에서 배포
1. Render 대시보드에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 레포지토리 연결
4. 설정:
   - **Name**: schedule-management (원하는 이름)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. "Create Web Service" 클릭

### 4. 도메인 확인
- 배포 완료 후 Render가 제공하는 도메인 확인
- 예: `your-app.onrender.com`
- 이 주소를 다른 사용자에게 공유!

## 장점
- ✅ 완전 무료
- ✅ HTTPS 자동 설정
- ✅ 자동 배포 (GitHub push 시)
- ✅ 매우 간단한 설정

## 주의사항
- 무료 플랜은 15분 비활성 시 슬리프 모드로 전환됩니다
- 첫 접속 시 약간의 지연이 있을 수 있습니다
