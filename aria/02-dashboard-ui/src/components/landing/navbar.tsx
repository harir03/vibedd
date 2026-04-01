"use client";

import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

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
import React from "react";

// Placeholder data for dropdowns
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
                /* not logged in or error, keep profile null */
            });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-7xl rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl supports-[backdrop-filter]:bg-black/30">
            <div className="flex h-18 items-center justify-between px-6">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/eaglelogoWhite.svg" alt="ARIA Logo" width={54} height={54} className="h-12 w-auto" />
                        <span className="font-jersey-20 text-4xl font-bold text-white">ARIA</span>
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
                </div>
            </div>
        </nav>
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
