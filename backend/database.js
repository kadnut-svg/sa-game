/**
 * database.js
 * ระบบจัดการฐานข้อมูล SQLite สำหรับเกม "IS Architect Quest: จำแนกประเภทของระบบสารสนเทศ"
 * รองรับทั้งโมดูลมาตรฐานของ Node.js (node:sqlite DatabaseSync) และ better-sqlite3
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'is_game.sqlite');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ข้อมูลเริ่มต้น (Seed Data) สำหรับตารางประเภทระบบสารสนเทศ 6 ประเภท
export const SEED_IS_TYPES = [
  {
    code: 'TPS',
    name_en: 'Transaction Processing System',
    name_th: 'ระบบประมวลผลรายการประจำวัน',
    org_level: 'ระดับปฏิบัติการ (Operational Level)',
    svg_path: '/assets/svg/tps.svg',
    keywords: JSON.stringify(['รายการประจำวัน', 'Real-time / Batch', 'ข้อมูลโครงสร้างชัดเจน', 'ลดเวลาทำงานซ้ำ']),
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
    svg_path: '/assets/svg/oas.svg',
    keywords: JSON.stringify(['งานเอกสารดิจิทัล', 'การสื่อสารในองค์กร', 'นัดหมาย/ประชุม', 'เพิ่มประสิทธิภาพสำนักงาน']),
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
    svg_path: '/assets/svg/mis.svg',
    keywords: JSON.stringify(['รายงานตามรอบเวลา', 'สรุปผลเปรียบเทียบแผน', 'ปัญหาที่มีโครงสร้างชัดเจน', 'ดึงข้อมูลจาก TPS']),
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
    svg_path: '/assets/svg/dss.svg',
    keywords: JSON.stringify(['ปัญหากึ่งมีโครงสร้าง', 'จำลองสถานการณ์ (What-if)', 'วิเคราะห์ทางเลือก', 'ยืดหยุ่นสูง']),
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
    svg_path: '/assets/svg/eis.svg',
    keywords: JSON.stringify(['วิสัยทัศน์ระยะยาว 3-5 ปี', 'ปัญหาไม่มีโครงสร้าง', 'Dashboard / Drill-down', 'ข้อมูลคู่แข่ง/ตลาด']),
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
    svg_path: '/assets/svg/es.svg',
    keywords: JSON.stringify(['ฐานความรู้ (Knowledge Base)', 'กลไกอนุมาน (Inference Engine)', 'เลียนแบบผู้เชี่ยวชาญ', 'วินิจฉัยเฉพาะทาง']),
    input_desc: 'อาการ/ข้อมูลปัญหาเฉพาะทาง + กฎเกณฑ์ความรู้จากผู้เชี่ยวชาญมนุษย์',
    process_desc: 'การอนุมานด้วยกฎ (Rule-based Inference) หรือโมเดลปัญญาประดิษฐ์เพื่อหาข้อสรุป',
    output_desc: 'คำวินิจฉัย ข้อเสนอแนะเชิงลึก หรือการตัดสินใจแทนผู้เชี่ยวชาญเฉพาะด้าน',
    example_desc: 'ระบบวินิจฉัยโรคพืชของกรมส่งเสริมการเกษตร, ระบบวิเคราะห์สาเหตุเครื่องจักรขัดข้องในโรงงาน'
  }
];

export const SEED_CURRICULUM_INDICATORS = [
  {
    code: 'ว 4.1 (ม.4-6)',
    standard_name: 'มาตรฐาน ว 4.1 การออกแบบและเทคโนโลยี (หลักสูตรแกนกลางฯ 2560)',
    description: 'วิเคราะห์แนวคิดหลักของเทคโนโลยีและระบบสารสนเทศ (Input–Process–Output–Feedback) เพื่อเลือกใช้ระบบให้เหมาะสมกับระดับปัญหาและความต้องการขององค์กร',
    uni_mapping: 'สมรรถนะปีที่ 2: จำแนกโครงสร้างระบบสารสนเทศตามระดับพีระมิดองค์กร (Operational, Management, Strategic)'
  },
  {
    code: 'ว 4.2 (ม.4-6)',
    standard_name: 'มาตรฐาน ว 4.2 วิทยาการคำนวณ (หลักสูตรแกนกลางฯ 2560)',
    description: 'รวบรวม ประเมิน และใช้ข้อมูลสารสนเทศในการแก้ปัญหาหรือสนับสนุนการตัดสินใจอย่างมีประสิทธิภาพ รู้เท่าทันบทบาทของระบบอัตโนมัติและปัญญาประดิษฐ์ (ES/AI)',
    uni_mapping: 'สมรรถนะปีที่ 2: วิเคราะห์กรณีศึกษาธุรกิจเพื่อเลือกระบบ TPS, OAS, MIS, DSS, EIS และ ES ได้อย่างถูกต้อง'
  }
];

export const SEED_QUESTIONS = [
  // Stage 1: Pyramid Matching (4 items)
  {
    stage: 'pyramid',
    org_name: 'ชั้นยอดพีระมิด: ระดับกลยุทธ์ (Strategic Level)',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'ผู้บริหารระดับสูง (CEO / อธิการบดี / คณะกรรมการบริหาร)',
    scenario_desc: 'ต้องการเห็นภาพรวมองค์กรระยะยาว 3–5 ปี เปรียบเทียบกับคู่แข่งภายนอก และเจาะลึกข้อมูล (Drill-down) ผ่าน Executive Dashboard',
    user_role: 'CEO / อธิการบดี',
    process_type: 'ติดตาม KPI ระดับองค์กรและเจาะลึกข้อมูล (Drill-down)',
    output_type: 'Executive Strategic Dashboard',
    hint_text: 'ระบบสำหรับผู้บริหารสูงสุดที่เน้นวิสัยทัศน์ระยะยาวและแสดงผลเป็น Dashboard',
    correct_code: 'EIS',
    explanation: 'ระดับกลยุทธ์ (Strategic Level) ใช้ระบบ EIS/ESS เพื่อติดตาม KPI ภาพรวมและวางแผนระยะยาว 3-5 ปี'
  },
  {
    stage: 'pyramid',
    org_name: 'ชั้นกลาง (เชิงวิเคราะห์): ระดับบริหารและวางแผนทางเลือก',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'ผู้จัดการฝ่ายวางแผน / นักวิเคราะห์ธุรกิจ (Business Analyst)',
    scenario_desc: 'ต้องตัดสินใจในปัญหาที่กึ่งมีโครงสร้าง โดยใช้ตัวแบบจำลองสถานการณ์ "หากเปลี่ยนตัวแปร X จะเกิดผล Y อย่างไร (What-if Analysis)"',
    user_role: 'นักวิเคราะห์ธุรกิจ / ผู้จัดการฝ่ายวางแผน',
    process_type: 'จำลองสถานการณ์ (What-if & Sensitivity Analysis)',
    output_type: 'การเปรียบเทียบทางเลือกและพยากรณ์ผลลัพธ์',
    hint_text: 'ระบบที่โดดเด่นเรื่องการทำ What-if Analysis สำหรับปัญหากึ่งมีโครงสร้าง',
    correct_code: 'DSS',
    explanation: 'ระบบ DSS (Decision Support System) ช่วยสนับสนุนการตัดสินใจในปัญหากึ่งมีโครงสร้างด้วยการจำลองสถานการณ์'
  },
  {
    stage: 'pyramid',
    org_name: 'ชั้นกลาง (เชิงควบคุม): ระดับบริหารจัดการ (Management Level)',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'ผู้จัดการฝ่าย / หัวหน้าแผนก',
    scenario_desc: 'ต้องการรายงานสรุปผลการดำเนินงานประจำสัปดาห์/รายเดือนที่มีรูปแบบแน่นอน เพื่อตรวจสอบว่างานเป็นไปตามเป้าหมายหรือไม่',
    user_role: 'ผู้จัดการสาขา / ผู้อำนวยการฝ่าย',
    process_type: 'สรุปผลข้อมูลจาก TPS ตามรอบเวลาและแจ้งเตือนสิ่งผิดปกติ',
    output_type: 'Scheduled Report & Exception Report',
    hint_text: 'ระบบที่ดึงข้อมูลจาก TPS มาสรุปเป็นรายงานประจำเดือนที่มีรูปแบบมาตรฐาน',
    correct_code: 'MIS',
    explanation: 'ระบบ MIS สรุปข้อมูลจาก TPS เป็นรายงานตามรอบเวลาเพื่อให้ผู้บริหารระดับกลางใช้ควบคุมการดำเนินงาน'
  },
  {
    stage: 'pyramid',
    org_name: 'ชั้นฐานพีระมิด: ระดับปฏิบัติการ (Operational Level)',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'พนักงานปฏิบัติการหน้างาน / เจ้าหน้าที่เคาน์เตอร์',
    scenario_desc: 'ต้องบันทึกและประมวลผลรายการธุรกรรมประจำวันที่เกิดขึ้นซ้ำๆ จำนวนมากอย่างรวดเร็วและแม่นยำแบบ Real-time',
    user_role: 'พนักงานแคชเชียร์ / เจ้าหน้าที่เวชระเบียน',
    process_type: 'บันทึกรายการธุรกรรมรายวันแบบ Real-time หรือ Batch',
    output_type: 'ใบเสร็จรับเงิน และรายการบันทึกธุรกรรมต้นน้ำ',
    hint_text: 'ระบบพื้นฐานที่สุดขององค์กรที่ทำหน้าที่บันทึกธุรกรรมรายวัน',
    correct_code: 'TPS',
    explanation: 'ระบบ TPS ทำหน้าที่ประมวลผลรายการประจำวันในระดับปฏิบัติการ และเป็นแหล่งข้อมูลต้นน้ำให้ระบบอื่น'
  },

  // Stage 2: 10 Case Studies
  {
    stage: 'case_study',
    org_name: '🏥 โรงพยาบาลศูนย์มหาวิทยาลัย',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'กรณีศึกษาที่ 1: ระบบลงทะเบียนผู้ป่วยนอกและชำระค่ารักษาพยาบาลอัตโนมัติ',
    scenario_desc: 'โรงพยาบาลติดตั้งระบบตู้ Kiosk และโปรแกรมหน้าเคาน์เตอร์สำหรับบันทึกการเข้ารับบริการของผู้ป่วยวันละ 3,500 ราย ตัดสต็อกยาเมื่อห้องยาจ่ายยา และออกใบเสร็จรับเงินทันทีโดยเชื่อมกับฐานข้อมูลสิทธิการรักษาแบบ Real-time',
    user_role: 'เจ้าหน้าที่เวชระเบียน เภสัชกรจ่ายยา และการเงินหน้างาน',
    process_type: 'บันทึกข้อมูลรายการรายวัน ตรวจสอบสิทธิ และคำนวณค่ารักษาตามรายการจริง',
    output_type: 'ใบนัดหมาย ใบเสร็จรับเงิน และรายการตัดสต็อกยารายวัน',
    hint_text: 'สังเกตคำว่า "บันทึกรายการรายวันจำนวนมากแบบ Real-time" และ "ออกใบเสร็จรับเงินทันที"',
    correct_code: 'TPS',
    explanation: 'ถูกต้อง! ระบบนี้คือ TPS (Transaction Processing System) เพราะทำหน้าที่ประมวลผลรายการธุรกรรมประจำวัน (การลงทะเบียน การจ่ายยา การรับชำระเงิน) ที่เกิดขึ้นซ้ำๆ ในระดับปฏิบัติการ'
  },
  {
    stage: 'case_study',
    org_name: '🛒 เครือซูเปอร์มาร์เก็ตระดับประเทศ',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'กรณีศึกษาที่ 2: ระบบรายงานสรุปยอดขายและสินค้าคงคลังประจำเดือนของผจก.สาขา',
    scenario_desc: 'ทุกเช้าวันจันทร์และสิ้นเดือน ระบบจะดึงข้อมูลการขายจากเครื่องแคชเชียร์ (POS) ทั้งหมดมาสรุปเป็นตารางเปรียบเทียบยอดขายจริงกับเป้าหมายประจำเดือน พร้อมไฮไลต์รายการสินค้าที่มียอดขายต่ำกว่าเกณฑ์ (Exception Report) ให้ผู้จัดการสาขาตรวจสอบ',
    user_role: 'ผู้จัดการสาขา และผู้จัดการฝ่ายขายระดับภูมิภาค',
    process_type: 'รวบรวมข้อมูลจาก TPS มาสรุปผลตามรูปแบบมาตรฐานที่กำหนดไว้ล่วงหน้าตามรอบเวลา',
    output_type: 'รายงานสรุปยอดขายประจำเดือน (Scheduled Report) และรายงานสิ่งผิดปกติ (Exception Report)',
    hint_text: 'ระบบนี้ดึงข้อมูลจาก POS (ซึ่งเป็น TPS) มาทำ "รายงานสรุปตามรอบเวลาที่มีรูปแบบตายตัว" ให้ผู้จัดการระดับกลาง',
    correct_code: 'MIS',
    explanation: 'ถูกต้อง! นี่คือ MIS (Management Information System) ซึ่งนำข้อมูลจาก TPS มาสรุปเป็นรายงานประจำงวด (Scheduled Report) และรายงานสิ่งผิดปกติ (Exception Report) สำหรับผู้บริหารระดับกลาง'
  },
  {
    stage: 'case_study',
    org_name: '🚚 บริษัทโลจิสติกส์และขนส่งด่วน',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'กรณีศึกษาที่ 3: ระบบจำลองสถานการณ์ปรับเปลี่ยนราคาน้ำมันและเส้นทางกระจายสินค้า',
    scenario_desc: 'ทีมวางแผนขนส่งต้องตัดสินใจว่าจะเปิดศูนย์กระจายสินค้าแห่งใหม่ที่จังหวัดใด ระบบจึงเปิดให้ผู้จัดการทดลองปรับค่าตัวแปรราคาน้ำมัน ปริมาณพัสดุ และค่าเช่าที่ดิน (What-if Analysis) เพื่อคำนวณหาจุดคุ้มทุนและเส้นทางที่ต้นทุนต่ำที่สุด',
    user_role: 'ผู้จัดการฝ่ายวางแผนกลยุทธ์โลจิสติกส์ และนักวิเคราะห์ระบบงาน',
    process_type: 'ใช้ตัวแบบคณิตศาสตร์จำลองสถานการณ์ (Simulation / What-if Analysis) จากตัวแปรที่เปลี่ยนแปลงได้',
    output_type: 'ตารางเปรียบเทียบทางเลือกการลงทุนและพยากรณ์ต้นทุนของแต่ละทางเลือก',
    hint_text: 'มีคำสำคัญคือ "ทดลองปรับตัวแปร (What-if Analysis)" เพื่อเปรียบเทียบทางเลือกในการแก้ปัญหากึ่งมีโครงสร้าง',
    correct_code: 'DSS',
    explanation: 'ถูกต้อง! ระบบนี้คือ DSS (Decision Support System) เพราะเน้นการวิเคราะห์เชิงโต้ตอบและจำลองสถานการณ์ (What-if Analysis) เพื่อช่วยตัดสินใจในปัญหาที่กึ่งมีโครงสร้าง'
  },
  {
    stage: 'case_study',
    org_name: '🎓 มหาวิทยาลัยชั้นนำแห่งหนึ่ง',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'กรณีศึกษาที่ 4: กระดานวิเคราะห์ทิศทางมหาวิทยาลัย 5 ปีสำหรับอธิการบดี',
    scenario_desc: 'อธิการบดีและรองอธิการบดีใช้หน้าจอแสดงผลกราฟิกที่สรุปดัชนีชี้วัดความสำเร็จ (KPI) ทั้งมหาวิทยาลัย เปรียบเทียบอันดับโลก (QS Ranking) แนวโน้มจำนวนประชากรวัยเรียนในอีก 5 ปีข้างหน้า และสามารถคลิกเจาะลึก (Drill-down) ดูข้อมูลรายคณะได้ทันที',
    user_role: 'อธิการบดี และคณะผู้บริหารระดับสูงของมหาวิทยาลัย',
    process_type: 'รวบรวมข้อมูลภายในและแนวโน้มภายนอกองค์กร แสดงผลเป็น Dashboard และทำ Drill-down',
    output_type: 'Executive Dashboard แสดง KPI ระดับยุทธศาสตร์และแนวโน้มระยะยาว',
    hint_text: 'ผู้ใช้งานคือ "อธิการบดี (ระดับกลยุทธ์)" ใช้ดูแนวโน้ม 5 ปี ข้อมูลคู่แข่งภายนอก และทำ Drill-down',
    correct_code: 'EIS',
    explanation: 'ถูกต้อง! นี่คือ EIS / ESS (Executive Information System) ที่ออกแบบมาเพื่อผู้บริหารระดับสูงในการกำหนดกลยุทธ์ระยะยาว มีจุดเด่นคือ Dashboard, ข้อมูลภายนอกองค์กร และฟังก์ชัน Drill-down'
  },
  {
    stage: 'case_study',
    org_name: '🌾 กรมส่งเสริมการเกษตรและสหกรณ์',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'กรณีศึกษาที่ 5: ระบบวินิจฉัยโรคพืชและแนะนำการรักษาสำหรับเกษตรกร',
    scenario_desc: 'นักวิชาการเกษตรได้รวบรวมองค์ความรู้และกฎการวินิจฉัยโรคข้าวจากผู้เชี่ยวชาญกว่า 50 ท่านใส่ไว้ในฐานความรู้ (Knowledge Base) เมื่อเกษตรกรระบุลักษณะใบเหลือง จุดสีน้ำตาล และสภาพอากาศ ระบบจะใช้กลไกอนุมาน (Inference Engine) ฟันธงชนิดโรคและวิธีรักษา',
    user_role: 'เกษตรกรและเจ้าหน้าที่ส่งเสริมการเกษตรในพื้นที่',
    process_type: 'ประมวลผลด้วยฐานความรู้ (Knowledge Base) และกลไกการอนุมานตามกฎ (Inference Engine)',
    output_type: 'ผลการวินิจฉัยโรคพืชพร้อมคำแนะนำการจัดการเหมือนมีผู้เชี่ยวชาญมาตรวจเอง',
    hint_text: 'มีองค์ประกอบหลักคือ "ฐานความรู้ (Knowledge Base)" และ "กลไกอนุมาน (Inference Engine)" เลียนแบบผู้เชี่ยวชาญ',
    correct_code: 'ES',
    explanation: 'ถูกต้อง! ระบบนี้คือ ES (Expert System / ระบบผู้เชี่ยวชาญ) ซึ่งเก็บความรู้ของผู้เชี่ยวชาญไว้ใน Knowledge Base และใช้ Inference Engine ในการวินิจฉัยปัญหาเฉพาะทาง'
  },
  {
    stage: 'case_study',
    org_name: '🏛️ หน่วยงานราชการส่วนกลาง',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'กรณีศึกษาที่ 6: ระบบสารบรรณอิเล็กทรอนิกส์และการนัดหมายประชุมไร้กระดาษ',
    scenario_desc: 'หน่วยงานเปลี่ยนผ่านสู่ Smart Office โดยใช้ระบบสร้างหนังสือราชการออนไลน์ ลงนามดิจิทัล (Digital Signature) ส่งเวียนเอกสารระหว่างแผนก จองห้องประชุมอัตโนมัติ และจัดเก็บไฟล์เอกสารลงคลาวด์กลางขององค์กร',
    user_role: 'เจ้าหน้าที่ธุรการ เลขานุการ และบุคลากรทุกแผนกในสำนักงาน',
    process_type: 'จัดการงานเอกสาร การสื่อสาร การลงนาม และการประสานงานในสำนักงาน',
    output_type: 'หนังสือเวียนอิเล็กทรอนิกส์ ตารางนัดหมาย และคลังเอกสารดิจิทัล',
    hint_text: 'เน้นการลดกระดาษ งานเอกสาร การสื่อสาร และการประสานงานในสำนักงานประจำวัน',
    correct_code: 'OAS',
    explanation: 'ถูกต้อง! ระบบนี้คือ OAS (Office Automation System / ระบบสำนักงานอัตโนมัติ) ที่ช่วยเพิ่มประสิทธิภาพงานเอกสารและการสื่อสารภายในองค์กร'
  },
  {
    stage: 'case_study',
    org_name: '🏦 ธนาคารพาณิชย์แห่งประเทศไทย',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'กรณีศึกษาที่ 7: ระบบวิเคราะห์พอร์ตการลงทุนและจำลองความเสี่ยงทางการเงิน',
    scenario_desc: 'นักวิเคราะห์การลงทุนของธนาคารใช้ซอฟต์แวร์ดึงข้อมูลราคาหุ้น อัตราดอกเบี้ย และอัตราแลกเปลี่ยน มาคำนวณผ่านโมเดลทางสถิติเพื่อจำลองว่า หากธนาคารกลางปรับขึ้นดอกเบี้ย 0.50% พอร์ตการลงทุนของลูกค้าแต่ละกลุ่มจะได้รับผลกระทบอย่างไร',
    user_role: 'นักวิเคราะห์การลงทุน (Financial Analyst) และผู้จัดการกองทุน',
    process_type: 'วิเคราะห์ข้อมูลด้วยโมเดลสถิติและการจำลองความอ่อนไหว (Sensitivity & What-if Analysis)',
    output_type: 'กราฟจำลองความเสี่ยงและสัดส่วนการลงทุนที่เหมาะสมที่สุดในแต่ละสถานการณ์',
    hint_text: 'เป็นการใช้โมเดลทางสถิติวิเคราะห์ทางเลือกและจำลองผลกระทบเมื่อตัวแปรเปลี่ยนไป',
    correct_code: 'DSS',
    explanation: 'ถูกต้อง! นี่คือระบบ DSS (Decision Support System) เพราะใช้ตัวแบบทางคณิตศาสตร์/การเงินช่วยวิเคราะห์ทางเลือกภายใต้สถานการณ์ที่ไม่แน่นอน'
  },
  {
    stage: 'case_study',
    org_name: '✈️ สายการบินนานาชาติ',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'กรณีศึกษาที่ 8: ระบบเช็กอินที่นั่งและออกบัตรโดยสาร (Boarding Pass)',
    scenario_desc: 'เมื่อผู้โดยสารสแกนพาสปอร์ตที่เคาน์เตอร์สนามบินหรือผ่านแอปมือถือ ระบบจะตรวจสอบรายชื่อในเที่ยวบิน ล็อกหมายเลขที่นั่งทันทีเพื่อไม่ให้ซ้ำกับผู้โดยสารท่านอื่น บันทึกน้ำหนักกระเป๋าสัมภาระ และพิมพ์ Boarding Pass ออกมาภายใน 3 วินาที',
    user_role: 'เจ้าหน้าที่ภาคพื้นดินสนามบิน (Ground Staff) และผู้โดยสาร',
    process_type: 'ประมวลผลรายการจองและตัดที่นั่งแบบ Online Real-time Processing',
    output_type: 'บัตรผ่านขึ้นเครื่อง (Boarding Pass) และป้ายติดสัมภาระ (Baggage Tag)',
    hint_text: 'เป็นการประมวลผลรายการเช็กอินรายคนที่ต้องทำทันทีแบบ Real-time เพื่อป้องกันที่นั่งซ้ำ',
    correct_code: 'TPS',
    explanation: 'ถูกต้อง! ระบบเช็กอินและจองตั๋วเป็นตัวอย่างคลาสสิกของ TPS (Transaction Processing System) ที่ต้องการความถูกต้องและรวดเร็วแบบ Real-time ในระดับปฏิบัติการ'
  },
  {
    stage: 'case_study',
    org_name: '🏭 โรงงานผลิตชิ้นส่วนอิเล็กทรอนิกส์',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'กรณีศึกษาที่ 9: ระบบวิเคราะห์สาเหตุเครื่องจักรขัดข้องและแนะนำวิธีซ่อมบำรุง',
    scenario_desc: 'เมื่อเครื่องจักรในสายการผลิตเกิดอาการผิดปกติ วิศวกรใหม่สามารถป้อนรหัสแจ้งเตือน เสียงผิดปกติ และค่าความร้อนเข้าสู่ระบบ ซึ่งได้รวบรวมประสบการณ์ของหัวหน้าวิศวกรอาวุโสกว่า 30 ปีไว้ ระบบจะวินิจฉัยจุดเสียและบอกขั้นตอนการซ่อมทีละขั้น',
    user_role: 'วิศวกรซ่อมบำรุงและช่างเทคนิคประจำโรงงาน',
    process_type: 'จับคู่ข้อมูลอาการเสียกับกฎในฐานความรู้ (Rule-based Knowledge Base) เพื่อหาสาเหตุ',
    output_type: 'ข้อสรุปสาเหตุการขัดข้องและคู่มือขั้นตอนการแก้ไขปัญหาเฉพาะจุด',
    hint_text: 'ระบบทำหน้าที่แทน "หัวหน้าวิศวกรอาวุโสผู้เชี่ยวชาญ" โดยใช้ฐานความรู้ในการวินิจฉัยจุดเสีย',
    correct_code: 'ES',
    explanation: 'ถูกต้อง! นี่คือ ES (Expert System) ที่ช่วยถ่ายทอดและเก็บรักษาความเชี่ยวชาญของวิศวกรอาวุโสให้อยู่ในรูปฐานความรู้เพื่อช่วยวินิจฉัยปัญหาซับซ้อน'
  },
  {
    stage: 'case_study',
    org_name: '🏢 เครือบริษัทอสังหาริมทรัพย์',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'กรณีศึกษาที่ 10: ระบบรายงานสรุปงบประมาณก่อสร้างเปรียบเทียบแผนรายไตรมาส',
    scenario_desc: 'ระบบบัญชีและโครงการก่อสร้างจะสรุปรายงานค่าใช้จ่ายวัสดุก่อสร้างและค่าแรงของแต่ละโครงการทุกสิ้นไตรมาส เพื่อส่งให้ผู้อำนวยการฝ่ายก่อสร้างตรวจสอบว่าโครงการใดใช้งบประมาณเกินกว่าแผนที่ตั้งไว้เกิน 5%',
    user_role: 'ผู้อำนวยการฝ่ายก่อสร้าง และผู้จัดการโครงการ',
    process_type: 'สรุปยอดรวมจากรายการเบิกจ่ายรายวัน มาเปรียบเทียบกับงบประมาณตามแผน',
    output_type: 'รายงานสรุปงบประมาณรายไตรมาส และรายงานโครงการที่งบเกินเกณฑ์',
    hint_text: 'เป็นการสรุปรายงานตามรอบเวลา (รายไตรมาส) เปรียบเทียบแผนกับผลจริง สำหรับผู้บริหารระดับกลาง',
    correct_code: 'MIS',
    explanation: 'ถูกต้อง! ระบบนี้คือ MIS (Management Information System) ที่ช่วยผู้บริหารระดับกลางควบคุมและติดตามการใช้งบประมาณเทียบกับแผนงานตามรอบเวลา'
  },

  // Stage 3: Speed Matrix (6 items)
  {
    stage: 'speed_matrix',
    org_name: 'ลักษณะการประมวลผลหลัก',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'เน้นการบันทึกธุรกรรมรายวันที่เกิดขึ้นซ้ำๆ จำนวนมาก เป็นแหล่งข้อมูลต้นน้ำให้กับระบบอื่นๆ ในองค์กร',
    scenario_desc: 'ประมวลผลรายการประจำวันอย่างรวดเร็ว (Real-time / Batch)',
    user_role: 'ระดับปฏิบัติการ',
    process_type: 'Transaction Processing',
    output_type: 'รายการธุรกรรมและใบเสร็จ',
    hint_text: 'ฐานรากของพีระมิด',
    correct_code: 'TPS',
    explanation: 'TPS เป็นฐานข้อมูลต้นน้ำที่เก็บธุรกรรมรายวันทั้งหมดขององค์กร'
  },
  {
    stage: 'speed_matrix',
    org_name: 'รูปแบบผลลัพธ์ (Output)',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'สร้างรายงานสรุปตามรอบเวลาที่กำหนดไว้ล่วงหน้า (Scheduled Report) และรายงานสิ่งผิดปกติ (Exception Report)',
    scenario_desc: 'สรุปข้อมูลเปรียบเทียบแผนกับผลจริงตามงวดเวลา',
    user_role: 'ผู้บริหารระดับกลาง',
    process_type: 'Aggregation & Reporting',
    output_type: 'รายงานประจำเดือน/ไตรมาส',
    hint_text: 'รายงานสำหรับผู้จัดการ',
    correct_code: 'MIS',
    explanation: 'MIS โดดเด่นเรื่องรายงานประจำงวดที่มีโครงสร้างตายตัวเพื่อการควบคุมงาน'
  },
  {
    stage: 'speed_matrix',
    org_name: 'เครื่องมือวิเคราะห์เชิงโต้ตอบ',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'มีตัวแบบคณิตศาสตร์รองรับการทำ What-if Analysis และ Sensitivity Analysis สำหรับปัญหากึ่งมีโครงสร้าง',
    scenario_desc: 'ทดลองปรับค่าตัวแปรเพื่อดูผลลัพธ์ทางเลือก',
    user_role: 'นักวิเคราะห์และผู้จัดการฝ่ายวางแผน',
    process_type: 'Simulation & Modeling',
    output_type: 'ทางเลือกในการตัดสินใจ',
    hint_text: 'จำลองสถานการณ์ What-if',
    correct_code: 'DSS',
    explanation: 'DSS เน้นการจำลองสถานการณ์ (What-if) เพื่อเปรียบเทียบทางเลือกในการตัดสินใจ'
  },
  {
    stage: 'speed_matrix',
    org_name: 'มุมมองผู้บริหารระดับสูง',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'แสดงผลแบบ Executive Dashboard เน้น KPI ระดับยุทธศาสตร์ ผสานข้อมูลคู่แข่งภายนอก และกด Drill-down ได้',
    scenario_desc: 'ติดตามดัชนีชี้วัดความสำเร็จระยะยาว 3-5 ปี',
    user_role: 'ผู้บริหารระดับสูง (CEO / อธิการบดี)',
    process_type: 'Strategic KPI & Drill-down',
    output_type: 'Executive Dashboard',
    hint_text: 'ยอดพีระมิดองค์กร',
    correct_code: 'EIS',
    explanation: 'EIS/ESS ออกแบบสำหรับผู้บริหารระดับสูงในการมองภาพรวมเชิงกลยุทธ์ระยะยาว'
  },
  {
    stage: 'speed_matrix',
    org_name: 'สถาปัตยกรรมปัญญาประดิษฐ์',
    indicator_code: 'ว 4.2 (ม.4-6)',
    title: 'ประกอบด้วย Knowledge Base (ฐานความรู้) และ Inference Engine (กลไกอนุมาน) เพื่อเลียนแบบการคิดของผู้เชี่ยวชาญ',
    scenario_desc: 'วินิจฉัยปัญหาเฉพาะทางจากกฎและฐานความรู้',
    user_role: 'ผู้ปฏิบัติงานที่ต้องการคำปรึกษาเฉพาะทาง',
    process_type: 'Rule-based Inference',
    output_type: 'คำวินิจฉัยและข้อเสนอแนะ',
    hint_text: 'ฐานความรู้ + กลไกอนุมาน',
    correct_code: 'ES',
    explanation: 'ES (Expert System) ใช้ฐานความรู้และกลไกอนุมานในการวินิจฉัยปัญหาเฉพาะทาง'
  },
  {
    stage: 'speed_matrix',
    org_name: 'การเพิ่มประสิทธิภาพสำนักงาน',
    indicator_code: 'ว 4.1 (ม.4-6)',
    title: 'เน้นการจัดการเอกสารอิเล็กทรอนิกส์ งานสารบรรณ การลงนามดิจิทัล และการประสานงานตารางนัดหมายในองค์กร',
    scenario_desc: 'ลดการใช้กระดาษและเพิ่มความเร็วในการสื่อสารสำนักงาน',
    user_role: 'บุคลากรทุกแผนกในสำนักงาน',
    process_type: 'Document & Workflow Automation',
    output_type: 'e-Document และตารางนัดหมาย',
    hint_text: 'Smart Office / e-Office',
    correct_code: 'OAS',
    explanation: 'OAS (Office Automation System) ช่วยลดขั้นตอนงานเอกสารและการประสานงานในสำนักงาน'
  }
];

class GameDatabase {
  constructor() {
    this.db = null;
    this.engine = 'none';
  }

  async init() {
    // 1. พยายามโหลด node:sqlite (Built-in ใน Node.js 22.5+)
    try {
      const sqliteModule = await import('node:sqlite');
      if (sqliteModule && sqliteModule.DatabaseSync) {
        this.db = new sqliteModule.DatabaseSync(DB_PATH);
        this.engine = 'node:sqlite (SQLite3 Native)';
        this.setupTables();
        return;
      }
    } catch (_) {
      // Fallback ไปยัง better-sqlite3 หากใช้ Node รุ่นเก่า
    }

    // 2. พยายามโหลด better-sqlite3
    try {
      const BetterSqlite3 = (await import('better-sqlite3')).default;
      this.db = new BetterSqlite3(DB_PATH);
      this.engine = 'better-sqlite3';
      this.setupTables();
      return;
    } catch (err) {
      console.warn('SQLite binary module fallback notice:', err.message);
      throw new Error('ไม่พบโมดูล SQLite กรุณารันด้วย Node.js 22.5+ (มี node:sqlite ในตัว) หรือติดตั้ง better-sqlite3');
    }
  }

  setupTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS is_types (
        code TEXT PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_th TEXT NOT NULL,
        org_level TEXT NOT NULL,
        svg_path TEXT NOT NULL,
        keywords TEXT NOT NULL,
        input_desc TEXT NOT NULL,
        process_desc TEXT NOT NULL,
        output_desc TEXT NOT NULL,
        example_desc TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS curriculum_indicators (
        code TEXT PRIMARY KEY,
        standard_name TEXT NOT NULL,
        description TEXT NOT NULL,
        uni_mapping TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stage TEXT NOT NULL,
        org_name TEXT NOT NULL,
        indicator_code TEXT NOT NULL,
        title TEXT NOT NULL,
        scenario_desc TEXT NOT NULL,
        user_role TEXT NOT NULL,
        process_type TEXT NOT NULL,
        output_type TEXT NOT NULL,
        hint_text TEXT NOT NULL,
        correct_code TEXT NOT NULL,
        explanation TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        student_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        year_level INTEGER DEFAULT 2,
        faculty TEXT DEFAULT 'เทคโนโลยีสารสนเทศ / ครุศาสตร์',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        total_score INTEGER NOT NULL,
        accuracy_pct INTEGER NOT NULL,
        rank_title TEXT NOT NULL,
        stage1_done INTEGER NOT NULL,
        stage2_done INTEGER NOT NULL,
        stage3_done INTEGER NOT NULL,
        type_stats_json TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ตรวจสอบและเติมข้อมูลเริ่มต้น (Seed) หากตารางยังว่าง
    const typeCount = this.db.prepare('SELECT COUNT(*) as cnt FROM is_types').get().cnt;
    if (typeCount === 0) {
      const insertType = this.db.prepare(`
        INSERT INTO is_types (code, name_en, name_th, org_level, svg_path, keywords, input_desc, process_desc, output_desc, example_desc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of SEED_IS_TYPES) {
        insertType.run(
          item.code, item.name_en, item.name_th, item.org_level, item.svg_path,
          item.keywords, item.input_desc, item.process_desc, item.output_desc, item.example_desc
        );
      }
    }

    const indCount = this.db.prepare('SELECT COUNT(*) as cnt FROM curriculum_indicators').get().cnt;
    if (indCount === 0) {
      const insertInd = this.db.prepare(`
        INSERT INTO curriculum_indicators (code, standard_name, description, uni_mapping)
        VALUES (?, ?, ?, ?)
      `);
      for (const ind of SEED_CURRICULUM_INDICATORS) {
        insertInd.run(ind.code, ind.standard_name, ind.description, ind.uni_mapping);
      }
    }

    const qCount = this.db.prepare('SELECT COUNT(*) as cnt FROM questions').get().cnt;
    if (qCount === 0) {
      const insertQ = this.db.prepare(`
        INSERT INTO questions (stage, org_name, indicator_code, title, scenario_desc, user_role, process_type, output_type, hint_text, correct_code, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const q of SEED_QUESTIONS) {
        insertQ.run(
          q.stage, q.org_name, q.indicator_code, q.title, q.scenario_desc,
          q.user_role, q.process_type, q.output_type, q.hint_text, q.correct_code, q.explanation
        );
      }
    }

    // เติมข้อมูลตัวอย่าง Leaderboard เริ่มต้น 3 รายการหากยังไม่มีข้อมูล
    const sessionCount = this.db.prepare('SELECT COUNT(*) as cnt FROM game_sessions').get().cnt;
    if (sessionCount === 0) {
      const insertSession = this.db.prepare(`
        INSERT INTO game_sessions (student_id, full_name, total_score, accuracy_pct, rank_title, stage1_done, stage2_done, stage3_done, type_stats_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertSession.run('67010201', 'น.ส.กมลชนก รัตนโชติ (ปี 2)', 2480, 95, '🏆 Chief Information Officer (CIO)', 4, 10, 6, JSON.stringify({ TPS: 100, OAS: 100, MIS: 90, DSS: 95, EIS: 100, ES: 90 }));
      insertSession.run('67010214', 'นายธนภัทร ศรีสุวรรณ (ปี 2)', 2150, 85, '⭐ Senior IT Consultant', 4, 10, 6, JSON.stringify({ TPS: 90, OAS: 85, MIS: 85, DSS: 80, EIS: 90, ES: 85 }));
      insertSession.run('67010239', 'น.ส.พิมพ์ชนก วงศ์สวัสดิ์ (ปี 2)', 1890, 80, '⭐ Senior IT Consultant', 4, 9, 6, JSON.stringify({ TPS: 85, OAS: 80, MIS: 80, DSS: 75, EIS: 80, ES: 80 }));
    }
  }

  getAllGameData() {
    const isTypes = this.db.prepare('SELECT * FROM is_types').all().map(r => ({
      ...r,
      keywords: JSON.parse(r.keywords)
    }));
    const indicators = this.db.prepare('SELECT * FROM curriculum_indicators').all();
    const questions = this.db.prepare('SELECT * FROM questions ORDER BY id ASC').all();
    return {
      engine: this.engine,
      dbPath: DB_PATH,
      isTypes,
      indicators,
      questions
    };
  }

  upsertStudent(studentId, fullName, faculty = 'เทคโนโลยีสารสนเทศ / ครุศาสตร์') {
    const stmt = this.db.prepare(`
      INSERT INTO students (student_id, full_name, year_level, faculty)
      VALUES (?, ?, 2, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        full_name = excluded.full_name,
        faculty = excluded.faculty
    `);
    stmt.run(studentId, fullName, faculty);
    return this.db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId);
  }

  saveGameSession(payload) {
    const {
      student_id,
      full_name,
      total_score,
      accuracy_pct,
      rank_title,
      stage1_done,
      stage2_done,
      stage3_done,
      type_stats
    } = payload;

    this.upsertStudent(student_id, full_name);

    const stmt = this.db.prepare(`
      INSERT INTO game_sessions (student_id, full_name, total_score, accuracy_pct, rank_title, stage1_done, stage2_done, stage3_done, type_stats_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      student_id,
      full_name,
      Number(total_score) || 0,
      Number(accuracy_pct) || 0,
      rank_title || 'Junior IS Learner',
      Number(stage1_done) || 0,
      Number(stage2_done) || 0,
      Number(stage3_done) || 0,
      JSON.stringify(type_stats || {})
    );

    return {
      sessionId: Number(info.lastInsertRowid),
      leaderboard: this.getLeaderboard()
    };
  }

  getLeaderboard(limit = 15) {
    return this.db.prepare(`
      SELECT id, student_id, full_name, total_score, accuracy_pct, rank_title, stage1_done, stage2_done, stage3_done, type_stats_json, created_at
      FROM game_sessions
      ORDER BY total_score DESC, accuracy_pct DESC, id DESC
      LIMIT ?
    `).all(limit).map(row => ({
      ...row,
      type_stats: JSON.parse(row.type_stats_json || '{}')
    }));
  }

  addCustomQuestion(q) {
    const stmt = this.db.prepare(`
      INSERT INTO questions (stage, org_name, indicator_code, title, scenario_desc, user_role, process_type, output_type, hint_text, correct_code, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
      q.stage || 'case_study',
      q.org_name,
      q.indicator_code || 'ว 4.2 (ม.4-6)',
      q.title,
      q.scenario_desc,
      q.user_role || 'ผู้ใช้งานในองค์กร',
      q.process_type || 'ประมวลผลสารสนเทศ',
      q.output_type || 'รายงาน/ผลลัพธ์',
      q.hint_text || 'พิจารณาจากระดับผู้ใช้งานและผลลัพธ์ของระบบ',
      q.correct_code,
      q.explanation
    );
    return { id: Number(res.lastInsertRowid) };
  }
}

export const gameDb = new GameDatabase();
export { DB_PATH };
