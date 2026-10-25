import sqlite3
import json
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)
db_path = os.path.join(data_dir, "is_game.sqlite")

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.executescript("""
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
""")

is_types = [
  ("TPS", "Transaction Processing System", "ระบบประมวลผลรายการประจำวัน", "ระดับปฏิบัติการ (Operational Level)", "/assets/svg/tps.svg",
   json.dumps(["รายการประจำวัน", "Real-time / Batch", "ข้อมูลโครงสร้างชัดเจน", "ลดเวลาทำงานซ้ำ"], ensure_ascii=False),
   "ข้อมูลธุรกรรมรายวัน เช่น การขายสินค้า การฝาก-ถอนเงิน การลงทะเบียนเรียน",
   "การบันทึก จัดเรียง คำนวณ และปรับปรุงฐานข้อมูลพื้นฐานอย่างรวดเร็วและแม่นยำ",
   "ใบเสร็จรับเงิน รายการบันทึกธุรกรรม รายงานสรุปยอดประจำวัน",
   "ระบบ POS คิดเงินที่แคชเชียร์ร้านค้าปลีก, ระบบตู้ ATM, ระบบเช็กอินที่นั่งสายการบิน"),
  ("OAS", "Office Automation System", "ระบบสำนักงานอัตโนมัติ", "ระดับปฏิบัติการและงานเอกสาร (Knowledge / Office Level)", "/assets/svg/oas.svg",
   json.dumps(["งานเอกสารดิจิทัล", "การสื่อสารในองค์กร", "นัดหมาย/ประชุม", "เพิ่มประสิทธิภาพสำนักงาน"], ensure_ascii=False),
   "เอกสาร ข้อความ ตารางนัดหมาย ข้อมูลการติดต่อสื่อสารระหว่างแผนก",
   "การจัดพิมพ์ ส่งต่อ ลงนามดิจิทัล จัดเก็บเอกสารออนไลน์ และประสานงานร่วมกัน",
   "หนังสือราชการอิเล็กทรอนิกส์ (e-Document), ตารางนัดหมาย, อีเมล, การประชุมทางไกล",
   "ระบบสารบรรณอิเล็กทรอนิกส์ (e-Office), Microsoft 365 / Google Workspace ในองค์กร"),
  ("MIS", "Management Information System", "ระบบสารสนเทศเพื่อการจัดการ", "ระดับบริหารกลาง (Management Level)", "/assets/svg/mis.svg",
   json.dumps(["รายงานตามรอบเวลา", "สรุปผลเปรียบเทียบแผน", "ปัญหาที่มีโครงสร้างชัดเจน", "ดึงข้อมูลจาก TPS"], ensure_ascii=False),
   "ข้อมูลสรุปรวมที่ผ่านการประมวลผลจากระบบ TPS",
   "การจัดกลุ่ม สรุปผล เปรียบเทียบยอดจริงกับแผนงาน (Scheduled & Exception Report)",
   "รายงานสรุปยอดขายรายเดือน/ไตรมาส, รายงานสิ่งผิดปกติ (Exception Report)",
   "ระบบรายงานสรุปยอดขายรายเดือนของผู้จัดการสาขา, ระบบติดตามงบประมาณก่อสร้างรายไตรมาส"),
  ("DSS", "Decision Support System", "ระบบสนับสนุนการตัดสินใจ", "ระดับบริหารกลางและนักวิเคราะห์ (Management / Analytical Level)", "/assets/svg/dss.svg",
   json.dumps(["ปัญหากึ่งมีโครงสร้าง", "จำลองสถานการณ์ (What-if)", "วิเคราะห์ทางเลือก", "ยืดหยุ่นสูง"], ensure_ascii=False),
   "ข้อมูลจากทั้งภายใน (TPS/MIS) และข้อมูลภายนอกองค์กร + ตัวแบบคณิตศาสตร์/สถิติ",
   "การวิเคราะห์เชิงโต้ตอบ การจำลองสถานการณ์ (What-if Analysis, Sensitivity Analysis)",
   "ทางเลือกในการตัดสินใจ พยากรณ์ผลลัพธ์หากปรับเปลี่ยนตัวแปรธุรกิจ",
   "ระบบจำลองการปรับราคาน้ำมันต่อต้นทุนขนส่ง, ระบบวิเคราะห์พอร์ตการลงทุนและจำลองความเสี่ยง"),
  ("EIS", "Executive Information System (ESS)", "ระบบสารสนเทศสำหรับผู้บริหารระดับสูง", "ระดับกลยุทธ์ (Strategic Level)", "/assets/svg/eis.svg",
   json.dumps(["วิสัยทัศน์ระยะยาว 3-5 ปี", "ปัญหาไม่มีโครงสร้าง", "Dashboard / Drill-down", "ข้อมูลคู่แข่ง/ตลาด"], ensure_ascii=False),
   "ข้อมูลสรุปภาพรวมทั้งองค์กร + ข้อมูลเศรษฐกิจ คู่แข่ง และแนวโน้มอุตสาหกรรมภายนอก",
   "การแสดงผลกราฟิกเชิงกลยุทธ์ การเจาะลึกข้อมูล (Drill-down) และติดตาม KPI ระดับองค์กร",
   "Executive Dashboard แสดงดัชนีชี้วัดความสำเร็จ (KPI) และแนวโน้มเชิงกลยุทธ์",
   "ระบบ Strategic Dashboard ของอธิการบดีหรือ CEO สำหรับวางแผนทิศทางองค์กร 5 ปี"),
  ("ES", "Expert System & AI", "ระบบผู้เชี่ยวชาญและปัญญาประดิษฐ์", "ระบบฐานความรู้เฉพาะทาง (Knowledge / Specialized Level)", "/assets/svg/es.svg",
   json.dumps(["ฐานความรู้ (Knowledge Base)", "กลไกอนุมาน (Inference Engine)", "เลียนแบบผู้เชี่ยวชาญ", "วินิจฉัยเฉพาะทาง"], ensure_ascii=False),
   "อาการ/ข้อมูลปัญหาเฉพาะทาง + กฎเกณฑ์ความรู้จากผู้เชี่ยวชาญมนุษย์",
   "การอนุมานด้วยกฎ (Rule-based Inference) หรือโมเดลปัญญาประดิษฐ์เพื่อหาข้อสรุป",
   "คำวินิจฉัย ข้อเสนอแนะเชิงลึก หรือการตัดสินใจแทนผู้เชี่ยวชาญเฉพาะด้าน",
   "ระบบวินิจฉัยโรคพืชของกรมส่งเสริมการเกษตร, ระบบวิเคราะห์สาเหตุเครื่องจักรขัดข้องในโรงงาน")
]

cur.executemany("""
INSERT OR REPLACE INTO is_types (code, name_en, name_th, org_level, svg_path, keywords, input_desc, process_desc, output_desc, example_desc)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", is_types)

indicators = [
  ("ว 4.1 (ม.4-6)", "มาตรฐาน ว 4.1 การออกแบบและเทคโนโลยี (หลักสูตรแกนกลางฯ 2560)",
   "วิเคราะห์แนวคิดหลักของเทคโนโลยีและระบบสารสนเทศ (Input–Process–Output–Feedback) เพื่อเลือกใช้ระบบให้เหมาะสมกับระดับปัญหาและความต้องการขององค์กร",
   "สมรรถนะปีที่ 2: จำแนกโครงสร้างระบบสารสนเทศตามระดับพีระมิดองค์กร (Operational, Management, Strategic)"),
  ("ว 4.2 (ม.4-6)", "มาตรฐาน ว 4.2 วิทยาการคำนวณ (หลักสูตรแกนกลางฯ 2560)",
   "รวบรวม ประเมิน และใช้ข้อมูลสารสนเทศในการแก้ปัญหาหรือสนับสนุนการตัดสินใจอย่างมีประสิทธิภาพ รู้เท่าทันบทบาทของระบบอัตโนมัติและปัญญาประดิษฐ์ (ES/AI)",
   "สมรรถนะปีที่ 2: วิเคราะห์กรณีศึกษาธุรกิจเพื่อเลือกระบบ TPS, OAS, MIS, DSS, EIS และ ES ได้อย่างถูกต้อง")
]

cur.executemany("""
INSERT OR REPLACE INTO curriculum_indicators (code, standard_name, description, uni_mapping)
VALUES (?, ?, ?, ?)
""", indicators)

cur.execute("DELETE FROM game_sessions")
cur.executemany("""
INSERT INTO game_sessions (student_id, full_name, total_score, accuracy_pct, rank_title, stage1_done, stage2_done, stage3_done, type_stats_json)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", [
  ("67010201", "น.ส.กมลชนก รัตนโชติ (ปี 2)", 2480, 95, "🏆 Chief Information Officer (CIO)", 4, 10, 6, "{}"),
  ("67010214", "นายธนภัทร ศรีสุวรรณ (ปี 2)", 2150, 85, "⭐ Senior IT Consultant", 4, 10, 6, "{}"),
  ("67010239", "น.ส.พิมพ์ชนก วงศ์สวัสดิ์ (ปี 2)", 1890, 80, "⭐ Senior IT Consultant", 4, 9, 6, "{}")
])

conn.commit()
conn.close()
print("SQLite DB initialized successfully!")

