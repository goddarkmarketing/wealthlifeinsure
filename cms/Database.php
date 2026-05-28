<?php
declare(strict_types=1);

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        $host = (string) cms_config('db.host', '127.0.0.1');
        $port = (int) cms_config('db.port', 3306);
        $name = (string) cms_config('db.name', 'wealthlife_cms');
        $user = (string) cms_config('db.user', 'root');
        $pass = (string) cms_config('db.pass', '');
        $charset = (string) cms_config('db.charset', 'utf8mb4');
        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";
        self::$pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return self::$pdo;
    }
}
