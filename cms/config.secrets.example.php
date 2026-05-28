<?php
/**
 * คัดลอกเป็น cms/config.secrets.php แล้วใส่ค่าจริง
 *
 * XAMPP: ใช้ user root, pass ว่าง (ตามค่าเริ่มต้น)
 * Plesk: ดูชื่อ DB / user / password จาก Domains → Databases
 */
return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'wealthlife_cms',
        'user' => 'YOUR_PLESK_DB_USER',
        'pass' => 'YOUR_PLESK_DB_PASSWORD',
        'charset' => 'utf8mb4',
    ],
];
