import React, { useState } from 'react';
import { CloseIcon, EditIcon, UserIcon, DocumentIcon, CalendarIcon } from './Icons';

const EngagementDetails = ({ engagement, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!engagement) return null;

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'participants', name: 'Participants' },
    { id: 'deliverables', name: 'Deliverables' },
    { id: 'timeline', name: 'Timeline' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-secondary-900">
                {engagement.name}
              </h2>
              {getEngagementTypeBadge(engagement.engagementType)}
              {getStatusBadge(engagement.status)}
            </div>
            <p className="text-secondary-600 mt-1">
              {engagement.scope}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit && onEdit(engagement)}
              className="btn-secondary"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-secondary-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-secondary-900">
                      Engagement Information
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Customer</label>
                      <p className="text-secondary-900">{engagement.customerName || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Auditor/Consultant</label>
                      <p className="text-secondary-900">{engagement.consultant || engagement.auditor || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Framework</label>
                      <p className="text-secondary-900">{engagement.framework || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Priority</label>
                      <p className="text-secondary-900 capitalize">{engagement.priority || 'Medium'}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-secondary-900">
                      Timeline
                    </h3>
                  </div>
                  <div className="card-body space-y-4">
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Start Date</label>
                      <p className="text-secondary-900">{formatDate(engagement.startDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-500">End Date</label>
                      <p className="text-secondary-900">{formatDate(engagement.endDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Current Phase</label>
                      <p className="text-secondary-900 capitalize">{engagement.currentPhase || 'Planning'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-500">Created</label>
                      <p className="text-secondary-900">{formatDate(engagement.createdDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {engagement.notes && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-medium text-secondary-900">
                      Notes
                    </h3>
                  </div>
                  <div className="card-body">
                    <p className="text-secondary-700 whitespace-pre-wrap">
                      {engagement.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-secondary-900">
                      Engagement Participants
                    </h3>
                    <button className="btn-primary text-sm">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Add Participant
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      No participants yet
                    </h3>
                    <p className="text-secondary-600">
                      Add team members and assign roles to get started
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-secondary-900">
                      Expected Deliverables
                    </h3>
                    <button className="btn-primary text-sm">
                      <DocumentIcon className="h-4 w-4 mr-2" />
                      Add Deliverable
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {engagement.deliverables && engagement.deliverables.length > 0 ? (
                    <div className="space-y-3">
                      {engagement.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex items-center p-3 bg-secondary-50 rounded-md">
                          <DocumentIcon className="h-5 w-5 text-secondary-600 mr-3" />
                          <span className="text-secondary-900">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DocumentIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-secondary-900 mb-2">
                        No deliverables defined
                      </h3>
                      <p className="text-secondary-600">
                        Define expected deliverables for this engagement
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-secondary-900">
                    Engagement Timeline
                  </h3>
                </div>
                <div className="card-body">
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                      Timeline coming soon
                    </h3>
                    <p className="text-secondary-600">
                      Detailed timeline view will be available in future versions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default EngagementDetails;