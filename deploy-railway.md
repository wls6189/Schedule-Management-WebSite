# Railway로 배포하기 (영구적 인터넷 접근)

Railway는 간단하고 무료 플랜이 있는 클라우드 플랫폼입니다.

## 배포 단계

### 1. Railway 계정 생성
- https://railway.app 에서 GitHub 계정으로 로그인

### 2. 프로젝트 설정 파일 생성

`railway.json` 파일이 이미 생성되어 있습니다.

### 3. GitHub에 코드 업로드
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [당신의_깃허브_레포지토리_URL]
git push -u origin main
```

### 4. Railway에서 배포
1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 레포지토리 선택
4. 자동으로 배포 시작

### 5. 도메인 설정
- Railway가 자동으로 도메인 제공 (예: `your-project.up.railway.app`)
- 이 주소를 다른 사용자에게 공유하면 됩니다!

### 6. 환경 변수 (필요시)
- Railway 대시보드에서 환경 변수 설정 가능

## 장점
- ✅ 무료 플랜 제공
- ✅ 자동 배포 (GitHub push 시)
- ✅ 영구적인 인터넷 접근
- ✅ HTTPS 자동 설정
- ✅ 간단한 설정
