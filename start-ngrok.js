// ngrok을 자동으로 시작하는 스크립트
const { spawn } = require('child_process');
const ngrok = require('ngrok');

async function startNgrok() {
  try {
    console.log('🚀 ngrok 터널을 시작하는 중...\n');
    
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: process.env.NGROK_AUTHTOKEN || null, // 환경 변수에서 토큰 가져오기
    });
    
    console.log('\n✅ 인터넷 접근 가능한 주소:');
    console.log(`   ${url}\n`);
    console.log('📋 이 주소를 다른 사용자에게 공유하세요!');
    console.log('   (인터넷 어디서나 접근 가능합니다)\n');
    console.log('⚠️  무료 플랜은 세션이 2시간 후 종료됩니다.\n');
    
    // 종료 처리
    process.on('SIGINT', async () => {
      console.log('\n\n터널을 종료하는 중...');
      await ngrok.disconnect();
      await ngrok.kill();
      process.exit();
    });
    
  } catch (error) {
    console.error('❌ ngrok 시작 오류:', error.message);
    console.log('\n수동으로 ngrok을 시작하려면:');
    console.log('1. https://ngrok.com/download 에서 다운로드');
    console.log('2. ngrok config add-authtoken [토큰]');
    console.log('3. ngrok http 3000\n');
    process.exit(1);
  }
}

startNgrok();
