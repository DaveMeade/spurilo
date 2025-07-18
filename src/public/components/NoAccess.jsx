import React from 'react';
import { UserIcon, ExclamationIcon } from './Icons';

const NoAccess = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <ExclamationIcon className="h-8 w-8 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Pending
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Welcome to Spurilo! Your account has been created successfully, but you haven't been assigned to any engagements yet.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>What's next?</strong><br />
              Contact your system administrator to be added to specific compliance engagements. Once assigned, you'll have access to the relevant controls and documentation.
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
              <div className="text-gray-500">{user.email}</div>
              <div className="text-gray-500">{user.organization}</div>
              {/* Display actual roles if any exist */}
              {(user.system_roles?.length > 0 || user.organization_roles?.length > 0 || user.roles?.length > 0) && (
                <div className="text-xs text-gray-400 mt-1">
                  {user.system_roles?.length > 0 && (
                    <div>System Roles: {user.system_roles.join(', ')}</div>
                  )}
                  {user.organization_roles?.length > 0 && (
                    <div>Organization Roles: {user.organization_roles.join(', ')}</div>
                  )}
                  {/* Legacy roles for backward compatibility */}
                  {!user.system_roles?.length && !user.organization_roles?.length && user.roles?.length > 0 && (
                    <div>Roles: {user.roles.join(', ')}</div>
                  )}
                </div>
              )}
              {/* Show 'No roles assigned' if user has no roles */}
              {(!user.system_roles?.length && !user.organization_roles?.length && !user.roles?.length) && (
                <div className="text-xs text-gray-400 mt-1">No roles assigned</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // TODO: Open preferences modal
                console.log('Open preferences');
              }}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Update Profile & Preferences
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-xs text-gray-500">
            <p>
              If you believe this is an error or need immediate access, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoAccess;