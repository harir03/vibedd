import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/primitives/card";
import { SlideIn } from "@/components/ui/effects/slide-in";

const features = [
    {
        title: "Accessible",
        description: "Built on reliable primitives for maximum accessibility access.",
    },
    {
        title: "Themable",
        description: "Customizable with CSS variables to match your brand.",
    },
    {
        title: "Lightweight",
        description: "No runtime styles. Just standard React and CSS.",
    },
    {
        title: "Composable",
        description: "Build your own specialized components from these blocks.",
    },
    {
        title: "Open Source",
        description: "Free to use for personal and commercial projects.",
    },
    {
        title: "Modern",
        description: "Leverages the latest React and Next.js features.",
    },
];

function FeatureCard({ feature, index }: { feature: any; index: number }) {
    return (
        <SlideIn delay={index * 100} className="h-full">
            <Card className="h-full bg-card border-muted/40 hover:border-border transition-colors">
                <CardHeader>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-20 w-full rounded bg-muted/20 border border-muted/10 animate-pulse" />
                </CardContent>
            </Card>
        </SlideIn>
    );
}

export function FeatureGrid() {
    return (
        <section id="features" className="py-24 bg-muted/30">
            <div className="container mx-auto px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Features</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to build great dashboards and landing pages.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <FeatureCard key={i} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
