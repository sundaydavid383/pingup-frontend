import React from 'react';
import Header from '@/component/Admin/Header.jsx';
import Breadcrumb from '@/component/Admin/Breadcrumb.jsx';
import Card from '@/component/Admin/Card.jsx';

const Page = ({ title, breadcrumb }) => {
  return (
    <>
      <Header title={title} />
      <div className="p-6 lg:p-8">
        <Breadcrumb items={breadcrumb} />
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">Page content coming soon...</p>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Page;
