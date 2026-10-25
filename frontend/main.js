/**
 * src/main.js
 * ลอจิกหลักของฝั่ง Frontend (Vite) เชื่อมต่อกับ Node.js + SQLite Backend และ Electron Desktop
 * รองรับทั้งโหมด 2D Vector SVG Arcade, พีระมิดองค์กร, กรณีศึกษา 10 ข้อ, Speed Matrix และ SQLite Leaderboard
 */

import {
  fetchGameData,
  fetchLeaderboard,
  loginStudentApi,
  saveSessionApi,
  createQuestionApi
} from './api.js';
import {
  SEED_IS_TYPES,
  SEED_CURRICULUM_INDICATORS,
  SEED_QUESTIONS
} from './seedData.js';

// เสียงเอฟเฟกต์เกมด้วย Web Audio API
let soundEnabled = true;
let audioCtx = null;

function playTone(freq, type = 'sine', duration = 0.14) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.11, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function sfxHit() {
  playTone(540, 'triangle', 0.08);
  setTimeout(() => playTone(810, 'sine', 0.15), 60);
}

function sfxMiss() {
  playTone(175, 'sawtooth', 0.22);
}

const ARCADE_PACKETS = [
  { title: 'สแกนบาร์โค้ดขายสินค้าหน้าร้าน POS 1,250 บาท', hint: 'ธุรกรรมรายวัน Real-time', code: 'TPS', ind: 'ว 4.1' },
  { title: 'ฝาก-ถอนเงินสดผ่านตู้ ATM ธนาคารและตัดยอดบัญชีทันที', hint: 'รายการธุรกรรมประจำวัน', code: 'TPS', ind: 'ว 4.1' },
  { title: 'สแกนพาสปอร์ตเช็กอินที่นั่งสายการบินและพิมพ์ Boarding Pass', hint: 'ประมวลผลรายการรายวัน', code: 'TPS', ind: 'ว 4.1' },
  { title: 'ส่งหนังสือราชการเวียนออนไลน์และลงนามดิจิทัล (e-Office)', hint: 'งานเอกสารสำนักงาน', code: 'OAS', ind: 'ว 4.1' },
  { title: 'จัดตารางนัดหมายประชุมออนไลน์และจองห้องประชุมอัตโนมัติ', hint: 'การสื่อสารในสำนักงาน', code: 'OAS', ind: 'ว 4.1' },
  { title: 'รายงานสรุปยอดขายประจำเดือนเทียบกับเป้าหมายให้ผู้จัดการสาขา', hint: 'รายงานตามรอบเวลา (Scheduled Report)', code: 'MIS', ind: 'ว 4.2' },
  { title: 'รายงานแจ้งเตือนโครงการก่อสร้างที่ใช้งบเกินแผน 5% (Exception Report)', hint: 'รายงานควบคุมงบประมาณ', code: 'MIS', ind: 'ว 4.2' },
  { title: 'ทดลองปรับตัวแปรราคาน้ำมัน (What-if Analysis) เพื่อหาเส้นทางขนส่งที่คุ้มที่สุด', hint: 'จำลองสถานการณ์ What-if', code: 'DSS', ind: 'ว 4.2' },
  { title: 'จำลองผลกระทบพอร์ตการลงทุนหากธนาคารกลางขึ้นดอกเบี้ย 0.50%', hint: 'โมเดลวิเคราะห์ทางเลือก', code: 'DSS', ind: 'ว 4.2' },
  { title: 'หน้าจอ Executive Dashboard แสดง KPI ยุทธศาสตร์ 5 ปีของอธิการบดี', hint: 'ระดับกลยุทธ์ & Drill-down', code: 'EIS', ind: 'ว 4.1' },
  { title: 'กระดานเปรียบเทียบส่วนแบ่งตลาดกับคู่แข่งภายนอกสำหรับ CEO', hint: 'ผู้บริหารระดับสูง', code: 'EIS', ind: 'ว 4.2' },
  { title: 'ระบบวินิจฉัยโรคข้าวจากอาการใบเหลืองด้วย Knowledge Base & Inference Engine', hint: 'เลียนแบบผู้เชี่ยวชาญเฉพาะทาง', code: 'ES', ind: 'ว 4.2' },
  { title: 'ระบบ AI วิเคราะห์สาเหตุเครื่องจักรโรงงานขัดข้องจากฐานความรู้วิศวกรอาวุโส', hint: 'ระบบผู้เชี่ยวชาญ', code: 'ES', ind: 'ว 4.2' }
];

const state = {
  online: false,
  engine: 'SQLite3',
  dbPath: 'data/is_game.sqlite',
  isTypes: [],
  indicators: [],
  pyramidQuestions: [],
  caseQuestions: [],
  matrixQuestions: [],
  leaderboard: [],

  studentId: '67010299',
  studentName: 'นักศึกษาชั้นปีที่ 2 (ทดสอบระบบ)',

  score: 0,
  streak: 0,
  attempts: 0,
  correctCount: 0,

  // 2D Arcade State
  arcRunning: false,
  arcHp: 3,
  arcCleared: 0,
  arcTarget: 15,
  arcPacket: null,
  arcAnimId: null,

  // ด่านพีระมิดองค์กร
  selectedPyramidIdx: null,
  matchedPyramid: {},

  // ด่านกรณีศึกษา
  caseIdx: 0,
  caseAnswers: {},

  // ด่าน Speed Matrix
  matrixIdx: 0,
  matrixAnswers: {}
};

async function initApp() {
  const desktopBadge = document.getElementById('desktop-status-badge');
  if (window.electronAPI && window.electronAPI.isDesktopApp) {
    const info = await window.electronAPI.getDesktopInfo();
    desktopBadge.textContent = `🖥️ Electron Desktop (${info.platform})`;
    desktopBadge.className = 'badge emerald';
  } else {
    desktopBadge.textContent = '🌐 Vite Web Mode';
  }

  const data = await fetchGameData();
  state.online = data.online;
  state.engine = data.engine;
  state.dbPath = data.dbPath;

  state.isTypes = data.isTypes && data.isTypes.length > 0 ? data.isTypes : SEED_IS_TYPES.map(t => ({
    ...t,
    keywords: JSON.parse(t.keywords)
  }));

  state.indicators = data.indicators && data.indicators.length > 0
    ? data.indicators
    : SEED_CURRICULUM_INDICATORS;

  const allQuestions = data.questions && data.questions.length > 0
    ? data.questions
    : SEED_QUESTIONS;

  state.pyramidQuestions = allQuestions.filter(q => q.stage === 'pyramid');
  state.caseQuestions = allQuestions.filter(q => q.stage === 'case_study');
  state.matrixQuestions = allQuestions.filter(q => q.stage === 'speed_matrix');

  const dbBadge = document.getElementById('db-status-badge');
  if (state.online) {
    dbBadge.textContent = `🗄️ SQLite Connected (${state.engine})`;
    dbBadge.className = 'badge emerald';
    state.leaderboard = await fetchLeaderboard();
  } else {
    dbBadge.textContent = '⚠️ Offline Seed Mode';
    dbBadge.className = 'badge amber';
  }

  bindEvents();
  renderHub();
  renderStage1();
  renderStage2();
  renderStage3();
  renderReport();
  updateHeaderStats();
}

function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Arcade Controls
  document.getElementById('btn-arc-sound').addEventListener('click', e => {
    soundEnabled = !soundEnabled;
    e.currentTarget.textContent = soundEnabled ? '🔊 เสียง: เปิด' : '🔇 เสียง: ปิด';
  });

  document.getElementById('btn-arc-start').addEventListener('click', startArcadeMode);
  document.getElementById('btn-arc-overlay-start').addEventListener('click', startArcadeMode);

  document.querySelectorAll('.arc-fire-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      fireArcadeLaser(btn.getAttribute('data-fire'));
    });
  });

  window.addEventListener('keydown', e => {
    if (!state.arcRunning) return;
    const keyMap = { '1': 'TPS', '2': 'OAS', '3': 'MIS', '4': 'DSS', '5': 'EIS', '6': 'ES' };
    if (keyMap[e.key]) fireArcadeLaser(keyMap[e.key]);
  });

  document.getElementById('btn-login-student').addEventListener('click', async () => {
    const id = document.getElementById('inp-student-id').value.trim();
    const name = document.getElementById('inp-student-name').value.trim();
    if (!id || !name) return;
    state.studentId = id;
    state.studentName = name;
    const msgEl = document.getElementById('student-login-msg');
    try {
      if (state.online) {
        await loginStudentApi(id, name);
        msgEl.textContent = `✅ บันทึกข้อมูลนักศึกษา ${id} (${name}) ลง SQLite เรียบร้อยแล้ว`;
      } else {
        msgEl.textContent = `✅ ตั้งค่าผู้เล่น ${id} (${name}) เรียบร้อยแล้ว`;
      }
    } catch (err) {
      msgEl.textContent = `⚠️ ${err.message}`;
    }
  });

  document.getElementById('btn-reset-stage1').addEventListener('click', () => {
    state.selectedPyramidIdx = null;
    state.matchedPyramid = {};
    document.getElementById('stage1-feedback').classList.add('hidden');
    renderStage1();
    updateHeaderStats();
  });

  document.getElementById('btn-case-hint').addEventListener('click', () => {
    const q = state.caseQuestions[state.caseIdx];
    if (!q || state.caseAnswers[state.caseIdx]) return;
    const hintBox = document.getElementById('case-hint-display');
    if (hintBox.classList.contains('hidden')) {
      state.score = Math.max(0, state.score - 20);
      hintBox.textContent = `💡 คำใบ้: ${q.hint_text}`;
      hintBox.classList.remove('hidden');
      updateHeaderStats();
    }
  });

  document.getElementById('btn-next-case').addEventListener('click', () => {
    if (state.caseIdx < state.caseQuestions.length - 1) {
      state.caseIdx += 1;
      renderStage2();
    } else {
      switchTab('stage3');
    }
  });

  document.getElementById('btn-next-matrix').addEventListener('click', () => {
    if (state.matrixIdx < state.matrixQuestions.length - 1) {
      state.matrixIdx += 1;
      renderStage3();
    } else {
      switchTab('report');
    }
  });

  document.getElementById('btn-save-sqlite').addEventListener('click', async () => {
    const msgBox = document.getElementById('save-session-msg');
    const s1 = Object.keys(state.matchedPyramid).length;
    const s2 = Object.keys(state.caseAnswers).length;
    const s3 = Object.keys(state.matrixAnswers).length;
    const acc = state.attempts > 0 ? Math.round((state.correctCount / state.attempts) * 100) : 0;

    try {
      const res = await saveSessionApi({
        student_id: document.getElementById('inp-student-id').value.trim() || state.studentId,
        full_name: document.getElementById('inp-student-name').value.trim() || state.studentName,
        total_score: state.score,
        accuracy_pct: acc,
        rank_title: computeRankTitle(s1 + s2 + s3 + state.arcCleared, acc),
        stage1_done: s1,
        stage2_done: s2,
        stage3_done: s3,
        type_stats: {}
      });
      state.leaderboard = res.leaderboard || [];
      msgBox.textContent = `✅ บันทึกผลการเล่นลงฐานข้อมูล SQLite สำเร็จ! (Session ID: #${res.sessionId})`;
      msgBox.classList.remove('hidden');
      renderReport();
    } catch (err) {
      msgBox.textContent = `⚠️ ไม่สามารถบันทึกไปยัง SQLite Server ได้ (${err.message})`;
      msgBox.classList.remove('hidden');
    }
  });

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    state.score = 0;
    state.streak = 0;
    state.attempts = 0;
    state.correctCount = 0;
    state.arcCleared = 0;
    state.selectedPyramidIdx = null;
    state.matchedPyramid = {};
    state.caseIdx = 0;
    state.caseAnswers = {};
    state.matrixIdx = 0;
    state.matrixAnswers = {};
    document.getElementById('save-session-msg').classList.add('hidden');
    renderStage1();
    renderStage2();
    renderStage3();
    renderReport();
    updateHeaderStats();
    switchTab('arcade');
  });

  document.getElementById('btn-add-question').addEventListener('click', async () => {
    const org_name = document.getElementById('new-q-org').value.trim();
    const title = document.getElementById('new-q-title').value.trim();
    const correct_code = document.getElementById('new-q-code').value;
    const scenario_desc = document.getElementById('new-q-desc').value.trim();
    const explanation = document.getElementById('new-q-exp').value.trim() || `ระบบนี้คือ ${correct_code}`;

    if (!org_name || !title || !scenario_desc) {
      alert('กรุณากรอกชื่อองค์กร หัวข้อ และรายละเอียดสถานการณ์ให้ครบถ้วน');
      return;
    }

    try {
      const res = await createQuestionApi({
        stage: 'case_study',
        org_name,
        indicator_code: 'ว 4.2 (ม.4-6)',
        title,
        scenario_desc,
        correct_code,
        explanation
      });
      state.caseQuestions = res.gameData.questions.filter(q => q.stage === 'case_study');
      alert(`บันทึกโจทย์ใหม่ลงฐานข้อมูล SQLite สำเร็จ! (ขณะนี้มีกรณีศึกษาทั้งหมด ${state.caseQuestions.length} ข้อ)`);
      document.getElementById('new-q-org').value = '';
      document.getElementById('new-q-title').value = '';
      document.getElementById('new-q-desc').value = '';
      document.getElementById('new-q-exp').value = '';
      renderStage2();
    } catch (err) {
      alert(err.message);
    }
  });
}

// ==================== 2D ARCADE ENGINE ====================
function startArcadeMode() {
  if (state.arcAnimId) cancelAnimationFrame(state.arcAnimId);
  state.arcHp = 3;
  state.arcCleared = 0;
  state.arcRunning = true;
  document.getElementById('arc-overlay').classList.add('hidden');
  spawnArcadePacket();
  updateArcadeHud();
  arcadeLoop();
}

function updateArcadeHud() {
  document.getElementById('arc-hearts').textContent = '❤️'.repeat(Math.max(0, state.arcHp)) + '🖤'.repeat(Math.max(0, 3 - state.arcHp));
  document.getElementById('arc-cleared').textContent = `${state.arcCleared} / ${state.arcTarget} แพ็กเกจ`;
  updateHeaderStats();
}

function spawnArcadePacket() {
  const item = ARCADE_PACKETS[Math.floor(Math.random() * ARCADE_PACKETS.length)];
  state.arcPacket = { data: item, y: 14 };
  document.getElementById('arc-ind').textContent = `ตัวชี้วัด ${item.ind} (หลักสูตรแกนกลาง 2560)`;
  renderArcadePacket();
}

function renderArcadePacket() {
  const box = document.getElementById('arc-packet-box');
  if (!state.arcPacket) {
    box.innerHTML = '';
    return;
  }
  const p = state.arcPacket;
  box.innerHTML = `
    <div style="position: absolute; left: 50%; transform: translate(-50%, ${p.y}px); width: 88%; max-width: 560px; background: #1e1b4b; border: 2px solid #818cf8; border-radius: 14px; padding: 12px 16px; text-align: center; box-shadow: 0 12px 24px rgba(0,0,0,0.5);">
      <div style="font-size: 11px; color: #6ee7b7; font-weight: 700;">📦 DATA PACKET • ตัวชี้วัด ${p.data.ind}</div>
      <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 4px;">${p.data.title}</div>
    </div>
  `;
}

function arcadeLoop() {
  if (!state.arcRunning) return;
  if (state.arcPacket) {
    state.arcPacket.y += 0.65 + Math.floor(state.arcCleared / 4) * 0.15;
    renderArcadePacket();

    if (state.arcPacket.y > 210) {
      sfxMiss();
      state.arcHp -= 1;
      state.streak = 0;
      state.attempts += 1;
      const toast = document.getElementById('arc-toast');
      toast.className = 'feedback-banner err';
      toast.textContent = `💥 แพ็กเกจหลุดแนวป้องกัน! เฉลยคือ [${state.arcPacket.data.code}] (${state.arcPacket.data.hint})`;
      updateArcadeHud();

      if (state.arcHp <= 0) {
        stopArcadeMode(false);
        return;
      } else {
        spawnArcadePacket();
      }
    }
  }
  state.arcAnimId = requestAnimationFrame(arcadeLoop);
}

function fireArcadeLaser(chosenCode) {
  if (!state.arcRunning || !state.arcPacket) return;
  const pkt = state.arcPacket.data;
  const laserSvg = document.getElementById('arc-laser-svg');
  const hitY = state.arcPacket.y + 35;
  state.attempts += 1;

  if (chosenCode === pkt.code) {
    sfxHit();
    laserSvg.innerHTML = `<line x1="450" y1="260" x2="450" y2="${hitY}" stroke="#34d399" stroke-width="6"/><circle cx="450" cy="${hitY}" r="20" fill="#34d399" opacity="0.5"/>`;
    setTimeout(() => { laserSvg.innerHTML = ''; }, 160);

    state.streak += 1;
    state.correctCount += 1;
    state.arcCleared += 1;
    const pts = 150 + state.streak * 20;
    state.score += pts;

    const toast = document.getElementById('arc-toast');
    toast.className = 'feedback-banner ok';
    toast.textContent = `🎯 ยิงเข้าเป้า! [${pkt.code}] +${pts} คะแนน — ${pkt.hint}`;
    updateArcadeHud();

    if (state.arcCleared >= state.arcTarget) {
      stopArcadeMode(true);
    } else {
      spawnArcadePacket();
    }
  } else {
    sfxMiss();
    laserSvg.innerHTML = `<line x1="450" y1="260" x2="450" y2="${hitY}" stroke="#f43f5e" stroke-width="6"/><circle cx="450" cy="${hitY}" r="20" fill="#f43f5e" opacity="0.5"/>`;
    setTimeout(() => { laserSvg.innerHTML = ''; }, 160);

    state.streak = 0;
    state.arcHp -= 1;
    const toast = document.getElementById('arc-toast');
    toast.className = 'feedback-banner err';
    toast.textContent = `❌ ยิงผิดท่อ! คุณเลือก ${chosenCode} แต่คำตอบคือ [${pkt.code}] (${pkt.hint})`;
    updateArcadeHud();

    if (state.arcHp <= 0) {
      stopArcadeMode(false);
    } else {
      spawnArcadePacket();
    }
  }
}

function stopArcadeMode(victory) {
  state.arcRunning = false;
  if (state.arcAnimId) cancelAnimationFrame(state.arcAnimId);
  document.getElementById('arc-packet-box').innerHTML = '';
  const ov = document.getElementById('arc-overlay');
  ov.classList.remove('hidden');
  document.getElementById('arc-ov-title').textContent = victory
    ? '🏆 ยอดเยี่ยม! คุณคัดแยกแพ็กเกจข้อมูลครบ 15 แพ็กเกจสำเร็จ!'
    : '⚠️ ระบบเซิร์ฟเวอร์องค์กรหยุดทำงานชั่วคราว!';
  document.getElementById('arc-ov-desc').textContent = victory
    ? `คุณทำได้ ${state.score.toLocaleString()} คะแนน สามารถกดบันทึกคะแนนลงฐานข้อมูล SQLite ในแท็บที่ 6 ได้เลย!`
    : 'ลองทบทวนประเภทของระบบสารสนเทศทั้ง 6 แล้วกดปุ่มด้านล่างเพื่อเริ่มภารกิจใหม่อีกครั้ง!';
}

function switchTab(tabName) {
  ['arcade', 'hub', 'stage1', 'stage2', 'stage3', 'report'].forEach(t => {
    const section = document.getElementById(`tab-view-${t}`);
    const btn = document.querySelector(`.tab-btn[data-tab="${t}"]`);
    if (!section || !btn) return;
    if (t === tabName) {
      section.classList.remove('hidden');
      btn.classList.add('active');
    } else {
      section.classList.add('hidden');
      btn.classList.remove('active');
    }
  });
  if (tabName === 'report') {
    renderReport();
  }
}

function updateHeaderStats() {
  document.getElementById('hdr-score').textContent = state.score.toLocaleString();
  document.getElementById('hdr-streak').textContent = `x${state.streak}`;
  const done =
    Object.keys(state.matchedPyramid).length +
    Object.keys(state.caseAnswers).length +
    Object.keys(state.matrixAnswers).length;
  const total =
    state.pyramidQuestions.length +
    state.caseQuestions.length +
    state.matrixQuestions.length;
  document.getElementById('hdr-progress').textContent = `${done}/${total}`;
}

// ==================== TAB 1: HUB & SVG GALLERY ====================
function renderHub() {
  const indList = document.getElementById('indicators-list');
  indList.innerHTML = state.indicators.map(ind => `
    <div style="background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px;">
      <div style="font-size: 13px; font-weight: 700; color: #a5b4fc;">${ind.code} — ${ind.standard_name}</div>
      <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">${ind.description}</div>
      <div style="font-size: 12px; color: #6ee7b7; margin-top: 4px; font-weight: 600;">🎯 ${ind.uni_mapping}</div>
    </div>
  `).join('');

  const grid = document.getElementById('svg-cards-grid');
  grid.innerHTML = state.isTypes.map(item => `
    <div class="is-card">
      <div class="svg-showcase">
        <img src="${item.svg_path}" alt="${item.code} Vector SVG" />
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge indigo">${item.code}</span>
        <span style="font-size: 11px; color: var(--text-muted);">${item.org_level}</span>
      </div>
      <div>
        <div style="font-size: 15px; font-weight: 700;">${item.name_th}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${item.name_en}</div>
      </div>
      <div style="font-size: 12px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px;">
        <div><strong style="color: #a5b4fc;">Input:</strong> ${item.input_desc}</div>
        <div><strong style="color: #6ee7b7;">Process:</strong> ${item.process_desc}</div>
        <div><strong style="color: #fde68a;">Output:</strong> ${item.output_desc}</div>
        <div style="background: var(--bg-card); padding: 6px 8px; border-radius: 8px; margin-top: 4px;">
          <strong>💡 ตัวอย่าง:</strong> ${item.example_desc}
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== TAB 2: STAGE 1 - PYRAMID ====================
function renderStage1() {
  const levelsEl = document.getElementById('stage1-levels');
  const choicesEl = document.getElementById('stage1-choices');

  levelsEl.innerHTML = state.pyramidQuestions.map((q, idx) => {
    const matchedCode = state.matchedPyramid[idx];
    const isSelected = state.selectedPyramidIdx === idx;
    let cls = 'level-item';
    if (matchedCode) cls += ' matched';
    else if (isSelected) cls += ' selected';

    return `
      <div class="${cls}" data-lvl-idx="${idx}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; font-weight: 700; color: #a5b4fc;">${q.org_name}</span>
          <span class="badge ${matchedCode ? 'emerald' : 'indigo'}">
            ${matchedCode ? `✓ จับคู่กับ ${matchedCode}` : (isSelected ? 'กำลังเลือก...' : 'คลิกเพื่อเลือก')}
          </span>
        </div>
        <div style="font-size: 14px; font-weight: 700; margin-top: 4px;">👤 ${q.title}</div>
        <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">${q.scenario_desc}</div>
      </div>
    `;
  }).join('');

  levelsEl.querySelectorAll('.level-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = Number(el.getAttribute('data-lvl-idx'));
      if (state.matchedPyramid[idx]) return;
      state.selectedPyramidIdx = idx;
      renderStage1();
    });
  });

  const pyramidCodes = ['EIS', 'DSS', 'MIS', 'TPS'];
  choicesEl.innerHTML = pyramidCodes.map(code => {
    const info = state.isTypes.find(t => t.code === code) || { code, name_th: code, svg_path: `/assets/svg/${code.toLowerCase()}.svg` };
    const used = Object.values(state.matchedPyramid).includes(code);
    return `
      <button class="choice-btn" data-pyr-code="${code}" ${used ? 'disabled' : ''} style="display: flex; align-items: center; gap: 12px;">
        <img src="${info.svg_path}" alt="${code}" style="width: 92px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #334155;" />
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 700;">${info.code} — ${info.name_th}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${info.org_level || ''}</div>
        </div>
        <span class="badge ${used ? 'emerald' : 'indigo'}">${used ? 'จับคู่แล้ว ✓' : 'เลือก →'}</span>
      </button>
    `;
  }).join('');

  choicesEl.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-pyr-code');
      handlePyramidMatch(code);
    });
  });
}

function handlePyramidMatch(chosenCode) {
  const fb = document.getElementById('stage1-feedback');
  if (state.selectedPyramidIdx === null) {
    fb.className = 'feedback-banner err';
    fb.textContent = '⚠️ กรุณาคลิกเลือกชั้นของพีระมิดด้านซ้ายมือก่อน แล้วจึงคลิกระบบสารสนเทศด้านขวา';
    fb.classList.remove('hidden');
    return;
  }

  const q = state.pyramidQuestions[state.selectedPyramidIdx];
  state.attempts += 1;

  if (q.correct_code === chosenCode) {
    sfxHit();
    state.matchedPyramid[state.selectedPyramidIdx] = chosenCode;
    state.selectedPyramidIdx = null;
    state.streak += 1;
    state.correctCount += 1;
    const pts = 100 + state.streak * 10;
    state.score += pts;

    fb.className = 'feedback-banner ok';
    fb.textContent = `✅ ถูกต้อง! (+${pts} คะแนน) ${q.explanation}`;
    fb.classList.remove('hidden');
  } else {
    sfxMiss();
    state.streak = 0;
    fb.className = 'feedback-banner err';
    fb.textContent = `❌ ยังไม่ตรงระดับ! คำใบ้: ${q.hint_text}`;
    fb.classList.remove('hidden');
  }

  renderStage1();
  updateHeaderStats();
}

// ==================== TAB 3: STAGE 2 - CASE STUDIES ====================
function renderStage2() {
  const q = state.caseQuestions[state.caseIdx];
  if (!q) return;
  const ans = state.caseAnswers[state.caseIdx];

  document.getElementById('case-step-badge').textContent = `ข้อที่ ${state.caseIdx + 1} / ${state.caseQuestions.length}`;
  document.getElementById('case-org').textContent = q.org_name;
  document.getElementById('case-indicator').textContent = `ตัวชี้วัด ${q.indicator_code}`;
  document.getElementById('case-title').textContent = q.title;
  document.getElementById('case-desc').textContent = q.scenario_desc;
  document.getElementById('case-user').textContent = q.user_role;
  document.getElementById('case-process').textContent = q.process_type;
  document.getElementById('case-output').textContent = q.output_type;

  document.getElementById('case-hint-display').classList.add('hidden');

  const grid = document.getElementById('case-choices-grid');
  grid.innerHTML = state.isTypes.map(t => {
    let cls = 'choice-btn';
    if (ans) {
      if (t.code === q.correct_code) cls += ' correct';
      else if (t.code === ans.chosen && !ans.isCorrect) cls += ' wrong';
    }
    return `
      <button class="${cls}" data-case-code="${t.code}" ${ans ? 'disabled' : ''} style="display: flex; align-items: center; gap: 10px;">
        <img src="${t.svg_path}" alt="${t.code}" style="width: 78px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;" />
        <div>
          <div style="font-size: 15px; font-weight: 700;">${t.code}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${t.name_th}</div>
        </div>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-case-code');
      submitCaseStudy(code);
    });
  });

  const fbBox = document.getElementById('case-feedback-box');
  if (ans) {
    fbBox.className = `feedback-banner ${ans.isCorrect ? 'ok' : 'err'}`;
    fbBox.classList.remove('hidden');
    document.getElementById('case-fb-title').textContent = ans.isCorrect
      ? `✅ วิเคราะห์ถูกต้อง! คำตอบคือ ${q.correct_code}`
      : `❌ คุณเลือก ${ans.chosen} — คำตอบที่ถูกต้องคือ ${q.correct_code}`;
    document.getElementById('case-fb-text').textContent = q.explanation;
  } else {
    fbBox.classList.add('hidden');
  }
}

function submitCaseStudy(chosenCode) {
  if (state.caseAnswers[state.caseIdx]) return;
  const q = state.caseQuestions[state.caseIdx];
  const isCorrect = chosenCode === q.correct_code;

  state.attempts += 1;
  state.caseAnswers[state.caseIdx] = { chosen: chosenCode, isCorrect };

  if (isCorrect) {
    sfxHit();
    state.streak += 1;
    state.correctCount += 1;
    state.score += 120 + state.streak * 15;
  } else {
    sfxMiss();
    state.streak = 0;
  }

  renderStage2();
  updateHeaderStats();
}

// ==================== TAB 4: STAGE 3 - SPEED MATRIX ====================
function renderStage3() {
  const q = state.matrixQuestions[state.matrixIdx];
  if (!q) return;
  const ans = state.matrixAnswers[state.matrixIdx];

  document.getElementById('matrix-step-badge').textContent = `ข้อที่ ${state.matrixIdx + 1} / ${state.matrixQuestions.length}`;
  document.getElementById('matrix-cat').textContent = q.org_name;
  document.getElementById('matrix-question').textContent = `"${q.title}"`;

  const grid = document.getElementById('matrix-choices-grid');
  grid.innerHTML = state.isTypes.map(t => {
    let cls = 'choice-btn';
    if (ans) {
      if (t.code === q.correct_code) cls += ' correct';
      else if (t.code === ans.chosen && !ans.isCorrect) cls += ' wrong';
    }
    return `
      <button class="${cls}" data-mat-code="${t.code}" ${ans ? 'disabled' : ''} style="text-align: center;">
        <div style="font-size: 17px; font-weight: 800;">${t.code}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${t.name_th}</div>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-mat-code');
      submitMatrix(code);
    });
  });

  const fbBox = document.getElementById('matrix-feedback-box');
  if (ans) {
    fbBox.className = `feedback-banner ${ans.isCorrect ? 'ok' : 'err'}`;
    fbBox.classList.remove('hidden');
    document.getElementById('matrix-fb-text').textContent = ans.isCorrect
      ? `✅ ถูกต้อง! ${q.explanation}`
      : `❌ คำตอบที่ถูกคือ ${q.correct_code}: ${q.explanation}`;
  } else {
    fbBox.classList.add('hidden');
  }
}

function submitMatrix(chosenCode) {
  if (state.matrixAnswers[state.matrixIdx]) return;
  const q = state.matrixQuestions[state.matrixIdx];
  const isCorrect = chosenCode === q.correct_code;

  state.attempts += 1;
  state.matrixAnswers[state.matrixIdx] = { chosen: chosenCode, isCorrect };

  if (isCorrect) {
    sfxHit();
    state.streak += 1;
    state.correctCount += 1;
    state.score += 100 + state.streak * 10;
  } else {
    sfxMiss();
    state.streak = 0;
  }

  renderStage3();
  updateHeaderStats();
}

// ==================== TAB 5: REPORT & SQLITE LEADERBOARD ====================
function computeRankTitle(doneCount, acc) {
  if (doneCount >= 12 && acc >= 85) return '🏆 Chief Information Officer (CIO)';
  if (doneCount >= 8 && acc >= 70) return '⭐ Senior IT Consultant';
  if (doneCount >= 4) return '💼 Systems Analyst (SA)';
  return 'Junior IS Learner';
}

function renderReport() {
  const done =
    Object.keys(state.matchedPyramid).length +
    Object.keys(state.caseAnswers).length +
    Object.keys(state.matrixAnswers).length;
  const total =
    state.pyramidQuestions.length +
    state.caseQuestions.length +
    state.matrixQuestions.length;
  const acc = state.attempts > 0 ? Math.round((state.correctCount / state.attempts) * 100) : 0;
  const rank = computeRankTitle(done + state.arcCleared, acc);

  document.getElementById('rep-score').textContent = state.score.toLocaleString();
  document.getElementById('rep-acc').textContent = `ความแม่นยำ: ${acc}% (เกณฑ์ปี 2 ≥ 75%)`;
  document.getElementById('rep-rank').textContent = rank;
  document.getElementById('rep-done').textContent = `ความก้าวหน้า: ${done}/${total} ภารกิจ (+Arcade ${state.arcCleared} แพ็กเกจ)`;
  document.getElementById('rep-db-engine').textContent = state.engine;
  document.getElementById('rep-db-path').textContent = state.dbPath;

  const tbody = document.getElementById('leaderboard-tbody');
  if (!state.leaderboard || state.leaderboard.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted);">
          ยังไม่มีข้อมูลจากเซิร์ฟเวอร์ หรือกำลังรันในโหมด Offline
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = state.leaderboard.map((row, i) => `
      <tr>
        <td><strong>#${i + 1}</strong></td>
        <td>${row.student_id}</td>
        <td>${row.full_name}</td>
        <td style="color: #fbbf24; font-weight: 700;">${Number(row.total_score).toLocaleString()}</td>
        <td style="color: #34d399;">${row.accuracy_pct}%</td>
        <td>${row.rank_title}</td>
      </tr>
    `).join('');
  }
}

initApp();
