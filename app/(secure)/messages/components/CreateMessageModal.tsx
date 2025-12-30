/**
 * Create Message Modal Component - Themed Version (UPDATED)
 * Location: components/messages/CreateMessageModal.tsx
 * 
 * Updated with:
 * - User ID from localStorage auth data
 * - Business/page_id from cookie (vanity_url)
 * - accent-bg and accent-hover for theme consistency
 * - FIXED: Ensure message response includes status field with default 'pending'
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

interface Recipient {
  page_id: string;
  title: string;
  user_id: string;
}

interface CreateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: any) => void;
}

// ✅ Helper function to get user_id from localStorage
const getUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const userData = JSON.parse(userStr);
    // Try different possible paths where user_id might be
    return userData?.data?.user_id || userData?.user_id || null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// ✅ Helper function to get business/page_id from cookie
const getBusinessPageId = (): string | null => {
  try {
    // Try to get vanity_url from cookie
    const vanityUrl = Cookies.get('vanity_url');
    return vanityUrl || null;
  } catch (error) {
    console.error('Error getting vanity_url from cookie:', error);
    return null;
  }
};

// ✅ Helper function to normalize message response
const normalizeMessage = (message: any) => {
  return {
    ...message,
    // Ensure status field exists with default value
    status: message.status || 'pending',
    // Ensure other required fields exist
    message_id: message.message_id || message.id,
    page_id: message.page_id,
    user_id: message.user_id,
    subject: message.subject || '',
    message: message.message || message.content || '',
    created_at: message.created_at || new Date().toISOString(),
    is_read: message.is_read || 0,
  };
};

export default function CreateMessageModal({
  isOpen,
  onClose,
  onSuccess
}: CreateMessageModalProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ Get user_id and business from storage/cookies
  const [userId, setUserId] = useState<string | null>(null);
  const [businessPageId, setBusinessPageId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pageId: '',
    subject: '',
    message: ''
  });

  // ✅ Initialize user_id and business on mount
  useEffect(() => {
    const uid = getUserId();
    const bid = getBusinessPageId();
    
    setUserId(uid);
    setBusinessPageId(bid);
    
    if (!uid) {
      console.warn('User ID not found in localStorage');
    }
    if (!bid) {
      console.warn('Business page ID not found in cookie');
    }
  }, []);

  // ✅ Fetch recipients on mount or when user_id/business changes
  useEffect(() => {
    if (isOpen && userId) {
      fetchRecipients();
    }
  }, [isOpen, userId, businessPageId]);

  // Filter recipients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecipients(recipients);
    } else {
      const filtered = recipients.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipients(filtered);
    }
  }, [searchQuery, recipients]);

  // ✅ UPDATED: Fetch recipients with user_id and business
  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true);

      const params: any = {};
      params.method = 'get_recipients';
      // ✅ Add user_id if available
      if (userId) {
        params.user_id = userId;
      }
      
      // ✅ Add business if available
      if (businessPageId) {
        params.business = businessPageId;
      }

      const response = await axios.get<{ status: string; data: { customers: Recipient[] } }>(
        `/api/business/messages`, // ✅ Updated to Next.js route
        { 
          params,
          withCredentials: true
        }
      );
      setRecipients(response.data.data.customers || []);
      setFilteredRecipients(response.data.data.customers || []);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching recipients:', axiosError.message);
      setRecipients([]);
      setFilteredRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSelectRecipient = (recipient: Recipient) => {
    setFormData(prev => ({
      ...prev,
      pageId: recipient.page_id.toString()
    }));
    setSearchQuery(recipient.title);
    setShowDropdown(false);
    setErrors(prev => ({ ...prev, pageId: '' }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pageId) {
      newErrors.pageId = 'Please select a recipient';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    if (formData.subject.trim().length > 255) {
      newErrors.subject = 'Subject must be less than 255 characters';
    }

    // ✅ Check if user_id is available
    if (!userId) {
      newErrors.submit = 'User information not found. Please refresh and try again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ UPDATED: Add user_id and business to create message request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `/api/business/messages`, // ✅ Updated to Next.js route
        {
          page_id: parseInt(formData.pageId),
          user_id: parseInt(userId!), // ✅ Add user_id from localStorage
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          // ✅ Optional: Add business if needed
          ...(businessPageId && { business: businessPageId })
        },
        { withCredentials: true }
      );

      if (response.data.data?.message || response.data.message) {
        // ✅ Normalize the message response to ensure status field exists
        const normalizedMessage = normalizeMessage(
          response.data.data
        );
        toast.success('Message sent successfully!');
        onSuccess(normalizedMessage);
        onClose();
        
        // Reset form
        setFormData({ pageId: '', subject: '', message: '' });
        setSearchQuery('');
      } else {
        throw new Error('No message data in response');
      }
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Failed to send message';
      
      console.error('Error sending message:', error);
      toast.error(errorMessage);
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-xl">
        <div className="rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
          {/* Header */}
          <div className="accent-bg flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <h2 className="text-xl font-bold text-white">Create New Message</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded p-1 transition"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Recipient Selection */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Recipient
              </label>

              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      setFormData(prev => ({ ...prev, pageId: '' }));
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Select option"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <svg
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                    {loadingRecipients ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        Loading recipients...
                      </div>
                    ) : filteredRecipients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No recipients found
                      </div>
                    ) : (
                      <div>
                        {filteredRecipients.map(recipient => (
                          <button
                            key={recipient.page_id}
                            type="button"
                            onClick={() => handleSelectRecipient(recipient)}
                            className="w-full px-4 py-3 text-left hover:accent-bg hover:text-white dark:hover:bg-gray-700 transition flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {recipient.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {recipient.user_id}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errors.pageId && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.pageId}</p>
              )}
            </div>

            {/* Subject */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter message subject"
                maxLength={255}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <div className="mt-1 flex justify-between">
                {errors.subject && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
                )}
                <p className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {formData.subject.length}/255
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message"
                rows={6}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {errors.message && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg accent-bg px-4 py-3 font-semibold text-white accent-hover transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}