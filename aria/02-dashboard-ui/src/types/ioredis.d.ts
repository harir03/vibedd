// [ARIA] Type declaration for ioredis — the installed version (5.9.3) claims to ship
// types but the .d.ts files are missing from the build artifact. This declaration
// provides minimal typing so the project compiles without installing @types/ioredis.
declare module 'ioredis' {
    class Redis {
        constructor(uri?: string, options?: Record<string, unknown>);
        publish(channel: string, message: string): Promise<number>;
        subscribe(...channels: string[]): Promise<void>;
        quit(): Promise<string>;
        del(key: string): Promise<number>;
        get(key: string): Promise<string | null>;
        set(key: string, value: string, ...args: unknown[]): Promise<string>;
        lpush(key: string, ...values: string[]): Promise<number>;
        brpop(key: string, timeout: number): Promise<[string, string] | null>;
        on(event: string, callback: (...args: unknown[]) => void): this;
        connect(): Promise<void>;
        disconnect(): void;
        status: string;
    }
    export default Redis;
}
