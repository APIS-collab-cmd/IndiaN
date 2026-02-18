// Button Component - Stub
import React from 'react';

export function Button({ 
  children, 
  variant = 'default', 
  onClick, 
  disabled, 
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline'; 
  onClick?: () => void; 
  disabled?: boolean;
  className?: string;
}) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors';
  const variantStyles = variant === 'outline' 
    ? 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700' 
    : 'bg-blue-600 hover:bg-blue-700 text-white';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}
