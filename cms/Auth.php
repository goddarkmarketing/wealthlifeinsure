<?php
declare(strict_types=1);

final class Auth
{
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $savePath = cms_session_dir();
        if (!is_writable($savePath)) {
            throw new RuntimeException('โฟลเดอร์ session ไม่สามารถเขียนได้: ' . $savePath);
        }
        session_save_path($savePath);
        session_name((string) cms_config('session_name', 'wli_cms_session'));
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function login(string $username, string $password): ?array
    {
        $stmt = cms_db()->prepare('SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }
        cms_db()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([(int) $user['id']]);
        self::startSession();
        $_SESSION['cms_user'] = [
            'id' => (int) $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'email' => $user['email'],
        ];
        return $_SESSION['cms_user'];
    }

    public static function logout(): void
    {
        self::startSession();
        unset($_SESSION['cms_user']);
    }

    public static function user(): ?array
    {
        self::startSession();
        return $_SESSION['cms_user'] ?? null;
    }

    public static function requireUser(): array
    {
        $user = self::user();
        if (!$user) {
            cms_json(['ok' => false, 'error' => 'กรุณาเข้าสู่ระบบ'], 401);
        }
        return $user;
    }

    public static function can(string $permission): bool
    {
        $user = self::user();
        if (!$user) {
            return false;
        }
        if ($user['role'] === 'super_admin') {
            return true;
        }
        if ($user['role'] === 'admin') {
            return $permission !== 'users.delete';
        }
        $allowed = ['dashboard', 'articles', 'careers', 'media', 'leads.read', 'build'];
        return in_array($permission, $allowed, true);
    }
}
