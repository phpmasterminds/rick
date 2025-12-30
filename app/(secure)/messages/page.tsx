/**
 * Messages Page Component - Updated with Theme Integration
 * Location: app/(secure)/messages/page.tsx
 * 
 * Integrated with Nature's High theme system
 * Uses accent-bg and accent-hover classes for dynamic theming
 * ✅ Now imports types from shared types file
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios, { AxiosError } from 'axios';
import MessagesList from './components/MessagesList';
import MessageDetail from './components/MessageDetail';
import CreateMessageModal from './components/CreateMessageModal';
import LoadingSpinner from './components/LoadingSpinner';
import type {
  Message,
  MessageAPIResponse,
  MessagesResponse,
  FilterState
} from './types';

// ✅ Transform API response to frontend Message format
const transformApiMessage = (apiMessage: MessageAPIResponse): Message => {
  return {
    message_id: Number(apiMessage.message_id),
    page_id: Number(apiMessage.page_id),
    user_id: Number(apiMessage.user_id),
    subject: apiMessage.subject,
    message: apiMessage.message,
    status: apiMessage.status || 'pending',
    created_at: apiMessage.created_at,
    read_at: apiMessage.read_at || undefined,
    is_read: Number(apiMessage.is_read),
	full_name: apiMessage.full_name,
    sender: {
      user_id: Number(apiMessage.user_id),
      full_name: apiMessage.full_name,
      user_name: apiMessage.user_name,
      user_image: apiMessage.user_image || undefined
    },
    recipient: {
      page_id: Number(apiMessage.page_id),
      page_name: apiMessage.page_title,
      page_url: apiMessage.page_url || '',
      page_image: apiMessage.page_image
    }
  };
};

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

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isBuyer, setIsBuyer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    sort: 'created_at',
    search: ''
  });
  
  // ✅ Get user_id and business from storage/cookies
  const [userId, setUserId] = useState<string | null>(null);
  const [businessPageId, setBusinessPageId] = useState<string | null>(null);

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

  // Check if user is buyer
  useEffect(() => {
    const checkUserType = () => {
      try {
        const typeId = Cookies.get('type_id');
        setIsBuyer(typeId === '20');
      } catch (error) {
        console.error('Error checking user type:', error);
      }
    };

    checkUserType();
  }, []);

  // ✅ FIX: Use closure variables (userId, businessPageId) instead of function parameters
  const fetchMessages = useCallback(
    async (page = 1) => {
      // Guard: Check if we have required data before fetching
      if (!userId || !businessPageId) {
        console.warn('Missing userId or businessPageId, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          user_id: userId,
          business: businessPageId,
          ...(filters.status && { status: filters.status }),
          ...(filters.sort && { sort: filters.sort })
        });

        const response = await axios.get<MessagesResponse>(
          `api/business/messages`,
          {
            params: Object.fromEntries(params),
            withCredentials: true
          }
        );

        // ✅ Transform API response to frontend format
        const transformedMessages = (response.data.data?.messages || []).map(transformApiMessage);
        
        setMessages(transformedMessages);
        setCurrentPage(response.data.data?.page || page);
        
        // ✅ Calculate total pages from API response
        const total = response.data.data?.total || 0;
        const limit = response.data.data?.limit || 10;
        const calculatedPages = Math.ceil(total / limit) || 1;
        
        setTotalPages(calculatedPages);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching messages:', axiosError.message);
        // Show error toast
      } finally {
        setLoading(false);
      }
    },
    [filters, userId, businessPageId]
  );

  // ✅ Initial load - only call fetchMessages when it changes
  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  // Handle filter change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  // Handle message selection
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };

  // Handle create message success
  const handleMessageCreated = (newMessage: Message) => {
    setMessages(prev => [newMessage, ...prev]);
    setShowCreateModal(false);
    setSelectedMessage(newMessage);
  };

  // Handle status update
  const handleStatusUpdate = (messageId: number, newStatus: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.message_id === messageId
          ? { ...msg, status: newStatus as 'pending' | 'completed' | 'in_progress' }
          : msg
      )
    );

    if (selectedMessage?.message_id === messageId) {
      setSelectedMessage(prev =>
        prev
          ? { ...prev, status: newStatus as 'pending' | 'completed' | 'in_progress' }
          : null
      );
    }
  };

  // Handle reply added
  const handleReplyAdded = () => {
    if (selectedMessage) {
      // Refresh the message detail
      setSelectedMessage(prev =>
        prev
          ? {
              ...prev,
              reply_count: (prev.reply_count || 0) + 1,
              status: 'in_progress'
            }
          : null
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg accent-bg">
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
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
          </div>

          {isBuyer && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg accent-bg px-6 py-3 font-semibold text-white transition-colors accent-hover"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Message
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <MessagesList
              messages={messages}
              selectedMessage={selectedMessage}
              onSelectMessage={handleSelectMessage}
              loading={loading}
              filters={filters}
              onFilterChange={(key, value) => handleFilterChange(key as keyof FilterState, value)}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={page => fetchMessages(page)}
            />
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {loading && !selectedMessage ? (
              <LoadingSpinner />
            ) : selectedMessage ? (
              <MessageDetail
                message={selectedMessage}
                onStatusChange={handleStatusUpdate}
                onReplyAdded={handleReplyAdded}
              />
            ) : (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No message selected
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select a message from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Message Modal */}
      {isBuyer && (
        <CreateMessageModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleMessageCreated}
        />
      )}
    </div>
  );
}