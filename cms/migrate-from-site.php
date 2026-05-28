<?php
declare(strict_types=1);

/**
 * นำเข้าข้อมูลจาก content/site.json และ index.html สู่ฐานข้อมูล CMS
 * php cms/migrate-from-site.php
 */

function cms_migrate_from_site(bool $web = false): int
{
    $root = cms_root();
    $jsonPath = $root . '/content/site.json';

    if (!is_file($jsonPath)) {
        $msg = "ไม่พบ content/site.json\n";
        if ($web) {
            throw new RuntimeException(trim($msg));
        }
        fwrite(STDERR, $msg);
        return 1;
    }

    /** @var array<string,mixed> $data */
    $data = json_decode((string) file_get_contents($jsonPath), true);
    if (!is_array($data)) {
        $msg = "อ่าน site.json ไม่สำเร็จ\n";
        if ($web) {
            throw new RuntimeException(trim($msg));
        }
        fwrite(STDERR, $msg);
        return 1;
    }

    $db = cms_db();
    $db->beginTransaction();

    try {
        seedSettings($db, $data);
        seedNav($db, $data);
        seedSections($db, $data);
        seedHeroSlides($db, $data);
        seedPromoBanners($db, $data);
        seedFooter($db, $data);
        seedContactChannels($db, $data);
        seedSeo($db, $data);
        seedArticleCategories($db);
        seedArticles($db, $data);
        seedCareers($db, $data);
        parseIndexPlans($db, $root . '/index.html');
        parseIndexTestimonials($db, $root . '/index.html');
        $db->commit();
        echo "ย้ายข้อมูลเรียบร้อย\n";
        return 0;
    } catch (Throwable $e) {
        $db->rollBack();
        if ($web) {
            throw $e;
        }
        fwrite(STDERR, 'ผิดพลาด: ' . $e->getMessage() . "\n");
        return 1;
    }
}

if (PHP_SAPI === 'cli' && realpath((string) ($argv[0] ?? '')) === realpath(__FILE__)) {
    $configPath = __DIR__ . '/config.php';
    if (!is_file($configPath)) {
        fwrite(STDERR, "สร้าง cms/config.php จาก cms/config.example.php ก่อน\n");
        exit(1);
    }
    require __DIR__ . '/bootstrap.php';
    exit(cms_migrate_from_site(false));
}

/** @param PDO $db @param array<string,mixed> $data */
function seedSettings(PDO $db, array $data): void
{
    $pairs = [
        'site' => $data['site'] ?? [],
        'header' => $data['header'] ?? [],
        'footer' => $data['footer'] ?? [],
        'promos' => $data['promos'] ?? [],
    ];
    $stmt = $db->prepare(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?,?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ($pairs as $key => $value) {
        $stmt->execute([$key, json_encode($value, JSON_UNESCAPED_UNICODE)]);
    }
    echo "  settings\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedNav(PDO $db, array $data): void
{
    if ((int) $db->query('SELECT COUNT(*) FROM nav_items')->fetchColumn() > 0) {
        echo "  nav_items (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $items = [
        ['index.html', 'หน้าหลัก', 0, 0],
        ['about.html', 'เกี่ยวกับเรา', 0, 1],
        ['insurance.html', 'แบบประกัน', 0, 2],
        ['news.html', 'ข่าวสารและบทความ', 0, 3],
        ['careers.html', 'แนะนำอาชีพ', 0, 4],
        ['contact.html', 'ปรึกษาฟรี', 1, 5],
    ];
    $stmt = $db->prepare(
        'INSERT INTO nav_items (location, label, url, is_cta, sort_order, is_active) VALUES (\'header\',?,?,?,?,1)'
    );
    foreach ($items as [$url, $label, $cta, $order]) {
        $stmt->execute([$label, $url, $cta, $order]);
    }
    $footer = $data['footer'] ?? [];
    $mainLinks = $footer['mainNav']['links'] ?? [];
    $productLinks = $footer['productsNav']['links'] ?? [];
    echo "  nav_items\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedSections(PDO $db, array $data): void
{
    $pages = $data['pages'] ?? [];
    $home = $pages['home'] ?? [];
    $map = [
        'hero' => $home['hero'] ?? [],
        'solutionsHeading' => $home['solutionsHeading'] ?? [],
        'productCategories' => $home['productCategories'] ?? [],
        'intro' => $home['intro'] ?? [],
        'process' => $home['process'] ?? [],
        'taxPlansHeading' => $home['taxPlansHeading'] ?? [],
        'testimonials' => $home['testimonials'] ?? [],
        'homeArticles' => $home['homeArticles'] ?? [],
        'homeCareers' => $home['homeCareers'] ?? [],
        'ctaBand' => $home['ctaBand'] ?? [],
    ];
    $order = 0;
    $stmt = $db->prepare(
        'INSERT INTO page_sections (page_key, section_key, title, is_active, sort_order, config)
         VALUES (?,?,?,1,?,?)
         ON DUPLICATE KEY UPDATE config = VALUES(config), title = VALUES(title)'
    );
    foreach ($map as $key => $config) {
        if ($config === []) {
            continue;
        }
        $title = is_array($config) ? ($config['h2'] ?? $config['h1'] ?? $key) : $key;
        $stmt->execute(['home', $key, (string) $title, $order++, json_encode($config, JSON_UNESCAPED_UNICODE)]);
    }
    foreach (['news', 'careers', 'contact', 'about', 'insurance'] as $pageKey) {
        if (!isset($pages[$pageKey])) {
            continue;
        }
        $stmt->execute([
            $pageKey,
            'hero',
            $pages[$pageKey]['hero']['h1'] ?? $pageKey,
            0,
            json_encode($pages[$pageKey]['hero'] ?? $pages[$pageKey], JSON_UNESCAPED_UNICODE),
        ]);
    }
    echo "  page_sections\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedHeroSlides(PDO $db, array $data): void
{
    if ((int) $db->query('SELECT COUNT(*) FROM home_hero_slides')->fetchColumn() > 0) {
        echo "  home_hero_slides (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $slides = $data['pages']['home']['hero']['slides'] ?? [];
    $stmt = $db->prepare(
        'INSERT INTO home_hero_slides (image_path, alt_text, width, height, aspect_ratio, sort_order, is_active) VALUES (?,?,?,?,?,?,?)'
    );
    foreach ($slides as $i => $s) {
        $stmt->execute([
            $s['src'] ?? '',
            $s['alt'] ?? '',
            isset($s['width']) ? (int) $s['width'] : null,
            isset($s['height']) ? (int) $s['height'] : null,
            $s['ratio'] ?? null,
            $i,
            !empty($s['active']) || $i === 0 ? 1 : 1,
        ]);
    }
    echo "  home_hero_slides (" . count($slides) . ")\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedPromoBanners(PDO $db, array $data): void
{
    if ((int) $db->query('SELECT COUNT(*) FROM banners')->fetchColumn() > 0) {
        echo "  banners (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $promos = $data['promos'] ?? [];
    $stmt = $db->prepare(
        'INSERT INTO banners (placement, title, image_path, button_url, sort_order, is_active) VALUES (?,?,?,?,?,1)'
    );
    $i = 0;
    foreach (['joinTeam', 'insurance'] as $key) {
        if (!isset($promos[$key])) {
            continue;
        }
        $p = $promos[$key];
        $stmt->execute(['promo', $p['alt'] ?? $key, $p['imageSrc'] ?? '', $p['href'] ?? '', $i++]);
    }
    echo "  banners\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedFooter(PDO $db, array $data): void
{
    if ((int) $db->query('SELECT COUNT(*) FROM footer_links')->fetchColumn() > 0) {
        echo "  footer_links (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $footer = $data['footer'] ?? [];
    $stmt = $db->prepare(
        'INSERT INTO footer_links (group_key, label, url, sort_order, is_active) VALUES (?,?,?,?,1)'
    );
    foreach ($footer['mainNav']['links'] ?? [] as $i => $link) {
        $stmt->execute(['main', $link['label'] ?? '', $link['href'] ?? '', $i]);
    }
    foreach ($footer['productsNav']['links'] ?? [] as $i => $link) {
        $stmt->execute(['products', $link['label'] ?? '', $link['href'] ?? '', $i]);
    }
    echo "  footer_links\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedContactChannels(PDO $db, array $data): void
{
    if ((int) $db->query('SELECT COUNT(*) FROM contact_channels')->fetchColumn() > 0) {
        echo "  contact_channels (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $chips = $data['pages']['contact']['chips'] ?? [];
    $stmt = $db->prepare(
        'INSERT INTO contact_channels (channel_key, label, value_text, url, variant, is_active, sort_order) VALUES (?,?,?,?,?,1,?)'
    );
    foreach ($chips as $i => $c) {
        $key = 'chip_' . $i . '_' . slugify((string) ($c['title'] ?? 'channel'));
        $stmt->execute([
            $key,
            $c['title'] ?? '',
            $c['meta'] ?? '',
            $c['href'] ?? '',
            $c['variant'] ?? 'default',
            $i,
        ]);
    }
    echo "  contact_channels (" . count($chips) . ")\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedSeo(PDO $db, array $data): void
{
    $pages = $data['pages'] ?? [];
    $stmt = $db->prepare(
        'INSERT INTO seo_meta (page_key, meta_title, meta_description) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE meta_title = VALUES(meta_title), meta_description = VALUES(meta_description)'
    );
    foreach ($pages as $key => $page) {
        if (!is_array($page)) {
            continue;
        }
        $stmt->execute([
            $key,
            $page['title'] ?? null,
            $page['metaDescription'] ?? null,
        ]);
    }
    $site = $data['site'] ?? [];
    $stmt->execute(['home', $site['title'] ?? null, $site['metaDescription'] ?? null]);
    echo "  seo_meta\n";
}

function seedArticleCategories(PDO $db): void
{
    $cats = [
        ['life', 'ประกันชีวิต', 0],
        ['health', 'สุขภาพ', 1],
        ['savings', 'ออมทรัพย์ / ภาษี', 2],
        ['guide', 'คำแนะนำ', 3],
    ];
    $stmt = $db->prepare(
        'INSERT IGNORE INTO article_categories (slug, name, sort_order) VALUES (?,?,?)'
    );
    foreach ($cats as $c) {
        $stmt->execute($c);
    }
}

/** @param PDO $db @param array<string,mixed> $data */
function seedArticles(PDO $db, array $data): void
{
    $articles = $data['articles'] ?? [];
    if ($articles === []) {
        return;
    }
    $catStmt = $db->prepare('SELECT id FROM article_categories WHERE slug = ?');
    $stmt = $db->prepare(
        'INSERT INTO articles (category_id, slug, title, excerpt, body_html, cover_image, eyebrow, hero_lead, status, published_at, seo_description, sort_order)
         VALUES (?,?,?,?,?,?,?,?,\'published\',NOW(),?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), body_html=VALUES(body_html),
         cover_image=VALUES(cover_image), eyebrow=VALUES(eyebrow), hero_lead=VALUES(hero_lead), seo_description=VALUES(seo_description)'
    );
    foreach ($articles as $i => $a) {
        $catStmt->execute([$a['category'] ?? 'guide']);
        $catId = $catStmt->fetchColumn() ?: null;
        $stmt->execute([
            $catId,
            $a['slug'] ?? slugify($a['title'] ?? 'article'),
            $a['title'] ?? '',
            $a['excerpt'] ?? '',
            $a['bodyHtml'] ?? '<p></p>',
            $a['imageSrc'] ?? null,
            $a['eyebrow'] ?? null,
            $a['lead'] ?? $a['excerpt'] ?? null,
            $a['metaDescription'] ?? null,
            $i,
        ]);
    }
    echo "  articles (" . count($articles) . ")\n";
}

/** @param PDO $db @param array<string,mixed> $data */
function seedCareers(PDO $db, array $data): void
{
    $careers = $data['careers'] ?? [];
    if ($careers === []) {
        return;
    }
    $stmt = $db->prepare(
        'INSERT INTO careers (slug, title, excerpt, body_html, cover_image, eyebrow, hero_lead, status, published_at, seo_description, sort_order)
         VALUES (?,?,?,?,?,?,?,\'published\',NOW(),?,?)
         ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), body_html=VALUES(body_html),
         cover_image=VALUES(cover_image), eyebrow=VALUES(eyebrow), hero_lead=VALUES(hero_lead), seo_description=VALUES(seo_description)'
    );
    foreach ($careers as $i => $c) {
        $stmt->execute([
            $c['slug'] ?? slugify($c['title'] ?? 'career'),
            $c['title'] ?? '',
            $c['excerpt'] ?? '',
            $c['bodyHtml'] ?? '<p></p>',
            $c['imageSrc'] ?? null,
            $c['eyebrow'] ?? 'แนะนำอาชีพ',
            $c['lead'] ?? $c['excerpt'] ?? null,
            $c['metaDescription'] ?? null,
            $i,
        ]);
    }
    echo "  careers (" . count($careers) . ")\n";
}

function parseIndexPlans(PDO $db, string $indexPath): void
{
    if (!is_file($indexPath)) {
        echo "  insurance_plans (ไม่พบ index.html)\n";
        return;
    }
    if ((int) $db->query('SELECT COUNT(*) FROM insurance_plans')->fetchColumn() > 0) {
        echo "  insurance_plans (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $html = (string) file_get_contents($indexPath);
    if (!preg_match_all(
        '/<article class="solution-item[^"]*" data-category="([^"]+)">[\s\S]*?<img src="([^"]+)"[\s\S]*?<h3><a href="([^"]+)">([^<]+)<\/a><\/h3>[\s\S]*?<p>([^<]*)<\/p>/u',
        $html,
        $matches,
        PREG_SET_ORDER
    )) {
        echo "  insurance_plans (ไม่พบ carousel)\n";
        return;
    }
    $stmt = $db->prepare(
        'INSERT INTO insurance_plans (filter_tag, name, slug, short_description, image_path, link_url, is_featured, is_active, sort_order)
         VALUES (?,?,?,?,?,?,1,1,?)'
    );
    foreach ($matches as $i => $m) {
        $name = html_entity_decode(trim($m[4]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $stmt->execute([
            $m[1],
            $name,
            slugify($name),
            html_entity_decode(trim($m[5]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            $m[2],
            $m[3],
            $i,
        ]);
    }
    echo "  insurance_plans (" . count($matches) . " จาก index.html)\n";
}

function parseIndexTestimonials(PDO $db, string $indexPath): void
{
    if (!is_file($indexPath)) {
        return;
    }
    if ((int) $db->query('SELECT COUNT(*) FROM testimonials')->fetchColumn() > 0) {
        echo "  testimonials (มีอยู่แล้ว — ข้าม)\n";
        return;
    }
    $html = (string) file_get_contents($indexPath);
    if (!preg_match_all(
        '/<blockquote class="testimonial-quote">([^<]*)<\/blockquote>[\s\S]*?<span class="testimonial-avatar"[^>]*>([^<]*)<\/span>[\s\S]*?<cite>([^<]*)<\/cite>[\s\S]*?<p>([^<]*)<\/p>/u',
        $html,
        $matches,
        PREG_SET_ORDER
    )) {
        echo "  testimonials (ไม่พบใน index.html)\n";
        return;
    }
    $stmt = $db->prepare(
        'INSERT INTO testimonials (customer_name, customer_role, avatar_letter, quote_text, rating, sort_order, is_active)
         VALUES (?,?,?,?,5,?,1)'
    );
    foreach ($matches as $i => $m) {
        $stmt->execute([
            html_entity_decode(trim($m[3]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            html_entity_decode(trim($m[4]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            html_entity_decode(trim($m[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            $i,
        ]);
    }
    echo "  testimonials (" . count($matches) . " จาก index.html)\n";
}

function slugify(string $text): string
{
    $text = trim(mb_strtolower($text, 'UTF-8'));
    $text = preg_replace('/[^\p{L}\p{N}]+/u', '-', $text) ?? '';
    $text = trim($text, '-');
    return $text !== '' ? $text : 'item-' . time();
}
