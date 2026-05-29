<?php
declare(strict_types=1);

/**
 * คืนหน้า about/insurance จากเทมเพลตต้นฉบับ + build ใหม่
 * เปิดครั้งเดียวหลัง deploy: /cms/restore-page-templates.php
 */
require __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$root = cms_root();
$tplDir = __DIR__ . '/templates/pages';
if (!is_dir($tplDir)) {
    echo "ไม่พบโฟลเดอร์ templates/pages\n";
    exit(1);
}

foreach (['about.html', 'insurance.html'] as $file) {
    $src = $tplDir . '/' . $file;
    $dest = $root . '/' . $file;
    if (!is_file($src)) {
        echo "SKIP {$file} — ไม่มีเทมเพลต\n";
        continue;
    }
    if (!copy($src, $dest)) {
        echo "FAIL {$file} — copy ไม่ได้ (ตรวจสิทธิ์ไฟล์)\n";
        continue;
    }
    echo "RESTORED {$file}\n";
}

require __DIR__ . '/SiteBuilder.php';
$result = SiteBuilder::build();
echo "\nBuild complete: {$result['count']} files\n";
