<?php
declare(strict_types=1);

/**
 * ตรวจความสอดคล้อง: หน้าเว็บ vs หลังบ้าน (แผนประกัน / หมวด / Page Builder)
 * เปิด: /cms/audit-insurance-consistency.php
 */
require __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$db = cms_db();
$root = dirname(__DIR__);

function normName(string $s): string
{
    $s = mb_strtolower(trim($s));
    $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
    $s = str_replace(['(nn)', '(nท)', '(1ท)', '(1)'], '', $s);
    return trim($s);
}

function extractPlanNamesFromHtml(string $html): array
{
    $names = [];
    if (preg_match_all('/<h2[^>]*>([^<]+)<\/h2>/u', $html, $m)) {
        foreach ($m[1] as $t) {
            $t = html_entity_decode(trim($t), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            if ($t !== '' && !in_array($t, ['เหมาะกับใคร', 'ใครควรพิจารณาแผนกลุ่มนี้', 'เลือกแผนอย่างไร'], true)) {
                $names[] = $t;
            }
        }
    }
    return array_values(array_unique($names));
}

function extractFeaturedFromInsuranceHtml(string $html): array
{
    $items = [];
    if (preg_match_all('/<article class="solution-item[^"]*"[^>]*data-category="([^"]+)"[\s\S]*?<h3><a[^>]*>([^<]+)<\/a>/u', $html, $m, PREG_SET_ORDER)) {
        foreach ($m as $row) {
            $items[] = ['tag' => $row[1], 'name' => html_entity_decode(trim($row[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8')];
        }
    }
    return $items;
}

function extractTaxPlansFromInsuranceHtml(string $html): array
{
    $items = [];
    if (preg_match_all('/<h3><a href="[^"]+">([^<]+)<\/a><\/h3>/u', $html, $m)) {
        foreach ($m[1] as $t) {
            $items[] = html_entity_decode(trim($t), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
    }
    return array_values(array_unique($items));
}

function planSlugLocal(string $name): string
{
    $s = trim($name);
    if (preg_match('/[\x{0E00}-\x{0E7F}]/u', $s)) {
        $s = str_replace([' ', '/', '(', ')', '.', ',', '–', '—'], '-', $s);
        $s = preg_replace('/-+/', '-', $s) ?? $s;
        return trim($s, '-');
    }
    $s = strtolower($s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? $s;
    return trim($s, '-');
}

function planFilesOnDisk(string $root): array
{
    $dir = $root . '/plans';
    if (!is_dir($dir)) {
        return [];
    }
    $out = [];
    foreach (scandir($dir) ?: [] as $f) {
        if (str_ends_with($f, '.html')) {
            $out[] = $f;
        }
    }
    sort($out);
    return $out;
}

echo "=== AUDIT: ความสอดคล้องหน้าเว็บ vs หลังบ้าน ===\n\n";

// DB categories
echo "--- หมวดประกัน (insurance_categories) ---\n";
$categories = $db->query('SELECT id, name, slug, is_active FROM insurance_categories ORDER BY sort_order, id')->fetchAll();
foreach ($categories as $c) {
    echo sprintf("  [%s] %s (slug: %s)\n", $c['is_active'] ? 'ON' : 'OFF', $c['name'], $c['slug'] ?? '-');
}

// DB plans
echo "\n--- แผนประกันในหลังบ้าน (insurance_plans, active) ---\n";
$plans = $db->query(
    "SELECT id, name, slug, filter_tag, is_featured, is_active, link_url
     FROM insurance_plans
     WHERE is_active = 1
     ORDER BY filter_tag, sort_order, id"
)->fetchAll();
$plansByTag = ['life' => [], 'health' => [], 'savings' => [], 'other' => []];
$dbPlanNames = [];
foreach ($plans as $p) {
    $tag = (string) ($p['filter_tag'] ?? 'other');
    if (!isset($plansByTag[$tag])) {
        $plansByTag[$tag] = [];
    }
    $plansByTag[$tag][] = $p;
    $dbPlanNames[] = $p['name'];
    $feat = ((int) ($p['is_featured'] ?? 0)) ? '★' : ' ';
    echo sprintf("  %s [%s] %s\n", $feat, $tag, $p['name']);
    if (!empty($p['link_url']) && str_contains((string) $p['link_url'], 'articles/')) {
        echo "      ⚠ link ชี้ไปบทความ: {$p['link_url']}\n";
    }
}

// Page builder cards
echo "\n--- การ์ดใน Page Builder (page_sections → planCards) ---\n";
$pageMap = [
    'lifeInsurance' => 'life-insurance.html',
    'healthInsurance' => 'health-insurance.html',
    'savingsRetirement' => 'savings-retirement.html',
];
$builderCards = [];
foreach ($pageMap as $pageKey => $file) {
    $stmt = $db->prepare('SELECT config FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1');
    $stmt->execute([$pageKey, 'planCards']);
    $row = $stmt->fetch();
    $cards = [];
    if ($row) {
        $cfg = json_decode((string) $row['config'], true);
        foreach ($cfg['cards'] ?? [] as $c) {
            if (!empty($c['title'])) {
                $cards[] = $c['title'];
            }
        }
    }
    $builderCards[$pageKey] = $cards;
    echo "  {$file}:\n";
    if ($cards === []) {
        echo "    (ไม่มีการ์ด / ยังไม่ seed)\n";
    } else {
        foreach ($cards as $t) {
            echo "    • {$t}\n";
        }
    }
}

// Category pages on disk
echo "\n--- การ์ดบนหน้าเว็บจริง (HTML ที่ build แล้ว) ---\n";
$webCards = [];
foreach ($pageMap as $pageKey => $file) {
    $path = $root . '/' . $file;
    if (!is_file($path)) {
        echo "  {$file}: ไม่พบไฟล์\n";
        continue;
    }
    $names = extractPlanNamesFromHtml((string) file_get_contents($path));
    $webCards[$pageKey] = $names;
    echo "  {$file}:\n";
    foreach ($names as $t) {
        echo "    • {$t}\n";
    }
}

// insurance.html hub
echo "\n--- หน้า insurance.html (แผนแนะนำ + รายการแบบประกัน) ---\n";
$insPath = $root . '/insurance.html';
if (is_file($insPath)) {
    $insHtml = (string) file_get_contents($insPath);
    $featured = extractFeaturedFromInsuranceHtml($insHtml);
    echo "  แผนแนะนำ (carousel):\n";
    foreach ($featured as $f) {
        echo "    • [{$f['tag']}] {$f['name']}\n";
    }
    $taxPlans = extractTaxPlansFromInsuranceHtml($insHtml);
    echo "  รายการแบบประกัน (tax-plan-grid): " . count($taxPlans) . " รายการ\n";
} else {
    echo "  ไม่พบ insurance.html\n";
}

// plans/*.html on disk
$planFiles = planFilesOnDisk($root);
echo "\n--- ไฟล์ plans/*.html บนเว็บ (" . count($planFiles) . " ไฟล์) ---\n";

// Compare builder vs web category pages
echo "\n=== สรุปความไม่ตรงกัน ===\n\n";

$issues = 0;

foreach ($pageMap as $pageKey => $file) {
    $b = array_map('normName', $builderCards[$pageKey] ?? []);
    $w = array_map('normName', $webCards[$pageKey] ?? []);
    sort($b);
    sort($w);
    if ($b !== $w) {
        $issues++;
        echo "❌ {$file} — Page Builder vs หน้าเว็บ\n";
        $onlyBuilder = array_diff($b, $w);
        $onlyWeb = array_diff($w, $b);
        foreach ($onlyBuilder as $x) {
            echo "   มีใน Builder แต่ไม่มีบนเว็บ: {$x}\n";
        }
        foreach ($onlyWeb as $x) {
            echo "   มีบนเว็บ แต่ไม่มีใน Builder: {$x}\n";
        }
        echo "\n";
    } else {
        echo "✅ {$file} — การ์ดตรงกัน (" . count($b) . " รายการ)\n";
    }
}

// Featured plans vs category page anchors
echo "\n--- แผนแนะนำ (featured) vs หน้าหมวด ---\n";
$featuredNames = array_column($featured ?? [], 'name');
foreach ($featuredNames as $name) {
    $n = normName($name);
    $inDb = false;
    foreach ($dbPlanNames as $dn) {
        if (normName($dn) === $n || str_contains(normName($dn), $n) || str_contains($n, normName($dn))) {
            $inDb = true;
            break;
        }
    }
    if (!$inDb) {
        $issues++;
        echo "⚠ แผนแนะนำ «{$name}» ไม่พบใน insurance_plans (active)\n";
    }
}

// DB plans without plan page file
echo "\n--- แผนในหลังบ้าน vs ไฟล์ plans/*.html ---\n";
foreach ($plans as $p) {
    if (!empty($p['link_url']) && !str_starts_with((string) $p['link_url'], 'plans/')) {
        continue;
    }
    $slug = trim((string) ($p['slug'] ?? ''));
    if ($slug === '') {
        $slug = planSlugLocal((string) $p['name']);
    }
    $file = $slug . '.html';
    $exists = in_array($file, $planFiles, true);
    if (!$exists) {
        // try fuzzy
        $found = false;
        foreach ($planFiles as $pf) {
            if (str_contains($pf, substr($slug, 0, 8))) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            $issues++;
            echo "⚠ แผน «{$p['name']}» ไม่มีไฟล์ plans/{$file}\n";
        }
    }
}

// Orphan plan files (on disk but not in DB)
$dbSlugs = [];
foreach ($plans as $p) {
    $slug = trim((string) ($p['slug'] ?? ''));
    if ($slug === '') {
        $slug = planSlugLocal((string) $p['name']);
    }
    $dbSlugs[] = $slug . '.html';
}
$orphans = array_diff($planFiles, $dbSlugs);
if ($orphans !== []) {
    echo "\n--- ไฟล์ plans/ ที่ไม่มีในหลังบ้าน (อาจเป็น legacy) ---\n";
    foreach (array_slice($orphans, 0, 15) as $o) {
        echo "  • plans/{$o}\n";
    }
    if (count($orphans) > 15) {
        echo "  ... และอีก " . (count($orphans) - 15) . " ไฟล์\n";
    }
}

echo "\n=== โครงสร้างระบบ (อ้างอิง) ===\n";
echo "• หน้าหมวด (life/health/savings) → แก้ที่ Admin «หน้าแบบประกัน» (page_sections)\n";
echo "• หน้า insurance.html แผนแนะนำ → ดึงจาก insurance_plans (is_featured=1)\n";
echo "• หน้า insurance.html รายการแบบประกัน → ดึงจาก insurance_plans.listing_sections (SiteBuilder)\n";
echo "• หน้า plans/*.html → สร้างจาก insurance_plans (active, filter_tag life/health/savings)\n";
echo "• เมนู «แผนประกัน» หลังบ้าน → ตาราง insurance_plans\n\n";

echo $issues === 0 ? "✅ ไม่พบความไม่สอดคล้องหลัก\n" : "⚠ พบประเด็นที่ควรแก้: {$issues} รายการ\n";
