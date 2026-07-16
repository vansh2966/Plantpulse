import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Leaf, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import api from '../services/api';

interface DiseaseEntry {
  class_name: string;
  count: number;
  display_name: string;
}

interface Stats {
  total_scans: number;
  diseases_detected: number;
  avg_confidence: number;
  top_diseases: DiseaseEntry[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<Stats>('/scans/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Scans',
      value: stats.total_scans,
      icon: <BarChart3 size={24} />,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Diseases Found',
      value: stats.diseases_detected,
      icon: <Leaf size={24} />,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Avg Confidence',
      value: `${Math.round(stats.avg_confidence * 100)}%`,
      icon: <Target size={24} />,
      color: 'bg-sky-50 text-sky-600',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-950 text-stone-900 dark:text-slate-100 font-sans pb-12 transition-colors duration-300">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden mb-8">
        <img 
          src="/dashboard-hero.png" 
          alt="Agriculture Field" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-stone-900/20" />
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md">Dashboard</h1>
            <p className="text-stone-200 text-lg font-medium drop-shadow-md">Your crop health overview</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-1"
          >
            New Scan <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonLoader type="card" className="h-32" />
              <SkeletonLoader type="card" className="h-32" />
              <SkeletonLoader type="card" className="h-32" />
            </div>
            <SkeletonLoader type="card" className="h-64" />
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {statCards.map((card, i) => (
                <div
                  key={card.label}
                  className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-stone-200/50 dark:border-white/10 animate-slide-up hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-4 rounded-2xl ${card.color.replace('bg-emerald-50 text-emerald-600', 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400').replace('bg-amber-50 text-amber-600', 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400').replace('bg-sky-50 text-sky-600', 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400')} shadow-sm`}>
                      {card.icon}
                    </div>
                    <TrendingUp size={20} className="text-stone-300 dark:text-slate-600" />
                  </div>
                  <p className="text-4xl font-black text-stone-800 dark:text-white mb-1">{card.value}</p>
                  <p className="text-stone-600 dark:text-slate-400 font-medium">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Diseases */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200/50 dark:border-white/10 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-6 flex items-center gap-2">
                  <Leaf size={24} className="text-emerald-500 dark:text-emerald-400" />
                  Top Detected Diseases
                </h2>
                
                {stats.top_diseases.length === 0 ? (
                  <p className="text-stone-500 dark:text-slate-500 text-center py-8 font-medium">No scans yet. Start scanning to see statistics!</p>
                ) : (
                  <div className="space-y-5">
                    {stats.top_diseases.map((disease) => {
                      const maxCount = stats.top_diseases[0]?.count || 1;
                      const widthPercent = Math.max((disease.count / maxCount) * 100, 5);
                      
                      return (
                        <div key={disease.class_name} className="group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-stone-700 dark:text-slate-300 font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {disease.display_name}
                            </span>
                            <span className="text-sm font-bold text-stone-600 dark:text-slate-400 bg-stone-100 dark:bg-white/10 px-3 py-1 rounded-full">
                              {disease.count} scan{disease.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="h-3 w-full bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
                <Link to="/history" className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-stone-200/50 dark:border-white/10 group hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm">
                    <BarChart3 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    View Scan History
                  </h3>
                  <p className="text-stone-600 dark:text-slate-400 font-medium">Browse all your past scans and review results.</p>
                </Link>
                
                <Link to="/" className="bg-emerald-600 p-6 rounded-3xl shadow-md border border-emerald-500 group hover:bg-emerald-500 transition-all overflow-hidden relative">
                  <div className="absolute top-[-20%] right-[-10%] opacity-20 transform group-hover:scale-110 transition-transform">
                    <Leaf size={120} className="text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 text-white shadow-sm">
                      <Target size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Scan New Plant
                    </h3>
                    <p className="text-emerald-50 font-medium">Upload or take a photo of a plant leaf for diagnosis.</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-stone-200/50 dark:border-white/10 shadow-sm">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={48} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-2">No data yet</h2>
            <p className="text-stone-600 dark:text-slate-400 font-medium mb-8">Start scanning plants to populate your dashboard.</p>
            <Link
              to="/"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors shadow-lg"
            >
              Scan a Plant
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
