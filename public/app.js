// =========================
// 로그인 (프론트 단 UI 표시용)
// =========================

let currentUser = null;

const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const currentUserDiv = document.getElementById('currentUser');

loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('사용자 이름을 입력하세요.');
    return;
  }

  currentUser = { username };
  currentUserDiv.textContent = `현재 사용자: ${username}`;
  currentUserDiv.classList.add('active');
  usernameInput.disabled = true;
  loginBtn.disabled = true;
});

// =========================
// 고정 스케줄 / 출석 관리
// =========================

const MEMBERS = ['김진', '김재민', '전예준'];

const SESSIONS = [
  { id: 'mon', day: '월', label: '월요일', time: '10:30 ~ 17:00' },
  { id: 'wed', day: '수', label: '수요일', time: '10:30 ~ 17:00' },
];

const MAX_EXCUSED_PER_MEMBER = 2;
const PENALTY_AMOUNT = 10000; // 지각 30분 이상 시 1만원

// attendanceRecords: [{ sessionId, sessionLabel, sessionTime, member, status, lateMinutes, isExcused, penalty }]
let attendanceRecords = [];
let excusedUsed = {}; // { member: count }

const attendanceTableBody = document.getElementById('attendanceTableBody');
const penaltyTableBody = document.getElementById('penaltyTableBody');

// 초기 상태 설정
function initState() {
  attendanceRecords = [];
  excusedUsed = {};

  MEMBERS.forEach((member) => {
    excusedUsed[member] = 0;

    SESSIONS.forEach((session) => {
      attendanceRecords.push({
        sessionId: session.id,
        sessionLabel: session.label,
        sessionTime: session.time,
        member,
        status: 'normal', // normal | late | absent | excused
        lateMinutes: 0,
        isExcused: false,
        penalty: 0,
      });
    });
  });
}

// 출석 테이블 렌더링
function renderAttendanceTable() {
  attendanceTableBody.innerHTML = '';

  attendanceRecords.forEach((rec, index) => {
    const tr = document.createElement('tr');

    // 요일
    const dayTd = document.createElement('td');
    dayTd.textContent = rec.sessionLabel;
    tr.appendChild(dayTd);

    // 시간
    const timeTd = document.createElement('td');
    timeTd.textContent = rec.sessionTime;
    tr.appendChild(timeTd);

    // 멤버
    const memberTd = document.createElement('td');
    memberTd.textContent = rec.member;
    tr.appendChild(memberTd);

    // 상태 선택
    const statusTd = document.createElement('td');
    const statusSelect = document.createElement('select');
    statusSelect.className = 'status-select';

    [
      { value: 'normal', label: '정상' },
      { value: 'late', label: '지각' },
      { value: 'absent', label: '결석' },
      { value: 'excused', label: '공결' },
    ].forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (rec.status === opt.value) option.selected = true;
      statusSelect.appendChild(option);
    });

    statusSelect.addEventListener('change', () => {
      handleStatusChange(index, statusSelect.value);
    });

    statusTd.appendChild(statusSelect);
    tr.appendChild(statusTd);

    // 지각 시간 입력
    const lateTd = document.createElement('td');
    const lateInput = document.createElement('input');
    lateInput.type = 'number';
    lateInput.min = '0';
    lateInput.placeholder = '분';
    lateInput.value = rec.lateMinutes || '';
    lateInput.className = 'late-input';

    if (rec.status !== 'late') {
      lateInput.disabled = true;
    }

    lateInput.addEventListener('input', () => {
      const value = parseInt(lateInput.value || '0', 10);
      handleLateMinutesChange(index, value);
    });

    lateTd.appendChild(lateInput);
    tr.appendChild(lateTd);

    // 공결 정보
    const excusedTd = document.createElement('td');
    excusedTd.className = 'excused-cell';
    const used = excusedUsed[rec.member] || 0;
    const remaining = MAX_EXCUSED_PER_MEMBER - used;
    excusedTd.textContent =
      rec.status === 'excused'
        ? `공결 사용 (${used}/${MAX_EXCUSED_PER_MEMBER})`
        : `남은 공결: ${remaining}회`;
    tr.appendChild(excusedTd);

    // 벌칙금
    const penaltyTd = document.createElement('td');
    penaltyTd.textContent = rec.penalty > 0 ? `${rec.penalty.toLocaleString()}원` : '-';
    penaltyTd.className = rec.penalty > 0 ? 'penalty-cell has-penalty' : 'penalty-cell';
    tr.appendChild(penaltyTd);

    attendanceTableBody.appendChild(tr);
  });
}

// 상태 변경
function handleStatusChange(index, newStatus) {
  const rec = attendanceRecords[index];

  if (newStatus === 'excused') {
    const used = excusedUsed[rec.member] || 0;
    // 새로 공결로 바꾸는 경우에만 체크
    if (!rec.isExcused && used >= MAX_EXCUSED_PER_MEMBER) {
      alert(`공결은 1인당 ${MAX_EXCUSED_PER_MEMBER}회까지입니다.`);
      renderAttendanceTable();
      renderPenaltyTable();
      return;
    }

    if (!rec.isExcused) {
      excusedUsed[rec.member] = used + 1;
    }
    rec.isExcused = true;
    rec.status = 'excused';
    rec.lateMinutes = 0;
    rec.penalty = 0;
  } else {
    // 공결 해제 시 횟수 감소
    if (rec.isExcused) {
      const used = excusedUsed[rec.member] || 0;
      excusedUsed[rec.member] = Math.max(0, used - 1);
      rec.isExcused = false;
    }

    rec.status = newStatus;

    if (newStatus !== 'late') {
      rec.lateMinutes = 0;
      rec.penalty = 0;
    } else {
      // 지각 상태이면 현재 지각 시간 기준으로 벌칙금 계산
      rec.penalty = rec.lateMinutes >= 30 ? PENALTY_AMOUNT : 0;
    }
  }

  renderAttendanceTable();
  renderPenaltyTable();
}

// 지각 시간 변경
function handleLateMinutesChange(index, minutes) {
  const rec = attendanceRecords[index];
  rec.lateMinutes = minutes || 0;

  if (rec.status === 'late') {
    // 30분 이상이면 무조건 1만원, 그 미만이면 0원
    rec.penalty = rec.lateMinutes >= 30 ? PENALTY_AMOUNT : 0;
  } else {
    rec.penalty = 0;
  }

  renderAttendanceTable();
  renderPenaltyTable();
}

// 벌칙금 리스트 렌더링
function renderPenaltyTable() {
  penaltyTableBody.innerHTML = '';

  const penaltyRecords = attendanceRecords.filter((rec) => rec.penalty > 0);

  if (penaltyRecords.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = '벌칙금 내역이 없습니다.';
    td.className = 'empty-penalty';
    tr.appendChild(td);
    penaltyTableBody.appendChild(tr);
    return;
  }

  penaltyRecords.forEach((rec, idx) => {
    const tr = document.createElement('tr');

    const idxTd = document.createElement('td');
    idxTd.textContent = idx + 1;
    tr.appendChild(idxTd);

    const dayTd = document.createElement('td');
    dayTd.textContent = rec.sessionLabel;
    tr.appendChild(dayTd);

    const timeTd = document.createElement('td');
    timeTd.textContent = rec.sessionTime;
    tr.appendChild(timeTd);

    const memberTd = document.createElement('td');
    memberTd.textContent = rec.member;
    tr.appendChild(memberTd);

    const reasonTd = document.createElement('td');
    reasonTd.textContent = `지각 ${rec.lateMinutes}분`;
    tr.appendChild(reasonTd);

    const amountTd = document.createElement('td');
    amountTd.textContent = `${rec.penalty.toLocaleString()}원`;
    tr.appendChild(amountTd);

    penaltyTableBody.appendChild(tr);
  });
}

// 초기 실행
initState();
renderAttendanceTable();
renderPenaltyTable();
