<?php
declare(strict_types=1);

/**
 * Seed page_sections สำหรับหน้าแบบประกัน (life / health / savings)
 * รันเดี่ยว: /cms/seed-insurance-page-sections.php
 * หรือเรียกจาก fix-page-sections.php
 */
function seedInsurancePageSections(PDO $db, bool $echo = true): int
{
    $jsonPath = __DIR__ . '/data/insurance-page-sections.json';
    if (!is_file($jsonPath)) {
        throw new RuntimeException('Missing data file: cms/data/insurance-page-sections.json');
    }
    $raw = json_decode((string) file_get_contents($jsonPath), true);
    if (!is_array($raw)) {
        throw new RuntimeException('Invalid JSON in insurance-page-sections.json');
    }

    $sectionTitles = [
        'hero' => 'ส่วนหัวหน้าแบบประกัน',
        'whoFor' => 'ส่วนเหมาะกับใคร',
        'planCards' => 'ส่วนรายละเอียดแบบประกัน',
        'recommendation' => 'ส่วนข้อความแนะนำ',
        'cta' => 'ส่วน Call to Action',
        'bottomBanners' => 'ส่วน Banner ด้านล่าง',
    ];
    $sectionOrder = array_keys($sectionTitles);

    $stmt = $db->prepare(
        'INSERT INTO page_sections (page_key, section_key, title, is_active, sort_order, config)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           sort_order = VALUES(sort_order),
           config = IF(CHAR_LENGTH(config) < 3, VALUES(config), config)'
    );

    $count = 0;
    foreach ($raw as $pageKey => $sections) {
        if (!is_array($sections)) {
            continue;
        }
        foreach ($sectionOrder as $i => $sectionKey) {
            if (!isset($sections[$sectionKey]) || !is_array($sections[$sectionKey])) {
                continue;
            }
            $stmt->execute([
                $pageKey,
                $sectionKey,
                $sectionTitles[$sectionKey],
                1,
                $i,
                json_encode($sections[$sectionKey], JSON_UNESCAPED_UNICODE),
            ]);
            $count++;
            if ($echo) {
                echo "OK {$pageKey}/{$sectionKey}\n";
            }
        }
    }

    return $count;
}

if (PHP_SAPI === 'cli' || (isset($_SERVER['SCRIPT_FILENAME']) && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME']))) {
    require __DIR__ . '/bootstrap.php';
    header('Content-Type: text/plain; charset=utf-8');
    try {
        $n = seedInsurancePageSections(cms_db());
        require __DIR__ . '/SiteBuilder.php';
        $result = SiteBuilder::build();
        echo "\nSeeded {$n} sections. Build: {$result['count']} files\n";
    } catch (Throwable $e) {
        http_response_code(500);
        echo 'Error: ' . $e->getMessage() . "\n";
    }
}
