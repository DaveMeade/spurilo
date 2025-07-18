import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InitialSetup from './components/InitialSetup';
import OAuthSetup from './components/OAuthSetup';
import AdminDashboard from './components/AdminDashboard';
import EngagementDetails from './components/EngagementDetails';
import NoAccess from './components/NoAccess';
import { apiGet } from './utils/api';

function App() {
  const [isInitialized, setIsInitialized] = useState(null); // null = checking, true = ready, false = needs setup
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [newAdminUser, setNewAdminUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check system status and authentication
      const response = await apiGet('/api/system/status');
      const data = await response.json();
      
      console.log('System status response:', data);
      
      setIsInitialized(data.hasAdminUser);
      setIsAuthenticated(data.isAuthenticated);
      setUser(data.user);
    } catch (error) {
      console.error('Failed to check initialization status:', error);
      // Assume needs setup if we can't check
      setIsInitialized(false);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminCreated = (adminUser) => {
    console.log('Admin user created:', adminUser);
    setNewAdminUser(adminUser);
    setIsInitialized(true);
  };

  const handleAuthComplete = () => {
    // Re-check status after auth
    checkInitializationStatus();
    setNewAdminUser(null);
  };

  const handleViewEngagement = (engagement) => {
    setSelectedEngagement(engagement);
    setCurrentView('engagement-details');
  };

  const handleCloseEngagementDetails = () => {
    setSelectedEngagement(null);
    setCurrentView('dashboard');
  };

  // Check if user has access to the main application
  const hasAccess = (user) => {
    if (!user) return false;
    
    // Debug logging
    console.log('hasAccess check for user:', {
      email: user.email,
      roles: user.roles,
      system_roles: user.system_roles,
      organization_roles: user.organization_roles,
      engagements: user.engagements,
      engagementCount: user.engagements?.length || 0
    });
    
    // Check new system roles first
    if (user.system_roles?.includes('admin') || user.system_roles?.includes('auditor')) {
      console.log('User has system-level access');
      return true;
    }
    
    // Check legacy roles for backward compatibility
    if (user.roles?.includes('admin') || user.roles?.includes('auditor')) {
      console.log('User has admin/auditor access (legacy)');
      return true;
    }
    
    // Check organization roles
    if (user.organization_roles?.length > 0) {
      console.log('User has organization-level access');
      return true;
    }
    
    // Other users need to have engagements assigned
    const hasEngagements = user.engagements && user.engagements.length > 0;
    console.log('User has engagements:', hasEngagements);
    return hasEngagements;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading Spurilo...</p>
        </div>
      </div>
    );
  }

  // Initial setup required
  if (isInitialized === false) {
    return <InitialSetup onAdminCreated={handleAdminCreated} />;
  }

  // Admin created but needs OAuth setup
  if (isInitialized && newAdminUser && !isAuthenticated) {
    return <OAuthSetup adminUser={newAdminUser} onComplete={handleAuthComplete} />;
  }

  // Authentication required
  if (isInitialized && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Authentication Required</h1>
          <p className="text-secondary-600 mb-6">Please sign in to access Spurilo</p>
          <div className="space-y-2">
            <a href="/auth/google" className="btn-primary block">Sign in with Google</a>
            <a href="/auth/microsoft" className="btn-secondary block">Sign in with Microsoft</a>
            <a href="/auth/linkedin" className="btn-secondary block">Sign in with LinkedIn</a>
            <a href="/auth/okta" className="btn-secondary block">Sign in with Okta</a>
          </div>
        </div>
      </div>
    );
  }

  // Debug current auth state
  console.log('Current auth state:', {
    isInitialized,
    isAuthenticated, 
    user: user ? {email: user.email, roles: user.roles} : null,
    isLoading
  });

  // Check if authenticated user has access
  if (isAuthenticated && user && !hasAccess(user)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <NoAccess user={user} />
      </div>
    );
  }

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      {currentView === 'dashboard' && (
        <AdminDashboard onViewEngagement={handleViewEngagement} />
      )}

      {currentView === 'engagement-details' && selectedEngagement && (
        <EngagementDetails
          engagement={selectedEngagement}
          onClose={handleCloseEngagementDetails}
        />
      )}
    </div>
  );
}

export default App;