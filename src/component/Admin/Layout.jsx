import React from 'react';
import Sidebar from '@/component/Admin/Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
