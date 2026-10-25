/**
 * src/api.js
 * โมดูลเชื่อมต่อระหว่าง Vite Frontend กับ Node.js + SQLite Backend API
 * รองรับทั้งโหมดรันผ่าน Electron Desktop (http://127.0.0.1:3456/api) และโหมด Vite Dev Proxy (/api)
 */

const API_BASE = 'http://127.0.0.1:3456/api';

// ข้อมูลสำรองกรณีเปิดเฉพาะ Frontend โดยยังไม่ได้สตาร์ท Backend
export const FALLBACK_DATA = {
  engine: 'Local Fallback (Waiting for SQLite Backend)',
  dbPath: 'data/is_game.sqlite',
  isTypes: [
    {
      code: 'TPS',
      name_en: 'Transaction Processing System',
      name_th: 'ระบบประมวลผลรายการประจำวัน',
      org_level: 'ระดับปฏิบัติการ (Operational Level)',
      svg_path: './assets/svg/tps.svg',
      keywords: ['รายการประจำวัน', 'Real-time / Batch', 'ข้อมูลโครงสร้างชัดเจน', 'ลดเวลาทำงานซ้ำ'],
      input_desc: 'ข้อมูลธุรกรรมรายวัน เช่น การขายสินค้า การฝาก-ถอนเงิน การลงทะเบียนเรียน',
      process_desc: 'การบันทึก จัดเรียง คำนวณ และปรับปรุงฐานข้อมูลพื้นฐานอย่างรวดเร็วและแม่นยำ',
      output_desc: 'ใบเสร็จรับเงิน รายการบันทึกธุรกรรม รายงานสรุปยอดประจำวัน',
      example_desc: 'ระบบ POS คิดเงินที่แคชเชียร์ร้านค้าปลีก, ระบบตู้ ATM, ระบบเช็กอินที่นั่งสายการบิน'
    },
    {
      code: 'OAS',
      name_en: 'Office Automation System',
      name_th: 'ระบบสำนักงานอัตโนมัติ',
      org_level: 'ระดับปฏิบัติการและงานเอกสาร (Knowledge / Office Level)',
      svg_path: './assets/svg/oas.svg',
      keywords: ['งานเอกสารดิจิทัล', 'การสื่อสารในองค์กร', 'นัดหมาย/ประชุม', 'เพิ่มประสิทธิภาพสำนักงาน'],
      input_desc: 'เอกสาร ข้อความ ตารางนัดหมาย ข้อมูลการติดต่อสื่อสารระหว่างแผนก',
      process_desc: 'การจัดพิมพ์ ส่งต่อ ลงนามดิจิทัล จัดเก็บเอกสารออนไลน์ และประสานงานร่วมกัน',
      output_desc: 'หนังสือราชการอิเล็กทรอนิกส์ (e-Document), ตารางนัดหมาย, อีเมล, การประชุมทางไกล',
      example_desc: 'ระบบสารบรรณอิเล็กทรอนิกส์ (e-Office), Microsoft 365 / Google Workspace ในองค์กร'
    },
    {
      code: 'MIS',
      name_en: 'Management Information System',
      name_th: 'ระบบสารสนเทศเพื่อการจัดการ',
      org_level: 'ระดับบริหารกลาง (Management Level)',
      svg_path: './assets/svg/mis.svg',
      keywords: ['รายงานตามรอบเวลา', 'สรุปผลเปรียบเทียบแผน', 'ปัญหาที่มีโครงสร้างชัดเจน', 'ดึงข้อมูลจาก TPS'],
      input_desc: 'ข้อมูลสรุปรวมที่ผ่านการประมวลผลจากระบบ TPS',
      process_desc: 'การจัดกลุ่ม สรุปผล เปรียบเทียบยอดจริงกับแผนงาน (Scheduled & Exception Report)',
      output_desc: 'รายงานสรุปยอดขายรายเดือน/ไตรมาส, รายงานสิ่งผิดปกติ (Exception Report)',
      example_desc: 'ระบบรายงานสรุปยอดขายรายเดือนของผู้จัดการสาขา, ระบบติดตามงบประมาณก่อสร้างรายไตรมาส'
    },
    {
      code: 'DSS',
      name_en: 'Decision Support System',
      name_th: 'ระบบสนับสนุนการตัดสินใจ',
      org_level: 'ระดับบริหารกลางและนักวิเคราะห์ (Management / Analytical Level)',
      svg_path: './assets/svg/dss.svg',
      keywords: ['ปัญหากึ่งมีโครงสร้าง', 'จำลองสถานการณ์ (What-if)', 'วิเคราะห์ทางเลือก', 'ยืดหยุ่นสูง'],
      input_desc: 'ข้อมูลจากทั้งภายใน (TPS/MIS) และข้อมูลภายนอกองค์กร + ตัวแบบคณิตศาสตร์/สถิติ',
      process_desc: 'การวิเคราะห์เชิงโต้ตอบ การจำลองสถานการณ์ (What-if Analysis, Sensitivity Analysis)',
      output_desc: 'ทางเลือกในการตัดสินใจ พยากรณ์ผลลัพธ์หากปรับเปลี่ยนตัวแปรธุรกิจ',
      example_desc: 'ระบบจำลองการปรับราคาน้ำมันต่อต้นทุนขนส่ง, ระบบวิเคราะห์พอร์ตการลงทุนและจำลองความเสี่ยง'
    },
    {
      code: 'EIS',
      name_en: 'Executive Information System (ESS)',
      name_th: 'ระบบสารสนเทศสำหรับผู้บริหารระดับสูง',
      org_level: 'ระดับกลยุทธ์ (Strategic Level)',
      svg_path: './assets/svg/eis.svg',
      keywords: ['วิสัยทัศน์ระยะยาว 3-5 ปี', 'ปัญหาไม่มีโครงสร้าง', 'Dashboard / Drill-down', 'ข้อมูลคู่แข่ง/ตลาด'],
      input_desc: 'ข้อมูลสรุปภาพรวมทั้งองค์กร + ข้อมูลเศรษฐกิจ คู่แข่ง และแนวโน้มอุตสาหกรรมภายนอก',
      process_desc: 'การแสดงผลกราฟิกเชิงกลยุทธ์ การเจาะลึกข้อมูล (Drill-down) และติดตาม KPI ระดับองค์กร',
      output_desc: 'Executive Dashboard แสดงดัชนีชี้วัดความสำเร็จ (KPI) และแนวโน้มเชิงกลยุทธ์',
      example_desc: 'ระบบ Strategic Dashboard ของอธิการบดีหรือ CEO สำหรับวางแผนทิศทางองค์กร 5 ปี'
    },
    {
      code: 'ES',
      name_en: 'Expert System & AI',
      name_th: 'ระบบผู้เชี่ยวชาญและปัญญาประดิษฐ์',
      org_level: 'ระบบฐานความรู้เฉพาะทาง (Knowledge / Specialized Level)',
      svg_path: './assets/svg/es.svg',
      keywords: ['ฐานความรู้ (Knowledge Base)', 'กลไกอนุมาน (Inference Engine)', 'เลียนแบบผู้เชี่ยวชาญ', 'วินิจฉัยเฉพาะทาง'],
      input_desc: 'อาการ/ข้อมูลปัญหาเฉพาะทาง + กฎเกณฑ์ความรู้จากผู้เชี่ยวชาญมนุษย์',
      process_desc: 'การอนุมานด้วยกฎ (Rule-based Inference) หรือโมเดลปัญญาประดิษฐ์เพื่อหาข้อสรุป',
      output_desc: 'คำวินิจฉัย ข้อเสนอแนะเชิงลึก หรือการตัดสินใจแทนผู้เชี่ยวชาญเฉพาะด้าน',
      example_desc: 'ระบบวินิจฉัยโรคพืชของกรมส่งเสริมการเกษตร, ระบบวิเคราะห์สาเหตุเครื่องจักรขัดข้องในโรงงาน'
    }
  ]
};

export async function fetchGameData() {
  try {
    const res = await fetch(`${API_BASE}/game-data`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return { online: true, ...data };
  } catch (_) {
    return { online: false, ...FALLBACK_DATA, questions: [], indicators: [] };
  }
}

export async function fetchLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.leaderboard || [];
  } catch (_) {
    return [];
  }
}

export async function loginStudentApi(student_id, full_name, faculty) {
  const res = await fetch(`${API_BASE}/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id, full_name, faculty })
  });
  if (!res.ok) throw new Error('ไม่สามารถบันทึกข้อมูลนักศึกษาได้');
  return res.json();
}

export async function saveSessionApi(sessionData) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData)
  });
  if (!res.ok) throw new Error('ไม่สามารถบันทึกคะแนนลง SQLite ได้');
  return res.json();
}

export async function createQuestionApi(questionData) {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData)
  });
  if (!res.ok) throw new Error('ไม่สามารถเพิ่มโจทย์ลง SQLite ได้');
  return res.json();
}
