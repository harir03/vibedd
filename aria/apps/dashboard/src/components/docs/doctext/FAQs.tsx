import { DocsSection } from "@/components/docs/docs-section";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/primitives/accordion";

export function FAQs() {
    return (
        <DocsSection id="faqs" title="FAQs">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>How is this different from a WAF?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        WAFs protect the network edge. ARIA protects the application logic. We understand users, sessions, and business rules, not just IP addresses and packets.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Does ARIA add latency?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        Minimal. In deterministic mode, overhead is &lt;5ms. Optional AI analysis runs asynchronously or only on high-risk triggers.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Can this run without AI?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        Yes. The core engine is deterministic. AI is an optional add-on for advanced threat hunting.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Is blockchain mandatory?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        No. It is an optional feature for customers requiring immutable audit trails.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>How is pricing structured?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        We charge based on request volume and active seats. See our <a href="/pricing" className="text-primary hover:underline">pricing page</a> for details. The developer edition is free for up to 10k requests/month.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </DocsSection>
    );
}
