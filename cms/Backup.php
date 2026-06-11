<?php
declare(strict_types=1);

/**
 * สำรองข้อมูลเนื้อหาจาก CMS (ฐานข้อมูล + uploads) เป็นไฟล์ ZIP
 */
final class Backup
{
    public const FORMAT = 'wealthlife-cms-backup';
    public const VERSION = 1;

    /** @var list<string> */
    private const CONTENT_TABLES = [
        'settings',
        'nav_items',
        'page_sections',
        'home_hero_slides',
        'banners',
        'insurance_categories',
        'insurance_plans',
        'article_categories',
        'articles',
        'careers',
        'testimonials',
        'leads',
        'contact_channels',
        'footer_links',
        'seo_meta',
        'media',
    ];

    /** @var array<string, list<string>> */
    private const JSON_COLUMNS = [
        'settings' => ['setting_value'],
        'page_sections' => ['config'],
        'insurance_plans' => ['highlights'],
    ];

    public static function storageDir(): string
    {
        $dir = __DIR__ . '/storage/backups';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    /** @return array<string,mixed> */
    public static function info(): array
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('เซิร์ฟเวอร์ไม่รองรับ ZipArchive — เปิด extension zip ใน PHP');
        }

        $db = cms_db();
        $counts = [];
        foreach (self::CONTENT_TABLES as $table) {
            $counts[$table] = (int) $db->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
        }

        $uploads = self::uploadsStats();

        return [
            'format' => self::FORMAT,
            'version' => self::VERSION,
            'generatedAt' => gmdate('c'),
            'siteUrl' => (string) cms_config('site_url', ''),
            'tables' => $counts,
            'uploads' => $uploads,
            'zipSupported' => true,
            'includes' => [
                'database/content.json' => 'ข้อมูลเนื้อหาทั้งหมดจากฐานข้อมูล (บทความ แผนประกัน หน้าแรก ตัวแทน ฯลฯ)',
                'uploads/' => 'รูปภาพและไฟล์ที่อัปโหลดจากหลังบ้าน',
                'content/site.json' => 'ไฟล์สำรอง JSON (ถ้ามี)',
                'manifest.json' => 'สรุปรายการในแบ็คอัพ',
                'README.txt' => 'วิธีใช้งานไฟล์แบ็คอัพ',
            ],
            'excludes' => [
                'users' => 'บัญชีผู้ใช้และรหัสผ่าน (ความปลอดภัย)',
                'activity_log' => 'บันทึกกิจกรรมระบบ',
            ],
        ];
    }

    public static function streamDownloadZip(): void
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('เซิร์ฟเวอร์ไม่รองรับ ZipArchive — เปิด extension zip ใน PHP');
        }

        @set_time_limit(600);
        @ini_set('memory_limit', '512M');

        $stamp = date('Ymd-His');
        $filename = "wealthlife-backup-{$stamp}.zip";
        $tmpPath = self::storageDir() . '/tmp-' . bin2hex(random_bytes(8)) . '.zip';

        $zip = new ZipArchive();
        if ($zip->open($tmpPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('ไม่สามารถสร้างไฟล์แบ็คอัพชั่วคราวได้');
        }

        try {
            $manifest = self::buildManifest();
            $content = self::exportDatabasePayload();

            $zip->addFromString('manifest.json', self::encodeJson($manifest));
            $zip->addFromString('database/content.json', self::encodeJson($content));
            $zip->addFromString('README.txt', self::readmeText());

            $siteJson = cms_root() . '/content/site.json';
            if (is_file($siteJson)) {
                $zip->addFile($siteJson, 'content/site.json');
            }

            self::addUploadsToZip($zip, 'uploads');
            $zip->close();
        } catch (Throwable $e) {
            $zip->close();
            @unlink($tmpPath);
            throw $e;
        }

        if (!is_file($tmpPath)) {
            throw new RuntimeException('สร้างไฟล์แบ็คอัพไม่สำเร็จ');
        }

        $size = filesize($tmpPath);
        if ($size === false) {
            @unlink($tmpPath);
            throw new RuntimeException('อ่านขนาดไฟล์แบ็คอัพไม่ได้');
        }

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . (string) $size);
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');

        $fh = fopen($tmpPath, 'rb');
        if ($fh === false) {
            @unlink($tmpPath);
            throw new RuntimeException('เปิดไฟล์แบ็คอัพไม่ได้');
        }
        fpassthru($fh);
        fclose($fh);
        @unlink($tmpPath);
        exit;
    }

    /** @return array<string,mixed> */
    private static function buildManifest(): array
    {
        $info = self::info();
        unset($info['zipSupported'], $info['includes'], $info['excludes']);

        return array_merge($info, [
            'phpVersion' => PHP_VERSION,
            'createdBy' => (Auth::user()['username'] ?? null),
        ]);
    }

    /** @return array<string,mixed> */
    private static function exportDatabasePayload(): array
    {
        $db = cms_db();
        $tables = [];

        foreach (self::CONTENT_TABLES as $table) {
            $rows = $db->query("SELECT * FROM {$table}")->fetchAll();
            $jsonKeys = self::JSON_COLUMNS[$table] ?? [];
            foreach ($rows as $i => $row) {
                foreach ($jsonKeys as $key) {
                    if (!isset($row[$key]) || !is_string($row[$key])) {
                        continue;
                    }
                    $decoded = json_decode($row[$key], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $rows[$i][$key] = $decoded;
                    }
                }
            }
            $tables[$table] = $rows;
        }

        return [
            'format' => self::FORMAT,
            'version' => self::VERSION,
            'exportedAt' => gmdate('c'),
            'tables' => $tables,
        ];
    }

    private static function addUploadsToZip(ZipArchive $zip, string $zipPrefix): void
    {
        $dir = cms_upload_dir();
        if (!is_dir($dir)) {
            return;
        }

        $base = rtrim(str_replace('\\', '/', $dir), '/');
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            $path = str_replace('\\', '/', $file->getPathname());
            $rel = substr($path, strlen($base) + 1);
            if ($rel === '' || $rel === '.gitkeep') {
                continue;
            }
            $local = $zipPrefix . '/' . $rel;
            if ($file->isDir()) {
                $zip->addEmptyDir($local);
                continue;
            }
            $zip->addFile($path, $local);
        }
    }

    /** @return array{fileCount:int,bytes:int} */
    private static function uploadsStats(): array
    {
        $dir = cms_upload_dir();
        if (!is_dir($dir)) {
            return ['fileCount' => 0, 'bytes' => 0];
        }

        $fileCount = 0;
        $bytes = 0;
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            if (!$file->isFile() || $file->getFilename() === '.gitkeep') {
                continue;
            }
            $fileCount++;
            $bytes += (int) $file->getSize();
        }

        return ['fileCount' => $fileCount, 'bytes' => $bytes];
    }

    private static function encodeJson(mixed $data): string
    {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        if ($json === false) {
            throw new RuntimeException('แปลงข้อมูลเป็น JSON ไม่สำเร็จ');
        }
        return $json;
    }

    private static function readmeText(): string
    {
        $site = (string) cms_config('site_url', 'wealthlifeinsure.com');
        $format = self::FORMAT;
        $version = (string) self::VERSION;

        return <<<TXT
Wealth Life Insure — ไฟล์สำรองข้อมูล CMS
========================================

สร้างจาก: {$site}
รูปแบบ: {$format} v{$version}

สิ่งที่อยู่ในไฟล์นี้
--------------------
- database/content.json  ข้อมูลเนื้อหา (บทความ อาชีพ แผนประกัน หน้าแรก ตัวแทน ลีด ฯลฯ)
- uploads/               รูปภาพและไฟล์ที่อัปโหลดจากหลังบ้าน
- content/site.json      ไฟล์ JSON สำรอง (ถ้ามี)
- manifest.json          สรุปจำนวนรายการและวันที่สำรอง

สิ่งที่ไม่ได้รวม (เพื่อความปลอดภัย)
------------------------------------
- บัญชีผู้ใช้และรหัสผ่าน
- บันทึกกิจกรรมระบบ

วิธีเก็บรักษา
-------------
- เก็บไฟล์ ZIP ไว้ในที่ปลอดภัย (Google Drive, คอมพิวเตอร์สำรอง)
- แนะนำสำรองอย่างน้อยสัปดาห์ละครั้ง หรือก่อนอัปเดตโค้ดจาก Git

หมายเหตุ: การกู้คืนข้อมูลต้องทำโดยผู้ดูแลระบบ — ติดต่อทีมพัฒนาหากต้องการนำเข้ากลับ

TXT;
    }
}
