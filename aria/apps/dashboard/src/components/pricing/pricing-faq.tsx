"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/primitives/accordion";
import { SlideIn } from "@/components/ui/effects/slide-in";

const faqs = [
    {
        question: "How Does ARIA pricing work?",
        answer: "ARIA charges based on the monthly request volume and the feature tier you select. The Free tier is generous enough for side projects, while Pro and Team tiers offer advanced security features for production applications."
    },
    {
        question: "Can I try Pro features before paying?",
        answer: "Yes! We offer a 14-day free trial for the Pro and Team tiers so you can experience the full power of our risk engine and session profiling tools."
    },
    {
        question: "What happens if I exceed my request limit?",
        answer: "We won't block your legitimate traffic. On the Free tier, we'll notify you to upgrade. On paid tiers, we charge a small overage fee per 10k additional requests."
    },
    {
        question: "Is the Audit Log Anchoring included?",
        answer: "Audit Log Anchoring is an optional add-on available for Enterprise and compliant-sensitive Team plans. It ensures your logs are tamper-proof."
    },
    {
        question: "Do you offer discounts for open source projects?",
        answer: "Absolutely. If you're building open source software, contact us and we'll set you up with a sponsored Pro account."
    }
];

export function PricingFAQ() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-6 max-w-4xl">
                <SlideIn>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">Everything you need to know About ARIA billing.</p>
                    </div>
                </SlideIn>

                <SlideIn delay={100}>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </SlideIn>
            </div>
        </section>
    );
}
