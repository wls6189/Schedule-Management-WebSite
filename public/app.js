// 현재 호스트를 자동으로 감지하여 API URL 설정
const API_URL = `${window.location.origin}/api`;

let currentUser = null;

// DOM 요소
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const currentUserDiv = document.getElementById('currentUser');
const scheduleForm = document.getElementById('scheduleForm');
const schedulesContainer = document.getElementById('schedulesContainer');

// 로그인 처리
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

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            currentUserDiv.textContent = `현재 사용자: ${user.username}`;
            currentUserDiv.classList.add('active');
            usernameInput.disabled = true;
            loginBtn.disabled = true;
            loadSchedules();
        } else {
            let errorMessage = '알 수 없는 오류가 발생했습니다.';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
            }
            alert(`오류: ${errorMessage}`);
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        let errorMsg = '로그인 중 오류가 발생했습니다.';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg = '서버에 연결할 수 없습니다.\n\n잠시 후 다시 시도해주세요.\n(Render 무료 플랜의 경우 첫 접속 시 약 30초~1분 정도 소요될 수 있습니다)';
        } else {
            errorMsg = `오류: ${error.message}`;
        }
        alert(errorMsg);
    }
});

// 스케줄 추가
scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert('먼저 로그인하세요.');
        return;
    }

    const dayOfWeek = document.getElementById('daySelect').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!dayOfWeek || !startTime || !endTime) {
        alert('모든 필드를 입력하세요.');
        return;
    }

    if (startTime >= endTime) {
        alert('종료 시간은 시작 시간보다 늦어야 합니다.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/schedules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: currentUser.id,
                dayOfWeek,
                startTime,
                endTime,
            }),
        });

        if (response.ok) {
            scheduleForm.reset();
            loadSchedules();
        } else {
            const error = await response.json();
            alert(`오류: ${error.error}`);
        }
    } catch (error) {
        console.error('스케줄 추가 오류:', error);
        alert('스케줄 추가 중 오류가 발생했습니다.');
    }
});

// 스케줄 목록 로드
async function loadSchedules() {
    try {
        const response = await fetch(`${API_URL}/schedules`);
        
        if (response.ok) {
            const schedules = await response.json();
            displaySchedules(schedules);
        } else {
            console.error('스케줄 로드 오류:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('스케줄 로드 오류:', error);
        // 서버 연결 오류는 조용히 처리 (서버가 아직 시작되지 않았을 수 있음)
    }
}

// 스케줄 표시
function displaySchedules(schedules) {
    if (schedules.length === 0) {
        schedulesContainer.innerHTML = '<p class="empty-message">스케줄이 없습니다. 위에서 새 스케줄을 추가하세요.</p>';
        return;
    }

    schedulesContainer.innerHTML = schedules.map(schedule => {
        const isCompleted = schedule.attendance_status === 1;
        const timeFormat = formatTime(schedule.start_time) + ' ~ ' + formatTime(schedule.end_time);
        
        return `
            <div class="schedule-card">
                <div class="schedule-info">
                    <h3>
                        <span class="day-badge">${schedule.day_of_week}</span>
                        ${schedule.username}
                    </h3>
                    <p>⏰ ${timeFormat}</p>
                </div>
                <div class="schedule-actions">
                    <label class="attendance-label ${isCompleted ? 'completed' : 'pending'}">
                        <input 
                            type="checkbox" 
                            class="attendance-checkbox" 
                            ${isCompleted ? 'checked' : ''}
                            onchange="updateAttendance(${schedule.id}, this.checked)"
                        >
                        ${isCompleted ? '✅ 출석 완료' : '⏳ 출석 대기'}
                    </label>
                    ${currentUser && currentUser.id === schedule.user_id ? `
                        <button class="delete-btn" onclick="deleteSchedule(${schedule.id})">삭제</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 시간 포맷팅 (HH:mm 형식)
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes || '00'}`;
}

// 출석 상태 업데이트
async function updateAttendance(scheduleId, attendanceStatus) {
    try {
        const response = await fetch(`${API_URL}/schedules/${scheduleId}/attendance`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ attendanceStatus }),
        });

        if (response.ok) {
            loadSchedules();
        } else {
            const error = await response.json();
            alert(`오류: ${error.error}`);
            loadSchedules(); // 상태 복원을 위해 다시 로드
        }
    } catch (error) {
        console.error('출석 상태 업데이트 오류:', error);
        alert('출석 상태 업데이트 중 오류가 발생했습니다.');
        loadSchedules(); // 상태 복원을 위해 다시 로드
    }
}

// 스케줄 삭제
async function deleteSchedule(scheduleId) {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadSchedules();
        } else {
            const error = await response.json();
            alert(`오류: ${error.error}`);
        }
    } catch (error) {
        console.error('스케줄 삭제 오류:', error);
        alert('스케줄 삭제 중 오류가 발생했습니다.');
    }
}

// 페이지 로드 시 스케줄 목록 로드
loadSchedules();

// 주기적으로 스케줄 목록 새로고침 (다른 사용자의 변경사항 반영)
setInterval(loadSchedules, 5000); // 5초마다 새로고침
