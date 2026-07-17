import React from 'react';

type SkeletonType = 'text' | 'card' | 'image' | 'circle';

interface SkeletonLoaderProps {
  type?: SkeletonType;
  className?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'text', 
  className = '',
  count = 1 
}) => {
  const getBaseClasses = () => {
    switch (type) {
      case 'circle':
        return 'rounded-full h-12 w-12';
      case 'image':
        return 'rounded-xl w-full aspect-square';
      case 'card':
        return 'rounded-xl h-48 w-full';
      case 'text':
      default:
        return 'rounded-md h-4 w-full';
    }
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div 
      key={i} 
      className={`skeleton-shimmer ${getBaseClasses()} ${className}`}
    />
  ));

  if (count === 1) return elements[0];
  
  return <>{elements}</>;
};
