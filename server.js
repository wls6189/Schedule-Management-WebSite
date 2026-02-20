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

      // 스케줄 테이블
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
    });
  }
});

// 사용자 생성 또는 조회
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: '사용자 이름이 필요합니다.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (user) {
      return res.json(user);
    }

    // 새 사용자 생성
    db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, username });
    });
  });
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
