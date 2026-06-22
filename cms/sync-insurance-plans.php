<?php
declare(strict_types=1);

/**
 * Sync แผนประกันจาก insurance.html → insurance_plans + seed categories
 * เปิด: /cms/sync-insurance-plans.php?build=1
 */
require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/SiteBuilder.php';

header('Content-Type: text/plain; charset=utf-8');

$db = cms_db();
$root = dirname(__DIR__);
$htmlPath = $root . '/insurance.html';

if (!is_file($htmlPath)) {
    echo "ไม่พบ insurance.html\n";
    exit(1);
}

$html = (string) file_get_contents($htmlPath);

/** @var array<string,int> */
$categoryIds = [];

function mergeListingSectionsJson(?string $a, ?string $b): array
{
    $decode = static function (?string $raw): array {
        if ($raw === null || $raw === '' || $raw === '[]' || $raw === 'null') {
            return [];
        }
        $parsed = json_decode($raw, true);
        return is_array($parsed) ? $parsed : [];
    };
    $merged = [];
    foreach (array_merge($decode($a), $decode($b)) as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $section = (string) ($entry['section'] ?? '');
        if ($section === '') {
            $merged[] = $entry;
            continue;
        }
        $found = false;
        foreach ($merged as $i => $existing) {
            if (($existing['section'] ?? '') === $section) {
                $merged[$i] = array_merge($existing, $entry);
                $found = true;
                break;
            }
        }
        if (!$found) {
            $merged[] = $entry;
        }
    }
    usort($merged, static fn (array $x, array $y): int => ((int) ($x['sort'] ?? 999)) <=> ((int) ($y['sort'] ?? 999)));
    return $merged;
}

function isAsciiSlug(string $slug): bool
{
    return (bool) preg_match('/^[a-z0-9-]+$/', $slug);
}

function dedupePlansByName(PDO $db): int
{
    $rows = $db->query('SELECT * FROM insurance_plans ORDER BY id')->fetchAll();
    $byName = [];
    foreach ($rows as $row) {
        $byName[(string) $row['name']][] = $row;
    }
    $removed = 0;
    $delete = $db->prepare('DELETE FROM insurance_plans WHERE id = ?');
    $update = $db->prepare(
        'UPDATE insurance_plans SET
           slug = ?,
           listing_sections = ?,
           is_featured = ?,
           link_url = COALESCE(?, link_url),
           image_path = COALESCE(?, image_path),
           short_description = COALESCE(?, short_description),
           filter_tag = ?,
           category_id = COALESCE(?, category_id),
           sort_order = LEAST(sort_order, ?),
           updated_at = NOW()
         WHERE id = ?'
    );

    foreach ($byName as $name => $group) {
        if (count($group) < 2) {
            continue;
        }
        $canonicalSlug = SiteBuilder::planSlugPublic($name);
        $keeper = null;
        foreach ($group as $row) {
            if ((string) $row['slug'] === $canonicalSlug) {
                $keeper = $row;
                break;
            }
        }
        if ($keeper === null) {
            usort($group, static function (array $a, array $b): int {
                $asciiA = isAsciiSlug((string) $a['slug']) ? 0 : 1;
                $asciiB = isAsciiSlug((string) $b['slug']) ? 0 : 1;
                if ($asciiA !== $asciiB) {
                    return $asciiA <=> $asciiB;
                }
                return ((int) $a['id']) <=> ((int) $b['id']);
            });
            $keeper = $group[0];
        }

        $listing = (string) ($keeper['listing_sections'] ?? '');
        $featured = (int) ($keeper['is_featured'] ?? 0);
        $sort = (int) ($keeper['sort_order'] ?? 999);
        $link = $keeper['link_url'] ?? null;
        $image = $keeper['image_path'] ?? null;
        $short = $keeper['short_description'] ?? null;
        $filter = $keeper['filter_tag'] ?? 'all';
        $categoryId = $keeper['category_id'] ?? null;

        foreach ($group as $row) {
            if ((int) $row['id'] === (int) $keeper['id']) {
                continue;
            }
            $listing = json_encode(
                mergeListingSectionsJson($listing, (string) ($row['listing_sections'] ?? '')),
                JSON_UNESCAPED_UNICODE
            );
            $featured = max($featured, (int) ($row['is_featured'] ?? 0));
            $sort = min($sort, (int) ($row['sort_order'] ?? 999));
            if (empty($link) && !empty($row['link_url'])) {
                $link = $row['link_url'];
            }
            if (empty($image) && !empty($row['image_path'])) {
                $image = $row['image_path'];
            }
            if (empty($short) && !empty($row['short_description'])) {
                $short = $row['short_description'];
            }
            if (($filter === 'all' || $filter === '') && !empty($row['filter_tag']) && $row['filter_tag'] !== 'all') {
                $filter = $row['filter_tag'];
            }
            if (empty($categoryId) && !empty($row['category_id'])) {
                $categoryId = $row['category_id'];
            }
            $delete->execute([(int) $row['id']]);
            $removed++;
        }

        $update->execute([
            $canonicalSlug,
            $listing !== '[]' ? $listing : null,
            $featured,
            $link,
            $image,
            $short,
            $filter,
            $categoryId,
            $sort,
            (int) $keeper['id'],
        ]);
    }
    return $removed;
}

function ensureListingSectionsColumn(PDO $db): void
{
    $col = $db->query("SHOW COLUMNS FROM insurance_plans LIKE 'listing_sections'")->fetch();
    if (!$col) {
        $db->exec(
            "ALTER TABLE insurance_plans
             ADD COLUMN listing_sections JSON NULL
             COMMENT 'กลุ่มแสดงใน insurance.html tax-plan grid'
             AFTER filter_tag"
        );
        echo "✓ เพิ่ม column listing_sections\n";
    }
}

function seedCategories(PDO $db): array
{
    $defs = [
        ['name' => 'ประกันชีวิต', 'slug' => 'life', 'sort' => 0],
        ['name' => 'ประกันสุขภาพ', 'slug' => 'health', 'sort' => 1],
        ['name' => 'ออมทรัพย์ / ลดหย่อนภาษี', 'slug' => 'savings', 'sort' => 2],
    ];
    $ids = [];
    $find = $db->prepare('SELECT id FROM insurance_categories WHERE slug = ? LIMIT 1');
    $insert = $db->prepare(
        'INSERT INTO insurance_categories (name, slug, sort_order, is_active)
         VALUES (?,?,?,1)'
    );
    foreach ($defs as $d) {
        $find->execute([$d['slug']]);
        $id = $find->fetchColumn();
        if ($id) {
            $ids[$d['slug']] = (int) $id;
            continue;
        }
        $insert->execute([$d['name'], $d['slug'], $d['sort']]);
        $ids[$d['slug']] = (int) $db->lastInsertId();
    }
    echo '✓ insurance_categories (' . count($ids) . " หมวด)\n";
    return $ids;
}

function slugFromHref(string $href, string $name): string
{
    if (preg_match('~(?:^|/)plans/([^?#]+)\.html~u', $href, $m)) {
        return $m[1];
    }
    return SiteBuilder::planSlugPublic($name);
}

function filterTagForSection(string $section): string
{
    return match ($section) {
        'health' => 'health',
        'senior' => 'life',
        default => 'savings',
    };
}

/** @return list<array<string,mixed>> */
function parseFeaturedCarousel(string $html): array
{
    $items = [];
    if (!preg_match_all(
        '/<article class="solution-item[^"]*" data-category="([^"]+)">[\s\S]*?<img src="([^"]+)"[\s\S]*?<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>[\s\S]*?<p>([^<]*)<\/p>/u',
        $html,
        $m,
        PREG_SET_ORDER
    )) {
        return $items;
    }
    foreach ($m as $i => $row) {
        $name = html_entity_decode(trim($row[4]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $items[] = [
            'filter_tag' => $row[1],
            'image_path' => $row[2],
            'link_url' => $row[3],
            'name' => $name,
            'short_description' => html_entity_decode(trim($row[5]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'slug' => slugFromHref($row[3], $name),
            'is_featured' => 1,
            'sort_order' => $i,
        ];
    }
    return $items;
}

/** @return list<array<string,mixed>> */
function parseListingBlocks(string $html): array
{
    $sectionMap = [
        'ins-type-savings' => 'savings',
        'ins-type-child' => 'child',
        'ins-type-senior' => 'senior',
        'ins-type-health' => 'health',
    ];
    $entries = [];
    if (!preg_match_all(
        '/<section class="insurance-type-block section-reveal" aria-labelledby="(ins-type-[^"]+)">[\s\S]*?<div class="tax-plan-grid[^"]*">([\s\S]*?)<\/div>\s*<\/section>/u',
        $html,
        $blocks,
        PREG_SET_ORDER
    )) {
        return $entries;
    }
    foreach ($blocks as $block) {
        $sectionKey = $sectionMap[$block[1]] ?? $block[1];
        if (!preg_match_all('/<article class="tax-plan-card[\s\S]*?<\/article>/u', $block[2], $cards)) {
            continue;
        }
        foreach ($cards[0] as $sort => $card) {
            if (!preg_match('/<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>/u', $card, $title)) {
                continue;
            }
            preg_match('/<span>([^<]*)<\/span>/u', $card, $short);
            preg_match('/<img src="([^"]+)"/u', $card, $image);
            preg_match('/<div class="tax-plan-content">\s*<p>([^<]*)<\/p>/u', $card, $label);
            preg_match('/data-tax-plan-category="([^"]+)"/u', $card, $dataCat);
            $name = html_entity_decode(trim($title[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $href = html_entity_decode(trim($title[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $listingEntry = [
                'section' => $sectionKey,
                'sort' => $sort,
                'label' => html_entity_decode(trim($label[1] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'short' => html_entity_decode(trim($short[1] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'image' => trim($image[1] ?? ''),
            ];
            if (!empty($dataCat[1])) {
                $listingEntry['dataCategory'] = $dataCat[1];
            }
            $entries[] = [
                'name' => $name,
                'slug' => slugFromHref($href, $name),
                'link_url' => $href,
                'image_path' => trim($image[1] ?? ''),
                'short_description' => html_entity_decode(trim($short[1] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'filter_tag' => filterTagForSection($sectionKey),
                'listing_entry' => $listingEntry,
            ];
        }
    }
    return $entries;
}

/** @param array<string,mixed> $existing @param array<string,mixed> $incoming */
function mergeListingEntry(array $existing, array $incoming): array
{
    $list = is_array($existing) ? $existing : [];
    $section = (string) ($incoming['section'] ?? '');
    $found = false;
    foreach ($list as $i => $item) {
        if (!is_array($item)) {
            continue;
        }
        if (($item['section'] ?? '') === $section) {
            $list[$i] = array_merge($item, $incoming);
            $found = true;
            break;
        }
    }
    if (!$found) {
        $list[] = $incoming;
    }
    usort($list, static fn (array $a, array $b): int => ((int) ($a['sort'] ?? 999)) <=> ((int) ($b['sort'] ?? 999)));
    return $list;
}

/** @param array<string,array<string,mixed>> $plansBySlug */
function upsertPlan(PDO $db, array $plan, array $categoryIds): void
{
    static $select = null;
    static $insert = null;
    static $update = null;
    if ($select === null) {
        $select = $db->prepare('SELECT * FROM insurance_plans WHERE slug = ? LIMIT 1');
        $insert = $db->prepare(
            'INSERT INTO insurance_plans
             (category_id, filter_tag, listing_sections, name, slug, short_description, image_path, link_url, is_featured, is_active, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        );
        $update = $db->prepare(
            'UPDATE insurance_plans SET
               category_id = COALESCE(?, category_id),
               filter_tag = COALESCE(?, filter_tag),
               listing_sections = ?,
               name = ?,
               short_description = COALESCE(?, short_description),
               image_path = COALESCE(?, image_path),
               link_url = COALESCE(?, link_url),
               is_featured = GREATEST(is_featured, ?),
               is_active = 1,
               sort_order = LEAST(sort_order, ?),
               updated_at = NOW()
             WHERE slug = ?'
        );
    }

    $slug = (string) $plan['slug'];
    $select->execute([$slug]);
    $existing = $select->fetch();

    $listing = [];
    if ($existing) {
        $raw = $existing['listing_sections'] ?? null;
        if (is_string($raw)) {
            $listing = json_decode($raw, true) ?: [];
        } elseif (is_array($raw)) {
            $listing = $raw;
        }
    }
    if (!empty($plan['listing_sections'])) {
        $listing = is_array($plan['listing_sections']) ? $plan['listing_sections'] : [];
    }
    if (!empty($plan['listing_entry'])) {
        $listing = mergeListingEntry($listing, $plan['listing_entry']);
    }

    $filterTag = (string) ($plan['filter_tag'] ?? 'all');
    $categoryId = $categoryIds[$filterTag] ?? null;
    $listingJson = $listing !== [] ? json_encode($listing, JSON_UNESCAPED_UNICODE) : null;
    $isFeatured = (int) ($plan['is_featured'] ?? 0);
    $sortOrder = (int) ($plan['sort_order'] ?? 999);

    if ($existing) {
        $update->execute([
            $categoryId,
            $filterTag !== 'all' ? $filterTag : null,
            $listingJson,
            $plan['name'],
            $plan['short_description'] ?? null,
            $plan['image_path'] ?? null,
            $plan['link_url'] ?? null,
            $isFeatured,
            $sortOrder,
            $slug,
        ]);
        return;
    }

    $insert->execute([
        $categoryId,
        $filterTag,
        $listingJson,
        $plan['name'],
        $slug,
        $plan['short_description'] ?? null,
        $plan['image_path'] ?? null,
        $plan['link_url'] ?? null,
        $isFeatured,
        1,
        $sortOrder,
    ]);
}

function fixHealthPageBuilderCard(PDO $db): void
{
    $stmt = $db->prepare(
        "SELECT id, config FROM page_sections
         WHERE page_key = 'healthInsurance' AND section_key = 'planCards' LIMIT 1"
    );
    $stmt->execute();
    $row = $stmt->fetch();
    if (!$row) {
        echo "⚠ ไม่พบ page_sections healthInsurance/planCards\n";
        return;
    }
    $cfg = json_decode((string) $row['config'], true);
    if (!is_array($cfg) || empty($cfg['cards']) || !is_array($cfg['cards'])) {
        return;
    }
    $changed = false;
    foreach ($cfg['cards'] as &$card) {
        if (!is_array($card)) {
            continue;
        }
        $title = (string) ($card['title'] ?? '');
        if ($title === 'จุดเด่นของ Health Fit DD' || str_contains($title, 'จุดเด่นของ Health Fit DD')) {
            $card['title'] = 'Health Fit DD';
            $card['anchorId'] = 'health-fit-dd';
            $changed = true;
        }
    }
    unset($card);
    if (!$changed) {
        echo "✓ Health Fit DD card title ตรงแล้ว\n";
        return;
    }
    $upd = $db->prepare('UPDATE page_sections SET config = ?, updated_at = NOW() WHERE id = ?');
    $upd->execute([json_encode($cfg, JSON_UNESCAPED_UNICODE), $row['id']]);
    echo "✓ แก้ชื่อการ์ด Health Fit DD ใน Page Builder\n";
}

echo "=== Sync insurance plans ===\n\n";

ensureListingSectionsColumn($db);
$removed = dedupePlansByName($db);
if ($removed > 0) {
    echo "✓ ลบแผนซ้ำ {$removed} รายการ (รวม slug ให้เป็นมาตรฐาน)\n";
}
$categoryIds = seedCategories($db);

/** @var array<string,array<string,mixed>> $merged */
$merged = [];

foreach (parseFeaturedCarousel($html) as $item) {
    $slug = (string) $item['slug'];
    $merged[$slug] = array_merge($merged[$slug] ?? ['slug' => $slug], $item);
}

$listingSortBase = 100;
foreach (parseListingBlocks($html) as $item) {
    $slug = (string) $item['slug'];
    if (!isset($merged[$slug])) {
        $item['sort_order'] = $listingSortBase++;
        $item['is_featured'] = 0;
        $merged[$slug] = $item;
    } else {
        if (empty($merged[$slug]['image_path']) && !empty($item['image_path'])) {
            $merged[$slug]['image_path'] = $item['image_path'];
        }
        if (empty($merged[$slug]['link_url']) && !empty($item['link_url'])) {
            $merged[$slug]['link_url'] = $item['link_url'];
        }
        if (empty($merged[$slug]['short_description']) && !empty($item['short_description'])) {
            $merged[$slug]['short_description'] = $item['short_description'];
        }
    }
    if (!empty($item['listing_entry'])) {
        $accum = $merged[$slug]['listing_sections'] ?? [];
        $merged[$slug]['listing_sections'] = mergeListingEntry($accum, $item['listing_entry']);
    }
    unset($merged[$slug]['listing_entry']);
}

foreach ($merged as $plan) {
    upsertPlan($db, $plan, $categoryIds);
}

$removedAfter = dedupePlansByName($db);
if ($removedAfter > 0) {
    echo "✓ ลบแผนซ้ำหลัง sync อีก {$removedAfter} รายการ\n";
}

$count = (int) $db->query('SELECT COUNT(*) FROM insurance_plans WHERE is_active = 1')->fetchColumn();
$withListing = (int) $db->query(
    "SELECT COUNT(*) FROM insurance_plans
     WHERE is_active = 1 AND listing_sections IS NOT NULL AND listing_sections != '[]'"
)->fetchColumn();
echo "\n✓ upsert แผนรวม {$count} รายการ (listing_sections: {$withListing})\n";

fixHealthPageBuilderCard($db);

if (isset($_GET['build']) && $_GET['build'] !== '0') {
    echo "\n--- SiteBuilder::build() ---\n";
    $result = SiteBuilder::build();
    echo is_array($result) ? json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n" : "done\n";
} else {
    echo "\n(เพิ่ม ?build=1 เพื่อ rebuild หน้าเว็บ)\n";
}

echo "\n=== เสร็จ ===\n";
