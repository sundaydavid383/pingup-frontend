import React from 'react';

const StatCard = ({ title, value, icon, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% from last month
            </p>
          )}
        </div>
        {icon && <div className="text-[#1e40af]">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
