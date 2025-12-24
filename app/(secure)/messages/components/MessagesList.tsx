/**
 * Messages List Component - Themed Version
 * Location: components/messages/MessagesList.tsx
 * 
 * Updated with accent-bg, accent-hover, and full dark mode support
 */

'use client';

import React, { useMemo } from 'react';
import { getRelativeTime, formatDate } from '@/utils/dateFormat';

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

interface MessageListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onSelectMessage: (message: Message) => void;
  loading: boolean;
  filters: {
    status: string;
    sort: string;
    search: string;
  };
  onFilterChange: (key: string, value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MessagesList({
  messages,
  selectedMessage,
  onSelectMessage,
  loading,
  filters,
  onFilterChange,
  currentPage,
  totalPages,
  onPageChange
}: MessageListProps) {
  // Get status badge classes
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'in_progress':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'pending':
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300';
    }
  };

  // Get message preview
  const getMessagePreview = (text: string, maxLength: number = 60): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    // Filter by search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.subject.toLowerCase().includes(query) ||
          m.message.toLowerCase().includes(query) ||
          m.sender?.full_name.toLowerCase().includes(query)
      );
    }

    // Sort
    if (filters.sort === 'created_at') {
      filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (filters.sort === 'created_at_asc') {
      filtered.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return filtered;
  }, [messages, filters]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Search Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={e => onFilterChange('search', e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent focus:ring-1 focus:ring-accent transition"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Filter by
            </label>
            <select
              value={filters.status}
              onChange={e => onFilterChange('status', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent focus:ring-1 focus:ring-accent transition"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Sort
            </label>
            <select
              value={filters.sort}
              onChange={e => onFilterChange('sort', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-accent focus:ring-1 focus:ring-accent transition"
            >
              <option value="created_at">Newest</option>
              <option value="created_at_asc">Oldest</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} found
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-8 w-8 animate-spin accent-text"
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
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No messages found</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMessages.map(message => (
              <button
                key={message.message_id}
                onClick={() => onSelectMessage(message)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selectedMessage?.message_id === message.message_id
                    ? 'accent-bg text-white'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-semibold truncate ${
                      selectedMessage?.message_id === message.message_id
                        ? 'text-white'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {message.subject}
                    </h4>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadgeClass(message.status)}`}>
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </div>

                  {/* Sender */}
                  <p className={`text-xs ${
                    selectedMessage?.message_id === message.message_id
                      ? 'text-gray-100'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {message.sender?.full_name || 'Unknown'}
                  </p>

                  {/* Preview */}
                  <p className={`text-xs line-clamp-2 ${
                    selectedMessage?.message_id === message.message_id
                      ? 'text-gray-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getMessagePreview(message.message)}
                  </p>

                  {/* Meta */}
                  <div className={`flex items-center justify-between text-xs ${
                    selectedMessage?.message_id === message.message_id
                      ? 'text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    <span>
                      {getRelativeTime(message.created_at)}
                    </span>
                    {message.reply_count && message.reply_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {message.reply_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4 flex items-center justify-between">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium accent-text hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium accent-text hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}