<?php
declare(strict_types=1);

/**
 * CLI restore: php cms/_restore-cli.php path/to/wealthlife-backup-....zip
 * Optional 2nd arg: rebuild=1 (default) or rebuild=0
 */
if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "CLI only\n");
    exit(1);
}

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/Backup.php';

$zip = $argv[1] ?? '';
$rebuild = !isset($argv[2]) || $argv[2] !== 'rebuild=0';

if ($zip === '' || !is_file($zip)) {
    fwrite(STDERR, "Usage: php _restore-cli.php <backup.zip> [rebuild=1|rebuild=0]\n");
    exit(1);
}

echo "Restoring from: {$zip}\n";
echo "Rebuild HTML: " . ($rebuild ? 'yes' : 'no') . "\n";

try {
    $result = Backup::restoreFromZip($zip, ['rebuild' => $rebuild]);
    echo "OK\n";
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, 'ERROR: ' . $e->getMessage() . "\n");
    exit(1);
}
