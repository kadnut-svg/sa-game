# IS Architect Quest — แอปพลิเคชันเกมจำแนกประเภทของระบบสารสนเทศ (Desktop App)

แอปพลิเคชันเกมเพื่อการเรียนรู้สำหรับ **นักศึกษาระดับชั้นปีที่ 2 มหาวิทยาลัย** โดยมีเป้าหมายให้นักศึกษาจำแนกประเภทของระบบสารสนเทศ 6 ประเภท (**TPS, OAS, MIS, DSS, EIS, ES**) และเชื่อมโยงกับ **ตัวชี้วัดหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2560** (สาระที่ 4 เทคโนโลยี: มาตรฐาน ว 4.1 และ ว 4.2)

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Tech Stack)
- **Frontend**: Vite (`index.html`, `src/main.js`, `src/api.js`, `src/style.css`)
- **Backend**: Node.js REST API (`backend/server.js`)
- **Database**: SQLite (`backend/database.js` และฐานข้อมูลจริงที่ `data/is_game.sqlite`)
- **Desktop Wrapper**: Electron (`electron/main.cjs`, `electron/preload.cjs`)
- **Vector Graphics**: ไฟล์ภาพประกอบแบบ Vector `.svg` ทั้งหมดใน `public/assets/svg/`
  - `pyramid-overview.svg` (พีระมิดระบบสารสนเทศตามระดับองค์กร)
  - `tps.svg` (ระบบประมวลผลรายการประจำวัน)
  - `oas.svg` (ระบบสำนักงานอัตโนมัติ)
  - `mis.svg` (ระบบสารสนเทศเพื่อการจัดการ)
  - `dss.svg` (ระบบสนับสนุนการตัดสินใจ)
  - `eis.svg` (ระบบสารสนเทศสำหรับผู้บริหารระดับสูง)
  - `es.svg` (ระบบผู้เชี่ยวชาญและปัญญาประดิษฐ์)
  - `badge-cio.svg` (ตราสัญลักษณ์ IS Architect)

---

## 🚀 วิธีติดตั้งและรันใช้งานบน Desktop (Electron + Vite + Node.js + SQLite)

1. **ติดตั้ง Node.js (แนะนำรุ่น LTS / v22.5+ ซึ่งมี `node:sqlite` ในตัว)**
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
2. **ติดตั้ง Dependencies ของโปรเจกต์**
   ```powershell
   cd is-classification-game
   npm install
   ```
3. **รันโหมดพัฒนาบน Desktop ด้วย Electron (เปิดทั้ง Node.js SQLite Backend + Vite + หน้าต่าง Electron)**
   ```powershell
   npm run electron:dev
   ```
4. **หรือรันแบบ Production Desktop App**
   ```powershell
   npm run electron:start
   ```
5. **หรือรันเฉพาะ Vite Web + Node.js SQLite Backend บนเบราว์เซอร์**
   ```powershell
   npm run dev
   ```
