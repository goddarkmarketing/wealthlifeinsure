<?php
declare(strict_types=1);

/**
 * กู้คืนข้อมูลจาก ZIP แบ็คอัพของเว็บจริง → ลงเครื่อง local
 * ใช้เมื่อต้องการตรวจเนื้อหาให้ตรงกับลูกค้าก่อนแก้โค้ด
 *
 * เปิด: http://localhost/wealthlifeinsure.com/cms/restore-backup-web.php
 * (ต้อง login admin ก่อน)
 */
header('Content-Type: text/html; charset=utf-8');

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Backup.php';

Auth::startSession();
$user = Auth::user();
if (!$user || !in_array($user['role'], ['super_admin', 'admin'], true)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>กู้คืนแบ็คอัพ</title></head><body>';
    echo '<p>กรุณา <a href="/admin/v2/">เข้าสู่ระบบหลังบ้าน</a> ก่อน แล้วเปิดหน้านี้อีกครั้ง</p>';
    echo '</body></html>';
    exit;
}

$result = null;
$error = null;
$localFiles = [];
try {
    $localFiles = Backup::listFiles();
} catch (Throwable $e) {
    $localFiles = [];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    try {
        $rebuild = !empty($_POST['rebuild']);
        $zipPath = '';

        if (!empty($_FILES['backup_zip']['tmp_name']) && is_uploaded_file($_FILES['backup_zip']['tmp_name'])) {
            $stored = Backup::storeUploadedZip(
                (string) $_FILES['backup_zip']['tmp_name'],
                (string) ($_FILES['backup_zip']['name'] ?? '')
            );
            $zipPath = Backup::storageDir() . '/' . $stored;
        } elseif (!empty($_POST['existing_file'])) {
            $name = basename((string) $_POST['existing_file']);
            $zipPath = Backup::storageDir() . '/' . $name;
            if (!is_file($zipPath)) {
                throw new RuntimeException('ไม่พบไฟล์แบ็คอัพที่เลือก');
            }
        } else {
            throw new RuntimeException('กรุณาอัปโหลด ZIP หรือเลือกไฟล์ที่มีอยู่');
        }

        $result = Backup::restoreFromZip($zipPath, ['rebuild' => $rebuild]);
        $localFiles = Backup::listFiles();
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$h = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>กู้คืนแบ็คอัพจากเว็บลูกค้า → Local</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #0f172a; }
    .ok { color: #166534; background: #dcfce7; padding: 1rem; border-radius: 8px; }
    .err { color: #991b1b; background: #fee2e2; padding: 1rem; border-radius: 8px; }
    .warn { background: #fef3c7; color: #92400e; padding: 0.85rem 1rem; border-radius: 8px; }
    .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.15rem; margin: 1rem 0; }
    button { background: #2563eb; color: #fff; border: 0; padding: 0.7rem 1.2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    pre { background: #f1f5f9; padding: 1rem; overflow: auto; font-size: 13px; border-radius: 8px; }
    ol { padding-left: 1.25rem; }
    a { color: #2563eb; }
    label { display: block; margin: 0.65rem 0 0.25rem; font-weight: 600; }
    select, input[type=file] { width: 100%; max-width: 100%; }
  </style>
</head>
<body>
  <h1>กู้คืนข้อมูลจากเว็บลูกค้า → Local</h1>
  <p>ดึงเนื้อหาล่าสุด (DB + รูป uploads) จากไฟล์แบ็คอัพของ production มาไว้ที่เครื่องนี้ เพื่อตรวจความถูกต้องก่อนแก้โค้ด</p>

  <div class="warn">
    <strong>คำเตือน:</strong> การกู้คืนจะ<strong>ทับข้อมูลเนื้อหาใน local</strong> (บทความ แผน บิวเดอร์ ลีด ฯลฯ)
    แต่<strong>ไม่แตะบัญชีผู้ใช้</strong> — ใช้เฉพาะบนเครื่องพัฒนาเท่านั้น
  </div>

  <div class="box">
    <h2 style="margin-top:0;font-size:1.05rem">ขั้นตอนบนเว็บจริง (production)</h2>
    <ol>
      <li>เข้า <code>https://www.wealthlifeinsure.com/admin/v2/#backup</code></li>
      <li>กด <strong>สร้างแบ็คอัพ</strong></li>
      <li>กด <strong>ดาวน์โหลด</strong> ได้ไฟล์ <code>wealthlife-backup-YYYYMMDD-HHMMSS.zip</code></li>
    </ol>
  </div>

  <?php if ($result): ?>
    <div class="ok">
      <p><strong>กู้คืนสำเร็จ</strong> จาก <?= $h((string) $result['source']) ?></p>
      <p>วันที่แบ็คอัพ: <?= $h((string) ($result['exportedAt'] ?: '—')) ?></p>
      <p>ไฟล์ uploads ที่คัดลอก: <?= (int) $result['uploads'] ?> ไฟล์</p>
      <p>สร้างหน้าเว็บใหม่: <?= !empty($result['rebuilt']) ? 'ใช่' : 'ยังไม่สร้าง — กด Publish จาก admin หรือติ๊กตัวเลือกด้านล่างแล้วรันอีกครั้ง' ?></p>
      <p>
        <a href="/admin/v2/">เปิดหลังบ้าน local</a> ·
        <a href="/index.html">ดูหน้าแรก</a>
      </p>
    </div>
    <pre><?= $h(json_encode($result['tables'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) ?: '') ?></pre>
  <?php elseif ($error): ?>
    <div class="err"><p><?= $h($error) ?></p></div>
  <?php endif; ?>

  <form method="post" enctype="multipart/form-data" class="box" onsubmit="return confirm('ทับข้อมูล local ด้วยแบ็คอัพนี้?\n\nแนะนำใช้เฉพาะบนเครื่องพัฒนา');">
    <h2 style="margin-top:0;font-size:1.05rem">กู้คืนบนเครื่องนี้</h2>

    <label for="backup_zip">อัปโหลดไฟล์ ZIP จากเว็บจริง</label>
    <input id="backup_zip" type="file" name="backup_zip" accept=".zip,application/zip">

    <?php if ($localFiles !== []): ?>
      <label for="existing_file">หรือเลือกไฟล์ที่มีใน local แล้ว</label>
      <select id="existing_file" name="existing_file">
        <option value="">— ไม่เลือก —</option>
        <?php foreach ($localFiles as $f): ?>
          <option value="<?= $h((string) $f['filename']) ?>"><?= $h((string) $f['filename']) ?></option>
        <?php endforeach; ?>
      </select>
    <?php endif; ?>

    <p style="margin-top:1rem">
      <label style="font-weight:500">
        <input type="checkbox" name="rebuild" value="1" checked>
        สร้างหน้าเว็บ HTML ใหม่หลังกู้คืน (แนะนำ)
      </label>
    </p>

    <p><button type="submit">กู้คืนลง Local</button></p>
  </form>

  <p><a href="/admin/v2/#backup">← กลับเมนูสำรองข้อมูล</a></p>
</body>
</html>
