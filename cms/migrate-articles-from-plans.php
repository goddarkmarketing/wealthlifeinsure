<?php
declare(strict_types=1);

/**
 * ย้ายบทความที่ปนอยู่ใน insurance_plans → articles แล้วลบออกจากแผนประกัน
 *
 * อัปโหลดแล้วเปิด:
 *   ดูก่อน (ไม่แก้): /cms/migrate-articles-from-plans.php?dry=1
 *   รันจริง:         /cms/migrate-articles-from-plans.php?run=1
 *   (ค่าเริ่มต้นย้ายเฉพาะรายการที่ไม่ได้ปักหมุด is_featured=0 เท่านั้น)
 */
require __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$dryRun = isset($_GET['dry']) && $_GET['dry'] !== '0';
$run = ($_GET['run'] ?? '') === '1';
$onlyUnfeatured = ($_GET['only_unfeatured'] ?? '1') !== '0';

if (!$dryRun && !$run) {
    echo "ย้ายบทความที่อยู่ผิดใน «แผนประกัน» ไป «บทความ»\n\n";
    echo "ข้อมูลลูกค้าไม่หาย — ย้ายจากตาราง insurance_plans → articles\n";
    echo "แผนที่ปักหมุด (is_featured=1) จะไม่ถูกแตะต้อง (ค่าเริ่มต้น)\n\n";
    echo "1) สำรองข้อมูลก่อน: หลังบ้าน → สำรองข้อมูล → ดาวน์โหลด zip\n\n";
    echo "2) ดูรายการก่อน (ไม่แก้ DB):\n";
    echo "   /cms/migrate-articles-from-plans.php?dry=1\n\n";
    echo "3) รันจริง + rebuild หน้าเว็บ:\n";
    echo "   /cms/migrate-articles-from-plans.php?run=1\n\n";
    echo "   (ย้ายเฉพาะรายการไม่ได้ปักหมุด — ตรงกับที่ลูกค้าเพิ่ม)\n";
    exit;
}

$db = cms_db();
$root = cms_root();

/** @return array<string,int> */
function article_category_ids(PDO $db): array
{
    static $map = null;
    if ($map !== null) {
        return $map;
    }
    $map = [];
    foreach ($db->query('SELECT id, slug FROM article_categories')->fetchAll() as $row) {
        $map[(string) $row['slug']] = (int) $row['id'];
    }
    $defaults = [
        'life' => 'ประกันชีวิต',
        'health' => 'สุขภาพ',
        'savings' => 'ออมทรัพย์ / ภาษี',
        'guide' => 'คำแนะนำ',
    ];
    $insert = $db->prepare('INSERT INTO article_categories (name, slug, sort_order) VALUES (?,?,?)');
    foreach ($defaults as $slug => $name) {
        if (isset($map[$slug])) {
            continue;
        }
        $insert->execute([$name, $slug, count($map)]);
        $map[$slug] = (int) $db->lastInsertId();
    }
    return $map;
}

function normalize_title(string $title): string
{
    $t = preg_replace('/\s+/u', ' ', trim($title)) ?? trim($title);
    $t = preg_replace('/\d+$/u', '', $t) ?? $t;
    return trim($t);
}

function titles_match(string $a, string $b): bool
{
    $na = normalize_title($a);
    $nb = normalize_title($b);
    if ($na === '' || $nb === '') {
        return false;
    }
    if ($na === $nb) {
        return true;
    }
    similar_text(mb_strtolower($na), mb_strtolower($nb), $pct);
    if ($pct < 92.0) {
        return false;
    }
    $lenA = mb_strlen($na);
    $lenB = mb_strlen($nb);
    if ($lenA === 0 || $lenB === 0) {
        return false;
    }
    $ratio = min($lenA, $lenB) / max($lenA, $lenB);
    return $ratio >= 0.82;
}

function slug_from_link(?string $link): ?string
{
    $link = trim((string) $link);
    if ($link === '') {
        return null;
    }
    if (preg_match('~articles/([^?#]+)\.html~i', $link, $m)) {
        return $m[1];
    }
    return null;
}

function looks_like_article_title(string $name): bool
{
    return (bool) preg_match(
        '/(?:คืออะไร|ควร|อย่างไร|\?|vs|เตรียมตัว|สรุป|หลังทำกรมธรรม์|โรคเดิม|วางแผนมรดก|เลือกประกัน|ลดหย่อนภาษี|เกษียณ)/u',
        $name
    );
}

function is_real_insurance_plan(array $plan): bool
{
    $link = (string) ($plan['link_url'] ?? '');
    $name = (string) ($plan['name'] ?? '');

    if ($link !== '' && (
        str_contains($link, 'plans/')
        || preg_match('~-(insurance|retirement)\.html~i', $link)
        || preg_match('~\.html#[\w-]+$~', $link)
    )) {
        return !str_contains($link, 'articles/');
    }

    if (looks_like_article_title($name)) {
        return false;
    }

    return (bool) preg_match(
        '/(?:มันนี่\s*ฟิต|ธนทวี|เลกาซี|คุ้มธนกิจ|คุ้มทวี|ทรัพย์ปันผล|ทีแอลแพลน|Health Fit DD$|ผู้ป่วยใน|Deductible|OPD)/iu',
        $name
    );
}

/** @return array<string,mixed>|null */
function find_matching_article(PDO $db, array $plan): ?array
{
    $name = (string) ($plan['name'] ?? '');
    $slug = (string) ($plan['slug'] ?? '');
    $linkSlug = slug_from_link((string) ($plan['link_url'] ?? ''));

    if ($linkSlug !== null) {
        $stmt = $db->prepare('SELECT * FROM articles WHERE slug = ? LIMIT 1');
        $stmt->execute([$linkSlug]);
        $row = $stmt->fetch();
        if ($row) {
            return $row;
        }
    }

    if ($slug !== '') {
        $stmt = $db->prepare('SELECT * FROM articles WHERE slug = ? LIMIT 1');
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        if ($row) {
            return $row;
        }
    }

    foreach ($db->query('SELECT * FROM articles')->fetchAll() as $article) {
        if (titles_match($name, (string) ($article['title'] ?? ''))) {
            return $article;
        }
    }

    return null;
}

/** @return array<string,mixed>|null */
function parse_article_html(string $root, string $slug): ?array
{
    $path = $root . '/articles/' . $slug . '.html';
    if (!is_file($path)) {
        return null;
    }
    $html = (string) file_get_contents($path);
    $out = [
        'slug' => $slug,
        'title' => '',
        'eyebrow' => null,
        'hero_lead' => null,
        'excerpt' => null,
        'body_html' => '<p></p>',
        'cover_image' => null,
        'seo_description' => null,
    ];

    if (preg_match('/<meta name="description" content="([^"]*)"/u', $html, $m)) {
        $out['seo_description'] = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $out['excerpt'] = $out['seo_description'];
    }
    if (preg_match('/<p class="eyebrow">([^<]*)<\/p>/u', $html, $m)) {
        $out['eyebrow'] = trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
    if (preg_match('/<h1>([^<]*)<\/h1>/u', $html, $m)) {
        $out['title'] = trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }
    if (preg_match('/<p class="article-hero-lead">([^<]*)<\/p>/u', $html, $m)) {
        $out['hero_lead'] = trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($out['excerpt'] === null) {
            $out['excerpt'] = $out['hero_lead'];
        }
    }
    if (preg_match('/<div class="article-body">([\s\S]*?)<\/div>/u', $html, $m)) {
        $out['body_html'] = trim($m[1]);
    }
    if (preg_match('/<figure class="article-featured">[\s\S]*?<img src="([^"]+)"/u', $html, $m)) {
        $img = $m[1];
        $out['cover_image'] = str_starts_with($img, '../') ? substr($img, 3) : ltrim($img, '/');
    }

    return $out['title'] !== '' ? $out : null;
}

/** @return list<array{plan:array<string,mixed>,reason:string,article:?array<string,mixed>}> */
function detect_misclassified_plans(PDO $db, string $root, bool $onlyUnfeatured): array
{
    $out = [];
    $plans = $db->query('SELECT * FROM insurance_plans ORDER BY sort_order, id')->fetchAll();

    foreach ($plans as $plan) {
        $link = (string) ($plan['link_url'] ?? '');
        $name = (string) ($plan['name'] ?? '');
        $slug = (string) ($plan['slug'] ?? '');
        $featured = (int) ($plan['is_featured'] ?? 0);

        if ($onlyUnfeatured && $featured === 1) {
            continue;
        }

        if (is_real_insurance_plan($plan) && !str_contains($link, 'articles/')) {
            continue;
        }

        $article = find_matching_article($db, $plan);
        $htmlSlug = slug_from_link($link) ?? $slug;
        $htmlExists = is_file($root . '/articles/' . $htmlSlug . '.html');

        $reason = null;
        if ($onlyUnfeatured && $featured === 0) {
            $reason = 'ไม่ได้ปักหมุด — รายการที่ลูกค้าเพิ่ม';
        }
        if (str_contains($link, 'articles/')) {
            $reason = 'link ชี้ไปบทความ';
        } elseif ($article !== null && titles_match($name, (string) ($article['title'] ?? ''))) {
            $reason = 'ชื่อตรงกับบทความ #' . $article['id'];
        } elseif ($htmlExists && looks_like_article_title($name)) {
            $reason = 'มีไฟล์ articles/' . $htmlSlug . '.html';
        } elseif (looks_like_article_title($name) && !is_real_insurance_plan($plan)) {
            $reason = 'ชื่อเหมือนบทความ';
        }

        if ($reason !== null) {
            $out[] = ['plan' => $plan, 'reason' => $reason, 'article' => $article];
        }
    }

    return $out;
}

/** รวมเนื้อหาที่ลูกค้าแก้ในแผน (ผิดตาราง) เข้าบทความ */
function merge_plan_content_into_article(PDO $db, array $plan, array $article): void
{
    $sets = [];
    $vals = [];
    $short = trim((string) ($plan['short_description'] ?? ''));
    $full = trim((string) ($plan['full_description'] ?? ''));
    $image = trim((string) ($plan['image_path'] ?? ''));

    if ($short !== '' && $short !== trim((string) ($article['excerpt'] ?? ''))) {
        $sets[] = 'excerpt = ?';
        $vals[] = $short;
        if (trim((string) ($article['hero_lead'] ?? '')) === '') {
            $sets[] = 'hero_lead = ?';
            $vals[] = $short;
        }
    }
    if ($full !== '' && strlen($full) > 20) {
        $sets[] = 'body_html = ?';
        $vals[] = $full;
    }
    if ($image !== '') {
        $sets[] = 'cover_image = ?';
        $vals[] = $image;
    }
    if (trim((string) ($article['title'] ?? '')) === '' && trim((string) ($plan['name'] ?? '')) !== '') {
        $sets[] = 'title = ?';
        $vals[] = $plan['name'];
    } elseif (
        trim((string) ($plan['name'] ?? '')) !== ''
        && trim((string) ($plan['name'] ?? '')) !== trim((string) ($article['title'] ?? ''))
        && str_contains((string) ($plan['link_url'] ?? ''), 'articles/')
    ) {
        // เก็บชื่อที่ลูกค้าแก้ในแผนประกัน (เช่น เพิ่มข้อความท้ายชื่อ)
        $sets[] = 'title = ?';
        $vals[] = $plan['name'];
    }
    if ($sets === []) {
        return;
    }
    $vals[] = (int) $article['id'];
    $db->prepare('UPDATE articles SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
}

function filter_tag_to_category_slug(string $tag): string
{
    return match ($tag) {
        'life' => 'life',
        'health' => 'health',
        'savings' => 'savings',
        default => 'guide',
    };
}

echo ($dryRun ? "=== DRY RUN (ไม่แก้ DB) ===\n\n" : "=== MIGRATE ===\n\n");
if ($onlyUnfeatured) {
    echo "โหมด: ย้ายเฉพาะรายการไม่ได้ปักหมุด (is_featured=0) — แผนที่ปักหมุดไม่ถูกแตะ\n\n";
}

$items = detect_misclassified_plans($db, $root, $onlyUnfeatured);
if ($items === []) {
    echo "ไม่พบแผนประกันที่เป็นบทความ — ไม่ต้องย้าย\n";
    exit;
}

$catIds = article_category_ids($db);
$created = 0;
$linked = 0;
$removed = 0;

foreach ($items as $item) {
    $plan = $item['plan'];
    $article = $item['article'];
    $pid = (int) $plan['id'];
    $pname = (string) $plan['name'];
    echo "[แผน #{$pid}] {$pname}\n";
    echo "  เหตุผล: {$item['reason']}\n";

    if ($article === null) {
        $slug = slug_from_link((string) ($plan['link_url'] ?? '')) ?: (string) $plan['slug'];
        $parsed = parse_article_html($root, $slug);
        if ($parsed === null) {
            $body = trim((string) ($plan['full_description'] ?? ''));
            if ($body === '') {
                $body = '<p>' . htmlspecialchars((string) ($plan['short_description'] ?? $pname), ENT_QUOTES, 'UTF-8') . '</p>';
            }
            $parsed = [
                'slug' => $slug,
                'title' => $pname,
                'eyebrow' => null,
                'hero_lead' => (string) ($plan['short_description'] ?? ''),
                'excerpt' => (string) ($plan['short_description'] ?? ''),
                'body_html' => $body,
                'cover_image' => (string) ($plan['image_path'] ?? '') ?: null,
                'seo_description' => (string) ($plan['short_description'] ?? ''),
            ];
        }
        $catSlug = filter_tag_to_category_slug((string) ($plan['filter_tag'] ?? 'guide'));
        $catId = $catIds[$catSlug] ?? $catIds['guide'] ?? null;
        echo "  → สร้างบทความใหม่ slug={$parsed['slug']}\n";
        if (!$dryRun) {
            $stmt = $db->prepare(
                'INSERT INTO articles (category_id, slug, title, excerpt, body_html, cover_image, eyebrow, hero_lead, status, published_at, seo_description, sort_order)
                 VALUES (?,?,?,?,?,?,?,?,\'published\',NOW(),?,?)'
            );
            $stmt->execute([
                $catId,
                $parsed['slug'],
                $parsed['title'] ?: $pname,
                $parsed['excerpt'] ?? '',
                $parsed['body_html'] ?: '<p></p>',
                $parsed['cover_image'] ?? $plan['image_path'] ?? null,
                $parsed['eyebrow'] ?? null,
                $parsed['hero_lead'] ?? $parsed['excerpt'] ?? null,
                $parsed['seo_description'] ?? null,
                (int) ($plan['sort_order'] ?? 0),
            ]);
            $created++;
        }
    } else {
        echo "  → มีบทความแล้ว (#{$article['id']} «{$article['title']}»)\n";
        echo "  → รวมเนื้อหาจากแผน (ถ้าลูกค้าแก้ไว้ในแผนประกัน)\n";
        if (!$dryRun) {
            merge_plan_content_into_article($db, $plan, $article);
        }
        $linked++;
    }

    echo "  → ลบออกจาก insurance_plans\n\n";
    if (!$dryRun) {
        $db->prepare('DELETE FROM insurance_plans WHERE id = ?')->execute([$pid]);
        $removed++;
    }
}

if ($dryRun) {
    echo "สรุป (dry run): พบ " . count($items) . " รายการที่จะย้าย\n";
    echo "เปิด ?run=1 เพื่อดำเนินการจริง\n";
    exit;
}

require_once __DIR__ . '/SiteBuilder.php';
$build = SiteBuilder::build();

echo "สรุป:\n";
echo "  สร้างบทความใหม่: {$created}\n";
echo "  มีบทความอยู่แล้ว (ลบแผนซ้ำ): {$linked}\n";
echo "  ลบจากแผนประกัน: {$removed}\n";
echo "  rebuild: {$build['count']} ไฟล์\n";
echo "\nเสร็จแล้ว — ตรวจหลังบ้าน «บทความ» และ «แผนประกัน»\n";
