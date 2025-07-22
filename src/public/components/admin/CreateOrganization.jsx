import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, Building2Icon, PlusIcon, XIcon } from '../Icons';
import { fetchAPI } from '../../utils/api';

const CreateOrganization = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    status: 'pending',
    crm_link: '',
    aka_names: {
      formal_name: '',
      friendly_name: '',
      short_name: '',
      dba: ''
    },
    org_domains: [''],
    settings: {
      allowSelfRegistration: false,
      defaultOrganizationRole: 'pending',
      requireApproval: true,
      defaultEngagementRole: 'sme'
    }
  });

  // Track if ID was manually edited by user
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Auto-generate ID if empty
      const finalData = { ...formData };
      if (!finalData.id && finalData.name) {
        finalData.id = generateId(finalData.name);
      }
      
      // Clean up empty domains
      const cleanedData = {
        ...finalData,
        org_domains: finalData.org_domains.filter(domain => domain.trim() !== '')
      };
      
      const result = await fetchAPI('/api/admin/organizations', {
        method: 'POST',
        body: cleanedData
      });
      
      // Navigate to the new organization's details page
      navigate(`/admin/organizations/${result.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleDomainChange = (index, value) => {
    const newDomains = [...formData.org_domains];
    newDomains[index] = value;
    setFormData({ ...formData, org_domains: newDomains });
  };

  const addDomain = () => {
    setFormData({
      ...formData,
      org_domains: [...formData.org_domains, '']
    });
  };

  const removeDomain = (index) => {
    const newDomains = formData.org_domains.filter((_, i) => i !== index);
    setFormData({ ...formData, org_domains: newDomains });
  };

  // Auto-generate ID from name
  const generateId = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
  };

  // Handle name field blur - update ID only if not manually edited
  const handleNameBlur = () => {
    if (!idManuallyEdited && formData.name) {
      setFormData(prev => ({
        ...prev,
        id: generateId(formData.name)
      }));
    }
  };

  // Handle ID field change - mark as manually edited
  const handleIdChange = (value) => {
    setIdManuallyEdited(true);
    handleInputChange('id', value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/admin/organizations"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex items-center space-x-3">
          <Building2Icon className="w-8 h-8 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Create New Organization</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={handleNameBlur}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization ID *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                pattern="[a-zA-Z0-9\-]+"
                placeholder="Leave empty to auto-generate"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Letters, numbers, and hyphens only. Will auto-generate from organization name if left empty.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CRM Link
              </label>
              <input
                type="url"
                value={formData.crm_link}
                onChange={(e) => handleInputChange('crm_link', e.target.value)}
                placeholder="https://example.com/customer/123"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Name Variants */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Name Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Formal Name
              </label>
              <input
                type="text"
                value={formData.aka_names.formal_name}
                onChange={(e) => handleInputChange('aka_names.formal_name', e.target.value)}
                placeholder="Company Name, LLC"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Friendly Name
              </label>
              <input
                type="text"
                value={formData.aka_names.friendly_name}
                onChange={(e) => handleInputChange('aka_names.friendly_name', e.target.value)}
                placeholder="Company"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Short Name
              </label>
              <input
                type="text"
                value={formData.aka_names.short_name}
                onChange={(e) => handleInputChange('aka_names.short_name', e.target.value)}
                placeholder="COMP"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                DBA (Doing Business As)
              </label>
              <input
                type="text"
                value={formData.aka_names.dba}
                onChange={(e) => handleInputChange('aka_names.dba', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Email Domains */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Email Domains</h2>
          <p className="text-sm text-gray-600 mb-3">
            Users with email addresses from these domains can self-register (if enabled).
          </p>
          <div className="space-y-2">
            {formData.org_domains.map((domain, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => handleDomainChange(index, e.target.value)}
                  placeholder="example.com"
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.org_domains.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDomain(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addDomain}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Domain</span>
            </button>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.settings.allowSelfRegistration}
                onChange={(e) => handleInputChange('settings.allowSelfRegistration', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Allow users to self-register with organization email domains
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.settings.requireApproval}
                onChange={(e) => handleInputChange('settings.requireApproval', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Require approval for new user registrations
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Organization Role
              </label>
              <select
                value={formData.settings.defaultOrganizationRole}
                onChange={(e) => handleInputChange('settings.defaultOrganizationRole', e.target.value)}
                className="mt-1 block w-full md:w-1/2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="manage_engagements">Engagement Manager</option>
                <option value="view_reports">Report Viewer</option>
                <option value="manage_users">User Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Engagement Role
              </label>
              <select
                value={formData.settings.defaultEngagementRole}
                onChange={(e) => handleInputChange('settings.defaultEngagementRole', e.target.value)}
                className="mt-1 block w-full md:w-1/2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sme">SME</option>
                <option value="controlOwner">Control Owner</option>
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Link
            to="/admin/organizations"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </div>
      </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateOrganization;