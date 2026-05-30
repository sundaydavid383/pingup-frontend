import React from 'react';
import Header from '@/component/Admin/Header';
import Breadcrumb from '@/component/Admin/Breadcrumb';
import Card from '@/component/Admin/Card';

export default function Reports() {
  return (
    <>
      <Header title="Reports & Analytics" />
      <div className="p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Reports & Analytics' }]} />
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h2>
            <p className="text-gray-600">Page content coming soon...</p>
          </div>
        </Card>
      </div>
    </>
  );
}
