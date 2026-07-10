import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import PredictionCard from '../components/PredictionCard';
import AdvicePanel from '../components/AdvicePanel';
import { useToast } from '../components/Toast';
import { SkeletonLoader } from '../components/SkeletonLoader';
import CropSelector from '../components/CropSelector';
import api from '../services/api';
import type { PredictResponse } from '@plantpulse/shared/types/prediction';
import { Zap, Shield, Eye, Leaf } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <div 
    className="glass-card p-6 text-center group hover:border-emerald-500/30 transition-all duration-300 animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const { showToast } = useToast();

  const handleImageUpload = async (file: File, cropOverride?: string) => {
    setCurrentFile(file);
    setIsLoading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const cropToUse = cropOverride !== undefined ? cropOverride : selectedCrop;
      if (cropToUse) {
        formData.append('crop_filter', cropToUse);
      }
      
      const response = await api.post<PredictResponse>('/predict', formData);
      
      setResult(response.data);
    } catch (error) {
      console.error("Error predicting image:", error);
      showToast("There was an error analyzing the image. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropChange = (crop: string) => {
    setSelectedCrop(crop);
    if (currentFile) {
      handleImageUpload(currentFile, crop);
    }
  };

  const handleClear = () => {
    setResult(null);
    setCurrentFile(null);
  };

  return (
    <div className="min-h-screen animate-fade-in bg-slate-950 text-slate-100 selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-medium ring-1 ring-emerald-500/20 mb-6 animate-fade-in">
            <Leaf size={14} />
            AI-Powered Plant Diagnosis
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            PlantPulse Diagnosis
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload a photo of a diseased plant leaf and instantly receive an AI-powered diagnosis and treatment plan.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload & Quick Result */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">
            <CropSelector 
              selectedCrop={selectedCrop} 
              onCropChange={handleCropChange}
              disabled={isLoading}
            />
            <ImageUpload 
              onImageSelected={handleImageUpload} 
              isLoading={isLoading} 
              onClear={handleClear}
            />
            
            {isLoading && (
              <div className="animate-fade-in">
                <SkeletonLoader type="card" className="h-[300px]" />
              </div>
            )}
            
            {!isLoading && result && (
              <div className="animate-fade-in">
                <PredictionCard prediction={result.prediction} />
              </div>
            )}
          </div>

          {/* Right Column: Detailed Advice */}
          <div className="lg:col-span-8 w-full">
            {isLoading ? (
              <SkeletonLoader type="card" className="h-[600px]" />
            ) : result && result.advice ? (
              <div className="animate-slide-up h-full">
                <AdvicePanel advice={result.advice} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Feature Cards — shown when no result */}
        {!result && !isLoading && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap size={24} />}
              title="Instant Analysis"
              description="Get accurate disease diagnosis in under 2 seconds using state-of-the-art deep learning."
              delay={100}
            />
            <FeatureCard
              icon={<Shield size={24} />}
              title="94 Diseases Covered"
              description="Trained on major crop diseases worldwide with treatment plans for each condition."
              delay={200}
            />
            <FeatureCard
              icon={<Eye size={24} />}
              title="Visual Explainability"
              description="See exactly where the AI detected disease with Grad-CAM heatmap visualization."
              delay={300}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
