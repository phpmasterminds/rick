/**
 * Messages Page Component - Updated with Theme Integration
 * Location: app/messages/page.tsx
 * 
 * Integrated with Nature's High theme system
 * Uses accent-bg and accent-hover classes for dynamic theming
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

interface Message {
  message_id: number;
  page_id: number;
  user_id: number;
  subject: string;
  message: string;
  status: 'pending' | 'completed' | 'in_progress';
  created_at: string;
  read_at?: string;
  is_read: number;
  sender?: {
    user_id: number;
    full_name: string;
    user_name: string;
    user_image?: string;
  };
  recipient?: {
    page_id: number;
    page_name: string;
    page_url: string;
    page_image?: string;
  };
  reply_count?: number;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface FilterState {
  status: string;
  sort: string;
  search: string;
}

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

  // Fetch messages
  const fetchMessages = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(filters.status && { status: filters.status }),
          ...(filters.sort && { sort: filters.sort })
        });

        const response = await axios.get<MessagesResponse>(
          `api/messages/getMessages`,
          {
            params: Object.fromEntries(params),
            withCredentials: true
          }
        );

        setMessages(response.data.messages || []);
        setCurrentPage(page);
        setTotalPages(response.data.pages || 1);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching messages:', axiosError.message);
        // Show error toast
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Initial load
  useEffect(() => {
    fetchMessages(1);
  }, [filters]);

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