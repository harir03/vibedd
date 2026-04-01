import type { Metadata } from "next";
import { Navbar } from "@/components/responsiveness/navbar";
import { Footer } from "@/components/responsiveness/footer";
import { DocsSidebar } from "@/components/docs/docs-sidebar";


export const metadata: Metadata = {
    title: "Uses | ARIA - Adaptive Response & Intelligence Agent",
    description: "Documentation for integrating and using ARIA in your applications.",
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="fixed inset-0 -z-50 h-screen w-full opacity-30 pointer-events-none">

            </div>

            <Navbar />

            <div className="container mx-auto flex-1 flex gap-12 px-6 pt-32 pb-12">
                <DocsSidebar />
                <main className="flex-1 w-full min-w-0">
                    {children}
                </main>
            </div>

            <Footer />
        </div>
    );
}
