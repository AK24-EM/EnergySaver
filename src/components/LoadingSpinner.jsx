import React from 'react';

const LoadingSpinner = ({ size = 'default' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className={`animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 dark:border-t-primary-500 ${sizeClasses[size]}`}>
      </div>
    </div>
  );
};

export default LoadingSpinner;