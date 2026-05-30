<?php
declare(strict_types=1);

/**
 * Remove duplicate articles/careers created by re-running migrate (slugs like foo-1, foo-2).
 * Keeps canonical slug when both exist. Run: php cms/fix-duplicate-content.php
 */
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/SiteBuilder.php';

function content_base_slug(string $slug): string
{
    return preg_match('/^(.+)-\d+$/', $slug, $m) ? $m[1] : $slug;
}

/** @return list<string> */
function duplicate_suffix_slugs(PDO $db, string $table): array
{
    if (!in_array($table, ['articles', 'careers'], true)) {
        throw new InvalidArgumentException('Unsupported table');
    }
    $stmt = $db->query("SELECT slug FROM {$table} WHERE slug REGEXP '-[0-9]+$'");
    $dupes = [];
    while ($row = $stmt->fetch()) {
        $slug = (string) $row['slug'];
        $base = content_base_slug($slug);
        if ($base === $slug) {
            continue;
        }
        $check = $db->prepare("SELECT 1 FROM {$table} WHERE slug = ? LIMIT 1");
        $check->execute([$base]);
        if ($check->fetchColumn()) {
            $dupes[] = $slug;
        }
    }
    return $dupes;
}

/** @param list<string> $slugs */
function delete_content_files(string $dir, array $slugs): int
{
    $root = cms_root();
    $removed = 0;
    foreach ($slugs as $slug) {
        $path = $root . '/' . $dir . '/' . $slug . '.html';
        if (is_file($path) && @unlink($path)) {
            $removed++;
        }
    }
    return $removed;
}

$db = cms_db();
$removedArticles = duplicate_suffix_slugs($db, 'articles');
$removedCareers = duplicate_suffix_slugs($db, 'careers');

foreach ($removedArticles as $slug) {
    $db->prepare('DELETE FROM articles WHERE slug = ?')->execute([$slug]);
}
foreach ($removedCareers as $slug) {
    $db->prepare('DELETE FROM careers WHERE slug = ?')->execute([$slug]);
}

$filesArticles = delete_content_files('articles', $removedArticles);
$filesCareers = delete_content_files('careers', $removedCareers);

$result = SiteBuilder::build();

echo "Deleted article slugs: " . count($removedArticles) . PHP_EOL;
echo "Deleted career slugs: " . count($removedCareers) . PHP_EOL;
echo "Removed article files: {$filesArticles}" . PHP_EOL;
echo "Removed career files: {$filesCareers}" . PHP_EOL;
echo "Rebuilt {$result['count']} files." . PHP_EOL;
