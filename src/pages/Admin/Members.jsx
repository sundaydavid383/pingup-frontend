import React, { useState } from 'react';
import Header from '@/component/Admin/Header';
import Breadcrumb from '@/component/Admin/Breadcrumb';
import Card from '@/component/Admin/Card';
import Badge from '@/component/Admin/Badge';
import Button from '@/component/Admin/Button';
import SidePanel from '@/component/Admin/SidePanel';
import Select from '@/component/Admin/Select';
import Input from '@/component/Admin/Input';
import { Search, Download, Eye, Trash2 } from 'lucide-react';
import { mockMembers } from '@/data/adminMockData';

export default function Members() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || member.role === filterRole;
    const matchesStatus = !filterStatus || member.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <>
      <Header title="Members" />
      <div className="p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Members' }]} />

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg px-4">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none flex-1 ml-2 py-2"
              />
            </div>
            <Select
              options={[
                { label: 'All Roles', value: '' },
                { label: 'Member', value: 'Member' },
                { label: 'Leader', value: 'Leader' },
                { label: 'Admin', value: 'Admin' },
              ]}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              placeholder="Filter by role"
            />
            <Select
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Suspended', value: 'Suspended' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder="Filter by status"
            />
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
              <Download size={18} />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Members Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Join Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1e40af] rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {member.avatar}
                        </div>
                        <span className="text-gray-900 font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{member.email}</td>
                    <td className="px-4 py-4">
                      <Badge variant="default">{member.role}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{member.joinDate}</td>
                    <td className="px-4 py-4">
                      <Badge variant={member.status === 'Active' ? 'active' : 'suspended'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowPanel(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="View Profile"
                        >
                          <Eye size={16} className="text-[#1e40af]" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="Delete">
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Member Detail Side Panel */}
      <SidePanel isOpen={showPanel} onClose={() => setShowPanel(false)} title={selectedMember?.name || 'Member Profile'}>
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[#1e40af] rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {selectedMember.avatar}
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{selectedMember.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Role</p>
                <p className="font-medium text-gray-900">{selectedMember.role}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <Badge variant={selectedMember.status === 'Active' ? 'active' : 'suspended'}>
                  {selectedMember.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-600">Join Date</p>
                <p className="font-medium text-gray-900">{selectedMember.joinDate}</p>
              </div>
              <div>
                <p className="text-gray-600">Last Active</p>
                <p className="font-medium text-gray-900">{selectedMember.lastActive}</p>
              </div>
              <div>
                <p className="text-gray-600">Bio</p>
                <p className="font-medium text-gray-900">{selectedMember.bio}</p>
              </div>
              <div>
                <p className="text-gray-600">Posts</p>
                <p className="font-medium text-gray-900">{selectedMember.postCount}</p>
              </div>
              <div>
                <p className="text-gray-600">Groups</p>
                <div className="mt-2 space-y-1">
                  {selectedMember.groupMemberships?.map((group) => (
                    <Badge key={group} variant="default" className="mr-2">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <Button className="w-full" variant="secondary">
                Change Role
              </Button>
              <Button className="w-full" variant="danger">
                Suspend Member
              </Button>
            </div>
          </div>
        )}
      </SidePanel>
    </>
  );
}
