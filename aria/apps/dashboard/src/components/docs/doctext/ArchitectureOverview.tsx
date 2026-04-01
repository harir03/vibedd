import { DocsSection } from "@/components/docs/docs-section";

export function ArchitectureOverview() {
    return (
        <DocsSection id="architecture-overview" title="Architecture Overview">
            <p>
                ARIA is designed to be unobtrusive yet powerful. The system consists of three main components:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                <li><strong>Middleware / SDK:</strong> Sits in your API service (e.g., Express, Fastify, Next.js). It forwards metadata to the ARIA Engine.</li>
                <li><strong>ARIA Engine:</strong> The core decision maker. Uses <span className="text-foreground font-mono text-xs bg-muted px-1 py-0.5 rounded">Redis</span> for hot session state and fast rule lookups.</li>
                <li><strong>Audit Layer:</strong> <span className="text-foreground font-mono text-xs bg-muted px-1 py-0.5 rounded">Postgres</span> stores detailed logs for every request. An optional <strong>Blockchain Anchor</strong> service provides immutable proof of logs for compliance.</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
                <em>Note: The AI Adapter is an isolated service that is only invoked when deterministic rules flag a potential, but unconfirmed, threat.</em>
            </p>
        </DocsSection>
    );
}
