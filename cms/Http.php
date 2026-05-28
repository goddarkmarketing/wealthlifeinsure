<?php
declare(strict_types=1);

final class Http
{
    public static function json(array $data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function body(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        if (!empty($_GET['path'])) {
            $p = (string) $_GET['path'];
            if (($qi = strpos($p, '?')) !== false) {
                parse_str(substr($p, $qi + 1), $extra);
                if (is_array($extra)) {
                    foreach ($extra as $k => $v) {
                        if (!isset($_GET[$k])) {
                            $_GET[$k] = $v;
                        }
                    }
                }
                $p = substr($p, 0, $qi);
            }
            return '/' . trim($p, '/');
        }
        if (!empty($_SERVER['PATH_INFO'])) {
            return '/' . trim((string) $_SERVER['PATH_INFO'], '/');
        }
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $script = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
        if ($script && str_contains($uri, $script)) {
            $extra = substr($uri, strlen($script)) ?: '';
            if ($extra !== '') {
                return '/' . trim($extra, '/');
            }
        }
        $base = rtrim(dirname($script), '/\\');
        if ($base && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base)) ?: '/';
        }
        $uri = preg_replace('#^/index\.php#', '', $uri) ?? $uri;
        return '/' . trim($uri, '/');
    }
}
