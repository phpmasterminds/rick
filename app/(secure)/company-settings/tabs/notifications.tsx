'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Bell, Mail, ShoppingCart, MessageSquare, Package, UserCheck, UserX, FileText, Download, UserPlus, Shield, AtSign, X, LucideIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface NotificationState {
  newOrders: boolean;
  messages: boolean;
  itemBelowPar: boolean;
  userLogin: boolean;
  userLogout: boolean;
  newUserAdded: boolean;
  userPermissionsChanged: boolean;
  dailyRecap: boolean;
  metrcImport: boolean;
}

interface NotificationOption {
  key: keyof NotificationState;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface NotificationGroup {
  title: string;
  notifications: NotificationOption[];
}

interface UserListPageProps {
  business: string;
}

export default function Notifications({ business }: UserListPageProps) {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const hasFetched = useRef<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationState>({
    newOrders: false,
    messages: false,
    itemBelowPar: false,
    userLogin: false,
    userLogout: false,
    newUserAdded: false,
    userPermissionsChanged: false,
    dailyRecap: false,
    metrcImport: false
  });

  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);

  const [newEmail, setNewEmail] = useState<string>('');

  // Fetch notification settings on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      // Skip if already fetched or no business ID
      if (hasFetched.current || !business) {
        if (!business) setIsLoading(false);
        return;
      }

      // Mark as fetched immediately to prevent duplicate calls
      hasFetched.current = true;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `/api/business/settings/company?business=${business}&ipage=notifications`,
          {
            timeout: 10000,
          }
        );

        console.log('Notifications API response:', response.data);

        // Handle nested response structure
        if (response.data.success && response.data.data?.status === 'success' && response.data.data?.data) {
          const apiData = response.data.data.data;
          
          // Update notifications if data exists (API field: notification_settings)
          if (apiData.notification_settings) {
            const parsedNotifications = typeof apiData.notification_settings === 'string' 
              ? JSON.parse(apiData.notification_settings) 
              : apiData.notification_settings;
            
            console.log('Parsed notification settings:', parsedNotifications);
            
            // Only update if parsed data is not null
            if (parsedNotifications && typeof parsedNotifications === 'object') {
              setNotifications(parsedNotifications);
            }
          }

          // Update email recipients if data exists (API field: notification_emails)
          if (apiData.notification_emails) {
            const parsedEmails = typeof apiData.notification_emails === 'string'
              ? JSON.parse(apiData.notification_emails)
              : apiData.notification_emails;
            
            console.log('Parsed notification emails:', parsedEmails);
            
            // Only update if parsed data is a valid array
            if (Array.isArray(parsedEmails) && parsedEmails.length > 0) {
              setEmailRecipients(parsedEmails);
            }
          }
          
          toast.success('Notification settings loaded successfully');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        const errorMsg =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Failed to load notification settings';
        toast.error(errorMsg);
        // Reset flag on error so retry is possible
        hasFetched.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [business]);

  const toggleNotification = (key: keyof NotificationState): void => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addEmail = (): void => {
    const email = newEmail.trim();
    if (email && isValidEmail(email)) {
      if (!emailRecipients.includes(email)) {
        setEmailRecipients(prev => [...prev, email]);
        setNewEmail('');
      }
    }
  };

  const removeEmail = (emailToRemove: string): void => {
    setEmailRecipients(prev => prev.filter(email => email !== emailToRemove));
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = async (): Promise<void> => {
    if (!business) {
      toast.error('Business ID not found');
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare data for API with correct field names
      const dataToSave = {
        notification_settings: notifications,
        notification_emails: emailRecipients,
        businessId: business,
        ipage: 'notifications'
      };

      console.log('Saving notification settings:', dataToSave);

      const response = await axios.put(
        `/api/business/settings/company?business=${business}`, 
        dataToSave,
        {
          timeout: 10000,
        }
      );

      if (response.data.success) {
        toast.success('Notification settings updated successfully');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to save notification settings';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationGroups: NotificationGroup[] = [
    {
      title: 'Business Operations',
      notifications: [
        {
          key: 'newOrders',
          title: 'New Orders',
          description: 'Receive email notifications when you have a new order',
          icon: ShoppingCart
        },
        {
          key: 'messages',
          title: 'Messages',
          description: 'Get notified when you receive new messages from customers',
          icon: MessageSquare
        },
        {
          key: 'itemBelowPar',
          title: 'Item Below Par',
          description: 'Alert when inventory items fall below par levels',
          icon: Package
        }
      ]
    },
    {
      title: 'User Activity',
      notifications: [
        {
          key: 'userLogin',
          title: 'Assigned Users Login',
          description: 'Get notified when assigned users log into the system',
          icon: UserCheck
        },
        {
          key: 'userLogout',
          title: 'Assigned Users Log Out',
          description: 'Receive alerts when assigned users log out of the system',
          icon: UserX
        },
        {
          key: 'newUserAdded',
          title: 'New User Added',
          description: 'Get notified when a new user is added to your organization',
          icon: UserPlus
        },
        {
          key: 'userPermissionsChanged',
          title: 'User Permissions Changed',
          description: 'Receive alerts when user permissions or roles are modified',
          icon: Shield
        }
      ]
    },
    {
      title: 'System & Reports',
      notifications: [
        {
          key: 'dailyRecap',
          title: 'Daily Recap',
          description: 'Receive a daily summary of orders, messages, and inventory updates',
          icon: FileText
        },
        {
          key: 'metrcImport',
          title: 'Metrc Import',
          description: 'Get notified when Metrc data imports are completed or require attention',
          icon: Download
        }
      ]
    }
  ];

  const enabledCount = Object.values(notifications).filter(Boolean).length;
  const totalCount = Object.keys(notifications).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className={`p-4 rounded-lg transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Bell size={32} className="accent-text" />
            </div>
            <h1 className={`text-4xl font-bold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Notifications
            </h1>
          </div>
          <p className={`text-lg transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Choose which email notifications you'd like to receive
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-12 flex flex-col items-center justify-center ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading notification settings...
            </p>
          </div>
        )}

        {/* Content - Hidden while loading */}
        {!isLoading && (
          <>
            {/* Email Recipients Section */}
        <div className="mb-8">
          <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-8 ${
            isDark
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-lg transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <AtSign size={24} className="accent-text" />
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Email Recipients
                </h2>
                <p className={`text-sm mt-1 transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Add email addresses to receive notifications
                </p>
              </div>
            </div>

            {/* Email List */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-3 mb-4">
                {emailRecipients.map((email, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 hover:border-teal-500/50 group'
                        : 'bg-gray-50 border-gray-300 hover:border-teal-500 group'
                    }`}
                  >
                    <Mail size={16} className="accent-text" />
                    <span className={`font-medium transition-colors ${
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {email}
                    </span>
                    <button
                      onClick={() => removeEmail(email)}
                      className={`ml-1 p-1 rounded-full transition-colors ${
                        isDark
                          ? 'hover:bg-red-900/50 text-gray-400 hover:text-red-400'
                          : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
                      }`}
                      title="Remove email"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {emailRecipients.length === 0 && (
                  <p className={`italic text-sm transition-colors ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    No email recipients added yet
                  </p>
                )}
              </div>
            </div>

            {/* Add Email Input */}
            <div className={`pt-6 border-t transition-colors ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm mb-3 transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Add new email recipient
              </p>
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  placeholder="email@example.com"
                  className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                      : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                  }`}
                />
                <button
                  onClick={addEmail}
                  className="px-6 py-3 accent-bg text-white rounded-lg font-medium transition-all hover:opacity-90 transform hover:-translate-y-0.5 shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  <Mail size={20} />
                  Add Email
                </button>
              </div>
              {newEmail && !isValidEmail(newEmail) && (
                <p className="text-xs text-red-600 mt-2">Please enter a valid email address</p>
              )}
            </div>
          </div>
        </div>

        {/* Email Notification Settings */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className={`transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={24} />
            <h2 className={`text-2xl font-bold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-8">
            {notificationGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-px flex-1 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <h3 className={`text-lg font-semibold px-3 transition-colors ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {group.title}
                  </h3>
                  <div className={`h-px flex-1 transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </div>

                {/* Group Notifications */}
                {group.notifications.map((option) => {
                  const Icon = option.icon;
                  const isActive = notifications[option.key];

                  return (
                    <div
                      key={option.key}
                      className={`rounded-lg border-2 transition-all duration-200 p-6 ${
                        isActive
                          ? isDark
                            ? 'bg-gray-700/50 border-teal-500/50'
                            : 'bg-teal-50 border-teal-500'
                          : isDark
                          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-4 rounded-lg transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Icon size={28} className="accent-text" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-xl font-bold mb-1 transition-colors ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {option.title}
                            </h3>
                            <p className={`text-sm transition-colors ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {option.description}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggleNotification(option.key)}
                          className={`relative w-14 h-7 rounded-full transition-all ml-4 flex-shrink-0 ${
                            isActive
                              ? 'accent-bg'
                              : isDark
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                          }`}
                          aria-label={`Toggle ${option.title}`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md ${
                              isActive ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className={`rounded-lg border shadow-sm transition-colors duration-200 p-6 ${
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Bell size={24} className="accent-text" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Notification Summary
              </h3>
              <div className={`text-sm space-y-1 transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <p>
                  <span className="font-semibold">
                    {enabledCount} of {totalCount}
                  </span> email notifications enabled
                </p>
                <p>
                  <span className="font-semibold">
                    {emailRecipients.length}
                  </span> email {emailRecipients.length === 1 ? 'recipient' : 'recipients'} configured
                </p>
                <p className={`text-xs mt-2 transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  💡 All notifications will be sent to the configured email addresses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-10 py-3 accent-bg text-white rounded-lg font-semibold text-lg transition-all shadow-md flex items-center gap-2 ${
              isSaving 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:opacity-90 transform hover:-translate-y-0.5'
            }`}
          >
            <Mail size={20} />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}