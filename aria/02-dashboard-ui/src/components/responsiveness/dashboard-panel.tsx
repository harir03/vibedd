"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/primitives/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives/card"

export default function DashboardPanel({ user }: { user: any }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const storedKey = localStorage.getItem("api key")
    if (storedKey) {
      setApiKey(storedKey)
    }
  }, [])

  const generateApiKey = () => {
    // Generate 16 random characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setApiKey(result)
    localStorage.setItem("api key", result)
  }

  const copyKey = () => {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto px-4 md:px-6 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-24 max-w-6xl mx-auto">
        
        {/* API Key Management Card */}
        <Card className="w-full border-white/10 bg-black/60 backdrop-blur-xl h-fit">
            <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold">Welcome, {user.name ?? user.email}</CardTitle>
            <CardDescription>
                Manage your API secret keys. These keys are saved locally on your device.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-border p-4 bg-muted/50">
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                    <span className="text-sm font-medium text-muted-foreground">Current API Key</span>
                    {apiKey ? (
                    <code className="font-mono text-base md:text-lg font-semibold tracking-wide text-foreground truncate block w-full">
                        {apiKey}
                    </code>
                    ) : (
                    <span className="text-sm text-muted-foreground italic">No API key generated yet</span>
                    )}
                </div>
                {apiKey && (
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyKey}
                    className="h-8 shrink-0"
                    >
                    {copied ? "Copied!" : "Copy"}
                    </Button>
                )}
                </div>

                <div className="flex justify-end">
                <Button onClick={generateApiKey} className="w-full sm:w-auto">
                    {apiKey ? "Regenerate Key" : "Generate New Key"}
                </Button>
                </div>
            </div>

            <div className="pt-4 border-t border-border">
                <Button
                variant="link"
                className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
                onClick={() => {
                    localStorage.removeItem("api key");
                    window.location.href = "/auth/logout";
                }}
                >
                Log out
                </Button>
            </div>
            </CardContent>
        </Card>

        {/* What's New Card */}
        <Card className="w-full border-white/10 bg-black/60 backdrop-blur-xl h-fit">
            <CardHeader>
            <CardTitle className="text-lg md:text-xl font-bold">What's New</CardTitle>
            <CardDescription>Latest updates and changes to the system.</CardDescription>
            </CardHeader>
            <CardContent>
            <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                <span className="flex h-2 w-2 min-w-2 translate-y-2 rounded-full bg-green-500" />
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Security Dashboard Live</p>
                    <p className="text-sm text-muted-foreground">
                    You can now generate and manage secure API keys directly from your dashboard.
                    Keys are stored locally for enhanced privacy.
                    </p>
                </div>
                </li>
                <li className="flex gap-3 items-start">
                <span className="flex h-2 w-2 min-w-2 translate-y-2 rounded-full bg-blue-500" />
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Visual Enhancements</p>
                    <p className="text-sm text-muted-foreground">
                    Updated dashboard UI to match the new design system with glassmorphism effects.
                    </p>
                </div>
                </li>
                <li className="flex gap-3 items-start">
                <span className="flex h-2 w-2 min-w-2 translate-y-2 rounded-full bg-purple-500" />
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Performance</p>
                    <p className="text-sm text-muted-foreground">
                    Optimized loading sequences and authentication stability improvements.
                    </p>
                </div>
                </li>
            </ul>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
