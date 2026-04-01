import { DocsSection } from "@/components/docs/docs-section";
import { FeatureCard } from "./FeatureCard";

export function CoreFeatures() {
    return (
        <DocsSection id="core-features" title="Core Features">
            <div className="grid md:grid-cols-2 gap-6 not-prose">
                <FeatureCard
                    title="Session Continuity Validation"
                    description="Prevents session hijacking by analyzing token usage patterns and device consistency. Powered by behavioral biometrics (see References)."
                />
                <FeatureCard
                    title="Device Spoofing Detection"
                    description="Identifies mismatched signatures between the user agent, network signals, and historical device fingerprints."
                />
                <FeatureCard
                    title="Malicious Payload Detection"
                    description="Scans bodies and params for SQLi, XSS, and other common attack vectors before they reach your DB."
                />
                <FeatureCard
                    title="API Abuse Protection"
                    description="Rate limiting and pattern recognition to stop automation attacks and scrapers."
                />
            </div>
            <div className="mt-6">
                <h3>Real-time Enforcement</h3>
                <p>
                    Decisions are made in real-time. You can configure responses to simply log (Monitor Mode) or actively block threats. All decisions are replayable and explainable via the dashboard.
                </p>
            </div>
        </DocsSection>
    );
}
