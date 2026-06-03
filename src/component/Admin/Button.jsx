import React from 'react';

const Button = ({ children, onClick, variant = 'primary', size = 'md', className, disabled, type = 'button' }) => {
  const variantClasses = {
    primary: 'bg-[#1e40af] text-white hover:bg-[#1e3a8a]',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-[#1e40af] hover:bg-[#1e40af] hover:text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-semibold rounded-lg transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export default Button;
