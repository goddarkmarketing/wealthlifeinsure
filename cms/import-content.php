<?php
declare(strict_types=1);

/**
 * นำเข้าข้อมูลจาก content/site.json บนโฮสต์ (ครั้งแรกหลังติดตั้ง DB)
 * ต้อง login admin ก่อน แล้วเปิดหน้านี้
 */
header('Content-Type: text/html; charset=utf-8');

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/migrate-from-site.php';

Auth::startSession();
$user = Auth::user();
if (!$user || !in_array($user['role'], ['super_admin', 'admin'], true)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>Import</title></head><body>';
    echo '<p>กรุณา <a href="/admin/v2/">เข้าสู่ระบบหลังบ้าน</a> ก่อน แล้วเปิดหน้านี้อีกครั้ง</p>';
    echo '</body></html>';
    exit;
}

$done = false;
$error = null;
$log = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    ob_start();
    try {
        if (!empty($_POST['reset'])) {
            $db = cms_db();
            $db->exec('SET FOREIGN_KEY_CHECKS = 0');
            foreach (['activity_log', 'leads', 'articles', 'careers', 'insurance_plans', 'testimonials', 'banners', 'home_hero_slides', 'page_sections', 'nav_items', 'footer_links', 'contact_channels', 'seo_meta', 'settings'] as $table) {
                $db->exec("DELETE FROM {$table}");
            }
            $db->exec('SET FOREIGN_KEY_CHECKS = 1');
            echo "  ล้างข้อมูลเก่าแล้ว\n";
        }
        cms_migrate_from_site(true);
        $log = ob_get_clean();
        $done = true;
    } catch (Throwable $e) {
        $log = ob_get_clean();
        $error = $e->getMessage();
    }
}

$articleCount = (int) cms_db()->query('SELECT COUNT(*) FROM articles')->fetchColumn();
$planCount = (int) cms_db()->query('SELECT COUNT(*) FROM insurance_plans')->fetchColumn();

?>
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>นำเข้าข้อมูล CMS</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    .ok { color: #166534; background: #dcfce7; padding: 1rem; border-radius: 8px; }
    .err { color: #991b1b; background: #fee2e2; padding: 1rem; border-radius: 8px; }
    pre { background: #f1f5f9; padding: 1rem; overflow: auto; font-size: 13px; }
    button { background: #2563eb; color: #fff; border: 0; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 1rem; cursor: pointer; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>นำเข้าข้อมูลจาก site.json</h1>
  <p>ฐานข้อมูลตอนนี้: บทความ <strong><?= $articleCount ?></strong> · แผนประกัน <strong><?= $planCount ?></strong></p>

  <?php if ($done): ?>
    <div class="ok">
      <p><strong>นำเข้าสำเร็จ</strong></p>
      <p><a href="/admin/v2/">กลับแดชบอร์ด</a> — ตรวจข้อมูลในเมนูต่างๆ แล้วแก้ไข/บันทึกตามต้องการ</p>
    </div>
    <?php if ($log !== ''): ?><pre><?= htmlspecialchars($log) ?></pre><?php endif; ?>
  <?php elseif ($error): ?>
    <div class="err"><p><?= htmlspecialchars($error) ?></p></div>
    <?php if ($log !== ''): ?><pre><?= htmlspecialchars($log) ?></pre><?php endif; ?>
    <form method="post"><button type="submit">ลองอีกครั้ง</button></form>
  <?php else: ?>
    <p>ใช้เมื่อหลังบ้านว่าง (เช่นหลัง import schema บน Plesk) — จะดึงข้อมูลจาก <code>content/site.json</code> และ <code>index.html</code> เข้า DB</p>
    <form method="post">
      <?php if ($articleCount > 0 || $planCount > 0): ?>
        <p><label><input type="checkbox" name="reset" value="1"> ลบข้อมูลเก่าในตารางเนื้อหาก่อนนำเข้า (ใช้ถ้า import ค้าง/error)</label></p>
      <?php endif; ?>
      <button type="submit">เริ่มนำเข้าข้อมูล</button>
    </form>
    <p><a href="/admin/v2/">กลับแดชบอร์ด</a></p>
  <?php endif; ?>
</body>
</html>
