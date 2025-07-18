import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon, ExclamationIcon } from './Icons';
import { apiGet, apiPost } from '../utils/api';

const CreateEngagementModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    engagementType: '',
    customerName: '',
    auditor: '',
    notes: '',
    framework: 'NIST'
  });
  const [engagementTypes, setEngagementTypes] = useState([]);
  const [auditors, setAuditors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEngagementTypes();
    loadAuditors();
  }, []);

  const loadEngagementTypes = async () => {
    try {
      const response = await apiGet('/api/engagement-types');
      if (response.ok) {
        const data = await response.json();
        setEngagementTypes(data);
      }
    } catch (error) {
      console.error('Failed to load engagement types:', error);
    }
  };

  const loadAuditors = async () => {
    try {
      const response = await apiGet('/api/users?role=auditor');
      if (response.ok) {
        const data = await response.json();
        setAuditors(data);
      }
    } catch (error) {
      console.error('Failed to load auditors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Generate engagement name if not provided
      const engagementName = formData.name || `${formData.customerName} ${getEngagementTypeLabel(formData.engagementType)}`;
      
      const submissionData = {
        ...formData,
        name: engagementName,
        scope: `${getEngagementTypeLabel(formData.engagementType)} for ${formData.customerName}`,
        consultant: formData.auditor,
        createdBy: 'admin-001' // TODO: Get from current user context
      };

      await onSubmit(submissionData);
    } catch (err) {
      setError(err.message || 'An error occurred while creating the engagement');
      setIsSubmitting(false);
    }
  };

  const getEngagementTypeLabel = (type) => {
    const typeMap = {
      'gap-assessment': 'Gap Assessment',
      'internal-audit': 'Internal Audit',
      'audit-prep': 'Audit Prep',
      'audit-facilitation': 'Audit Facilitation'
    };
    return typeMap[type] || type;
  };

  const isFormValid = formData.engagementType && formData.customerName && formData.auditor;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-xl font-bold text-secondary-900">
            Create New Engagement
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <ExclamationIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Type */}
          <div>
            <label htmlFor="engagementType" className="label">
              Engagement Type *
            </label>
            <select
              id="engagementType"
              name="engagementType"
              required
              value={formData.engagementType}
              onChange={handleInputChange}
              className="input"
            >
              <option value="">Select engagement type...</option>
              <option value="gap-assessment">Gap Assessment</option>
              <option value="internal-audit">Internal Audit</option>
              <option value="audit-prep">Audit Prep</option>
              <option value="audit-facilitation">Audit Facilitation</option>
            </select>
            {formData.engagementType && (
              <p className="mt-1 text-sm text-secondary-600">
                {getEngagementTypeDescription(formData.engagementType)}
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="label">
              Customer Name *
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              required
              value={formData.customerName}
              onChange={handleInputChange}
              className="input"
              placeholder="Acme Corporation"
            />
          </div>

          {/* Auditor */}
          <div>
            <label htmlFor="auditor" className="label">
              Auditor *
            </label>
            <select
              id="auditor"
              name="auditor"
              required
              value={formData.auditor}
              onChange={handleInputChange}
              className="input"
            >
              <option value="">Select auditor...</option>
              <option value="Jane Auditor">Jane Auditor</option>
              <option value="John Smith">John Smith</option>
              <option value="External Consultant">External Consultant</option>
            </select>
          </div>

          {/* Engagement Name (Optional) */}
          <div>
            <label htmlFor="name" className="label">
              Engagement Name (Optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="input"
              placeholder="Auto-generated from customer and type"
            />
            <p className="mt-1 text-sm text-secondary-500">
              Leave blank to auto-generate: "{formData.customerName} {getEngagementTypeLabel(formData.engagementType)}"
            </p>
          </div>

          {/* Framework */}
          <div>
            <label htmlFor="framework" className="label">
              Compliance Framework
            </label>
            <select
              id="framework"
              name="framework"
              value={formData.framework}
              onChange={handleInputChange}
              className="input"
            >
              <option value="NIST">NIST Cybersecurity Framework</option>
              <option value="SOC2">SOC 2</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="PCI-DSS">PCI DSS</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleInputChange}
              className="input"
              placeholder="Additional notes or requirements..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Create Engagement
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const getEngagementTypeDescription = (type) => {
  const descriptions = {
    'gap-assessment': 'Identifies differences between current security posture and desired compliance framework',
    'internal-audit': 'Independent assessment designed to add value and improve operations',
    'audit-prep': 'Helps prepare for external audit by gathering responses and evidence',
    'audit-facilitation': 'Represents organization to outside auditors throughout the engagement'
  };
  return descriptions[type] || '';
};

export default CreateEngagementModal;