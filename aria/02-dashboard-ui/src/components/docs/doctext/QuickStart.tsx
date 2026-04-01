import { DocsSection } from "@/components/docs/docs-section";
import { CodeBlock } from "@/components/ui/code-block";

export function QuickStart() {
    return (
        <DocsSection id="quick-start" title="Quick Start">
            <h3>Installation</h3>
            <div className="my-4">
                <CodeBlock code="npm install aria-sdk" />
            </div>

        </DocsSection>
    );
}
