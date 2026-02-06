'use client';

import React, { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import BasicInformation from './tabs/basicInformation';
import BusinessInformation from './tabs/businessInformation';
import UserPermission from './tabs/userPermission';
import PaymentMethods from './tabs/paymentMethods';
import Photos from './tabs/photos';
import Notifications from './tabs/notifications';

type TabName = 'Basic' | 'Business Information' | 'Permissions' | 'Payment Methods' | 'Services' | 'Photos' | 'Notifications';

interface Tab {
  id: TabName;
  label: string;
}

interface UserListPageProps {
  business: string;
}

export default function CompanySettings({ business }: UserListPageProps) {
  const [activeTab, setActiveTab] = useState<TabName>('Basic');
  const { isDark } = useTheme();

  const tabs: Tab[] = [
    { id: 'Basic', label: 'Basic' },
    { id: 'Business Information', label: 'Business Information' },
    { id: 'Permissions', label: 'Permissions' },
    { id: 'Payment Methods', label: 'Payment Methods' },
    { id: 'Services', label: 'Services' },
    { id: 'Photos', label: 'Photos' },
    { id: 'Notifications', label: 'Notifications' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-2 transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Company Settings
            </h1>
            <p className={`text-base transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Manage your business profile and details
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'accent-bg text-white shadow-md'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className={`rounded-lg shadow-sm border transition-colors duration-200 p-8 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Basic Information Tab */}
          {activeTab === 'Basic' && (
            <div>
              <BasicInformation business={business}/>
            </div>
          )}

          {/* Business Information Tab */}
          {activeTab === 'Business Information' && (
            <div>
              <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Business Information
              </h2>
              <BusinessInformation business={business}/>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'Permissions' && (
            <div>
              <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Permissions
              </h2>
              <UserPermission business={business}/>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'Payment Methods' && (
            <div>
              <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Payment Methods
              </h2>
             <PaymentMethods business={business}/>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'Services' && (
            <div>
              <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Services
              </h2>
              <p className={`transition-colors duration-200 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Content for Services tab will go here
              </p>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'Photos' && (
            <div>
              <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Photos
              </h2>
              <Photos/>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <div>
              <h2 className={`text-2xl font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Notifications
              </h2>
              <Notifications business={business}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
