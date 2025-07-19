import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { XIcon, Building2Icon, UsersIcon, FileTextIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon, SearchIcon } from './Icons';

const SidebarMenu = ({ isOpen, onClose, user }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const location = useLocation();

  // Auto-expand groups based on current path
  useEffect(() => {
    if (location.pathname.startsWith('/admin/organizations')) {
      setExpandedGroups(prev => ({ ...prev, organizations: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const isAdmin = user?.system_roles?.includes('admin');

  const menuGroups = [
    // Admin menu items (only shown to admins)
    ...(isAdmin ? [{
      title: 'Admin',
      items: [
        {
          name: 'organizations',
          label: 'Organizations',
          icon: Building2Icon,
          subItems: [
            { path: '/admin/organizations', label: 'Browse', icon: SearchIcon },
            { path: '/admin/organizations/new', label: 'Create', icon: PlusIcon }
          ]
        }
      ]
    }] : []),
    // Regular menu items
    {
      title: 'Main',
      items: [
        {
          name: 'dashboard',
          label: 'Dashboard',
          icon: FileTextIcon,
          path: '/dashboard'
        },
        {
          name: 'profile',
          label: 'Profile',
          icon: UsersIcon,
          path: '/profile'
        }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Content */}
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-64px)]">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.title && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.name}>
                    {item.subItems ? (
                      // Expandable menu item
                      <div>
                        <button
                          onClick={() => toggleGroup(item.name)}
                          className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <div className="flex items-center">
                            <item.icon className="w-5 h-5 mr-3" />
                            <span>{item.label}</span>
                          </div>
                          {expandedGroups[item.name] ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </button>
                        {expandedGroups[item.name] && (
                          <ul className="ml-8 mt-1 space-y-1">
                            {item.subItems.map((subItem) => (
                              <li key={subItem.path}>
                                <Link
                                  to={subItem.path}
                                  onClick={onClose}
                                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                    location.pathname === subItem.path
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <subItem.icon className="w-4 h-4 mr-2" />
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      // Regular menu item
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                          location.pathname === item.path
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default SidebarMenu;