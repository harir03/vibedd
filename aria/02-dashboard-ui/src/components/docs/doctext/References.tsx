import { DocsSection } from "@/components/docs/docs-section";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

export function References() {
    return (
        <DocsSection id="references" title="Research References">
            <p className="mb-6 text-muted-foreground">
                ARIA's architecture is built upon cutting-edge research in web security and behavioral analysis.
                We actively monitor academic developments to ensure our defenses stay ahead of novel evasion techniques.
            </p>
            <div className="grid gap-4">
                <ReferenceCard
                    title="WAFFLED: Exploiting Parsing Discrepancies to Bypass WAFs"
                    description="This paper reveals over 1200 unique evasion techniques that bypass top WAFs (Cloudflare, AWS, Azure) by exploiting parsing mismatches between the firewall and the application backend. ARIA's application-layer design inherently eliminates this entire class of vulnerability."
                    link="/references/waffled.pdf"
                    tags={["WAF Evasion", "Parsing Logic", "Core Architecture"]}
                />
                <ReferenceCard
                    title="AI-Powered Behavioral Biometrics for Continuous Authentication"
                    description="Foundational research for our Session Continuity engine. Explores the use of deep learning to analyze user behavior (keystrokes, mouse movements, gyroscope data) to detect session hijacking with 98%+ accuracy without interrupting the user."
                    link="/references/AI-Powered_Behavioral_Biometrics_for_Continuous_Authentication.pdf"
                    tags={["AI/ML", "Behavioral Analysis", "Session Security"]}
                />
            </div>
        </DocsSection>
    );
}

function ReferenceCard({ title, description, link, tags }: { title: string; description: string; link: string; tags: string[] }) {
    return (
        <Link href={link} target="_blank" className="block group">
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md hover:bg-muted/50">
                <div className="flex justify-between items-start gap-4">
                     <div className="space-y-2">
                        <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                    {tags.map((tag) => (
                        <span key={tag} className="text-xs font-mono px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}
