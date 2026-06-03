import React from 'react';

const Badge = ({ variant = 'default', children, className }) => {
  const variantClasses = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
    flagged: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
    default: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${variantClasses[variant]} ${className || ''}`}>
      {children}
    </span>
  );
};

export default Badge;
