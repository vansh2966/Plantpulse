import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export const CROPS = [
  'Banana', 'Cauliflower', 'Corn', 'Cotton', 'Guava', 
  'Jute', 'Mango', 'Papaya', 'Potato', 'Rice', 
  'Sugarcane', 'Tea', 'Tomato', 'Wheat'
];

interface CropSelectorProps {
  selectedCrop: string;
  onCropChange: (crop: string) => void;
  disabled?: boolean;
}

const CropSelector: React.FC<CropSelectorProps> = ({ selectedCrop, onCropChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter crops based on search term
  const filteredCrops = CROPS.filter(crop => 
    crop.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (crop: string) => {
    onCropChange(crop);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-6" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Which crop are you scanning?
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white/5 border ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-white/10 hover:border-white/20'} rounded-xl text-left text-white shadow-sm transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={selectedCrop ? 'text-white font-medium' : 'text-slate-400'}>
          {selectedCrop ? selectedCrop : 'Unknown / Not Sure (Scan All)'}
        </span>
        <ChevronDown size={20} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-white/10 relative">
            <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full bg-black/30 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <ul className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {/* Always show Unknown option at the top unless actively searching for a specific crop that doesn't match it */}
            {(!searchTerm || 'unknown'.includes(searchTerm.toLowerCase())) && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${!selectedCrop ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className={!selectedCrop ? 'font-medium' : ''}>Unknown / Not Sure</span>
                  {!selectedCrop && <Check size={16} className="text-emerald-400" />}
                </button>
              </li>
            )}
            
            {filteredCrops.map(crop => (
              <li key={crop}>
                <button
                  type="button"
                  onClick={() => handleSelect(crop)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${selectedCrop === crop ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className={selectedCrop === crop ? 'font-medium' : ''}>{crop}</span>
                  {selectedCrop === crop && <Check size={16} className="text-emerald-400" />}
                </button>
              </li>
            ))}
            
            {filteredCrops.length === 0 && searchTerm && !'unknown'.includes(searchTerm.toLowerCase()) && (
              <li className="px-3 py-4 text-center text-slate-500 text-sm">
                No crops found matching "{searchTerm}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CropSelector;
