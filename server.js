const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 데이터베이스 초기화
const db = new sqlite3.Database('./schedule.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다.');
    
    // 테이블 생성
    db.serialize(() => {
      // 사용자 테이블
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 기존 스케줄 테이블 (현재는 사용하지 않지만 호환을 위해 유지)
      db.run(`CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        attendance_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // 출석 기록 테이블
      db.run(`CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        session_id TEXT NOT NULL,
        session_label TEXT NOT NULL,
        session_time TEXT NOT NULL,
        check_in_time TEXT NOT NULL,
        status TEXT NOT NULL,
        late_minutes INTEGER DEFAULT 0,
        penalty_amount INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date, session_id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
    });
  }
});

// 사용자 생성 또는 조회
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '사용자 이름이 필요합니다.' });
  }

  // 공백 제거한 이름 기준으로 허용된 멤버만 로그인 가능
  const normalizedUsername = String(username).replace(/\s+/g, '');
  const allowedUsers = ['김진', '김재민', '전예준'];
  if (!allowedUsers.includes(normalizedUsername)) {
    return res.status(400).json({ error: '허용된 멤버(김진, 김재민, 전예준)만 로그인할 수 있습니다.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [normalizedUsername], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (user) {
      return res.json(user);
    }

    // 새 사용자 생성
    db.run('INSERT INTO users (username) VALUES (?)', [normalizedUsername], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, username: normalizedUsername });
    });
  });
});

// ===== 출석 기록 관련 API =====

// 오늘 출석 체크 (현재 서버 시간을 기준으로 처리)
app.post('/api/attendance/check-in', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId가 필요합니다.' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const now = new Date();

    // 한국 시간 기준을 위해 9시간 보정 (Render 등 UTC 환경 대비)
    const offsetNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

    const year = offsetNow.getUTCFullYear();
    const month = String(offsetNow.getUTCMonth() + 1).padStart(2, '0');
    const day = String(offsetNow.getUTCDate()).padStart(2, '0');
    const hours = String(offsetNow.getUTCHours()).padStart(2, '0');
    const minutes = String(offsetNow.getUTCMinutes()).padStart(2, '0');

    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
    const checkInTime = `${hours}:${minutes}`; // HH:MM

    // 요일 계산 (0:일 ~ 6:토)
    const dayIndex = offsetNow.getUTCDay();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[dayIndex];

    // 월/수만 허용
    let sessionId = null;
    let sessionLabel = null;
    let sessionTime = '10:30 ~ 17:00';

    if (dayOfWeek === '월') {
      sessionId = 'mon';
      sessionLabel = '월요일';
    } else if (dayOfWeek === '수') {
      sessionId = 'wed';
      sessionLabel = '수요일';
    } else {
      return res.status(400).json({ error: '오늘은 매주 실시간 작업(월/수) 요일이 아닙니다.' });
    }

    // 지각 계산 (10:30 기준, 30분 이상 시 1만원)
    const startHour = 10;
    const startMinute = 30;

    const startDate = new Date(offsetNow);
    startDate.setUTCHours(startHour, startMinute, 0, 0);

    let diffMinutes = Math.floor((offsetNow - startDate) / (60 * 1000));
    if (diffMinutes < 0) diffMinutes = 0;

    let status = 'normal';
    let penaltyAmount = 0;

    if (diffMinutes >= 30) {
      status = 'late';
      penaltyAmount = 10000;
    }

    // 출석 기록 upsert (같은 날짜/세션/사용자는 1개만 유지)
    db.run(
      `INSERT INTO attendance_records 
        (user_id, date, day_of_week, session_id, session_label, session_time, check_in_time, status, late_minutes, penalty_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date, session_id) DO UPDATE SET
         check_in_time = excluded.check_in_time,
         status = excluded.status,
         late_minutes = excluded.late_minutes,
         penalty_amount = excluded.penalty_amount,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        dateStr,
        dayOfWeek,
        sessionId,
        sessionLabel,
        sessionTime,
        checkInTime,
        status,
        diffMinutes,
        penaltyAmount,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          userId,
          username: user.username,
          date: dateStr,
          dayOfWeek,
          sessionId,
          sessionLabel,
          sessionTime,
          checkInTime,
          status,
          lateMinutes: diffMinutes,
          penaltyAmount,
        });
      }
    );
  });
});

// 출석부 조회 (기본 최근 4개월)
app.get('/api/attendance', (req, res) => {
  const months = parseInt(req.query.months || '4', 10);
  const monthsClamp = isNaN(months) ? 4 : Math.max(1, Math.min(months, 12));

  // SQLite에서 현재 날짜 기준 N개월 전부터 조회
  db.all(
    `
    SELECT a.*, u.username
    FROM attendance_records a
    JOIN users u ON u.id = a.user_id
    WHERE date >= date('now', ?)
    ORDER BY date DESC, session_id, user_id
    `,
    [`-${monthsClamp} months`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 스케줄 생성
app.post('/api/schedules', (req, res) => {
  const { userId, dayOfWeek, startTime, endTime } = req.body;

  if (!userId || !dayOfWeek || !startTime || !endTime) {
    return res.status(400).json({ error: '모든 필드가 필요합니다.' });
  }

  db.run(
    'INSERT INTO schedules (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
    [userId, dayOfWeek, startTime, endTime],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        id: this.lastID, 
        userId, 
        dayOfWeek, 
        startTime, 
        endTime,
        attendanceStatus: 0
      });
    }
  );
});

// 모든 스케줄 조회
app.get('/api/schedules', (req, res) => {
  db.all(
    `SELECT s.*, u.username 
     FROM schedules s 
     JOIN users u ON s.user_id = u.id 
     ORDER BY s.day_of_week, s.start_time`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 특정 사용자의 스케줄 조회
app.get('/api/schedules/user/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all(
    'SELECT * FROM schedules WHERE user_id = ? ORDER BY day_of_week, start_time',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 출석 상태 업데이트
app.put('/api/schedules/:id/attendance', (req, res) => {
  const scheduleId = req.params.id;
  const { attendanceStatus } = req.body;

  if (attendanceStatus === undefined) {
    return res.status(400).json({ error: '출석 상태가 필요합니다.' });
  }

  db.run(
    'UPDATE schedules SET attendance_status = ? WHERE id = ?',
    [attendanceStatus ? 1 : 0, scheduleId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: '출석 상태가 업데이트되었습니다.' });
    }
  );
});

// 스케줄 삭제
app.delete('/api/schedules/:id', (req, res) => {
  const scheduleId = req.params.id;

  db.run('DELETE FROM schedules WHERE id = ?', [scheduleId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '스케줄이 삭제되었습니다.' });
  });
});

// 모든 사용자 조회
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY username', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

const HOST = '0.0.0.0'; // 모든 네트워크 인터페이스에서 접근 가능하도록 설정

app.listen(PORT, HOST, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log(`네트워크 접근: http://[이 컴퓨터의 IP 주소]:${PORT}`);
  console.log('\n다른 사용자가 접근하려면:');
  console.log('1. 이 컴퓨터의 IP 주소를 확인하세요 (ipconfig 명령어 사용)');
  console.log('2. 같은 네트워크(Wi-Fi/이더넷)에 연결되어 있어야 합니다');
  console.log('3. 방화벽에서 포트 3000을 허용해야 할 수 있습니다');
});
