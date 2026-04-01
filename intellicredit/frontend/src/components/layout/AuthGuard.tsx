"use client";

import { type ReactNode } from "react";

/** 
 * AuthGuard — disabled for demo. Just renders children directly.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
