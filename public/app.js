// =========================
// API 기본 설정
// =========================

const API_URL = `${window.location.origin}/api`;

// =========================
// 로그인 (허용된 멤버만)
// =========================

let currentUser = null;

const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const currentUserDiv = document.getElementById('currentUser');

loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('사용자 이름을 입력하세요.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      alert(error.error || '로그인 중 오류가 발생했습니다.');
      return;
    }

    const user = await response.json();
    currentUser = user;
    currentUserDiv.textContent = `현재 사용자: ${user.username}`;
    currentUserDiv.classList.add('active');
    usernameInput.disabled = true;
    loginBtn.disabled = true;

    // 로그인 후 출석부 새로고침
    loadAttendanceBook();
  } catch (error) {
    console.error('로그인 오류:', error);
    alert('로그인 중 오류가 발생했습니다.');
  }
});

// =========================
// 고정 스케줄 / 출석 관리 (서버 DB와 연동)
// =========================

const MEMBERS = ['김진', '김재민', '전예준'];

const SESSIONS = [
  { id: 'mon', day: '월', label: '월요일', time: '10:30 ~ 17:00' },
  { id: 'wed', day: '수', label: '수요일', time: '10:30 ~ 17:00' },
];

const MAX_EXCUSED_PER_MEMBER = 2;
const PENALTY_AMOUNT = 10000; // 지각 30분 이상 시 1만원

const attendanceTableBody = document.getElementById('attendanceTableBody');
const todayInfoDiv = document.getElementById('todayInfo');
const checkInBtn = document.getElementById('checkInBtn');

// 오늘 정보 표시
function updateTodayInfoPreview() {
  const now = new Date();
  const ko = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const y = ko.getUTCFullYear();
  const m = String(ko.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ko.getUTCDate()).padStart(2, '0');
  const hh = String(ko.getUTCHours()).padStart(2, '0');
  const mm = String(ko.getUTCMinutes()).padStart(2, '0');

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayIdx = ko.getUTCDay();
  const dayName = dayNames[dayIdx];

  let sessionText = '오늘은 매주 실시간 작업 요일(월/수)이 아닙니다.';
  if (dayName === '월' || dayName === '수') {
    sessionText = `${dayName}요일 10:30~17:00 세션`;
  }

  todayInfoDiv.textContent = `오늘 날짜: ${y}-${m}-${d} (${dayName}) / 현재 시간(서버 기준 추정): ${hh}:${mm} / ${sessionText}`;
}

// 출석부 불러오기
async function loadAttendanceBook() {
  try {
    const response = await fetch(`${API_URL}/attendance?months=4`);
    if (!response.ok) {
      console.error('출석부 로드 오류:', response.status, response.statusText);
      return;
    }

    const records = await response.json();
    renderAttendanceBook(records);
  } catch (error) {
    console.error('출석부 로드 오류:', error);
  }
}

// 출석부 렌더링
function renderAttendanceBook(records) {
  attendanceTableBody.innerHTML = '';

  if (!records || records.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.textContent = '출석 기록이 없습니다.';
    td.className = 'empty-penalty';
    tr.appendChild(td);
    attendanceTableBody.appendChild(tr);
    return;
  }

  const statusLabelMap = {
    normal: '정상',
    late: '지각',
    absent: '결석',
    excused: '공결',
  };

  records.forEach((rec) => {
    const tr = document.createElement('tr');

    const dateTd = document.createElement('td');
    dateTd.textContent = rec.date;
    tr.appendChild(dateTd);

    const dayTd = document.createElement('td');
    dayTd.textContent = rec.day_of_week;
    tr.appendChild(dayTd);

    const timeTd = document.createElement('td');
    timeTd.textContent = rec.session_time;
    tr.appendChild(timeTd);

    const memberTd = document.createElement('td');
    memberTd.textContent = rec.username;
    tr.appendChild(memberTd);

    const statusTd = document.createElement('td');
    statusTd.textContent = statusLabelMap[rec.status] || rec.status;
    tr.appendChild(statusTd);

    const lateTd = document.createElement('td');
    lateTd.textContent = rec.late_minutes || 0;
    tr.appendChild(lateTd);

    const penaltyTd = document.createElement('td');
    penaltyTd.textContent =
      rec.penalty_amount && rec.penalty_amount > 0
        ? `${rec.penalty_amount.toLocaleString()}원`
        : '-';
    penaltyTd.className =
      rec.penalty_amount && rec.penalty_amount > 0
        ? 'penalty-cell has-penalty'
        : 'penalty-cell';
    tr.appendChild(penaltyTd);

    attendanceTableBody.appendChild(tr);
  });
}

// 오늘 출석 버튼
checkInBtn.addEventListener('click', async () => {
  if (!currentUser) {
    alert('먼저 로그인하세요. (김진, 김재민, 전예준만 로그인 가능합니다)');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: currentUser.id }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      alert(data.error || '출석 처리 중 오류가 발생했습니다.');
      return;
    }

    if (data.status === 'late') {
      alert(
        `${data.username}님, 지각 ${data.lateMinutes}분으로 출석 처리되었습니다.\n벌칙금: ${data.penaltyAmount.toLocaleString()}원`
      );
    } else {
      alert(`${data.username}님, 정상 출석 처리되었습니다.`);
    }

    updateTodayInfoPreview();
    loadAttendanceBook();
  } catch (error) {
    console.error('출석 처리 오류:', error);
    alert('출석 처리 중 오류가 발생했습니다.');
  }
});

// 초기 실행
updateTodayInfoPreview();
loadAttendanceBook();
