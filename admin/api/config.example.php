<?php
/**
 * คัดลอกไฟล์นี้เป็น config.php แล้วเปลี่ยนรหัสผ่าน
 * copy config.example.php config.php
 */
return [
    'admin_username' => 'admin',
    // สร้าง hash ใหม่: php -r "echo password_hash('รหัสผ่านของคุณ', PASSWORD_DEFAULT);"
    'admin_password_hash' => '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'session_name' => 'wli_admin_session',
];
