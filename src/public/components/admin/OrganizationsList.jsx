import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, ChevronUpIcon, ChevronDownIcon, EyeIcon, EditIcon, Building2Icon } from '../Icons';
import { fetchAPI } from '../../utils/api';

const OrganizationsList = () => {
  const [organizations, setOrganizations] = useState([]);
  const [organizationUsers, setOrganizationUsers] = useState({});
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // Load organizations
      const data = await fetchAPI('/api/admin/organizations');
      setOrganizations(data);
      
      // Load app settings for CRM links - fallback if API doesn't exist
      try {
        const settings = await fetchAPI('/api/config/app');
        setAppSettings(settings);
      } catch (settingsErr) {
        console.warn('Could not load app settings, using defaults');
        setAppSettings({
          app: {
            externalCRM: {
              'add-org': 'https://slackspace.capsulecrm.com/party/organisation/new'
            }
          }
        });
      }
      
      // Load users for each organization
      const usersMap = {};
      for (const org of data) {
        try {
          const users = await fetchAPI(`/api/admin/organizations/${org.id}/users`);
          usersMap[org.id] = users;
        } catch (err) {
          console.error(`Failed to load users for org ${org.id}:`, err);
          usersMap[org.id] = [];
        }
      }
      setOrganizationUsers(usersMap);
      
    } catch (err) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.id.toLowerCase().includes(searchLower) ||
      org.aka_names?.short_name?.toLowerCase().includes(searchLower) ||
      org.status.toLowerCase().includes(searchLower) ||
      org.org_domains?.some(domain => domain.toLowerCase().includes(searchLower))
    );
  });

  // Sort organizations
  const sortedOrganizations = [...filteredOrganizations].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle nested fields
    if (sortField === 'primary_contact') {
      const aUsers = organizationUsers[a.id] || [];
      const bUsers = organizationUsers[b.id] || [];
      const aPrimaryContacts = aUsers.filter(u => u.organization_roles?.includes('primary_contact'));
      const bPrimaryContacts = bUsers.filter(u => u.organization_roles?.includes('primary_contact'));
      aValue = aPrimaryContacts.length > 0 ? `${aPrimaryContacts[0].firstName} ${aPrimaryContacts[0].lastName}` : '';
      bValue = bPrimaryContacts.length > 0 ? `${bPrimaryContacts[0].firstName} ${bPrimaryContacts[0].lastName}` : '';
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4" /> : 
      <ChevronDownIcon className="w-4 h-4" />;
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPrimaryContacts = (orgId) => {
    const users = organizationUsers[orgId] || [];
    return users.filter(user => user.organization_roles?.includes('primary_contact'));
  };

  const renderCRMLink = (org) => {
    if (!appSettings?.app?.externalCRM) return null;
    
    if (org.crm_link) {
      return (
        <a 
          href={org.crm_link} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'purple' }}
          className="block text-sm hover:underline"
        >
          ☑️CRM Record
        </a>
      );
    } else {
      return (
        <a 
          href={appSettings.app.externalCRM['add-org']} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: 'red' }}
          className="block text-sm hover:underline"
        >
          ❌ No CRM Record
        </a>
      );
    }
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
        <div className="px-4 py-6 sm:px-0 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building2Icon className="w-8 h-8 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        </div>
        <Link
          to="/admin/organizations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Organization
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search organizations by name, ID, domain, or status..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {sortedOrganizations.length} of {organizations.length} organizations
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Organization Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('primary_contact')}
              >
                <div className="flex items-center space-x-1">
                  <span>Primary Contact</span>
                  <SortIcon field="primary_contact" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Domains
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('createdDate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  <SortIcon field="createdDate" />
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOrganizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{org.name}</div>
                  <div className="text-sm text-gray-500">{org.aka_names?.short_name || org.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(() => {
                      const primaryContacts = getPrimaryContacts(org.id);
                      if (primaryContacts.length > 0) {
                        return primaryContacts.map((contact, idx) => (
                          <div key={idx}>{contact.firstName} {contact.lastName}</div>
                        ));
                      } else {
                        return <span className="text-gray-400">None assigned</span>;
                      }
                    })()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(org.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {org.org_domains?.length > 0 ? (
                      <div className="space-y-1">
                        {org.org_domains.slice(0, 2).map((domain, idx) => (
                          <div key={idx} className="text-xs bg-gray-100 rounded px-2 py-1 inline-block mr-1">
                            {domain}
                          </div>
                        ))}
                        {org.org_domains.length > 2 && (
                          <span className="text-xs text-gray-500">+{org.org_domains.length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No domains</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(org.createdDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="space-y-1">
                    <Link
                      to={`/admin/organizations/${org.id}`}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center space-x-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    {renderCRMLink(org)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedOrganizations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No organizations found matching your search.' : 'No organizations found.'}
          </div>
        )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizationsList;