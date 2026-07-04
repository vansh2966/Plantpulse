import React from 'react';
import ConfidenceBar from './ConfidenceBar';
import type { PredictionResult } from '@plantpulse/shared/types/prediction';
import { AlertCircle } from 'lucide-react';

interface PredictionCardProps {
  prediction: PredictionResult;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  return (
    <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-6 ring-1 ring-white/10 shadow-xl">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Analysis Result</h2>
      <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">
        {prediction.display_name}
      </h1>
      
      <ConfidenceBar confidence={prediction.confidence} />

      {!prediction.is_confident && (
        <div className="mt-6 p-4 bg-amber-500/10 rounded-xl ring-1 ring-amber-500/30 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-amber-200 font-medium text-sm mb-1">Low Confidence Warning</p>
            <p className="text-amber-200/80 text-sm mb-3">
              The model is unsure about this prediction. Consider taking a clearer, close-up photo of a single leaf in good lighting.
            </p>
            
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider">Top Alternatives</p>
              {prediction.top_k.slice(1).map((alt, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-amber-100/90">{alt.class_name.replace("___", " — ").replace("_", " ")}</span>
                  <span className="text-amber-500 font-medium">{Math.round(alt.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;
