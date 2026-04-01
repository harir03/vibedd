import { DocsSection } from "@/components/docs/docs-section";

export function HowAriaWorks() {
    return (
        <DocsSection id="how-aria-works" title="How ARIA Works">
            <h3>High-Level Request Flow</h3>
            <div className="bg-muted/50 p-6 rounded-lg font-mono text-sm my-4 border border-border">
                Client &rarr; <span className="text-yellow-500">Backend Middleware</span> &rarr; <span className="text-primary font-bold">ARIA Engine</span> &rarr; Decision &rarr; Backend Logic
            </div>
            <p>
                When a request hits your backend (via our middleware or SDK), ARIA intercepts it to perform real-time analysis before any business logic is executed.
            </p>
            <div className="my-6 p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                <p className="text-sm font-medium text-yellow-200 mb-2">
                    <strong>Why this matters:</strong> Traditional network WAFs suffer from "Parsing Discrepancies."
                </p>
                <p className="text-sm text-muted-foreground">
                    As detailed in <a href="/references/waffled.pdf" target="_blank" className="underline hover:text-primary">WAFFLED (2025)</a>, attackers can bypass WAFs by mutating requests (e.g., adding <code>\x00</code> null bytes or altering multipart boundaries) so the WAF ignores them, but the backend parses them.
                    <br/><br/>
                    <strong>ARIA runs <em>inside</em> or <em>beside</em> your application logic</strong>, ensuring it sees exactly what your application sees, eliminating this gap.
                </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Signal Extraction:</strong> We extract high-fidelity signals from the request metadata, headers, device fingerprint, and behavioral patterns.</li>
                <li><strong>Session Validation:</strong> Depending on configuration, we validate the continuity of the session against known history.</li>
                <li><strong>Risk Scoring:</strong> A deterministic score is calculated based on active rules. If the score exceeds a threshold, AI agents can be optionally engaged for deeper analysis.</li>
                <li><strong>Enforcement:</strong> ARIA returns a decision: <code>ALLOW</code>, <code>BLOCK</code>, or <code>DROP_SESSION</code>.</li>
            </ul>
            <p className="mt-4">
                The architecture is <strong>rules-first, AI-optional</strong>. This ensures millisecond-latency for 99% of requests, with AI only stepping in for high-risk anomalies.
            </p>
        </DocsSection>
    );
}
