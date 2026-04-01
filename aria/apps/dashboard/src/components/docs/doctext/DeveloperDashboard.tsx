import { DocsSection } from "@/components/docs/docs-section";

export function DeveloperDashboard() {
    return (
        <DocsSection id="developer-dashboard" title="Developer Dashboard">
            <p>
                The dashboard is a standalone application that runs on a separate port (local dev) or hosted cloud URL (prod).
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Live Feed:</strong> Watch requests come in real-time with risk scores.</li>
                <li><strong>Attack Replay:</strong> Re-run a past request against current rules to see if it would still be blocked.</li>
                <li><strong>Forensics:</strong> Deep dive into specific blocked requests to see exactly <em>why</em> they were flagged (e.g., "User Agent mismatch + High Velocity").</li>
            </ul>
        </DocsSection>
    );
}
