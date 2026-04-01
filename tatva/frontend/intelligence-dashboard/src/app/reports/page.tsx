"use client";

import { FileText, Plus, Download } from "lucide-react";

const REPORT_TYPES = [
  { name: "Daily Intelligence Summary", code: "DIS", description: "One-page brief on key developments", icon: "📋" },
  { name: "Weekly Threat Assessment", code: "WTA", description: "Emerging threats ranked by severity", icon: "🎯" },
  { name: "Monthly Domain Report", code: "MDR", description: "Deep dive into a selected domain", icon: "📊" },
  { name: "Flash Report", code: "FLASH", description: "Triggered by critical events", icon: "⚡" },
  { name: "Intelligence Brief", code: "BRIEF", description: "Executive summary with key findings", icon: "📝" },
  { name: "Scenario Analysis", code: "SCENARIO", description: "Cascading impact assessment", icon: "🔮" },
];

export default function ReportsPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4" /> Intelligence Reports
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => (
          <div key={report.code} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{report.icon}</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors mb-1">{report.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{report.description}</p>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">{report.code}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Download className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">
          LLM-powered report generation with PDF/DOCX export, classification headers, and watermarking
          will be implemented in Tier 3.
        </p>
      </div>
    </div>
  );
}
