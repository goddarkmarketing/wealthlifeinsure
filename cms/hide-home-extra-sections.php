<?php
/**
 * ซ่อน「แบบประกันทั้งหมด」+ Savings & tax บนหน้าแรกของโฮส
 * ไม่ลบแผนประกัน / บทความ / อาชีพ — แค่ปิด section และตัด HTML ออกจาก index.html
 *
 * รันบนโฮสครั้งเดียว: php cms/hide-home-extra-sections.php
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/SiteBuilder.php';

$db = cms_db();
$stmt = $db->prepare(
    "UPDATE page_sections SET is_active = 0
     WHERE page_key = 'home' AND section_key IN ('productCategories', 'taxPlansHeading')"
);
$stmt->execute();
echo 'deactivated_rows=' . $stmt->rowCount() . PHP_EOL;

$index = cms_root() . '/index.html';
$html = (string) file_get_contents($index);
$before = $html;

foreach (['cms-section-productCategories', 'tax-plans'] as $id) {
    $quoted = preg_quote($id, '/');
    $next = preg_replace(
        '/\s*<section\b[^>]*\bid="' . $quoted . '"[^>]*>[\s\S]*?<\/section>/u',
        "\n",
        $html,
        1
    );
    if (is_string($next)) {
        $html = $next;
    }
}

if ($html !== $before) {
    file_put_contents($index, $html);
    echo "index_stripped=yes\n";
} else {
    echo "index_stripped=already_clean_or_ids_missing\n";
}

$result = SiteBuilder::build();
echo 'build_count=' . ($result['count'] ?? 0) . PHP_EOL;

$after = (string) file_get_contents($index);
echo 'has_productCategories=' . (str_contains($after, 'cms-section-productCategories') || str_contains($after, 'แบบประกันทั้งหมด') ? 'yes' : 'no') . PHP_EOL;
echo 'has_tax_plans=' . (str_contains($after, 'id="tax-plans"') ? 'yes' : 'no') . PHP_EOL;
echo 'has_solutions=' . (str_contains($after, 'cms-section-solutionsHeading') ? 'yes' : 'no') . PHP_EOL;
echo "done\n";
