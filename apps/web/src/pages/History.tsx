import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { ScanHistoryItem, ScanHistoryResponse } from '@plantpulse/shared/types/prediction';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Leaf, Trash2 } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';

const History: React.FC = () => {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get<ScanHistoryResponse>('/scans');
        setScans(response.data.scans);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        showToast("Failed to load scan history.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors ring-1 ring-white/10">
            <ChevronLeft size={24} className="text-slate-300" />
          </Link>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Scan History
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            <SkeletonLoader type="card" count={6} />
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl ring-1 ring-white/10 animate-slide-up">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Leaf size={32} />
            </div>
            <p className="text-xl font-medium text-white mb-2">No scans yet</p>
            <p className="text-slate-400 mb-6">Upload a photo to get your first crop diagnosis.</p>
            <Link to="/" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors">
              Scan a Plant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans.map((scan) => (
              <Link key={scan.id} to={`/history/${scan.id}`} className="bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-emerald-500/50 transition-all group cursor-pointer">
                <div className="h-48 w-full overflow-hidden bg-black/40">
                  {scan.image_url ? (
                    <img src={scan.image_url} alt="Crop Scan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="text-slate-700" size={48} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-white line-clamp-1" title={scan.class_name.replace("___", " — ").replace(/_/g, " ")}>
                      {scan.class_name.replace("___", " — ").replace(/_/g, " ")}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${scan.confidence > 0.75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.round(scan.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-300">{Math.round(scan.confidence * 100)}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={14} />
                    <span>{new Date(scan.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
