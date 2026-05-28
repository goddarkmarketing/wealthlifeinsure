# Wealth Life Insure — CMS แบบเต็มระบบ

ระบบหลังบ้านแบบ CMS จริง ใช้ **MySQL + PHP API + Admin Dashboard v2**  
ข้อมูลทั้งหมดอยู่ในฐานข้อมูล — หน้าเว็บสร้างจาก DB ผ่านปุ่ม **สร้างหน้าเว็บจาก DB**

## ติดตั้ง (XAMPP)

1. สร้าง secrets (ครั้งเดียว):
   ```bash
   copy cms\config.secrets.example.php cms\config.secrets.php
   ```
   แก้ค่า `db` ถ้าจำเป็น (`cms/config.php` ตั้ง URL ให้อัตโนมัติ)

2. ติดตั้งฐานข้อมูล:
   ```bash
   php cms/install.php
   ```

3. นำเข้าข้อมูลจากเว็บเดิม:
   ```bash
   php cms/migrate-from-site.php
   ```

4. เปิดแอดมิน:
   ```
   http://localhost/wealthlifeinsure.com/admin/v2/
   ```
   - ผู้ใช้: `admin`
   - รหัสผ่าน: `wealthlife2026`

## Production (wealthlifeinsure.com)

- หน้าเว็บ: `https://www.wealthlifeinsure.com/` (หรือ `https://wealthlifeinsure.com/`)
- หลังบ้าน CMS: `https://www.wealthlifeinsure.com/admin/v2/`

หลัง Pull จาก Git: สร้าง `cms/config.secrets.php` บนโฮสต์ (คัดลอกจาก `config.secrets.example.php`) แล้วใส่ค่า `db` จาก Plesk  
`cms/config.php` จะตั้ง `site_url` / `upload_url` ให้ production อัตโนมัติ

แนะนำตั้ง redirect 301 จากโดเมนเก่า (ถ้ามี) มา `https://www.wealthlifeinsure.com`

### หลังบ้านขึ้น HTTP 500 (เข้าไม่ได้)

1. เปิดตรวจสอบ: `https://www.wealthlifeinsure.com/cms/health.php`  
   ดูรายการที่ `"ok": false` แล้วแก้ตาม `hint`
2. สร้าง `cms/config.secrets.php` บนโฮสต์ ใส่ค่า DB จาก Plesk (ไฟล์นี้ไม่ commit)
3. Import ฐานข้อมูล: อัปโหลด `database/schema.sql` ผ่าน phpMyAdmin  
   หรือ SSH: `php cms/install.php`
4. ตั้ง PHP **8.0+** ใน Plesk สำหรับโดเมนนี้
5. ให้สิทธิ์เขียนโฟลเดอร์ `cms/storage/sessions` และ `uploads`
6. เมื่อ health ขึ้น `"ready": true` แล้วลบ `cms/health.php` (แนะนำ)

5. หลังแก้ไขในแอดมิน → กด **สร้างหน้าเว็บจาก DB** (หรือ `php -r "require 'cms/bootstrap.php'; require 'cms/SiteBuilder.php'; SiteBuilder::build();"`)

## โมดูลในแอดมิน (15 เมนู)

| เมนู | ความสามารถ |
|------|------------|
| แดชบอร์ด | สรุปบทความ / แผน / ลีด / รีวิว + ลิงก์ลัด |
| เมนูนำทาง | CRUD, เปิด/ปิด, ลากเรียงลำดับ |
| หน้าแรก | ทุก Section + สไลด์ Hero |
| แบนเนอร์ | CRUD, อัปโหลดรูป, เรียงลำดับ |
| หมวดประกัน | ประเภทประกัน + SEO |
| แผนประกัน | สินค้า/แผน, Hot, แนะนำ, เรียงลำดับ |
| บทความ | บทความ + อาชีพ, Rich Text (Quill) |
| รีวิวลูกค้า | CRUD, ดาว, เรียงลำดับ |
| ลีด / ติดต่อ | ฟอร์มติดต่อ, สถานะ, Export CSV |
| ช่องทางติดต่อ | LINE, โทร, Facebook ฯลฯ |
| ส่วนท้ายเว็บ | แบรนด์, ลิงก์, ลิขสิทธิ์ |
| SEO | Meta ทุกหน้า |
| คลังสื่อ | อัปโหลด jpg/png/webp/svg/pdf |
| ผู้ใช้ | Super Admin / Admin / Editor |
| ตั้งค่าระบบ | ชื่อเว็บ, โลโก้, Maintenance, Scripts |

## API

- Base: `/cms/api/index.php?path=/resource`
- ตัวอย่าง: `?path=/dashboard/stats`, `?path=/plans`, `POST ?path=/public/contact`

## โครงสร้างไฟล์

```
database/schema.sql     — สคีมา MySQL
cms/                    — PHP core, Api, SiteBuilder, migrate
admin/v2/               — Dashboard UI
uploads/                — ไฟล์อัปโหลด
content/site.json       — สำรอง/นำเข้า (ไม่ใช่แหล่งหลักแล้ว)
```

## GitHub Pages

GitHub Pages **ไม่รัน PHP/MySQL** — workflow แนะนำ:

1. แก้ไขบน XAMPP ผ่าน CMS
2. กดสร้างหน้าเว็บจาก DB
3. `git push` ไฟล์ HTML + `assets/` ที่ build แล้ว

## ฟอร์มติดต่อ

`contact.html` ส่งข้อมูลไป `POST /public/contact` → ตาราง `leads` ในแอดมิน
