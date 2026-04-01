import { TbBook2, TbExternalLink, TbApi, TbBrain, TbBolt } from "react-icons/tb";

export default function DocsPage() {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <TbBook2 className="w-6 h-6 text-teal-600" />
            </div>
            PlantIQ Documentation
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Learn how the PlantIQ AI models act on multi-objective optimization arrays to predict quality, yield, and energy consumption.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="http://localhost:18000/docs"
            target="_blank"
            rel="noreferrer"
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex items-start gap-4 group"
          >
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <TbApi className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Backend API Swagger <TbExternalLink className="w-4 h-4 text-slate-400" />
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Explore the interactive FastAPI documentation for model inference, data retrieval, and data-mode toggling endpoints.
              </p>
            </div>
          </a>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-rose-50 rounded-lg">
              <TbBrain className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                AI Pipeline Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Overview of the XGBoost multi-output regressors and LSTM Autoencoder responsible for analyzing anomalies and fault modes.
              </p>
            </div>
          </div>
        </div>

        {/* Core Concepts */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TbBolt className="w-4 h-4 text-amber-500" /> System Behavior Guide
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">1. Data Modes (Real vs Demo)</h3>
              <p className="text-xs text-slate-600 leading-relaxed pr-8">
                The platform is capable of dynamically swapping databases to illustrate performance. The synthetic "demo" database acts as a reliable baseline, whereas the "real" dataset handles exact parameters from the provided raw hackathon production data. Toggle this using the action bar near your profile in the header.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">2. Live Forecast Monitoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed pr-8">
                As batches advance, you'll see gauge percentages updating. The Live Monitor processes arrays spanning variable temporal steps. It calculates optimal conveyor speed and holds adjustments directly linked to predictive SHAP value reductions.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800">3. Anomaly Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed pr-8">
                Sensors often fall out of calibration. Wait times drift. PlantIQ applies IQR statistical bounds coupled with an LSTM autoencoder. Anomaly tracking assigns a risk probability. If risk {">="} 0.65, fault modes (e.g. 'bearing wear', 'wet material') are identified and alerts are logged directly to the notification bell.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
