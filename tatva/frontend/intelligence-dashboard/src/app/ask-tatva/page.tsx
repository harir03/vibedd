"use client";

import { MessageSquare, Send, Sparkles } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Show all defense agreements between India and France",
  "What is the connection between Adani and Australia?",
  "Timeline of India-China relations 2020-2025",
  "Impact of CHIPS Act on Indian semiconductor industry",
  "Who are the key actors in the QUAD alliance?",
  "Show trade relationships between BRICS nations",
];

export default function AskTatvaPage() {
  return (
    <div className="p-4 space-y-6 max-w-[1000px] mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🔱</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Ask TATVA</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Ask questions about geopolitics, defense, economics, and more.
          TATVA translates your questions into knowledge graph queries and provides sourced answers.
        </p>
      </div>

      {/* Query Input */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <textarea
              placeholder="Ask anything... e.g., 'What are India's defense partnerships in the Indo-Pacific?'"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none resize-none min-h-[80px]"
              readOnly
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm">
            <Send className="w-4 h-4" />
            Ask
          </button>
        </div>
      </div>

      {/* Answer Area (Stub) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-slate-600 font-bold mb-2">Natural Language Query Engine</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          NL→Cypher translation and RAG-based reasoning will be implemented in Tier 2.
          Answers will include graph visualizations, source citations, and confidence scores.
        </p>
      </div>

      {/* Example Queries */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Example Queries
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_QUERIES.map((query, i) => (
            <button
              key={i}
              className="text-left p-4 bg-white rounded-lg border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all text-sm text-slate-600 hover:text-teal-700"
            >
              &ldquo;{query}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
