<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');

$expectedUser = (string) ($config['admin_username'] ?? 'admin');
$hash = (string) ($config['admin_password_hash'] ?? '');

if ($username !== $expectedUser || !password_verify($password, $hash)) {
    json_out(['ok' => false, 'error' => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'], 401);
}

$_SESSION['admin_logged_in'] = true;
$_SESSION['admin_username'] = $username;

json_out(['ok' => true]);
