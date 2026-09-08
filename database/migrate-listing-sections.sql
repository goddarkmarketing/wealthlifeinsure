-- รันใน phpMyAdmin บนโฮสต์ (เลือก database CMS) ถ้า build ยัง error เรื่อง listing_sections
-- ถ้ามี column นี้แล้ว ไม่ต้องรันซ้ำ

ALTER TABLE insurance_plans
  ADD COLUMN listing_sections JSON NULL
  COMMENT 'กลุ่มแสดงใน insurance.html tax-plan grid'
  AFTER filter_tag;
