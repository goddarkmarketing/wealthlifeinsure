<?php
declare(strict_types=1);

require_once __DIR__ . '/Tracking.php';

/**
 * Generates static HTML from CMS database tables.
 */
final class SiteBuilder
{
    private const SITE_URL = 'https://www.wealthlifeinsure.com';

    private static string $root;
    /** @var array<string,mixed> */
    private static array $site = [];
    /** @var array<string,mixed> */
    private static array $header = [];
    /** @var array<string,mixed> */
    private static array $footer = [];
    /** @var array<string,mixed> */
    private static array $promos = [];
    /** @var list<array<string,mixed>> */
    private static array $articles = [];
    /** @var list<array<string,mixed>> */
    private static array $careers = [];
    /** @var list<string> */
    private static array $written = [];
    /** @var array<string,mixed> */
    private static array $tracking = [];

    /** @return array{files: list<string>, count: int} */
    public static function build(): array
    {
        self::$root = cms_root();
        self::$written = [];
        self::loadContext();

        self::buildNews();
        self::buildCareersListing();
        foreach (self::$articles as $article) {
            self::buildArticle($article);
        }
        foreach (self::$careers as $career) {
            self::buildCareer($career);
        }
        self::buildIndex();
        self::buildContact();
        self::buildAbout();
        self::buildInsurancePage();
        self::patchStaticPages();
        self::syncPromosAll();
        self::syncGlobalChromeAll();
        self::injectTrackingAll();
        self::buildSitemap();

        return ['files' => self::$written, 'count' => count(self::$written)];
    }

    private static function loadContext(): void
    {
        $db = cms_db();
        self::$site = self::setting('site', [
            'name' => 'Wealth Life Insure',
            'brandSlug' => 'wealthlifeinsure',
            'metaDescription' => '',
            'tagline' => '',
            'phones' => ['tam' => [], 'a' => []],
            'hours' => '',
            'office' => '',
            'licenses' => '',
            'footerNote' => '',
            'copyright' => '© ' . date('Y') . ' Wealth Life Insure',
        ]);
        self::$header = self::setting('header', ['brandName' => self::$site['name'] ?? 'Wealth Life Insure']);
        self::$footer = self::setting('footer', []);
        self::$promos = self::setting('promos', [
            'joinTeam' => ['href' => 'careers.html', 'imageSrc' => 'assets/promo/banner-join-team.png', 'alt' => ''],
            'insurance' => ['href' => 'contact.html', 'imageSrc' => 'assets/promo/banner-insurance.png', 'alt' => ''],
        ]);
        self::$tracking = Tracking::normalize(self::setting('tracking', Tracking::defaults()));

        self::$articles = [];
        $stmt = $db->query(
            "SELECT a.*, ac.slug AS category_slug
             FROM articles a
             LEFT JOIN article_categories ac ON ac.id = a.category_id
             WHERE a.status = 'published'
             ORDER BY a.sort_order, a.published_at DESC, a.id"
        );
        while ($row = $stmt->fetch()) {
            self::$articles[] = self::mapArticle($row);
        }
        self::$articles = self::dedupeContentByBaseSlug(self::$articles);

        self::$careers = [];
        $stmt = $db->query(
            "SELECT * FROM careers WHERE status = 'published' ORDER BY sort_order, id"
        );
        while ($row = $stmt->fetch()) {
            self::$careers[] = self::mapCareer($row);
        }
        self::$careers = self::dedupeContentByBaseSlug(self::$careers);
    }

    /** @param list<array<string,mixed>> $items @return list<array<string,mixed>> */
    private static function dedupeContentByBaseSlug(array $items): array
    {
        $winnerSlug = [];
        foreach ($items as $item) {
            $slug = (string) ($item['slug'] ?? '');
            if ($slug === '') {
                continue;
            }
            $base = self::contentBaseSlug($slug);
            if (!isset($winnerSlug[$base])) {
                $winnerSlug[$base] = $slug;
                continue;
            }
            $current = $winnerSlug[$base];
            if (preg_match('/-\d+$/', $current) && !preg_match('/-\d+$/', $slug)) {
                $winnerSlug[$base] = $slug;
            } elseif ($slug === $base && $current !== $base) {
                $winnerSlug[$base] = $slug;
            }
        }

        $result = [];
        $added = [];
        foreach ($items as $item) {
            $slug = (string) ($item['slug'] ?? '');
            $base = self::contentBaseSlug($slug);
            if (($winnerSlug[$base] ?? '') !== $slug || isset($added[$base])) {
                continue;
            }
            $result[] = $item;
            $added[$base] = true;
        }

        return $result;
    }

    private static function contentBaseSlug(string $slug): string
    {
        return preg_match('/^(.+)-\d+$/', $slug, $m) ? $m[1] : $slug;
    }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    private static function mapArticle(array $row): array
    {
        return [
            'slug' => $row['slug'],
            'category' => $row['category_slug'] ?? 'guide',
            'title' => $row['title'],
            'excerpt' => $row['excerpt'] ?? '',
            'href' => 'articles/' . $row['slug'] . '.html',
            'imageSrc' => $row['cover_image'] ?? 'assets/logo/logo.png',
            'metaDescription' => $row['seo_description'] ?? $row['excerpt'] ?? '',
            'eyebrow' => $row['eyebrow'] ?? '',
            'h1' => $row['title'],
            'lead' => $row['hero_lead'] ?? $row['excerpt'] ?? '',
            'bodyHtml' => $row['body_html'] ?? '',
        ];
    }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    private static function mapCareer(array $row): array
    {
        return [
            'slug' => $row['slug'],
            'title' => $row['title'],
            'excerpt' => $row['excerpt'] ?? '',
            'href' => 'careers/' . $row['slug'] . '.html',
            'imageSrc' => $row['cover_image'] ?? 'assets/career/career-hero.png',
            'metaDescription' => $row['seo_description'] ?? $row['excerpt'] ?? '',
            'eyebrow' => $row['eyebrow'] ?? 'แนะนำอาชีพ',
            'h1' => $row['title'],
            'lead' => $row['hero_lead'] ?? $row['excerpt'] ?? '',
            'bodyHtml' => $row['body_html'] ?? '',
        ];
    }

    /** @return array<string,mixed> */
    private static function setting(string $key, array $default): array
    {
        $stmt = cms_db()->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
        $stmt->execute([$key]);
        $raw = $stmt->fetchColumn();
        if ($raw === false) {
            return $default;
        }
        $decoded = json_decode((string) $raw, true);
        return is_array($decoded) ? array_merge($default, $decoded) : $default;
    }

    /** @return array<string,mixed>|null */
    private static function sectionConfig(string $pageKey, string $sectionKey): ?array
    {
        $stmt = cms_db()->prepare(
            'SELECT config, is_active FROM page_sections WHERE page_key = ? AND section_key = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$pageKey, $sectionKey]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        $config = json_decode((string) $row['config'], true);
        return is_array($config) ? $config : [];
    }

    /** @param array<string,mixed> $defaults @param array<string,mixed>|null $config */
    private static function mergeSectionDefaults(array $defaults, ?array $config): array
    {
        $out = $defaults;
        if ($config === null) {
            return $out;
        }
        foreach ($config as $key => $value) {
            if ($value === '' || $value === null) {
                continue;
            }
            $out[$key] = $value;
        }
        return $out;
    }

    /** @return array<string,mixed> */
    private static function seoPage(string $pageKey, array $fallback): array
    {
        $stmt = cms_db()->prepare('SELECT * FROM seo_meta WHERE page_key = ? LIMIT 1');
        $stmt->execute([$pageKey]);
        $row = $stmt->fetch();
        if (!$row) {
            return $fallback;
        }
        return [
            'title' => $row['meta_title'] ?: ($fallback['title'] ?? ''),
            'metaDescription' => $row['meta_description'] ?: ($fallback['metaDescription'] ?? ''),
            'ogImage' => $row['og_image'] ?: ($fallback['ogImage'] ?? 'assets/logo/logo.png'),
        ];
    }

    private static function writeFile(string $relative, string $content): void
    {
        $full = self::$root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
        $dir = dirname($full);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $bytes = file_put_contents($full, $content);
        if ($bytes === false) {
            throw new RuntimeException('เขียนไฟล์ไม่ได้ (ตรวจสิทธิ์โฟลเดอร์): ' . $relative);
        }
        self::$written[] = $relative;
    }

    private static function readTemplate(string $relative): string
    {
        $full = self::$root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
        if (!is_file($full)) {
            throw new RuntimeException("ไม่พบไฟล์เทมเพลต: {$relative}");
        }
        return (string) file_get_contents($full);
    }

    /** อ่านเทมเพลตต้นฉบับจาก cms/templates/pages — กัน HTML พังจาก build รอบก่อน */
    private static function readPageTemplate(string $fileName): string
    {
        $master = __DIR__ . '/templates/pages/' . $fileName;
        if (is_file($master)) {
            return (string) file_get_contents($master);
        }
        return self::readTemplate($fileName);
    }

    private static function replaceOnce(string $html, string $pattern, string $replacement): string
    {
        // ใช้ ${n} ใน replacement ที่ต่อกับตัวเลข — กัน $1 + "670..." กลายเป็น $1670...
        $replaced = preg_replace($pattern, $replacement, $html, 1);
        return $replaced ?? $html;
    }

    private static function replacePair(string $html, string $pattern, string $value): string
    {
        return self::replaceOnce($html, $pattern, '${1}' . $value . '${2}');
    }

    private static function patchAgentPanelAtIndex(string $html, array $agent, int $index): string
    {
        if (!preg_match_all(
            '/(<article class="agent-profile-panel section-reveal">[\s\S]*?<\/article>)/',
            $html,
            $matches,
            PREG_OFFSET_CAPTURE
        ) || !isset($matches[0][$index])) {
            return $html;
        }

        $panel = $matches[0][$index][0];
        $offset = (int) $matches[0][$index][1];
        $originalLen = strlen($panel);
        $name = (string) ($agent['h2'] ?? '');

        $panel = self::replaceOnce(
            $panel,
            '/(<figure class="agent-card-photo agent-card-photo--panel">\s*<img src=")[^"]*(" width="640" height="800" decoding="async" alt=")[^"]*(")/',
            '${1}' . esc($agent['photo'] ?? '') . '${2}' . esc($name) . '${3}'
        );
        $panel = self::replacePair(
            $panel,
            '/(<div class="agent-profile-meta">\s*<p class="eyebrow">)[^<]*(<\/p>)/',
            esc($agent['eyebrow'] ?? '')
        );
        $panel = self::replacePair(
            $panel,
            '/(<div class="agent-profile-meta">[\s\S]*?<h2>)[^<]*(<\/h2>)/',
            esc($name)
        );
        $panel = self::replacePair(
            $panel,
            '/(<p class="agent-intro-lead">)[^<]*(<\/p>)/',
            esc($agent['lead'] ?? '')
        );
        $panel = self::replacePair(
            $panel,
            '/(<span class="agent-contact-label">ใบอนุญาตเลขที่<\/span>\s*<span class="agent-contact-value">)[^<]*(<\/span>)/',
            esc($agent['license'] ?? '')
        );

        return substr($html, 0, $offset) . $panel . substr($html, $offset + $originalLen);
    }

    private static function patchFirstAgentPanel(string $html, array $agent): string
    {
        return self::patchAgentPanelAtIndex($html, $agent, 0);
    }

    /** @return array<string,mixed> */
    private static function aboutAgentConfig(string $which): array
    {
        $defaults = $which === 'agent2'
            ? [
                'eyebrow' => 'ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา',
                'h2' => 'คุณ เอ',
                'photo' => 'assets/profile/7f0ffeae-0f98-4d34-ae70-3c6266dc11e6.png',
                'lead' => 'สวัสดีค่ะ ดิฉันเอ ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
                'license' => '6701024924',
            ]
            : [
                'eyebrow' => 'ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา',
                'h2' => 'คุณ จักรี น้อยดอนไพร (แต้ม)',
                'photo' => 'assets/profile/1c19a9f2-c428-4cec-bbd2-59b6e4993178.png',
                'lead' => 'สวัสดีครับ ผมแต้ม ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
                'license' => '6701031779',
            ];

        $agents = self::sectionConfig('about', 'agents');
        if (is_array($agents) && is_array($agents[$which] ?? null)) {
            return self::mergeSectionDefaults($defaults, $agents[$which]);
        }

        return self::mergeSectionDefaults($defaults, self::sectionConfig('about', $which));
    }

    private static function prefixFor(string $filePath): string
    {
        $depth = substr_count(str_replace('\\', '/', $filePath), '/');
        return $depth > 0 ? str_repeat('../', $depth) : '';
    }

    /**
     * @param array{file: string, current: string, title: string, description: string, ogImage?: string, main: string} $opts
     */
    private static function pageShell(array $opts): string
    {
        $prefix = self::prefixFor($opts['file']);
        $ogImage = $opts['ogImage'] ?? 'assets/logo/logo.png';
        return self::renderHead([
            'title' => $opts['title'],
            'description' => $opts['description'],
            'ogImage' => $ogImage,
            'prefix' => $prefix,
        ]) . "\n<body>\n"
            . self::renderHeader($prefix, $opts['current'])
            . "  <main>\n" . $opts['main'] . "\n  </main>\n"
            . self::renderPromo($prefix)
            . self::renderFooter($prefix);
    }

    private static function buildNews(): void
    {
        $seo = self::seoPage('news', [
            'title' => 'ข่าวสารและบทความ | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'metaDescription' => self::$site['metaDescription'] ?? '',
            'ogImage' => 'assets/logo/logo.png',
        ]);
        $hero = self::mergeSectionDefaults([
            'eyebrow' => 'News & Articles',
            'h1' => 'ข่าวสารและบทความ',
            'copy' => 'รวมบทความและข่าวสารเกี่ยวกับประกันชีวิต สุขภาพ การออม ลดหย่อนภาษี และการวางแผนทางการเงิน',
        ], self::sectionConfig('news', 'hero'));
        $cards = '';
        foreach (self::$articles as $a) {
            $cards .= self::renderArticleCard($a, '') . "\n";
        }
        $main = self::buildNewsMain($hero, $cards);
        self::writeFile('news.html', self::pageShell([
            'file' => 'news.html',
            'current' => 'news',
            'title' => $seo['title'],
            'description' => $seo['metaDescription'],
            'ogImage' => $seo['ogImage'],
            'main' => $main,
        ]));
    }

    /** @param array<string,mixed> $hero */
    private static function buildNewsMain(array $hero, string $cards): string
    {
        return '    <section class="page-hero page-hero--articles section-reveal">
      <p class="eyebrow">' . esc($hero['eyebrow'] ?? '') . '</p>
      <h1>' . esc($hero['h1'] ?? '') . '</h1>
      <p>' . esc($hero['copy'] ?? '') . '</p>
    </section>

    <section class="solutions section-reveal news-articles" aria-label="บทความและข่าวสาร">
      <div class="solutions-inner">
        <div class="section-heading section-reveal">
          <p class="eyebrow">บทความแนะนำ</p>
          <h2>อ่านก่อนตัดสินใจเลือกแผนประกัน</h2>
        </div>
        <div class="article-grid-block" data-article-grid>
          <div class="article-grid-controls" aria-label="ค้นหาและกรองบทความ">
            <div class="carousel-filterbar article-grid-filterbar">
              <label class="carousel-search">
                <span class="sr-only">ค้นหาบทความ</span>
                <input type="search" data-article-grid-search placeholder="ค้นหาบทความ..." autocomplete="off">
              </label>
              <label class="carousel-filter">
                <span class="sr-only">กรองหมวดบทความ</span>
                <select data-article-grid-filter>
                  <option value="all">ทุกหมวด</option>
                  <option value="life">ประกันชีวิต</option>
                  <option value="health">สุขภาพ</option>
                  <option value="savings">ออมทรัพย์ / ภาษี</option>
                  <option value="guide">คำแนะนำ</option>
                </select>
              </label>
              <button class="carousel-clear" type="button" data-article-grid-clear>ล้างการค้นหา</button>
            </div>
          </div>
          <div class="article-grid">
' . $cards . '
          </div>
          <p class="carousel-empty" data-article-grid-empty hidden>ไม่พบบทความที่ตรงกับคำค้นหา</p>
        </div>
      </div>
    </section>

    <section class="cta-band section-reveal">
      <div class="cta-band-inner">
        <div class="cta-band-copy">
          <p class="eyebrow">Talk to us</p>
          <div class="cta-band-title-wrap">
            <h2>มีคำถามหลังอ่านบทความ?</h2>
          </div>
          <p>ทีมงานพร้อมช่วยอธิบายและจัดลำดับความสำคัญก่อนเลือกแผน</p>
          <a class="button primary" href="contact.html">ปรึกษาฟรี</a>
        </div>
      </div>
    </section>';
    }

    private static function buildCareersListing(): void
    {
        $seo = self::seoPage('careers', [
            'title' => 'แนะนำอาชีพ | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'metaDescription' => self::$site['metaDescription'] ?? '',
            'ogImage' => 'assets/career/career-hero.png',
        ]);
        $hero = self::mergeSectionDefaults([
            'eyebrow' => '',
            'h1' => 'แนะนำอาชีพตัวแทนไทยประกันชีวิต',
            'copy' => '',
            'imageSrc' => 'assets/career/career-hero.png',
        ], self::sectionConfig('careers', 'hero'));
        $cards = '';
        foreach (self::$careers as $c) {
            $cards .= self::renderCareerCard($c, '') . "\n";
        }
        $heroImg = $hero['imageSrc'] ?? 'assets/career/career-hero.png';
        $main = '    <section class="career-hero section-reveal">
      <div class="career-hero-inner">
        <div class="career-hero-copy">
          <h1>' . esc($hero['h1'] ?? '') . '</h1>
          <p>' . esc($hero['copy'] ?? '') . '</p>
          <a class="button primary" href="contact.html">สนใจร่วมงาน ติดต่อเรา</a>
        </div>
        <figure class="career-hero-media">
          <img src="' . esc($heroImg) . '" alt="' . esc($hero['h1'] ?? 'แนะนำอาชีพ') . '" width="1200" height="630" loading="eager" decoding="async">
        </figure>
      </div>
    </section>

    <section class="careers-list section-reveal" aria-label="แนะนำอาชีพตัวแทนไทยประกันชีวิต">
      <div class="careers-list-inner">
        <div class="section-heading section-reveal">
          <h2>แนะนำอาชีพตัวแทนไทยประกันชีวิต</h2>
        </div>
        <div class="career-grid">
' . $cards . '
        </div>
      </div>
    </section>';
        self::writeFile('careers.html', self::pageShell([
            'file' => 'careers.html',
            'current' => 'careers',
            'title' => $seo['title'],
            'description' => $seo['metaDescription'],
            'ogImage' => $seo['ogImage'],
            'main' => $main,
        ]));
    }

    /** @param array<string,mixed> $article */
    private static function buildArticle(array $article): void
    {
        $prefix = '../';
        $slug = (string) $article['slug'];
        $main = '    <section class="page-hero page-hero--article section-reveal">
      <p class="eyebrow">' . esc($article['eyebrow'] ?? '') . '</p>
      <h1>' . esc($article['h1'] ?? '') . '</h1>
      <p class="article-hero-lead">' . esc($article['lead'] ?? '') . '</p>
    </section>

    <div class="article-layout">
      <article class="article-main section-reveal">
        <figure class="article-featured">
          <img src="' . $prefix . esc($article['imageSrc'] ?? '') . '" alt="' . esc($article['h1'] ?? '') . '" width="960" height="540" loading="eager" decoding="async">
        </figure>
        <div class="article-body">
' . ($article['bodyHtml'] ?? '') . '
        </div>
        <p class="article-cta">
          <a class="button primary" href="' . $prefix . 'contact.html">ปรึกษาฟรีกับทีมงาน</a>
          <a class="button secondary" href="' . $prefix . 'news.html">กลับหน้าบทความ</a>
        </p>
      </article>
' . self::renderArticleSidebar($slug, $prefix) . '
    </div>';
        self::writeFile("articles/{$slug}.html", self::pageShell([
            'file' => "articles/{$slug}.html",
            'current' => 'news',
            'title' => ($article['h1'] ?? '') . ' | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'description' => $article['metaDescription'] ?? '',
            'ogImage' => $article['imageSrc'] ?? '',
            'main' => $main,
        ]));
    }

    /** @param array<string,mixed> $career */
    private static function buildCareer(array $career): void
    {
        $prefix = '../';
        $slug = (string) $career['slug'];
        $main = '    <section class="page-hero page-hero--article section-reveal">
      <p class="eyebrow">' . esc($career['eyebrow'] ?? 'แนะนำอาชีพ') . '</p>
      <h1>' . esc($career['h1'] ?? '') . '</h1>
      <p class="article-hero-lead">' . esc($career['lead'] ?? '') . '</p>
    </section>

    <div class="article-layout">
      <article class="article-main section-reveal">
        <figure class="article-featured">
          <img src="' . $prefix . esc($career['imageSrc'] ?? '') . '" alt="' . esc($career['h1'] ?? '') . '" width="960" height="540" loading="eager" decoding="async">
        </figure>
        <div class="article-body">
' . ($career['bodyHtml'] ?? '') . '
        </div>
      </article>
' . self::renderRelatedCareers($slug, $prefix) . '
    </div>';
        self::writeFile("careers/{$slug}.html", self::pageShell([
            'file' => "careers/{$slug}.html",
            'current' => 'careers',
            'title' => ($career['h1'] ?? '') . ' | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'description' => $career['metaDescription'] ?? '',
            'ogImage' => $career['imageSrc'] ?? '',
            'main' => $main,
        ]));
    }

    private static function buildIndex(): void
    {
        if (!is_file(self::$root . '/index.html')) {
            return;
        }
        $html = self::readTemplate('index.html');
        $homeHero = self::sectionConfig('home', 'hero');
        $slides = self::loadHeroSlides();

        if ($homeHero || $slides !== []) {
            $hero = $homeHero ?? [];
            $eyebrow = $hero['eyebrow'] ?? 'ไทยประกันชีวิต สาขาบางนา';
            $h1Spans = $hero['h1Spans'] ?? ['วางแผนประกันชีวิต สุขภาพ', 'และมรดกกับทีมที่ดูแลจริง'];
            $copy = $hero['copy'] ?? '';
            $spanHtml = '';
            foreach ($h1Spans as $s) {
                $spanHtml .= '          <span>' . esc((string) $s) . "</span>\n";
            }
            $slideHtml = '';
            foreach ($slides as $i => $s) {
                $active = ($i === 0 || !empty($s['is_active'])) ? ' is-active' : '';
                $lazy = $i === 0 ? ' decoding="async"' : ' loading="lazy" decoding="async"';
                $slideHtml .= '        <figure class="hero-slide' . $active . '" data-hero-slide data-hero-ratio="' . esc($s['aspect_ratio'] ?? '') . '">
          <img src="' . esc($s['image_path'] ?? '') . '" alt="' . esc($s['alt_text'] ?? '') . '" width="' . esc((string) ($s['width'] ?? '')) . '" height="' . esc((string) ($s['height'] ?? '')) . '"' . $lazy . '>
        </figure>' . "\n";
            }
            $replacement = '<div class="hero-content">
        <p class="eyebrow">' . esc($eyebrow) . '</p>
        <h1>
' . $spanHtml . '        </h1>
        <p class="hero-copy">' . esc($copy) . '</p>
      </div>
      <div class="hero-slides">
' . $slideHtml . '      </div>';
            $html = preg_replace(
                '/<div class="hero-content">[\s\S]*?<\/div>\s*<div class="hero-slides">[\s\S]*?<\/div>/',
                $replacement,
                $html,
                1
            ) ?? $html;
        }

        $plansHtml = self::renderFeaturedPlansCarousel();
        if ($plansHtml !== '') {
            $html = preg_replace(
                '/(<section class="solutions section-reveal" id="cms-section-solutionsHeading"[\s\S]*?<div class="solution-list" data-carousel-track>)\s*[\s\S]*?(\s*<\/div>\s*<\/div>\s*<p class="carousel-empty")/u',
                '$1' . "\n" . $plansHtml . '$2',
                $html,
                1
            ) ?? $html;
        }

        $testimonialsHtml = self::renderTestimonialsTrack();
        if ($testimonialsHtml !== '') {
            $html = self::replaceTestimonialsCarouselTrack($html, $testimonialsHtml);
        }

        $html = self::patchHomePageSections($html);
        $html = self::syncHomeCareersSection($html);

        $html = self::replaceFooterInHtml($html, '');
        $html = self::patchHeaderBrand($html);
        $seo = self::seoPage('home', [
            'title' => self::$site['title'] ?? (self::$site['name'] ?? '') . ' | ไทยประกันชีวิต',
            'metaDescription' => self::$site['metaDescription'] ?? '',
        ]);
        if (!empty($seo['metaDescription'])) {
            $html = preg_replace(
                '/<meta name="description" content="[^"]*"/',
                '<meta name="description" content="' . esc($seo['metaDescription']) . '"',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($seo['title'])) {
            $html = preg_replace('/<title>[^<]*<\/title>/', '<title>' . esc($seo['title']) . '</title>', $html, 1) ?? $html;
        }

        self::writeFile('index.html', $html);
    }

    /** Apply page_sections (home) text blocks to index.html */
    private static function patchHomePageSections(string $html): string
    {
        $map = [
            'solutionsHeading' => 'patchHomeSolutionsHeading',
            'productCategories' => 'patchHomeProductCategories',
            'intro' => 'patchHomeIntro',
            'process' => 'patchHomeProcess',
            'taxPlansHeading' => 'patchHomeTaxPlansHeading',
            'testimonials' => 'patchHomeTestimonialsHeading',
            'homeArticles' => 'patchHomeArticlesBlock',
            'ctaBand' => 'patchHomeCtaBand',
        ];
        foreach ($map as $key => $method) {
            $cfg = self::sectionConfig('home', $key);
            if ($cfg !== null && $cfg !== []) {
                $html = self::$method($html, $cfg);
            }
        }
        return $html;
    }

    private static function syncHomeCareersSection(string $html): string
    {
        $total = count(self::$careers);
        $defaults = [
            'eyebrow' => 'Career',
            'h2' => 'แนะนำอาชีพตัวแทนไทยประกันชีวิต',
            'lead' => 'อาชีพที่ปรึกษาประกันชีวิตและการเงิน — รายได้ตามผลงาน ทำงานยืดหยุ่น และมีทีมสนับสนุนจากไทยประกันชีวิต',
            'moreText' => 'ดูทั้งหมด ' . $total . ' เรื่อง',
            'moreHref' => 'careers.html',
        ];
        $cfg = self::mergeSectionDefaults($defaults, self::sectionConfig('home', 'homeCareers'));
        if (($cfg['moreText'] ?? '') === 'ดูทั้งหมด 9 เรื่อง' && $total > 0) {
            $cfg['moreText'] = 'ดูทั้งหมด ' . $total . ' เรื่อง';
        }
        if (($cfg['moreHref'] ?? '') === 'careers/why-advisor.html') {
            $cfg['moreHref'] = 'careers.html';
        }

        $block = self::buildHomeCareersSectionHtml($cfg);

        $html = preg_replace(
            '/\s*(?:<p class="home-articles-more"><a class="text-link" href="|<a class="home-articles-more button secondary" href=")careers[^"]*">[^<]*(?:<\/a><\/p>|<\/a>)\s*<\/div>\s*<\/section>\s*(?=<section class="cta-band)/',
            "\n",
            $html,
            1
        ) ?? $html;

        if (preg_match('/<section class="solutions home-careers[\s\S]*?<\/section>/', $html)) {
            return preg_replace('/<section class="solutions home-careers[\s\S]*?<\/section>/', $block, $html, 1) ?? $html;
        }

        return preg_replace(
            '/(\s*<section class="cta-band section-reveal" id="cms-section-ctaBand">)/',
            "\n\n" . $block . '$1',
            $html,
            1
        ) ?? $html;
    }

    /** @param array<string,mixed> $c */
    private static function buildHomeCareersSectionHtml(array $c): string
    {
        $cards = '';
        foreach (array_slice(self::$careers, 0, 3) as $career) {
            $cards .= self::renderCareerCard($career, '') . "\n";
        }
        $leadHtml = !empty($c['lead'])
            ? '<p class="home-articles-lead">' . esc((string) $c['lead']) . '</p>'
            : '';

        return '    <section class="solutions home-careers section-reveal" id="cms-section-homeCareers" aria-label="แนะนำอาชีพตัวแทนไทยประกันชีวิต">
      <div class="solutions-inner">
        <div class="section-heading section-reveal">
          <p class="eyebrow">' . esc((string) ($c['eyebrow'] ?? '')) . '</p>
          <h2>' . esc((string) ($c['h2'] ?? '')) . '</h2>
          ' . $leadHtml . '
        </div>
        <div class="career-grid career-grid--preview">
' . $cards . '        </div>
        <a class="home-articles-more button secondary" href="' . esc((string) ($c['moreHref'] ?? 'careers.html')) . '">' . esc((string) ($c['moreText'] ?? '')) . '</a>
      </div>
    </section>';
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeSolutionsHeading(string $html, array $c): string
    {
        return self::patchBlock(
            $html,
            'id="cms-section-solutionsHeading"',
            '<div class="section-heading section-reveal">',
            '</div>',
            self::headingBlock($c)
        );
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeProductCategories(string $html, array $c): string
    {
        if (!empty($c['h2'])) {
            $html = preg_replace(
                '/(id="cms-section-productCategories"[\s\S]*?<header class="product-categories-head">\s*<h2>)[\s\S]*?(<\/h2>)/u',
                '$1' . esc((string) $c['h2']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        $chips = $c['chips'] ?? [];
        if (!is_array($chips) || $chips === []) {
            return $html;
        }
        $chipHtml = '';
        foreach ($chips as $chip) {
            if (!is_array($chip)) {
                continue;
            }
            $label = trim((string) ($chip['label'] ?? ''));
            $href = trim((string) ($chip['href'] ?? ''));
            if ($label === '' || $href === '') {
                continue;
            }
            $img = esc(trim((string) ($chip['image'] ?? '')));
            $chipHtml .= '            <a class="product-plan-chip" role="listitem" href="' . esc($href) . '" aria-label="ดูรายละเอียด ' . esc($label) . '">
              <span class="product-plan-chip-icon" aria-hidden="true">
                <img src="' . $img . '" alt="" loading="lazy" decoding="async">
              </span>
              <span class="product-plan-chip-label">' . esc($label) . '</span>
              <span class="product-plan-chip-arrow" aria-hidden="true">→</span>
            </a>' . "\n";
        }
        if ($chipHtml === '') {
            return $html;
        }
        return preg_replace(
            '/(id="cms-section-productCategories"[\s\S]*?<div class="product-plan-strip" role="list">)\s*[\s\S]*?(\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/u',
            '$1' . "\n" . $chipHtml . '$2',
            $html,
            1
        ) ?? $html;
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeIntro(string $html, array $c): string
    {
        if (!empty($c['eyebrow']) || !empty($c['h2'])) {
            $eyebrow = esc((string) ($c['eyebrow'] ?? ''));
            $h2 = esc((string) ($c['h2'] ?? ''));
            $html = preg_replace(
                '/(id="cms-section-intro"[\s\S]*?<div class="intro-heading-copy">\s*<p class="eyebrow">)[\s\S]*?(<\/p>\s*<h2>)[\s\S]*?(<\/h2>)/u',
                '$1' . $eyebrow . '$2' . $h2 . '$3',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($c['lead'])) {
            $html = preg_replace(
                '/(id="cms-section-intro"[\s\S]*?<p class="intro-lead">)[\s\S]*?(<\/p>)/u',
                '$1' . esc((string) $c['lead']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        $tags = $c['tags'] ?? [];
        if (is_array($tags) && $tags !== []) {
            $tagsHtml = '';
            foreach ($tags as $tag) {
                $title = is_array($tag) ? trim((string) ($tag['title'] ?? '')) : '';
                if ($title === '') {
                    continue;
                }
                $tagsHtml .= '              <li class="intro-tag">
                <span class="intro-tag-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <span class="intro-tag-body">
                  <strong class="intro-tag-title">' . esc($title) . '</strong>
                </span>
              </li>' . "\n";
            }
            if ($tagsHtml !== '') {
                $html = preg_replace(
                    '/(id="cms-section-intro"[\s\S]*?<ul class="intro-tags" role="list">)\s*[\s\S]*?(\s*<\/ul>)/u',
                    '$1' . "\n" . $tagsHtml . '$2',
                    $html,
                    1
                ) ?? $html;
            }
        }
        if (!empty($c['imageSrc'])) {
            $src = esc((string) $c['imageSrc']);
            $alt = esc((string) ($c['imageAlt'] ?? ''));
            $html = preg_replace(
                '/(id="cms-section-intro"[\s\S]*?<figure class="intro-image">\s*<img src=")[^"]*(" alt=")[^"]*(")/u',
                '$1' . $src . '$2' . $alt . '$3',
                $html,
                1
            ) ?? $html;
        }
        return $html;
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeProcess(string $html, array $c): string
    {
        if (!empty($c['eyebrow'])) {
            $html = preg_replace(
                '/(id="cms-section-process"[\s\S]*?<div class="process-panel[^"]*">\s*<p class="eyebrow">)[\s\S]*?(<\/p>)/u',
                '$1' . esc((string) $c['eyebrow']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($c['h2'])) {
            $html = preg_replace(
                '/(id="cms-section-process"[\s\S]*?<div class="process-panel[^"]*">[\s\S]*?<h2>)[\s\S]*?(<\/h2>)/u',
                '$1' . esc((string) $c['h2']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($c['copy'])) {
            $html = preg_replace(
                '/(id="cms-section-process"[\s\S]*?<p class="process-copy">)[\s\S]*?(<\/p>)/u',
                '$1' . esc((string) $c['copy']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        $linkText = trim((string) ($c['linkText'] ?? ''));
        $linkHref = trim((string) ($c['linkHref'] ?? 'contact.html'));
        if ($linkText !== '') {
            $html = preg_replace(
                '/(id="cms-section-process"[\s\S]*?<a class="process-link" href=")[^"]*(">)[\s\S]*?(<\/a>)/u',
                '$1' . esc($linkHref) . '$2' . esc($linkText) . '$3',
                $html,
                1
            ) ?? $html;
        }
        $steps = $c['steps'] ?? [];
        if (is_array($steps) && $steps !== []) {
            $stepsHtml = '';
            foreach ($steps as $step) {
                if (!is_array($step)) {
                    continue;
                }
                $num = esc((string) ($step['num'] ?? ''));
                $title = esc((string) ($step['title'] ?? ''));
                $desc = esc((string) ($step['desc'] ?? ''));
                if ($title === '' && $desc === '') {
                    continue;
                }
                $stepsHtml .= '        <div class="step section-reveal">
          <span>' . $num . '</span>
          <div>
            <strong>' . $title . '</strong>
            <p>' . $desc . '</p>
          </div>
        </div>' . "\n";
            }
            if ($stepsHtml !== '') {
                $html = preg_replace(
                    '/(id="cms-section-process"[\s\S]*?<div class="process-steps">)\s*[\s\S]*?(\s*<\/div>\s*<\/section>)/u',
                    '$1' . "\n" . $stepsHtml . '$2',
                    $html,
                    1
                ) ?? $html;
            }
        }
        return $html;
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeTaxPlansHeading(string $html, array $c): string
    {
        $html = self::patchBlock(
            $html,
            'data-cms-section="taxPlansHeading"',
            '<div class="section-heading section-reveal">',
            '</div>',
            self::headingBlock($c)
        );
        if (!empty($c['sidebarLabel'])) {
            $html = preg_replace(
                '/(data-cms-section="taxPlansHeading"[\s\S]*?<aside class="tax-plan-sidebar[^"]*"[^>]*>\s*<p>)[\s\S]*?(<\/p>)/u',
                '$1' . esc((string) $c['sidebarLabel']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        return $html;
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeTestimonialsHeading(string $html, array $c): string
    {
        if (!empty($c['h2'])) {
            $html = preg_replace(
                '/(id="cms-section-testimonials"[\s\S]*?<header class="testimonials-head[^"]*">\s*<h2>)[\s\S]*?(<\/h2>)/u',
                '$1' . esc((string) $c['h2']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($c['lead'])) {
            $html = preg_replace(
                '/(id="cms-section-testimonials"[\s\S]*?<header class="testimonials-head[^"]*">[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>)[\s\S]*?(<\/p>)/u',
                '$1' . esc((string) $c['lead']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        return $html;
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeArticlesBlock(string $html, array $c): string
    {
        $html = self::patchBlock(
            $html,
            'id="cms-section-homeArticles"',
            '<div class="section-heading section-reveal">',
            '</div>',
            self::headingBlock($c, 'home-articles-lead')
        );
        $moreText = trim((string) ($c['moreText'] ?? ''));
        $moreHref = trim((string) ($c['moreHref'] ?? ''));
        if ($moreText !== '' && $moreHref !== '') {
            $html = preg_replace(
                '/(id="cms-section-homeArticles"[\s\S]*?)(?:<p class="home-articles-more"><a class="text-link" href="|<a class="home-articles-more button secondary" href=")[^"]*(">)[^<]*(?:<\/a><\/p>|<\/a>)/u',
                '$1<a class="home-articles-more button secondary" href="' . esc($moreHref) . '">' . esc($moreText) . '</a>',
                $html,
                1
            ) ?? $html;
        }
        return $html;
    }

    /** @param array<string,mixed> $c */
    private static function patchHomeCtaBand(string $html, array $c): string
    {
        if (!empty($c['eyebrow'])) {
            $html = preg_replace(
                '/(id="cms-section-ctaBand"[\s\S]*?<p class="eyebrow">)[\s\S]*?(<\/p>)/u',
                '$1' . esc((string) $c['eyebrow']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($c['h2'])) {
            $html = preg_replace(
                '/(id="cms-section-ctaBand"[\s\S]*?<div class="cta-band-title-wrap">\s*<h2>)[\s\S]*?(<\/h2>)/u',
                '$1' . esc((string) $c['h2']) . '$2',
                $html,
                1
            ) ?? $html;
        }
        if (array_key_exists('copy', $c)) {
            $copy = esc((string) $c['copy']);
            $html = preg_replace(
                '/(id="cms-section-ctaBand"[\s\S]*?<div class="cta-band-title-wrap">[\s\S]*?<\/h2>\s*<p>)[\s\S]*?(<\/p>)/u',
                '$1' . $copy . '$2',
                $html,
                1
            ) ?? $html;
        }
        $btnText = trim((string) ($c['buttonText'] ?? ''));
        $btnHref = trim((string) ($c['buttonHref'] ?? 'contact.html'));
        if ($btnText !== '') {
            $html = preg_replace(
                '/(id="cms-section-ctaBand"[\s\S]*?<a class="button primary" href=")[^"]*(">)[\s\S]*?(<\/a>)/u',
                '$1' . esc($btnHref) . '$2' . esc($btnText) . '$3',
                $html,
                1
            ) ?? $html;
        }
        return $html;
    }

    /** @param array<string,mixed> $c */
    private static function headingBlock(array $c, string $leadClass = ''): string
    {
        $parts = [];
        if (!empty($c['eyebrow'])) {
            $parts[] = '<p class="eyebrow">' . esc((string) $c['eyebrow']) . '</p>';
        }
        if (!empty($c['h2'])) {
            $parts[] = '<h2>' . esc((string) $c['h2']) . '</h2>';
        }
        if (!empty($c['lead'])) {
            $cls = $leadClass !== '' ? ' class="' . $leadClass . '"' : '';
            $parts[] = '<p' . $cls . '>' . esc((string) $c['lead']) . '</p>';
        }
        return implode("\n          ", $parts) . "\n          ";
    }

    private static function patchBlock(
        string $html,
        string $sectionNeedle,
        string $openTag,
        string $closeTag,
        string $innerHtml
    ): string {
        $pattern = '/(' . preg_quote($sectionNeedle, '/') . '[\s\S]*?'
            . preg_quote($openTag, '/') . ')\s*[\s\S]*?(\s*'
            . preg_quote($closeTag, '/') . ')/u';
        $replaced = preg_replace($pattern, '$1' . $innerHtml . '$2', $html, 1);
        return $replaced ?? $html;
    }

    /** @return list<array<string,mixed>> */
    private static function loadHeroSlides(): array
    {
        return cms_db()->query(
            'SELECT * FROM home_hero_slides WHERE is_active = 1 ORDER BY sort_order, id'
        )->fetchAll();
    }

    private static function renderFeaturedPlansCarousel(): string
    {
        $stmt = cms_db()->query(
            "SELECT * FROM insurance_plans WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order, id"
        );
        $html = '';
        while ($p = $stmt->fetch()) {
            $href = $p['link_url'] ?: 'insurance.html';
            $cat = esc($p['filter_tag'] ?? 'all');
            $img = esc($p['image_path'] ?? '');
            $name = esc($p['name'] ?? '');
            $desc = esc($p['short_description'] ?? '');
            $html .= '              <article class="solution-item section-reveal" data-category="' . $cat . '">
                <a class="solution-media" href="' . esc($href) . '" aria-label="ดูรายละเอียด ' . $name . '">
                  <img src="' . $img . '" alt="ภาพแบบประกัน ' . $name . '" loading="lazy" decoding="async">
                </a>
                <div>
                  <h3><a href="' . esc($href) . '">' . $name . '</a></h3>
                  <p>' . $desc . '</p>
                </div>
              </article>' . "\n";
        }
        return $html;
    }

    /** Replace testimonial cards inside the home reviews carousel (full track, not first </div>). */
    private static function replaceTestimonialsCarouselTrack(string $html, string $cardsHtml): string
    {
        $pattern = '/(<div class="testimonial-carousel"[^>]*>[\s\S]*?<div class="solution-list" data-carousel-track>)\s*[\s\S]*?(\s*<\/div>\s*<\/div>\s*<div class="carousel-dots")/u';

        $replaced = preg_replace(
            $pattern,
            '$1' . "\n" . $cardsHtml . '$2',
            $html,
            1
        );

        return is_string($replaced) ? $replaced : $html;
    }

    private static function renderTestimonialsTrack(): string
    {
        $stmt = cms_db()->query(
            'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order, id'
        );
        $html = '';
        while ($t = $stmt->fetch()) {
            $stars = str_repeat('★', min(5, max(1, (int) ($t['rating'] ?? 5))));
            $letter = esc($t['avatar_letter'] ?? mb_substr((string) $t['customer_name'], 0, 1));
            $html .= '          <article class="testimonial-card section-reveal">
            <div class="testimonial-stars" role="img" aria-label="คะแนน ' . (int) ($t['rating'] ?? 5) . ' จาก 5 ดาว">
              <span aria-hidden="true">' . $stars . '</span>
            </div>
            <blockquote class="testimonial-quote">' . esc($t['quote_text'] ?? '') . '</blockquote>
            <footer class="testimonial-author">
              <span class="testimonial-avatar" aria-hidden="true">' . $letter . '</span>
              <div class="testimonial-author-text">
                <cite>' . esc($t['customer_name'] ?? '') . '</cite>
                <p>' . esc($t['customer_role'] ?? '') . '</p>
              </div>
            </footer>
          </article>' . "\n";
        }
        return $html;
    }

    private static function buildContact(): void
    {
        if (!is_file(self::$root . '/contact.html')) {
            return;
        }
        $html = self::readTemplate('contact.html');
        $hero = self::sectionConfig('contact', 'hero') ?? [];
        $channels = cms_db()->query(
            'SELECT * FROM contact_channels WHERE is_active = 1 ORDER BY sort_order, id'
        )->fetchAll();
        $chips = '';
        foreach ($channels as $c) {
            $variant = $c['variant'] ?? 'default';
            $cls = match ($variant) {
                'line' => 'contact-chip contact-chip--line',
                'facebook' => 'contact-chip contact-chip--facebook',
                default => 'contact-chip',
            };
            $href = $c['url'] ?? '#';
            $external = str_starts_with((string) $href, 'http');
            $rel = $external ? ' target="_blank" rel="noopener noreferrer"' : '';
            $chips .= '          <a class="' . $cls . '" href="' . esc($href) . '"' . $rel . ' role="listitem">
            <span class="contact-chip-icon" aria-hidden="true">
              ' . self::chipIcon((string) $variant) . '
            </span>
            <span class="contact-chip-text">
              <span class="contact-chip-title">' . esc($c['label'] ?? '') . '</span>
              <span class="contact-chip-meta">' . esc($c['value_text'] ?? '') . '</span>
            </span>
          </a>' . "\n";
        }
        $copyBlock = '      <div class="contact-copy">
        <p class="eyebrow">' . esc($hero['eyebrow'] ?? 'Contact Wealth Life Insure') . '</p>
        <h1>' . esc($hero['h1'] ?? 'คุยกับทีมไทยประกันชีวิต สาขาบางนา') . '</h1>
        <p>' . esc($hero['copy'] ?? '') . '</p>
        <div class="contact-links" role="list">
' . $chips . '        </div>
      </div>';
        $html = preg_replace(
            '/<div class="contact-copy">[\s\S]*?<\/div>\s*(?=\s*<form class="contact-form")/',
            $copyBlock . "\n\n",
            $html,
            1
        ) ?? $html;
        $html = self::replaceFooterInHtml($html, '');
        self::writeFile('contact.html', $html);
    }

    private static function buildAbout(): void
    {
        if (!is_file(self::$root . '/about.html') && !is_file(__DIR__ . '/templates/pages/about.html')) {
            return;
        }
        $html = self::readPageTemplate('about.html');
        $seo = self::seoPage('about', [
            'title' => 'ทีมงาน FSEG Wealth ตัวแทนไทยประกันชีวิต | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'metaDescription' => 'ทีมงาน FSEG Wealth ตัวแทนไทยประกันชีวิต สาขาบางนา ให้คำแนะนำประกันชีวิต สุขภาพ ออมทรัพย์ มรดก และลดหย่อนภาษี',
            'ogImage' => 'assets/logo/logo.png',
        ]);
        $hero = self::mergeSectionDefaults([
            'eyebrow' => 'Thai Life Insurance Bangna',
            'h1' => 'ทีมงาน FSEG Wealth ตัวแทนไทยประกันชีวิต',
            'lead' => 'Wealth Life Insure ดูแลโดยทีมผู้บริหารศูนย์และผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำแนะนำทั้งประกันชีวิต สุขภาพ ออมทรัพย์ มรดก และลดหย่อนภาษี',
        ], self::sectionConfig('about', 'hero'));
        $followup = self::mergeSectionDefaults([
            'text' => 'เราคือทีมงานตัวแทนไทยประกันชีวิต คนรุ่นใหม่ที่โดดเด่นด้านเทคโนโลยีและเชี่ยวชาญการวางแผนการเงิน เพื่อช่วยให้ลูกค้าบรรลุเป้าหมายทางการเงิน และสร้างที่ปรึกษามืออาชีพมาตรฐานระดับสากล คุณวุฒิ MDRT — ฟังก่อน แนะนำทีหลัง และช่วยดูแลเรื่องเอกสารและเคลมหลังทำกรมธรรม์',
        ], self::sectionConfig('about', 'followup'));
        $agent = self::aboutAgentConfig('agent');
        $agent2 = self::aboutAgentConfig('agent2');

        $html = self::replacePair(
            $html,
            '/(<div class="page-hero-intro">\s*<p class="eyebrow">)[^<]*(<\/p>)/',
            esc($hero['eyebrow'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<div class="page-hero-intro">[\s\S]*?<h1>)[^<]*(<\/h1>)/',
            esc($hero['h1'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<div class="page-hero-intro">[\s\S]*?<p class="page-hero-lead">)[^<]*(<\/p>)/',
            esc($hero['lead'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<p class="about-hero-followup">)[^<]*(<\/p>)/',
            esc($followup['text'] ?? '')
        );
        $html = self::patchFirstAgentPanel($html, $agent);
        $html = self::patchAgentPanelAtIndex($html, $agent2, 1);

        $html = self::replaceFooterInHtml($html, '');
        $html = self::patchHeaderBrand($html);
        if (!empty($seo['metaDescription'])) {
            $html = preg_replace(
                '/<meta name="description" content="[^"]*"/',
                '<meta name="description" content="' . esc($seo['metaDescription']) . '"',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($seo['title'])) {
            $html = preg_replace('/<title>[^<]*<\/title>/', '<title>' . esc($seo['title']) . '</title>', $html, 1) ?? $html;
        }
        self::writeFile('about.html', $html);
    }

    private static function buildInsurancePage(): void
    {
        if (!is_file(self::$root . '/insurance.html') && !is_file(__DIR__ . '/templates/pages/insurance.html')) {
            return;
        }
        $html = self::readPageTemplate('insurance.html');
        $seo = self::seoPage('insurance', [
            'title' => 'แบบประกัน | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'metaDescription' => 'รวมแบบประกันไทยประกันชีวิต เลกาซี ฟิต แคร์ คุ้มธนกิจ Health Fit DD ทีแอลแพลน และมันนี่ ฟิต เวลท์ตี้',
            'ogImage' => 'assets/logo/logo.png',
        ]);
        $hero = self::mergeSectionDefaults([
            'eyebrow' => 'Thai Life Insurance plans',
            'h1' => 'แบบประกันแนะนำจากไทยประกันชีวิต',
            'copy' => 'รวมแผนที่ตอบโจทย์ทั้งความคุ้มครองชีวิต สุขภาพ ค่ารักษา เงินออม มรดก และสิทธิลดหย่อนภาษี โดยทีมงานช่วยอธิบายเงื่อนไขให้เข้าใจง่ายก่อนตัดสินใจ',
        ], self::sectionConfig('insurance', 'hero'));
        $listing = self::mergeSectionDefaults([
            'eyebrow' => 'แบบประกันแนะนำ',
            'h2' => 'แผนหลักจากข้อมูลแบบประกันที่เหมาะกับหลายช่วงชีวิต',
            'lead' => '',
        ], self::sectionConfig('insurance', 'listingHeading'));

        $html = self::replacePair(
            $html,
            '/(<main>\s*<section class="page-hero section-reveal">\s*<p class="eyebrow">)[^<]*(<\/p>)/',
            esc($hero['eyebrow'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<main>\s*<section class="page-hero section-reveal">[\s\S]*?<h1>)[^<]*(<\/h1>)/',
            esc($hero['h1'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<main>\s*<section class="page-hero section-reveal">[\s\S]*?<p class="article-hero-lead">)[^<]*(<\/p>)/',
            esc($hero['copy'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<section class="solutions section-reveal" aria-label="แผนประกันแนะนำ">[\s\S]*?<div class="section-heading section-reveal">\s*<p class="eyebrow">)[^<]*(<\/p>)/',
            esc($listing['eyebrow'] ?? '')
        );
        $html = self::replacePair(
            $html,
            '/(<section class="solutions section-reveal" aria-label="แผนประกันแนะนำ">[\s\S]*?<div class="section-heading section-reveal">[\s\S]*?<h2>)[^<]*(<\/h2>)/',
            esc($listing['h2'] ?? '')
        );
        if (!empty($listing['lead'])) {
            $html = self::replaceOnce(
                $html,
                '/(<section class="solutions section-reveal" aria-label="แผนประกันแนะนำ">[\s\S]*?<div class="section-heading section-reveal">[\s\S]*?<h2>[^<]*<\/h2>)(\s*)/',
                '${1}' . "\n          <p>" . esc($listing['lead']) . '</p>${2}'
            );
        }

        $plansHtml = self::renderFeaturedPlansCarousel();
        if ($plansHtml !== '') {
            $html = preg_replace(
                '/<div class="solution-list" data-carousel-track>[\s\S]*?<\/div>\s*<\/div>\s*<p class="carousel-empty"/',
                '<div class="solution-list" data-carousel-track>' . "\n" . $plansHtml . '            </div>
          </div>
          <p class="carousel-empty"',
                $html,
                1
            ) ?? $html;
        }

        $html = self::replaceFooterInHtml($html, '');
        $html = self::patchHeaderBrand($html);
        if (!empty($seo['metaDescription'])) {
            $html = preg_replace(
                '/<meta name="description" content="[^"]*"/',
                '<meta name="description" content="' . esc($seo['metaDescription']) . '"',
                $html,
                1
            ) ?? $html;
        }
        if (!empty($seo['title'])) {
            $html = preg_replace('/<title>[^<]*<\/title>/', '<title>' . esc($seo['title']) . '</title>', $html, 1) ?? $html;
        }
        self::writeFile('insurance.html', $html);
    }

    private static function patchStaticPages(): void
    {
        foreach (['life-insurance.html', 'health-insurance.html', 'savings-retirement.html'] as $file) {
            $path = self::$root . '/' . $file;
            if (!is_file($path)) {
                continue;
            }
            $html = (string) file_get_contents($path);
            $html = self::replaceFooterInHtml($html, self::prefixFor($file));
            $html = self::patchHeaderBrand($html);
            $pageKey = str_replace(['.html', '-'], ['', '_'], pathinfo($file, PATHINFO_FILENAME));
            if ($pageKey === 'life_insurance') {
                $pageKey = 'lifeInsurance';
            }
            if ($pageKey === 'health_insurance') {
                $pageKey = 'healthInsurance';
            }
            if ($pageKey === 'savings_retirement') {
                $pageKey = 'savingsRetirement';
            }
            $seo = self::seoPage($pageKey, []);
            if (!empty($seo['metaDescription'])) {
                $html = preg_replace(
                    '/<meta name="description" content="[^"]*"/',
                    '<meta name="description" content="' . esc($seo['metaDescription']) . '"',
                    $html,
                    1
                ) ?? $html;
            }
            if (!empty($seo['title'])) {
                $html = preg_replace('/<title>[^<]*<\/title>/', '<title>' . esc($seo['title']) . '</title>', $html, 1) ?? $html;
            }
            self::writeFile($file, $html);
        }
    }

    private static function injectTrackingAll(): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(self::$root, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'html') {
                continue;
            }
            $rel = str_replace('\\', '/', substr($file->getPathname(), strlen(self::$root) + 1));
            if (str_starts_with($rel, 'cms/') || str_starts_with($rel, 'admin/')) {
                continue;
            }
            $html = (string) file_get_contents($file->getPathname());
            $html = Tracking::applyToHtml($html, self::$tracking);
            file_put_contents($file->getPathname(), $html);
            if (!in_array($rel, self::$written, true)) {
                self::$written[] = $rel;
            }
        }
    }

    private static function buildSitemap(): void
    {
        $base = rtrim(self::SITE_URL, '/');
        $urls = [
            ['loc' => $base . '/index.html', 'priority' => '1.0'],
            ['loc' => $base . '/about.html', 'priority' => '0.8'],
            ['loc' => $base . '/insurance.html', 'priority' => '0.9'],
            ['loc' => $base . '/life-insurance.html', 'priority' => '0.8'],
            ['loc' => $base . '/health-insurance.html', 'priority' => '0.8'],
            ['loc' => $base . '/savings-retirement.html', 'priority' => '0.8'],
            ['loc' => $base . '/news.html', 'priority' => '0.9'],
            ['loc' => $base . '/careers.html', 'priority' => '0.8'],
            ['loc' => $base . '/contact.html', 'priority' => '0.9'],
        ];
        foreach (self::$articles as $a) {
            $urls[] = [
                'loc' => $base . '/articles/' . (string) $a['slug'] . '.html',
                'priority' => '0.7',
            ];
        }
        foreach (self::$careers as $c) {
            $urls[] = [
                'loc' => $base . '/careers/' . (string) $c['slug'] . '.html',
                'priority' => '0.6',
            ];
        }

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $u) {
            $xml .= '  <url><loc>' . htmlspecialchars($u['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</loc><priority>' . htmlspecialchars($u['priority'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</priority></url>\n";
        }
        $xml .= '</urlset>';
        self::writeFile('sitemap.xml', $xml);
    }

    private static function syncPromosAll(): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(self::$root, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'html') {
                continue;
            }
            $rel = str_replace('\\', '/', substr($file->getPathname(), strlen(self::$root) + 1));
            if (str_starts_with($rel, 'cms/') || str_starts_with($rel, 'admin/')) {
                continue;
            }
            $html = (string) file_get_contents($file->getPathname());
            if (!str_contains($html, 'promo-duo')) {
                continue;
            }
            $prefix = self::prefixFor($rel);
            $promo = self::renderPromo($prefix);
            $html = preg_replace('/<section class="promo-duo[\s\S]*?<\/section>/', trim($promo), $html, 1) ?? $html;
            file_put_contents($file->getPathname(), $html);
            if (!in_array($rel, self::$written, true)) {
                self::$written[] = $rel;
            }
        }
    }

    private static function patchHeaderBrand(string $html): string
    {
        $brand = self::$header['brandName'] ?? self::$site['name'] ?? 'Wealth Life Insure';
        $html = preg_replace(
            '/<span class="brand-name" translate="no">[\s\S]*?<\/span>/',
            '<span class="brand-name" translate="no">' . esc($brand) . '</span>',
            $html,
            1
        ) ?? $html;
        return self::patchHeaderLogo($html);
    }

    private static function patchHeaderLogo(string $html, string $prefix = ''): string
    {
        $logo = ltrim((string) (self::$header['logoPath'] ?? 'assets/logo/logo.png'), '/');
        $src = esc($prefix . $logo);
        return preg_replace(
            '/(<header class="site-header"[\s\S]*?<img class="brand-logo" src=")[^"]*(")/u',
            '$1' . $src . '$2',
            $html,
            1
        ) ?? $html;
    }

    private static function replaceFooterInHtml(string $html, string $prefix): string
    {
        $block = self::renderFooterBlock($prefix);
        return preg_replace('/<footer class="site-footer"[^>]*>[\s\S]*?<\/footer>/u', trim($block), $html, 1) ?? $html;
    }

    /** Sync header nav + footer on every public HTML file */
    private static function syncGlobalChromeAll(): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(self::$root, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'html') {
                continue;
            }
            $rel = str_replace('\\', '/', substr($file->getPathname(), strlen(self::$root) + 1));
            if (str_starts_with($rel, 'cms/') || str_starts_with($rel, 'admin/')) {
                continue;
            }
            $prefix = self::prefixFor($rel);
            $current = self::pageKeyFromRel($rel);
            $html = (string) file_get_contents($file->getPathname());
            $header = self::renderHeader($prefix, $current);
            $html = preg_replace('/<header class="site-header">[\s\S]*?<\/header>/u', $header, $html, 1) ?? $html;
            $html = self::replaceFooterInHtml($html, $prefix);
            file_put_contents($file->getPathname(), $html);
            if (!in_array($rel, self::$written, true)) {
                self::$written[] = $rel;
            }
        }
    }

    private static function pageKeyFromRel(string $rel): string
    {
        if (str_starts_with($rel, 'articles/')) {
            return 'news';
        }
        if (str_starts_with($rel, 'careers/') && basename($rel) !== 'careers.html') {
            return 'careers';
        }
        $name = pathinfo($rel, PATHINFO_FILENAME);
        return match ($name) {
            'index' => 'home',
            default => $name,
        };
    }

    /** @param array<string,mixed> $article */
    private static function renderArticleCard(array $article, string $prefix): string
    {
        $href = $prefix . ($article['href'] ?? '');
        $img = $prefix . ($article['imageSrc'] ?? '');
        return '              <article class="solution-item section-reveal" data-category="' . esc($article['category'] ?? 'guide') . '">
                <a class="solution-media" href="' . esc($href) . '" aria-label="อ่านบทความ ' . esc($article['title'] ?? '') . '">
                  <img src="' . esc($img) . '" alt="' . esc($article['title'] ?? '') . '" width="800" height="500" loading="lazy" decoding="async">
                </a>
                <div>
                  <h3><a href="' . esc($href) . '">' . esc($article['title'] ?? '') . '</a></h3>
                  <p>' . esc($article['excerpt'] ?? '') . '</p>
                </div>
              </article>';
    }

    /** @param array<string,mixed> $career */
    private static function renderCareerCard(array $career, string $prefix): string
    {
        $href = $prefix . ($career['href'] ?? '');
        $img = $prefix . ($career['imageSrc'] ?? '');
        return '            <article class="career-card section-reveal">
              <a class="career-card-media" href="' . esc($href) . '" aria-label="อ่าน ' . esc($career['title'] ?? '') . '">
                <img src="' . esc($img) . '" alt="' . esc($career['title'] ?? '') . '" width="640" height="360" loading="lazy" decoding="async">
              </a>
              <div class="career-card-body">
                <h3><a href="' . esc($href) . '">' . esc($career['title'] ?? '') . '</a></h3>
                <p>' . esc($career['excerpt'] ?? '') . '</p>
                <a class="career-card-link" href="' . esc($href) . '">รายละเอียด &gt;&gt;</a>
              </div>
            </article>';
    }

    private static function renderArticleSidebar(string $currentSlug, string $prefix): string
    {
        $picks = array_values(array_filter(self::$articles, fn ($a) => ($a['slug'] ?? '') !== $currentSlug));
        $picks = array_slice($picks, 0, 6);
        $items = '';
        foreach ($picks as $a) {
            $items .= '            <li>
              <a class="article-sidebar-link" href="' . esc($a['slug'] ?? '') . '.html">
                <img src="' . $prefix . esc($a['imageSrc'] ?? '') . '" alt="" width="120" height="75" loading="lazy" decoding="async">
                <span>' . esc($a['title'] ?? '') . '</span>
              </a>
            </li>' . "\n";
        }
        return '        <aside class="article-sidebar section-reveal" aria-label="บทความแนะนำ">
          <h2>บทความแนะนำ</h2>
          <ul class="article-sidebar-list">
' . $items . '          </ul>
          <a class="text-link article-sidebar-all" href="' . $prefix . 'news.html">ดูบทความทั้งหมด</a>
        </aside>';
    }

    private static function renderRelatedCareers(string $currentSlug, string $prefix): string
    {
        $picks = array_values(array_filter(self::$careers, fn ($c) => ($c['slug'] ?? '') !== $currentSlug));
        $picks = array_slice($picks, 0, 3);
        $cards = '';
        foreach ($picks as $c) {
            $cards .= self::renderCareerCard($c, '') . "\n";
        }
        $total = count(self::$careers);
        return '      <section class="article-related-careers section-reveal" aria-label="แนะนำอาชีพอื่น ๆ">
        <h2>อ่านเรื่องอื่น ๆ</h2>
        <div class="career-grid career-grid--related">
' . $cards . '        </div>
        <p class="article-related-all"><a class="text-link" href="' . $prefix . 'careers.html">ดูทั้งหมด ' . $total . ' เรื่อง</a></p>
      </section>';
    }

    /** @param array{title: string, description: string, ogImage: string, prefix: string} $opts */
    private static function renderHead(array $opts): string
    {
        $og = $opts['ogImage'];
        if (!str_starts_with($og, 'http')) {
            $og = self::SITE_URL . '/' . ltrim($og, '/');
        }
        return '<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="' . esc($opts['description']) . '">
  <meta property="og:image" content="' . esc($og) . '">
  <meta name="twitter:image" content="' . esc($og) . '">
  <title>' . esc($opts['title']) . '</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="' . esc($opts['prefix']) . 'styles.css">
  <link rel="icon" type="image/png" href="' . esc($opts['prefix']) . 'assets/logo/logo.png">
  <link rel="apple-touch-icon" href="' . esc($opts['prefix']) . 'assets/logo/logo.png">
</head>';
    }

    private static function renderHeader(string $prefix, string $current): string
    {
        $brand = self::$header['brandName'] ?? self::$site['name'] ?? 'Wealth Life Insure';
        $logo = ltrim((string) (self::$header['logoPath'] ?? 'assets/logo/logo.png'), '/');
        $nav = self::loadNavItems('header');
        if ($nav === []) {
            $nav = [
                ['url' => 'index.html', 'label' => 'หน้าหลัก', 'is_cta' => 0, 'nav_id' => 'home'],
                ['url' => 'about.html', 'label' => 'เกี่ยวกับเรา', 'is_cta' => 0, 'nav_id' => 'about'],
                ['url' => 'insurance.html', 'label' => 'แบบประกัน', 'is_cta' => 0, 'nav_id' => 'insurance'],
                ['url' => 'news.html', 'label' => 'ข่าวสารและบทความ', 'is_cta' => 0, 'nav_id' => 'news'],
                ['url' => 'careers.html', 'label' => 'แนะนำอาชีพ', 'is_cta' => 0, 'nav_id' => 'careers'],
                ['url' => 'contact.html', 'label' => 'ปรึกษาฟรี', 'is_cta' => 1, 'nav_id' => 'contact'],
            ];
        }
        $links = '';
        foreach ($nav as $item) {
            $href = $prefix . ltrim((string) $item['url'], '/');
            $navId = $item['nav_id'] ?? self::navIdFromUrl((string) $item['url']);
            $currentAttr = $current === $navId ? ' aria-current="page"' : '';
            if (!empty($item['is_cta'])) {
                $links .= '      <a class="nav-cta" href="' . esc($href) . '"' . $currentAttr . '>' . esc($item['label'] ?? '') . "</a>\n";
            } else {
                $links .= '      <a href="' . esc($href) . '"' . $currentAttr . '>' . esc($item['label'] ?? '') . "</a>\n";
            }
        }
        return '  <header class="site-header">
    <a class="brand" href="' . esc($prefix) . 'index.html" aria-label="' . esc($brand) . '">
      <img class="brand-logo" src="' . esc($prefix . $logo) . '" width="320" height="110" decoding="async" alt="">
      <span class="brand-name" translate="no">' . esc($brand) . '</span>
    </a>
    <button class="nav-toggle" type="button" aria-label="เปิดเมนู" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="site-nav" aria-label="เมนูหลัก">
' . $links . '    </nav>
  </header>';
    }

    /** @return list<array<string,mixed>> */
    private static function loadNavItems(string $location): array
    {
        $stmt = cms_db()->prepare(
            'SELECT label, url, is_cta FROM nav_items WHERE location = ? AND is_active = 1 ORDER BY sort_order, id'
        );
        $stmt->execute([$location]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['nav_id'] = self::navIdFromUrl((string) $row['url']);
        }
        return $rows;
    }

    private static function navIdFromUrl(string $url): string
    {
        $base = basename($url, '.html');
        return match ($base) {
            'index', '' => 'home',
            default => $base,
        };
    }

    private static function renderFooterBlock(string $prefix): string
    {
        $site = self::$site;
        $footer = self::$footer;
        $b = $footer['brandCol'] ?? [];
        $tam = $site['phones']['tam'] ?? [];
        $a = $site['phones']['a'] ?? [];
        $brandSlug = $b['brandSlug'] ?? $site['brandSlug'] ?? 'wealthlifeinsure';
        $desc = $b['desc'] ?? $site['tagline'] ?? '';
        $mainLinks = self::footerLinksHtml($prefix, 'main', $footer['mainNav']['links'] ?? null);
        $productLinks = self::footerLinksHtml($prefix, 'products', $footer['productsNav']['links'] ?? null);
        $info = $footer['infoCol'] ?? [];
        $legal = $footer['legal'] ?? [];
        return '  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <a class="footer-brand" href="' . esc($prefix) . 'index.html" aria-label="' . esc($site['name'] ?? '') . ' หน้าแรก">
            <img class="footer-brand-logo" src="' . esc($prefix) . 'assets/logo/logo.png" width="280" height="96" decoding="async" alt="">
            <span class="footer-brand-name" translate="no">' . esc($brandSlug) . '</span>
          </a>
          <p class="footer-desc">' . esc($desc) . '</p>
          <ul class="footer-meta">
            <li><span class="footer-meta-label">โทร ' . esc($b['phoneTamLabel'] ?? $tam['label'] ?? 'แต้ม') . '</span> <a href="tel:' . esc($b['phoneTamTel'] ?? $tam['tel'] ?? '') . '">' . esc($b['phoneTamDisplay'] ?? $tam['display'] ?? '') . '</a></li>
            <li><span class="footer-meta-label">โทร ' . esc($b['phoneALabel'] ?? $a['label'] ?? 'เอ') . '</span> <a href="tel:' . esc($b['phoneATel'] ?? $a['tel'] ?? '') . '">' . esc($b['phoneADisplay'] ?? $a['display'] ?? '') . '</a></li>
            <li><span class="footer-meta-label">เวลาทำการ</span> ' . esc($b['hours'] ?? $site['hours'] ?? '') . '</li>
          </ul>
        </div>
        <nav class="footer-col" aria-labelledby="footer-nav-label">
          <h2 id="footer-nav-label" class="footer-col-title">' . esc($footer['mainNav']['title'] ?? 'เมนูหลัก') . '</h2>
          <ul class="footer-links">
            ' . $mainLinks . '
          </ul>
        </nav>
        <nav class="footer-col" aria-labelledby="footer-products-label">
          <h2 id="footer-products-label" class="footer-col-title">' . esc($footer['productsNav']['title'] ?? 'หมวดประกัน') . '</h2>
          <ul class="footer-links">
            ' . $productLinks . '
          </ul>
        </nav>
        <div class="footer-col footer-info-col">
          <h2 class="footer-col-title">' . esc($info['title'] ?? 'ข้อมูลเพิ่มเติม') . '</h2>
          <ul class="footer-info-list">
            <li><span class="footer-info-label">สำนักงาน</span> ' . esc($info['office'] ?? $site['office'] ?? '') . '</li>
            <li><span class="footer-info-label">ใบอนุญาต</span> ' . esc($info['licenses'] ?? $site['licenses'] ?? '') . '</li>
          </ul>
          <p class="footer-info-note">' . esc($info['note'] ?? $site['footerNote'] ?? '') . '</p>
        </div>
      </div>
      <div class="footer-base">
        <p class="footer-copy">' . esc($legal['copyright'] ?? $site['copyright'] ?? '') . '</p>
        <a class="footer-legal-link" href="' . esc($prefix) . 'contact.html#privacy">' . esc($legal['privacyLabel'] ?? 'Privacy Policy') . '</a>
        <a class="footer-legal-link footer-legal-link--end" href="' . esc($prefix) . 'contact.html#terms">' . esc($legal['termsLabel'] ?? 'Terms of Service') . '</a>
      </div>
    </div>
  </footer>';
    }

    /** @param list<array{href: string, label: string}>|null $defaults */
    private static function footerLinksHtml(string $prefix, string $group, ?array $defaults): string
    {
        $stmt = cms_db()->prepare(
            'SELECT label, url FROM footer_links WHERE group_key = ? AND is_active = 1 ORDER BY sort_order, id'
        );
        $stmt->execute([$group === 'products' ? 'products' : 'main']);
        $links = $stmt->fetchAll();
        if ($links === [] && $defaults) {
            $html = '';
            foreach ($defaults as $l) {
                $html .= '<li><a href="' . esc($prefix . ltrim($l['href'], '/')) . '">' . esc($l['label']) . "</a></li>\n            ";
            }
            return $html;
        }
        $html = '';
        foreach ($links as $l) {
            $html .= '<li><a href="' . esc($prefix . ltrim((string) $l['url'], '/')) . '">' . esc($l['label']) . "</a></li>\n            ";
        }
        return $html;
    }

    private static function renderFooter(string $prefix): string
    {
        return self::renderFooterBlock($prefix) . '
  <script src="' . esc($prefix) . 'script.js"></script>
</body>
</html>';
    }

    private static function renderPromo(string $prefix): string
    {
        $j = self::$promos['joinTeam'] ?? [];
        $i = self::$promos['insurance'] ?? [];
        $jHref = (string) ($j['href'] ?? 'careers.html');
        $iHref = (string) ($i['href'] ?? 'contact.html');
        if (!str_starts_with($jHref, 'http')) {
            $jHref = $prefix . ltrim($jHref, '/');
        }
        if (!str_starts_with($iHref, 'http')) {
            $iHref = $prefix . ltrim($iHref, '/');
        }
        $banners = cms_db()->query(
            "SELECT * FROM banners WHERE placement = 'promo' AND is_active = 1 ORDER BY sort_order LIMIT 2"
        )->fetchAll();
        if (count($banners) >= 2) {
            $j = ['href' => $banners[0]['button_url'] ?: $jHref, 'imageSrc' => $banners[0]['image_path'], 'alt' => $banners[0]['title'] ?? '', 'width' => '1200', 'height' => '630'];
            $i = ['href' => $banners[1]['button_url'] ?: $iHref, 'imageSrc' => $banners[1]['image_path'], 'alt' => $banners[1]['title'] ?? '', 'width' => '1200', 'height' => '630'];
            $jHref = (string) ($j['href'] ?? $jHref);
            $iHref = (string) ($i['href'] ?? $iHref);
        }
        $jImg = $prefix . ltrim((string) ($j['imageSrc'] ?? 'assets/promo/banner-join-team.png'), '/');
        $iImg = $prefix . ltrim((string) ($i['imageSrc'] ?? 'assets/promo/banner-insurance.png'), '/');
        return '    <section class="promo-duo section-reveal" aria-label="ลิงก์ด่วน">
      <div class="promo-duo-inner">
        <a class="promo-duo-card" href="' . esc($jHref) . '">
          <img src="' . esc($jImg) . '" width="' . esc((string) ($j['width'] ?? '1200')) . '" height="' . esc((string) ($j['height'] ?? '630')) . '" loading="lazy" decoding="async" alt="' . esc($j['alt'] ?? '') . '">
        </a>
        <a class="promo-duo-card" href="' . esc($iHref) . '">
          <img src="' . esc($iImg) . '" width="' . esc((string) ($i['width'] ?? '1200')) . '" height="' . esc((string) ($i['height'] ?? '630')) . '" loading="lazy" decoding="async" alt="' . esc($i['alt'] ?? '') . '">
        </a>
      </div>
    </section>';
    }

    private static function chipIcon(string $variant): string
    {
        if ($variant === 'line') {
            return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7H8.5l-3.4 2.5a.5.5 0 01-.8-.4v-2.1a8.5 8.5 0 01-2-5.5 8.38 8.38 0 013.3-6.7 8.5 8.5 0 0111.4 1.1 8.38 8.38 0 011.5 5.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
                <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>';
        }
        if ($variant === 'facebook') {
            return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
              </svg>';
        }
        return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.86.3 1.7.54 2.5a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.58-1.11a2 2 0 012.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
              </svg>';
    }
}

function esc(?string $s): string
{
    return htmlspecialchars((string) ($s ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
