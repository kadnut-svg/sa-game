/**
 * server.js
 * Node.js Backend API Server (Express + SQLite)
 * ให้บริการ REST API สำหรับตัวเกมจำแนกประเภทของระบบสารสนเทศ (Vite Frontend + Electron Desktop)
 */

import http from 'node:http';
import { URL } from 'node:url';
import { gameDb, DB_PATH } from './database.js';

const DEFAULT_PORT = Number(process.env.PORT) || 3456;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export async function startBackendServer(port = DEFAULT_PORT) {
  await gameDb.init();

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      return sendJson(res, 200, { ok: true });
    }

    const parsedUrl = new URL(req.url, `http://127.0.0.1:${port}`);
    const pathname = parsedUrl.pathname;

    try {
      // 1. GET /api/health
      if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, {
          status: 'online',
          engine: gameDb.engine,
          databasePath: DB_PATH,
          timestamp: new Date().toISOString()
        });
      }

      // 2. GET /api/game-data (ดึงข้อมูลระบบสารสนเทศ 6 ประเภท, ตัวชี้วัด 2560, และโจทย์ทั้ง 3 ด่านจาก SQLite)
      if (req.method === 'GET' && pathname === '/api/game-data') {
        const data = gameDb.getAllGameData();
        return sendJson(res, 200, data);
      }

      // 3. GET /api/leaderboard (ดึงตารางคะแนนสูงสุดของนักศึกษาชั้นปีที่ 2 จาก SQLite)
      if (req.method === 'GET' && pathname === '/api/leaderboard') {
        const leaderboard = gameDb.getLeaderboard(20);
        return sendJson(res, 200, { leaderboard });
      }

      // 4. POST /api/students/login (ลงชื่อเข้าใช้งานหรืออัปเดตข้อมูลนักศึกษาชั้นปีที่ 2)
      if (req.method === 'POST' && pathname === '/api/students/login') {
        const body = await parseJsonBody(req);
        if (!body.student_id || !body.full_name) {
          return sendJson(res, 400, { error: 'กรุณาระบุรหัสนักศึกษาและชื่อ-นามสกุล' });
        }
        const student = gameDb.upsertStudent(
          String(body.student_id).trim(),
          String(body.full_name).trim(),
          body.faculty || 'ชั้นปีที่ 2 (เทคโนโลยีสารสนเทศ / ครุศาสตร์)'
        );
        return sendJson(res, 200, { student });
      }

      // 5. POST /api/sessions (บันทึกผลการเล่นและคะแนนรายตัวชี้วัดลงฐานข้อมูล SQLite)
      if (req.method === 'POST' && pathname === '/api/sessions') {
        const body = await parseJsonBody(req);
        if (!body.student_id || !body.full_name) {
          return sendJson(res, 400, { error: 'กรุณาระบุข้อมูลนักศึกษาก่อนบันทึกคะแนน' });
        }
        const result = gameDb.saveGameSession(body);
        return sendJson(res, 201, result);
      }

      // 6. POST /api/questions (สำหรับอาจารย์ผู้สอนเพิ่มโจทย์กรณีศึกษาใหม่ลงใน SQLite)
      if (req.method === 'POST' && pathname === '/api/questions') {
        const body = await parseJsonBody(req);
        if (!body.title || !body.scenario_desc || !body.correct_code) {
          return sendJson(res, 400, { error: 'กรุณากรอกข้อมูลโจทย์และเฉลยให้ครบถ้วน' });
        }
        const created = gameDb.addCustomQuestion(body);
        return sendJson(res, 201, {
          message: 'บันทึกโจทย์ใหม่ลงฐานข้อมูล SQLite เรียบร้อยแล้ว',
          questionId: created.id,
          gameData: gameDb.getAllGameData()
        });
      }

      return sendJson(res, 404, { error: `ไม่พบ Endpoint: ${pathname}` });
    } catch (err) {
      console.error('Backend API Error:', err);
      return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Backend] Port ${port} is already in use; assuming server is running.`);
        resolve(null);
      } else {
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`============================================================`);
      console.log(`🚀 IS Architect Quest Backend (Node.js + SQLite)`);
      console.log(`📡 API URL      : http://127.0.0.1:${port}/api`);
      console.log(`🗄️  SQLite DB    : ${DB_PATH}`);
      console.log(`⚙️  SQLite Engine: ${gameDb.engine}`);
      console.log(`============================================================`);
      resolve(server);
    });
  });
}

// หากรันไฟล์นี้โดยตรง (เช่น node backend/server.js)
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startBackendServer(DEFAULT_PORT);
}
