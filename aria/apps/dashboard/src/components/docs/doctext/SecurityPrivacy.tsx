import { DocsSection } from "@/components/docs/docs-section";

export function SecurityPrivacy() {
    return (
        <DocsSection id="security-privacy" title="Security & Privacy">
            <div className="flex flex-col gap-4">
                <div className="p-4 border border-green-500/20 bg-green-500/10 rounded-lg">
                    <h4 className="font-bold text-green-400 mb-2">No Raw Secrets</h4>
                    <p className="text-sm">ARIA creates hashes of sensitive data (like passwords or PII) before they leave your infrastructure. We never store raw secrets.</p>
                </div>
                <div>
                    <p>
                        We offer <strong>On-Prem / Self-Host</strong> support for enterprise requirements, ensuring data never leaves your VPC.
                    </p>
                    <p>
                        Our audit trails are compliance-ready, suitable for SOC2 and ISO27001 requirements.
                    </p>
                </div>
            </div>
        </DocsSection>
    );
}
