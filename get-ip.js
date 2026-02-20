// 이 컴퓨터의 IP 주소를 확인하는 스크립트
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4이고 내부 주소가 아닌 경우
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address
        });
      }
    }
  }

  return addresses;
}

const ips = getLocalIP();

console.log('\n=== 네트워크 IP 주소 ===\n');
if (ips.length === 0) {
  console.log('네트워크 인터페이스를 찾을 수 없습니다.');
} else {
  ips.forEach(({ interface: name, address }) => {
    console.log(`${name}: ${address}`);
    console.log(`   접속 주소: http://${address}:3000\n`);
  });
}
console.log('다른 사용자에게 위 주소를 공유하세요!');
console.log('(같은 네트워크에 연결되어 있어야 합니다)\n');
