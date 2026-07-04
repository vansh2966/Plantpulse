import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';
import PredictionCard from '../components/PredictionCard';
import AdvicePanel from '../components/AdvicePanel';
import { useToast } from '../components/Toast';
import { SkeletonLoader } from '../components/SkeletonLoader';
import api from '../services/api';
import type { PredictResponse } from '@plantpulse/shared/types/prediction';

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const { showToast } = useToast();

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post<PredictResponse>('/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResult(response.data);
    } catch (error) {
      console.error("Error predicting image:", error);
      showToast("There was an error analyzing the image. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            CropAI Diagnosis
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload a photo of a diseased plant leaf and instantly receive an AI-powered diagnosis and treatment plan.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Upload Section */}
          <div className={`${result ? 'lg:col-span-4' : 'lg:col-span-12'} transition-all duration-500 flex justify-center w-full`}>
            <ImageUpload onImageSelected={handleImageUpload} isLoading={isLoading} />
          </div>

          {/* Results Section */}
          {isLoading ? (
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-fade-in">
              <SkeletonLoader type="card" className="h-[500px]" />
              <SkeletonLoader type="card" className="h-[500px]" />
            </div>
          ) : result && (
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
              <div className="h-full">
                <PredictionCard prediction={result.prediction} />
              </div>
              <div className="h-full">
                {result.advice && <AdvicePanel advice={result.advice} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
