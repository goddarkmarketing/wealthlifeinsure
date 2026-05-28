# นำเข้าข้อมูล CMS บน Plesk (วิธีที่เสถียรที่สุด)

ใช้เมื่อหลังบ้านว่าง แต่หน้าเว็บมีเนื้อหา (HTML สำเร็จรูป)

## ขั้นตอน

1. phpMyAdmin → เลือก database **`wealthl_cms`**
2. (ถ้าเคย import ค้าง) รัน `plesk-clear-content.sql` ก่อน
3. แท็บ **Import** → เลือก **`plesk-full-seed.sql`**
4. กด **Go** — ต้องไม่มี error แดง
5. Login หลังบ้าน `/admin/v2/` → แดชบอร์ดควรมีบทความ / แผนประกัน / ข้อมูลหน้าแรก

ไม่ลบ user `admin` — ตาราง `users` ไม่ได้อยู่ในไฟล์นี้
