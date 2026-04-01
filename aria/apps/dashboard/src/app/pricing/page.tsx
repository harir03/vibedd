import { Navbar } from "@/components/responsiveness/navbar";
import { Pricing } from "@/components/pricing/pricing";
import { PricingFeatures } from "@/components/pricing/pricing-features";
import { PricingAddons } from "@/components/pricing/pricing-addons";
import { PricingFAQ } from "@/components/pricing/pricing-faq";
import { CTA } from "@/components/home/cta";
import { Footer } from "@/components/responsiveness/footer";

export default function PricingPage() {
    return (
        <main className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
            <Navbar />
            <div className="pt-24">
                <Pricing />
                <PricingFeatures />
                <PricingAddons />
                <PricingFAQ />
            </div>
            <CTA />
            <Footer />
        </main>
    );
}
