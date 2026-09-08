<?php
declare(strict_types=1);

/**
 * Marketing / analytics snippets for static site build.
 */
final class Tracking
{
    /** @return array<string,mixed> */
    public static function defaults(): array
    {
        return [
            'installMode' => 'gtm',
            'gtm' => ['enabled' => false, 'containerId' => ''],
            'ga4' => ['enabled' => false, 'measurementId' => ''],
            'facebook' => ['enabled' => false, 'pixelId' => ''],
            'tiktok' => ['enabled' => false, 'pixelId' => ''],
            'line' => ['enabled' => false, 'tagId' => ''],
            'searchConsole' => ['verificationContent' => ''],
            'customHead' => '',
            'customBodyEnd' => '',
        ];
    }

    /** @param array<string,mixed> $raw */
    public static function normalize(array $raw): array
    {
        $d = self::defaults();
        $out = $d;
        $mode = (string) ($raw['installMode'] ?? $d['installMode']);
        $out['installMode'] = $mode === 'direct' ? 'direct' : 'gtm';

        foreach (['gtm', 'ga4', 'facebook', 'tiktok', 'line'] as $key) {
            $block = is_array($raw[$key] ?? null) ? $raw[$key] : [];
            $item = ['enabled' => !empty($block['enabled'])];
            if ($key === 'gtm') {
                $item['containerId'] = self::cleanGtmId((string) ($block['containerId'] ?? ''));
            } elseif ($key === 'ga4') {
                $item['measurementId'] = self::cleanGa4Id((string) ($block['measurementId'] ?? ''));
            } elseif ($key === 'facebook' || $key === 'tiktok') {
                $item['pixelId'] = self::cleanPixelId((string) ($block['pixelId'] ?? ''));
            } else {
                $item['tagId'] = trim((string) ($block['tagId'] ?? ''));
            }
            $out[$key] = $item;
        }

        $sc = is_array($raw['searchConsole'] ?? null) ? $raw['searchConsole'] : [];
        $out['searchConsole'] = [
            'verificationContent' => self::cleanSearchConsoleContent((string) ($sc['verificationContent'] ?? '')),
        ];
        $out['customHead'] = trim((string) ($raw['customHead'] ?? ''));
        $out['customBodyEnd'] = trim((string) ($raw['customBodyEnd'] ?? ''));

        return $out;
    }

    /** @param array<string,mixed> $t */
    public static function headHtml(array $t): string
    {
        $t = self::normalize($t);
        $parts = [];

        $verify = $t['searchConsole']['verificationContent'] ?? '';
        if ($verify !== '') {
            $parts[] = '<meta name="google-site-verification" content="' . self::esc($verify) . '">';
        }

        if ($t['installMode'] === 'gtm' && !empty($t['gtm']['enabled'])) {
            $id = $t['gtm']['containerId'] ?? '';
            if ($id !== '') {
                $parts[] = "<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','" . self::esc($id) . "');</script>\n<!-- End Google Tag Manager -->";
            }
        } elseif ($t['installMode'] === 'direct') {
            if (!empty($t['ga4']['enabled'])) {
                $mid = $t['ga4']['measurementId'] ?? '';
                if ($mid !== '') {
                    $parts[] = '<script async src="https://www.googletagmanager.com/gtag/js?id=' . self::esc($mid) . '"></script>';
                    $parts[] = "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" . self::esc($mid) . "');</script>";
                }
            }
        }

        if (!empty($t['facebook']['enabled'])) {
            $pid = $t['facebook']['pixelId'] ?? '';
            if ($pid !== '') {
                $parts[] = "<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\nn.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');fbq('init','" . self::esc($pid) . "');fbq('track','PageView');</script>";
            }
        }
        if (!empty($t['tiktok']['enabled'])) {
            $tid = $t['tiktok']['pixelId'] ?? '';
            if ($tid !== '') {
                $parts[] = "<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=[\"page\",\"track\",\"identify\",\"instances\",\"debug\",\"on\",\"off\",\"once\",\"ready\",\"alias\",\"group\",\"enableCookie\",\"disableCookie\"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i=\"https://analytics.tiktok.com/i18n/pixel/events.js\";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement(\"script\");o.type=\"text/javascript\",o.async=!0,o.src=i+\"?sdkid=\"+e+\"&lib=\"+t;var a=document.getElementsByTagName(\"script\")[0];a.parentNode.insertBefore(o,a)};ttq.load('" . self::esc($tid) . "');ttq.page();}(window,document,'ttq');</script>";
            }
        }
        if (!empty($t['line']['enabled'])) {
            $lid = $t['line']['tagId'] ?? '';
            if ($lid !== '') {
                $parts[] = "<script src=\"https://d.line-scdn.net/r/tag/line_tag.js\"></script>\n<script>try{_lt('init',{tagId:'" . self::esc($lid) . "'});_lt('send','pv');}catch(e){}</script>";
            }
        }

        $custom = $t['customHead'] ?? '';
        if ($custom !== '') {
            $parts[] = $custom;
        }

        if ($parts === []) {
            return '';
        }

        return "\n<!-- wli-tracking-head -->\n" . implode("\n", $parts) . "\n<!-- /wli-tracking-head -->\n";
    }

    /** @param array<string,mixed> $t */
    public static function bodyOpenHtml(array $t): string
    {
        $t = self::normalize($t);
        if ($t['installMode'] !== 'gtm' || empty($t['gtm']['enabled'])) {
            return '';
        }
        $id = $t['gtm']['containerId'] ?? '';
        if ($id === '') {
            return '';
        }

        return "\n<!-- wli-tracking-body-open -->\n<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id=" . self::esc($id) . "\"\nheight=\"0\" width=\"0\" style=\"display:none;visibility:hidden\"></iframe></noscript>\n<!-- End Google Tag Manager (noscript) -->\n<!-- /wli-tracking-body-open -->\n";
    }

    /** @param array<string,mixed> $t */
    public static function bodyEndHtml(array $t): string
    {
        $t = self::normalize($t);
        $parts = [];

        if (!empty($t['facebook']['enabled'])) {
            $pid = $t['facebook']['pixelId'] ?? '';
            if ($pid !== '') {
                $parts[] = '<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' . self::esc($pid) . '&ev=PageView&noscript=1" alt=""></noscript>';
            }
        }

        $custom = $t['customBodyEnd'] ?? '';
        if ($custom !== '') {
            $parts[] = $custom;
        }

        if ($parts === []) {
            return '';
        }

        return "\n<!-- wli-tracking-body-end -->\n" . implode("\n", $parts) . "\n<!-- /wli-tracking-body-end -->\n";
    }

    public static function applyToHtml(string $html, array $tracking): string
    {
        $html = preg_replace('/<!-- wli-tracking-head -->[\s\S]*?<!-- \/wli-tracking-head -->/s', '', $html) ?? $html;
        $html = preg_replace('/<!-- wli-tracking-body-open -->[\s\S]*?<!-- \/wli-tracking-body-open -->/s', '', $html) ?? $html;
        $html = preg_replace('/<!-- wli-tracking-body-end -->[\s\S]*?<!-- \/wli-tracking-body-end -->/s', '', $html) ?? $html;

        $head = self::headHtml($tracking);
        if ($head !== '') {
            $html = preg_replace('/<\/head>/i', $head . '</head>', $html, 1) ?? $html;
        }

        $bodyOpen = self::bodyOpenHtml($tracking);
        if ($bodyOpen !== '') {
            $html = preg_replace('/<body([^>]*)>/i', '<body$1>' . $bodyOpen, $html, 1) ?? $html;
        }

        $bodyEnd = self::bodyEndHtml($tracking);
        if ($bodyEnd !== '') {
            $html = preg_replace('/<\/body>/i', $bodyEnd . '</body>', $html, 1) ?? $html;
        }

        return $html;
    }

    /** Accepts token, google-site-verification=TOKEN, or a full meta tag. */
    public static function cleanSearchConsoleContent(string $raw): string
    {
        $raw = trim($raw);
        if ($raw === '') {
            return '';
        }
        if (preg_match('/content\s*=\s*["\']([^"\']+)["\']/i', $raw, $m)) {
            $raw = $m[1];
        } elseif (preg_match('/^google-site-verification\s*=\s*(.+)$/i', $raw, $m)) {
            $raw = trim($m[1], " \t\"'");
        }
        $raw = trim($raw, " \t\"'");
        return preg_match('/^[A-Za-z0-9_-]{10,200}$/', $raw) ? $raw : '';
    }

    private static function cleanGtmId(string $id): string
    {
        $id = strtoupper(trim($id));
        return preg_match('/^GTM-[A-Z0-9]+$/', $id) ? $id : '';
    }

    private static function cleanGa4Id(string $id): string
    {
        $id = strtoupper(trim($id));
        return preg_match('/^G-[A-Z0-9]+$/', $id) ? $id : '';
    }

    private static function cleanPixelId(string $id): string
    {
        $id = trim($id);
        return preg_match('/^[A-Za-z0-9]+$/', $id) ? $id : '';
    }

    private static function esc(?string $s): string
    {
        return htmlspecialchars((string) $s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
