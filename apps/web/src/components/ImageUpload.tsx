import React, { useCallback, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { useToast } from './Toast';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1024;

          if (width > height && width > max) {
            height *= max / width;
            width = max;
          } else if (height > max) {
            width *= max / height;
            height = max;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast("Please upload an image file.", "warning");
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Resize before notifying parent
    try {
      const resizedFile = await resizeImage(file);
      onImageSelected(resizedFile);
    } catch (err) {
      console.error("Resizing failed:", err);
      onImageSelected(file); // Fallback
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
  };

  if (previewUrl) {
    return (
      <div className="relative w-full max-w-md mx-auto group rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-emerald-500/20 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
        <img src={previewUrl} alt="Preview" className="w-full h-80 object-cover object-center" />
        
        {!isLoading && (
          <button 
            onClick={clearImage}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-red-500/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          >
            <X size={20} />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-emerald-400 font-medium tracking-wide animate-pulse">Analyzing Leaf...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`w-full max-w-md mx-auto relative rounded-2xl overflow-hidden transition-all duration-300 ${
        dragActive ? 'scale-[1.02] shadow-emerald-500/20 ring-emerald-500' : 'ring-white/10 hover:ring-white/30 hover:bg-white/5'
      } ring-1 bg-white/5 backdrop-blur-md`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <label className="flex flex-col items-center justify-center w-full h-64 cursor-pointer p-6">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className={`p-4 rounded-full mb-4 transition-colors ${dragActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400'}`}>
            <UploadCloud size={40} />
          </div>
          <p className="mb-2 text-lg font-medium text-white">
            <span className="text-emerald-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-gray-400 text-center">
            Upload a clear, close-up photo of a single leaf. <br/> Supported: JPG, PNG, WEBP (Max 10MB)
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          onChange={handleChange} 
          disabled={isLoading}
        />
      </label>
    </div>
  );
};

export default ImageUpload;
