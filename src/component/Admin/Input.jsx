import React from 'react';

const Input = ({ type = 'text', placeholder, value, onChange, className, label, error }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] ${error ? 'border-red-500' : ''} ${className || ''}`}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
