import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Trash2, Eye, SlidersHorizontal } from 'lucide-react';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';
import ConfidenceBar from '../components/ConfidenceBar';
import api from '../services/api';

interface ScanData {
  id: string;
  class_name: string;
  confidence: number;
  image_url: string;
  timestamp: string;
  top_k: { class_name: string; confidence: number }[];
}

const ScanDetail: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [scan, setScan] = useState<ScanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gradcamUrl, setGradcamUrl] = useState<string | null>(null);
  const [isGeneratingGradcam, setIsGeneratingGradcam] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        // Use dedicated single-scan endpoint instead of fetching all scans
        const response = await api.get(`/scans/${scanId}`);
        setScan(response.data);
      } catch (error) {
        console.error('Failed to fetch scan:', error);
        showToast('Scan not found', 'error');
        navigate('/history');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScan();
  }, [scanId]);

  const handleDelete = async () => {
    if (!scan) return;
    try {
      await api.delete(`/scans/${scan.id}`);
      showToast('Scan deleted successfully', 'success');
      navigate('/history');
    } catch (error) {
      showToast('Failed to delete scan', 'error');
    }
  };

  const handleGradcam = async () => {
    if (!scan?.image_url) return;
    setIsGeneratingGradcam(true);

    try {
      const formData = new FormData();
      formData.append('image_url', scan.image_url);

      const gradcamResponse = await api.post('/gradcam', formData, {
        responseType: 'blob',
      });

      const url = URL.createObjectURL(gradcamResponse.data);
      setGradcamUrl(url);
      setSliderPos(50);
    } catch (error) {
      showToast('GradCAM generation failed. Model may not be loaded.', 'warning');
    } finally {
      setIsGeneratingGradcam(false);
    }
  };

  // Draggable comparison slider handlers
  const handleSliderInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const container = (e.currentTarget as HTMLElement);
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          <SkeletonLoader type="text" className="w-48 h-8" />
          <SkeletonLoader type="card" className="h-[400px]" />
          <SkeletonLoader type="card" className="h-48" />
        </div>
      </div>
    );
  }

  if (!scan) return null;

  const displayName = scan.class_name.replace(/___/g, " — ").replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/history" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors ring-1 ring-white/10">
              <ChevronLeft size={24} className="text-slate-300" />
            </Link>
            <h1 className="text-2xl font-bold text-white">Scan Details</h1>
          </div>
          <button
            onClick={handleDelete}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors ring-1 ring-rose-500/20"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="glass-card overflow-hidden">
            <div className="relative">
              {gradcamUrl ? (
                /* GradCAM Comparison Slider */
                <div
                  className="relative w-full aspect-square cursor-col-resize select-none overflow-hidden"
                  onMouseDown={() => setIsDragging(true)}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onMouseMove={(e) => isDragging && handleSliderInteraction(e)}
                  onClick={handleSliderInteraction}
                  onTouchMove={handleSliderInteraction}
                >
                  {/* Original Image (background) */}
                  <img
                    src={scan.image_url}
                    alt="Original Scan"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* GradCAM overlay (clipped by slider position) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={gradcamUrl}
                      alt="Grad-CAM Heatmap"
                      className="w-full h-full object-cover"
                      style={{ width: `${100 * 100 / Math.max(sliderPos, 1)}%`, maxWidth: 'none' }}
                      draggable={false}
                    />
                  </div>
                  {/* Slider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-black/50 z-10"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <SlidersHorizontal size={14} className="text-slate-800" />
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="absolute top-3 left-3 bg-emerald-500/80 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm z-20">
                    Grad-CAM
                  </div>
                  <div className="absolute top-3 right-3 bg-slate-800/80 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm z-20">
                    Original
                  </div>
                </div>
              ) : (
                /* Plain image (no GradCAM yet) */
                <img 
                  src={scan.image_url} 
                  alt="Scan" 
                  className="w-full aspect-square object-cover"
                />
              )}
            </div>

            <div className="p-4 flex gap-3">
              <button
                onClick={handleGradcam}
                disabled={isGeneratingGradcam}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingGradcam ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Eye size={16} />
                    {gradcamUrl ? 'Regenerate' : 'Generate'} Grad-CAM
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-white mb-2">{displayName}</h2>
              <p className="text-sm text-slate-400 mb-4">
                Scanned on {new Date(scan.timestamp).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit' 
                })}
              </p>
              <ConfidenceBar confidence={scan.confidence} />
            </div>

            {/* Top-K Predictions */}
            {scan.top_k && scan.top_k.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-4">Alternative Predictions</h3>
                <div className="space-y-3">
                  {scan.top_k.map((prediction, index) => (
                    <div key={prediction.class_name} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        {index + 1}. {prediction.class_name.replace(/___/g, " — ").replace(/_/g, " ")}
                      </span>
                      <span className={`text-sm font-medium ${
                        prediction.confidence > 0.75 ? 'text-emerald-400' : 
                        prediction.confidence > 0.5 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanDetail;
