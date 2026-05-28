<?php
declare(strict_types=1);

/**
 * Wealth Life Insure CMS REST API
 */
final class Api
{
    private const API_PREFIX = '/cms/api';

    public static function dispatch(): void
    {
        $method = Http::method();
        $path = self::normalizePath(Http::path());

        try {
            if (self::routePublic($method, $path)) {
                return;
            }
            Auth::requireUser();
            if (self::routeAuth($method, $path)) {
                return;
            }
            self::fail('ไม่พบเส้นทาง', 404);
        } catch (InvalidArgumentException $e) {
            self::fail($e->getMessage(), 400);
        } catch (RuntimeException $e) {
            self::fail($e->getMessage(), 422);
        }
    }

    private static function normalizePath(string $path): string
    {
        $path = '/' . trim($path, '/');
        if (str_starts_with($path, self::API_PREFIX)) {
            $path = substr($path, strlen(self::API_PREFIX)) ?: '/';
        }
        return $path === '' ? '/' : $path;
    }

    private static function routePublic(string $method, string $path): bool
    {
        if ($method === 'POST' && $path === '/auth/login') {
            $body = self::jsonInput();
            self::validateRequired($body, ['username', 'password']);
            $user = Auth::login((string) $body['username'], (string) $body['password']);
            if (!$user) {
                self::fail('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
            }
            self::ok(['user' => $user]);
            return true;
        }
        if ($method === 'POST' && $path === '/auth/logout') {
            Auth::logout();
            self::ok(['loggedOut' => true]);
            return true;
        }
        if ($method === 'GET' && $path === '/auth/me') {
            self::ok(['user' => Auth::user()]);
            return true;
        }
        if ($method === 'POST' && $path === '/public/contact') {
            self::publicContact();
            return true;
        }
        if ($method === 'GET' && $path === '/public/site') {
            self::ok(['snapshot' => self::buildPublicSnapshot()]);
            return true;
        }
        return false;
    }

    private static function routeAuth(string $method, string $path): bool
    {
        if ($method === 'GET' && $path === '/dashboard/stats') {
            self::requirePerm('dashboard');
            self::ok(self::dashboardStats());
            return true;
        }

        if (str_starts_with($path, '/nav')) {
            self::requirePerm('nav');
            if ($method === 'POST' && $path === '/nav/reorder') {
                self::reorderNav();
                return true;
            }
            if ($method === 'GET' && $path === '/nav') {
                self::ok(self::listNav());
                return true;
            }
            if ($method === 'POST' && $path === '/nav') {
                self::createNav();
                return true;
            }
            if (preg_match('#^/nav/(\d+)$#', $path, $m)) {
                $id = (int) $m[1];
                if ($method === 'PUT') {
                    self::updateNav($id);
                    return true;
                }
                if ($method === 'DELETE') {
                    self::deleteNav($id);
                    return true;
                }
            }
        }

        if (str_starts_with($path, '/sections')) {
            self::requirePerm('sections');
            if ($method === 'GET' && $path === '/sections') {
                self::listSections();
                return true;
            }
            if (preg_match('#^/sections/([a-z0-9_-]+)$#', $path, $m) && $method === 'PUT') {
                self::updateSection($m[1]);
                return true;
            }
        }

        foreach (['hero-slides' => 'home_hero_slides', 'banners' => 'banners', 'categories' => 'insurance_categories', 'plans' => 'insurance_plans', 'testimonials' => 'testimonials', 'contact-channels' => 'contact_channels', 'footer-links' => 'footer_links'] as $route => $table) {
            $perm = in_array($route, ['contact-channels', 'footer-links'], true) ? 'settings' : null;
            if (self::routeCrud($method, $path, $route, $table, $perm)) {
                return true;
            }
        }

        if ($method === 'GET' && $path === '/article-categories') {
            self::requirePerm('articles');
            $rows = cms_db()->query('SELECT id, name, slug FROM article_categories ORDER BY sort_order, id')->fetchAll();
            self::ok($rows);
            return true;
        }

        if (self::routeCrud($method, $path, 'articles', 'articles', 'articles')) {
            return true;
        }
        if (self::routeCrud($method, $path, 'careers', 'careers', 'careers')) {
            return true;
        }

        if (str_starts_with($path, '/leads')) {
            self::requirePerm('leads.read');
            if ($method === 'GET' && $path === '/leads/export.csv') {
                self::exportLeadsCsv();
                return true;
            }
            if ($method === 'GET' && $path === '/leads') {
                self::listLeads();
                return true;
            }
            if (preg_match('#^/leads/(\d+)$#', $path, $m)) {
                if ($method === 'GET') {
                    self::ok(self::fetchRow('leads', (int) $m[1]));
                    return true;
                }
                if ($method === 'PATCH') {
                    self::patchLead((int) $m[1]);
                    return true;
                }
            }
        }

        if ($path === '/contact-channels' && $method === 'PUT') {
            $body = self::jsonInput();
            if (isset($body['channels']) && is_array($body['channels'])) {
                self::requirePerm('settings');
                self::putContactChannels();
                return true;
            }
        }

        if ($path === '/footer' && in_array($method, ['GET', 'PUT'], true)) {
            self::requirePerm('settings');
            if ($method === 'GET') {
                self::ok(self::getFooter());
                return true;
            }
            $body = self::jsonInput();
            if (isset($body['links']) && is_array($body['links'])) {
                self::putFooter();
                return true;
            }
            if (isset($body['settings']) && is_array($body['settings'])) {
                self::setSettingJson('footer', $body['settings']);
                self::ok(self::getFooter());
                return true;
            }
            self::fail('ข้อมูลไม่ถูกต้อง', 400);
            return true;
        }

        if (preg_match('#^/seo/([a-z0-9_-]+)$#', $path, $m) && in_array($method, ['GET', 'PUT'], true)) {
            self::requirePerm('seo');
            $pageKey = $m[1];
            if ($method === 'GET') {
                self::ok(self::getSeo($pageKey));
                return true;
            }
            self::putSeo($pageKey);
            return true;
        }

        if (str_starts_with($path, '/media')) {
            self::requirePerm('media');
            if ($method === 'GET' && $path === '/media') {
                self::ok(self::listMedia());
                return true;
            }
            if ($method === 'POST' && $path === '/media/upload') {
                self::uploadMedia();
                return true;
            }
            if ($method === 'POST' && $path === '/media') {
                self::createMediaRecord();
                return true;
            }
            if (preg_match('#^/media/(\d+)$#', $path, $m)) {
                if ($method === 'GET') {
                    self::ok(self::fetchRow('media', (int) $m[1]));
                    return true;
                }
                if ($method === 'DELETE') {
                    self::deleteMedia((int) $m[1]);
                    return true;
                }
            }
        }

        if (str_starts_with($path, '/users')) {
            self::requirePerm('users');
            if ($method === 'GET' && $path === '/users') {
                self::ok(self::listUsers());
                return true;
            }
            if ($method === 'POST' && $path === '/users') {
                self::createUser();
                return true;
            }
            if (preg_match('#^/users/(\d+)$#', $path, $m)) {
                $id = (int) $m[1];
                if ($method === 'GET') {
                    self::ok(self::fetchUser($id));
                    return true;
                }
                if ($method === 'PUT') {
                    self::updateUser($id);
                    return true;
                }
                if ($method === 'DELETE') {
                    self::deleteUser($id);
                    return true;
                }
            }
        }

        if ($path === '/settings' && in_array($method, ['GET', 'PUT'], true)) {
            self::requirePerm('settings');
            if ($method === 'GET') {
                self::ok(self::getAllSettings());
                return true;
            }
            self::putSettings();
            return true;
        }

        if ($method === 'POST' && $path === '/build') {
            self::requirePerm('build');
            require_once __DIR__ . '/SiteBuilder.php';
            $result = SiteBuilder::build();
            self::ok($result);
            return true;
        }

        return false;
    }

    /** @param array<string,mixed> $data */
    private static function ok(array $data = []): void
    {
        cms_json(['ok' => true, 'data' => $data]);
    }

    private static function fail(string $error, int $code = 400): void
    {
        cms_json(['ok' => false, 'error' => $error], $code);
    }

    /** @return array<string,mixed> */
    private static function jsonInput(): array
    {
        $body = Http::body();
        if ($body !== []) {
            return $body;
        }
        if ($_POST !== []) {
            return $_POST;
        }
        return [];
    }

    /** @param array<string,mixed> $data */
    private static function validateRequired(array $data, array $keys): void
    {
        foreach ($keys as $key) {
            if (!isset($data[$key]) || (is_string($data[$key]) && trim($data[$key]) === '')) {
                throw new InvalidArgumentException("ต้องระบุ {$key}");
            }
        }
    }

    private static function reorderTable(string $table, array $ids): void
    {
        if ($ids === []) {
            throw new InvalidArgumentException('ต้องระบุ ids');
        }
        $db = cms_db();
        $db->beginTransaction();
        try {
            $order = 0;
            $stmt = $db->prepare("UPDATE {$table} SET sort_order = ? WHERE id = ?");
            foreach ($ids as $id) {
                $stmt->execute([$order++, (int) $id]);
            }
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
    }

    private static function normalizeDateTime(mixed $val): ?string
    {
        if ($val === null || $val === '') {
            return null;
        }
        if (!is_string($val)) {
            return (string) $val;
        }
        $val = trim(str_replace('T', ' ', $val));
        if ($val === '') {
            return null;
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/', $val)) {
            return $val . ':00';
        }
        return $val;
    }

    private static function slugify(string $text): string
    {
        $text = trim(mb_strtolower($text, 'UTF-8'));
        $text = preg_replace('/[^\p{L}\p{N}]+/u', '-', $text) ?? '';
        $text = trim($text, '-');
        return $text !== '' ? $text : 'item-' . time();
    }

    private static function requirePerm(string $perm): void
    {
        if (!Auth::can($perm)) {
            self::fail('ไม่มีสิทธิ์เข้าถึง', 403);
        }
    }

    private static function duplicateKeyMessage(string $table): string
    {
        return match ($table) {
            'articles', 'careers' => 'Slug นี้ถูกใช้แล้ว กรุณาเปลี่ยน URL (slug)',
            default => 'ข้อมูลซ้ำกับรายการอื่น',
        };
    }

    private static function decodeJsonFields(array $row, array $jsonKeys): array
    {
        foreach ($jsonKeys as $key) {
            if (isset($row[$key]) && is_string($row[$key])) {
                $decoded = json_decode($row[$key], true);
                $row[$key] = is_array($decoded) ? $decoded : $row[$key];
            }
        }
        return $row;
    }

    private static function encodeJson(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE) ?: '{}';
    }

    /** @return array<string,mixed> */
    private static function fetchRow(string $table, int $id): array
    {
        $stmt = cms_db()->prepare("SELECT * FROM {$table} WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            self::fail('ไม่พบข้อมูล', 404);
        }
        return $row;
    }

    private static function routeCrud(string $method, string $path, string $route, string $table, ?string $perm = null): bool
    {
        $base = '/' . $route;
        if (!str_starts_with($path, $base)) {
            return false;
        }
        if ($perm !== null) {
            self::requirePerm($perm);
        } else {
            self::requirePerm($route);
        }

        if ($method === 'POST' && $path === $base . '/reorder') {
            $body = self::jsonInput();
            self::validateRequired($body, ['ids']);
            self::reorderTable($table, array_map('intval', (array) $body['ids']));
            self::ok(['reordered' => true]);
            return true;
        }

        if ($method === 'GET' && $path === $base) {
            self::ok(self::crudList($table, $route));
            return true;
        }
        if ($method === 'POST' && $path === $base) {
            self::ok(self::crudCreate($table, $route));
            return true;
        }

        if (preg_match('#^' . preg_quote($base, '#') . '/(\d+)$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'GET') {
                self::ok(self::crudGetOne($table, $route, $id));
                return true;
            }
            if ($method === 'PUT') {
                self::ok(self::crudUpdate($table, $route, $id));
                return true;
            }
            if ($method === 'DELETE') {
                self::crudDelete($table, $id);
                self::ok(['deleted' => true, 'id' => $id]);
                return true;
            }
        }
        return false;
    }

    /** @return list<array<string,mixed>> */
    private static function crudList(string $table, string $route): array
    {
        $db = cms_db();
        $order = match ($table) {
            'articles' => 'ORDER BY sort_order ASC, published_at DESC, id DESC',
            'careers' => 'ORDER BY sort_order ASC, id DESC',
            default => 'ORDER BY sort_order ASC, id ASC',
        };
        $rows = $db->query("SELECT * FROM {$table} {$order}")->fetchAll();
        return array_map(fn ($r) => self::formatRow($table, $r), $rows);
    }

    /** @return array<string,mixed> */
    private static function crudGetOne(string $table, string $route, int $id): array
    {
        return self::formatRow($table, self::fetchRow($table, $id));
    }

    /** @return array<string,mixed> */
    private static function crudCreate(string $table, string $route): array
    {
        $body = self::jsonInput();
        $fields = self::fieldsForTable($table, $body, true);
        if (isset($fields['slug']) && ($fields['slug'] === '' || $fields['slug'] === null) && isset($fields['name'])) {
            $fields['slug'] = self::slugify((string) $fields['name']);
        }
        if (isset($fields['slug']) && ($fields['slug'] === '' || $fields['slug'] === null) && isset($fields['title'])) {
            $fields['slug'] = self::slugify((string) $fields['title']);
        }
        $cols = array_keys($fields);
        $placeholders = implode(',', array_fill(0, count($cols), '?'));
        $sql = 'INSERT INTO ' . $table . ' (' . implode(',', $cols) . ') VALUES (' . $placeholders . ')';
        $db = cms_db();
        try {
            $db->prepare($sql)->execute(array_values($fields));
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
                throw new InvalidArgumentException(self::duplicateKeyMessage($table));
            }
            throw $e;
        }
        $id = (int) $db->lastInsertId();
        return self::crudGetOne($table, $route, $id);
    }

    /** @return array<string,mixed> */
    private static function crudUpdate(string $table, string $route, int $id): array
    {
        self::fetchRow($table, $id);
        $body = self::jsonInput();
        $fields = self::fieldsForTable($table, $body, false);
        if ($fields === []) {
            return self::crudGetOne($table, $route, $id);
        }
        $sets = [];
        $vals = [];
        foreach ($fields as $col => $val) {
            $sets[] = "{$col} = ?";
            $vals[] = $val;
        }
        $vals[] = $id;
        try {
            cms_db()->prepare('UPDATE ' . $table . ' SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        } catch (PDOException $e) {
            if ((int) ($e->errorInfo[1] ?? 0) === 1062) {
                throw new InvalidArgumentException(self::duplicateKeyMessage($table));
            }
            throw $e;
        }
        return self::crudGetOne($table, $route, $id);
    }

    private static function crudDelete(string $table, int $id): void
    {
        self::fetchRow($table, $id);
        cms_db()->prepare("DELETE FROM {$table} WHERE id = ?")->execute([$id]);
    }

    /** @param array<string,mixed> $body @return array<string,mixed> */
    private static function fieldsForTable(string $table, array $body, bool $create): array
    {
        $allowed = self::allowedColumns($table);
        $out = [];
        foreach ($allowed as $col => $meta) {
            if (!array_key_exists($col, $body)) {
                continue;
            }
            $val = $body[$col];
            if (($meta['json'] ?? false) && is_array($val)) {
                $val = self::encodeJson($val);
            }
            if ($col === 'category_id' && $val !== null && !is_numeric($val) && is_string($val)) {
                $val = self::resolveArticleCategoryId($val);
            }
            if ($col === 'published_at') {
                $val = self::normalizeDateTime($val);
            }
            if ($col === 'slug' && is_string($val) && trim($val) === '') {
                continue;
            }
            $out[$col] = $val;
        }
        if ($create) {
            if ($table !== 'users' && !isset($out['sort_order'])) {
                $max = (int) cms_db()->query("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM {$table}")->fetchColumn();
                $out['sort_order'] = $max;
            }
        }
        return $out;
    }

    /** @return array<string,array{json?:bool}> */
    private static function allowedColumns(string $table): array
    {
        return match ($table) {
            'nav_items' => [
                'parent_id' => [], 'location' => [], 'label' => [], 'url' => [], 'target' => [],
                'is_cta' => [], 'sort_order' => [], 'is_active' => [],
            ],
            'home_hero_slides' => [
                'image_path' => [], 'alt_text' => [], 'width' => [], 'height' => [],
                'aspect_ratio' => [], 'sort_order' => [], 'is_active' => [],
            ],
            'banners' => [
                'placement' => [], 'title' => [], 'description' => [], 'image_path' => [],
                'button_text' => [], 'button_url' => [], 'sort_order' => [], 'is_active' => [],
            ],
            'insurance_categories' => [
                'name' => [], 'slug' => [], 'icon_path' => [], 'image_path' => [], 'description' => [],
                'page_body_html' => [], 'seo_title' => [], 'seo_description' => [], 'meta_keywords' => [],
                'sort_order' => [], 'is_active' => [],
            ],
            'insurance_plans' => [
                'category_id' => [], 'filter_tag' => [], 'name' => [], 'slug' => [],
                'short_description' => [], 'full_description' => [], 'highlights' => ['json' => true],
                'image_path' => [], 'price_from' => [], 'insurer_name' => [], 'pdf_path' => [],
                'link_url' => [], 'contact_button_text' => [], 'is_featured' => [], 'is_hot' => [],
                'is_active' => [], 'sort_order' => [], 'seo_title' => [], 'seo_description' => [],
                'meta_keywords' => [],
            ],
            'articles' => [
                'category_id' => [], 'slug' => [], 'title' => [], 'excerpt' => [], 'body_html' => [],
                'cover_image' => [], 'eyebrow' => [], 'hero_lead' => [], 'status' => [],
                'is_featured' => [], 'published_at' => [], 'seo_title' => [], 'seo_description' => [],
                'meta_keywords' => [], 'og_image' => [], 'robots_index' => [], 'sort_order' => [],
            ],
            'careers' => [
                'slug' => [], 'title' => [], 'excerpt' => [], 'body_html' => [], 'cover_image' => [],
                'eyebrow' => [], 'hero_lead' => [], 'hero_image' => [], 'status' => [],
                'is_featured' => [], 'published_at' => [], 'seo_title' => [], 'seo_description' => [],
                'sort_order' => [],
            ],
            'testimonials' => [
                'customer_name' => [], 'customer_role' => [], 'avatar_letter' => [],
                'avatar_image' => [], 'quote_text' => [], 'rating' => [], 'sort_order' => [], 'is_active' => [],
            ],
            'contact_channels' => [
                'channel_key' => [], 'label' => [], 'value_text' => [], 'url' => [],
                'variant' => [], 'sort_order' => [], 'is_active' => [],
            ],
            'footer_links' => [
                'group_key' => [], 'label' => [], 'url' => [], 'sort_order' => [], 'is_active' => [],
            ],
            default => [],
        };
    }

    /** @param array<string,mixed> $row */
    private static function formatRow(string $table, array $row): array
    {
        $jsonKeys = match ($table) {
            'page_sections', 'settings' => ['config', 'setting_value'],
            'insurance_plans' => ['highlights'],
            default => [],
        };
        if ($table === 'settings') {
            return $row;
        }
        $row = self::decodeJsonFields($row, $jsonKeys);
        if ($table === 'articles' && isset($row['category_id'])) {
            $row['category_slug'] = self::articleCategorySlug((int) $row['category_id']);
        }
        foreach (['is_active', 'is_cta', 'is_featured', 'is_hot', 'robots_index'] as $flag) {
            if (isset($row[$flag])) {
                $row[$flag] = (int) $row[$flag];
            }
        }
        return $row;
    }

    private static function resolveArticleCategoryId(string $slugOrName): ?int
    {
        $stmt = cms_db()->prepare('SELECT id FROM article_categories WHERE slug = ? OR name = ? LIMIT 1');
        $stmt->execute([$slugOrName, $slugOrName]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int) $id;
        }
        $slug = self::slugify($slugOrName);
        cms_db()->prepare('INSERT INTO article_categories (name, slug, sort_order) VALUES (?,?,?)')
            ->execute([$slugOrName, $slug, 99]);
        return (int) cms_db()->lastInsertId();
    }

    private static function articleCategorySlug(int $categoryId): ?string
    {
        if ($categoryId <= 0) {
            return null;
        }
        $stmt = cms_db()->prepare('SELECT slug FROM article_categories WHERE id = ?');
        $stmt->execute([$categoryId]);
        $slug = $stmt->fetchColumn();
        return $slug !== false ? (string) $slug : null;
    }

    private static function publicContact(): void
    {
        $body = self::jsonInput();
        self::validateRequired($body, ['name']);
        $stmt = cms_db()->prepare(
            'INSERT INTO leads (name, phone, email, interest, insurance_plan, message, source_page) VALUES (?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            trim((string) $body['name']),
            isset($body['phone']) ? trim((string) $body['phone']) : null,
            isset($body['email']) ? trim((string) $body['email']) : null,
            isset($body['interest']) ? trim((string) $body['interest']) : null,
            isset($body['insurance_plan']) ? trim((string) $body['insurance_plan']) : null,
            isset($body['message']) ? trim((string) $body['message']) : null,
            isset($body['source_page']) ? trim((string) $body['source_page']) : 'contact',
        ]);
        self::ok(['id' => (int) cms_db()->lastInsertId(), 'message' => 'บันทึกข้อมูลเรียบร้อย']);
    }

    /** @return array<string,mixed> */
    private static function buildPublicSnapshot(): array
    {
        $db = cms_db();
        $site = self::getSettingJson('site', []);
        $footer = self::getSettingJson('footer', []);
        $promos = self::getSettingJson('promos', []);
        $plans = $db->query(
            "SELECT name, slug, filter_tag AS category, short_description AS excerpt, link_url AS href, image_path AS imageSrc
             FROM insurance_plans WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order"
        )->fetchAll();
        $articles = $db->query(
            "SELECT a.slug, ac.slug AS category, a.title, a.excerpt,
                    CONCAT('articles/', a.slug, '.html') AS href, a.cover_image AS imageSrc
             FROM articles a LEFT JOIN article_categories ac ON ac.id = a.category_id
             WHERE a.status = 'published' ORDER BY a.sort_order, a.published_at DESC"
        )->fetchAll();
        return [
            'site' => $site,
            'footer' => $footer,
            'promos' => $promos,
            'featuredPlans' => $plans,
            'articles' => $articles,
        ];
    }

    /** @return array<string,mixed> */
    private static function dashboardStats(): array
    {
        $db = cms_db();
        return [
            'articles' => (int) $db->query("SELECT COUNT(*) FROM articles WHERE status = 'published'")->fetchColumn(),
            'articlesDraft' => (int) $db->query("SELECT COUNT(*) FROM articles WHERE status = 'draft'")->fetchColumn(),
            'careers' => (int) $db->query("SELECT COUNT(*) FROM careers WHERE status = 'published'")->fetchColumn(),
            'plans' => (int) $db->query('SELECT COUNT(*) FROM insurance_plans WHERE is_active = 1')->fetchColumn(),
            'leadsNew' => (int) $db->query("SELECT COUNT(*) FROM leads WHERE status = 'new'")->fetchColumn(),
            'leadsTotal' => (int) $db->query('SELECT COUNT(*) FROM leads')->fetchColumn(),
            'media' => (int) $db->query('SELECT COUNT(*) FROM media')->fetchColumn(),
            'testimonials' => (int) $db->query('SELECT COUNT(*) FROM testimonials WHERE is_active = 1')->fetchColumn(),
            'banners' => (int) $db->query('SELECT COUNT(*) FROM banners WHERE is_active = 1')->fetchColumn(),
            'categories' => (int) $db->query('SELECT COUNT(*) FROM insurance_categories WHERE is_active = 1')->fetchColumn(),
        ];
    }

    /** @return list<array<string,mixed>> */
    private static function listNav(): array
    {
        $rows = cms_db()->query(
            'SELECT * FROM nav_items ORDER BY location, sort_order, id'
        )->fetchAll();
        return array_map(fn ($r) => self::formatRow('nav_items', $r), $rows);
    }

    private static function createNav(): void
    {
        self::ok(self::crudCreate('nav_items', 'nav'));
    }

    private static function updateNav(int $id): void
    {
        self::ok(self::crudUpdate('nav_items', 'nav', $id));
    }

    private static function deleteNav(int $id): void
    {
        self::crudDelete('nav_items', $id);
        self::ok(['deleted' => true]);
    }

    private static function reorderNav(): void
    {
        $body = self::jsonInput();
        self::validateRequired($body, ['ids']);
        self::reorderTable('nav_items', array_map('intval', (array) $body['ids']));
        self::ok(['reordered' => true]);
    }

    private static function listSections(): void
    {
        $pageKey = $_GET['page_key'] ?? 'home';
        $stmt = cms_db()->prepare('SELECT * FROM page_sections WHERE page_key = ? ORDER BY sort_order, id');
        $stmt->execute([$pageKey]);
        $rows = array_map(fn ($r) => self::formatRow('page_sections', $r), $stmt->fetchAll());
        self::ok(['page_key' => $pageKey, 'sections' => $rows]);
    }

    private static function updateSection(string $sectionKey): void
    {
        $body = self::jsonInput();
        $pageKey = (string) ($body['page_key'] ?? $_GET['page_key'] ?? 'home');
        $config = $body['config'] ?? null;
        $isActive = $body['is_active'] ?? null;

        $stmt = cms_db()->prepare('SELECT id FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1');
        $stmt->execute([$pageKey, $sectionKey]);
        $id = $stmt->fetchColumn();

        if ($id) {
            $sets = [];
            $vals = [];
            if ($config !== null) {
                $sets[] = 'config = ?';
                $vals[] = is_array($config) ? self::encodeJson($config) : $config;
            }
            if ($isActive !== null) {
                $sets[] = 'is_active = ?';
                $vals[] = (int) (bool) $isActive;
            }
            if (isset($body['title'])) {
                $sets[] = 'title = ?';
                $vals[] = $body['title'];
            }
            if ($sets !== []) {
                $vals[] = $id;
                cms_db()->prepare('UPDATE page_sections SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
            }
            $row = self::fetchRow('page_sections', (int) $id);
        } else {
            cms_db()->prepare(
                'INSERT INTO page_sections (page_key, section_key, title, is_active, sort_order, config) VALUES (?,?,?,?,?,?)'
            )->execute([
                $pageKey,
                $sectionKey,
                $body['title'] ?? $sectionKey,
                (int) ($isActive ?? 1),
                (int) ($body['sort_order'] ?? 0),
                self::encodeJson(is_array($config) ? $config : []),
            ]);
            $row = self::fetchRow('page_sections', (int) cms_db()->lastInsertId());
        }
        self::ok(self::formatRow('page_sections', $row));
    }

    private static function listLeads(): void
    {
        $status = $_GET['status'] ?? null;
        $sql = 'SELECT * FROM leads';
        $params = [];
        if ($status) {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 500';
        $stmt = cms_db()->prepare($sql);
        $stmt->execute($params);
        self::ok(['leads' => $stmt->fetchAll()]);
    }

    private static function patchLead(int $id): void
    {
        self::fetchRow('leads', $id);
        $body = self::jsonInput();
        $allowed = ['status', 'internal_note', 'name', 'phone', 'email', 'interest', 'insurance_plan', 'message'];
        $sets = [];
        $vals = [];
        foreach ($allowed as $col) {
            if (array_key_exists($col, $body)) {
                $sets[] = "{$col} = ?";
                $vals[] = $body[$col];
            }
        }
        if ($sets === []) {
            self::ok(self::fetchRow('leads', $id));
            return;
        }
        $vals[] = $id;
        cms_db()->prepare('UPDATE leads SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        self::ok(self::fetchRow('leads', $id));
    }

    private static function exportLeadsCsv(): void
    {
        $rows = cms_db()->query('SELECT * FROM leads ORDER BY created_at DESC')->fetchAll();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="leads-export.csv"');
        echo "\xEF\xBB\xBF";
        $out = fopen('php://output', 'w');
        fputcsv($out, ['id', 'name', 'phone', 'email', 'interest', 'insurance_plan', 'message', 'status', 'source_page', 'created_at']);
        foreach ($rows as $r) {
            fputcsv($out, [
                $r['id'], $r['name'], $r['phone'], $r['email'], $r['interest'],
                $r['insurance_plan'], $r['message'], $r['status'], $r['source_page'], $r['created_at'],
            ]);
        }
        fclose($out);
        exit;
    }

    /** @return list<array<string,mixed>> */
    private static function listContactChannels(): array
    {
        return cms_db()->query('SELECT * FROM contact_channels ORDER BY sort_order, id')->fetchAll();
    }

    private static function putContactChannels(): void
    {
        $body = self::jsonInput();
        $channels = $body['channels'] ?? $body;
        if (!is_array($channels)) {
            throw new InvalidArgumentException('รูปแบบข้อมูลไม่ถูกต้อง');
        }
        $db = cms_db();
        $db->beginTransaction();
        try {
            foreach ($channels as $i => $ch) {
                if (!is_array($ch)) {
                    continue;
                }
                $key = (string) ($ch['channel_key'] ?? 'channel_' . $i);
                $stmt = $db->prepare('SELECT id FROM contact_channels WHERE channel_key = ?');
                $stmt->execute([$key]);
                $existing = $stmt->fetchColumn();
                if ($existing) {
                    $db->prepare(
                        'UPDATE contact_channels SET label=?, value_text=?, url=?, variant=?, is_active=?, sort_order=? WHERE id=?'
                    )->execute([
                        $ch['label'] ?? '', $ch['value_text'] ?? null, $ch['url'] ?? null,
                        $ch['variant'] ?? null, (int) ($ch['is_active'] ?? 1), (int) ($ch['sort_order'] ?? $i),
                        $existing,
                    ]);
                } else {
                    $db->prepare(
                        'INSERT INTO contact_channels (channel_key, label, value_text, url, variant, is_active, sort_order) VALUES (?,?,?,?,?,?,?)'
                    )->execute([
                        $key, $ch['label'] ?? '', $ch['value_text'] ?? null, $ch['url'] ?? null,
                        $ch['variant'] ?? null, (int) ($ch['is_active'] ?? 1), (int) ($ch['sort_order'] ?? $i),
                    ]);
                }
            }
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        self::ok(['channels' => self::listContactChannels()]);
    }

    /** @return array<string,mixed> */
    private static function getFooter(): array
    {
        return [
            'settings' => self::getSettingJson('footer', []),
            'links' => cms_db()->query('SELECT * FROM footer_links ORDER BY group_key, sort_order, id')->fetchAll(),
        ];
    }

    private static function putFooter(): void
    {
        $body = self::jsonInput();
        if (isset($body['settings']) && is_array($body['settings'])) {
            self::setSettingJson('footer', $body['settings']);
        }
        if (isset($body['links']) && is_array($body['links'])) {
            $db = cms_db();
            $db->exec('DELETE FROM footer_links');
            $stmt = $db->prepare(
                'INSERT INTO footer_links (group_key, label, url, sort_order, is_active) VALUES (?,?,?,?,?)'
            );
            foreach ($body['links'] as $i => $link) {
                if (!is_array($link)) {
                    continue;
                }
                $stmt->execute([
                    $link['group_key'] ?? 'main',
                    $link['label'] ?? '',
                    $link['url'] ?? '#',
                    (int) ($link['sort_order'] ?? $i),
                    (int) ($link['is_active'] ?? 1),
                ]);
            }
        }
        self::ok(self::getFooter());
    }

    /** @return array<string,mixed> */
    private static function getSeo(string $pageKey): array
    {
        $stmt = cms_db()->prepare('SELECT * FROM seo_meta WHERE page_key = ? LIMIT 1');
        $stmt->execute([$pageKey]);
        $row = $stmt->fetch();
        return $row ?: ['page_key' => $pageKey];
    }

    private static function putSeo(string $pageKey): void
    {
        $body = self::jsonInput();
        $stmt = cms_db()->prepare('SELECT id FROM seo_meta WHERE page_key = ?');
        $stmt->execute([$pageKey]);
        $id = $stmt->fetchColumn();
        $fields = [
            'meta_title' => $body['meta_title'] ?? null,
            'meta_description' => $body['meta_description'] ?? null,
            'meta_keywords' => $body['meta_keywords'] ?? null,
            'og_image' => $body['og_image'] ?? null,
            'canonical_url' => $body['canonical_url'] ?? null,
            'robots_index' => isset($body['robots_index']) ? (int) (bool) $body['robots_index'] : 1,
            'slug' => $body['slug'] ?? null,
        ];
        if ($id) {
            cms_db()->prepare(
                'UPDATE seo_meta SET meta_title=?, meta_description=?, meta_keywords=?, og_image=?, canonical_url=?, robots_index=?, slug=? WHERE id=?'
            )->execute([...array_values($fields), $id]);
        } else {
            cms_db()->prepare(
                'INSERT INTO seo_meta (page_key, meta_title, meta_description, meta_keywords, og_image, canonical_url, robots_index, slug) VALUES (?,?,?,?,?,?,?,?)'
            )->execute([$pageKey, ...array_values($fields)]);
        }
        self::ok(self::getSeo($pageKey));
    }

    /** @return list<array<string,mixed>> */
    private static function listMedia(): array
    {
        return cms_db()->query('SELECT * FROM media ORDER BY created_at DESC LIMIT 200')->fetchAll();
    }

    private static function uploadMedia(): void
    {
        if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            self::fail('ไม่พบไฟล์อัปโหลด', 400);
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            self::fail('อัปโหลดไฟล์ไม่สำเร็จ', 400);
        }
        $original = basename((string) $file['name']);
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'];
        if (!in_array($ext, $allowed, true)) {
            self::fail('ประเภทไฟล์ไม่รองรับ', 400);
        }
        $safeName = self::slugify(pathinfo($original, PATHINFO_FILENAME)) . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
        $destDir = cms_upload_dir();
        $destPath = $destDir . DIRECTORY_SEPARATOR . $safeName;
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            self::fail('บันทึกไฟล์ไม่สำเร็จ', 500);
        }
        $relative = 'uploads/' . $safeName;
        $mime = mime_content_type($destPath) ?: ($file['type'] ?? 'application/octet-stream');
        $size = (int) filesize($destPath);
        $alt = $_POST['alt_text'] ?? $_GET['alt_text'] ?? null;
        cms_db()->prepare(
            'INSERT INTO media (filename, stored_path, mime_type, file_size, alt_text) VALUES (?,?,?,?,?)'
        )->execute([$original, $relative, $mime, $size, $alt]);
        $id = (int) cms_db()->lastInsertId();
        self::ok(self::fetchRow('media', $id));
    }

    private static function createMediaRecord(): void
    {
        $body = self::jsonInput();
        self::validateRequired($body, ['filename', 'stored_path', 'mime_type']);
        cms_db()->prepare(
            'INSERT INTO media (filename, stored_path, mime_type, file_size, alt_text) VALUES (?,?,?,?,?)'
        )->execute([
            $body['filename'],
            $body['stored_path'],
            $body['mime_type'],
            (int) ($body['file_size'] ?? 0),
            $body['alt_text'] ?? null,
        ]);
        self::ok(self::fetchRow('media', (int) cms_db()->lastInsertId()));
    }

    private static function deleteMedia(int $id): void
    {
        $row = self::fetchRow('media', $id);
        $path = cms_root() . '/' . ltrim((string) $row['stored_path'], '/');
        if (is_file($path)) {
            @unlink($path);
        }
        cms_db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
        self::ok(['deleted' => true]);
    }

    /** @return list<array<string,mixed>> */
    private static function listUsers(): array
    {
        $rows = cms_db()->query(
            'SELECT id, username, email, role, is_active, last_login_at, created_at, updated_at FROM users ORDER BY id'
        )->fetchAll();
        return $rows;
    }

    private static function fetchUser(int $id): array
    {
        $row = self::fetchRow('users', $id);
        unset($row['password_hash']);
        return $row;
    }

    private static function createUser(): void
    {
        $body = self::jsonInput();
        self::validateRequired($body, ['username', 'password']);
        $hash = password_hash((string) $body['password'], PASSWORD_DEFAULT);
        cms_db()->prepare(
            'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?,?,?,?,?)'
        )->execute([
            $body['username'],
            $body['email'] ?? null,
            $hash,
            $body['role'] ?? 'editor',
            (int) ($body['is_active'] ?? 1),
        ]);
        self::ok(self::fetchUser((int) cms_db()->lastInsertId()));
    }

    private static function updateUser(int $id): void
    {
        self::fetchRow('users', $id);
        $body = self::jsonInput();
        $sets = [];
        $vals = [];
        foreach (['username', 'email', 'role'] as $col) {
            if (array_key_exists($col, $body)) {
                $sets[] = "{$col} = ?";
                $vals[] = $body[$col];
            }
        }
        if (isset($body['is_active'])) {
            $sets[] = 'is_active = ?';
            $vals[] = (int) (bool) $body['is_active'];
        }
        if (!empty($body['password'])) {
            $sets[] = 'password_hash = ?';
            $vals[] = password_hash((string) $body['password'], PASSWORD_DEFAULT);
        }
        if ($sets === []) {
            self::ok(self::fetchUser($id));
            return;
        }
        $vals[] = $id;
        cms_db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        self::ok(self::fetchUser($id));
    }

    private static function deleteUser(int $id): void
    {
        if (!Auth::can('users.delete')) {
            self::fail('เฉพาะ super_admin เท่านั้นที่ลบผู้ใช้ได้', 403);
        }
        $user = Auth::user();
        if ($user && (int) $user['id'] === $id) {
            self::fail('ไม่สามารถลบบัญชีของตัวเอง', 400);
        }
        cms_db()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
        self::ok(['deleted' => true]);
    }

    /** @return array<string,mixed> */
    private static function getAllSettings(): array
    {
        $rows = cms_db()->query('SELECT setting_key, setting_value FROM settings')->fetchAll();
        $out = [];
        foreach ($rows as $row) {
            $val = json_decode((string) $row['setting_value'], true);
            $out[$row['setting_key']] = is_array($val) ? $val : $row['setting_value'];
        }
        return $out;
    }

    private static function putSettings(): void
    {
        $body = self::jsonInput();
        if (!is_array($body)) {
            throw new InvalidArgumentException('รูปแบบข้อมูลไม่ถูกต้อง');
        }
        $items = isset($body['settings']) && is_array($body['settings']) ? $body['settings'] : $body;
        foreach ($items as $key => $value) {
            if (!is_string($key)) {
                continue;
            }
            self::setSettingJson($key, $value);
        }
        self::ok(self::getAllSettings());
    }

    /** @return array<string,mixed> */
    private static function getSettingJson(string $key, array $default = []): array
    {
        $stmt = cms_db()->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
        $stmt->execute([$key]);
        $raw = $stmt->fetchColumn();
        if ($raw === false) {
            return $default;
        }
        $decoded = json_decode((string) $raw, true);
        return is_array($decoded) ? $decoded : $default;
    }

    private static function setSettingJson(string $key, mixed $value): void
    {
        $json = self::encodeJson($value);
        cms_db()->prepare(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?,?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
        )->execute([$key, $json]);
    }
}
