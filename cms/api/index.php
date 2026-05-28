<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    require dirname(__DIR__) . '/bootstrap.php';
    require dirname(__DIR__) . '/Api.php';
    Auth::startSession();
    Api::dispatch();
} catch (Throwable $e) {
    if (!function_exists('cms_json')) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
    cms_json(['ok' => false, 'error' => $e->getMessage()], 500);
}
