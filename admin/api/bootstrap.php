<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'ยังไม่ได้ตั้งค่า config.php — คัดลอกจาก config.example.php']);
    exit;
}

$config = require $configPath;
$rootDir = dirname(__DIR__, 2);
$contentFile = $rootDir . '/content/site.json';

session_name($config['session_name'] ?? 'wli_admin_session');
session_start();

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_auth(): void
{
    if (empty($_SESSION['admin_logged_in'])) {
        json_out(['ok' => false, 'error' => 'กรุณาเข้าสู่ระบบ'], 401);
    }
}
