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
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Diseases Found',
      value: stats.diseases_detected,
      icon: <Leaf size={24} />,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
    },
    {
      label: 'Avg Confidence',
      value: `${Math.round(stats.avg_confidence * 100)}%`,
      icon: <Target size={24} />,
      color: 'from-sky-500 to-blue-500',
      bgColor: 'bg-sky-500/10',
      textColor: 'text-sky-400',
    },
  ] : [];

  return (
    <div className="min-h-screen animate-fade-in bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[35%] h-[35%] bg-emerald-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-teal-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Your crop health overview</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
          >
            New Scan <ArrowRight size={16} />
          </Link>
        </div>

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
                  className="glass-card p-6 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.bgColor}`}>
                      <div className={card.textColor}>{card.icon}</div>
                    </div>
                    <TrendingUp size={16} className="text-slate-500" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                  <p className="text-sm text-slate-400">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Top Diseases */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Leaf size={20} className="text-emerald-400" />
                Top Detected Diseases
              </h2>
              
              {stats.top_diseases.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No scans yet. Start scanning to see statistics!</p>
              ) : (
                <div className="space-y-4">
                  {stats.top_diseases.map((disease, index) => {
                    const maxCount = stats.top_diseases[0]?.count || 1;
                    const widthPercent = Math.max((disease.count / maxCount) * 100, 5);
                    
                    return (
                      <div key={disease.class_name} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                            {disease.display_name}
                          </span>
                          <span className="text-sm font-medium text-slate-400">
                            {disease.count} scan{disease.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <Link to="/history" className="glass-card p-6 group hover:border-emerald-500/30 transition-all">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  View Scan History
                </h3>
                <p className="text-sm text-slate-400">Browse all your past scans and review results.</p>
              </Link>
              <Link to="/" className="glass-card p-6 group hover:border-emerald-500/30 transition-all">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  Scan New Plant
                </h3>
                <p className="text-sm text-slate-400">Upload or take a photo of a plant leaf for diagnosis.</p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 glass-card">
            <BarChart3 size={48} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No data yet</h2>
            <p className="text-slate-400 mb-6">Start scanning plants to populate your dashboard.</p>
            <Link
              to="/"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors"
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
