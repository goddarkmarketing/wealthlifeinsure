<?php
/**
 * ปักหมุดแผนออมที่ลูกค้าแจ้งว่าหายจาก「แบบประกันแนะนำ」
 * ids: 19,20,21,22 — หรือจับจากชื่อถ้า id บนโฮสต่างกัน
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/SiteBuilder.php';

$db = cms_db();

$names = [
    'มันนี่ ฟิต เฟิร์ม 25/20',
    'มันนี่ ฟิต เฟิร์ม 15/10',
    'ธนทวี 15/8',
    'มันนี่ ฟิต เวลท์ตี้ 12/6',
];

$slugs = [
    'money-fit-firm-25-20',
    'money-fit-firm-15-10',
    'thanthawi-15-8',
    'money-fit-wealthy-12-6',
];

$ids = [];
foreach ($slugs as $slug) {
    $stmt = $db->prepare('SELECT id, name, is_featured, image_path FROM insurance_plans WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    if ($row) {
        $ids[] = (int) $row['id'];
        echo "match slug={$slug} id={$row['id']} feat={$row['is_featured']} img=" . ($row['image_path'] ?: '(empty)') . " | {$row['name']}\n";
        continue;
    }
    // fallback by name contains
    $found = null;
    foreach ($names as $n) {
        if (!str_contains($n, explode('-', $slug)[0] === 'thanthawi' ? 'ธนทวี' : 'มันนี่')) {
            // skip loose
        }
    }
    $stmt = $db->prepare('SELECT id, name, is_featured, image_path FROM insurance_plans WHERE name LIKE ? LIMIT 1');
    $like = match ($slug) {
        'money-fit-firm-25-20' => '%เฟิร์ม 25/20%',
        'money-fit-firm-15-10' => '%เฟิร์ม 15/10%',
        'thanthawi-15-8' => '%ธนทวี 15/8%',
        'money-fit-wealthy-12-6' => '%เวลท์ตี้ 12/6%',
        default => $slug,
    };
    $stmt->execute([$like]);
    $row = $stmt->fetch();
    if ($row) {
        $ids[] = (int) $row['id'];
        echo "match name id={$row['id']} feat={$row['is_featured']} | {$row['name']}\n";
    } else {
        echo "NOT_FOUND slug={$slug}\n";
    }
}

if ($ids === []) {
    fwrite(STDERR, "no plans found\n");
    exit(1);
}

// Keep existing featured, add these with sort after current max featured sort
$max = (int) $db->query(
    "SELECT COALESCE(MAX(sort_order), 0) FROM insurance_plans WHERE is_featured = 1 AND is_active = 1"
)->fetchColumn();

$sort = $max + 1;
$upd = $db->prepare('UPDATE insurance_plans SET is_featured = 1, is_active = 1, sort_order = ? WHERE id = ?');
foreach ($ids as $id) {
    $upd->execute([$sort, $id]);
    echo "featured id={$id} sort={$sort}\n";
    $sort++;
}

$result = SiteBuilder::build();
echo 'build_count=' . ($result['count'] ?? 0) . PHP_EOL;

// verify carousel names in index
$html = (string) file_get_contents(cms_root() . '/index.html');
foreach (['มันนี่ ฟิต เฟิร์ม 25/20', 'มันนี่ ฟิต เฟิร์ม 15/10', 'ธนทวี 15/8', 'มันนี่ ฟิต เวลท์ตี้ 12/6'] as $n) {
    echo (str_contains($html, $n) ? 'IN_INDEX ' : 'MISSING_INDEX ') . $n . PHP_EOL;
}
echo "done\n";
