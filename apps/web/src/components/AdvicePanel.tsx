import React, { useState } from 'react';
import type { Advice } from '@plantpulse/shared/types/prediction';
import { Droplet, Leaf, Shield, Scissors } from 'lucide-react';

interface AdvicePanelProps {
  advice: Advice;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ advice }) => {
  const [activeTab, setActiveTab] = useState<'treatment' | 'nutrients' | 'prevention' | 'pruning'>('treatment');

  const tabs = [
    { id: 'treatment', label: 'Treatment', icon: Droplet },
    { id: 'nutrients', label: 'Nutrients', icon: Leaf },
    { id: 'prevention', label: 'Prevention', icon: Shield },
    { id: 'pruning', label: 'Pruning', icon: Scissors },
  ] as const;

  const hasTreatment = advice.treatment.chemical.length > 0 || advice.treatment.organic.length > 0 || advice.treatment.cultural.length > 0;

  return (
    <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl flex flex-col h-full">
      {/* Header Info */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          {advice.status === 'healthy' ? (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium ring-1 ring-emerald-500/30">
              Healthy
            </span>
          ) : (
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm font-medium ring-1 ring-rose-500/30">
              Diseased
            </span>
          )}
          <span className="text-gray-400 text-sm font-medium">{advice.crop}</span>
        </div>
        
        {advice.scientific_name && (
          <p className="text-sm text-gray-500 italic mb-4">Pathogen: {advice.scientific_name}</p>
        )}
        
        <p className="text-gray-300 text-sm leading-relaxed">
          {advice.description}
        </p>

        {advice.symptoms.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Symptoms</p>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              {advice.symptoms.map((symptom, idx) => (
                <li key={idx}>{symptom}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap
                ${isActive ? 'text-white border-b-2 border-emerald-500 bg-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'treatment' && (
          <div className="space-y-6">
            {!hasTreatment ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf size={32} />
                </div>
                <p className="text-white font-medium text-lg">No treatment needed!</p>
                <p className="text-gray-400 text-sm">Your crop is healthy. Continue regular maintenance.</p>
              </div>
            ) : (
              <>
                {advice.treatment.organic.length > 0 && (
                  <div>
                    <h3 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">🌿 Organic Solutions</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {advice.treatment.organic.map((item, idx) => (
                        <li key={idx} className="flex gap-2"><span className="text-emerald-500">•</span> {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {advice.treatment.chemical.length > 0 && (
                  <div>
                    <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">🧪 Chemical Treatment</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {advice.treatment.chemical.map((item, idx) => (
                        <li key={idx} className="flex gap-2"><span className="text-amber-500">•</span> {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {advice.treatment.cultural.length > 0 && (
                  <div>
                    <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">🏡 Cultural Practices</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {advice.treatment.cultural.map((item, idx) => (
                        <li key={idx} className="flex gap-2"><span className="text-blue-500">•</span> {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'nutrients' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Nitrogen (N)</p>
              <p className="text-sm text-gray-200">{advice.nutrients.nitrogen || 'N/A'}</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phosphorus (P)</p>
              <p className="text-sm text-gray-200">{advice.nutrients.phosphorus || 'N/A'}</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Potassium (K)</p>
              <p className="text-sm text-gray-200">{advice.nutrients.potassium || 'N/A'}</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Calcium (Ca)</p>
              <p className="text-sm text-gray-200">{advice.nutrients.calcium || 'N/A'}</p>
            </div>
            {advice.nutrients.recommendations && (
              <div className="col-span-2 mt-2 p-4 bg-emerald-500/10 rounded-xl ring-1 ring-emerald-500/20">
                <p className="text-emerald-400 text-sm font-medium mb-1">Recommendation</p>
                <p className="text-emerald-100/80 text-sm">{advice.nutrients.recommendations}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prevention' && (
          <div>
             {advice.prevention.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No specific prevention measures listed.</p>
             ) : (
                <ul className="space-y-3 text-sm text-gray-300">
                  {advice.prevention.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg ring-1 ring-white/5">
                      <Shield className="text-blue-400 shrink-0 mt-0.5" size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
             )}
          </div>
        )}

        {activeTab === 'pruning' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">When to Prune</p>
              <p className="text-sm text-gray-200">{advice.pruning.when || 'N/A'}</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">How to Prune</p>
              <p className="text-sm text-gray-200">{advice.pruning.how || 'N/A'}</p>
            </div>
            <div className="p-4 bg-black/20 rounded-xl ring-1 ring-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Frequency</p>
              <p className="text-sm text-gray-200">{advice.pruning.frequency || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvicePanel;
