<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$node = trim((string) shell_exec('where node 2>nul') ?: '');
if ($node === '') {
    $node = trim((string) shell_exec('which node 2>/dev/null') ?: '');
}

if ($node === '' && !is_file('C:/Program Files/nodejs/node.exe')) {
    json_out(['ok' => false, 'error' => 'ไม่พบ Node.js — ติดตั้ง Node.js เพื่อสร้างหน้าเว็บ'], 500);
}

$nodeBin = 'node';
if ($node === '' && is_file('C:/Program Files/nodejs/node.exe')) {
    $nodeBin = '"C:/Program Files/nodejs/node.exe"';
}
$script = $rootDir . '/scripts/build-site.mjs';
$cmd = $nodeBin . ' ' . escapeshellarg($script) . ' 2>&1';
$output = shell_exec($cmd);

if (!is_file($contentFile)) {
    json_out(['ok' => false, 'error' => 'build failed', 'output' => $output], 500);
}

json_out(['ok' => true, 'output' => $output ?? '']);
