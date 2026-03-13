const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'survey2024';

// ── DB 연결 ──────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('\n❌ 오류: DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('⚠️ DB 오류:', err.message);
});

// ── 테이블 생성 ──────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS survey_tokens (
      id         TEXT PRIMARY KEY,
      teacher_name TEXT NOT NULL,
      school     TEXT NOT NULL,
      grade      TEXT NOT NULL,
      sent_to    TEXT NOT NULL,
      sent_via   TEXT NOT NULL,
      completed  BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS child_responses (
      id          SERIAL PRIMARY KEY,
      token_id    TEXT REFERENCES survey_tokens(id),
      child_index INT NOT NULL,
      child_name  TEXT,
      gender      TEXT NOT NULL,
      age         TEXT NOT NULL,
      answers     JSONB NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('DB 테이블 준비 완료');
}

// ── 미들웨어 ─────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── 설문 페이지 라우트 ───────────────────────────────────────────
app.get('/survey/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── 설문 토큰 정보 조회 ──────────────────────────────────────────
app.get('/api/survey-info/:token', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM survey_tokens WHERE id=$1', [req.params.token]);
    if (!r.rows.length) return res.status(404).json({ error: '유효하지 않은 설문 링크입니다.' });
    const s = r.rows[0];
    res.json({
      teacherName: s.teacher_name,
      school: s.school,
      grade: s.grade,
      completed: s.completed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 설문 제출 ────────────────────────────────────────────────────
app.post('/api/submit', async (req, res) => {
  const { token, responses } = req.body;
  if (!token || !responses) return res.status(400).json({ error: '잘못된 요청입니다.' });

  try {
    const check = await pool.query('SELECT * FROM survey_tokens WHERE id=$1', [token]);
    if (!check.rows.length) return res.status(404).json({ error: '유효하지 않은 토큰입니다.' });
    if (check.rows[0].completed) return res.status(400).json({ error: '이미 제출된 설문입니다.' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of responses) {
        await client.query(
          `INSERT INTO child_responses (token_id, child_index, child_name, gender, age, answers)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [token, r.childIndex, r.childName, r.gender, r.age, JSON.stringify(r.answers)]
        );
      }
      await client.query(
        'UPDATE survey_tokens SET completed=TRUE, completed_at=NOW() WHERE id=$1',
        [token]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── 관리자 로그인 ────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) res.json({ success: true });
  else res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
});

// ── 설문 발송 (토큰 생성 + 이메일) ──────────────────────────────
app.post('/api/admin/send', async (req, res) => {
  const { password, teacherName, school, grade, sentTo, sentVia } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  if (!teacherName || !school || !grade || !sentTo || !sentVia)
    return res.status(400).json({ error: '모든 항목을 입력해 주세요.' });

  const token = uuidv4();
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  const surveyUrl = `${baseUrl}/survey/${token}`;

  try {
    await pool.query(
      `INSERT INTO survey_tokens (id, teacher_name, school, grade, sent_to, sent_via) VALUES ($1,$2,$3,$4,$5,$6)`,
      [token, teacherName, school, grade, sentTo, sentVia]
    );

    if (sentVia === 'email') {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      const html = `
        <div style="font-family:'맑은 고딕',sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#1d4ed8;color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0;font-size:20px">유아 디지털 역량 설문조사</h1>
          </div>
          <div style="background:#f8fafc;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
            <p><strong>${teacherName}</strong> 선생님, 안녕하세요!</p>
            <p style="line-height:1.8;color:#374151;margin-top:12px">
              ${school} ${grade} 학급의 유아 디지털 역량 설문조사에 참여해 주셔서 감사합니다.<br>
              아래 버튼을 클릭하시어 학급 내 유아 4명(남아 2명, 여아 2명)에 대한 설문을 작성해 주십시오.
            </p>
            <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px;margin:20px 0;font-size:13px;color:#92400e">
              ※ 학급 출석부의 앞, 중간, 뒷 부분에서 남아 2명, 여아 2명을 무작위로 선정해 주십시오.<br>
              ※ 담임교사가 2명 이상일 경우 대상 유아가 중복되지 않도록 유의해 주십시오.
            </div>
            <div style="text-align:center;margin:28px 0">
              <a href="${surveyUrl}" style="background:#1d4ed8;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block">
                설문 작성하기
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:14px">
              이 링크는 본 설문에만 사용되며 개인정보는 수집되지 않습니다.
            </p>
          </div>
        </div>`;
      await transporter.sendMail({
        from: `"유아 디지털 역량 연구" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: sentTo,
        subject: `[설문요청] ${school} ${grade} 유아 디지털 역량 설문조사`,
        html
      });
    }

    res.json({ success: true, surveyUrl, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── 토큰 목록 ────────────────────────────────────────────────────
app.get('/api/admin/tokens', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const r = await pool.query(
    'SELECT id, teacher_name, school, grade, sent_to, sent_via, completed, created_at, completed_at FROM survey_tokens ORDER BY created_at DESC'
  );
  res.json(r.rows);
});

// ── 결과 상세 ────────────────────────────────────────────────────
app.get('/api/admin/results/:id', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  const token = await pool.query('SELECT * FROM survey_tokens WHERE id=$1', [req.params.id]);
  if (!token.rows.length) return res.status(404).json({ error: 'Not found' });
  const responses = await pool.query(
    'SELECT * FROM child_responses WHERE token_id=$1 ORDER BY child_index',
    [req.params.id]
  );
  res.json({ token: token.rows[0], responses: responses.rows });
});

// ── 토큰 삭제 ────────────────────────────────────────────────────
app.delete('/api/admin/tokens/:id', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  await pool.query('DELETE FROM child_responses WHERE token_id=$1', [req.params.id]);
  await pool.query('DELETE FROM survey_tokens WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── 통계 ─────────────────────────────────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const total = parseInt((await pool.query('SELECT COUNT(*) FROM survey_tokens')).rows[0].count);
  const completed = parseInt((await pool.query('SELECT COUNT(*) FROM survey_tokens WHERE completed=TRUE')).rows[0].count);

  const trend = (await pool.query(`
    SELECT TO_CHAR(created_at,'YYYY-MM-DD') as date, COUNT(*) as count
    FROM survey_tokens GROUP BY date ORDER BY date DESC LIMIT 30
  `)).rows.map(x => ({ date: x.date, count: parseInt(x.count) })).reverse();

  const bySchool = (await pool.query(`
    SELECT school, COUNT(*) as count FROM survey_tokens GROUP BY school ORDER BY count DESC LIMIT 10
  `)).rows.map(x => ({ school: x.school, count: parseInt(x.count) }));

  res.json({ total, completed, pending: total - completed, trend, bySchool });
});

// ── CSV 내보내기 ──────────────────────────────────────────────────
app.get('/api/admin/export', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const tokens = (await pool.query('SELECT * FROM survey_tokens WHERE completed=TRUE ORDER BY completed_at DESC')).rows;
  const responses = (await pool.query('SELECT * FROM child_responses ORDER BY token_id, child_index')).rows;

  const CHILD_LABELS = ['남아1', '남아2', '여아1', '여아2'];
  const rows = [];
  const header = ['토큰ID', '선생님', '학교', '학급', '완료일시', '유아구분', '이름', '성별', '연령',
    ...Array.from({length:26}, (_,i) => `Q${i+1}`)];
  rows.push(header.join(','));

  for (const t of tokens) {
    const childRows = responses.filter(r => r.token_id === t.id);
    for (const cr of childRows) {
      const ans = typeof cr.answers === 'string' ? JSON.parse(cr.answers) : cr.answers;
      const qvals = Array.from({length:26}, (_,i) => ans[String(i)] || '');
      const row = [
        t.id.slice(0,8), t.teacher_name, t.school, t.grade,
        t.completed_at ? t.completed_at.toISOString().slice(0,16) : '',
        CHILD_LABELS[cr.child_index] || cr.child_index,
        cr.child_name || '', cr.gender, cr.age,
        ...qvals
      ].map(v => {
        const s = String(v);
        return (s.includes(',') || s.includes('"')) ? `"${s.replace(/"/g,'""')}"` : s;
      });
      rows.push(row.join(','));
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="survey2_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('\uFEFF' + rows.join('\n'));
});

// ── 헬스체크 ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── 서버 시작 ────────────────────────────────────────────────────
async function start() {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('✅ DB 연결 성공');
      client.release();
      await initDB();
      break;
    } catch (err) {
      retries--;
      console.error(`❌ DB 연결 실패 (남은 재시도: ${retries}) - ${err.message}`);
      if (retries === 0) { console.error('서버를 종료합니다.'); process.exit(1); }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => {
    console.log('\n====================================');
    console.log('  유아 디지털 역량 설문 시스템');
    console.log('====================================');
    console.log(`  포트: ${PORT}`);
    console.log(`  관리자: /admin.html`);
    console.log('====================================\n');
  });
}

start();
