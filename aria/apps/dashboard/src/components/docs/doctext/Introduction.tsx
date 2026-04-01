import { DocsSection } from "@/components/docs/docs-section";

export function Introduction() {
    return (
        <DocsSection id="introduction" title="Introduction">
            <p className="lead">
                ARIA is an AI-assisted backend security service that <strong className="text-foreground">validates every incoming request</strong> at the application layer.
            </p>
            <p>
                In modern web architecture, backend requests cannot be trusted blindly. Traditional WAFs operate at the network edge but often lack context about the application's internal logic or user session state.
            </p>
            <p>
                ARIA solves this by sitting closer to your application logic (or continuously communicating with it), preventing session abuse, device spoofing, malicious payloads, API abuse, automation attacks, and insider misuse.
            </p>
            <div className="my-6 p-4 border border-blue-500/20 bg-blue-500/10 rounded-lg">
                <p className="text-sm font-medium text-blue-200">
                    <strong>Key Differentiator:</strong> Unlike network WAFs, ARIA is <em>application-aware</em> and <em>session-aware</em>, allowing for much more granular and deterministic security decisions.
                </p>
            </div>
        </DocsSection>
    );
}
