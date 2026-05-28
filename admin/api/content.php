<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require_auth();
    if (!is_file($contentFile)) {
        json_out(['ok' => false, 'error' => 'ไม่พบ content/site.json'], 404);
    }
    $data = json_decode(file_get_contents($contentFile), true);
    json_out(['ok' => true, 'data' => $data]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_auth();
    $body = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($body) || !isset($body['data']) || !is_array($body['data'])) {
        json_out(['ok' => false, 'error' => 'ข้อมูลไม่ถูกต้อง'], 400);
    }
    $data = $body['data'];
    $data['version'] = 1;
    $data['updatedAt'] = date('c');
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    if (!is_dir(dirname($contentFile))) {
        mkdir(dirname($contentFile), 0755, true);
    }
    if (file_put_contents($contentFile, $json) === false) {
        json_out(['ok' => false, 'error' => 'บันทึกไฟล์ไม่สำเร็จ'], 500);
    }
    json_out(['ok' => true, 'updatedAt' => $data['updatedAt']]);
}

json_out(['ok' => false, 'error' => 'Method not allowed'], 405);
