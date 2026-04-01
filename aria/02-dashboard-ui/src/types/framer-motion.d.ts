// [ARIA] Type declarations for third-party modules missing type definitions.
// These are pre-existing issues from the original maf-app codebase.

declare module 'framer-motion' {
    import { ComponentType, ReactNode, CSSProperties } from 'react';

    export interface MotionProps {
        initial?: Record<string, unknown> | string;
        animate?: Record<string, unknown> | string;
        exit?: Record<string, unknown> | string;
        transition?: Record<string, unknown>;
        whileHover?: Record<string, unknown>;
        whileTap?: Record<string, unknown>;
        variants?: Record<string, Record<string, unknown>>;
        style?: CSSProperties;
        className?: string;
        children?: ReactNode;
        key?: string | number;
        layout?: boolean | string;
        layoutId?: string;
        [key: string]: unknown;
    }

    export const motion: {
        [key: string]: ComponentType<MotionProps & Record<string, unknown>>;
    };

    export const AnimatePresence: ComponentType<{
        children?: ReactNode;
        mode?: 'sync' | 'wait' | 'popLayout';
        initial?: boolean;
        onExitComplete?: () => void;
        [key: string]: unknown;
    }>;

    export function useAnimation(): unknown;
    export function useMotionValue(initial: number): unknown;
    export function useTransform(value: unknown, input: number[], output: unknown[]): unknown;
}
