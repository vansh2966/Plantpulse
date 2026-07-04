import React from 'react';

interface ConfidenceBarProps {
  confidence: number;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  
  let colorClass = "text-emerald-500";
  let label = "High Confidence";
  
  if (confidence < 0.75) {
    colorClass = "text-rose-500";
    label = "Low Confidence";
  } else if (confidence < 0.90) {
    colorClass = "text-amber-500";
    label = "Moderate Confidence";
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
          <circle
            className="text-white/10 stroke-current"
            strokeWidth="8"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          />
          <circle
            className={`${colorClass} stroke-current transition-all duration-1500 ease-out`}
            strokeWidth="8"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            {percentage}%
          </span>
        </div>
      </div>
      <span className={`mt-3 text-sm font-medium ${colorClass} bg-white/5 px-3 py-1 rounded-full border border-white/10`}>
        {label}
      </span>
    </div>
  );
};

export default ConfidenceBar;
