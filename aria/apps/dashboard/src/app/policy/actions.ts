"use server";

export async function createPolicyModel(policy: string) {
    // [ARIA] REMOVED: Old MAF OLLAMA_HOST default
    // const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || "http://maf-ai:11434";
    // [ARIA] NEW: ARIA AI host for Ollama
    const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || "http://aria-ai:11434";

    try {
        // [ARIA] REMOVED: Old MAF system prompt
        // const systemPrompt = `You are a strict firewall protecting a web application...`;
        // [ARIA] NEW: ARIA banking-focused system prompt
        const systemPrompt = `You are ARIA (Adaptive Response & Intelligence Agent), a strict security firewall protecting a banking web application. Your job is to analyze the user request for malicious payloads — SQL injection, XSS, credential stuffing, account takeover, API abuse, session hijacking, and violations of the company policy: ${policy}. If the request is malicious OR violates policy, block it. Return a JSON response: { "success": boolean, "reason": string, "attackType": string, "severity": "critical"|"high"|"medium"|"low"|"info", "confidence": number }. "success": true means the request is SAFE. "success": false means blocked.`;

        console.log(`Checking for mistral model at ${OLLAMA_BASE_URL}...`);

        let hasBaseModel = false;
        try {
            const tagsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
            if (tagsResponse.ok) {
                const tagsData = await tagsResponse.json();
                hasBaseModel = tagsData.models.some((m: any) => m.name.startsWith("mistral"));
            } else {
                console.warn("Failed to check tags, proceeding with assumption or pull attempt.");
            }
        } catch (e) {
            console.error("Failed to connect to Ollama /api/tags:", e);
            throw new Error(`Could not connect to Ollama at ${OLLAMA_BASE_URL}. Is it running?`);
        }

        if (!hasBaseModel) {
            console.log("mistral not found. Pulling model (this may take a while)...");
            const pullResponse = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "mistral", stream: false })
            });

            if (!pullResponse.ok) {
                return { success: false, error: "Failed to pull base model 'mistral'. Please allow time or pull manually via 'ollama pull mistral'." };
            }
            console.log("mistral pulled successfully.");
        }

        console.log("Sending Create Model payload to Ollama...");

        // [ARIA] REMOVED: Old MAF model name 'maf-policeman'
        // body: JSON.stringify({ model: "maf-policeman", ... })
        // [ARIA] NEW: ARIA model name 'aria-policeman'
        const response = await fetch(`${OLLAMA_BASE_URL}/api/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "aria-policeman",
                from: "mistral",
                system: systemPrompt,
                stream: false
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to create model:", errorText);
            return { success: false, error: `Ollama API Error: ${response.status} - ${errorText}` };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Error creating policy model:", error);
        const msg = error instanceof Error ? error.message : "Unknown error occurred";
        return { success: false, error: `Connection failed: ${msg}` };
    }
}

// [ARIA] REMOVED: Old MAF model filter function
// export async function getMafModels() { ... filters by m.name.startsWith("maf") }
// [ARIA] NEW: ARIA model filter function
export async function getAriaModels() {
    const OLLAMA_BASE_URL = process.env.OLLAMA_HOST || "http://aria-ai:11434";
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        // [ARIA] Filter for ARIA custom models (aria-* prefix) and base models (mistral)
        return data.models
            .filter((m: any) => m.name.startsWith("aria") || m.name.startsWith("mistral"))
            .map((m: any) => ({
                name: m.name,
                modified_at: m.modified_at,
                size: m.size
            }));
    } catch (e) {
        console.error("Failed to fetch models", e);
        return [];
    }
}
