import { UnifiedContext, MafaiConfig } from './types.js';

// Default Engine URL if not provided by config or env
const DEFAULT_ENGINE_URL = 'http://localhost:3001/evaluate';

// --- Security Patterns (Local Regex) ---
const SECURITY_PATTERNS = {
    SQLi: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /((\%27)|(\'))union/i,
        /exec(\s|\+)+(s|x)p\w+/i,
        /UNION(\s|\+)+SELECT/i,
        /DROP(\s|\+)+TABLE/i,
        /INSERT(\s|\+)+INTO/i,
        /SELECT(\s|\+)+.+FROM/i,
        /UPDATE(\s|\+)+.+SET/i,
        /DELETE(\s|\+)+FROM/i
    ],
    XSS: [
        /<script.*?>.*?<\/script>/is,
        /javascript:/i,
        /on\w+=(\"|'|%22|%27).*/i,
        /(\%3C)|<|((\%3E)|>)/i
    ],
    Traversal: [
        /(\.\.\/)+/i,
        /(\%2e\%2e\%2f)+/i,
        /\/etc\/passwd/i,
        /\/windows\/win.ini/i
    ]
};

export class MafaiCore {
    private config: MafaiConfig;
    private engineUrl: string;

    constructor(config: MafaiConfig = {}) {
        this.config = {
            enabled: true,
            debug: false,
            ...config,
        };

        // Resolve Engine URL: Config -> Env -> Default
        this.engineUrl =
            this.config.engineUrl ||
            process.env.MAF_ENGINE_URL ||
            DEFAULT_ENGINE_URL;

        if (this.config.debug) {
            console.log(`[Mafai] Using Engine URL: ${this.engineUrl}`);
        }
    }

    private analyzeRequestWithRegex(url: string): { verdict: 'ALLOW' | 'BLOCK', reason: string | null } {
        for (const [type, patterns] of Object.entries(SECURITY_PATTERNS)) {
            for (const pattern of patterns) {
                if (pattern.test(url)) {
                    return { verdict: 'BLOCK', reason: `Pattern Match: ${type}` };
                }
            }
        }
        return { verdict: 'ALLOW', reason: null };
    }

    /**
     * Main processing logic.
     * Framework-agnostic, Fail-open by default.
     */
    async process(ctx: UnifiedContext): Promise<void> {
        // Fail-Open: Wrap everything in a try-catch
        try {
            // 1. Check if enabled
            if (this.config.enabled === false) {
                if (this.config.debug) console.log('[Mafai] Disabled, skipping.');
                return ctx.next();
            }

            // 2. Normalize Request
            const { method, url, headers, ip } = ctx.req;
            const cleanHeaders = { ...headers };

            // 3. GET Request Logic (Local Regex + Log Only)
            const isGet = /^(GET)$/i.test(method);
            if (isGet) {
                const regexResult = this.analyzeRequestWithRegex(url);

                // Construct Log-Only Payload
                const payload = {
                    token: this.config.apiKey || '',
                    logOnly: true,
                    verdict: regexResult.verdict,
                    reason: regexResult.reason,
                    request: {
                        ip,
                        method,
                        path: url,
                        url,
                        headers: cleanHeaders,
                        body: {}
                    }
                };

                // Fire and forget logging (don't wait for engine for GET performance)
                this.sendToEngine(payload).catch(err => {
                    if (this.config.debug) console.error('[Mafai] Failed to send log to engine:', err);
                });

                if (regexResult.verdict === 'BLOCK') {
                    if (this.config.debug) console.warn(`[Mafai] Local Block (Regex): ${regexResult.reason}`);
                    return this.blockRequest(ctx);
                }

                return ctx.next();
            }

            // 4. Construct Engine Payload (for non-GET)
            // 4. Construct Engine Payload (for non-GET)
            const payload = {
                token: this.config.apiKey || '',
                request: {
                    ip,
                    method,
                    path: url,
                    url,
                    body: ctx.req.body || {}
                }
            };

            if (this.config.debug) {
                console.log('[Mafai] Sending payload to engine:', JSON.stringify(payload, null, 2));
            }

            // 5. Send to Engine with Timeout
            const decisionData = await this.sendToEngine(payload);
            const decision = decisionData?.decision;

            // 6. Enforce Decision
            if (decision === 'NO') {
                if (this.config.debug) console.warn('[Mafai] Request Blocked by Engine.');
                return this.blockRequest(ctx);
            }

            // Implicitly decision === 'YES' or unknown
            if (this.config.debug) console.log('[Mafai] Request Allowed.');
            return ctx.next();

        } catch (error) {
            // FAIL-OPEN GUARANTEE
            if (this.config.debug) {
                console.error('[Mafai] Internal Error (Fail-Open):', error);
            }
            return ctx.next();
        }
    }

    private async sendToEngine(payload: any): Promise<any> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(this.engineUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Engine returned ${response.status}`);
        }

        return await response.json();
    }

    private blockRequest(ctx: UnifiedContext): void {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Request Blocked | MAF</title>
    <style>
        :root {
            --bg-color: #f8f9fa;
            --card-bg: #ffffff;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --accent-red: #ef4444;
            --border-color: #e5e7eb;
        }
        body {
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: var(--card-bg);
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            max-width: 480px;
            width: 100%;
            text-align: center;
            border: 1px solid var(--border-color);
        }
        .icon {
            width: 64px;
            height: 64px;
            margin-bottom: 24px;
            color: var(--accent-red);
        }
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: var(--text-primary);
        }
        p {
            font-size: 16px;
            line-height: 1.5;
            color: var(--text-secondary);
            margin: 0 0 24px 0;
        }
        .divider {
            height: 1px;
            background-color: var(--border-color);
            margin: 24px 0;
        }
        .footer {
            font-size: 12px;
            color: var(--text-secondary);
        }
        .brand {
            font-weight: 600;
            color: var(--text-primary);
        }
    </style>
</head>
<body>
    <div class="container">
        <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1>Request Blocked</h1>
        <p>
            Your request was flagged as potentially malicious and has been blocked by the firewall security policy.
        </p>
        <div class="divider"></div>
        <div class="footer">
            Secured by <span class="brand">MAF Middleware</span>
        </div>
    </div>
</body>
</html>`;
        ctx.res.setHeader('Content-Type', 'text/html');
        ctx.res.status(403).send(html);
    }
}
