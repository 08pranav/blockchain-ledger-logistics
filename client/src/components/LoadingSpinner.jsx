import React from 'react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="relative">
        {/* Main spinner */}
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
        </div>
        
        {/* Blockchain themed decoration */}
        <div className="absolute -top-2 -left-2 w-2 h-2 bg-blockchain-500 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-300"></div>
      </div>
      
      {text && (
        <div className="mt-6 space-y-2">
          <p className="text-gray-600 font-medium">{text}</p>
          <p className="text-sm text-gray-400">Blockchain Ledger System</p>
          <p className="text-xs text-gray-400">© Pranav Koradiya</p>
        </div>
      )}
      
      {/* Animated dots */}
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;