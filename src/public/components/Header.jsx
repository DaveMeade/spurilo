import React, { useState, useEffect } from 'react';
import { SearchIcon, UserIcon, ChevronDownIcon, CogIcon, LogoutIcon } from './Icons';

const Header = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = () => {
    window.location.href = '/auth/google';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Product Name */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary-700">
              Spurilo
            </h1>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search engagements, users, findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>

          {/* Right: Version, Date, and User Menu */}
          <div className="flex items-center space-x-6 text-sm text-secondary-600">
            {/* Version */}
            <div className="hidden sm:block">
              <span className="font-medium">v0.8.0</span>
            </div>

            {/* Date and Time */}
            <div className="hidden md:flex items-center space-x-1">
              <span>{formatDate(currentTime)}</span>
              <span className="text-secondary-400">•</span>
              <span>{formatTime(currentTime)}</span>
            </div>

            {/* User Menu */}
            <div className="relative user-menu">
              {user ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {initials || <UserIcon className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:block">{user.firstName} {user.lastName}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-secondary-100">
                          <div className="text-sm font-medium text-secondary-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-secondary-500">
                            {user.email}
                          </div>
                          <div className="text-xs text-secondary-400">
                            {user.organization}
                          </div>
                        </div>

                        {/* Menu Items */}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // TODO: Open preferences modal
                            console.log('Open preferences');
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900"
                        >
                          <CogIcon className="h-4 w-4 mr-3" />
                          Preferences
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleSignOut();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900"
                        >
                          <LogoutIcon className="h-4 w-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;