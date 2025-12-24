/**
 * Create Message Modal Component - Themed Version
 * Location: components/messages/CreateMessageModal.tsx
 * 
 * Updated to use accent-bg and accent-hover for theme consistency
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

interface Recipient {
  page_id: number;
  page_name: string;
  page_url: string;
  page_verified?: boolean;
  page_category?: string;
}

interface CreateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: any) => void;
}

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

  const [formData, setFormData] = useState({
    pageId: '',
    subject: '',
    message: ''
  });

  // Fetch recipients on mount
  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
    }
  }, [isOpen]);

  // Filter recipients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecipients(recipients);
    } else {
      const filtered = recipients.filter(r =>
        r.page_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipients(filtered);
    }
  }, [searchQuery, recipients]);

  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true);

      const response = await axios.get<{ recipients: Recipient[] }>(
        `api/messages/index/getRecipients`,
        { withCredentials: true }
      );

      setRecipients(response.data.recipients || []);
      setFilteredRecipients(response.data.recipients || []);
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
    setSearchQuery(recipient.page_name);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        `api/messages/index/createMessage`,
        {
          page_id: parseInt(formData.pageId),
          subject: formData.subject.trim(),
          message: formData.message.trim()
        },
        { withCredentials: true }
      );

      if (response.data.message) {
        onSuccess(response.data.message);
        // Reset form
        setFormData({
          pageId: '',
          subject: '',
          message: ''
        });
        setSearchQuery('');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error creating message:', axiosError.message);
      setErrors(prev => ({
        ...prev,
        submit: axiosError.response?.data?.message || 'Failed to create message'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity dark:bg-opacity-70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 accent-bg px-6 py-4">
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
                                {recipient.page_name}
                              </div>
                              {recipient.page_category && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {recipient.page_category}
                                </div>
                              )}
                            </div>
                            {recipient.page_verified && (
                              <svg
                                className="h-5 w-5 accent-text"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
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