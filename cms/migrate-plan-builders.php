<?php
/**
 * สร้างบิวเดอร์แยกต่อแผน (page_key = plan-{id}) จากข้อมูลหมวดเดิมถ้ามี
 * รันครั้งเดียวหลังอัปเดตโค้ด: php cms/migrate-plan-builders.php
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$db = cms_db();

$SECTION_KEYS = ['hero', 'whoFor', 'planCards', 'recommendation', 'cta', 'bottomBanners'];
$SECTION_TITLES = [
    'hero' => '1. ส่วนหัวหน้าแบบประกัน',
    'whoFor' => '2. ส่วนเหมาะกับใคร',
    'planCards' => '3. ส่วนรายละเอียดแบบประกัน',
    'recommendation' => '4. ส่วนข้อความแนะนำ',
    'cta' => '5. ส่วน Call to Action',
    'bottomBanners' => '6. ส่วน Banner ด้านล่าง',
];

function plan_tag_page_key(string $tag): string
{
    return match ($tag) {
        'health' => 'healthInsurance',
        'savings' => 'savingsRetirement',
        default => 'lifeInsurance',
    };
}

function load_section_map(PDO $db, string $pageKey): array
{
    $stmt = $db->prepare('SELECT * FROM page_sections WHERE page_key = ?');
    $stmt->execute([$pageKey]);
    $map = [];
    foreach ($stmt->fetchAll() as $row) {
        $cfg = $row['config'] ?? null;
        if (is_string($cfg)) {
            $row['config'] = json_decode($cfg, true) ?: [];
        }
        $map[$row['section_key']] = $row;
    }
    return $map;
}

function find_matching_card(array $cards, array $plan): ?array
{
    $slug = strtolower(trim((string) ($plan['slug'] ?? '')));
    $name = mb_strtolower(trim((string) ($plan['name'] ?? '')));
    foreach ($cards as $card) {
        if (!is_array($card) || ($card['type'] ?? '') === 'dropZone') {
            continue;
        }
        $id = strtolower((string) ($card['id'] ?? ''));
        $anchor = strtolower((string) ($card['anchorId'] ?? $card['id'] ?? ''));
        $title = mb_strtolower(trim((string) ($card['title'] ?? '')));
        if ($slug !== '' && ($id === $slug || $anchor === $slug)) {
            return $card;
        }
        if ($name !== '' && $title !== '' && ($title === $name || str_contains($title, $name) || str_contains($name, $title))) {
            return $card;
        }
    }
    return null;
}

function upsert_section(PDO $db, string $pageKey, string $sectionKey, string $title, array $config, int $sort, int $active): void
{
    $json = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $stmt = $db->prepare('SELECT id FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1');
    $stmt->execute([$pageKey, $sectionKey]);
    $id = $stmt->fetchColumn();
    if ($id) {
        $db->prepare(
            'UPDATE page_sections SET title = ?, is_active = ?, sort_order = ?, config = ? WHERE id = ?'
        )->execute([$title, $active, $sort, $json, $id]);
        return;
    }
    $db->prepare(
        'INSERT INTO page_sections (page_key, section_key, title, is_active, sort_order, config) VALUES (?,?,?,?,?,?)'
    )->execute([$pageKey, $sectionKey, $title, $active, $sort, $json]);
}

$plans = $db->query('SELECT id, name, slug, filter_tag FROM insurance_plans ORDER BY id')->fetchAll();
$catCache = [];
$created = 0;
$skipped = 0;

foreach ($plans as $plan) {
    $pageKey = 'plan-' . (int) $plan['id'];
    $existing = load_section_map($db, $pageKey);
    if (isset($existing['planCards'])) {
        echo "skip {$pageKey} ({$plan['name']}) — already has builder\n";
        $skipped++;
        continue;
    }

    $catKey = plan_tag_page_key((string) $plan['filter_tag']);
    if (!isset($catCache[$catKey])) {
        $catCache[$catKey] = load_section_map($db, $catKey);
    }
    $cat = $catCache[$catKey];

    $catCards = [];
    if (isset($cat['planCards']['config']['cards']) && is_array($cat['planCards']['config']['cards'])) {
        $catCards = $cat['planCards']['config']['cards'];
    }
    $matched = find_matching_card($catCards, $plan);
    $slug = (string) ($plan['slug'] ?: ('plan-' . $plan['id']));
    if ($matched === null) {
        $matched = [
            'id' => $slug,
            'anchorId' => $slug,
            'title' => (string) $plan['name'],
            'type' => 'checklist',
            'bullets' => [],
            'icon' => '',
            'image' => '',
            'videoUrl' => '',
            'buttonText' => '',
            'buttonHref' => '',
        ];
    } else {
        $matched = $matched;
        $matched['id'] = $slug;
        $matched['anchorId'] = $slug;
        if (trim((string) ($matched['title'] ?? '')) === '') {
            $matched['title'] = (string) $plan['name'];
        }
    }

    foreach ($SECTION_KEYS as $i => $sk) {
        $src = $cat[$sk] ?? null;
        $config = is_array($src['config'] ?? null) ? $src['config'] : [];
        if ($sk === 'planCards') {
            $config = array_merge($config, ['cards' => [$matched]]);
        }
        if ($sk === 'hero') {
            $config['h1'] = (string) $plan['name'];
        }
        $active = isset($src['is_active']) ? (int) $src['is_active'] : 1;
        upsert_section($db, $pageKey, $sk, $SECTION_TITLES[$sk], $config, $i, $active);
    }

    echo "created {$pageKey} ← {$catKey} card=" . ($matched['id'] ?? '') . " ({$plan['name']})\n";
    $created++;
}

echo "\nDone. created={$created} skipped={$skipped} total=" . count($plans) . "\n";
