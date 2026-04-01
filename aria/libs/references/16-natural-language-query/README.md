# 16 — Natural Language Query

**Tier:** 3 (Secondary WOW)  
**Status:** TO BUILD  
**Priority:** 3.5

## What This Does

Allows analysts to **ask questions in plain English** instead of writing database queries. "Show me all SQL injection attempts from China in the last 24 hours" gets translated into a MongoDB query + vector search and returns results.

### Why It Matters
Not all SOC analysts know MongoDB query syntax. Natural language makes the system accessible to anyone. It's also impressive in a demo — type a question, get an instant visualization.

### What to Build

#### 1. Query Translator (LLM-based)
```typescript
async function naturalLanguageQuery(question: string): Promise<QueryResult> {
  const prompt = `
    You are a query translator for a banking security system.
    
    Available data collections:
    - alerts: { timestamp, sourceIP, category, severity, fidelityScore, path, method, ... }
    - incidents: { title, severity, category, alertIds, sourceIPs, status, ... }
    - feedback: { alertId, analystId, decision, notes, ... }
    
    Translate this natural language question into a MongoDB query:
    "${question}"
    
    Respond with JSON: { "collection": "...", "filter": {...}, "sort": {...}, "limit": N }
  `;
  
  const querySpec = await ollama.generate({ model: 'mistral', prompt });
  const parsed = JSON.parse(querySpec);
  
  // Execute the generated query safely
  const results = await db.collection(parsed.collection)
    .find(parsed.filter)
    .sort(parsed.sort)
    .limit(parsed.limit)
    .toArray();
  
  return { query: parsed, results, naturalAnswer: await summarizeResults(results, question) };
}
```

#### 2. Example Queries
```
"How many critical incidents happened this week?"
"Show me the top 5 source IPs by alert count"
"What attack types are most common after midnight?"
"Find all credential stuffing attempts targeting premium accounts"
"Compare false positive rates between regex and AI detection"
"What did the agent learn yesterday?"
```

#### 3. Chat Interface Component
```tsx
function QueryChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <UserBubble text={msg.text} />
            ) : (
              <SystemBubble text={msg.text} chart={msg.chart} table={msg.table} />
            )}
          </div>
        ))}
      </div>
      <QueryInput onSubmit={handleQuery} />
    </div>
  );
}
```

### Tech Stack
- **Ollama + Mistral** — NL → MongoDB query translation
- **Next.js** — chat UI page
- **MongoDB** — query execution
- **ChromaDB** — hybrid vector+keyword search (Feature 15)

### Integration Points
- **Uses:** Feature 15 (Vector Memory) — semantic search for complex queries
- **Reads from:** All MongoDB collections (alerts, incidents, feedback, etc.)
- **Renders in:** Feature 02 (Dashboard UI) — as `/query` route

### Security Considerations
- Sanitize generated MongoDB queries to prevent injection
- Limit query scope to read-only operations
- Add query timeout to prevent DoS via expensive queries
- Log all queries for audit
