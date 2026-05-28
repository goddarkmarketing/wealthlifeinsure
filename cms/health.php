<?php
declare(strict_types=1);

/**
 * ตรวจสอบความพร้อม CMS บนโฮสต์ (เปิดครั้งเดียวตอนติดตั้ง แล้วลบไฟล์นี้ได้)
 * https://www.wealthlifeinsure.com/cms/health.php
 */
header('Content-Type: application/json; charset=utf-8');

$root = dirname(__DIR__);
$checks = [];
$ok = true;

$minPhp = '8.0.0';
$phpOk = version_compare(PHP_VERSION, $minPhp, '>=');
$checks['php_version'] = [
    'ok' => $phpOk,
    'value' => PHP_VERSION,
    'required' => '>= ' . $minPhp,
];
$ok = $ok && $phpOk;

$configExists = is_file(__DIR__ . '/config.php');
$secretsExists = is_file(__DIR__ . '/config.secrets.php');
$checks['config_file'] = [
    'ok' => $configExists,
    'path' => 'cms/config.php',
];
$checks['config_secrets'] = [
    'ok' => $secretsExists,
    'path' => 'cms/config.secrets.php',
    'hint' => $secretsExists ? null : 'คัดลอก cms/config.secrets.example.php เป็น cms/config.secrets.php แล้วใส่ค่า DB จาก Plesk',
];
$ok = $ok && $configExists && $secretsExists;

$sessionDir = __DIR__ . '/storage/sessions';
$sessionWritable = is_dir($sessionDir) && is_writable($sessionDir);
if (!$sessionWritable) {
  @mkdir($sessionDir, 0755, true);
  $sessionWritable = is_dir($sessionDir) && is_writable($sessionDir);
}
$checks['session_dir'] = [
    'ok' => $sessionWritable,
    'path' => 'cms/storage/sessions',
    'hint' => $sessionWritable ? null : 'chmod 755 หรือ 775 ให้โฟลเดอร์ cms/storage/sessions',
];
$ok = $ok && $sessionWritable;

$dbOk = false;
$dbMessage = null;
$userCount = null;

if ($configExists) {
    try {
        require __DIR__ . '/bootstrap.php';
        $pdo = cms_db();
        $dbOk = true;
        $userCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $checks['users'] = [
            'ok' => $userCount > 0,
            'count' => $userCount,
            'hint' => $userCount > 0 ? null : 'รัน php cms/install.php หรือ import database/schema.sql แล้วสร้าง user admin',
        ];
        $ok = $ok && $userCount > 0;
    } catch (Throwable $e) {
        $dbMessage = $e->getMessage();
    }
}

$checks['database'] = [
    'ok' => $dbOk,
    'error' => $dbMessage,
    'hint' => $dbOk ? null : 'ตรวจ host, db name, user, password ใน cms/config.php ให้ตรงกับ MySQL ใน Plesk',
];
$ok = $ok && $dbOk;

if ($configExists && $dbOk) {
    try {
        require_once __DIR__ . '/Auth.php';
        Auth::startSession();
        $checks['api_auth_me'] = ['ok' => true, 'note' => 'session + DB พร้อม'];
    } catch (Throwable $e) {
        $checks['api_auth_me'] = ['ok' => false, 'error' => $e->getMessage()];
        $ok = false;
    }
}

echo json_encode([
    'ok' => $ok,
    'ready' => $ok,
    'checks' => $checks,
    'next' => $ok
        ? 'ลบ cms/health.php แล้วเข้า /admin/v2/'
        : 'แก้รายการที่ ok=false แล้วรีเฟรชหน้านี้',
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
