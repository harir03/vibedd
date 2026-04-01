import { Introduction } from "@/components/docs/doctext/Introduction";
import { HowAriaWorks } from "@/components/docs/doctext/HowAriaWorks";
import { CoreFeatures } from "@/components/docs/doctext/CoreFeatures";
import { ArchitectureOverview } from "@/components/docs/doctext/ArchitectureOverview";
import { QuickStart } from "@/components/docs/doctext/QuickStart";
import { IntegrationOverview } from "@/components/docs/doctext/IntegrationOverview";
import { EnforcementModes } from "@/components/docs/doctext/EnforcementModes";
import { DeveloperDashboard } from "@/components/docs/doctext/DeveloperDashboard";
import { SecurityPrivacy } from "@/components/docs/doctext/SecurityPrivacy";
import { FAQs } from "@/components/docs/doctext/FAQs";
import { References } from "@/components/docs/doctext/References";
import TrueFocus from "@/components/ui/true-focus";

export default function DocsPage() {
    return (
        <div className="space-y-12">
            <div className="border-b border-border/50 pb-8 mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">Documentation</h1>
                <p className="text-xl text-muted-foreground mb-8">
                    Complete guide to integrating and using ARIA (Adaptive Response & Intelligence Agent) to secure your applications.
                </p>
                <div className="w-full h-32 flex items-center justify-start overflow-hidden -ml-px">
                     <TrueFocus 
                        sentence="Validate Analyze Enforce Protect"
                        manualMode={false}
                        blurAmount={3}
                        borderColor="#B19EEF"
                        glowColor="rgba(177, 158, 239, 0.6)"
                        animationDuration={0.4}
                        pauseBetweenAnimations={0.8}
                    />
                </div>
            </div>

            <Introduction />
            <HowAriaWorks />
            <CoreFeatures />
            <ArchitectureOverview />
            <QuickStart />
            <IntegrationOverview />
            <EnforcementModes />
            <DeveloperDashboard />
            <SecurityPrivacy />
            <References />
            <FAQs />
        </div>
    );
}
