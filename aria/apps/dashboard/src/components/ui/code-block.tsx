"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
}

export function CodeBlock({ code, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className={cn("relative group rounded-lg bg-black/50 border border-border overflow-hidden", className)} {...props}>
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}
