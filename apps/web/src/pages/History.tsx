import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { ScanHistoryItem, ScanHistoryResponse } from '@plantpulse/shared/types/prediction';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Leaf } from 'lucide-react';
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
    <div className="min-h-screen text-stone-900 dark:text-slate-100 font-sans pb-12 transition-colors duration-300 relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <img 
          src="/home-bg.png" 
          alt="Agriculture Field Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-70"
        />
        <div className="absolute inset-0 bg-stone-100/30 dark:bg-slate-950/60 transition-colors duration-300" />
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="p-3 bg-white dark:bg-white/5 hover:bg-stone-100 dark:hover:bg-white/10 rounded-2xl transition-colors shadow-sm border border-stone-200 dark:border-white/10">
            <ChevronLeft size={24} className="text-stone-600 dark:text-slate-400" />
          </Link>
          <h1 className="text-4xl font-black text-stone-800 dark:text-white drop-shadow-sm">
            Scan History
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <SkeletonLoader type="card" count={8} className="h-72" />
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-white/5 rounded-3xl shadow-sm border border-stone-200/50 dark:border-white/10 animate-slide-up relative overflow-hidden max-w-4xl mx-auto backdrop-blur-md">
            <img 
              src="/history-empty.png" 
              alt="No scans yet" 
              className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-10 pointer-events-none" 
            />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white dark:border-slate-800 transition-colors">
                <Leaf size={36} />
              </div>
              <h2 className="text-3xl font-black text-stone-800 dark:text-white mb-2 drop-shadow-sm">No scans yet</h2>
              <p className="text-stone-500 dark:text-slate-400 font-medium mb-8 text-lg">Upload a photo to get your first crop diagnosis.</p>
              <Link to="/" className="inline-flex px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:-translate-y-1">
                Scan a Plant
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scans.map((scan, i) => (
              <Link 
                key={scan.id} 
                to={`/history/${scan.id}`} 
                className="bg-white dark:bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden border border-stone-200/50 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group cursor-pointer animate-slide-up hover:-translate-y-1"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="h-48 w-full overflow-hidden bg-stone-100 dark:bg-black/20 relative">
                  {scan.image_url ? (
                    <img src={scan.image_url} alt="Crop Scan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="text-stone-300 dark:text-slate-600" size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-xs font-bold text-stone-700 dark:text-slate-300 shadow-sm border border-transparent dark:border-white/10">
                    {Math.round(scan.confidence * 100)}% Match
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-stone-800 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={scan.class_name.replace("___", " — ").replace(/_/g, " ")}>
                      {scan.class_name.replace("___", " — ").replace(/_/g, " ")}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-2 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${scan.confidence > 0.75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.round(scan.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-black/20 px-3 py-2 rounded-xl ring-1 ring-transparent dark:ring-white/5">
                    <Calendar size={16} className="text-emerald-500 dark:text-emerald-400" />
                    <span>{new Date(scan.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
