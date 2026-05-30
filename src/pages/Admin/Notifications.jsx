import React from 'react';
import Header from '@/component/Admin/Header';
import Breadcrumb from '@/component/Admin/Breadcrumb';
import Card from '@/component/Admin/Card';

export default function Notifications() {
  return (
    <>
      <Header title="Notifications" />
      <div className="p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Notifications' }]} />
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
            <p className="text-gray-600">Page content coming soon...</p>
          </div>
        </Card>
      </div>
    </>
  );
}
