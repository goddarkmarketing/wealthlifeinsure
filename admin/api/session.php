<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

json_out([
    'ok' => true,
    'loggedIn' => !empty($_SESSION['admin_logged_in']),
    'username' => $_SESSION['admin_username'] ?? null,
]);
