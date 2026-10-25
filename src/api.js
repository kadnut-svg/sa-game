/**
 * src/api.js
 * โมดูลเชื่อมต่อแบบ Hybrid รองรับทั้ง:
 * 1. WebApp Mode (Vercel Frontend + Supabase Backend & PostgreSQL Database)
 * 2. Desktop Mode (Electron + Local Node.js + SQLite Database)
 * 3. Offline / Demo Fallback Mode
 */

import {
  SEED_IS_TYPES,
  SEED_CURRICULUM_INDICATORS,
  SEED_QUESTIONS
} from './seedData.js';

const LOCAL_API_BASE = 'http://127.0.0.1:3456/api';
const DEFAULT_SUPABASE_URL = 'https://cyoyufbuzwxexapqzcwk.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_oh1WCpnaX1xzDrtcURcfSw_RRcCcXeF';

export function getSupabaseConfig() {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '')
    : '';
  const envKey = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '')
    : '';
  const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('IS_GAME_SUPABASE_URL') : '';
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('IS_GAME_SUPABASE_KEY') : '';

  const url = (storedUrl || envUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
  const key = (storedKey || envKey || DEFAULT_SUPABASE_KEY).trim();
  return { url, key, isConfigured: Boolean(url && key && url.startsWith('http')) };
}

export function setSupabaseConfig(url, key) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('IS_GAME_SUPABASE_URL', (url || '').trim().replace(/\/+$/, ''));
  localStorage.setItem('IS_GAME_SUPABASE_KEY', (key || '').trim());
}

function supabaseHeaders(key, extra = {}) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

export async function fetchGameData() {
  // 1. ตรวจสอบการเชื่อมต่อกับ Supabase Cloud ก่อน (สำหรับ WebApp บน Vercel)
  const sb = getSupabaseConfig();
  if (sb.isConfigured) {
    try {
      const [typesRes, indRes, qRes] = await Promise.all([
        fetch(`${sb.url}/rest/v1/is_types?select=*`, { headers: supabaseHeaders(sb.key) }),
        fetch(`${sb.url}/rest/v1/curriculum_indicators?select=*`, { headers: supabaseHeaders(sb.key) }),
        fetch(`${sb.url}/rest/v1/questions?select=*&order=id.asc`, { headers: supabaseHeaders(sb.key) })
      ]);

      if (typesRes.ok) {
        const rawTypes = await typesRes.json();
        const indicators = indRes.ok ? await indRes.json() : [];
        const questions = qRes.ok ? await qRes.json() : [];

        return {
          online: true,
          mode: 'supabase',
          engine: 'Supabase PostgreSQL Cloud',
          dbPath: sb.url,
          isTypes: rawTypes.length > 0 ? rawTypes.map(r => ({
            ...r,
            keywords: Array.isArray(r.keywords) ? r.keywords : JSON.parse(r.keywords || '[]')
          })) : SEED_IS_TYPES.map(t => ({ ...t, keywords: JSON.parse(t.keywords) })),
          indicators: indicators.length > 0 ? indicators : SEED_CURRICULUM_INDICATORS,
          questions: questions.length > 0 ? questions : SEED_QUESTIONS
        };
      }
    } catch (err) {
      console.warn('[Supabase] Fallback notice:', err.message);
    }
  }

  // 2. ตรวจสอบการเชื่อมต่อกับ Local Node.js + SQLite Backend (สำหรับ Desktop App / Electron)
  try {
    const res = await fetch(`${LOCAL_API_BASE}/game-data`);
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        mode: 'sqlite',
        ...data
      };
    }
  } catch (_) {}

  // 3. โหมดสำรอง (Standalone / Demo Mode)
  return {
    online: false,
    mode: 'offline',
    engine: 'Browser LocalStorage (พร้อมเชื่อมต่อ Supabase / SQLite)',
    dbPath: 'Local Browser Storage',
    isTypes: SEED_IS_TYPES.map(t => ({ ...t, keywords: JSON.parse(t.keywords) })),
    indicators: SEED_CURRICULUM_INDICATORS,
    questions: SEED_QUESTIONS
  };
}

export async function fetchLeaderboard() {
  const sb = getSupabaseConfig();
  if (sb.isConfigured) {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/game_sessions?select=*&order=total_score.desc,accuracy_pct.desc&limit=20`,
        { headers: supabaseHeaders(sb.key) }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
  }

  try {
    const res = await fetch(`${LOCAL_API_BASE}/leaderboard`);
    if (res.ok) {
      const data = await res.json();
      return data.leaderboard || [];
    }
  } catch (_) {}

  // ดึงจาก LocalStorage กรณียังไม่ได้ต่อฐานข้อมูล
  const localLb = localStorage.getItem('IS_GAME_LOCAL_LEADERBOARD');
  if (localLb) {
    try { return JSON.parse(localLb); } catch (_) {}
  }
  return [
    { student_id: '67010201', full_name: 'น.ส.กมลชนก รัตนโชติ (ปี 2)', total_score: 3450, accuracy_pct: 95, rank_title: '🏆 Chief Information Officer (CIO)' },
    { student_id: '67010214', full_name: 'นายธนภัทร ศรีสุวรรณ (ปี 2)', total_score: 2680, accuracy_pct: 88, rank_title: '⭐ Senior IT Consultant' },
    { student_id: '67010239', full_name: 'น.ส.พิมพ์ชนก วงศ์สวัสดิ์ (ปี 2)', total_score: 1950, accuracy_pct: 82, rank_title: '⭐ Senior IT Consultant' }
  ];
}

export async function loginStudentApi(student_id, full_name, faculty = 'ชั้นปีที่ 2') {
  const sb = getSupabaseConfig();
  if (sb.isConfigured) {
    const res = await fetch(`${sb.url}/rest/v1/students`, {
      method: 'POST',
      headers: supabaseHeaders(sb.key, { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify({ student_id, full_name, year_level: 2, faculty })
    });
    if (!res.ok) throw new Error('ไม่สามารถบันทึกข้อมูลนักศึกษาลง Supabase ได้');
    const rows = await res.json();
    return { student: rows[0], source: 'Supabase' };
  }

  const res = await fetch(`${LOCAL_API_BASE}/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, full_name, faculty })
  });
  if (!res.ok) throw new Error('ไม่สามารถบันทึกข้อมูลนักศึกษาได้');
  return res.json();
}

export async function saveSessionApi(sessionData) {
  const sb = getSupabaseConfig();
  if (sb.isConfigured) {
    await loginStudentApi(sessionData.student_id, sessionData.full_name).catch(() => {});
    const res = await fetch(`${sb.url}/rest/v1/game_sessions`, {
      method: 'POST',
      headers: supabaseHeaders(sb.key, { 'Prefer': 'return=representation' }),
      body: JSON.stringify({
        student_id: sessionData.student_id,
        full_name: sessionData.full_name,
        total_score: Number(sessionData.total_score) || 0,
        accuracy_pct: Number(sessionData.accuracy_pct) || 0,
        rank_title: sessionData.rank_title || 'Junior IS Learner',
        stage1_done: Number(sessionData.stage1_done) || 0,
        stage2_done: Number(sessionData.stage2_done) || 0,
        stage3_done: Number(sessionData.stage3_done) || 0,
        type_stats_json: sessionData.type_stats || {}
      })
    });
    if (!res.ok) throw new Error('ไม่สามารถบันทึกคะแนนลง Supabase ได้ (ตรวจสอบ RLS Policy หรือ Anon Key)');
    const inserted = await res.json();
    const leaderboard = await fetchLeaderboard();
    return {
      sessionId: inserted[0]?.id || 'Supabase',
      leaderboard
    };
  }

  try {
    const res = await fetch(`${LOCAL_API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    if (res.ok) return await res.json();
  } catch (_) {}

  // บันทึกลง LocalStorage กรณีเล่นแบบไม่ต้องต่อเซิร์ฟเวอร์
  const currentLb = await fetchLeaderboard();
  currentLb.push({
    student_id: sessionData.student_id,
    full_name: sessionData.full_name,
    total_score: Number(sessionData.total_score) || 0,
    accuracy_pct: Number(sessionData.accuracy_pct) || 0,
    rank_title: sessionData.rank_title || 'Junior IS Learner'
  });
  currentLb.sort((a, b) => b.total_score - a.total_score);
  localStorage.setItem('IS_GAME_LOCAL_LEADERBOARD', JSON.stringify(currentLb));
  return {
    sessionId: 'Local-' + Date.now(),
    leaderboard: currentLb
  };
}

export async function createQuestionApi(questionData) {
  const sb = getSupabaseConfig();
  if (sb.isConfigured) {
    const res = await fetch(`${sb.url}/rest/v1/questions`, {
      method: 'POST',
      headers: supabaseHeaders(sb.key, { 'Prefer': 'return=representation' }),
      body: JSON.stringify({
        stage: questionData.stage || 'case_study',
        org_name: questionData.org_name,
        indicator_code: questionData.indicator_code || 'ว 4.2 (ม.4-6)',
        title: questionData.title,
        scenario_desc: questionData.scenario_desc,
        user_role: questionData.user_role || 'ผู้ใช้งานในองค์กร',
        process_type: questionData.process_type || 'การประมวลผลสารสนเทศ',
        output_type: questionData.output_type || 'รายงานและผลลัพธ์',
        hint_text: questionData.hint_text || 'วิเคราะห์จากระดับผู้ใช้งานและผลลัพธ์',
        correct_code: questionData.correct_code,
        explanation: questionData.explanation
      })
    });
    if (!res.ok) throw new Error('ไม่สามารถเพิ่มโจทย์ลง Supabase ได้');
    const created = await res.json();
    const gameData = await fetchGameData();
    return {
      questionId: created[0]?.id,
      gameData
    };
  }

  const res = await fetch(`${LOCAL_API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData)
  });
  if (!res.ok) throw new Error('ไม่สามารถเพิ่มโจทย์ลง SQLite ได้');
  return res.json();
}
