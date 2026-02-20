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

### 무료 플랜 제한사항

1. **슬리프 모드 (Sleep Mode)**
   - 15분간 요청이 없으면 서비스가 자동으로 종료됩니다
   - 다시 접속하면 약 1분 정도 지연 후 재시작됩니다
   - **해결책**: UptimeRobot 같은 서비스로 5분마다 핑을 보내면 슬리프 모드를 방지할 수 있습니다

2. **월별 사용 시간 제한**
   - 월 750시간 무료 인스턴스 시간 제공
   - 서비스가 실행 중일 때만 시간이 소모됩니다
   - 24시간 × 31일 = 744시간이므로, 한 달 내내 실행 가능합니다
   - **중요**: 접속할 때마다 토큰이 소모되는 것이 아닙니다!

3. **리소스 제한**
   - CPU와 메모리 제한이 있습니다
   - 대부분의 소규모 웹앱에는 충분합니다

### 슬리프 모드 방지 방법

UptimeRobot (무료)를 사용하여 자동으로 핑 보내기:
1. https://uptimerobot.com 에서 무료 계정 생성
2. "Add New Monitor" 클릭
3. Monitor Type: HTTP(s)
4. URL: `https://your-app.onrender.com`
5. Monitoring Interval: 5 minutes
6. 저장하면 5분마다 자동으로 접속하여 슬리프 모드 방지!
