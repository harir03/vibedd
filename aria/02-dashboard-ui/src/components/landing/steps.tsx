import { Badge } from "@/components/ui/primitives/badge";
import { SlideIn } from "@/components/ui/effects/slide-in";

const steps = [
    {
        step: 1,
        title: "Install dependencies",
        description: "Install the latest version of Tailwind CSS and the necessary utilities.",
    },
    {
        step: 2,
        title: "Copy the code",
        description: "Copy the component code into your project. No npm install required for components.",
    },
    {
        step: 3,
        title: "Customize",
        description: "Change the styles, variables, and behavior to fit your needs.",
    },
];

export function Steps() {
    return (
        <section className="py-24">
            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
                <div className="sticky top-24">
                    <Badge variant="outline" className="mb-4">How it works</Badge>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">
                        Simple integration
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8">
                        Add components to your project in three simple steps. No complex configuration required.
                    </p>
                </div>

                <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[1px] before:bg-border">
                    {steps.map((item, index) => (
                        <SlideIn key={item.step} delay={index * 100} className="relative">
                            <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full border bg-background text-xs font-mono text-muted-foreground">
                                {item.step}
                            </span>
                            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                        </SlideIn>
                    ))}
                </div>
            </div>
        </section>
    );
}
