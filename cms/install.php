<?php
declare(strict_types=1);

/**
 * ติดตั้งฐานข้อมูล CMS
 * php cms/install.php
 */

$secretsPath = __DIR__ . '/config.secrets.php';
if (!is_file($secretsPath)) {
    copy(__DIR__ . '/config.secrets.example.php', $secretsPath);
    echo "สร้าง cms/config.secrets.php แล้ว — แก้ค่า DB ถ้าจำเป็น\n";
}

require __DIR__ . '/bootstrap.php';

$schema = file_get_contents(dirname(__DIR__) . '/database/schema.sql');
if ($schema === false) {
    fwrite(STDERR, "ไม่พบ database/schema.sql\n");
    exit(1);
}

$host = cms_config('db.host');
$port = cms_config('db.port');
$user = cms_config('db.user');
$pass = cms_config('db.pass');
$name = cms_config('db.name');

$pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

foreach (array_filter(array_map('trim', explode(';', $schema))) as $sql) {
    if ($sql === '') {
        continue;
    }
    $pdo->exec($sql);
}

$db = cms_db();

$exists = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
if ((int) $exists === 0) {
    $hash = password_hash('wealthlife2026', PASSWORD_DEFAULT);
    $stmt = $db->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)');
    $stmt->execute(['admin', 'admin@wealthlifeinsure.local', $hash, 'super_admin']);
    echo "สร้างผู้ใช้ admin / wealthlife2026\n";
}

echo "ติดตั้งฐานข้อมูลเรียบร้อย\n";
echo "ขั้นถัดไป: php cms/migrate-from-site.php\n";
