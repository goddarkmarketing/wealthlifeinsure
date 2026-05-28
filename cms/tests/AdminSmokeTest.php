<?php
declare(strict_types=1);

/**
 * CMS Admin smoke test — ตรวจว่าหลังบ้านพร้อมใช้งานครบทุกส่วน
 *
 * รัน: php cms/tests/admin-smoke-test.php
 *      php cms/tests/admin-smoke-test.php --with-build
 */
final class AdminSmokeTest
{
    private string $baseUrl;
    private string $username;
    private string $password;
    private bool $withBuild;
    private string $cookieFile;
    /** @var list<array{group:string,name:string,ok:bool,detail:string}> */
    private array $results = [];

    public function __construct(string $baseUrl, string $username, string $password, bool $withBuild)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->username = $username;
        $this->password = $password;
        $this->withBuild = $withBuild;
        $this->cookieFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wli_cms_smoke_' . md5($baseUrl) . '.cookies';
    }

    public function run(): int
    {
        if (is_file($this->cookieFile)) {
            @unlink($this->cookieFile);
        }

        $this->section('ระบบพื้นฐาน');
        $this->checkPhpExtensions();
        $this->checkConfigAndDatabase();
        $this->checkPhpSyntax();
        $this->checkAdminAssets();
        $this->checkTrackingModule();

        $this->section('API (ต้องเปิด Apache + MySQL)');
        if (!$this->checkApiReachable()) {
            $this->printReport();
            return 1;
        }

        $this->checkPublicApi();
        if (!$this->checkLogin()) {
            $this->printReport();
            return 1;
        }

        $this->checkAuthenticatedApi();
        if ($this->withBuild) {
            $this->checkBuild();
        }

        $this->printReport();
        return $this->hasFailures() ? 1 : 0;
    }

    private function section(string $title): void
    {
        echo "\n=== {$title} ===\n";
    }

    private function pass(string $group, string $name, string $detail = 'OK'): void
    {
        $this->results[] = ['group' => $group, 'name' => $name, 'ok' => true, 'detail' => $detail];
        echo "  [PASS] {$name}" . ($detail !== 'OK' ? " — {$detail}" : '') . "\n";
    }

    private function fail(string $group, string $name, string $detail): void
    {
        $this->results[] = ['group' => $group, 'name' => $name, 'ok' => false, 'detail' => $detail];
        echo "  [FAIL] {$name} — {$detail}\n";
    }

    private function hasFailures(): bool
    {
        foreach ($this->results as $r) {
            if (!$r['ok']) {
                return true;
            }
        }
        return false;
    }

    private function checkPhpExtensions(): void
    {
        $group = 'PHP';
        foreach (['pdo', 'pdo_mysql', 'json', 'mbstring', 'session'] as $ext) {
            if (extension_loaded($ext)) {
                $this->pass($group, "extension:{$ext}");
            } else {
                $this->fail($group, "extension:{$ext}", 'ไม่ได้ติดตั้ง');
            }
        }
    }

    private function checkConfigAndDatabase(): void
    {
        $group = 'Database';
        $configPath = dirname(__DIR__) . '/config.php';
        if (!is_file($configPath)) {
            $this->fail($group, 'config.php', 'ไม่พบ — คัดลอกจาก config.example.php');
            return;
        }
        $this->pass($group, 'config.php');

        try {
            require_once dirname(__DIR__) . '/bootstrap.php';
            $pdo = cms_db();
            $this->pass($group, 'เชื่อมต่อ MySQL');
        } catch (Throwable $e) {
            $this->fail($group, 'เชื่อมต่อ MySQL', $e->getMessage());
            return;
        }

        $tables = [
            'users',
            'settings',
            'nav_items',
            'page_sections',
            'home_hero_slides',
            'banners',
            'insurance_categories',
            'insurance_plans',
            'articles',
            'article_categories',
            'careers',
            'testimonials',
            'contact_channels',
            'footer_links',
            'leads',
            'seo_meta',
            'media',
        ];
        foreach ($tables as $table) {
            try {
                cms_db()->query("SELECT 1 FROM `{$table}` LIMIT 1");
                $this->pass($group, "ตาราง:{$table}");
            } catch (Throwable $e) {
                $this->fail($group, "ตาราง:{$table}", $e->getMessage());
            }
        }
    }

    private function checkPhpSyntax(): void
    {
        $group = 'Syntax';
        $root = dirname(__DIR__);
        $files = [
            'Api.php',
            'Auth.php',
            'SiteBuilder.php',
            'Tracking.php',
            'api/index.php',
        ];
        foreach ($files as $rel) {
            $path = $root . '/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
            if (!is_file($path)) {
                $this->fail($group, $rel, 'ไม่พบไฟล์');
                continue;
            }
            $out = [];
            $code = 0;
            exec('"' . PHP_BINARY . '" -l ' . escapeshellarg($path) . ' 2>&1', $out, $code);
            if ($code === 0) {
                $this->pass($group, $rel);
            } else {
                $this->fail($group, $rel, implode(' ', $out));
            }
        }
    }

    private function checkAdminAssets(): void
    {
        $group = 'Admin UI';
        $root = dirname(__DIR__, 2) . '/admin/v2';
        $required = [
            'index.html',
            'js/app.js',
            'js/api.js',
            'js/tracking-editor.js',
            'js/article-editor.js',
            'css/dashboard.css',
            'css/tracking-editor.css',
        ];
        foreach ($required as $rel) {
            $path = $root . '/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
            if (is_file($path)) {
                $this->pass($group, $rel);
            } else {
                $this->fail($group, $rel, 'ไม่พบไฟล์');
            }
        }

        $html = @file_get_contents($root . '/index.html') ?: '';
        foreach (['tracking-editor.js', 'article-editor.js', 'app.js', 'api.js'] as $script) {
            if (str_contains($html, $script)) {
                $this->pass($group, "โหลด script:{$script}");
            } else {
                $this->fail($group, "โหลด script:{$script}", 'ไม่พบใน index.html');
            }
        }

        $menuRoutes = [
            'dashboard',
            'nav',
            'home',
            'banners',
            'categories',
            'plans',
            'articles',
            'testimonials',
            'leads',
            'cta',
            'footer',
            'seo',
            'tracking',
            'media',
            'users',
            'settings',
        ];
        $appJs = @file_get_contents($root . '/js/app.js') ?: '';
        foreach ($menuRoutes as $route) {
            $inMenu = preg_match("/id:\s*['\"]{$route}['\"]/", $appJs);
            $inRoutes = preg_match("/route:\s*['\"]{$route}['\"]/", $appJs);
            if ($inMenu || $inRoutes) {
                $this->pass($group, "เมนู:{$route}");
            } else {
                $this->fail($group, "เมนู:{$route}", 'ไม่พบใน app.js');
            }
        }
    }

    private function checkTrackingModule(): void
    {
        $group = 'Tracking';
        require_once dirname(__DIR__) . '/Tracking.php';
        $defaults = Tracking::defaults();
        foreach (['installMode', 'gtm', 'ga4', 'facebook', 'tiktok', 'line', 'searchConsole'] as $key) {
            if (array_key_exists($key, $defaults)) {
                $this->pass($group, "defaults:{$key}");
            } else {
                $this->fail($group, "defaults:{$key}", 'ไม่มีใน Tracking::defaults()');
            }
        }
        $sample = Tracking::normalize([
            'installMode' => 'gtm',
            'gtm' => ['enabled' => true, 'containerId' => 'GTM-TEST123'],
        ]);
        $head = Tracking::headHtml($sample);
        if (str_contains($head, 'GTM-TEST123')) {
            $this->pass($group, 'สร้าง snippet GTM');
        } else {
            $this->fail($group, 'สร้าง snippet GTM', 'headHtml ไม่มี Container ID');
        }
    }

    private function checkApiReachable(): bool
    {
        $group = 'HTTP';
        $res = $this->http('GET', '/auth/me');
        if ($res === null) {
            $this->fail($group, 'เชื่อมต่อ API', "ไม่ถึง {$this->baseUrl} — เปิด XAMPP Apache ก่อน");
            return false;
        }
        $this->pass($group, 'เชื่อมต่อ API', "HTTP {$res['code']}");
        return true;
    }

    private function checkPublicApi(): void
    {
        $group = 'API Public';
        $this->assertApi($group, 'GET', '/public/site', 200, 'โหลด snapshot เว็บ');
        $me = $this->http('GET', '/auth/me');
        $user = $me['json']['data']['user'] ?? $me['json']['user'] ?? null;
        if ($me && $me['code'] === 200 && empty($user)) {
            $this->pass($group, 'GET /auth/me (ยังไม่ login)');
        } else {
            $this->fail($group, 'GET /auth/me', $me ? 'มี session ค้างหรือรูปแบบ JSON เปลี่ยน' : 'ไม่มีการตอบกลับ');
        }
    }

    private function checkLogin(): bool
    {
        $group = 'Auth';
        if (is_file($this->cookieFile)) {
            @unlink($this->cookieFile);
        }
        $res = $this->http('POST', '/auth/login', [
            'username' => $this->username,
            'password' => $this->password,
        ]);
        if (!$res || $res['code'] !== 200 || empty($res['json']['data']['user'])) {
            $msg = $res['json']['error'] ?? "HTTP " . ($res['code'] ?? 'n/a');
            $this->fail($group, 'Login', $msg);
            return false;
        }
        $role = $res['json']['data']['user']['role'] ?? '';
        $this->pass($group, 'Login', "role={$role}");
        return true;
    }

    private function checkAuthenticatedApi(): void
    {
        $group = 'API Admin';

        $endpoints = [
            ['GET', '/dashboard/stats', 'แดชบอร์ด'],
            ['GET', '/nav', 'เมนูนำทาง'],
            ['GET', '/sections', 'หน้าแรก (sections)'],
            ['GET', '/hero-slides', 'Hero slides'],
            ['GET', '/banners', 'แบนเนอร์'],
            ['GET', '/categories', 'หมวดประกัน'],
            ['GET', '/plans', 'แผนประกัน'],
            ['GET', '/articles', 'บทความ'],
            ['GET', '/article-categories', 'หมวดบทความ'],
            ['GET', '/careers', 'อาชีพ'],
            ['GET', '/testimonials', 'รีวิว'],
            ['GET', '/leads', 'ลีด'],
            ['GET', '/contact-channels', 'ช่องทางติดต่อ'],
            ['GET', '/footer-links', 'ลิงก์ท้ายเว็บ'],
            ['GET', '/footer', 'ส่วนท้ายเว็บ'],
            ['GET', '/media', 'คลังสื่อ'],
            ['GET', '/users', 'ผู้ใช้'],
            ['GET', '/settings', 'ตั้งค่าระบบ + ติดตาม'],
        ];

        foreach ($endpoints as [$method, $path, $label]) {
            $this->assertApi($group, $method, $path, 200, $label);
        }

        foreach (['home', 'about', 'contact', 'news'] as $pageKey) {
            $this->assertApi($group, 'GET', "/seo/{$pageKey}", 200, "SEO:{$pageKey}");
        }

        $settings = $this->http('GET', '/settings');
        if ($settings && $settings['code'] === 200) {
            $data = $settings['json']['data'] ?? $settings['json'] ?? [];
            if (is_array($data) && array_key_exists('tracking', $data)) {
                $this->pass($group, 'ตั้งค่า tracking ใน /settings');
            } else {
                $this->pass($group, 'ตั้งค่า tracking ใน /settings', 'ยังไม่บันทึกใน DB — ใช้ค่า default ได้');
            }
        }

        $articles = $this->http('GET', '/articles');
        if ($articles && $articles['code'] === 200) {
            $list = $articles['json']['data'] ?? $articles['json'] ?? [];
            if (is_array($list)) {
                $this->pass($group, 'รายการบทความ', count($list) . ' รายการ');
                if ($list !== [] && isset($list[0]['id'])) {
                    $id = (int) $list[0]['id'];
                    $slug = (string) ($list[0]['slug'] ?? 'test-article');
                    $this->assertApi($group, 'GET', "/articles/{$id}", 200, 'เปิดบทความรายการเดียว');
                    $this->assertApi(
                        $group,
                        'PUT',
                        "/articles/{$id}",
                        200,
                        'บันทึกแก้ไขบทความ',
                        [
                            'title' => (string) ($list[0]['title'] ?? 'บทความทดสอบ'),
                            'slug' => $slug,
                            'body_html' => '<p>smoke test</p>',
                        ]
                    );
                }
            }
        }
    }

    private function checkBuild(): void
    {
        $group = 'Build';
        $res = $this->http('POST', '/build', []);
        if ($res && $res['code'] === 200) {
            $this->pass($group, 'POST /build', $res['json']['data']['message'] ?? 'สำเร็จ');
            $index = dirname(__DIR__, 2) . '/index.html';
            if (is_file($index)) {
                $this->pass($group, 'index.html หลัง build');
            } else {
                $this->fail($group, 'index.html หลัง build', 'ไม่พบไฟล์');
            }
        } else {
            $msg = $res['json']['error'] ?? ('HTTP ' . ($res['code'] ?? 'n/a'));
            $this->fail($group, 'POST /build', $msg);
        }
    }

    /** @param array<string,mixed>|null $body */
    private function assertApi(string $group, string $method, string $path, int $expectCode, string $label, ?array $body = null): void
    {
        $res = $this->http($method, $path, $body);
        if (!$res) {
            $this->fail($group, $label, 'ไม่มีการตอบกลับ');
            return;
        }
        if ($res['code'] === $expectCode && ($res['json']['ok'] ?? true) !== false) {
            $this->pass($group, $label, "HTTP {$res['code']}");
            return;
        }
        $err = $res['json']['error'] ?? "HTTP {$res['code']}";
        $this->fail($group, $label, (string) $err);
    }

    /** @return array{code:int,json:array<string,mixed>}|null */
    private function http(string $method, string $path, ?array $body = null): ?array
    {
        $url = $this->baseUrl . '/cms/api/index.php?path=' . rawurlencode($path);
        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }

        $headers = ['Accept: application/json'];
        if ($body !== null) {
            $headers[] = 'Content-Type: application/json';
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_COOKIEJAR => $this->cookieFile,
            CURLOPT_COOKIEFILE => $this->cookieFile,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_FOLLOWLOCATION => true,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        }

        $raw = curl_exec($ch);
        if ($raw === false) {
            curl_close($ch);
            return null;
        }
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($raw, true);
        return [
            'code' => $code,
            'json' => is_array($json) ? $json : ['ok' => false, 'error' => $raw],
        ];
    }

    private function printReport(): void
    {
        $pass = 0;
        $fail = 0;
        foreach ($this->results as $r) {
            $r['ok'] ? $pass++ : $fail++;
        }
        $total = $pass + $fail;

        echo "\n========================================\n";
        echo "สรุป: {$pass}/{$total} ผ่าน";
        if ($fail > 0) {
            echo " | {$fail} ไม่ผ่าน";
        }
        echo "\n========================================\n";

        if ($fail > 0) {
            echo "\nรายการที่ไม่ผ่าน:\n";
            foreach ($this->results as $r) {
                if (!$r['ok']) {
                    echo "  - [{$r['group']}] {$r['name']}: {$r['detail']}\n";
                }
            }
            echo "\nแก้ไขแล้วรันใหม่: php cms/tests/admin-smoke-test.php\n";
            if (!$this->withBuild) {
                echo "ทดสอบ build เพิ่ม: php cms/tests/admin-smoke-test.php --with-build\n";
            }
        } else {
            echo "\nหลังบ้านพร้อมใช้งานครบทุกส่วนที่ทดสอบ\n";
            echo "เปิด CMS: {$this->baseUrl}/admin/v2/\n";
        }
        echo "\n";
    }
}
