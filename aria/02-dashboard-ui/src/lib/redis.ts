import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

// [ARIA] Redis channels used by the ARIA platform:
// - 'aria-config-reload': Notify gateway of config changes (publish from dashboard)
// - 'aria-patterns-reload': Notify gateway of new dynamic patterns
// - 'aria-alerts': Real-time alert notifications

const getRedisClient = () => {
    logger.info(`Initializing Redis client with URI: ${REDIS_URI}`);
    const client = new Redis(REDIS_URI, {
        lazyConnect: true
    });

    client.on('error', (err: unknown) => {
        logger.error('Redis Client Error', err as Error);
    });

    client.on('connect', () => {
        logger.info('Redis Client Connected');
    });

    return client;
};

// Use global singleton for Redis in development similar to Mongoose
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || getRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
