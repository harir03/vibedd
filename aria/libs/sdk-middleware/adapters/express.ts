import type { Request, Response, NextFunction } from 'express';
import { MafaiCore } from '../core/index.js';
import { UnifiedContext, MafaiConfig } from '../core/types.js';

/**
 * Express adapter for Mafai.
 * Usage:
 * app.use(mafaiExpress({ ...config }));
 */
export const mafaiExpress = (config?: MafaiConfig) => {
    const core = new MafaiCore(config);

    return (req: Request, res: Response, next: NextFunction) => {
        const context: UnifiedContext = {
            req: {
                headers: req.headers,
                method: req.method,
                url: req.originalUrl || req.url,
                body: req.body,
                query: req.query as Record<string, string | string[] | undefined>,
                ip: req.ip,
                params: req.params,
            },
            res: {
                status: (code: number) => {
                    res.status(code);
                    return context.res;
                },
                send: (body: any) => {
                    res.send(body);
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
                next(err);
            }
        };

        // Execute core logic
        core.process(context).catch((err) => {
            // Should catch unexpected errors in core
            next(err);
        });
    };
};
