<?php
declare(strict_types=1);

require_once __DIR__ . '/Tracking.php';
require_once __DIR__ . '/InsuranceCategories.php';

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
        self::ensureDbSchema();
        InsuranceCategories::ensureSeeded();
        self::ensureFeaturedSavingsPlans();
        self::loadContext();

        self::buildNews();
        self::buildCareersListing();
        foreach (self::$articles as $article) {
            self::buildArticle($article);
        }
        foreach (self::$careers as $career) {
            self::buildCareer($career);
        }
        self::buildInsurancePlanPages();
        self::buildIndex();
        self::buildContact();
        self::buildAbout();
        self::buildInsurancePage();
        self::patchStaticPages();
        self::syncPromosAll();
        self::syncGlobalChromeAll();
        self::injectThemeVarsAll();
        self::injectTrackingAll();
        self::buildSitemap();

        return ['files' => self::$written, 'count' => count(self::$written)];
    }

    private static function ensureFeaturedSavingsPlans(): void
    {
        try {
            $db = cms_db();
            $slugs = [
                'money-fit-firm-25-20',
                'money-fit-firm-15-10',
                'thanthawi-15-8',
                'money-fit-wealthy-12-6',
            ];
            $max = (int) $db->query(
                "SELECT COALESCE(MAX(sort_order), 0) FROM insurance_plans WHERE is_featured = 1 AND is_active = 1"
            )->fetchColumn();
            $sort = $max;
            $upd = $db->prepare(
                'UPDATE insurance_plans SET is_featured = 1, is_active = 1, sort_order = ?
                 WHERE slug = ? AND (is_featured = 0 OR is_featured IS NULL)'
            );
            foreach ($slugs as $slug) {
                $check = $db->prepare('SELECT id, is_featured FROM insurance_plans WHERE slug = ? LIMIT 1');
                $check->execute([$slug]);
                $row = $check->fetch();
                if (!$row || (int) $row['is_featured'] === 1) {
                    continue;
                }
                $sort++;
                $upd->execute([$sort, $slug]);
            }
        } catch (Throwable) {
            // ไม่ให้ build พังถ้าโฮสยังไม่มีแผนเหล่านี้
        }
    }

    /** เพิ่ม column ที่โฮสต์เก่าอาจยังไม่มี (ก่อน build ครั้งแรกหลังอัปเดต) */
    private static function ensureDbSchema(): void
    {
        try {
            $db = cms_db();
            $col = $db->query("SHOW COLUMNS FROM insurance_plans LIKE 'listing_sections'")->fetch();
            if (!$col) {
                $db->exec(
                    "ALTER TABLE insurance_plans
                     ADD COLUMN listing_sections JSON NULL
                     COMMENT 'กลุ่มแสดงใน insurance.html tax-plan grid'
                     AFTER filter_tag"
                );
            }
            $filterCol = $db->query("SHOW COLUMNS FROM insurance_plans LIKE 'filter_tag'")->fetch();
            if ($filterCol && stripos((string) ($filterCol['Type'] ?? ''), 'enum') !== false) {
                $db->exec(
                    "ALTER TABLE insurance_plans
                     MODIFY filter_tag VARCHAR(64) NOT NULL DEFAULT 'all'"
                );
            }
        } catch (Throwable) {
            // ถ้า ALTER ไม่ได้ ให้ build ข้ามส่วน listing_sections แทนการล้มทั้งกระบวนการ
        }
    }

    private static function hasListingSectionsColumn(): bool
    {
        static $has = null;
        if ($has !== null) {
            return $has;
        }
        try {
            $has = (bool) cms_db()->query("SHOW COLUMNS FROM insurance_plans LIKE 'listing_sections'")->fetch();
        } catch (Throwable) {
            $has = false;
        }
        return $has;
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
             ORDER BY a.is_featured DESC, a.sort_order, a.published_at DESC, a.id"
        );
        while ($row = $stmt->fetch()) {
            self::$articles[] = self::mapArticle($row);
        }
        self::$articles = self::dedupeContentByBaseSlug(self::$articles);

        self::$careers = [];
        $stmt = $db->query(
            "SELECT * FROM careers WHERE status = 'published' ORDER BY is_featured DESC, sort_order, id"
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
            'bodyHtml' => self::prefixNestedPageContentHtml((string) ($row['body_html'] ?? ''), '../'),
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
            'bodyHtml' => self::prefixNestedPageContentHtml((string) ($row['body_html'] ?? ''), '../'),
        ];
    }

    /**
     * Rewrite root-relative media src (uploads/..., assets/...) for pages under articles/ or careers/.
     * Leaves absolute http(s), data:, and already-prefixed ../ paths alone.
     */
    private static function prefixNestedPageMediaHtml(string $html, string $prefix): string
    {
        if ($html === '' || $prefix === '') {
            return $html;
        }
        $out = preg_replace_callback(
            '/<(img|iframe|source|video)\b([^>]*?\bsrc\s*=\s*)(["\'])([^"\']+)\3/iu',
            static function (array $m) use ($prefix): string {
                $src = trim($m[4]);
                if ($src === ''
                    || preg_match('#^(?:https?:|//|data:|\#|mailto:)#i', $src)
                ) {
                    return $m[0];
                }
                $src = preg_replace('#^(\./)+#', '', $src) ?? $src;
                while (str_starts_with($src, '../')) {
                    $src = substr($src, 3);
                }
                $src = ltrim($src, '/');
                return '<' . $m[1] . $m[2] . $m[3] . $prefix . $src . $m[3];
            },
            $html
        );
        return is_string($out) ? $out : $html;
    }

    /** Rewrite root-relative links and media for nested pages (articles/, plans/, careers/). */
    private static function prefixNestedPageContentHtml(string $html, string $prefix): string
    {
        if ($html === '' || $prefix === '') {
            return $html;
        }
        $html = self::prefixNestedPageMediaHtml($html, $prefix);
        $out = preg_replace_callback(
            '/<a\b([^>]*?\bhref\s*=\s*)(["\'])([^"\']+)\2/iu',
            static function (array $m) use ($prefix): string {
                $href = trim($m[3]);
                if ($href === ''
                    || preg_match('#^(?:https?:|//|\#|mailto:|tel:)#i', $href)
                ) {
                    return $m[0];
                }
                $href = preg_replace('#^(\./)+#', '', $href) ?? $href;
                while (str_starts_with($href, '../')) {
                    $href = substr($href, 3);
                }
                $href = ltrim($href, '/');
                if (str_starts_with($href, $prefix)) {
                    return $m[0];
                }
                return '<a' . $m[1] . $m[2] . $prefix . $href . $m[2];
            },
            $html
        );

        return is_string($out) ? $out : $html;
    }

    /** Prefix url(...) paths inside inline style attributes for nested pages (plans/, articles/). */
    private static function prefixNestedPageStyleAssets(string $html, string $prefix): string
    {
        if ($html === '' || $prefix === '') {
            return $html;
        }
        $out = preg_replace_callback(
            '/\bstyle=(["\'])([^"\']*)\1/iu',
            static function (array $m) use ($prefix): string {
                $style = preg_replace_callback(
                    '/url\((["\']?)([^"\')]+)\1\)/iu',
                    static function (array $u) use ($prefix): string {
                        $src = trim($u[2]);
                        if ($src === '' || preg_match('#^(?:https?:|//|data:)#i', $src)) {
                            return $u[0];
                        }
                        $src = preg_replace('#^(\./|\.\./)+#', '', $src) ?? $src;
                        $src = ltrim($src, '/');
                        if (str_starts_with($src, $prefix)) {
                            return $u[0];
                        }

                        return 'url(' . $u[1] . $prefix . $src . $u[1] . ')';
                    },
                    $m[2]
                );

                return 'style=' . $m[1] . (is_string($style) ? $style : $m[2]) . $m[1];
            },
            $html
        );

        return is_string($out) ? $out : $html;
    }

    /** Full nested-page prefix pass (links, media src, inline bg images). */
    private static function prefixNestedPlanPageHtml(string $html): string
    {
        $html = self::prefixNestedPageContentHtml($html, '../');
        return self::prefixNestedPageStyleAssets($html, '../');
    }

    private static function renderBuilderRichHtml(string $content): string
    {
        $content = trim($content);
        if ($content === '') {
            return '';
        }
        if (str_contains($content, '<')) {
            return self::prefixNestedPageContentHtml($content, '../');
        }

        return nl2br(esc($content));
    }

    private static function renderBuilderRichBlock(string $content, string $tag = 'p'): string
    {
        $inner = self::renderBuilderRichHtml($content);
        if ($inner === '') {
            return '';
        }
        if (str_contains($content, '<')) {
            return '          <div class="ipb__rich-content">' . $inner . "</div>\n";
        }

        return '          <' . $tag . '>' . $inner . '</' . $tag . ">\n";
    }

    /** Plain text or Quill HTML for hero / whoFor (avoid showing literal &lt;p&gt; tags). */
    private static function renderBuilderPlainOrHtml(string $content, string $plainClass = ''): string
    {
        $content = trim($content);
        if ($content === '') {
            return '';
        }
        if (str_contains($content, '<')) {
            return '        <div class="ipb__rich-content">' . self::renderBuilderRichHtml($content) . "</div>\n";
        }
        $classAttr = $plainClass !== '' ? ' class="' . esc($plainClass) . '"' : '';

        return '        <p' . $classAttr . '>' . esc($content) . "</p>\n";
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

    /** Load stored section config regardless of is_active (for build). */
    private static function sectionConfigRaw(string $pageKey, string $sectionKey): ?array
    {
        $stmt = cms_db()->prepare(
            'SELECT config FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1'
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

    /**
     * รวมค่าโปรไฟล์ตัวแทน — อนุญาตให้ลบข้อความได้ (ค่าว่างต้องไม่ถูกแทนด้วย default)
     *
     * @param array<string,mixed> $defaults
     * @param array<string,mixed> $item
     * @return array<string,mixed>
     */
    private static function mergeAgentProfileDefaults(array $defaults, array $item): array
    {
        $out = $defaults;
        foreach ($item as $key => $value) {
            if ($value === null) {
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

    /** @return list<array<string,mixed>> */
    private static function aboutAgentsList(): array
    {
        $defaults = [
            [
                'eyebrow' => 'ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา',
                'h2' => 'คุณ จักรี น้อยดอนไพร (แต้ม)',
                'photo' => 'assets/profile/1c19a9f2-c428-4cec-bbd2-59b6e4993178.png',
                'lead' => 'สวัสดีครับ ผมแต้ม ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
                'body' => "ผมเชื่อว่าการทำประกันที่ดีไม่ใช่แค่เลือกแผนให้ถูกต้อง แต่ต้องมีทีมตัวแทนช่วยดูแลคำถาม เอกสาร และการเคลมหลังทำกรมธรรม์ — ไม่ปล่อยให้คุณต้องจัดการกับศูนย์บริการเพียงช่องทางเดียว\n\nทีม Wealth Life Insure ใช้เทคโนโลยีช่วยอธิบายและติดตามงาน เพื่อให้ลูกค้าได้รับคำแนะนำที่ชัดเจนและบริการต่อเนื่องจริง ๆ",
                'license' => '6701031779',
                'email' => 'jugkreenoidonpri@gmail.com',
                'phone' => '087-046-7443',
                'phoneTel' => '0870467443',
                'lineUrl' => 'https://line.me/R/ti/p/~0870467443',
                'facebookUrl' => 'https://www.facebook.com/daddyTammomA',
                'facebookLabel' => 'facebook.com/daddyTammomA',
            ],
            [
                'eyebrow' => 'ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา',
                'h2' => 'คุณ เอ',
                'photo' => 'assets/profile/7f0ffeae-0f98-4d34-ae70-3c6266dc11e6.png',
                'lead' => 'สวัสดีค่ะ ดิฉันเอ ผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
                'body' => "ดิฉันเชื่อว่าการทำประกันที่ดีไม่ใช่แค่เลือกแผนให้ถูกต้อง แต่ต้องมีทีมตัวแทนช่วยดูแลคำถาม เอกสาร และการเคลมหลังทำกรมธรรม์ — ไม่ปล่อยให้คุณต้องจัดการกับศูนย์บริการเพียงช่องทางเดียว\n\nทีม Wealth Life Insure ใช้เทคโนโลยีช่วยอธิบายและติดตามงาน เพื่อให้ลูกค้าได้รับคำแนะนำที่ชัดเจนและบริการต่อเนื่องจริง ๆ",
                'license' => '6701024924',
                'email' => '',
                'phone' => '083-451-5615',
                'phoneTel' => '0834515615',
                'lineUrl' => 'https://line.me/R/ti/p/~0834515615',
                'facebookUrl' => 'https://www.facebook.com/MomAThailife',
                'facebookLabel' => 'facebook.com/MomAThailife',
            ],
        ];

        $agents = self::sectionConfig('about', 'agents');
        $items = [];
        if (is_array($agents) && isset($agents['items']) && is_array($agents['items']) && $agents['items'] !== []) {
            $items = $agents['items'];
        } elseif (is_array($agents) && (isset($agents['agent']) || isset($agents['agent2']))) {
            if (is_array($agents['agent'] ?? null)) {
                $items[] = $agents['agent'];
            }
            if (is_array($agents['agent2'] ?? null)) {
                $items[] = $agents['agent2'];
            }
        } else {
            $a1 = self::sectionConfig('about', 'agent');
            $a2 = self::sectionConfig('about', 'agent2');
            if (is_array($a1) && $a1 !== []) {
                $items[] = $a1;
            }
            if (is_array($a2) && $a2 !== []) {
                $items[] = $a2;
            }
        }

        if ($items === []) {
            return $defaults;
        }

        $out = [];
        foreach ($items as $i => $item) {
            if (!is_array($item)) {
                continue;
            }
            $base = $defaults[$i] ?? $defaults[0];
            $out[] = self::mergeAgentProfileDefaults($base, $item);
        }
        return $out !== [] ? $out : $defaults;
    }

    /** @param array<string,mixed> $agent */
    private static function renderAgentPanel(array $agent): string
    {
        $name = (string) ($agent['h2'] ?? '');
        $photo = (string) ($agent['photo'] ?? '');
        $eyebrow = (string) ($agent['eyebrow'] ?? '');
        $lead = (string) ($agent['lead'] ?? '');
        $license = (string) ($agent['license'] ?? '');
        $phone = (string) ($agent['phone'] ?? '');
        $phoneTel = (string) ($agent['phoneTel'] ?? preg_replace('/\D+/', '', $phone) ?? '');
        $lineUrl = (string) ($agent['lineUrl'] ?? '');
        $facebookUrl = (string) ($agent['facebookUrl'] ?? '');
        $facebookLabel = (string) ($agent['facebookLabel'] ?? '');
        if ($facebookLabel === '' && $facebookUrl !== '') {
            $facebookLabel = preg_replace('#^https?://(www\.)?#i', '', $facebookUrl) ?? $facebookUrl;
            $facebookLabel = rtrim((string) $facebookLabel, '/');
        }

        $bodyHtml = '';
        $body = trim((string) ($agent['body'] ?? ''));
        if ($body !== '') {
            $parts = preg_split("/\n\s*\n/u", $body) ?: [];
            foreach ($parts as $p) {
                $p = trim($p);
                if ($p === '') {
                    continue;
                }
                $bodyHtml .= '            <p>' . esc($p) . "</p>\n";
            }
        }

        $phoneValue = '';
        if ($phone !== '') {
            $telHref = $phoneTel !== '' ? 'tel:' . preg_replace('/\D+/', '', $phoneTel) : '';
            $phoneLink = $telHref !== ''
                ? '<a href="' . esc($telHref) . '">' . esc($phone) . '</a>'
                : esc($phone);
            $lineLink = $lineUrl !== ''
                ? ' · <a href="' . esc($lineUrl) . '" target="_blank" rel="noreferrer">Line</a>'
                : '';
            $phoneValue = $phoneLink . $lineLink;
        } elseif ($lineUrl !== '') {
            $phoneValue = '<a href="' . esc($lineUrl) . '" target="_blank" rel="noreferrer">Line</a>';
        }

        $fbValue = '';
        if ($facebookUrl !== '') {
            $fbValue = '<a href="' . esc($facebookUrl) . '" target="_blank" rel="noreferrer">' . esc($facebookLabel !== '' ? $facebookLabel : $facebookUrl) . '</a>';
        }

        $contact = '';
        if ($license !== '') {
            $contact .= '            <li class="agent-contact-item">
              <span class="agent-dt-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
                  <path d="M8 10h8M8 14h5M8 18h6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
                </svg>
              </span>
              <div class="agent-contact-text">
                <span class="agent-contact-label">ใบอนุญาตเลขที่</span>
                <span class="agent-contact-value">' . esc($license) . '</span>
              </div>
            </li>' . "\n";
        }
        if ($phoneValue !== '') {
            $contact .= '            <li class="agent-contact-item">
              <span class="agent-dt-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.86.3 1.7.54 2.5a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.58-1.11a2 2 0 012.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="agent-contact-text">
                <span class="agent-contact-label">โทร / Line</span>
                <span class="agent-contact-value">' . $phoneValue . '</span>
              </div>
            </li>' . "\n";
        }
        if ($fbValue !== '') {
            $contact .= '            <li class="agent-contact-item">
              <span class="agent-dt-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="agent-contact-text">
                <span class="agent-contact-label">Facebook</span>
                <span class="agent-contact-value">' . $fbValue . '</span>
              </div>
            </li>' . "\n";
        }

        return '      <article class="agent-profile-panel section-reveal">
        <div class="agent-profile-media">
          <figure class="agent-card-photo agent-card-photo--panel">
            <img src="' . esc($photo) . '" width="640" height="800" decoding="async" alt="' . esc($name) . '">
          </figure>
        </div>

        <div class="agent-profile-content">
          <div class="agent-profile-meta">
            <p class="eyebrow">' . esc($eyebrow) . '</p>
            <h2>' . esc($name) . '</h2>
          </div>

          <div class="agent-intro-copy">
            <p class="agent-intro-lead">' . esc($lead) . '</p>
' . $bodyHtml . '          </div>

          <ul class="agent-contact-list">
' . $contact . '          </ul>
        </div>
      </article>';
    }

    /** @return array<string,mixed> */
    private static function aboutAgentConfig(string $which): array
    {
        $list = self::aboutAgentsList();
        $idx = $which === 'agent2' ? 1 : 0;
        return $list[$idx] ?? ($list[0] ?? []);
    }

    private static function prefixFor(string $filePath): string
    {
        $depth = substr_count(str_replace('\\', '/', $filePath), '/');
        return $depth > 0 ? str_repeat('../', $depth) : '';
    }

    /**
     * @param array{file: string, current: string, title: string, description: string, ogImage?: string, main: string, skipPromo?: bool} $opts
     */
    private static function pageShell(array $opts): string
    {
        $prefix = self::prefixFor($opts['file']);
        $ogImage = $opts['ogImage'] ?? 'assets/logo/logo.png';
        $promoHtml = !empty($opts['skipPromo']) ? '' : self::renderPromo($prefix);

        return self::renderHead([
            'title' => $opts['title'],
            'description' => $opts['description'],
            'ogImage' => $ogImage,
            'prefix' => $prefix,
        ]) . "\n<body>\n"
            . self::renderHeader($prefix, $opts['current'])
            . "  <main>\n" . $opts['main'] . "\n  </main>\n"
            . $promoHtml
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
          <img src="' . $prefix . esc($article['imageSrc'] ?? '') . '" alt="' . esc($article['h1'] ?? '') . '" loading="eager" decoding="async">
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
          <img src="' . $prefix . esc($career['imageSrc'] ?? '') . '" alt="' . esc($career['h1'] ?? '') . '" loading="eager" decoding="async">
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
        $homeHero = self::sectionConfigRaw('home', 'hero');
        $slides = self::loadHeroSlides();

        if ($homeHero !== null || $slides !== []) {
            $html = self::patchHomeHero($html, $homeHero ?? [], $slides);
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
        // หน้าแรกไม่แสดง「แบบประกันทั้งหมด」และ Savings & tax อีกต่อไป (คงเมนู/หน้ารายละเอียดแผน)
        $html = self::stripHtmlSectionById($html, 'cms-section-productCategories');
        $html = self::stripHtmlSectionById($html, 'tax-plans');
        $html = self::syncHomeCareersSection($html);
        $html = self::syncHomeArticlesSection($html);
        $html = self::patchPlanCarouselFilterOptions($html);

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

    /** @param array<string,mixed> $hero @param list<array<string,mixed>> $slides */
    private static function patchHomeHero(string $html, array $hero, array $slides): string
    {
        $eyebrow = $hero['eyebrow'] ?? 'ไทยประกันชีวิต สาขาบางนา';
        $h1Spans = $hero['h1Spans'] ?? ['วางแผนประกันชีวิต สุขภาพ', 'และมรดกกับทีมที่ดูแลจริง'];
        if (!is_array($h1Spans)) {
            $h1Spans = [(string) $h1Spans];
        }
        $copy = $hero['copy'] ?? '';
        $spanHtml = '';
        foreach ($h1Spans as $s) {
            $line = is_array($s) ? (string) ($s['line'] ?? '') : (string) $s;
            if ($line === '') {
                continue;
            }
            $spanHtml .= '          <span>' . esc($line) . "</span>\n";
        }
        $slideHtml = '';
        foreach ($slides as $i => $s) {
            $active = $i === 0 ? ' is-active' : '';
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

        return preg_replace(
            '/(id="cms-section-hero"[\s\S]*?)<div class="hero-content">[\s\S]*?<\/div>\s*<div class="hero-slides">[\s\S]*?<\/div>/u',
            '$1' . $replacement,
            $html,
            1
        ) ?? $html;
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
            $row = self::categorySection('home', $key);
            // ปิด「แสดง」แล้วให้ตัดบล็อกออกจากหน้าแรก (ไม่เหลือช่องว่างเก่า)
            if ($key === 'productCategories' && ($row === null || !$row['is_active'])) {
                $html = self::stripHtmlSectionById($html, 'cms-section-productCategories');
                continue;
            }
            if ($key === 'taxPlansHeading' && ($row === null || !$row['is_active'])) {
                $html = self::stripHtmlSectionById($html, 'tax-plans');
                continue;
            }
            $cfg = ($row !== null && $row['is_active']) ? $row['config'] : null;
            if ($cfg !== null && $cfg !== []) {
                $html = self::$method($html, $cfg);
            }
        }
        return $html;
    }

    private static function stripHtmlSectionById(string $html, string $id): string
    {
        $quoted = preg_quote($id, '/');
        $next = preg_replace(
            '/\s*<section\b[^>]*\bid="' . $quoted . '"[^>]*>[\s\S]*?<\/section>/u',
            "\n",
            $html,
            1
        );
        return is_string($next) ? $next : $html;
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

    private static function syncHomeArticlesSection(string $html): string
    {
        if (self::$articles === []) {
            return $html;
        }

        $cards = '';
        foreach (self::$articles as $a) {
            $cards .= '              ' . trim(self::renderArticleCard($a, '')) . "\n";
        }

        return preg_replace(
            '/(id="cms-section-homeArticles"[\s\S]*?<div class="solution-list" data-carousel-track>\s*)[\s\S]*?(\s*<\/div>\s*<\/div>\s*<p class="carousel-empty" data-carousel-empty)/u',
            '$1' . $cards . '$2',
            $html,
            1
        ) ?? $html;
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
            $href = self::resolvePlanHref($label);
            if ($label === '') {
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

    /** @return array<string, string> slug => category page#anchor (legacy — ใช้แค่ normalize link_url เก่า) */
    private static function categoryPlanAnchors(): array
    {
        return [
            'legacy-fit-care-99-10' => 'life-insurance.html#legacy-fit-care-99-10',
            'khumthanakit-99-20-nn' => 'life-insurance.html#khumthanakit-99-20-nn',
            'health-fit-dd' => 'health-insurance.html#health-fit-dd',
            'tl-plan' => 'savings-retirement.html#tl-plan',
            'money-fit-wealthy-18-4' => 'savings-retirement.html#money-fit-wealthy-18-4',
        ];
    }

    private static function planSlug(string $name): string
    {
        static $aliases = [
            'เลกาซี ฟิต แคร์ 99/10' => 'legacy-fit-care-99-10',
            'คุ้มธนกิจ 99/20 (Nn)' => 'khumthanakit-99-20-nn',
            'Health Fit DD' => 'health-fit-dd',
            'ทีแอลแพลน' => 'tl-plan',
            'ทีแอลแพลน 20/15' => 'tl-plan-20-15',
            'TL Plan 20/15' => 'tl-plan-20-15',
            'มันนี่ ฟิต เวลท์ตี้ 18/4' => 'money-fit-wealthy-18-4',
            'มันนี่ ฟิต เวลท์ตี้ 18/4 (มีเงินปันผล)' => 'money-fit-wealthy-18-4',
            'มันนี่ ฟิต เฟิร์ม 25/20 (มีเงินปันผล)' => 'money-fit-firm-25-20',
            'มันนี่ ฟิต เฟิร์ม 15/10 (มีเงินปันผล)' => 'money-fit-firm-15-10',
            'มันนี่ ฟิต เฟิร์ม 25/20' => 'money-fit-firm-25-20',
            'มันนี่ ฟิต เฟิร์ม 15/10' => 'money-fit-firm-15-10',
            'มันนี่ ฟิต เวลท์ตี้ 12/6 (มีเงินปันผล)' => 'money-fit-wealthy-12-6',
            'มันนี่ ฟิต เวลท์ตี้ 15/5 (มีเงินปันผล)' => 'money-fit-wealthy-15-5',
            'ธนทวี 15/8 (1)' => 'thanthawi-15-8',
            'ธนทวี 25/15' => 'thanthawi-25-15',
            'ทรัพย์ปันผล 20/20 (มีเงินปันผล)' => 'sapunphan-20-20',
            'ทรัพย์ปันผล (1) 20/20 (มีเงินปันผล)' => 'sapunphan-20-20-child',
            'ทรัพย์ทวี 300 SG' => 'sapthawi-300-sg',
            'ทรัพย์บำนาญ 60 (2) [AV60]' => 'sapbaman-60-av60',
            'คุ้มทวี 10 เท่า' => 'khumthawi-10x',
            'คุ้มธนกิจ 99/20 (Nท)' => 'khumthanakit-99-20-nt',
            'คุ้มธนกิจ 99/20 (1ท)' => 'ค-มธนก-จ-99-20',
            'คุ้มธนกิจ 90/7' => 'khumthanakit-90-7',
            'ผู้ป่วยในและผู้ป่วยนอก' => 'ผ-ป-วยในและผ-ป-วยนอก',
            'เลือก Deductible ได้' => 'เล-อก-deductible-ได',
            'ซื้อ OPD เพิ่มได้' => 'ซ-อ-opd-เพ-มได',
            'จุดเด่นของ Health Fit DD' => 'health-fit-dd',
        ];
        $name = trim($name);
        if (isset($aliases[$name])) {
            return $aliases[$name];
        }
        $base = preg_replace('/\s*\([^)]*\)\s*/u', ' ', $name) ?? $name;
        $slug = mb_strtolower(trim($base), 'UTF-8');
        $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', $slug) ?? '';
        $slug = trim($slug, '-');
        return self::sanitizePlanFileSlug($slug !== '' ? $slug : 'plan');
    }

    /**
     * บังคับ slug ไฟล์แผนให้เป็นชื่อไฟล์เดียวใต้ plans/ — ห้ามมี / ช่องว่าง หรืออักขระ path
     * (slug แบบ "TL Plan 20/15" จะทำให้รูป uploads/... ชี้ผิด path)
     */
    public static function sanitizePlanFileSlug(string $slug): string
    {
        $slug = trim(str_replace(['\\', '/'], '-', $slug));
        $slug = preg_replace('/\s+/u', '-', $slug) ?? $slug;
        $slug = preg_replace('/[^\p{L}\p{N}_.-]+/u', '-', $slug) ?? '';
        $slug = preg_replace('/-+/', '-', $slug) ?? '';
        $slug = trim($slug, '.-');

        return $slug !== '' ? $slug : 'plan';
    }

    private static function isUnsafePlanFileSlug(string $slug): bool
    {
        $slug = trim($slug);
        if ($slug === '') {
            return true;
        }
        if (str_contains($slug, '/') || str_contains($slug, '\\') || str_contains($slug, ' ')) {
            return true;
        }

        return (bool) preg_match('/[^\p{L}\p{N}_.-]/u', $slug);
    }

    public static function planSlugPublic(string $name): string
    {
        return self::planSlug($name);
    }

    /** @param array<string,mixed> $plan */
    public static function planSlugForRowPublic(array $plan): string
    {
        return self::planSlugForRow($plan);
    }

    /** @param array<string,mixed> $plan */
    private static function planSlugForRow(array $plan): string
    {
        $name = trim((string) ($plan['name'] ?? ''));
        $fromName = $name !== '' ? self::planSlug($name) : '';
        $dbSlug = trim((string) ($plan['slug'] ?? ''));

        if ($dbSlug !== '' && self::isUnsafePlanFileSlug($dbSlug)) {
            return $fromName !== '' ? $fromName : self::sanitizePlanFileSlug($dbSlug);
        }

        if ($fromName !== '' && $dbSlug !== '') {
            if ($dbSlug === $fromName) {
                return $dbSlug;
            }
            // slug เก่าที่ auto จากชื่อไทย (เช่น ค-มธนก-จ-99-20-nn) → ใช้ canonical จากชื่อแผน
            if (preg_match('/[ก-๙]/u', $dbSlug) !== 0 || str_contains($dbSlug, 'ค-')) {
                return $fromName;
            }
        }

        if ($dbSlug !== '') {
            return self::sanitizePlanFileSlug($dbSlug);
        }

        return $fromName !== '' ? $fromName : 'plan';
    }

    private static function isLegacyCategoryPageUrl(string $url): bool
    {
        $url = trim($url);
        if ($url === '') {
            return false;
        }
        foreach (['life-insurance.html', 'health-insurance.html', 'savings-retirement.html'] as $page) {
            if ($url === $page || str_starts_with($url, $page . '#')) {
                return true;
            }
        }

        return false;
    }

    private static function isLegacyCategoryAnchorUrl(string $url, string $slug): bool
    {
        $url = trim($url);
        if ($url === '') {
            return false;
        }
        if (self::isLegacyCategoryPageUrl($url)) {
            return true;
        }
        $legacy = self::categoryPlanAnchors();
        if (isset($legacy[$slug]) && $url === $legacy[$slug]) {
            return true;
        }

        return (bool) preg_match('/\.html#(' . preg_quote($slug, '/') . ')$/u', $url);
    }

    private static function resolvePlanHref(string $name): string
    {
        return 'plans/' . self::planSlug($name) . '.html';
    }

    /** @param array<string,mixed> $plan */
    private static function resolvePlanHrefForPlan(array $plan): string
    {
        $slug = self::planSlugForRow($plan);
        $url = trim((string) ($plan['link_url'] ?? ''));
        if ($url !== '' && self::isLegacyCategoryAnchorUrl($url, $slug)) {
            $url = '';
        }
        if ($url !== '') {
            return $url;
        }

        return 'plans/' . $slug . '.html';
    }

    /** @return array<string, array{ariaId: string, title: string, defaultLabel: string, dataCategory?: string}> */
    private static function insuranceListingGroups(): array
    {
        return [
            'savings' => [
                'ariaId' => 'ins-type-savings',
                'title' => 'ออมทรัพย์และลดหย่อนภาษี',
                'defaultLabel' => 'แบบประกันไทยประกันชีวิต',
                'dataCategory' => 'savings',
            ],
            'child' => [
                'ariaId' => 'ins-type-child',
                'title' => 'ประกันเพื่อลูกรัก',
                'defaultLabel' => 'แบบประกันเพื่อลูกรัก',
                'dataCategory' => 'child',
            ],
            'senior' => [
                'ariaId' => 'ins-type-senior',
                'title' => 'ผู้สูงอายุและการเกษียณอายุ',
                'defaultLabel' => 'ผู้สูงอายุและการเกษียณอายุ',
                'dataCategory' => 'senior',
            ],
            'health' => [
                'ariaId' => 'ins-type-health',
                'title' => 'ประกันสุขภาพ',
                'defaultLabel' => 'ประกันสุขภาพ',
                'dataCategory' => 'health',
            ],
        ];
    }

    /** @param array<string,mixed> $plan */
    private static function decodeListingSections(array $plan): array
    {
        $raw = $plan['listing_sections'] ?? null;
        if (is_string($raw)) {
            $raw = json_decode($raw, true);
        }
        return is_array($raw) ? $raw : [];
    }

    /** @param array<string,mixed> $plan */
    private static function planHasListingSection(array $plan, string $section): bool
    {
        foreach (self::decodeListingSections($plan) as $entry) {
            if (is_string($entry) && $entry === $section) {
                return true;
            }
            if (is_array($entry) && ($entry['section'] ?? '') === $section) {
                return true;
            }
        }
        if ((int) ($plan['is_featured'] ?? 0) !== 1) {
            return false;
        }
        $tag = (string) ($plan['filter_tag'] ?? '');
        return $tag !== '' && $tag !== 'all' && $tag === $section;
    }

    /** @param array<string,mixed> $plan @param array<string,mixed> $entry */
    private static function renderTaxPlanListingCard(array $plan, array $entry): string
    {
        $name = (string) ($plan['name'] ?? '');
        $href = self::resolvePlanHrefForPlan($plan);
        $img = esc((string) ($entry['image'] ?? $plan['image_path'] ?? ''));
        $label = esc((string) ($entry['label'] ?? 'แบบประกันไทยประกันชีวิต'));
        $short = esc((string) ($entry['short'] ?? $plan['short_description'] ?? ''));
        $nameEsc = esc($name);
        $hrefEsc = esc($href);
        $dataCat = !empty($entry['dataCategory'])
            ? ' data-tax-plan-category="' . esc((string) $entry['dataCategory']) . '"'
            : '';

        return '              <article class="tax-plan-card section-reveal" data-tax-plan-card' . $dataCat . '>
                <a class="tax-plan-media" href="' . $hrefEsc . '" aria-label="ดูรายละเอียด ' . $nameEsc . '">
                  <img src="' . $img . '" alt="แบบประกัน ' . $nameEsc . '" loading="lazy" decoding="async">
                </a>
                <div class="tax-plan-content">
                  <p>' . $label . '</p>
                  <h3><a href="' . $hrefEsc . '">' . $nameEsc . '</a></h3>
                  <span>' . $short . '</span>
                  <a class="tax-plan-detail" href="' . $hrefEsc . '" aria-label="ดูรายละเอียด ' . $nameEsc . '">ดูรายละเอียด</a>
                </div>
              </article>' . "\n";
    }

    /**
     * Flat card list for homepage tax-plan tabs (all categories in one grid).
     *
     * @return list<array{plan: array<string,mixed>, entry: array<string,mixed>}>
     */
    private static function collectHomeTaxPlanRows(): array
    {
        if (!self::hasListingSectionsColumn()) {
            return [];
        }

        $stmt = cms_db()->query(
            "SELECT * FROM insurance_plans
             WHERE is_active = 1
               AND (
                 (listing_sections IS NOT NULL
                  AND listing_sections != 'null'
                  AND listing_sections != '[]')
                 OR is_featured = 1
               )
             ORDER BY is_featured DESC, sort_order, id"
        );
        $plans = $stmt->fetchAll();
        if ($plans === []) {
            return [];
        }

        $rows = [];
        foreach (self::insuranceListingGroups() as $sectionKey => $meta) {
            foreach ($plans as $plan) {
                if (!self::planHasListingSection($plan, $sectionKey)) {
                    continue;
                }
                $entry = null;
                foreach (self::decodeListingSections($plan) as $item) {
                    if (is_array($item) && ($item['section'] ?? '') === $sectionKey) {
                        $entry = $item;
                        break;
                    }
                    if (is_string($item) && $item === $sectionKey) {
                        $entry = ['section' => $sectionKey];
                        break;
                    }
                }
                if ($entry === null) {
                    $entry = ['section' => $sectionKey];
                }
                if (empty($entry['label'])) {
                    $entry['label'] = $meta['defaultLabel'];
                }
                if (empty($entry['dataCategory']) && !empty($meta['dataCategory'])) {
                    $entry['dataCategory'] = $meta['dataCategory'];
                }
                $rows[] = ['plan' => $plan, 'entry' => $entry];
            }
        }

        usort($rows, static function (array $a, array $b): int {
            $order = ['savings' => 0, 'child' => 1, 'senior' => 2, 'health' => 3];
            $ca = $order[(string) ($a['entry']['dataCategory'] ?? $a['entry']['section'] ?? '')] ?? 9;
            $cb = $order[(string) ($b['entry']['dataCategory'] ?? $b['entry']['section'] ?? '')] ?? 9;
            if ($ca !== $cb) {
                return $ca <=> $cb;
            }
            $sa = (int) ($a['entry']['sort'] ?? 999);
            $sb = (int) ($b['entry']['sort'] ?? 999);
            if ($sa !== $sb) {
                return $sa <=> $sb;
            }
            return ((int) ($a['plan']['sort_order'] ?? 0)) <=> ((int) ($b['plan']['sort_order'] ?? 0));
        });

        return $rows;
    }

    private static function renderHomeTaxPlanGridCards(): string
    {
        $rows = self::collectHomeTaxPlanRows();
        if ($rows === []) {
            return '';
        }
        $html = '';
        foreach ($rows as $row) {
            $html .= self::renderTaxPlanListingCard($row['plan'], $row['entry']);
        }
        return $html;
    }

    private static function patchHomeTaxPlanGrid(string $html): string
    {
        $cards = self::renderHomeTaxPlanGridCards();
        if ($cards === '') {
            return $html;
        }

        $replaced = preg_replace(
            '/(<div class="tax-plan-grid"[^>]*data-tax-plan-grid[^>]*>)\s*[\s\S]*?(\s*<\/div>\s*<button class="tax-plan-more)/u',
            '$1' . "\n" . $cards . '$2',
            $html,
            1
        );
        if (is_string($replaced) && $replaced !== $html) {
            return $replaced;
        }

        return preg_replace(
            '/(<div class="tax-plan-grid"[^>]*>)\s*[\s\S]*?(\s*<\/div>\s*<button class="tax-plan-more)/u',
            '$1' . "\n" . $cards . '$2',
            $html,
            1
        ) ?? $html;
    }

    private static function renderInsuranceListingStack(): string
    {
        if (!self::hasListingSectionsColumn()) {
            return '';
        }

        $stmt = cms_db()->query(
            "SELECT * FROM insurance_plans
             WHERE is_active = 1
               AND (
                 (listing_sections IS NOT NULL
                  AND listing_sections != 'null'
                  AND listing_sections != '[]')
                 OR is_featured = 1
               )
             ORDER BY is_featured DESC, sort_order, id"
        );
        $plans = $stmt->fetchAll();
        if ($plans === []) {
            return '';
        }

        $html = '';
        foreach (self::insuranceListingGroups() as $sectionKey => $meta) {
            $sectionPlans = [];
            foreach ($plans as $plan) {
                if (!self::planHasListingSection($plan, $sectionKey)) {
                    continue;
                }
                $entry = null;
                foreach (self::decodeListingSections($plan) as $item) {
                    if (is_array($item) && ($item['section'] ?? '') === $sectionKey) {
                        $entry = $item;
                        break;
                    }
                }
                if ($entry === null) {
                    $entry = [
                        'section' => $sectionKey,
                        'label' => $meta['defaultLabel'],
                        'sort' => 999,
                    ];
                    if (!empty($meta['dataCategory'])) {
                        $entry['dataCategory'] = $meta['dataCategory'];
                    }
                } elseif (empty($entry['label'])) {
                    $entry['label'] = $meta['defaultLabel'];
                }
                if (empty($entry['dataCategory']) && !empty($meta['dataCategory'])) {
                    $entry['dataCategory'] = $meta['dataCategory'];
                }
                $sectionPlans[] = ['plan' => $plan, 'entry' => $entry];
            }
            if ($sectionPlans === []) {
                continue;
            }
            usort($sectionPlans, static function (array $a, array $b): int {
                $fa = (int) ($a['plan']['is_featured'] ?? 0);
                $fb = (int) ($b['plan']['is_featured'] ?? 0);
                if ($fa !== $fb) {
                    return $fb <=> $fa;
                }
                $sa = (int) ($a['entry']['sort'] ?? 999);
                $sb = (int) ($b['entry']['sort'] ?? 999);
                return $sa <=> $sb;
            });

            $cards = '';
            foreach ($sectionPlans as $row) {
                $cards .= self::renderTaxPlanListingCard($row['plan'], $row['entry']);
            }

            $html .= '          <section class="insurance-type-block section-reveal" aria-labelledby="' . esc($meta['ariaId']) . '">
            <h3 id="' . esc($meta['ariaId']) . '" class="insurance-plan-group-title">' . esc($meta['title']) . '</h3>
            <div class="tax-plan-grid insurance-type-grid">
' . $cards . '            </div>
          </section>' . "\n\n";
        }
        return $html;
    }

    /** @param array<string,mixed> $plan */
    private static function shouldBuildPlanDetailPage(array $plan): bool
    {
        $url = trim((string) ($plan['link_url'] ?? ''));
        $slug = self::planSlugForRow($plan);
        if ($url !== '' && self::isLegacyCategoryAnchorUrl($url, $slug)) {
            return true;
        }
        if ($url !== '' && !str_starts_with($url, 'plans/')) {
            return false;
        }
        return true;
    }

    /** @return list<array{name: string, short: string, image: string, slug: string}> */
    private static function collectTaxPlanCardsFromHtml(string $html): array
    {
        $cards = [];
        if (!preg_match_all('/<article class="tax-plan-card[\s\S]*?<\/article>/u', $html, $blocks)) {
            return $cards;
        }
        foreach ($blocks[0] as $block) {
            if (!preg_match('/<h3><a href="[^"]*">([^<]+)<\/a><\/h3>/u', $block, $title)) {
                continue;
            }
            preg_match('/<span>([^<]*)<\/span>/u', $block, $short);
            preg_match('/<img src="([^"]+)"/u', $block, $image);
            $name = html_entity_decode(trim($title[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $cards[] = [
                'name' => $name,
                'short' => html_entity_decode(trim($short[1] ?? ''), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                'image' => trim($image[1] ?? ''),
                'slug' => self::planSlug($name),
            ];
        }
        return $cards;
    }

    private static function patchTaxPlanCardHrefs(string $html): string
    {
        return preg_replace_callback(
            '/<article class="tax-plan-card[\s\S]*?<\/article>/u',
            static function (array $m): string {
                $block = $m[0];
                if (!preg_match('/<h3><a href="[^"]*">([^<]+)<\/a><\/h3>/u', $block, $title)) {
                    return $block;
                }
                $name = html_entity_decode(trim($title[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $href = self::resolvePlanHref($name);
                return preg_replace('/href="[^"]*"/u', 'href="' . esc($href) . '"', $block) ?? $block;
            },
            $html
        ) ?? $html;
    }

    /** @param array<string,mixed> $plan */
    private static function buildInsurancePlanPage(array $plan): void
    {
        $name = (string) ($plan['name'] ?? '');
        $slug = self::planSlugForRow($plan);
        if ($name === '') {
            return;
        }

        $short = (string) ($plan['short_description'] ?? $plan['short'] ?? '');
        $image = (string) ($plan['image_path'] ?? $plan['image'] ?? '');
        $pageKey = self::planBuilderPageKey($plan);
        $main = '';

        if (self::hasCategoryPageSections($pageKey)) {
            $main = trim(self::renderCategoryMainHtml($pageKey, ['singlePlan' => true]));
            if ($main !== '') {
                $main = self::prefixNestedPlanPageHtml($main);
            }
        }

        $skipPromo = self::planPageUsesBuilderBanners($pageKey);

        if ($main === '') {
            $main = self::buildInsurancePlanPageFallbackMain($plan, $name, $short, $image);
        }

        $meta = (string) ($plan['seo_description'] ?? $short);
        self::writeFile("plans/{$slug}.html", self::pageShell([
            'file' => "plans/{$slug}.html",
            'current' => 'insurance',
            'title' => esc($name) . ' | ' . (self::$site['name'] ?? 'Wealth Life Insure'),
            'description' => $meta,
            'ogImage' => $image !== '' ? $image : 'assets/logo/logo.png',
            'main' => $main,
            'skipPromo' => $skipPromo,
        ]));
    }

    /** หน้าแผนมี Banner จากบิวเดอร์แล้ว — ไม่ใส่ promo ส่วนกลางซ้ำ */
    private static function planPageUsesBuilderBanners(string $pageKey): bool
    {
        if ($pageKey === '' || !self::hasCategoryPageSections($pageKey)) {
            return false;
        }
        $bannerRow = self::categorySection($pageKey, 'bottomBanners');
        if ($bannerRow === null || !$bannerRow['is_active']) {
            return false;
        }
        $banners = is_array($bannerRow['config']['banners'] ?? null) ? $bannerRow['config']['banners'] : [];

        return $banners !== [];
    }

    /** @param array<string,mixed> $plan */
    private static function buildInsurancePlanPageFallbackMain(array $plan, string $name, string $short, string $image): string
    {
        $full = (string) ($plan['full_description'] ?? '');
        $highlights = $plan['highlights'] ?? [];
        if (is_string($highlights)) {
            $highlights = json_decode($highlights, true) ?: [];
        }
        if (!is_array($highlights)) {
            $highlights = [];
        }

        $bodyParts = [];
        $ownCards = self::planOwnBuilderCards($plan);
        $hasBuilderLayout = false;
        if ($ownCards !== []) {
            foreach ($ownCards as $ownCard) {
                $cardHtml = trim(self::renderPlanCardHtml($ownCard));
                if ($cardHtml !== '') {
                    $bodyParts[] = $cardHtml;
                    $hasBuilderLayout = true;
                }
            }
        } else {
            $builderCard = self::planCardFromPageBuilder($plan);
            if ($builderCard !== null) {
                $cardHtml = trim(self::renderPlanCardHtml($builderCard));
                if ($cardHtml !== '') {
                    $bodyParts[] = $cardHtml;
                    $hasBuilderLayout = true;
                }
            }
        }
        if ($bodyParts === []) {
            if ($highlights !== []) {
                $bodyParts[] = '<ul class="check-list">';
                foreach ($highlights as $item) {
                    if (is_string($item) && trim($item) !== '') {
                        $bodyParts[] = '<li>' . esc($item) . '</li>';
                    }
                }
                $bodyParts[] = '</ul>';
            } elseif ($full !== '') {
                if (str_contains($full, '<')) {
                    $bodyParts[] = self::prefixNestedPageContentHtml($full, '../');
                } else {
                    $bodyParts[] = '<p>' . esc($full) . '</p>';
                }
            } elseif ($short !== '') {
                $bodyParts[] = '<p>' . esc($short) . '</p>';
            } else {
                $bodyParts[] = '<p>ติดต่อทีมงานเพื่อขอรายละเอียดแบบประกัน ' . esc($name) . ' และช่วยเปรียบเทียบกับแผนอื่น ๆ ที่เหมาะกับเป้าหมายของคุณ</p>';
            }
        }

        $heroImg = $image !== '' ? '        <figure class="page-hero-media"><img src="../' . esc($image) . '" alt="' . esc($name) . '" loading="eager" decoding="async"></figure>' : '';

        if ($hasBuilderLayout) {
            $detailInner = implode("\n", array_map(
                static fn (string $part): string => self::prefixNestedPlanPageHtml($part),
                $bodyParts
            ));
        } else {
            $detailInner = '    <section class="detail-layout">
      <div class="detail-content">
        <article class="detail-block section-reveal">
          <h2>รายละเอียดแบบประกัน</h2>
          ' . implode("\n          ", $bodyParts) . '
        </article>
      </div>
    </section>';
        }

        return '    <section class="page-hero section-reveal">
      <p class="eyebrow">Thai Life Insurance</p>
      <h1>' . esc($name) . '</h1>
      <p class="article-hero-lead">' . esc($short) . '</p>
' . $heroImg . '
    </section>
' . $detailInner . '
    <section class="cta-band section-reveal">
      <div class="cta-band-inner">
        <div class="cta-band-copy">
          <p class="eyebrow">Free consultation</p>
          <div class="cta-band-title-wrap">
            <h2>สนใจแผน ' . esc($name) . ' ปรึกษาทีมงานได้ฟรี</h2>
          </div>
          <p>ส่งข้อมูลอายุ งบประมาณ และเป้าหมาย ทีมงานจะช่วยสรุปแนวทางเบื้องต้นให้</p>
          <a class="button primary" href="../contact.html">ปรึกษาแผนนี้</a>
        </div>
      </div>
    </section>';
    }

    private static function buildInsurancePlanPages(): void
    {
        $bySlug = [];

        $stmt = cms_db()->query(
            "SELECT * FROM insurance_plans
             WHERE is_active = 1
               AND (link_url IS NULL OR link_url NOT LIKE '%articles/%')
             ORDER BY sort_order, id"
        );
        while ($row = $stmt->fetch()) {
            if (!self::shouldBuildPlanDetailPage($row)) {
                continue;
            }
            $row = self::healPlanSlugRow($row);
            $slug = self::planSlugForRow($row);
            $bySlug[$slug] = array_merge($row, ['slug' => $slug]);
        }

        foreach ($bySlug as $plan) {
            self::buildInsurancePlanPage($plan);
        }
        self::cleanupUnsafePlanPathArtifacts();
    }

    /**
     * ลบโฟลเดอร์/ไฟล์แผนที่เคยสร้างผิดจาก slug ที่มี / หรือช่องว่าง
     * เช่น plans/TL Plan 20/15.html — ทำให้รูป ../uploads ชี้ผิดและข้อความ escape พัง
     */
    private static function cleanupUnsafePlanPathArtifacts(): void
    {
        $plansDir = self::$root . DIRECTORY_SEPARATOR . 'plans';
        if (!is_dir($plansDir)) {
            return;
        }
        foreach (scandir($plansDir) ?: [] as $name) {
            if ($name === '.' || $name === '..') {
                continue;
            }
            $path = $plansDir . DIRECTORY_SEPARATOR . $name;
            if (is_dir($path)) {
                self::deleteDirectoryRecursive($path);
                continue;
            }
            if (!is_file($path)) {
                continue;
            }
            if (str_contains($name, ' ') || preg_match('/[\/\\\\]/', $name)) {
                @unlink($path);
            }
        }
    }

    private static function deleteDirectoryRecursive(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $items = scandir($dir);
        if ($items === false) {
            return;
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                self::deleteDirectoryRecursive($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    /**
     * แก้ slug ใน DB ที่ทำให้ path พัง (มี / หรือช่องว่าง) ให้เป็นชื่อไฟล์ปลอดภัย
     *
     * @param array<string,mixed> $row
     * @return array<string,mixed>
     */
    private static function healPlanSlugRow(array $row): array
    {
        $id = (int) ($row['id'] ?? 0);
        $dbSlug = trim((string) ($row['slug'] ?? ''));
        $safe = self::planSlugForRow($row);
        if ($id <= 0 || $safe === '' || $dbSlug === $safe) {
            return $row;
        }
        try {
            cms_db()->prepare('UPDATE insurance_plans SET slug = ? WHERE id = ?')->execute([$safe, $id]);
            $row['slug'] = $safe;
        } catch (Throwable $e) {
            // ignore duplicate — still build with safe slug in memory
            $row['slug'] = $safe;
        }

        return $row;
    }

    private static function renderFeaturedPlansCarousel(): string
    {
        $slugs = InsuranceCategories::filterSlugs();
        $slugSql = implode(',', array_map(
            static fn (string $s): string => cms_db()->quote($s),
            $slugs
        ));
        $stmt = cms_db()->query(
            "SELECT * FROM insurance_plans
             WHERE is_active = 1 AND is_featured = 1
               AND filter_tag IN ({$slugSql})
               AND (link_url IS NULL OR link_url NOT LIKE '%articles/%')
             ORDER BY sort_order, id
             LIMIT 12"
        );
        $html = '';
        while ($p = $stmt->fetch()) {
            $href = self::resolvePlanHrefForPlan($p);
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

    /** อัปเดตตัวเลือกกรองหมวดแผนประกันให้ตรงกับ insurance_categories */
    private static function patchPlanCarouselFilterOptions(string $html): string
    {
        $options = InsuranceCategories::renderFilterOptionsHtml();
        $pattern = '/(<div class="carousel-controls" aria-label="ควบคุมสไลด์แบบประกัน">[\s\S]*?<select data-carousel-filter)(>)\s*[\s\S]*?(<\/select>)/u';
        $replaced = preg_replace(
            $pattern,
            '$1 data-filter-kind="plans"$2' . "\n" . $options . '$3',
            $html,
            1
        );

        return is_string($replaced) ? $replaced : $html;
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

    /**
     * Resolve which agent should receive a contact lead.
     * Default / fallback: คุณแต้ม (name match) then mail.notify_to.
     *
     * @return array{name: string, email: string}
     */
    public static function resolveContactAgent(?string $preferredName = null): array
    {
        $agents = self::aboutAgentsList();
        $usable = [];
        foreach ($agents as $agent) {
            if (!is_array($agent)) {
                continue;
            }
            $name = trim((string) ($agent['h2'] ?? ''));
            if ($name === '' || str_contains($name, 'ทดสอบ')) {
                continue;
            }
            $usable[] = $agent;
        }

        $default = null;
        foreach ($usable as $agent) {
            $name = (string) ($agent['h2'] ?? '');
            if (str_contains($name, 'แต้ม') || str_contains($name, 'จักรี')) {
                $default = $agent;
                break;
            }
        }
        if ($default === null && $usable !== []) {
            $default = $usable[0];
        }

        $selected = $default;
        $wanted = trim((string) $preferredName);
        if ($wanted !== '') {
            foreach ($usable as $agent) {
                if (trim((string) ($agent['h2'] ?? '')) === $wanted) {
                    $selected = $agent;
                    break;
                }
            }
        }

        $fallbackEmail = trim((string) cms_config('mail.notify_to', 'jugkreenoidonpri@gmail.com'));
        $pickEmail = static function (?array $agent) use ($fallbackEmail): string {
            if (!is_array($agent)) {
                return $fallbackEmail;
            }
            $email = trim((string) ($agent['email'] ?? ''));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $email;
            }
            return $fallbackEmail;
        };

        $email = $pickEmail($selected);
        // If selected agent has no email, still keep their display name but mail Tam's address.
        if ($selected !== $default && $email === $fallbackEmail) {
            $own = trim((string) ($selected['email'] ?? ''));
            if ($own === '' || !filter_var($own, FILTER_VALIDATE_EMAIL)) {
                $email = $pickEmail($default);
            }
        }

        return [
            'name' => trim((string) (($selected['h2'] ?? null) ?: ($default['h2'] ?? 'คุณ จักรี น้อยดอนไพร (แต้ม)'))),
            'email' => $email !== '' ? $email : $fallbackEmail,
        ];
    }

    /** Render <option> list for contact form agent select. */
    private static function contactAgentOptionsHtml(): string
    {
        $agents = self::aboutAgentsList();
        $html = '';
        $hasSelected = false;
        foreach ($agents as $agent) {
            if (!is_array($agent)) {
                continue;
            }
            $name = trim((string) ($agent['h2'] ?? ''));
            if ($name === '' || str_contains($name, 'ทดสอบ')) {
                continue;
            }
            $isTam = str_contains($name, 'แต้ม') || str_contains($name, 'จักรี');
            $selected = (!$hasSelected && $isTam) ? ' selected' : '';
            if ($selected !== '') {
                $hasSelected = true;
            }
            $html .= '            <option value="' . esc($name) . '"' . $selected . '>' . esc($name) . "</option>\n";
        }
        if ($html === '') {
            $html = '            <option value="คุณ จักรี น้อยดอนไพร (แต้ม)" selected>คุณ จักรี น้อยดอนไพร (แต้ม)</option>' . "\n";
        } elseif (!$hasSelected) {
            // Ensure first option is selected if Tam not found.
            $html = preg_replace('/<option /', '<option selected ', $html, 1) ?? $html;
        }
        return $html;
    }

    /** Render contact page person cards (phone + LINE + Facebook per agent). */
    private static function contactPersonCardsHtml(): string
    {
        $cards = '';
        foreach (self::aboutAgentsList() as $agent) {
            if (!is_array($agent)) {
                continue;
            }
            $name = trim((string) ($agent['h2'] ?? ''));
            if ($name === '' || str_contains($name, 'ทดสอบ')) {
                continue;
            }
            $role = trim((string) ($agent['eyebrow'] ?? ''));
            $phone = trim((string) ($agent['phone'] ?? ''));
            $phoneTel = trim((string) ($agent['phoneTel'] ?? ''));
            if ($phoneTel === '' && $phone !== '') {
                $phoneTel = preg_replace('/\D+/', '', $phone) ?? '';
            }
            $lineUrl = trim((string) ($agent['lineUrl'] ?? ''));
            $facebookUrl = trim((string) ($agent['facebookUrl'] ?? ''));
            $facebookLabel = trim((string) ($agent['facebookLabel'] ?? ''));
            if ($facebookLabel === '' && $facebookUrl !== '') {
                $facebookLabel = preg_replace('#^https?://(www\.)?#i', '', $facebookUrl) ?? $facebookUrl;
                $facebookLabel = rtrim((string) $facebookLabel, '/');
            }

            $photo = trim((string) ($agent['photo'] ?? ''));

            $channels = '';
            if ($phone !== '') {
                $telHref = $phoneTel !== '' ? 'tel:' . preg_replace('/\D+/', '', $phoneTel) : '#';
                $channels .= '          <a class="contact-person__channel contact-person__channel--phone" href="' . esc((string) $telHref) . '" aria-label="โทร ' . esc($phone) . '" title="' . esc($phone) . '">
            <span class="contact-person__icon" aria-hidden="true">' . self::chipIcon('phone') . '</span>
            <span class="contact-person__channel-text">
              <span class="contact-person__channel-label">โทร</span>
              <span class="contact-person__channel-value">' . esc($phone) . '</span>
            </span>
          </a>' . "\n";
            }
            if ($lineUrl !== '') {
                $lineMeta = $phoneTel !== '' ? $phoneTel : ($phone !== '' ? $phone : 'LINE');
                $channels .= '          <a class="contact-person__channel contact-person__channel--line" href="' . esc($lineUrl) . '" target="_blank" rel="noopener noreferrer" aria-label="LINE ' . esc($lineMeta) . '" title="LINE · ' . esc($lineMeta) . '">
            <span class="contact-person__icon" aria-hidden="true">' . self::chipIcon('line') . '</span>
            <span class="contact-person__channel-text">
              <span class="contact-person__channel-label">แชท</span>
              <span class="contact-person__channel-value">LINE</span>
            </span>
          </a>' . "\n";
            }
            if ($facebookUrl !== '') {
                $fbText = $facebookLabel !== '' ? $facebookLabel : $facebookUrl;
                $channels .= '          <a class="contact-person__channel contact-person__channel--facebook" href="' . esc($facebookUrl) . '" target="_blank" rel="noopener noreferrer" aria-label="Facebook ' . esc($fbText) . '" title="' . esc($fbText) . '">
            <span class="contact-person__icon" aria-hidden="true">' . self::chipIcon('facebook') . '</span>
            <span class="contact-person__channel-text">
              <span class="contact-person__channel-label">โซเชียล</span>
              <span class="contact-person__channel-value">Facebook</span>
            </span>
          </a>' . "\n";
            }

            if ($channels === '') {
                continue;
            }

            $photoHtml = $photo !== ''
                ? '<div class="contact-person__photo"><img src="' . esc($photo) . '" width="96" height="96" loading="lazy" decoding="async" alt="' . esc($name) . '"></div>'
                : '<div class="contact-person__photo contact-person__photo--empty" aria-hidden="true"><span>' . esc(mb_substr($name, 0, 1)) . '</span></div>';

            $cards .= '        <article class="contact-person" role="listitem">
          <header class="contact-person__head">
            ' . $photoHtml . '
            <div class="contact-person__meta">
              <h2 class="contact-person__name">' . esc($name) . '</h2>
              ' . ($role !== '' ? '<p class="contact-person__role">' . esc($role) . '</p>' : '') . '
            </div>
          </header>
          <div class="contact-person__channels">
' . $channels . '          </div>
        </article>' . "\n";
        }

        if ($cards === '') {
            return '        <p class="contact-links-empty">ยังไม่มีช่องทางติดต่อ — เพิ่มโปรไฟล์ทีมงานในแอดมิน</p>' . "\n";
        }
        return $cards;
    }

    private static function buildContact(): void
    {
        if (!is_file(self::$root . '/contact.html')) {
            return;
        }
        $html = self::readTemplate('contact.html');
        $hero = self::sectionConfig('contact', 'hero') ?? [];
        $cards = self::contactPersonCardsHtml();
        $copyBlock = '      <div class="contact-copy">
        <p class="eyebrow">' . esc($hero['eyebrow'] ?? 'Contact Wealth Life Insure') . '</p>
        <h1>' . esc($hero['h1'] ?? 'คุยกับทีมไทยประกันชีวิต สาขาบางนา') . '</h1>
        <p>' . esc($hero['copy'] ?? '') . '</p>
        <div class="contact-links" role="list">
' . $cards . '        </div>
      </div>';
        $html = preg_replace(
            '/<div class="contact-copy">[\s\S]*?<\/div>\s*(?=\s*<form class="contact-form")/',
            $copyBlock . "\n\n",
            $html,
            1
        ) ?? $html;

        $agentSelect = '<label class="contact-field">
          <span class="contact-form-label">ตัวแทนที่ต้องการติดต่อ</span>
          <select name="preferred_agent" id="contact-preferred-agent">
' . self::contactAgentOptionsHtml() . '          </select>
          <span class="contact-field-hint">ถ้าไม่เลือก ระบบจะส่งหาคุณแต้มโดยอัตโนมัติ</span>
        </label>';
        if (preg_match('/<label class="contact-field"[^>]*>\s*<span class="contact-form-label">ตัวแทนที่ต้องการติดต่อ<\/span>[\s\S]*?<\/label>/u', $html)) {
            $html = preg_replace(
                '/<label class="contact-field"[^>]*>\s*<span class="contact-form-label">ตัวแทนที่ต้องการติดต่อ<\/span>[\s\S]*?<\/label>/u',
                $agentSelect,
                $html,
                1
            ) ?? $html;
        } else {
            $html = preg_replace(
                '/(<label class="contact-field">\s*<span class="contact-form-label">เบอร์โทรศัพท์<\/span>[\s\S]*?<\/label>)/u',
                '$1' . "\n        " . $agentSelect,
                $html,
                1
            ) ?? $html;
        }

        // คงป้ายชื่อฟอร์ม — กัน template/rebuild ที่เคยทำให้ label ว่าง
        $html = preg_replace(
            '/(<label class="contact-field">\s*<span class="contact-form-label">)\s*(<\/span>\s*<input[^>]*name="name")/u',
            '$1ชื่อ-นามสกุล$2',
            $html,
            1
        ) ?? $html;
        // ลบข้อความเดโม่เก่าถ้ายังค้าง
        $html = preg_replace(
            '/<p class="form-note">\*?\s*หน้าเว็บตัวอย่างนี้ยังไม่เชื่อมต่อระบบรับข้อมูลจริง<\/p>/u',
            '<p class="form-note" hidden></p>',
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
        $agentsList = self::aboutAgentsList();

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

        $panels = '';
        foreach ($agentsList as $agent) {
            $panels .= self::renderAgentPanel($agent) . "\n";
        }
        $html = preg_replace(
            '/(<div class="agent-section-inner">)\s*[\s\S]*?(<\/div>\s*<\/section>)/u',
            '$1' . "\n" . $panels . '      $2',
            $html,
            1
        ) ?? $html;

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

        $listingStack = self::renderInsuranceListingStack();
        if ($listingStack !== '') {
            $html = preg_replace(
                '/<div class="insurance-type-stack">[\s\S]*?<\/div>(\s*<\/div>\s*<\/section>\s*<section class="cta-band)/',
                '<div class="insurance-type-stack">' . "\n" . $listingStack . '        </div>$1',
                $html,
                1
            ) ?? $html;
        } else {
            $html = self::patchTaxPlanCardHrefs($html);
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
        $html = self::patchPlanCarouselFilterOptions($html);
        self::writeFile('insurance.html', $html);
    }

    /** @return array{config: array<string,mixed>, is_active: bool}|null */
    private static function categorySection(string $pageKey, string $sectionKey): ?array
    {
        $stmt = cms_db()->prepare(
            'SELECT config, is_active FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1'
        );
        $stmt->execute([$pageKey, $sectionKey]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }
        $config = json_decode((string) $row['config'], true);

        return [
            'config' => is_array($config) ? $config : [],
            'is_active' => (bool) $row['is_active'],
        ];
    }

    private static function hasCategoryPageSections(string $pageKey): bool
    {
        $stmt = cms_db()->prepare('SELECT COUNT(*) FROM page_sections WHERE page_key = ?');
        $stmt->execute([$pageKey]);

        return (int) $stmt->fetchColumn() > 0;
    }

    private static function inlineStyleAttr(array $styles): string
    {
        $parts = [];
        foreach ($styles as $prop => $val) {
            if ($val === null || $val === '') {
                continue;
            }
            $parts[] = $prop . ':' . $val;
        }
        if ($parts === []) {
            return '';
        }

        return ' style="' . esc(implode(';', $parts)) . '"';
    }

    /** @param array<string,mixed> $card */
    private static function cardWidgetType(array $card): string
    {
        $type = (string) ($card['type'] ?? '');
        if ($type === 'dropZone') {
            return 'dropZone';
        }
        $wt = trim((string) ($card['widgetType'] ?? ''));
        if ($wt !== '') {
            return $wt;
        }
        if ($type === 'widget') {
            return 'divider';
        }
        if ($type === 'paragraph') {
            return 'text';
        }

        return 'planCard';
    }

    /** @param array<string,mixed> $card */
    private static function renderPlanCardHtml(array $card): string
    {
        $wt = self::cardWidgetType($card);
        if ($wt === 'dropZone') {
            return '';
        }

        $anchor = trim((string) ($card['anchorId'] ?? ''));
        $idAttr = $anchor !== '' ? ' id="' . esc($anchor) . '"' : '';

        if ($wt === 'divider') {
            return '        <div class="detail-block ipb__divider-block section-reveal"' . $idAttr . ">\n          <hr class=\"ipb__widget-divider\" aria-hidden=\"true\">\n        </div>\n";
        }
        if ($wt === 'spacer') {
            return '        <div class="detail-block ipb__widget-spacer section-reveal"' . $idAttr . " aria-hidden=\"true\"></div>\n";
        }

        $inner = '';
        switch ($wt) {
            case 'heading':
                $title = esc((string) ($card['title'] ?? ''));
                $inner = "          <h2>{$title}</h2>\n";
                $body = trim((string) ($card['body'] ?? ''));
                if ($body !== '') {
                    $inner .= self::renderBuilderRichBlock($body);
                }
                break;
            case 'text':
                $inner = self::renderBuilderRichBlock((string) ($card['body'] ?? ''));
                break;
            case 'image':
                $title = trim((string) ($card['title'] ?? ''));
                if ($title !== '') {
                    $inner .= '          <h2>' . esc($title) . "</h2>\n";
                }
                $image = trim((string) ($card['image'] ?? ''));
                if ($image !== '') {
                    $inner .= '          <figure class="detail-block__media"><img src="' . esc($image) . '" alt="" loading="lazy" decoding="async"></figure>' . "\n";
                }
                break;
            case 'button':
                $btnText = trim((string) ($card['buttonText'] ?? ''));
                $btnHref = trim((string) ($card['buttonHref'] ?? 'contact.html'));
                if ($btnText !== '') {
                    $inner .= '          <p><a class="button secondary" href="' . esc($btnHref) . '">' . esc($btnText) . "</a></p>\n";
                }
                break;
            case 'video':
                $video = trim((string) ($card['videoUrl'] ?? ''));
                if ($video !== '') {
                    $inner .= '          <div class="detail-block__video"><iframe src="' . esc($video) . '" title="วิดีโอ" loading="lazy" allowfullscreen></iframe></div>' . "\n";
                }
                break;
            case 'icon':
                $icon = trim((string) ($card['icon'] ?? ''));
                if ($icon !== '') {
                    $inner .= '          <img class="detail-block__icon" src="' . esc($icon) . '" alt="" loading="lazy" decoding="async">' . "\n";
                }
                break;
            case 'columns':
                $cols = is_array($card['columns'] ?? null) ? $card['columns'] : ['', ''];
                $inner = "          <div class=\"detail-columns\" style=\"display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.25rem\">\n";
                foreach ($cols as $col) {
                    $colHtml = self::renderBuilderRichHtml((string) $col);
                    if ($colHtml === '') {
                        $inner .= "            <div></div>\n";
                        continue;
                    }
                    if (str_contains((string) $col, '<')) {
                        $inner .= '            <div class="ipb__rich-content">' . $colHtml . "</div>\n";
                    } else {
                        $inner .= '            <div><p>' . $colHtml . "</p></div>\n";
                    }
                }
                $inner .= "          </div>\n";
                break;
            case 'gallery':
                $title = trim((string) ($card['title'] ?? ''));
                if ($title !== '') {
                    $inner .= '          <h2>' . esc($title) . "</h2>\n";
                }
                $images = is_array($card['images'] ?? null) ? $card['images'] : [];
                if ($images !== []) {
                    $inner .= "          <div class=\"detail-block__gallery\">\n";
                    foreach ($images as $img) {
                        $img = trim((string) $img);
                        if ($img === '') {
                            continue;
                        }
                        $inner .= '            <figure class="detail-block__media"><img src="' . esc($img) . '" alt="" loading="lazy" decoding="async"></figure>' . "\n";
                    }
                    $inner .= "          </div>\n";
                }
                break;
            case 'slider':
                $title = trim((string) ($card['title'] ?? ''));
                if ($title !== '') {
                    $inner .= '          <h2>' . esc($title) . "</h2>\n";
                }
                $images = is_array($card['images'] ?? null) ? $card['images'] : [];
                $filtered = [];
                foreach ($images as $img) {
                    $img = trim((string) $img);
                    if ($img !== '') {
                        $filtered[] = $img;
                    }
                }
                if ($filtered !== []) {
                    $perView = min(3, max(1, (int) ($card['slidesPerView'] ?? 1)));
                    $inner .= '          <div class="detail-slider" data-plan-slider data-per-view="' . $perView . '" style="--slides-per-view:' . $perView . "\">\n";
                    $inner .= "            <button type=\"button\" class=\"detail-slider__nav detail-slider__prev\" aria-label=\"ก่อนหน้า\">‹</button>\n";
                    $inner .= "            <div class=\"detail-slider__viewport\">\n              <div class=\"detail-slider__track\">\n";
                    foreach ($filtered as $img) {
                        $inner .= '                <figure class="detail-slider__slide detail-block__media"><img src="' . esc($img) . '" alt="" loading="lazy" decoding="async"></figure>' . "\n";
                    }
                    $inner .= "              </div>\n            </div>\n";
                    $inner .= "            <button type=\"button\" class=\"detail-slider__nav detail-slider__next\" aria-label=\"ถัดไป\">›</button>\n";
                    $inner .= "          </div>\n";
                }
                break;
            case 'tabs':
                $tabs = is_array($card['tabs'] ?? null) ? $card['tabs'] : [];
                foreach ($tabs as $tab) {
                    if (!is_array($tab)) {
                        continue;
                    }
                    $label = esc((string) ($tab['label'] ?? 'แท็บ'));
                    $bodyHtml = self::renderBuilderRichHtml((string) ($tab['body'] ?? ''));
                    $inner .= "          <details class=\"detail-tab\"><summary>{$label}</summary>";
                    if ($bodyHtml !== '') {
                        if (str_contains((string) ($tab['body'] ?? ''), '<')) {
                            $inner .= '<div class="ipb__rich-content">' . $bodyHtml . '</div>';
                        } else {
                            $inner .= "<p>{$bodyHtml}</p>";
                        }
                    }
                    $inner .= "</details>\n";
                }
                break;
            case 'accordion':
                $items = is_array($card['items'] ?? null) ? $card['items'] : [];
                foreach ($items as $item) {
                    if (!is_array($item)) {
                        continue;
                    }
                    $label = esc((string) ($item['title'] ?? 'หัวข้อ'));
                    $bodyHtml = self::renderBuilderRichHtml((string) ($item['body'] ?? ''));
                    $inner .= "          <details class=\"detail-accordion\"><summary>{$label}</summary>";
                    if ($bodyHtml !== '') {
                        if (str_contains((string) ($item['body'] ?? ''), '<')) {
                            $inner .= '<div class="ipb__rich-content">' . $bodyHtml . '</div>';
                        } else {
                            $inner .= "<p>{$bodyHtml}</p>";
                        }
                    }
                    $inner .= "</details>\n";
                }
                break;
            case 'map':
                $embed = trim((string) ($card['mapEmbed'] ?? ''));
                if ($embed !== '') {
                    $inner .= '          <div class="detail-block__map"><iframe src="' . esc($embed) . '" loading="lazy" allowfullscreen></iframe></div>' . "\n";
                }
                break;
            case 'bullets':
            case 'planCard':
            default:
                $title = esc((string) ($card['title'] ?? ''));
                $inner = "          <h2>{$title}</h2>\n";
                $icon = trim((string) ($card['icon'] ?? ''));
                if ($icon !== '') {
                    $inner .= '          <img class="detail-block__icon" src="' . esc($icon) . '" alt="" loading="lazy" decoding="async">' . "\n";
                }
                $image = trim((string) ($card['image'] ?? ''));
                if ($image !== '') {
                    $inner .= '          <figure class="detail-block__media"><img src="' . esc($image) . '" alt="" loading="lazy" decoding="async"></figure>' . "\n";
                }
                $video = trim((string) ($card['videoUrl'] ?? ''));
                if ($video !== '') {
                    $inner .= '          <div class="detail-block__video"><iframe src="' . esc($video) . '" title="วิดีโอ" loading="lazy" allowfullscreen></iframe></div>' . "\n";
                }
                $type = (string) ($card['type'] ?? 'checklist');
                if ($type === 'paragraph') {
                    $inner .= self::renderBuilderRichBlock((string) ($card['body'] ?? ''));
                } else {
                    $bullets = is_array($card['bullets'] ?? null) ? $card['bullets'] : [];
                    if ($bullets !== []) {
                        $inner .= "          <ul class=\"check-list\">\n";
                        foreach ($bullets as $item) {
                            $item = trim((string) $item);
                            if ($item === '') {
                                continue;
                            }
                            $inner .= '            <li>' . esc($item) . "</li>\n";
                        }
                        $inner .= "          </ul>\n";
                    }
                }
                $btnText = trim((string) ($card['buttonText'] ?? ''));
                $btnHref = trim((string) ($card['buttonHref'] ?? ''));
                if ($btnText !== '' && $btnHref !== '') {
                    $inner .= '          <p><a class="button secondary" href="' . esc($btnHref) . '">' . esc($btnText) . "</a></p>\n";
                }
                break;
        }

        if ($inner === '') {
            return '';
        }

        $mediaBlock = in_array($wt, ['image', 'gallery', 'slider'], true);
        $blockClass = $mediaBlock ? ' detail-block--media' : '';

        return '        <article class="detail-block section-reveal' . $blockClass . '"' . $idAttr . ">\n{$inner}        </article>\n";
    }

    /** @param array<string,mixed> $plan */
    private static function pageKeyForPlanTag(array $plan): string
    {
        $tag = (string) ($plan['filter_tag'] ?? 'life');
        return match ($tag) {
            'health' => 'healthInsurance',
            'savings' => 'savingsRetirement',
            default => 'lifeInsurance',
        };
    }

    /** บิวเดอร์แยกต่อแผน: page_sections.page_key = plan-{id} */
    private static function planBuilderPageKey(array $plan): string
    {
        $id = (int) ($plan['id'] ?? 0);
        return $id > 0 ? 'plan-' . $id : '';
    }

    /**
     * การ์ด/วิดเจ็ตทั้งหมดจากบิวเดอร์ของแผนนี้ (ไม่รวมหมวด)
     *
     * @param array<string,mixed> $plan
     * @return list<array<string,mixed>>
     */
    private static function planOwnBuilderCards(array $plan): array
    {
        $pageKey = self::planBuilderPageKey($plan);
        if ($pageKey === '') {
            return [];
        }
        $planRow = self::categorySection($pageKey, 'planCards');
        if ($planRow === null || !$planRow['is_active']) {
            return [];
        }
        $cards = is_array($planRow['config']['cards'] ?? null) ? $planRow['config']['cards'] : [];
        $out = [];
        foreach ($cards as $card) {
            if (!is_array($card) || self::cardWidgetType($card) === 'dropZone') {
                continue;
            }
            $out[] = $card;
        }
        return $out;
    }

    /** @param array<string,mixed> $plan */
    private static function planCardFromPageBuilder(array $plan): ?array
    {
        $own = self::planOwnBuilderCards($plan);
        if ($own !== []) {
            return $own[0];
        }

        $pageKey = self::pageKeyForPlanTag($plan);
        $planRow = self::categorySection($pageKey, 'planCards');
        if ($planRow === null || !$planRow['is_active']) {
            return null;
        }
        $cards = is_array($planRow['config']['cards'] ?? null) ? $planRow['config']['cards'] : [];
        $slug = (string) ($plan['slug'] ?? self::planSlug((string) ($plan['name'] ?? '')));
        $name = trim((string) ($plan['name'] ?? ''));
        foreach ($cards as $card) {
            if (!is_array($card) || self::cardWidgetType($card) === 'dropZone') {
                continue;
            }
            $anchor = (string) ($card['anchorId'] ?? $card['id'] ?? '');
            if ($slug !== '' && ($anchor === $slug || (string) ($card['id'] ?? '') === $slug)) {
                return $card;
            }
            if ($name !== '' && strcasecmp(trim((string) ($card['title'] ?? '')), $name) === 0) {
                return $card;
            }
        }

        return null;
    }

    /**
     * ย้ายการ์ดแผนที่ปักหมุด (is_featured) ไว้ด้านบนของหน้าหมวดประกัน
     *
     * @param list<mixed> $cards
     * @return list<mixed>
     */
    private static function sortPlanCardsByPinned(array $cards, string $pageKey): array
    {
        $tag = match ($pageKey) {
            'healthInsurance' => 'health',
            'savingsRetirement' => 'savings',
            default => 'life',
        };

        $stmt = cms_db()->prepare(
            "SELECT name FROM insurance_plans
             WHERE is_active = 1 AND is_featured = 1
               AND filter_tag IN (?, 'all')
             ORDER BY sort_order, id"
        );
        $stmt->execute([$tag]);
        $pinnedKeys = [];
        while ($row = $stmt->fetch()) {
            $slug = self::planSlug((string) ($row['name'] ?? ''));
            if ($slug !== '') {
                $pinnedKeys[$slug] = true;
            }
            $name = trim((string) ($row['name'] ?? ''));
            if ($name !== '') {
                $pinnedKeys['name:' . mb_strtolower($name)] = true;
            }
        }
        if ($pinnedKeys === []) {
            return $cards;
        }

        $pinned = [];
        $rest = [];
        foreach ($cards as $card) {
            if (!is_array($card)) {
                $rest[] = $card;
                continue;
            }
            $anchor = (string) ($card['anchorId'] ?? $card['id'] ?? '');
            $titleKey = 'name:' . mb_strtolower(trim((string) ($card['title'] ?? '')));
            if (($anchor !== '' && isset($pinnedKeys[$anchor])) || isset($pinnedKeys[$titleKey])) {
                $pinned[] = $card;
            } else {
                $rest[] = $card;
            }
        }

        return array_merge($pinned, $rest);
    }

    /**
     * @return array{bySlug: array<string, array<string,mixed>>, byName: array<string, array<string,mixed>>}
     */
    private static function plansIndexForCategoryPage(string $pageKey): array
    {
        $tag = match ($pageKey) {
            'healthInsurance' => 'health',
            'savingsRetirement' => 'savings',
            default => 'life',
        };
        $stmt = cms_db()->prepare(
            "SELECT * FROM insurance_plans
             WHERE is_active = 1 AND filter_tag IN (?, 'all')
             ORDER BY sort_order, id"
        );
        $stmt->execute([$tag]);
        $bySlug = [];
        $byName = [];
        foreach ($stmt->fetchAll() as $row) {
            $slug = strtolower(trim((string) ($row['slug'] ?? '')));
            $name = mb_strtolower(trim((string) ($row['name'] ?? '')));
            if ($slug !== '') {
                $bySlug[$slug] = $row;
            }
            if ($name !== '') {
                $byName[$name] = $row;
            }
        }
        return ['bySlug' => $bySlug, 'byName' => $byName];
    }

    /**
     * @param array<string,mixed> $card
     * @param array{bySlug: array<string, array<string,mixed>>, byName: array<string, array<string,mixed>>} $index
     * @return array<string,mixed>|null
     */
    private static function matchPlanForCategoryCard(array $card, array $index): ?array
    {
        $id = strtolower(trim((string) ($card['id'] ?? '')));
        $anchor = strtolower(trim((string) ($card['anchorId'] ?? '')));
        $title = mb_strtolower(trim((string) ($card['title'] ?? '')));
        foreach ([$anchor, $id] as $key) {
            if ($key !== '' && isset($index['bySlug'][$key])) {
                return $index['bySlug'][$key];
            }
        }
        if ($title !== '' && isset($index['byName'][$title])) {
            return $index['byName'][$title];
        }
        return null;
    }

    private static function renderCategoryMainHtml(string $pageKey, array $opts = []): string
    {
        $singlePlan = (bool) ($opts['singlePlan'] ?? false);
        $skipHero = (bool) ($opts['skipHero'] ?? false);
        $skipCta = (bool) ($opts['skipCta'] ?? false);
        $skipPromo = (bool) ($opts['skipPromo'] ?? false);
        $html = '';

        $heroRow = self::categorySection($pageKey, 'hero');
        if ($singlePlan) {
            $heroActive = !$skipHero && $heroRow !== null && $heroRow['is_active'];
        } else {
            $heroActive = !$skipHero && ($heroRow === null || $heroRow['is_active']);
        }
        if ($heroActive) {
            $hero = self::mergeSectionDefaults([
                'categoryLabel' => '',
                'h1' => '',
                'copy' => '',
                'bgType' => 'color',
                'bgColor' => '',
                'bgImage' => '',
            ], $heroRow !== null ? $heroRow['config'] : null);
            $heroStyle = [];
            if (($hero['bgType'] ?? 'color') === 'image' && !empty($hero['bgImage'])) {
                $heroStyle['background-image'] = 'url(' . (string) $hero['bgImage'] . ')';
                $heroStyle['background-size'] = 'cover';
                $heroStyle['background-position'] = 'center';
            } elseif (!empty($hero['bgColor'])) {
                $heroStyle['background-color'] = (string) $hero['bgColor'];
            }
            $html .= '    <section class="page-hero section-reveal"' . self::inlineStyleAttr($heroStyle) . ">\n";
            $html .= '      <p class="eyebrow">' . esc((string) ($hero['categoryLabel'] ?? '')) . "</p>\n";
            $html .= '      <h1>' . esc((string) ($hero['h1'] ?? '')) . "</h1>\n";
            $html .= self::renderBuilderPlainOrHtml((string) ($hero['copy'] ?? ''), 'article-hero-lead');
            $html .= "    </section>\n\n";
        }

        $whoRow = self::categorySection($pageKey, 'whoFor');
        $planRow = self::categorySection($pageKey, 'planCards');
        $recRow = self::categorySection($pageKey, 'recommendation');
        if ($singlePlan) {
            $whoActive = $whoRow !== null && $whoRow['is_active'];
            $planActive = $planRow !== null && $planRow['is_active'];
            $recActive = $recRow !== null && $recRow['is_active'];
        } else {
            $whoActive = $whoRow === null || $whoRow['is_active'];
            $planActive = $planRow === null || $planRow['is_active'];
            $recActive = $recRow === null || $recRow['is_active'];
        }

        if ($whoActive || $planActive || $recActive) {
            $html .= "    <section class=\"detail-layout\">\n";
            if ($whoActive) {
                $who = self::mergeSectionDefaults(['h2' => 'เหมาะกับใคร', 'text' => '', 'boxBgColor' => ''], $whoRow !== null ? $whoRow['config'] : null);
                $asideStyle = [];
                if (!empty($who['boxBgColor'])) {
                    $asideStyle['background-color'] = (string) $who['boxBgColor'];
                }
                $html .= '      <aside class="detail-summary section-reveal"' . self::inlineStyleAttr($asideStyle) . ">\n";
                $html .= '        <h2>' . esc((string) ($who['h2'] ?? '')) . "</h2>\n";
                $html .= self::renderBuilderPlainOrHtml((string) ($who['text'] ?? ''));
                $html .= "      </aside>\n\n";
            }
            if ($planActive || $recActive) {
                $html .= "      <div class=\"detail-content\">\n";
                if ($planActive) {
                    $planConfig = ($planRow !== null && is_array($planRow['config'])) ? $planRow['config'] : [];
                    $cards = is_array($planConfig['cards'] ?? null) ? $planConfig['cards'] : [];
                    if (!$singlePlan) {
                        $cards = self::sortPlanCardsByPinned($cards, $pageKey);
                    }
                    $plansBySlug = $singlePlan ? [] : self::plansIndexForCategoryPage($pageKey);
                    foreach ($cards as $card) {
                        if (!is_array($card) || self::cardWidgetType($card) === 'dropZone') {
                            continue;
                        }
                        if (!$singlePlan) {
                            $matchedPlan = self::matchPlanForCategoryCard($card, $plansBySlug);
                            if ($matchedPlan !== null) {
                                $ownCards = self::planOwnBuilderCards($matchedPlan);
                                if ($ownCards !== []) {
                                    foreach ($ownCards as $ownCard) {
                                        $block = self::renderPlanCardHtml($ownCard);
                                        if ($block !== '') {
                                            $html .= '        ' . $block;
                                        }
                                    }
                                    continue;
                                }
                            }
                        }
                        $block = self::renderPlanCardHtml($card);
                        if ($block !== '') {
                            $html .= '        ' . $block;
                        }
                    }
                }
                if ($recActive) {
                    $rec = self::mergeSectionDefaults(['h2' => '', 'body' => ''], $recRow !== null ? $recRow['config'] : null);
                    if (($rec['h2'] ?? '') !== '' || ($rec['body'] ?? '') !== '') {
                        $html .= "        <article class=\"detail-block section-reveal\">\n";
                        $html .= '          <h2>' . esc((string) ($rec['h2'] ?? '')) . "</h2>\n";
                        $html .= self::renderBuilderRichBlock((string) ($rec['body'] ?? ''));
                        $html .= "        </article>\n";
                    }
                }
                $html .= "      </div>\n";
            }
            $html .= "    </section>\n\n";
        }

        $ctaRow = self::categorySection($pageKey, 'cta');
        if ($singlePlan) {
            $ctaActive = !$skipCta && $ctaRow !== null && $ctaRow['is_active'];
        } else {
            $ctaActive = !$skipCta && ($ctaRow === null || $ctaRow['is_active']);
        }
        if ($ctaActive) {
            $cta = self::mergeSectionDefaults([
                'eyebrow' => '',
                'h2' => '',
                'copy' => '',
                'buttonText' => '',
                'buttonHref' => 'contact.html',
                'bgColor' => '',
                'bgImage' => '',
                'videoUrl' => '',
            ], $ctaRow !== null ? $ctaRow['config'] : null);
            $ctaStyle = [];
            if (!empty($cta['bgColor'])) {
                $ctaStyle['background-color'] = (string) $cta['bgColor'];
            }
            if (!empty($cta['bgImage'])) {
                $ctaStyle['background-image'] = 'url(' . (string) $cta['bgImage'] . ')';
                $ctaStyle['background-size'] = 'cover';
                $ctaStyle['background-position'] = 'center';
            }
            $html .= '    <section class="cta-band section-reveal"' . self::inlineStyleAttr($ctaStyle) . ">\n";
            $html .= "      <div class=\"cta-band-inner\">\n";
            $html .= "        <div class=\"cta-band-copy\">\n";
            $html .= '          <p class="eyebrow">' . esc((string) ($cta['eyebrow'] ?? '')) . "</p>\n";
            $html .= "          <div class=\"cta-band-title-wrap\">\n";
            $html .= '            <h2>' . esc((string) ($cta['h2'] ?? '')) . "</h2>\n";
            $html .= "          </div>\n";
            $html .= self::renderBuilderRichBlock((string) ($cta['copy'] ?? ''));
            if (!empty($cta['buttonText'])) {
                $html .= '          <a class="button primary" href="' . esc((string) ($cta['buttonHref'] ?? 'contact.html')) . '">' . esc((string) $cta['buttonText']) . "</a>\n";
            }
            $html .= "        </div>\n";
            if (!empty($cta['videoUrl'])) {
                $html .= '        <div class="cta-band-media"><iframe src="' . esc((string) $cta['videoUrl']) . '" title="วิดีโอ" loading="lazy" allowfullscreen></iframe></div>' . "\n";
            }
            $html .= "      </div>\n";
            $html .= "    </section>\n";
        }

        $bannerRow = self::categorySection($pageKey, 'bottomBanners');
        if ($singlePlan) {
            $bannerActive = !$skipPromo && $bannerRow !== null && $bannerRow['is_active'];
        } else {
            $bannerActive = !$skipPromo && ($bannerRow === null || $bannerRow['is_active']);
        }
        if ($bannerActive) {
            $bannerConfig = ($bannerRow !== null && is_array($bannerRow['config'])) ? $bannerRow['config'] : [];
            $banners = is_array($bannerConfig['banners'] ?? null) ? $bannerConfig['banners'] : [];
            if ($banners !== []) {
                $html .= "            <section class=\"promo-duo section-reveal\" aria-label=\"ลิงก์ด่วน\">\n";
                $html .= "      <div class=\"promo-duo-inner\">\n";
                foreach ($banners as $b) {
                    if (!is_array($b) || empty($b['image'])) {
                        continue;
                    }
                    $href = (string) ($b['href'] ?? '#');
                    $alt = esc((string) ($b['alt'] ?? ''));
                    $html .= '        <a class="promo-duo-card" href="' . esc($href) . '">' . "\n";
                    $html .= '          <img src="' . esc((string) $b['image']) . '" width="1200" height="630" loading="lazy" decoding="async" alt="' . $alt . '">' . "\n";
                    $html .= "        </a>\n";
                }
                $html .= "      </div>\n";
                $html .= "    </section>\n";
            }
        }

        return $html;
    }

    private static function buildCategoryInsurancePage(string $file, string $pageKey): void
    {
        $path = self::$root . '/' . $file;
        if (!is_file($path)) {
            return;
        }
        $html = (string) file_get_contents($path);
        $html = self::replaceFooterInHtml($html, self::prefixFor($file));
        $html = self::patchHeaderBrand($html);

        if (self::hasCategoryPageSections($pageKey)) {
            $main = self::renderCategoryMainHtml($pageKey);
            $html = preg_replace('/<main>[\s\S]*?<\/main>/', '<main>' . "\n" . $main . '  </main>', $html, 1) ?? $html;
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

    private static function patchStaticPages(): void
    {
        self::buildCategoryInsurancePage('life-insurance.html', 'lifeInsurance');
        self::buildCategoryInsurancePage('health-insurance.html', 'healthInsurance');
        self::buildCategoryInsurancePage('savings-retirement.html', 'savingsRetirement');
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
        $slugSql = implode(',', array_map(
            static fn (string $s): string => cms_db()->quote($s),
            InsuranceCategories::filterSlugs()
        ));
        $stmt = cms_db()->query(
            "SELECT name, slug FROM insurance_plans
             WHERE is_active = 1 AND filter_tag IN ({$slugSql})
               AND (link_url IS NULL OR link_url NOT LIKE '%articles/%')"
        );
        while ($p = $stmt->fetch()) {
            $slug = self::planSlugForRow($p);
            $urls[] = ['loc' => $base . '/plans/' . $slug . '.html', 'priority' => '0.7'];
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
            // หน้าแผน build จากบิวเดอร์ plan-{id} แล้ว — ไม่ inject promo ส่วนกลางทับ
            if (str_starts_with($rel, 'plans/')) {
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
            // หน้า careers/*.html ต้องใช้ prefix ../ มิฉะนั้นรูป/ลิงก์ชี้ผิดโฟลเดอร์
            $cards .= self::renderCareerCard($c, $prefix) . "\n";
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
  <link rel="stylesheet" href="' . esc($opts['prefix']) . 'styles.css?v=' . (string) (@filemtime(dirname(__DIR__) . DIRECTORY_SEPARATOR . 'styles.css') ?: time()) . '">
' . self::themeVarsStyleTag() . '  <link rel="icon" type="image/png" href="' . esc($opts['prefix']) . 'assets/logo/logo.png">
  <link rel="apple-touch-icon" href="' . esc($opts['prefix']) . 'assets/logo/logo.png">
</head>';
    }

    /** Scale for .brand-name (0.7–1.5). Stored in settings.header.brandNameScale as percent 70–150. */
    private static function brandNameScaleFactor(): float
    {
        $raw = self::$header['brandNameScale'] ?? 100;
        $pct = is_numeric($raw) ? (float) $raw : 100.0;
        $pct = max(70.0, min(150.0, $pct));
        return round($pct / 100, 3);
    }

    private static function themeVarsStyleTag(): string
    {
        $scale = self::brandNameScaleFactor();
        $scaleCss = rtrim(rtrim(number_format($scale, 3, '.', ''), '0'), '.');
        if ($scaleCss === '') {
            $scaleCss = '1';
        }
        return '  <style id="wli-theme-vars">:root{--brand-name-scale:' . $scaleCss . ';}</style>' . "\n";
    }

    private static function injectThemeVarsAll(): void
    {
        $tag = trim(self::themeVarsStyleTag());
        if ($tag === '') {
            return;
        }
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
            $html = preg_replace('/<style id="wli-theme-vars">[\s\S]*?<\/style>\s*/', '', $html) ?? $html;
            $html = preg_replace('/<\/head>/i', $tag . "\n</head>", $html, 1) ?? $html;
            file_put_contents($file->getPathname(), $html);
            if (!in_array($rel, self::$written, true)) {
                self::$written[] = $rel;
            }
        }
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
        $banners = cms_db()->query(
            "SELECT * FROM banners WHERE placement = 'promo' AND is_active = 1 ORDER BY sort_order LIMIT 2"
        )->fetchAll();
        if (count($banners) >= 2) {
            $j = [
                'href' => $banners[0]['button_url'] ?: ($j['href'] ?? 'careers.html'),
                'imageSrc' => $banners[0]['image_path'] ?: ($j['imageSrc'] ?? 'assets/promo/banner-join-team.png'),
                'alt' => $banners[0]['title'] ?? ($j['alt'] ?? ''),
                'width' => '1200',
                'height' => '630',
            ];
            $i = [
                'href' => $banners[1]['button_url'] ?: ($i['href'] ?? 'contact.html'),
                'imageSrc' => $banners[1]['image_path'] ?: ($i['imageSrc'] ?? 'assets/promo/banner-insurance.png'),
                'alt' => $banners[1]['title'] ?? ($i['alt'] ?? ''),
                'width' => '1200',
                'height' => '630',
            ];
        }
        $jHref = self::resolvePageHref((string) ($j['href'] ?? 'careers.html'), $prefix);
        $iHref = self::resolvePageHref((string) ($i['href'] ?? 'contact.html'), $prefix);
        $jImg = self::resolvePageHref((string) ($j['imageSrc'] ?? 'assets/promo/banner-join-team.png'), $prefix);
        $iImg = self::resolvePageHref((string) ($i['imageSrc'] ?? 'assets/promo/banner-insurance.png'), $prefix);
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

    /** Prefix relative site paths for nested pages (articles/, careers/, plans/). */
    private static function resolvePageHref(string $href, string $prefix): string
    {
        $href = trim($href);
        if ($href === '' || $href === '#') {
            return $href;
        }
        if (preg_match('#^(?:https?:|//|mailto:|tel:|data:)#i', $href)) {
            return $href;
        }
        $href = preg_replace('#^(\./)+#', '', $href) ?? $href;
        while (str_starts_with($href, '../')) {
            $href = substr($href, 3);
        }
        return $prefix . ltrim($href, '/');
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
