import { DocsSection } from "@/components/docs/docs-section";
import { CodeBlock } from "@/components/ui/code-block";

export function IntegrationOverview() {
    return (
        <DocsSection id="integration-overview" title="Integration Overview">
            <p>
                We prioritize a developer-friendly integration process. Currently, we support Node.js environments with first-party middleware for common frameworks.
            </p>
            <div className="my-4">
                <CodeBlock code={`const express = require('express');
const { ariaExpress } = require('aria-sdk');

const app = express();

app.use(express.json());

app.use(ariaExpress({
    apiKey: "YOUR_ARIA_APP_KEY",
    engineUrl: "http://your-engine-ip:3001/evaluate"
}));`} />
            </div>
            <p>
                Typical rollout strategy:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Day 1:</strong> Integrate Monitor Mode. No user impact.</li>
                <li><strong>Day 2-3:</strong> Tune rules based on dashboard insights.</li>
                <li><strong>Day 4:</strong> Switch to Block Mode for high-confidence rules.</li>
            </ul>
        </DocsSection>
    );
}
