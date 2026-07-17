import React, { useEffect, useState } from 'react';

interface ConfidenceBarProps {
  confidence: number;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const targetPercentage = Math.round(confidence * 100);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  
  // Animated count-up effect
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1200; // ms

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercentage(Math.round(eased * targetPercentage));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetPercentage]);
  
  let colorClass = "text-emerald-500";
  let glowColor = "drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))";
  let label = "High Confidence";
  
  if (confidence < 0.75) {
    colorClass = "text-rose-500";
    glowColor = "drop-shadow(0 0 8px rgba(244, 63, 94, 0.4))";
    label = "Low Confidence";
  } else if (confidence < 0.90) {
    colorClass = "text-amber-500";
    glowColor = "drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))";
    label = "Moderate Confidence";
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox="0 0 100 100"
          style={{ filter: glowColor }}
        >
          <circle
            className="text-stone-200 dark:text-white/10 stroke-current"
            strokeWidth="8"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          />
          <circle
            className={`${colorClass} stroke-current`}
            strokeWidth="8"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-stone-800 dark:text-white tabular-nums drop-shadow-sm">
            {displayPercentage}%
          </span>
        </div>
      </div>
      <span className={`mt-3 text-sm font-medium ${colorClass} bg-stone-100 dark:bg-white/5 px-3 py-1 rounded-full border border-stone-200 dark:border-white/10`}>
        {label}
      </span>
    </div>
  );
};

export default ConfidenceBar;
