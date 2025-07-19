import React from 'react';
import { ExclamationIcon, UserIcon } from './Icons';

const AccessDenied = ({ user, requiredRole }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ExclamationIcon className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            You do not have permission to access this page. This area requires administrator privileges.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Required Role:</strong> {requiredRole || 'System Administrator'}<br />
              <strong>Your Roles:</strong> {
                user.system_roles?.length > 0 
                  ? user.system_roles.join(', ') 
                  : user.organization_roles?.length > 0 
                    ? user.organization_roles.join(', ')
                    : 'No roles assigned'
              }
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
              <div className="text-gray-500">{user.email}</div>
              <div className="text-gray-500">{user.organization}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Return to Home
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-xs text-gray-500">
            <p>
              If you believe you should have access to this page, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;