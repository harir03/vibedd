import type { NextApiRequest, NextApiResponse } from 'next';
import { MafaiCore } from '../core/index.js';
import { UnifiedContext, MafaiConfig } from '../core/types.js';

/**
 * Next.js API Route adapter for Mafai.
 * Usage:
 * export default withMafai(handler, { ...config });
 */
export const withMafai = (
    handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
    config?: MafaiConfig
) => {
    const core = new MafaiCore(config);

    return async (req: NextApiRequest, res: NextApiResponse) => {
        // We need to promisify the core middleware execution for Next.js API
        // because it doesn't have a native 'next' callback chain for this wrapper pattern usually.
        // However, we can simulate `next` by resolving a promise.

        const runMiddleware = () => new Promise<void>((resolve, reject) => {
            const context: UnifiedContext = {
                req: {
                    headers: req.headers,
                    method: req.method || 'GET',
                    url: req.url || '/',
                    body: req.body,
                    query: req.query as Record<string, string | string[] | undefined>,
                    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
                    // NextApiRequest params are in query or need extraction, usually query has them.
                    params: req.query as Record<string, string>,
                },
                res: {
                    status: (code: number) => {
                        res.status(code);
                        return context.res;
                    },
                    send: (body: any) => {
                        res.send(body);
                        // If we send, we implicitly resolve/end, but we should let the handler know or stop?
                        // If core sends response (blocking), we should NOT call handler.
                        // But how to signal "stop"?
                        // If middleware sends response, the promise resolves, but we need to know IF we should continue.
                        // The UnifiedContext 'next' is what calls resolve.
                        // If 'next' is NOT called, we effectively hang or stop.
                    },
                    json: (body: any) => {
                        res.json(body);
                    },
                    setHeader: (key: string, value: string) => {
                        res.setHeader(key, value);
                    },
                    end: () => {
                        res.end();
                    }
                },
                next: (err?: any) => {
                    if (err) reject(err);
                    else resolve();
                }
            };

            core.process(context).catch(reject);
        });

        try {
            // If runMiddleware resolves, it means `next()` was called => we proceed to handler.
            // If it stays pending (because response was sent and next not called), we await forever? 
            // No, core.process is async. If it finishes without calling next, we shouldn't necessarily hang, 
            // but in the wrapper pattern, we need to know if we should call handler.
            // Actually, if core blocks (sends response), it generally won't call next().
            // But we need to *wait* for valid processing.
            // If core returns *and* next wasn't called, it implies the request was handled/interrupted.
            // We can use a flag.

            let nextCalled = false;
            const context: UnifiedContext = {
                req: {
                    headers: req.headers,
                    method: req.method || 'GET',
                    url: req.url || '/',
                    body: req.body,
                    query: req.query as Record<string, string | string[] | undefined>,
                    ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
                    params: req.query as Record<string, string>,
                },
                res: {
                    status: (code: number) => { res.status(code); return context.res; },
                    send: (body: any) => { res.send(body); },
                    json: (body: any) => { res.json(body); },
                    setHeader: (key: string, value: string) => { res.setHeader(key, value); },
                    end: () => { res.end(); },
                },
                next: (err?: any) => {
                    if (err) throw err;
                    nextCalled = true;
                }
            };

            await core.process(context);

            if (nextCalled) {
                return handler(req, res);
            }
            // If next not called, assume response sent by middleware.
        } catch (error) {
            console.error('Mafai Middleware Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
