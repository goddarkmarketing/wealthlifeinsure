<?php
declare(strict_types=1);

/**
 * หน้าค้นหาแบบประกันด้วยตัวเอง — config + จับคู่แผน
 */
final class PlanFinder
{
    public const PAGE_KEY = 'findPlan';

    /** @return array<string,mixed> */
    public static function defaultConfig(): array
    {
        return [
            'hero' => [
                'eyebrow' => 'Plan Finder',
                'h1' => 'ค้นหาแบบประกันที่เหมาะสมสำหรับคุณ',
                'copy' => 'เลือกเป้าหมาย กรอกตัวเลข แล้วดูแบบประกันแนะนำสูงสุด 3 แบบ',
            ],
            'disclaimer' => 'ผลลัพธ์เป็นการประมาณการเบื้องต้นเพื่อประกอบการพิจารณา ไม่ใช่คำเสนอขายหรือการรับประกันผลประโยชน์ตามกรมธรรม์ กรุณาปรึกษาที่ปรึกษาเพื่อตรวจเงื่อนไขและสิทธิประโยชน์จริง',
            'goals' => [
                [
                    'id' => 'income',
                    'title' => 'มีหลักประกันรายได้ที่มั่นคง',
                    'subtitle' => 'ดูแลครอบครัวในทุกสถานการณ์',
                    'mode' => 'category',
                    'category' => 'whole-life-insurance',
                    'keywords' => '',
                    'formTitle' => 'วางแผนหลักประกันรายได้',
                    'basicFields' => [
                        ['key' => 'age', 'label' => 'อายุ (ปี)', 'type' => 'number', 'placeholder' => '35'],
                        ['key' => 'monthly_income', 'label' => 'รายได้ต่อเดือน (บาท)', 'type' => 'number', 'placeholder' => '50000'],
                        ['key' => 'premium_budget', 'label' => 'งบเบี้ยที่จัดสรรได้ต่อปี (บาท)', 'type' => 'number', 'placeholder' => '60000'],
                        ['key' => 'existing_cover', 'label' => 'ความคุ้มครองที่มีอยู่แล้ว (บาท)', 'type' => 'number', 'placeholder' => '1000000'],
                    ],
                    'calcFields' => [
                        ['key' => 'annual_expense', 'label' => 'ค่าใช้จ่ายต่อปีของครอบครัว (บาท)', 'type' => 'number', 'placeholder' => '480000'],
                        ['key' => 'years', 'label' => 'จำนวนปีที่ต้องการคุ้มครอง', 'type' => 'number', 'placeholder' => '10'],
                        ['key' => 'debt', 'label' => 'หนี้สินรวม (บาท)', 'type' => 'number', 'placeholder' => '0'],
                        ['key' => 'assets', 'label' => 'เงินสด/สินทรัพย์ที่หักได้ (บาท)', 'type' => 'number', 'placeholder' => '0'],
                    ],
                    'formulaNote' => 'สูตรโดยประมาณ: (ค่าใช้จ่ายต่อปี × จำนวนปี) + หนี้สิน − สินทรัพย์',
                    'outputs' => [
                        ['key' => 'need_total', 'label' => 'จำนวนเงินที่ควรมีทั้งหมด', 'expr' => 'annual_expense * years + debt', 'tone' => 'blue'],
                        ['key' => 'have_now', 'label' => 'ความคุ้มครองที่มีแล้ว', 'expr' => 'existing_cover + assets', 'tone' => 'green'],
                        ['key' => 'gap', 'label' => 'จำนวนเงินที่ต้องเตรียมเพิ่ม', 'expr' => 'max(0, annual_expense * years + debt - existing_cover - assets)', 'tone' => 'red'],
                    ],
                    'budgetKey' => 'premium_budget',
                    'budgetLabel' => 'งบเบี้ยที่จัดสรรได้ต่อปี',
                ],
                [
                    'id' => 'education',
                    'title' => 'มีเงินทุนการศึกษาสำหรับบุตรหลาน',
                    'subtitle' => 'เตรียมอนาคตดี ๆ ให้ลูก',
                    'mode' => 'category',
                    'category' => 'endowment-insurance',
                    'keywords' => '',
                    'formTitle' => 'วางแผนการศึกษาบุตรหลาน',
                    'basicFields' => [
                        ['key' => 'age', 'label' => 'อายุผู้ปกครอง (ปี)', 'type' => 'number', 'placeholder' => '35'],
                        ['key' => 'monthly_income', 'label' => 'รายได้ต่อเดือน (บาท)', 'type' => 'number', 'placeholder' => '50000'],
                        ['key' => 'premium_budget', 'label' => 'งบเบี้ยที่จัดสรรได้ต่อปี (บาท)', 'type' => 'number', 'placeholder' => '72000'],
                        ['key' => 'existing_cover', 'label' => 'ทุนประกัน/เงินออมที่มีแล้ว (บาท)', 'type' => 'number', 'placeholder' => '500000'],
                    ],
                    'calcFields' => [
                        ['key' => 'child_age', 'label' => 'อายุบุตร (ปี)', 'type' => 'number', 'placeholder' => '5'],
                        ['key' => 'years', 'label' => 'จำนวนปีจนถึงเข้าเรียนเป้าหมาย', 'type' => 'number', 'placeholder' => '13'],
                        ['key' => 'annual_tuition', 'label' => 'ค่าเล่าเรียนโดยประมาณต่อปี (บาท)', 'type' => 'number', 'placeholder' => '150000'],
                        ['key' => 'study_years', 'label' => 'จำนวนปีการศึกษา', 'type' => 'number', 'placeholder' => '4'],
                    ],
                    'formulaNote' => 'สูตรโดยประมาณ: ค่าเล่าเรียนต่อปี × จำนวนปีการศึกษา',
                    'outputs' => [
                        ['key' => 'need_total', 'label' => 'เงินที่ควรเตรียมทั้งหมด', 'expr' => 'annual_tuition * study_years', 'tone' => 'blue'],
                        ['key' => 'have_now', 'label' => 'เงิน/ความคุ้มครองที่มีแล้ว', 'expr' => 'existing_cover', 'tone' => 'green'],
                        ['key' => 'gap', 'label' => 'ส่วนที่ควรเตรียมเพิ่ม', 'expr' => 'max(0, annual_tuition * study_years - existing_cover)', 'tone' => 'red'],
                    ],
                    'budgetKey' => 'premium_budget',
                    'budgetLabel' => 'งบเบี้ยที่จัดสรรได้ต่อปี',
                ],
                [
                    'id' => 'retirement',
                    'title' => 'มีเงินใช้ยามเกษียณ',
                    'subtitle' => 'สร้างรายได้มั่นคงหลังเกษียณ',
                    'mode' => 'category',
                    'category' => 'retirement-insurance',
                    'keywords' => '',
                    'formTitle' => 'วางแผนเกษียณอายุ',
                    'basicFields' => [
                        ['key' => 'age', 'label' => 'อายุปัจจุบัน (ปี)', 'type' => 'number', 'placeholder' => '40'],
                        ['key' => 'monthly_income', 'label' => 'รายได้ต่อเดือน (บาท)', 'type' => 'number', 'placeholder' => '50000'],
                        ['key' => 'premium_budget', 'label' => 'งบเบี้ยที่จัดสรรได้ต่อปี (บาท)', 'type' => 'number', 'placeholder' => '80000'],
                        ['key' => 'existing_cover', 'label' => 'เงินออม/สินทรัพย์ที่มีแล้ว (บาท)', 'type' => 'number', 'placeholder' => '1000000'],
                    ],
                    'calcFields' => [
                        ['key' => 'retire_age', 'label' => 'อายุที่ต้องการเกษียณ', 'type' => 'number', 'placeholder' => '60'],
                        ['key' => 'retire_years', 'label' => 'จำนวนปีหลังเกษียณ', 'type' => 'number', 'placeholder' => '20'],
                        ['key' => 'monthly_retire', 'label' => 'ค่าใช้จ่ายต่อเดือนหลังเกษียณ (บาท)', 'type' => 'number', 'placeholder' => '30000'],
                        ['key' => 'health_cost', 'label' => 'ค่าใช้จ่ายสุขภาพโดยประมาณทั้งช่วง (บาท)', 'type' => 'number', 'placeholder' => '500000'],
                    ],
                    'formulaNote' => 'สูตรโดยประมาณ: (ค่าใช้จ่ายรายเดือน × 12 × ปีหลังเกษียณ) + ค่าสุขภาพ',
                    'outputs' => [
                        ['key' => 'need_total', 'label' => 'เงินที่ควรมีตอนเกษียณ', 'expr' => 'monthly_retire * 12 * retire_years + health_cost', 'tone' => 'blue'],
                        ['key' => 'have_now', 'label' => 'เงินออม/สินทรัพย์ที่มีแล้ว', 'expr' => 'existing_cover', 'tone' => 'green'],
                        ['key' => 'gap', 'label' => 'ส่วนที่ควรเตรียมเพิ่ม', 'expr' => 'max(0, monthly_retire * 12 * retire_years + health_cost - existing_cover)', 'tone' => 'red'],
                    ],
                    'budgetKey' => 'premium_budget',
                    'budgetLabel' => 'งบเบี้ยที่จัดสรรได้ต่อปี',
                ],
                [
                    'id' => 'health',
                    'title' => 'มีเงินค่ารักษาพยาบาลยามเจ็บป่วย',
                    'subtitle' => 'ค่ารักษา โรคร้ายแรง และอุบัติเหตุ',
                    'mode' => 'category',
                    'category' => 'health-insurance',
                    'keywords' => '',
                    'formTitle' => 'วางแผนความคุ้มครองสุขภาพ',
                    'basicFields' => [
                        ['key' => 'age', 'label' => 'อายุ (ปี)', 'type' => 'number', 'placeholder' => '35'],
                        ['key' => 'monthly_income', 'label' => 'รายได้ต่อเดือน (บาท)', 'type' => 'number', 'placeholder' => '50000'],
                        ['key' => 'premium_budget', 'label' => 'งบเบี้ยที่จัดสรรได้ต่อปี (บาท)', 'type' => 'number', 'placeholder' => '40000'],
                        ['key' => 'existing_cover', 'label' => 'วงเงินสุขภาพที่มีแล้ว (บาท/ปี)', 'type' => 'number', 'placeholder' => '0'],
                    ],
                    'calcFields' => [
                        ['key' => 'room_rate', 'label' => 'ค่าห้องที่ต้องการ (บาท/วัน)', 'type' => 'number', 'placeholder' => '5000'],
                        ['key' => 'opd', 'label' => 'วงเงินผู้ป่วยนอกที่ต้องการ (บาท/ปี)', 'type' => 'number', 'placeholder' => '30000'],
                        ['key' => 'ipd', 'label' => 'วงเงินผู้ป่วยในที่ต้องการ (บาท/ปี)', 'type' => 'number', 'placeholder' => '2000000'],
                        [
                            'key' => 'ci',
                            'label' => 'ต้องการคุ้มครองโรคร้ายแรง',
                            'type' => 'select',
                            'placeholder' => '0',
                            'options' => [
                                ['value' => '0', 'label' => 'ไม่เอา'],
                                ['value' => '1', 'label' => 'เอา'],
                            ],
                        ],
                        [
                            'key' => 'income',
                            'label' => 'ต้องการชดเชยรายได้',
                            'type' => 'select',
                            'placeholder' => '0',
                            'options' => [
                                ['value' => '0', 'label' => 'ไม่เอา'],
                                ['value' => '1', 'label' => 'เอา'],
                            ],
                        ],
                    ],
                    'formulaNote' => 'สูตรโดยประมาณ: วงเงินผู้ป่วยใน + ผู้ป่วยนอก (ใช้ประกอบการเลือกแผน) · ถ้าเลือกทั้งโรคร้ายแรงและชดเชยรายได้ จะแนะนำ Health Fit DD, มัลติเพย์, HB Pro',
                    'outputs' => [
                        ['key' => 'need_total', 'label' => 'วงเงินคุ้มครองที่ควรมี', 'expr' => 'ipd + opd', 'tone' => 'blue'],
                        ['key' => 'have_now', 'label' => 'วงเงินที่มีแล้ว', 'expr' => 'existing_cover', 'tone' => 'green'],
                        ['key' => 'gap', 'label' => 'ส่วนที่ควรเพิ่ม', 'expr' => 'max(0, ipd + opd - existing_cover)', 'tone' => 'red'],
                    ],
                    'budgetKey' => 'premium_budget',
                    'budgetLabel' => 'งบเบี้ยที่จัดสรรได้ต่อปี',
                    'planOverrides' => [
                        [
                            'whenAll' => [
                                ['key' => 'ci', 'equals' => 1],
                                ['key' => 'income', 'equals' => 1],
                            ],
                            'plans' => [
                                ['match' => ['health-fit-dd', 'health fit dd']],
                                ['match' => ['multipay', 'มัลติเพย์', 'multi-pay']],
                                ['match' => ['hb-pro', 'hb pro', 'health-fit-hb']],
                            ],
                        ],
                    ],
                ],
                [
                    'id' => 'tax',
                    'title' => 'ต้องการลดหย่อนภาษี',
                    'subtitle' => 'วางแผนออมพร้อมความคุ้มครอง',
                    'mode' => 'category',
                    'category' => 'endowment-insurance-with-tax-deductible',
                    'keywords' => '',
                    'formTitle' => 'วางแผนลดหย่อนภาษี',
                    'basicFields' => [
                        ['key' => 'age', 'label' => 'อายุ (ปี)', 'type' => 'number', 'placeholder' => '35'],
                        ['key' => 'annual_income', 'label' => 'รายได้ทั้งปี (บาท)', 'type' => 'number', 'placeholder' => '800000'],
                        ['key' => 'premium_budget', 'label' => 'งบเบี้ยที่จัดสรรได้ต่อปี (บาท)', 'type' => 'number', 'placeholder' => '100000'],
                        ['key' => 'existing_premium', 'label' => 'เบี้ยประกันที่ใช้ลดหย่อนแล้ว (บาท/ปี)', 'type' => 'number', 'placeholder' => '0'],
                    ],
                    'calcFields' => [
                        ['key' => 'tax_room', 'label' => 'วงเงินลดหย่อนประกันที่เหลือ (บาท)', 'type' => 'number', 'placeholder' => '100000'],
                        ['key' => 'pay_years', 'label' => 'ต้องการชำระเบี้ยไม่เกินกี่ปี', 'type' => 'number', 'placeholder' => '6'],
                        ['key' => 'want_save', 'label' => 'เน้นออม+คุ้มครอง (1=ใช่ 0=ไม่)', 'type' => 'number', 'placeholder' => '1'],
                        ['key' => 'tax_rate', 'label' => 'อัตราภาษีโดยประมาณ (%)', 'type' => 'number', 'placeholder' => '20'],
                    ],
                    'formulaNote' => 'สูตรโดยประมาณ: เบี้ยที่วางแผน = min(งบเบี้ย, วงเงินลดหย่อนที่เหลือ) · ประมาณการเงินคืนภาษี ≈ เบี้ย × อัตราภาษี/100',
                    'outputs' => [
                        ['key' => 'need_total', 'label' => 'เบี้ยที่ควรจัดสรรต่อปี', 'expr' => 'min(premium_budget, tax_room)', 'tone' => 'blue'],
                        ['key' => 'have_now', 'label' => 'เบี้ยที่ใช้ลดหย่อนแล้ว', 'expr' => 'existing_premium', 'tone' => 'green'],
                        ['key' => 'gap', 'label' => 'ประมาณการเงินคืนภาษี', 'expr' => 'min(premium_budget, tax_room) * tax_rate / 100', 'tone' => 'red'],
                    ],
                    'budgetKey' => 'premium_budget',
                    'budgetLabel' => 'งบเบี้ยที่จัดสรรได้ต่อปี',
                ],
                [
                    'id' => 'savings',
                    'title' => 'มีเงินออมไว้ใช้สำหรับอนาคต',
                    'subtitle' => 'สร้างอิสรภาพทางการเงิน',
                    'mode' => 'keyword',
                    'category' => 'endowment-insurance',
                    'keywords' => 'เงินคืน,ปันผล,ระหว่างสัญญา,ออม',
                    'formTitle' => 'วางแผนเงินออมเพื่ออนาคต',
                    'basicFields' => [
                        ['key' => 'age', 'label' => 'อายุ (ปี)', 'type' => 'number', 'placeholder' => '30'],
                        ['key' => 'premium_budget', 'label' => 'เป้าหมายฝากต่อปี (บาท)', 'type' => 'number', 'placeholder' => '60000'],
                        ['key' => 'monthly_save', 'label' => 'เป้าหมายฝากต่อเดือน (บาท)', 'type' => 'number', 'placeholder' => '5000'],
                        ['key' => 'existing_cover', 'label' => 'เงินออมที่มีแล้ว (บาท)', 'type' => 'number', 'placeholder' => '0'],
                    ],
                    'calcFields' => [
                        ['key' => 'pay_years', 'label' => 'ต้องการออม/ชำระเบี้ยกี่ปี', 'type' => 'number', 'placeholder' => '15'],
                        ['key' => 'cover_years', 'label' => 'ต้องการเงินคืน/ครบกำหนดภายในกี่ปี', 'type' => 'number', 'placeholder' => '20'],
                        ['key' => 'want_cashback', 'label' => 'ต้องการเงินคืนระหว่างสัญญา (1=ใช่ 0=ไม่)', 'type' => 'number', 'placeholder' => '1'],
                        ['key' => 'want_dividend', 'label' => 'ต้องการเงินปันผล (1=ใช่ 0=ไม่)', 'type' => 'number', 'placeholder' => '1'],
                    ],
                    'formulaNote' => 'ใช้คำตอบเรื่องเงินคืน/ปันผล และระยะเวลา เป็นคำค้นจับคู่แผนออมทรัพย์',
                    'outputs' => [
                        ['key' => 'need_total', 'label' => 'เป้าหมายออมรวมโดยประมาณ', 'expr' => 'premium_budget * pay_years', 'tone' => 'blue'],
                        ['key' => 'have_now', 'label' => 'เงินออมที่มีแล้ว', 'expr' => 'existing_cover', 'tone' => 'green'],
                        ['key' => 'gap', 'label' => 'ส่วนที่วางแผนออมเพิ่ม', 'expr' => 'max(0, premium_budget * pay_years - existing_cover)', 'tone' => 'red'],
                    ],
                    'budgetKey' => 'premium_budget',
                    'budgetLabel' => 'เป้าหมายฝากต่อปี',
                    'keywordRules' => [
                        ['when' => 'want_cashback', 'equals' => 1, 'terms' => ['เงินคืน', 'ระหว่างสัญญา', 'คืนทุกปี']],
                        ['when' => 'want_dividend', 'equals' => 1, 'terms' => ['ปันผล', 'เงินปันผล']],
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    public static function loadConfig(): array
    {
        $defaults = self::defaultConfig();
        try {
            $stmt = cms_db()->prepare(
                'SELECT config FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1'
            );
            $stmt->execute([self::PAGE_KEY, 'wizard']);
            $row = $stmt->fetch();
            if (!$row) {
                return $defaults;
            }
            $cfg = json_decode((string) ($row['config'] ?? ''), true);
            if (!is_array($cfg)) {
                return $defaults;
            }
            return self::mergeConfig($defaults, $cfg);
        } catch (Throwable) {
            return $defaults;
        }
    }

    /** @param array<string,mixed> $defaults @param array<string,mixed> $cfg */
    private static function mergeConfig(array $defaults, array $cfg): array
    {
        $out = $defaults;
        if (isset($cfg['hero']) && is_array($cfg['hero'])) {
            $out['hero'] = array_merge($defaults['hero'], $cfg['hero']);
        }
        if (isset($cfg['disclaimer']) && is_string($cfg['disclaimer'])) {
            $out['disclaimer'] = $cfg['disclaimer'];
        }
        if (isset($cfg['goals']) && is_array($cfg['goals']) && $cfg['goals'] !== []) {
            $out['goals'] = $cfg['goals'];
        }
        return $out;
    }

    public static function ensureSeeded(): void
    {
        try {
            $db = cms_db();
            $stmt = $db->prepare(
                'SELECT id FROM page_sections WHERE page_key = ? AND section_key = ? LIMIT 1'
            );
            $stmt->execute([self::PAGE_KEY, 'wizard']);
            if (!$stmt->fetch()) {
                $ins = $db->prepare(
                    'INSERT INTO page_sections (page_key, section_key, title, config, is_active, sort_order)
                     VALUES (?,?,?,?,?,0)'
                );
                $ins->execute([
                    self::PAGE_KEY,
                    'wizard',
                    'ค้นหาแบบประกัน',
                    json_encode(self::defaultConfig(), JSON_UNESCAPED_UNICODE),
                    1,
                ]);
            }
        } catch (Throwable) {
            // ignore
        }

        try {
            $db = cms_db();
            $chk = $db->prepare(
                "SELECT id FROM nav_items WHERE location = 'header' AND url LIKE ? LIMIT 1"
            );
            $chk->execute(['%find-plan%']);
            if (!$chk->fetch()) {
                $db->exec(
                    "UPDATE nav_items SET sort_order = sort_order + 1
                     WHERE location = 'header' AND sort_order >= 3"
                );
                $insNav = $db->prepare(
                    'INSERT INTO nav_items (location, label, url, is_cta, is_active, sort_order)
                     VALUES (?,?,?,?,1,?)'
                );
                $insNav->execute(['header', 'ค้นหาแบบประกัน', 'find-plan.html', 0, 3]);
            }
        } catch (Throwable) {
            // ignore
        }
    }

    /** @return list<array<string,mixed>> */
    public static function plansForClient(): array
    {
        require_once __DIR__ . '/SiteBuilder.php';
        $stmt = cms_db()->query(
            "SELECT id, name, slug, filter_tag, short_description, highlights, image_path,
                    link_url, is_featured, sort_order
             FROM insurance_plans
             WHERE is_active = 1
             ORDER BY is_featured DESC, sort_order ASC, id ASC"
        );
        $out = [];
        while ($p = $stmt->fetch()) {
            $highlights = $p['highlights'] ?? [];
            if (is_string($highlights)) {
                $decoded = json_decode($highlights, true);
                $highlights = is_array($decoded) ? $decoded : [];
            }
            if (!is_array($highlights)) {
                $highlights = [];
            }
            $blob = mb_strtolower(
                trim(
                    ($p['name'] ?? '') . ' ' .
                    ($p['short_description'] ?? '') . ' ' .
                    implode(' ', array_map('strval', $highlights))
                ),
                'UTF-8'
            );
            $slug = SiteBuilder::planSlugForRowPublic($p);
            $href = 'plans/' . $slug . '.html';
            $link = trim((string) ($p['link_url'] ?? ''));
            if ($link !== '' && !str_contains($link, 'articles/')) {
                $href = ltrim($link, '/');
            }
            $out[] = [
                'id' => (int) $p['id'],
                'name' => (string) $p['name'],
                'slug' => $slug,
                'href' => $href,
                'category' => (string) ($p['filter_tag'] ?? ''),
                'excerpt' => (string) ($p['short_description'] ?? ''),
                'image' => (string) ($p['image_path'] ?? ''),
                'featured' => (int) ($p['is_featured'] ?? 0) === 1,
                'sort' => (int) ($p['sort_order'] ?? 0),
                'searchText' => $blob,
            ];
        }
        return $out;
    }
}
