"use client";

import { Navbar } from "@/components/responsiveness/navbar";
import { Footer } from "@/components/responsiveness/footer";
import { Preloader } from "@/components/ui/effects/preloader";
import { DevHero } from "@/components/responsiveness/developers/dev-hero";
import { DevIntro } from "@/components/developers/dev-intro";
import { DevFlow } from "@/components/developers/dev-flow";
import { DevStack } from "@/components/developers/dev-stack";
import { DevBenefits } from "@/components/developers/dev-benefits";
import { DevThreats } from "@/components/developers/dev-threats";
import { DevCode } from "@/components/developers/dev-code";
import { DevWorkflow } from "@/components/developers/dev-workflow";
import { DevDashboardPreview } from "@/components/developers/dev-dashboard-preview";
import { DevCTA } from "@/components/developers/dev-cta";

export default function DevelopersPage() {
  return (
    <main className="flex min-h-screen flex-col selection:bg-blue-500/20 bg-black text-white">
      <Preloader />
      <Navbar />
      
      <div className="relative z-10">
          <DevHero />
          <DevIntro />
          <DevFlow />
          <DevStack />
          <DevBenefits />
          <DevThreats />
          <DevCode />
          <DevWorkflow />
          <DevDashboardPreview />
          <DevCTA />
          <Footer />
      </div>
    </main>
  );
}
