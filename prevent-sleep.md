# Render 슬리프 모드 방지 가이드

Render 무료 플랜은 15분간 요청이 없으면 자동으로 슬리프 모드로 전환됩니다. 이를 방지하는 방법을 안내합니다.

## 방법 1: UptimeRobot 사용 (추천) ✅

### 단계별 설정

1. **UptimeRobot 계정 생성**
   - https://uptimerobot.com 방문
   - 무료 계정 생성 (50개 모니터링까지 무료)

2. **새 모니터 추가**
   - 대시보드에서 "Add New Monitor" 클릭
   - 설정:
     - **Monitor Type**: HTTP(s)
     - **Friendly Name**: Schedule Management App (원하는 이름)
     - **URL**: `https://your-app.onrender.com` (Render에서 제공한 주소)
     - **Monitoring Interval**: 5 minutes
     - **Alert Contacts**: 이메일 등록 (선택사항)

3. **저장 및 활성화**
   - "Create Monitor" 클릭
   - 이제 5분마다 자동으로 접속하여 슬리프 모드를 방지합니다!

### 장점
- ✅ 완전 무료
- ✅ 자동으로 작동
- ✅ 서비스 상태 모니터링도 가능
- ✅ 설정이 매우 간단

---

## 방법 2: 다른 핑 서비스 사용

### Cron-Job.org
- https://cron-job.org 에서 무료 계정 생성
- 5분마다 Render URL에 요청 보내도록 설정

### EasyCron
- https://www.easycron.com 에서 무료 계정 생성
- Cron 작업으로 5분마다 핑 설정

---

## 방법 3: Render 유료 플랜 업그레이드

- $7/월부터 슬리프 모드 없이 24시간 실행 가능
- 프로덕션 환경에서는 유료 플랜을 권장합니다

---

## FAQ

**Q: 접속할 때마다 토큰이나 크레딧이 소모되나요?**
A: 아닙니다! Render는 토큰 기반이 아닙니다. 서비스가 실행 중일 때만 시간이 소모되며, 월 750시간까지 무료입니다.

**Q: 슬리프 모드에서 깨어나는데 시간이 얼마나 걸리나요?**
A: 약 30초~1분 정도 소요됩니다. 첫 접속 시 지연이 있을 수 있습니다.

**Q: UptimeRobot을 사용하면 추가 비용이 드나요?**
A: 아닙니다. UptimeRobot도 무료 플랜으로 충분합니다 (50개 모니터링까지 무료).
