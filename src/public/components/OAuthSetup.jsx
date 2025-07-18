import React, { useState } from 'react';
import { UserIcon, CheckIcon } from './Icons';

const OAuthSetup = ({ adminUser, onComplete }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = async (provider) => {
    setIsConnecting(true);
    setError('');

    try {
      // Redirect to OAuth provider
      window.location.href = `/auth/${provider}`;
    } catch (err) {
      setError('Failed to initiate authentication');
      setIsConnecting(false);
    }
  };

  const oauthProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Sign in with your Google account'
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      icon: 'Ⓜ️',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Sign in with your Microsoft account'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      description: 'Sign in with your LinkedIn account'
    },
    {
      id: 'okta',
      name: 'Okta',
      icon: '🔐',
      color: 'bg-gray-800 hover:bg-gray-900',
      description: 'Sign in with your Okta account'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
            <CheckIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-secondary-900">
          Admin User Created!
        </h2>
        <p className="mt-2 text-center text-sm text-secondary-600">
          Welcome {adminUser?.firstName} {adminUser?.lastName}. Now authenticate with your preferred service.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-body">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Choose Authentication Method
              </h3>
              <p className="text-sm text-secondary-600">
                Select your preferred OpenID Connect provider to secure your account
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {oauthProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleOAuthLogin(provider.id)}
                  disabled={isConnecting}
                  className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white ${provider.color} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  <span className="text-lg mr-3">{provider.icon}</span>
                  {isConnecting ? 'Connecting...' : `Sign in with ${provider.name}`}
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Secure Authentication
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Your authentication is handled securely through OpenID Connect. 
                      Spurilo never stores your passwords - we only receive your 
                      name and email address to create your profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={onComplete}
                className="text-sm text-secondary-500 hover:text-secondary-700"
              >
                Skip authentication for now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthSetup;