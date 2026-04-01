import { cn } from "@/lib/utils";

interface DocsSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function DocsSection({ id, title, children, className }: DocsSectionProps) {
    return (
        <section id={id} className={cn("mb-16 scroll-mt-24", className)}>
            <h2 className="text-3xl font-bold tracking-tight mb-6 font-geist-sans relative inline-block">
                {title}
                <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary/50 rounded-full" />
            </h2>
            <div className="prose prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                {children}
            </div>
        </section>
    );
}
