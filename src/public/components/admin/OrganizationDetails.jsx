import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, Building2Icon, UsersIcon, FileTextIcon, EditIcon, SaveIcon, XIcon } from '../Icons';
import { fetchAPI } from '../../utils/api';

const OrganizationDetails = () => {
  const { organizationId } = useParams();
  const [organization, setOrganization] = useState(null);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [roleConfig, setRoleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrg, setEditedOrg] = useState(null);

  useEffect(() => {
    loadOrganizationData();
  }, [organizationId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Load current user info
      const statusResponse = await fetchAPI('/api/system/status');
      setCurrentUser(statusResponse.user);
      
      // Load organization details
      const orgData = await fetchAPI(`/api/admin/organizations/${organizationId}`);
      setOrganization(orgData);
      setEditedOrg(orgData);
      
      // Load organization users
      const usersData = await fetchAPI(`/api/admin/organizations/${organizationId}/users`);
      
      // Load system admins separately using the user role helper
      let systemAdmins = [];
      try {
        const adminUsers = await fetchAPI('/api/users?role=admin');
        // Filter out admins who are already in the organization users list
        systemAdmins = adminUsers.filter(user => 
          !usersData.some(orgUser => orgUser.userId === user.userId)
        );
      } catch (err) {
        console.warn('Could not load system admin users:', err);
      }
      
      // Combine org users with system admins
      const combinedUsers = [
        ...usersData.map(user => ({ ...user, userType: 'organization' })),
        ...systemAdmins.map(user => ({ ...user, userType: 'system_admin' }))
      ];
      
      setUsers(usersData);
      setAllUsers(combinedUsers);
      
      // Load role configuration for name mapping
      try {
        // This endpoint might not exist yet, so we'll handle gracefully
        const roles = await fetchAPI('/api/config/user-roles').catch(() => null);
        setRoleConfig(roles);
      } catch (roleErr) {
        console.warn('Could not load role configuration');
      }
      
      // Load engagements
      const engagementsData = await fetchAPI(`/api/admin/organizations/${organizationId}/engagements`);
      setEngagements(engagementsData);
    } catch (err) {
      setError(err.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Check if ID is being changed and user is admin
      let updateData = { ...editedOrg };
      
      if (currentUser?.system_roles?.includes('admin') && editedOrg?.id !== organizationId) {
        // ID is being changed by an admin - the backend will handle uniqueness
        console.log('Admin is changing organization ID from', organizationId, 'to', editedOrg.id);
      }
      
      const updated = await fetchAPI(`/api/admin/organizations/${organizationId}`, {
        method: 'PUT',
        body: updateData
      });
      
      setOrganization(updated);
      setIsEditing(false);
      
      // If ID was changed, we might need to redirect to the new URL
      if (updated.id !== organizationId) {
        window.location.href = `/admin/organizations/${updated.id}`;
      }
    } catch (err) {
      alert('Failed to update organization: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditedOrg(organization);
    setIsEditing(false);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paused: 'bg-blue-100 text-blue-800',
      disabled: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Map role ID to display name
  const getRoleName = (roleId, roleType = 'organization') => {
    // Default role names if config isn't loaded
    const defaultNames = {
      admin: 'Administrator',
      primary_contact: 'Primary Contact',
      manage_engagements: 'Engagement Manager',
      view_reports: 'Report Viewer',
      manage_users: 'User Manager',
      pending: 'Pending User',
      auditor: 'Auditor'
    };
    
    if (roleConfig) {
      const roles = roleType === 'system' ? roleConfig.systemRoles : roleConfig.organizationRoles;
      return roles?.[roleId]?.name || defaultNames[roleId] || roleId;
    }
    
    return defaultNames[roleId] || roleId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/organizations"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <Building2Icon className="w-8 h-8 text-gray-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
              <p className="text-sm text-gray-500">{organization?.id}</p>
            </div>
          </div>
          {getStatusBadge(organization?.status)}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'details', label: 'Details', icon: Building2Icon },
            { id: 'users', label: 'Users', icon: UsersIcon, count: allUsers.length },
            { id: 'engagements', label: 'Engagements', icon: FileTextIcon, count: engagements.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Organization Details</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <EditIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <SaveIcon className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <XIcon className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedOrg?.name || ''}
                        onChange={(e) => setEditedOrg({ ...editedOrg, name: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{organization?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Organization ID</label>
                    {isEditing && currentUser?.system_roles?.includes('admin') ? (
                      <input
                        type="text"
                        value={editedOrg?.id || ''}
                        onChange={(e) => setEditedOrg({ ...editedOrg, id: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        placeholder="Enter organization ID"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 font-mono">{organization?.id}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    {isEditing ? (
                      <select
                        value={editedOrg?.status || ''}
                        onChange={(e) => setEditedOrg({ ...editedOrg, status: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="disabled">Disabled</option>
                        <option value="archived">Archived</option>
                      </select>
                    ) : (
                      <p className="mt-1">{getStatusBadge(organization?.status)}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CRM Link</label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedOrg?.crm_link || ''}
                        onChange={(e) => setEditedOrg({ ...editedOrg, crm_link: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {organization?.crm_link ? (
                          <a href={organization.crm_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {organization.crm_link}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Variants */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Name Variants</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Formal Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedOrg?.aka_names?.formal_name || ''}
                        onChange={(e) => setEditedOrg({
                          ...editedOrg,
                          aka_names: { ...editedOrg.aka_names, formal_name: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{organization?.aka_names?.formal_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Short Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedOrg?.aka_names?.short_name || ''}
                        onChange={(e) => setEditedOrg({
                          ...editedOrg,
                          aka_names: { ...editedOrg.aka_names, short_name: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{organization?.aka_names?.short_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">DBA</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedOrg?.aka_names?.dba || ''}
                        onChange={(e) => setEditedOrg({
                          ...editedOrg,
                          aka_names: { ...editedOrg.aka_names, dba: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{organization?.aka_names?.dba || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Domains */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Email Domains</h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {(editedOrg?.org_domains || []).map((domain, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => {
                            const newDomains = [...editedOrg.org_domains];
                            newDomains[index] = e.target.value;
                            setEditedOrg({ ...editedOrg, org_domains: newDomains });
                          }}
                          className="flex-1 border-gray-300 rounded-md shadow-sm"
                        />
                        <button
                          onClick={() => {
                            const newDomains = editedOrg.org_domains.filter((_, i) => i !== index);
                            setEditedOrg({ ...editedOrg, org_domains: newDomains });
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditedOrg({
                          ...editedOrg,
                          org_domains: [...(editedOrg.org_domains || []), '']
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Domain
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {organization?.org_domains?.length > 0 ? (
                      organization.org_domains.map((domain, idx) => (
                        <div key={idx} className="text-sm bg-gray-100 rounded px-3 py-1 inline-block mr-2">
                          {domain}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No domains configured</p>
                    )}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEditing ? editedOrg?.settings?.allowSelfRegistration : organization?.settings?.allowSelfRegistration}
                      onChange={(e) => isEditing && setEditedOrg({
                        ...editedOrg,
                        settings: { ...editedOrg.settings, allowSelfRegistration: e.target.checked }
                      })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow self-registration</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEditing ? editedOrg?.settings?.requireApproval : organization?.settings?.requireApproval}
                      onChange={(e) => isEditing && setEditedOrg({
                        ...editedOrg,
                        settings: { ...editedOrg.settings, requireApproval: e.target.checked }
                      })}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Require approval for new users</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created by:</span>
                  <p className="font-medium">{organization?.createdBy}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created on:</span>
                  <p className="font-medium">{new Date(organization?.createdDate).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Last updated:</span>
                  <p className="font-medium">{new Date(organization?.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Organization Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <tr key={user.userId} className={user.userType === 'system_admin' ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                          {user.userType === 'system_admin' && (
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              System Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.system_roles?.map((role) => (
                            <span key={role} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              System {getRoleName(role, 'system')}
                            </span>
                          ))}
                          {user.organization_roles?.map((role) => (
                            <span key={role} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              {getRoleName(role, 'organization')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found for this organization.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'engagements' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Organization Engagements</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {engagements.map((engagement) => (
                    <tr key={engagement.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {engagement.name}
                        </div>
                        <div className="text-sm text-gray-500">{engagement.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{engagement.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(engagement.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{engagement.stage}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(engagement.timeline?.start_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {engagements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No engagements found for this organization.
                </div>
              )}
            </div>
          </div>
        )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizationDetails;