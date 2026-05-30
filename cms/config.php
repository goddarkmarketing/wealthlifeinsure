<?php
declare(strict_types=1);

/**
 * Config หลัก — commit ขึ้น Git ได้
 * รหัสผ่าน DB ใส่ใน cms/config.secrets.php (ไม่ commit)
 */
$httpHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$isProduction = $httpHost !== ''
    && (str_contains($httpHost, 'wealthlifeinsure.com'));

$secretsPath = __DIR__ . '/config.secrets.php';
if (!is_file($secretsPath)) {
    throw new RuntimeException(
        $isProduction
            ? 'สร้าง cms/config.secrets.php บนโฮสต์จาก cms/config.secrets.example.php แล้วใส่ค่า DB จาก Plesk'
            : 'สร้าง cms/config.secrets.php จาก cms/config.secrets.example.php (หรือรัน copy cms\\config.secrets.example.php cms\\config.secrets.php)'
    );
}

/** @var array<string,mixed> $secrets */
$secrets = require $secretsPath;
$db = is_array($secrets['db'] ?? null) ? $secrets['db'] : [];

return [
    'db' => [
        'host' => (string) ($db['host'] ?? ($isProduction ? 'localhost' : '127.0.0.1')),
        'port' => (int) ($db['port'] ?? 3306),
        'name' => (string) ($db['name'] ?? 'wealthlife_cms'),
        'user' => (string) ($db['user'] ?? 'root'),
        'pass' => (string) ($db['pass'] ?? ''),
        'charset' => (string) ($db['charset'] ?? 'utf8mb4'),
    ],
    'session_name' => (string) ($secrets['session_name'] ?? 'wli_cms_session'),
    'upload_dir' => dirname(__DIR__) . '/uploads',
    'upload_url' => $isProduction ? '/uploads' : '/wealthlifeinsure.com/uploads',
    'site_root' => dirname(__DIR__),
    'site_url' => $isProduction
        ? 'https://www.wealthlifeinsure.com'
        : 'http://localhost/wealthlifeinsure.com',
    'mail' => [
        'notify_to' => (string) ($secrets['mail']['notify_to'] ?? 'jugkreenoidonpri@gmail.com'),
        'from' => (string) ($secrets['mail']['from'] ?? ($isProduction ? 'noreply@wealthlifeinsure.com' : 'noreply@localhost')),
        'from_name' => (string) ($secrets['mail']['from_name'] ?? 'Wealth Life Insure'),
    ],
    'smtp' => is_array($secrets['smtp'] ?? null) ? $secrets['smtp'] : [],
];
