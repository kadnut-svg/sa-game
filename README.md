# 🎮 IS Cyber Quest — เกมจำแนกประเภทของระบบสารสนเทศ (Hybrid WebApp & Desktop Edition)

แอปพลิเคชันเกมเพื่อการเรียนรู้สำหรับ **นักศึกษาระดับชั้นปีที่ 2 มหาวิทยาลัย** โดยมีเป้าหมายให้นักศึกษาจำแนกประเภทของระบบสารสนเทศ 6 ประเภท (**TPS, OAS, MIS, DSS, EIS, ES**) เชื่อมโยงกับ **ตัวชี้วัดหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2560** (สาระที่ 4 เทคโนโลยี: มาตรฐาน ว 4.1 และ ว 4.2) พร้อมภาพจำลองสถานการณ์จริงความละเอียดสูงจาก **Nano Banana AI**

---

## 🏗️ สถาปัตยกรรมระบบแบบ Hybrid (รองรับทั้ง WebApp และ Desktop)

1. **โหมด WebApp ออนไลน์ (Frontend: Vercel + Backend/Database: Supabase PostgreSQL)**
   - **Frontend**: Vite (`index.html`, `src/main.js`, `src/api.js`, `vercel.json`) รันบน **Vercel**
   - **Backend & Database**: **Supabase (PostgreSQL + Auto REST API + Row Level Security)** เก็บข้อมูลนักศึกษา คะแนน Leaderboard และคลังข้อสอบแบบ Real-time ผ่านไฟล์ `supabase/schema.sql`
2. **โหมด Desktop ออฟไลน์/ห้องปฏิบัติการ (Electron + Node.js + SQLite)**
   - **Desktop Wrapper**: Electron (`electron/main.cjs`, `electron/preload.cjs`)
   - **Local Backend & DB**: Node.js (`backend/server.js`) + SQLite (`data/is_game.sqlite`)

---

## ☁️ คู่มือการติดตั้ง WebApp บน Supabase (Database) + Vercel (Frontend) อย่างละเอียด

### ขั้นตอนที่ 1: ตั้งค่าฐานข้อมูลและหลังบ้านบน Supabase (ใช้เวลา 2 นาที)
1. ไปที่เว็บไซต์ [https://supabase.com](https://supabase.com) แล้วกด **Sign In** (ล็อกอินด้วยบัญชี GitHub ของคุณได้เลย)
2. กดปุ่มสีเขียว **`New project`**
   - **Name**: ตั้งชื่อโปรเจกต์ เช่น `sa-game-db`
   - **Database Password**: ตั้งรหัสผ่านอะไรก็ได้
   - **Region**: เลือก `Southeast Asia (Singapore)` แล้วกด **`Create new project`**
3. เมื่อสร้างโปรเจกต์เสร็จแล้ว ให้ดูเมนูแถบซ้ายมือ คลิกที่ไอคอน **`SQL Editor`** -> กดปุ่ม **`+ New query`**
4. เปิดไฟล์ **[supabase/schema.sql](./supabase/schema.sql)** ในโปรเจกต์นี้ คัดลอกโค้ด SQL ทั้งหมดไปวางในช่อง SQL Editor แล้วกดปุ่มสีเขียว **`Run`** (มุมขวาล่าง)
   - *ระบบจะสร้างตารางทั้ง 5 ตาราง (`is_types`, `curriculum_indicators`, `questions`, `students`, `game_sessions`) ตั้งค่าสิทธิ์ RLS และเติมข้อมูลเริ่มต้นพร้อมภาพสมจริงให้ทันที!*
5. ไปที่เมนูซ้ายมือคลิก **`Project Settings` (รูปฟันเฟืองด้านล่าง)** -> เลือกหัวข้อ **`API`**
6. คัดลอกค่า 2 ค่านี้เก็บไว้:
   - **Project URL**: เช่น `https://xxxxxxxxxxxx.supabase.co`
   - **Project API Keys (`anon` / `public`)**: โค้ดยาวๆ ที่ขึ้นต้นด้วย `eyJhbGci...`

---

### ขั้นตอนที่ 2: นำโค้ดขึ้น GitHub (`kadnut-svg/sa-game`)
อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์โปรเจกต์ (`index.html`, `package.json`, `vite.config.js`, `vercel.json`, โฟลเดอร์ `src/`, `public/`, `supabase/`, `frontend/`, `backend/`, `electron/`) ขึ้นไปที่ Repository `https://github.com/kadnut-svg/sa-game`

---

### ขั้นตอนที่ 3: ติดตั้งหน้าบ้าน (Frontend) บน Vercel และเชื่อมกับ Supabase (ใช้เวลา 2 นาที)
1. ไปที่เว็บไซต์ [https://vercel.com](https://vercel.com) แล้วกด **Continue with GitHub**
2. ที่หน้า Dashboard ของ Vercel กดปุ่ม **`Add New...`** -> เลือก **`Project`**
3. มองหาชื่อ Repository **`sa-game`** แล้วกดปุ่ม **`Import`**
4. ในหน้า **Configure Project**:
   - **Framework Preset**: เลือกเป็น **`Vite`** (ระบบจะตั้งค่า Build Command เป็น `npm run build` และ Output Directory เป็น `dist` ให้อัตโนมัติตามไฟล์ `vercel.json`)
   - คลิกเปิดหัวข้อ **`Environment Variables`** แล้วเพิ่มค่า 2 ตัวที่คุณคัดลอกมาจาก Supabase ในขั้นตอนที่ 1:
     1. ช่อง **Key**: พิมพ์ `VITE_SUPABASE_URL` | ช่อง **Value**: วาง `Project URL` ของ Supabase -> กด **Add**
     2. ช่อง **Key**: พิมพ์ `VITE_SUPABASE_ANON_KEY` | ช่อง **Value**: วาง `anon public key` ของ Supabase -> กด **Add**
5. กดปุ่ม **`Deploy`** แล้วรอประมาณ 45 วินาที!
6. เมื่อเสร็จสิ้น คุณจะได้ลิงก์เว็บแอป เช่น **`https://sa-game.vercel.app`**
   - บนแถบสถานะด้านบนของเกมจะขึ้นป้ายสีเขียว **`☁️ Supabase Cloud Connected`**
   - นักศึกษาชั้นปีที่ 2 สามารถเข้าเล่นผ่านมือถือ แท็บเล็ต หรือคอมพิวเตอร์ ลงชื่อด้วยรหัสนักศึกษา และกดบันทึกคะแนนขึ้นตาราง Leaderboard ส่วนกลางบน Supabase ได้แบบ Real-time ทันที!

*(หมายเหตุ: หากลืมใส่ Environment Variables ตอน Deploy บน Vercel คุณยังสามารถคลิกปุ่ม **`☁️ ตั้งค่า Supabase Cloud`** บนหน้าเว็บเกม แล้ววาง Project URL กับ Anon Key เพื่อเชื่อมต่อได้ทันทีเช่นกัน)*

---

## 🖥️ วิธีรันในโหมด Desktop App (Electron + Node.js + SQLite)
หากต้องการรันบนเครื่องคอมพิวเตอร์โดยใช้ฐานข้อมูล SQLite ในเครื่อง:
```powershell
cd is-classification-game
npm install
npm run electron:dev
```
หรือดับเบิลคลิกที่ไฟล์ **`รันเกม_Desktop.bat`** ได้เลย
