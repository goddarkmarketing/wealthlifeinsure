<?php
declare(strict_types=1);

/**
 * ลบบทความ/อาชีพซ้ำ (slug แบบ foo-1, foo-2) บนโฮสต์
 * เปิดหลัง login admin: /cms/fix-duplicate-content-web.php
 */
header('Content-Type: text/html; charset=utf-8');

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/fix-duplicate-content.php';

Auth::startSession();
$user = Auth::user();
if (!$user || !in_array($user['role'], ['super_admin', 'admin'], true)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>Fix duplicates</title></head><body>';
    echo '<p>กรุณา <a href="/admin/v2/">เข้าสู่ระบบหลังบ้าน</a> ก่อน</p></body></html>';
    exit;
}

$done = false;
$error = null;
$log = '';

$db = cms_db();
$dupArticles = count(duplicate_suffix_slugs($db, 'articles'));
$dupCareers = count(duplicate_suffix_slugs($db, 'careers'));

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    try {
        $result = cms_fix_duplicate_content();
        $log = "ลบบทความ: " . count($result['articles']) . " รายการ\n"
            . "ลบอาชีพ: " . count($result['careers']) . " รายการ\n"
            . "ลบไฟล์ articles: {$result['filesArticles']}\n"
            . "ลบไฟล์ careers: {$result['filesCareers']}\n"
            . "Build: {$result['buildCount']} ไฟล์";
        $done = true;
        $dupArticles = 0;
        $dupCareers = 0;
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

?>
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>ลบรายการซ้ำ</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    .ok { color: #166534; background: #dcfce7; padding: 1rem; border-radius: 8px; }
    .err { color: #991b1b; background: #fee2e2; padding: 1rem; border-radius: 8px; }
    .warn { background: #fef3c7; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
    pre { background: #f1f5f9; padding: 1rem; overflow: auto; font-size: 13px; white-space: pre-wrap; }
    button { background: #2563eb; color: #fff; border: 0; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 1rem; cursor: pointer; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>ลบบทความ / อาชีพซ้ำ</h1>
  <p>ลบรายการที่ slug ลงท้าย <code>-1</code>, <code>-2</code> เมื่อมีรายการหลักอยู่แล้ว (เช่น <code>team-support-1</code> เมื่อมี <code>team-support</code>)</p>

  <div class="warn">
    <p>พบรายการซ้ำ: บทความ <strong><?= $dupArticles ?></strong> · อาชีพ <strong><?= $dupCareers ?></strong></p>
    <p><strong>อย่า</strong>เปิด <code>/cms/import-content.php</code> ซ้ำหลังลูกค้าเพิ่มข้อมูลแล้ว</p>
  </div>

  <?php if ($done): ?>
    <div class="ok">
      <p><strong>ลบรายการซ้ำและ build หน้าเว็บแล้ว</strong></p>
      <p><a href="/admin/v2/#articles">กลับแดชบอร์ด</a></p>
    </div>
    <?php if ($log !== ''): ?><pre><?= htmlspecialchars($log) ?></pre><?php endif; ?>
  <?php elseif ($error): ?>
    <div class="err"><p><?= htmlspecialchars($error) ?></p></div>
    <form method="post"><button type="submit">ลองอีกครั้ง</button></form>
  <?php else: ?>
    <form method="post">
      <button type="submit">ลบรายการซ้ำและอัปเดตหน้าเว็บ</button>
    </form>
    <p><a href="/admin/v2/">กลับแดชบอร์ด</a></p>
  <?php endif; ?>
</body>
</html>
