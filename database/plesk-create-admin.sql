-- รันใน phpMyAdmin หลัง import schema แล้ว (เลือก database wealthl_cms)
-- สร้าง user admin ถ้ายังไม่มี

INSERT INTO users (username, email, password_hash, role, is_active)
SELECT 'admin', 'admin@wealthlifeinsure.local',
  '$2y$10$eZX1.LAAhyRtWBeREVZRkenN8HaJ.vOqeu5xzQ7uwNd2j.6sfsW/i',
  'super_admin', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
