import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TATVA — Intelligence Dashboard",
  description: "Total Awareness through Temporal Validated Analysis — AI-Powered Global Ontology Engine",
  icons: {
    icon: "/tatva-icon.svg",
    shortcut: "/tatva-icon.svg",
    apple: "/tatva-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
