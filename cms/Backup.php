<?php
declare(strict_types=1);

/**
 * สำรองข้อมูลเนื้อหาจาก CMS (ฐานข้อมูล + uploads) เป็นไฟล์ ZIP
 */
final class Backup
{
    public const FORMAT = 'wealthlife-cms-backup';
    public const VERSION = 1;
    private const MAX_STORED = 30;
    private const FILENAME_PATTERN = '/^wealthlife-backup-\d{8}-\d{6}\.zip$/';

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
        'insurance_plans' => ['highlights', 'listing_sections'],
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
        self::requireZip();

        $db = cms_db();
        $counts = [];
        foreach (self::CONTENT_TABLES as $table) {
            $counts[$table] = (int) $db->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
        }

        return [
            'format' => self::FORMAT,
            'version' => self::VERSION,
            'generatedAt' => gmdate('c'),
            'siteUrl' => (string) cms_config('site_url', ''),
            'tables' => $counts,
            'uploads' => self::uploadsStats(),
            'zipSupported' => true,
            'maxStored' => self::MAX_STORED,
        ];
    }

    /** @return list<array<string,mixed>> */
    public static function listFiles(): array
    {
        $dir = self::storageDir();
        $files = [];
        foreach (glob($dir . '/wealthlife-backup-*.zip') ?: [] as $path) {
            if (!is_file($path)) {
                continue;
            }
            $name = basename($path);
            if (!self::isValidFilename($name)) {
                continue;
            }
            $mtime = filemtime($path);
            $size = filesize($path);
            $files[] = [
                'filename' => $name,
                'size' => $size === false ? 0 : (int) $size,
                'createdAt' => $mtime ? gmdate('c', $mtime) : null,
            ];
        }

        usort($files, static fn (array $a, array $b): int => strcmp((string) $b['createdAt'], (string) $a['createdAt']));
        return $files;
    }

    /** @return array<string,mixed> */
    public static function create(): array
    {
        self::requireZip();
        @set_time_limit(600);
        @ini_set('memory_limit', '512M');

        $filename = 'wealthlife-backup-' . date('Ymd-His') . '.zip';
        $target = self::storageDir() . '/' . $filename;
        if (is_file($target)) {
            throw new RuntimeException('มีไฟล์แบ็คอัพชื่อเดียวกันอยู่แล้ว กรุณาลองอีกครั้ง');
        }

        self::buildZipFile($target);
        self::pruneOldBackups();

        $mtime = filemtime($target);
        $size = filesize($target);

        return [
            'filename' => $filename,
            'size' => $size === false ? 0 : (int) $size,
            'createdAt' => $mtime ? gmdate('c', $mtime) : gmdate('c'),
            'createdBy' => Auth::user()['username'] ?? null,
        ];
    }

    public static function streamFile(string $filename): void
    {
        $path = self::resolveFilePath($filename);
        $size = filesize($path);
        if ($size === false) {
            throw new RuntimeException('อ่านขนาดไฟล์แบ็คอัพไม่ได้');
        }

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
        header('Content-Length: ' . (string) $size);
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');

        $fh = fopen($path, 'rb');
        if ($fh === false) {
            throw new RuntimeException('เปิดไฟล์แบ็คอัพไม่ได้');
        }
        fpassthru($fh);
        fclose($fh);
        exit;
    }

    public static function deleteFile(string $filename): void
    {
        $path = self::resolveFilePath($filename);
        if (!unlink($path)) {
            throw new RuntimeException('ลบไฟล์แบ็คอัพไม่สำเร็จ');
        }
    }

    /**
     * กู้คืนจากไฟล์ ZIP (รูปแบบ wealthlife-cms-backup)
     * ทับข้อมูลเนื้อหาใน DB + uploads — ไม่แตะตาราง users
     *
     * @return array{tables: array<string,int>, uploads: int, rebuilt: bool, source: string, exportedAt: string}
     */
    public static function restoreFromZip(string $zipPath, array $opts = []): array
    {
        self::requireZip();
        @set_time_limit(900);
        @ini_set('memory_limit', '512M');

        if (!is_file($zipPath)) {
            throw new RuntimeException('ไม่พบไฟล์ ZIP');
        }

        $tmp = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wli-restore-' . bin2hex(random_bytes(8));
        if (!mkdir($tmp, 0755, true) && !is_dir($tmp)) {
            throw new RuntimeException('สร้างโฟลเดอร์ชั่วคราวไม่ได้');
        }

        try {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== true) {
                throw new RuntimeException('เปิดไฟล์ ZIP ไม่ได้');
            }
            $zip->extractTo($tmp);
            $zip->close();

            $manifestPath = $tmp . '/manifest.json';
            $contentPath = $tmp . '/database/content.json';
            if (!is_file($manifestPath) || !is_file($contentPath)) {
                throw new RuntimeException('ไฟล์ ZIP ไม่ใช่รูปแบบแบ็คอัพ CMS (ขาด manifest หรือ content.json)');
            }

            $manifest = json_decode((string) file_get_contents($manifestPath), true);
            if (!is_array($manifest) || ($manifest['format'] ?? '') !== self::FORMAT) {
                throw new RuntimeException('รูปแบบแบ็คอัพไม่ถูกต้อง');
            }

            $payload = json_decode((string) file_get_contents($contentPath), true);
            if (!is_array($payload) || !is_array($payload['tables'] ?? null)) {
                throw new RuntimeException('อ่าน database/content.json ไม่ได้');
            }

            /** @var array<string, list<array<string,mixed>>> $tables */
            $tables = $payload['tables'];
            $counts = self::importDatabaseTables($tables);

            $uploadsRestored = 0;
            $uploadsSrc = $tmp . '/uploads';
            if (is_dir($uploadsSrc)) {
                $uploadsRestored = self::copyTree($uploadsSrc, cms_upload_dir());
            }

            $siteJsonSrc = $tmp . '/content/site.json';
            if (is_file($siteJsonSrc)) {
                $siteJsonDst = cms_root() . '/content/site.json';
                $dir = dirname($siteJsonDst);
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                copy($siteJsonSrc, $siteJsonDst);
            }

            $rebuilt = false;
            if (!empty($opts['rebuild'])) {
                require_once __DIR__ . '/SiteBuilder.php';
                SiteBuilder::build();
                $rebuilt = true;
            }

            return [
                'tables' => $counts,
                'uploads' => $uploadsRestored,
                'rebuilt' => $rebuilt,
                'source' => (string) ($manifest['siteUrl'] ?? basename($zipPath)),
                'exportedAt' => (string) ($manifest['generatedAt'] ?? $payload['exportedAt'] ?? ''),
            ];
        } finally {
            self::removeTree($tmp);
        }
    }

    /** คัดลอก ZIP เข้า storage/backups แล้วคืนชื่อไฟล์ */
    public static function storeUploadedZip(string $tmpUploadPath, string $originalName = ''): string
    {
        self::requireZip();
        if (!is_file($tmpUploadPath)) {
            throw new RuntimeException('ไม่พบไฟล์อัปโหลด');
        }

        $base = basename($originalName !== '' ? $originalName : 'wealthlife-backup-' . date('Ymd-His') . '.zip');
        if (!self::isValidFilename($base)) {
            $base = 'wealthlife-backup-' . date('Ymd-His') . '.zip';
        }
        $target = self::storageDir() . '/' . $base;
        if (is_file($target)) {
            $base = 'wealthlife-backup-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(2)), 0, 4) . '.zip';
            if (!preg_match(self::FILENAME_PATTERN, $base)) {
                $base = 'wealthlife-backup-' . date('Ymd-His') . '.zip';
            }
            $target = self::storageDir() . '/' . $base;
        }

        if (!@move_uploaded_file($tmpUploadPath, $target)) {
            if (!@rename($tmpUploadPath, $target) && !@copy($tmpUploadPath, $target)) {
                throw new RuntimeException('บันทึกไฟล์แบ็คอัพไม่สำเร็จ');
            }
            @unlink($tmpUploadPath);
        }

        self::pruneOldBackups();
        return $base;
    }

    /**
     * @param array<string, list<array<string,mixed>>> $tables
     * @return array<string,int>
     */
    private static function importDatabaseTables(array $tables): array
    {
        $db = cms_db();
        $counts = [];

        $db->exec('SET FOREIGN_KEY_CHECKS=0');
        try {
            foreach (array_reverse(self::CONTENT_TABLES) as $table) {
                $db->exec('DELETE FROM `' . str_replace('`', '``', $table) . '`');
            }

            foreach (self::CONTENT_TABLES as $table) {
                $rows = $tables[$table] ?? [];
                if (!is_array($rows)) {
                    $rows = [];
                }
                $counts[$table] = self::insertTableRows($db, $table, $rows);
            }
        } finally {
            $db->exec('SET FOREIGN_KEY_CHECKS=1');
        }

        return $counts;
    }

    /** @param list<array<string,mixed>> $rows */
    private static function insertTableRows(PDO $db, string $table, array $rows): int
    {
        if ($rows === []) {
            return 0;
        }

        $jsonKeys = self::JSON_COLUMNS[$table] ?? [];
        $existingCols = null;
        try {
            $existingCols = [];
            foreach ($db->query('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`') as $col) {
                $existingCols[(string) $col['Field']] = true;
            }
        } catch (Throwable $e) {
            $existingCols = null;
        }

        $inserted = 0;
        foreach ($rows as $row) {
            if (!is_array($row) || $row === []) {
                continue;
            }
            foreach ($jsonKeys as $key) {
                if (array_key_exists($key, $row) && (is_array($row[$key]) || is_object($row[$key]))) {
                    $row[$key] = json_encode($row[$key], JSON_UNESCAPED_UNICODE);
                }
            }

            $cols = array_keys($row);
            if ($existingCols !== null) {
                $cols = array_values(array_filter($cols, static fn (string $c): bool => isset($existingCols[$c])));
            }
            if ($cols === []) {
                continue;
            }

            $colSql = implode(',', array_map(
                static fn (string $c): string => '`' . str_replace('`', '``', $c) . '`',
                $cols
            ));
            $placeholders = implode(',', array_fill(0, count($cols), '?'));
            $vals = [];
            foreach ($cols as $c) {
                $vals[] = $row[$c];
            }

            $sql = 'INSERT INTO `' . str_replace('`', '``', $table) . '` (' . $colSql . ') VALUES (' . $placeholders . ')';
            $db->prepare($sql)->execute($vals);
            $inserted++;
        }

        return $inserted;
    }

    private static function copyTree(string $src, string $dst): int
    {
        if (!is_dir($dst)) {
            mkdir($dst, 0755, true);
        }
        $count = 0;
        $base = rtrim(str_replace('\\', '/', $src), '/');
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($src, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            $path = str_replace('\\', '/', $file->getPathname());
            $rel = substr($path, strlen($base) + 1);
            if ($rel === '' || $rel === '.gitkeep') {
                continue;
            }
            $target = rtrim($dst, '/\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);
            if ($file->isDir()) {
                if (!is_dir($target)) {
                    mkdir($target, 0755, true);
                }
                continue;
            }
            $parent = dirname($target);
            if (!is_dir($parent)) {
                mkdir($parent, 0755, true);
            }
            if (copy($path, $target)) {
                $count++;
            }
        }
        return $count;
    }

    private static function removeTree(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            $path = $file->getPathname();
            if ($file->isDir()) {
                @rmdir($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    private static function buildZipFile(string $targetPath): void
    {
        $zip = new ZipArchive();
        if ($zip->open($targetPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('ไม่สามารถสร้างไฟล์แบ็คอัพได้');
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
            if (!$zip->close()) {
                throw new RuntimeException('บันทึกไฟล์แบ็คอัพไม่สำเร็จ');
            }
        } catch (Throwable $e) {
            $zip->close();
            @unlink($targetPath);
            throw $e;
        }

        if (!is_file($targetPath) || filesize($targetPath) === 0) {
            @unlink($targetPath);
            throw new RuntimeException('สร้างไฟล์แบ็คอัพไม่สำเร็จ');
        }
    }

    private static function pruneOldBackups(): void
    {
        $files = self::listFiles();
        if (count($files) <= self::MAX_STORED) {
            return;
        }
        $toRemove = array_slice($files, self::MAX_STORED);
        foreach ($toRemove as $file) {
            $path = self::storageDir() . '/' . $file['filename'];
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    private static function resolveFilePath(string $filename): string
    {
        $filename = basename($filename);
        if (!self::isValidFilename($filename)) {
            throw new InvalidArgumentException('ชื่อไฟล์แบ็คอัพไม่ถูกต้อง');
        }
        $path = self::storageDir() . '/' . $filename;
        if (!is_file($path)) {
            throw new RuntimeException('ไม่พบไฟล์แบ็คอัพ');
        }
        return $path;
    }

    private static function isValidFilename(string $filename): bool
    {
        return (bool) preg_match(self::FILENAME_PATTERN, $filename);
    }

    private static function requireZip(): void
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('เซิร์ฟเวอร์ไม่รองรับ ZipArchive — เปิด extension zip ใน PHP');
        }
    }

    /** @return array<string,mixed> */
    private static function buildManifest(): array
    {
        $info = self::info();

        return array_merge($info, [
            'phpVersion' => PHP_VERSION,
            'createdBy' => Auth::user()['username'] ?? null,
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
