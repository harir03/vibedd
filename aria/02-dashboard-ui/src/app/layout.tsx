import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

// [ARIA] REMOVED: MAF Dashboard metadata
// export const metadata: Metadata = {
//   title: "MAF Dashboard",
//   description: "Next Generation Multi-layer Application Firewall",
//   icons: {
//     icon: "/eaglelogoBlack.svg",
//     shortcut: "/eaglelogoBlack.svg",
//     apple: "/eaglelogoBlack.svg",
//   },
// };
// [ARIA] NEW: ARIA Dashboard branding
export const metadata: Metadata = {
  title: "ARIA Dashboard",
  description: "Adaptive Response & Intelligence Agent — Self-Evolving Cyber Incident Response",
  icons: {
    icon: "/favicon.ico",
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
