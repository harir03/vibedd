"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/primitives/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/primitives/navigation-menu";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const securityFeatures: { title: string; href: string; description: string }[] = [
    {
        title: "Data Handling",
        href: "#",
        description: "Encryption at rest and in transit. GDPR compliant.",
    },
    {
        title: "Audit Logs",
        href: "#",
        description: "Immutable logs stored on Postgres with blockchain anchoring.",
    },
    {
        title: "Deployment",
        href: "#",
        description: "Edge, Cloud, or On-Premise options available.",
    },
];

export function Navbar() {
    const [profile, setProfile] = React.useState<any>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);

    React.useEffect(() => {
        let mounted = true;
        fetch('/auth/profile')
            .then((res) => {
                if (!res.ok) throw new Error('not-authenticated');
                return res.json();
            })
            .then((data) => {
                if (mounted) setProfile(data);
            })
            .catch(() => {
            });
        return () => {
            mounted = false;
        };
    }, []);

    React.useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isMenuOpen]);

    return (
        <>
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-7xl rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl supports-[backdrop-filter]:bg-black/30 transition-all duration-300">
                <div className="flex h-14 md:h-18 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/eaglelogoWhite.svg" alt="ARIA Logo" width={54} height={54} className="h-8 w-auto md:h-12" />
                            <span className="font-jersey-20 text-3xl md:text-4xl font-bold text-white">ARIA</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-1">
                            <NavigationMenu>
                                <NavigationMenuList className="gap-1">
                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                                Home
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/#use-cases" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                                Use Cases
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/docs" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                                Docs
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/builds" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                                Builds
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/developers" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                                Developers
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white data-[active]:bg-transparent data-[state=open]:bg-transparent h-9">Security</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-black/90 border border-white/10 backdrop-blur-xl rounded-xl">
                                                {securityFeatures.map((feature) => (
                                                    <ListItem
                                                        key={feature.title}
                                                        title={feature.title}
                                                        href={feature.href}
                                                    >
                                                        {feature.description}
                                                    </ListItem>
                                                ))}
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <NavigationMenuLink asChild>
                                            <Link href="/pricing" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                                Pricing
                                            </Link>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>

                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            {profile?.user ? (
                                <>
                                    <span className="hidden lg:inline-flex text-sm text-white">Hi, {profile.user.name ?? profile.user.email}</span>
                                    <Link href="/dashboard">
                                    <Button variant="outline" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-white hover:bg-transparent">
                                        Dashboard
                                    </Button>
                                    </Link>
                                    <Button asChild className="hidden sm:inline-flex rounded-lg bg-white text-black hover:bg-white/90 font-medium px-6 h-9 gap-2 text-sm">
                                        <a href="/auth/logout">Logout</a>
                                    </Button>
                                </>
                            ) : (
                                <Link href={"/auth/login?returnTo=/dashboard"}>
                                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-white hover:bg-transparent">
                                    Login
                                </Button>
                                </Link>
                            )}
                            <Button asChild className="rounded-lg bg-white text-black hover:bg-white/90 font-medium px-6 h-9 gap-2 text-sm">
                                <Link href="https://github.com/Jitesh-Yadav01/aria" target="_blank">
                                    <Github className="w-4 h-4" />
                                    Star on GitHub
                                </Link>
                            </Button>
                        </div>

                        <button 
                            className="md:hidden p-2 text-white/80 hover:text-white"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                            className="fixed top-2 right-2 bottom-2 w-[calc(100%-16px)] max-w-[320px] bg-[#0A0A0A] rounded-2xl border border-white/10 z-[70] p-6 flex flex-col shadow-2xl overflow-hidden"
                            style={{ maxHeight: "calc(100vh - 16px)" }}
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                <span className="font-jersey-20 text-2xl font-bold text-white tracking-wide">Menu</span>
                                <button 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar flex-1 -mx-2 px-2">
                                <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">Home</Link>
                                <Link href="/#use-cases" onClick={() => setIsMenuOpen(false)} className="text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">Use Cases</Link>
                                <Link href="/docs" onClick={() => setIsMenuOpen(false)} className="text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">Docs</Link>
                                <Link href="/builds" onClick={() => setIsMenuOpen(false)} className="text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">Builds</Link>
                                <Link href="/developers" onClick={() => setIsMenuOpen(false)} className="text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">Developers</Link>
                                <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">Pricing</Link>
                                
                                <div className="py-2">
                                    <button 
                                        onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                                        className="flex items-center justify-between w-full text-[15px] font-medium text-muted-foreground hover:text-white py-3 px-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                                    >
                                        Security
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isSecurityOpen && "rotate-180")} />
                                    </button>
                                    <AnimatePresence>
                                        {isSecurityOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-4 flex flex-col gap-1 pb-2">
                                                    {securityFeatures.map((feature) => (
                                                        <Link 
                                                            key={feature.title}
                                                            href={feature.href}
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className="text-[13px] text-muted-foreground/80 hover:text-white py-2 px-2 block rounded-md hover:bg-white/5"
                                                        >
                                                            {feature.title}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="h-px bg-white/5 my-4 mx-2" />

                                {profile?.user ? (
                                    <div className="flex flex-col gap-3 px-2">
                                        <div className="text-sm text-white/50 px-1 mb-1">Signed in as {profile.user.name ?? profile.user.email}</div>
                                         <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="outline" className="w-full justify-center text-white border-white/10 hover:bg-white/5 h-10">
                                                Dashboard
                                            </Button>
                                         </Link>
                                         <a href="/auth/logout" className="w-full">
                                            <Button className="w-full bg-white text-black hover:bg-white/90 h-10">
                                                Logout
                                            </Button>
                                         </a>
                                    </div>
                                ) : (
                                    <Link href="/auth/login?returnTo=/dashboard" onClick={() => setIsMenuOpen(false)} className="px-2">
                                        <Button className="w-full bg-white text-black hover:bg-white/90 h-10">
                                            Login
                                        </Button>
                                    </Link>
                                )}
                                
                                <Link href="https://github.com/Jitesh-Yadav01/aria" target="_blank" onClick={() => setIsMenuOpen(false)} className="px-2 mt-2">
                                     <Button variant="outline" className="w-full gap-2 border-white/10 text-white hover:bg-white/5 h-10">
                                        <Github className="w-4 h-4" /> Star on GitHub
                                     </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
