<?php
declare(strict_types=1);

/**
 * ลบบทความที่ปนใน insurance_plans และ rebuild ลิงก์แผนประกัน
 * รัน: php cms/fix-insurance-plan-links.php
 */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/SiteBuilder.php';

$db = cms_db();
$deleted = $db->exec("DELETE FROM insurance_plans WHERE link_url LIKE '%articles/%'");
echo "Removed article rows from insurance_plans: {$deleted}\n";

$updates = [
    ['เลกาซี ฟิต แคร์ 99/10', 'life-insurance.html#legacy-fit-care-99-10'],
    ['คุ้มธนกิจ 99/20 (Nn)', 'life-insurance.html#khumthanakit-99-20-nn'],
    ['Health Fit DD', 'health-insurance.html#health-fit-dd'],
    ['ทีแอลแพลน', 'savings-retirement.html#tl-plan'],
    ['มันนี่ ฟิต เวลท์ตี้ 18/4', 'savings-retirement.html#money-fit-wealthy-18-4'],
];
$stmt = $db->prepare('UPDATE insurance_plans SET link_url = ? WHERE name = ?');
foreach ($updates as [$name, $url]) {
    $stmt->execute([$url, $name]);
    echo "OK link {$name}\n";
}

$result = SiteBuilder::build();
echo "\nBuild complete: {$result['count']} files\n";
