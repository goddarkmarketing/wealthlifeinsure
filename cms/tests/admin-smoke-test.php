#!/usr/bin/env php
<?php
declare(strict_types=1);

/**
 * รันทดสอบ smoke หลังบ้าน CMS
 *
 *   php cms/tests/admin-smoke-test.php
 *   php cms/tests/admin-smoke-test.php --with-build
 *   php cms/tests/admin-smoke-test.php --url=http://127.0.0.1/wealthlifeinsure.com --user=admin --pass=secret
 */

require __DIR__ . '/AdminSmokeTest.php';

$opts = getopt('', ['url:', 'user:', 'pass:', 'with-build', 'help']);

if (isset($opts['help'])) {
    echo <<<HELP
Wealth Life Insure — Admin Smoke Test

  php cms/tests/admin-smoke-test.php [options]

Options:
  --url=URL       Base URL ของเว็บ (default จาก cms/config.php)
  --user=NAME     ชื่อผู้ใช้ CMS (default: admin)
  --pass=PASS     รหัสผ่าน (default: wealthlife2026)
  --with-build    ทดสอบ «สร้างหน้าเว็บจาก DB» ด้วย (ใช้เวลานานขึ้น)
  --help          แสดงวิธีใช้

ต้องเปิด XAMPP: Apache + MySQL ก่อนรัน

HELP;
    exit(0);
}

$baseUrl = $opts['url'] ?? null;
if ($baseUrl === null) {
    $configPath = dirname(__DIR__) . '/config.php';
    if (is_file($configPath)) {
        /** @var array<string,mixed> $cfg */
        $cfg = require $configPath;
        $baseUrl = (string) ($cfg['site_url'] ?? 'http://localhost/wealthlifeinsure.com');
    } else {
        $baseUrl = 'http://localhost/wealthlifeinsure.com';
    }
}

$username = (string) ($opts['user'] ?? 'admin');
$password = (string) ($opts['pass'] ?? 'wealthlife2026');
$withBuild = array_key_exists('with-build', $opts);

if (!extension_loaded('curl')) {
    fwrite(STDERR, "ต้องเปิด PHP extension curl\n");
    exit(1);
}

echo "Wealth Life Insure — Admin Smoke Test\n";
echo "URL: {$baseUrl}\n";
echo "User: {$username}\n";

$test = new AdminSmokeTest($baseUrl, $username, $password, $withBuild);
exit($test->run());
