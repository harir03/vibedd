import { DocsSection } from "@/components/docs/docs-section";

export function EnforcementModes() {
    return (
        <DocsSection id="enforcement-modes" title="Enforcement Modes">
            <p>ARIA operates in one of three modes, configurable per-environment or per-route.</p>
            <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-background/50">
                    <h4 className="font-bold text-lg">1. Monitor Mode</h4>
                    <p className="text-muted-foreground">All requests are allowed. Threats are logged asynchronously. Perfect for initial setup and debugging.</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-background/50">
                    <h4 className="font-bold text-lg">2. Block Mode</h4>
                    <p className="text-muted-foreground">High-risk requests are blocked immediately with a <code>403 Forbidden</code> or <code>401 Unauthorized</code> response.</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-background/50">
                    <h4 className="font-bold text-lg">3. Session Drop Mode</h4>
                    <p className="text-muted-foreground">For severe violations (e.g., confirmed session hijacking), the session is invalidated globally, forcing re-authentication.</p>
                </div>
            </div>
        </DocsSection>
    );
}
