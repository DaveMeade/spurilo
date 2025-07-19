import React, { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon, EditIcon, DocumentIcon, UserIcon } from './Icons';
import CreateEngagementModal from './CreateEngagementModal';
import EngagementDetails from './EngagementDetails';
import AccessDenied from './AccessDenied';
import { apiGet } from '../utils/api';

const AdminDashboard = ({ user }) => {
  // Permission check - only system admins can access this dashboard
  const hasAdminAccess = user?.system_roles?.includes('admin');
  
  if (!hasAdminAccess) {
    return <AccessDenied user={user} requiredRole="System Administrator" />;
  }
  const [engagements, setEngagements] = useState([]);
  const [filteredEngagements, setFilteredEngagements] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      type: 'submission',
      message: 'John Doe submitted evidence for control CC6.1',
      engagement: 'Acme Corp Gap Assessment',
      timestamp: '2 minutes ago',
      unread: true
    },
    {
      id: 2,
      type: 'comment',
      message: 'Alice Smith commented on finding F-001',
      engagement: 'TechStart SOC 2 Audit',
      timestamp: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'submission',
      message: 'Bob Johnson uploaded policy document',
      engagement: 'Acme Corp Gap Assessment',
      timestamp: '3 hours ago',
      unread: false
    }
  ]);

  useEffect(() => {
    loadEngagements();
  }, []);

  useEffect(() => {
    filterEngagements();
  }, [engagements, statusFilter]);

  const loadEngagements = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('/api/engagements');
      if (response.ok) {
        const data = await response.json();
        setEngagements(data);
      }
    } catch (error) {
      console.error('Failed to load engagements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEngagements = () => {
    if (statusFilter) {
      setFilteredEngagements(engagements.filter(e => e.status === statusFilter));
    } else {
      setFilteredEngagements(engagements);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(statusFilter === status ? null : status);
  };

  const clearFilter = () => {
    setStatusFilter(null);
  };

  const handleCreateEngagement = async (engagementData) => {
    try {
      const response = await fetch('/api/engagements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(engagementData),
      });

      if (response.ok) {
        const newEngagement = await response.json();
        setEngagements(prev => [newEngagement, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create engagement:', error);
    }
  };

  const getEngagementTypeBadge = (type) => {
    const typeMap = {
      'gap-assessment': { label: 'Gap Assessment', class: 'badge-primary' },
      'internal-audit': { label: 'Internal Audit', class: 'badge-secondary' },
      'audit-prep': { label: 'Audit Prep', class: 'badge-warning' },
      'audit-facilitation': { label: 'Audit Facilitation', class: 'badge-success' }
    };

    const config = typeMap[type] || { label: type, class: 'badge-secondary' };
    return (
      <span className={`badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'planning': { label: 'Planning', class: 'badge-warning' },
      'in-progress': { label: 'In Progress', class: 'badge-primary' },
      'completed': { label: 'Completed', class: 'badge-success' },
      'on-hold': { label: 'On Hold', class: 'badge-secondary' },
      'cancelled': { label: 'Cancelled', class: 'badge-danger' }
    };

    const config = statusMap[status] || { label: status, class: 'badge-secondary' };
    return (
      <span className={`badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="px-4 py-6 sm:px-0">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-secondary-600">
              Manage your security compliance engagements
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowNotifications(true)}
            >
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center relative">
                      <span className="text-red-600 font-bold">🔔</span>
                      {notifications.filter(n => n.unread).length > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {notifications.filter(n => n.unread).length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Notifications</p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {notifications.filter(n => n.unread).length}
                    </p>
                    <p className="text-xs text-secondary-500">New items</p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`card cursor-pointer hover:shadow-md transition-all ${
                statusFilter === 'in-progress' ? 'ring-2 ring-primary-500 bg-primary-50' : ''
              }`}
              onClick={() => handleStatusFilter('in-progress')}
            >
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      statusFilter === 'in-progress' ? 'bg-primary-200' : 'bg-primary-100'
                    }`}>
                      <span className="text-primary-600 font-bold">▶</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">In Progress</p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {engagements.filter(e => e.status === 'in-progress').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`card cursor-pointer hover:shadow-md transition-all ${
                statusFilter === 'planning' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
              }`}
              onClick={() => handleStatusFilter('planning')}
            >
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      statusFilter === 'planning' ? 'bg-yellow-200' : 'bg-yellow-100'
                    }`}>
                      <span className="text-yellow-600 font-bold">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Scheduled</p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {engagements.filter(e => e.status === 'planning').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`card cursor-pointer hover:shadow-md transition-all ${
                statusFilter === 'completed' ? 'ring-2 ring-green-500 bg-green-50' : ''
              }`}
              onClick={() => handleStatusFilter('completed')}
            >
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      statusFilter === 'completed' ? 'bg-green-200' : 'bg-green-100'
                    }`}>
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Completed</p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {engagements.filter(e => e.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          showNotifications ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Notifications
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-secondary-400 hover:text-secondary-600 p-1 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-5xl mb-4 block">🔔</span>
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-secondary-600">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-100">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-secondary-50 transition-colors ${
                        notification.unread ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            notification.type === 'submission' 
                              ? 'bg-green-100' 
                              : 'bg-blue-100'
                          }`}>
                            <span className={`text-lg ${
                              notification.type === 'submission' 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                            }`}>
                              {notification.type === 'submission' ? '📎' : '💬'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm ${
                            notification.unread ? 'font-semibold text-secondary-900' : 'text-secondary-700'
                          }`}>
                            {notification.message}
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-xs text-secondary-500">
                              {notification.engagement}
                            </span>
                            <span className="text-xs text-secondary-400">•</span>
                            <span className="text-xs text-secondary-500">
                              {notification.timestamp}
                            </span>
                          </div>
                        </div>
                        {notification.unread && (
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-secondary-200">
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Mark all as read
              </button>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {showNotifications && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity"
            onClick={() => setShowNotifications(false)}
          />
        )}

        {/* Filter Indicator */}
        {statusFilter && (
          <div className="px-4 sm:px-0 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-blue-800">
                    Showing engagements with status: 
                    <span className="font-medium ml-1 capitalize">
                      {statusFilter === 'planning' ? 'Scheduled' : statusFilter.replace('-', ' ')}
                    </span>
                  </span>
                </div>
                <button
                  onClick={clearFilter}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Engagements Table */}
        <div className="px-4 sm:px-0">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-secondary-900">
                    Recent Engagements
                  </h3>
                  {statusFilter && (
                    <p className="text-sm text-secondary-500 mt-1">
                      {filteredEngagements.length} of {engagements.length} engagements
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Engagement
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              {filteredEngagements.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-2">
                    {statusFilter ? `No ${statusFilter === 'planning' ? 'scheduled' : statusFilter.replace('-', ' ')} engagements` : 'No engagements yet'}
                  </h3>
                  <p className="text-secondary-600 mb-6">
                    {statusFilter ? 'Try adjusting your filter or create a new engagement' : 'Get started by creating your first engagement'}
                  </p>
                  {statusFilter ? (
                    <button
                      onClick={clearFilter}
                      className="btn-secondary mr-3"
                    >
                      Clear Filter
                    </button>
                  ) : null}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {statusFilter ? 'New Engagement' : 'Create First Engagement'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-secondary-200">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Engagement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Auditor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-200">
                      {filteredEngagements.map((engagement) => (
                        <tr key={engagement.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-secondary-900">
                                {engagement.name}
                              </div>
                              <div className="text-sm text-secondary-500">
                                {engagement.scope}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEngagementTypeBadge(engagement.engagementType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {engagement.customerName || 'Not specified'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                            {engagement.consultant || engagement.auditor || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(engagement.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedEngagement(engagement)}
                                className="text-primary-600 hover:text-primary-900 p-1"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {/* Handle edit */}}
                                className="text-secondary-600 hover:text-secondary-900 p-1"
                                title="Edit"
                              >
                                <EditIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Engagement Modal */}
      {showCreateModal && (
        <CreateEngagementModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEngagement}
        />
      )}

      {/* Engagement Details Modal */}
      {selectedEngagement && (
        <EngagementDetails
          engagement={selectedEngagement}
          onClose={() => setSelectedEngagement(null)}
          onEdit={(engagement) => {
            // TODO: Implement edit functionality
            console.log('Edit engagement:', engagement);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;