import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ items }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
      <Link to="/admin" className="hover:text-[#1e40af]">
        Admin
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={16} />
          {item.href ? (
            <Link to={item.href} className="hover:text-[#1e40af]">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
