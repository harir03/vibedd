"use client";

import * as React from "react";

export function FeatureCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <h4 className="font-semibold mb-2 text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
