export interface UnifiedRequest {
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    body?: any;
    query?: Record<string, string | string[] | undefined>;
    ip?: string;
    params?: Record<string, string>;
}

export interface UnifiedResponse {
    status(code: number): UnifiedResponse;
    send(body: any): void;
    json(body: any): void;
    setHeader(key: string, value: string): void;
    end(): void;
}

export interface UnifiedContext {
    req: UnifiedRequest;
    res: UnifiedResponse;
    /**
     * Universal next function.
     * If called with an error, it signals a failure/error to the framework.
     */
    next: (err?: any) => void;
}

export type MafaiConfig = {
    enabled?: boolean;
    debug?: boolean;
    apiKey?: string;
    modelName?: string;
    engineUrl?: string;
};
