<?php
declare(strict_types=1);

/** หมวดประกัน (insurance_categories) — seed และอ่านค่าที่ใช้บนหน้าเว็บ */
final class InsuranceCategories
{
    /** @return list<array{name:string,slug:string,sort:int}> */
    private static function defaultDefs(): array
    {
        return [
            ['name' => 'ประกันชีวิต', 'slug' => 'life', 'sort' => 0],
            ['name' => 'ประกันสุขภาพ', 'slug' => 'health', 'sort' => 1],
            ['name' => 'ออมทรัพย์ / ภาษี', 'slug' => 'savings', 'sort' => 2],
        ];
    }

    /** สร้างหมวดเริ่มต้นเมื่อตารางว่าง */
    public static function ensureSeeded(): void
    {
        $db = cms_db();
        $count = (int) $db->query('SELECT COUNT(*) FROM insurance_categories')->fetchColumn();
        if ($count > 0) {
            return;
        }
        $insert = $db->prepare(
            'INSERT INTO insurance_categories (name, slug, sort_order, is_active) VALUES (?,?,?,1)'
        );
        foreach (self::defaultDefs() as $d) {
            $insert->execute([$d['name'], $d['slug'], $d['sort']]);
        }
    }

    /** @return list<array<string,mixed>> */
    public static function listActive(): array
    {
        self::ensureSeeded();
        $stmt = cms_db()->query(
            'SELECT * FROM insurance_categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        $rows = $stmt->fetchAll();
        return is_array($rows) ? $rows : [];
    }

    /** @return list<string> slug ที่ใช้กรองแผนบนหน้าเว็บ */
    public static function filterSlugs(): array
    {
        $slugs = [];
        foreach (self::listActive() as $row) {
            $slug = (string) ($row['slug'] ?? '');
            if ($slug !== '' && $slug !== 'all') {
                $slugs[] = $slug;
            }
        }
        return $slugs !== [] ? $slugs : ['life', 'health', 'savings'];
    }

    public static function renderFilterOptionsHtml(string $indent = '                  '): string
    {
        $html = $indent . '<option value="all">ทุกหมวด</option>' . "\n";
        foreach (self::listActive() as $row) {
            $slug = (string) ($row['slug'] ?? '');
            if ($slug === '' || $slug === 'all') {
                continue;
            }
            $html .= $indent . '<option value="' . esc($slug) . '">' . esc((string) ($row['name'] ?? '')) . "</option>\n";
        }
        return $html;
    }

    /** @return list<array{slug:string,name:string}> */
    public static function publicList(): array
    {
        $out = [];
        foreach (self::listActive() as $row) {
            $slug = (string) ($row['slug'] ?? '');
            if ($slug === '' || $slug === 'all') {
                continue;
            }
            $out[] = [
                'slug' => $slug,
                'name' => (string) ($row['name'] ?? ''),
            ];
        }
        return $out;
    }

    /**
     * ให้ filter_tag ของแผนตรงกับ slug หมวดที่ผูก category_id
     * กันกรณีแก้ชื่อ/slug หมวดแล้วหน้าเว็บกรองไม่เจอแผน
     */
    public static function syncPlanFilterTagsFromCategories(): int
    {
        self::ensureSeeded();
        $db = cms_db();
        $cats = $db->query('SELECT id, slug FROM insurance_categories')->fetchAll();
        $byId = [];
        foreach ($cats as $c) {
            $slug = trim((string) ($c['slug'] ?? ''));
            if ($slug === '' || $slug === 'all') {
                continue;
            }
            $byId[(int) $c['id']] = $slug;
        }
        if ($byId === []) {
            return 0;
        }

        $updated = 0;
        $upd = $db->prepare('UPDATE insurance_plans SET filter_tag = ? WHERE id = ? AND filter_tag <> ?');
        $stmt = $db->query(
            'SELECT id, category_id, filter_tag FROM insurance_plans WHERE category_id IS NOT NULL AND category_id > 0'
        );
        while ($p = $stmt->fetch()) {
            $cid = (int) ($p['category_id'] ?? 0);
            if ($cid <= 0 || !isset($byId[$cid])) {
                continue;
            }
            $want = $byId[$cid];
            $have = (string) ($p['filter_tag'] ?? '');
            if ($want === $have) {
                continue;
            }
            $upd->execute([$want, (int) $p['id'], $want]);
            $updated += $upd->rowCount() > 0 ? 1 : 0;
        }
        return $updated;
    }
}
