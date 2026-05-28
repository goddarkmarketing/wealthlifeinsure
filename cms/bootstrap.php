<?php
declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    throw new RuntimeException('สร้าง cms/config.php จาก cms/config.example.php');
}

/** @var array<string,mixed> $CMS_CONFIG */
$CMS_CONFIG = require $configPath;

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Auth.php';

function cms_config(string $key, mixed $default = null): mixed
{
    global $CMS_CONFIG;
    $parts = explode('.', $key);
    $val = $CMS_CONFIG;
    foreach ($parts as $p) {
        if (!is_array($val) || !array_key_exists($p, $val)) {
            return $default;
        }
        $val = $val[$p];
    }
    return $val;
}

function cms_db(): PDO
{
    return Database::connection();
}

function cms_json(array $data, int $code = 200): void
{
    Http::json($data, $code);
}

function cms_require_auth(): array
{
    return Auth::requireUser();
}

function cms_root(): string
{
    return (string) cms_config('site_root', dirname(__DIR__));
}

function cms_upload_dir(): string
{
    $dir = (string) cms_config('upload_dir', cms_root() . '/uploads');
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return $dir;
}
