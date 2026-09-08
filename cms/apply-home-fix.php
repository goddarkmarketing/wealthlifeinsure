<?php
/**
 * แก้ครั้งเดียวบนโฮส — อัปแล้วเปิด:
 * https://wealthlifeinsure.com/cms/apply-home-fix.php?run=1
 *
 * สร้างแผน 4 แบบในฐานข้อมูล (ถ้ายังไม่มี) + ปักหมุด + rebuild หน้าแรก
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/SiteBuilder.php';

header('Content-Type: text/plain; charset=utf-8');

if (($_GET['run'] ?? '') !== '1') {
    echo "เปิดลิงก์นี้เพื่อแก้ครั้งเดียว:\n";
    echo "https://wealthlifeinsure.com/cms/apply-home-fix.php?run=1\n";
    exit;
}

$db = cms_db();

/** @return array<int, array<string, mixed>> */
function plan_seed_data(): array
{
    return [
        [
            'slug' => 'money-fit-firm-25-20',
            'name' => 'มันนี่ ฟิต เฟิร์ม 25/20 (มีเงินปันผล)',
            'filter_tag' => 'savings',
            'short_description' => 'ทางเลือกในการออมที่ให้เพิ่มโอกาสรับผลตอบแทนที่สูงขึ้น พร้อมรับความคุ้มครองตลอดสัญญา',
            'image_path' => 'assets/ลดหย่อนภาษี/มันนี่ฟิตเฟิร์ม25-20z-z463899688528.webp',
            'search' => ['%เฟิร์ม 25/20%', '%เฟิร์ม%25/20%', '%Money Fit Firm%25%'],
        ],
        [
            'slug' => 'money-fit-firm-15-10',
            'name' => 'มันนี่ ฟิต เฟิร์ม 15/10 (มีเงินปันผล)',
            'filter_tag' => 'savings',
            'short_description' => 'สร้างวินัยในการออม เพื่ออนาคตที่มั่นคง พร้อมสิทธิลดหย่อนภาษี',
            'image_path' => 'assets/ลดหย่อนภาษี/มันนี่ฟิตเฟิร์ม15_10z-z1745445701834.webp',
            'search' => ['%เฟิร์ม 15/10%', '%เฟิร์ม%15/10%'],
        ],
        [
            'slug' => 'thanthawi-15-8',
            'name' => 'ธนทวี 15/8 (1)',
            'filter_tag' => 'savings',
            'short_description' => 'สร้างหลักประกันเงินออมตอบโจทย์ทุกแผนการในอนาคต พร้อมสิทธิลดหย่อนภาษี',
            'image_path' => 'assets/ลดหย่อนภาษี/ธนทวี15_8(1)z-z44920386445.webp',
            'search' => ['%ธนทวี 15/8%', '%ธนทวี%15/8%'],
        ],
        [
            'slug' => 'money-fit-wealthy-12-6',
            'name' => 'มันนี่ ฟิต เวลท์ตี้ 12/6 (มีเงินปันผล)',
            'filter_tag' => 'savings',
            'short_description' => 'ประกันออมทรัพย์ได้ครบ จบไม่มีเสี่ยง พร้อมโอกาสรับเงินปันผล',
            'image_path' => 'assets/ลดหย่อนภาษี/มันนี่ฟิตเวลท์ตี้12-6z-z1248408699807.webp',
            'search' => ['%เวลท์ตี้ 12/6%', '%เวลท์ตี้%12/6%', '%Wealthy%12/6%'],
        ],
    ];
}

function find_plan_row(PDO $db, array $seed): ?array
{
    $stmt = $db->prepare('SELECT * FROM insurance_plans WHERE slug = ? LIMIT 1');
    $stmt->execute([$seed['slug']]);
    $row = $stmt->fetch();
    if ($row) {
        return $row;
    }
    foreach ($seed['search'] as $like) {
        $stmt = $db->prepare('SELECT * FROM insurance_plans WHERE name LIKE ? LIMIT 1');
        $stmt->execute([$like]);
        $row = $stmt->fetch();
        if ($row) {
            return $row;
        }
    }
    return null;
}

function insert_plan(PDO $db, array $seed, int $sort): int
{
    $listing = json_encode([['section' => 'savings', 'label' => 'แบบประกันไทยประกันชีวิต', 'dataCategory' => 'savings']], JSON_UNESCAPED_UNICODE);
    $stmt = $db->prepare(
        'INSERT INTO insurance_plans
         (filter_tag, listing_sections, name, slug, short_description, image_path, insurer_name,
          is_featured, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?)'
    );
    $stmt->execute([
        $seed['filter_tag'],
        $listing,
        $seed['name'],
        $seed['slug'],
        $seed['short_description'],
        $seed['image_path'],
        'ไทยประกันชีวิต',
        $sort,
    ]);
    return (int) $db->lastInsertId();
}

function esc_html(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function inject_carousel_cards(string $html, array $seeds): string
{
    $inject = '';
    foreach ($seeds as $seed) {
        if (str_contains($html, $seed['name']) || str_contains($html, $seed['slug'])) {
            continue;
        }
        $href = 'plans/' . $seed['slug'] . '.html';
        $name = esc_html($seed['name']);
        $desc = esc_html($seed['short_description']);
        $img = esc_html($seed['image_path']);
        $inject .= '              <article class="solution-item section-reveal" data-category="savings">' . "\n"
            . '                <a class="solution-media" href="' . $href . '" aria-label="ดูรายละเอียด ' . $name . '">' . "\n"
            . '                  <img src="' . $img . '" alt="ภาพแบบประกัน ' . $name . '" loading="lazy" decoding="async">' . "\n"
            . '                </a><div><h3><a href="' . $href . '">' . $name . '</a></h3><p>' . $desc . '</p></div></article>' . "\n";
    }
    if ($inject === '') {
        return $html;
    }
    $replaced = preg_replace(
        '/(<section class="solutions section-reveal" id="cms-section-solutionsHeading"[\s\S]*?<div class="solution-list" data-carousel-track>)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<p class="carousel-empty")/u',
        '$1$2' . $inject . '$3',
        $html,
        1
    );
    return is_string($replaced) ? $replaced : $html;
}

echo "=== plans in DB before ===\n";
$countBefore = (int) $db->query('SELECT COUNT(*) FROM insurance_plans')->fetchColumn();
echo "total_plans={$countBefore}\n";

$maxSort = (int) $db->query(
    "SELECT COALESCE(MAX(sort_order), 0) FROM insurance_plans WHERE is_featured = 1 AND is_active = 1"
)->fetchColumn();
$sort = $maxSort;

$seeds = plan_seed_data();
foreach ($seeds as $seed) {
    $row = find_plan_row($db, $seed);
    if (!$row) {
        $sort++;
        $newId = insert_plan($db, $seed, $sort);
        echo "CREATED id={$newId} | {$seed['name']}\n";
        continue;
    }
    $id = (int) $row['id'];
    if ((int) $row['is_featured'] !== 1) {
        $sort++;
        $db->prepare('UPDATE insurance_plans SET is_featured=1, is_active=1, sort_order=?, slug=?, image_path=COALESCE(NULLIF(image_path,\'\'), ?), short_description=COALESCE(NULLIF(short_description,\'\'), ?) WHERE id=?')
            ->execute([$sort, $seed['slug'], $seed['image_path'], $seed['short_description'], $id]);
        echo "featured id={$id} | {$row['name']}\n";
    } else {
        echo "already_featured id={$id} | {$row['name']}\n";
    }
}

$db->exec(
    "UPDATE page_sections SET is_active = 0
     WHERE page_key = 'home' AND section_key IN ('productCategories', 'taxPlansHeading')"
);
echo "sections_deactivated=productCategories,taxPlansHeading\n";

$result = SiteBuilder::build();
echo 'build_count=' . ($result['count'] ?? 0) . "\n";

$index = cms_root() . '/index.html';
$html = is_file($index) ? (string) file_get_contents($index) : '';
$html2 = inject_carousel_cards($html, $seeds);
if ($html2 !== $html) {
    file_put_contents($index, $html2);
    echo "index_injected=yes\n";
    $html = $html2;
}

foreach ($seeds as $seed) {
    echo (str_contains($html, $seed['name']) ? 'OK ' : 'MISSING ') . $seed['name'] . "\n";
}
echo (str_contains($html, 'cms-section-productCategories') ? 'STILL_HAS ' : 'REMOVED ') . "productCategories\n";
echo (str_contains($html, 'id="tax-plans"') ? 'STILL_HAS ' : 'REMOVED ') . "tax-plans\n";

echo "\nDONE — เปิดหน้าแรกแล้วกด Ctrl+F5\n";
echo "ลบไฟล์ cms/apply-home-fix.php ออกจากโฮสได้\n";
