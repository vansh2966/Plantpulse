import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Camera, Shield, Zap, Leaf } from 'lucide-react';
import { auth } from '../config/firebase';

const Onboarding: React.FC = () => {
  if (auth.currentUser) {
    return <Navigate to="/" replace />;
  }

  const features = [
    {
      icon: <Camera className="w-6 h-6 text-emerald-400" />,
      title: "Instant Scanning",
      description: "Take a photo of any crop leaf to identify diseases instantly using our advanced AI."
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: "Real-time Advice",
      description: "Get immediate, actionable recommendations for treating and managing crop health."
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      title: "Reliable Accuracy",
      description: "Powered by state-of-the-art models trained on thousands of plant diseases."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl border border-emerald-500/30">
            <Leaf className="w-16 h-16 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">CropAI</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto font-light">
          Your personal AI-powered crop health assistant. Diagnose plant diseases in seconds and protect your yield.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          {features.map((feature, idx) => (
            <div key={idx} className="glass-card p-6 border-white/5 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group"
          >
            Get Started
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
