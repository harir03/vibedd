import type { FastifyRequest, FastifyReply } from 'fastify';
import { MafaiCore } from '../core/index.js';
import { UnifiedContext, MafaiConfig } from '../core/types.js';

/**
 * Fastify adapter for Mafai.
 * Usage:
 * fastify.addHook('onRequest', mafaiFastify({ ...config }));
 */
export const mafaiFastify = (config?: MafaiConfig) => {
    const core = new MafaiCore(config);

    return (req: FastifyRequest, reply: FastifyReply, done: (err?: any) => void) => {
        // Fastify request/reply mapping
        const context: UnifiedContext = {
            req: {
                headers: req.headers as Record<string, string | string[] | undefined>,
                method: req.method,
                url: req.url,
                body: req.body,
                query: req.query as Record<string, string | string[] | undefined>,
                ip: req.ip,
                params: req.params as Record<string, string>,
            },
            res: {
                status: (code: number) => {
                    reply.code(code);
                    return context.res;
                },
                send: (body: any) => {
                    reply.send(body);
                },
                json: (body: any) => {
                    reply.send(body);
                },
                setHeader: (key: string, value: string) => {
                    reply.header(key, value);
                },
                end: () => {
                    // Fastify handles ending response via send usually, but we can try to facilitate
                    // Often not needed if send() is called. 
                    // If we must end without body:
                    if (!reply.sent) reply.send();
                }
            },
            next: (err?: any) => {
                done(err);
            }
        };

        core.process(context).catch(err => done(err));
    };
};
