import React from 'react';

const Card = ({ children, className, hover }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${hover ? 'hover:shadow-md cursor-pointer' : ''} ${className || ''}`}>
      {children}
    </div>
  );
};

export default Card;
