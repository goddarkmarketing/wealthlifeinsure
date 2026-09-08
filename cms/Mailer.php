<?php
declare(strict_types=1);

/**
 * ส่งอีเมลแจ้งเตือนลีดจากฟอร์มติดต่อ
 */
final class Mailer
{
    /** @param array<string,mixed> $lead */
    public static function sendLeadNotification(array $lead): bool
    {
        $to = trim((string) ($lead['notify_email'] ?? ''));
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $to = trim((string) cms_config('mail.notify_to', ''));
        }
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log('[Mailer] mail.notify_to is not configured');
            return false;
        }

        $fromEmail = trim((string) cms_config('mail.from', 'noreply@wealthlifeinsure.com'));
        $fromName = trim((string) cms_config('mail.from_name', 'Wealth Life Insure'));
        $agentName = trim((string) ($lead['preferred_agent'] ?? ''));
        $subject = $agentName !== ''
            ? '[ Wealth Life Insure ] ลูกค้าติดต่อใหม่ → ' . $agentName
            : '[ Wealth Life Insure ] มีลูกค้าติดต่อใหม่จากเว็บไซต์';
        $body = self::formatLeadBody($lead);

        $smtp = cms_config('smtp', []);
        if (is_array($smtp) && !empty($smtp['host']) && !empty($smtp['user'])) {
            return self::sendSmtp($to, $fromEmail, $fromName, $subject, $body, $smtp);
        }

        return self::sendMail($to, $fromEmail, $fromName, $subject, $body);
    }

    /** @param array<string,mixed> $lead */
    private static function formatLeadBody(array $lead): string
    {
        $lines = [
            'มีผู้ติดต่อใหม่จากฟอร์มหน้าเว็บ Wealth Life Insure',
            '',
            'ชื่อ: ' . (string) ($lead['name'] ?? '-'),
            'เบอร์โทร: ' . (string) ($lead['phone'] ?? '-'),
            'วัตถุประสงค์: ' . (string) ($lead['interest'] ?? '-'),
        ];

        $agent = trim((string) ($lead['preferred_agent'] ?? ''));
        if ($agent !== '') {
            $lines[] = 'ตัวแทนที่ลูกค้าเลือก: ' . $agent;
        }

        $plan = trim((string) ($lead['insurance_plan'] ?? ''));
        if ($plan !== '') {
            $lines[] = 'แบบประกันที่สนใจ: ' . $plan;
        }

        $lines[] = '';
        $lines[] = 'ข้อความ:';
        $lines[] = (string) ($lead['message'] ?? '-');
        $lines[] = '';
        $lines[] = 'หน้าที่ส่ง: ' . (string) ($lead['source_page'] ?? 'contact');
        if (!empty($lead['id'])) {
            $lines[] = 'Lead ID: #' . (string) $lead['id'];
        }
        $lines[] = 'เวลา: ' . date('Y-m-d H:i:s');

        return implode("\n", $lines);
    }

    private static function sendMail(
        string $to,
        string $fromEmail,
        string $fromName,
        string $subject,
        string $body
    ): bool {
        $encodedSubject = self::encodeHeader($subject);
        $fromHeader = self::formatAddress($fromEmail, $fromName);
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'From: ' . $fromHeader,
            'Reply-To: ' . $fromHeader,
            'X-Mailer: WealthLifeInsure-CMS',
        ];

        $ok = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
        if (!$ok) {
            error_log('[Mailer] mail() failed for ' . $to);
        }
        return $ok;
    }

    /** @param array<string,mixed> $smtp */
    private static function sendSmtp(
        string $to,
        string $fromEmail,
        string $fromName,
        string $subject,
        string $body,
        array $smtp
    ): bool {
        $host = (string) ($smtp['host'] ?? '');
        $port = (int) ($smtp['port'] ?? 587);
        $user = (string) ($smtp['user'] ?? '');
        $pass = (string) ($smtp['pass'] ?? '');
        $encryption = strtolower((string) ($smtp['encryption'] ?? 'tls'));

        $remote = $encryption === 'ssl'
            ? 'ssl://' . $host . ':' . $port
            : $host . ':' . $port;

        $socket = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
        if (!$socket) {
            error_log("[Mailer] SMTP connect failed: {$errstr} ({$errno})");
            return false;
        }

        stream_set_timeout($socket, 20);

        try {
            self::smtpExpect($socket, [220]);
            self::smtpCommand($socket, 'EHLO wealthlifeinsure.com', [250]);

            if ($encryption === 'tls') {
                self::smtpCommand($socket, 'STARTTLS', [220]);
                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    throw new RuntimeException('STARTTLS failed');
                }
                self::smtpCommand($socket, 'EHLO wealthlifeinsure.com', [250]);
            }

            self::smtpCommand($socket, 'AUTH LOGIN', [334]);
            self::smtpCommand($socket, base64_encode($user), [334]);
            self::smtpCommand($socket, base64_encode($pass), [235]);

            self::smtpCommand($socket, 'MAIL FROM:<' . $fromEmail . '>', [250]);
            self::smtpCommand($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
            self::smtpCommand($socket, 'DATA', [354]);

            $data = 'From: ' . self::formatAddress($fromEmail, $fromName) . "\r\n"
                . 'To: <' . $to . ">\r\n"
                . 'Subject: ' . self::encodeHeader($subject) . "\r\n"
                . "MIME-Version: 1.0\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: 8bit\r\n"
                . "\r\n"
                . str_replace("\n.", "\n..", $body) . "\r\n.\r\n";

            fwrite($socket, $data);
            self::smtpExpect($socket, [250]);
            self::smtpCommand($socket, 'QUIT', [221]);
            return true;
        } catch (Throwable $e) {
            error_log('[Mailer] SMTP error: ' . $e->getMessage());
            return false;
        } finally {
            fclose($socket);
        }
    }

    /** @param resource $socket @param list<int> $codes */
    private static function smtpExpect($socket, array $codes): string
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $codes, true)) {
            throw new RuntimeException('SMTP unexpected response: ' . trim($response));
        }
        return $response;
    }

    /** @param resource $socket @param list<int> $codes */
    private static function smtpCommand($socket, string $command, array $codes): string
    {
        fwrite($socket, $command . "\r\n");
        return self::smtpExpect($socket, $codes);
    }

    private static function encodeHeader(string $text): string
    {
        if (function_exists('mb_encode_mimeheader')) {
            return mb_encode_mimeheader($text, 'UTF-8', 'B', "\r\n");
        }
        return '=?UTF-8?B?' . base64_encode($text) . '?=';
    }

    private static function formatAddress(string $email, string $name): string
    {
        $email = trim($email);
        $name = trim($name);
        if ($name === '') {
            return $email;
        }
        return self::encodeHeader($name) . ' <' . $email . '>';
    }
}
