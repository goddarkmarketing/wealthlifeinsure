<?php
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'wealthlife_cms',
        'user' => 'root',
        'pass' => '',
        'charset' => 'utf8mb4',
    ],
    'session_name' => 'wli_cms_session',
    'upload_dir' => dirname(__DIR__) . '/uploads',
    'upload_url' => '/wealthlifeinsure.com/uploads',
    'site_root' => dirname(__DIR__),
    'site_url' => 'http://localhost/wealthlifeinsure.com',
];
