<?php
declare(strict_types=1);

/**
 * คืนค่า page_sections หน้าย่อย + สร้าง HTML ใหม่ (รันครั้งเดียวหลัง deploy)
 * เปิด: /cms/fix-page-sections.php
 */
require __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$fixes = [
    ['about', 'hero', [
        'eyebrow' => 'Thai Life Insurance Bangna',
        'h1' => 'ทีมงาน FSEG Wealth ตัวแทนไทยประกันชีวิต',
        'lead' => 'Wealth Life Insure ดูแลโดยทีมผู้บริหารศูนย์และผู้บริหารหน่วยไทยประกันชีวิต สาขาบางนา ให้คำแนะนำทั้งประกันชีวิต สุขภาพ ออมทรัพย์ มรดก และลดหย่อนภาษี',
    ], 'ส่วนหัว เกี่ยวกับเรา', 0],
    ['about', 'followup', [
        'text' => 'เราคือทีมงานตัวแทนไทยประกันชีวิต คนรุ่นใหม่ที่โดดเด่นด้านเทคโนโลยีและเชี่ยวชาญการวางแผนการเงิน เพื่อช่วยให้ลูกค้าบรรลุเป้าหมายทางการเงิน และสร้างที่ปรึกษามืออาชีพมาตรฐานระดับสากล คุณวุฒิ MDRT — ฟังก่อน แนะนำทีหลัง และช่วยดูแลเรื่องเอกสารและเคลมหลังทำกรมธรรม์',
    ], 'ข้อความใต้สไลด์', 1],
    ['about', 'agent', [
        'eyebrow' => 'ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา',
        'h2' => 'คุณ จักรี น้อยดอนไพร (แต้ม)',
        'photo' => 'assets/profile/1c19a9f2-c428-4cec-bbd2-59b6e4993178.png',
        'lead' => 'สวัสดีครับ ผมแต้ม ผู้บริหารศูนย์ไทยประกันชีวิต สาขาบางนา ให้คำปรึกษาประกันชีวิต สุขภาพ การออม มรดก และลดหย่อนภาษี โดยเริ่มจากฟังเป้าหมายและงบประมาณจริงของคุณก่อน แล้วค่อยช่วยจัดลำดับแผนที่เหมาะ',
        'license' => '6701031779',
    ], 'โปรไฟล์ตัวแทน', 2],
    ['insurance', 'hero', [
        'eyebrow' => 'Thai Life Insurance plans',
        'h1' => 'แบบประกันแนะนำจากไทยประกันชีวิต',
        'copy' => 'รวมแผนที่ตอบโจทย์ทั้งความคุ้มครองชีวิต สุขภาพ ค่ารักษา เงินออม มรดก และสิทธิลดหย่อนภาษี โดยทีมงานช่วยอธิบายเงื่อนไขให้เข้าใจง่ายก่อนตัดสินใจ',
    ], 'ส่วนหัว แบบประกัน', 0],
    ['insurance', 'listingHeading', [
        'eyebrow' => 'แบบประกันแนะนำ',
        'h2' => 'แผนหลักจากข้อมูลแบบประกันที่เหมาะกับหลายช่วงชีวิต',
        'lead' => '',
    ], 'หัวข้อรายการแผน', 1],
];

$db = cms_db();
$stmt = $db->prepare(
    'INSERT INTO page_sections (page_key, section_key, title, is_active, sort_order, config)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), is_active=1, sort_order=VALUES(sort_order), config=VALUES(config)'
);

foreach ($fixes as [$page, $section, $config, $title, $order]) {
    $stmt->execute([
        $page,
        $section,
        $title,
        1,
        $order,
        json_encode($config, JSON_UNESCAPED_UNICODE),
    ]);
    echo "OK {$page}/{$section}\n";
}

require __DIR__ . '/SiteBuilder.php';
$result = SiteBuilder::build();
echo "\nBuild complete: {$result['count']} files\n";
