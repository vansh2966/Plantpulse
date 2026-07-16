import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import PredictionCard from '../components/PredictionCard';
import AdvicePanel from '../components/AdvicePanel';
import { useToast } from '../components/Toast';
import { SkeletonLoader } from '../components/SkeletonLoader';
import CropSelector from '../components/CropSelector';
import api from '../services/api';
import type { PredictResponse } from '@plantpulse/shared/types/prediction';
import { Leaf } from 'lucide-react';



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
    <div className="h-[calc(100vh-4rem)] w-full animate-fade-in text-stone-900 dark:text-slate-100 selection:bg-emerald-500/30 overflow-hidden relative font-sans transition-colors duration-300 flex flex-col">
      {/* Background Image - Made prominent! */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <img 
          src="/home-bg.png" 
          alt="Agriculture Field Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-100 dark:opacity-70"
        />
        {/* Lighter overlay to let the image shine but keep text readable */}
        <div className="absolute inset-0 bg-stone-100/30 dark:bg-slate-950/60 transition-colors duration-300" />
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col h-full flex-1 overflow-hidden">
        
        {/* Header - Shrinks when result is shown to save space */}
        <div className={`text-center transition-all duration-500 flex-shrink-0 ${result || isLoading ? 'mb-4' : 'mb-8 mt-4'}`}>
          {!result && !isLoading && (
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold shadow-sm mb-6 animate-fade-in border border-white/40 dark:border-white/10">
              <Leaf size={16} />
              AI-Powered Plant Diagnosis
            </div>
          )}
          <h1 className={`font-black tracking-tight text-stone-900 dark:text-white drop-shadow-md transition-all duration-500 ${result || isLoading ? 'text-3xl mb-0' : 'text-5xl md:text-6xl mb-6'}`}>
            PlantPulse Diagnosis
          </h1>
          {!result && !isLoading && (
            <p className="text-xl text-stone-800 dark:text-slate-200 font-bold max-w-2xl mx-auto leading-relaxed drop-shadow-sm bg-white/50 dark:bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/30 dark:border-white/10">
              Upload a photo of a diseased plant leaf and instantly receive an AI-powered diagnosis and treatment plan.
            </p>
          )}
        </div>

        {/* Main Content Area - Scrollable internally if needed */}
        <div className={`w-full flex-1 min-h-0 transition-all duration-500 ${result || isLoading ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'max-w-3xl mx-auto flex flex-col justify-center'}`}>
          
          {/* Left Column (or center if no result) */}
          <div className={`${result || isLoading ? 'lg:col-span-4 h-full overflow-y-auto no-scrollbar pb-4 pr-1' : 'w-full'} flex flex-col gap-4`}>
            
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl shadow-lg border border-white/40 dark:border-white/10">
              <CropSelector 
                selectedCrop={selectedCrop} 
                onCropChange={handleCropChange}
                disabled={isLoading}
              />
              <div className="mt-4">
                <ImageUpload 
                  onImageSelected={handleImageUpload} 
                  isLoading={isLoading} 
                  onClear={handleClear}
                />
              </div>
            </div>
            
            {isLoading && (
              <div className="animate-fade-in">
                <SkeletonLoader type="card" className="h-[250px] shadow-lg border border-white/40 dark:border-white/10" />
              </div>
            )}
            
            {!isLoading && result && (
              <div className="animate-fade-in">
                <PredictionCard prediction={result.prediction} />
              </div>
            )}
          </div>

          {/* Right Column: Detailed Advice - Appears only when loading or result */}
          {(isLoading || result) && (
            <div className="lg:col-span-8 w-full h-full overflow-y-auto no-scrollbar pb-4 pr-1">
              {isLoading ? (
                <SkeletonLoader type="card" className="h-full min-h-[500px] shadow-lg border border-white/40 dark:border-white/10" />
              ) : result && result.advice ? (
                <div className="animate-slide-up h-full">
                  <AdvicePanel advice={result.advice} />
                </div>
              ) : null}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Home;
