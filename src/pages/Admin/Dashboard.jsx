import React, { useState } from 'react';
import Header from '@/component/Admin/Header';
import Breadcrumb from '@/component/Admin/Breadcrumb';
import Card from '@/component/Admin/Card';
import StatCard from '@/component/Admin/StatCard';
import Badge from '@/component/Admin/Badge';
import Button from '@/component/Admin/Button';
import Modal from '@/component/Admin/Modal';
import Toast from '@/component/Admin/Toast';
import {
  Users,
  FileText,
  Users2,
  Heart,
  AlertCircle,
  UserPlus,
  BarChart3,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockMembers, mockPosts, memberGrowthData, postActivityData } from '@/data/adminMockData';

const recentActivity = [
  { id: 1, action: 'New member joined', user: 'Blessing Adeyemi', time: '2 hours ago', type: 'member' },
  { id: 2, action: 'Post flagged for review', content: 'Test inappropriate content', time: '3 hours ago', type: 'flag' },
  { id: 3, action: 'Group created', group: 'Outreach Team', time: '5 hours ago', type: 'group' },
  { id: 4, action: 'Prayer request submitted', requester: 'Anonymous', time: '6 hours ago', type: 'prayer' },
  { id: 5, action: 'New admin invited', admin: 'Grace Okonkwo', time: '1 day ago', type: 'admin' },
];

export default function AdminDashboard() {
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [toast, setToast] = useState(null);

  const totalMembers = mockMembers.length;
  const activeMembers = mockMembers.filter((m) => m.status === 'Active').length;
  const flaggedPosts = mockPosts.filter((p) => p.isFlagged).length;
  const thisWeekPosts = mockPosts.length;
  const newSignups = 12;
  const activeGroups = 4;
  const prayerRequestsToday = 3;

  const handleQuickAction = (action) => {
    setToast({ message: `${action} initiated!`, type: 'success' });
  };

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Overview' }]} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Members"
            value={totalMembers}
            icon={<Users size={24} />}
            trend={{ value: 15, direction: 'up' }}
          />
          <StatCard
            title="Posts This Week"
            value={thisWeekPosts}
            icon={<FileText size={24} />}
            trend={{ value: 8, direction: 'up' }}
          />
          <StatCard
            title="Active Groups"
            value={activeGroups}
            icon={<Users2 size={24} />}
            trend={{ value: 2, direction: 'up' }}
          />
          <StatCard
            title="Prayer Requests Today"
            value={prayerRequestsToday}
            icon={<Heart size={24} />}
          />
          <StatCard
            title="Flagged Content"
            value={flaggedPosts}
            icon={<AlertCircle size={24} />}
            trend={{ value: 1, direction: 'up' }}
          />
          <StatCard
            title="New Sign-ups This Month"
            value={newSignups}
            icon={<UserPlus size={24} />}
            trend={{ value: 25, direction: 'up' }}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Member Growth Chart */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Member Growth (Last 6 Months)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={memberGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ fill: '#1e40af' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Post Activity Chart */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Post Activity (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="posts" fill="#1e40af" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity (Last 5)</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="w-10 h-10 bg-[#1e40af] rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.action}</p>
                  <p className="text-sm text-gray-600">
                    {activity.user || activity.content || activity.group || activity.requester || activity.admin}
                  </p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => setShowAnnounceModal(true)} className="w-full">
              Create Announcement
            </Button>
            <Button onClick={() => setShowFlagModal(true)} className="w-full">
              Review Flags
            </Button>
            <Button onClick={() => setShowAdminModal(true)} className="w-full">
              Add Admin
            </Button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showAnnounceModal}
        onClose={() => setShowAnnounceModal(false)}
        title="Create Announcement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAnnounceModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowAnnounceModal(false); handleQuickAction('Announcement'); }}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <input type="text" placeholder="Announcement title" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <textarea
            placeholder="Message body"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          ></textarea>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option>All Members</option>
            <option>Leaders Only</option>
            <option>Specific Group</option>
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={showFlagModal}
        onClose={() => setShowFlagModal(false)}
        title="Flagged Content Pending Review"
      >
        <div className="space-y-3">
          {mockPosts.filter((p) => p.isFlagged).map((post) => (
            <div key={post.id} className="p-3 border border-gray-200 rounded-lg">
              <p className="text-gray-700 text-sm mb-2">{post.content}</p>
              <div className="flex gap-2">
                <Badge variant="flagged">Flagged {post.flags}x</Badge>
                <Badge variant="pending">Pending</Badge>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        title="Invite New Admin"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdminModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowAdminModal(false); handleQuickAction('Admin invitation'); }}>
              Send Invitation
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <input type="email" placeholder="Email address" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option>Super Admin</option>
            <option>Content Moderator</option>
            <option>Community Manager</option>
          </select>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
