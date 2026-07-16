import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Camera, Shield, Zap } from 'lucide-react';
import { auth } from '../config/supabase';

const Onboarding: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await auth.getSession();
      setHasUser(!!session);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) return null;
  if (hasUser) {
    return <Navigate to="/" replace />;
  }

  const features = [
    {
      icon: <Camera className="w-8 h-8 text-emerald-600" />,
      title: "Instant Scanning",
      description: "Take a photo of any crop leaf to identify diseases instantly using our advanced AI."
    },
    {
      icon: <Zap className="w-8 h-8 text-emerald-600" />,
      title: "Real-time Advice",
      description: "Get immediate, actionable recommendations for treating and managing crop health."
    },
    {
      icon: <Shield className="w-8 h-8 text-emerald-600" />,
      title: "Reliable Accuracy",
      description: "Powered by state-of-the-art models trained on thousands of plant diseases."
    }
  ];

  return (
    <div className="min-h-screen w-full flex bg-stone-50 text-stone-900 font-sans">
      {/* Left Column: Image Background */}
      <div className="hidden lg:flex w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
        <img 
          src="/dashboard-hero.png" 
          alt="Agriculture Field" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/20 to-emerald-900/40" />
        <div className="relative z-10 p-12 text-center max-w-xl">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-3xl mb-8 shadow-2xl border border-white/20">
            <img src="/logo.png" alt="PlantPulse Logo" className="w-24 h-24 object-contain drop-shadow-xl" />
          </div>
        </div>
      </div>

      {/* Right Column: Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative bg-stone-50 overflow-y-auto">
        <div className="w-full max-w-xl relative z-10">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg bg-emerald-100 border-4 border-white">
              <img src="/logo.png" alt="PlantPulse Logo" className="w-14 h-14 object-contain" />
            </div>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight text-stone-800">
              Welcome to <span className="text-emerald-600">PlantPulse</span>
            </h1>
            <p className="text-xl md:text-2xl text-stone-500 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
              Your personal AI-powered crop health assistant. Diagnose plant diseases in seconds and protect your yield.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-stone-200/50 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex-shrink-0 flex items-center justify-center border-4 border-white shadow-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800 mb-1">{feature.title}</h3>
                  <p className="text-stone-500 font-medium leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center lg:justify-start">
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 group text-lg"
            >
              Get Started
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
