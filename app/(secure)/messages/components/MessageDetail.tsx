/**
 * Message Detail Component - Themed Version
 * Location: components/messages/MessageDetail.tsx
 * 
 * Updated with accent-bg, accent-hover, and full dark mode support
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getRelativeTime, formatDate } from '@/utils/dateFormat';
import axios, { AxiosError } from 'axios';

interface MessageReply {
  reply_id: number;
  message_id: number;
  user_id: number;
  reply_text: string;
  created_at: string;
  sender?: {
    user_id: number;
    full_name: string;
    user_name: string;
    user_image?: string;
  };
}

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

interface MessageDetailResponse {
  message: Message & { replies: MessageReply[] };
}

interface MessageDetailProps {
  message: Message;
  onStatusChange: (messageId: number, newStatus: string) => void;
  onReplyAdded: () => void;
}

export default function MessageDetail({
  message,
  onStatusChange,
  onReplyAdded
}: MessageDetailProps) {
  const [replies, setReplies] = useState<MessageReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [error, setError] = useState('');

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

  // Fetch message replies
  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setLoadingReplies(true);
        const response = await axios.get<MessageDetailResponse>(
          `api/messages/index/getMessage`,
          {
            params: { message_id: message.message_id },
            withCredentials: true
          }
        );

        setReplies(response.data.message.replies || []);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching replies:', axiosError.message);
        setError('Failed to load message replies');
      } finally {
        setLoadingReplies(false);
      }
    };

    if (message.message_id) {
      fetchReplies();
    }
  }, [message.message_id]);

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.post(
        `api/messages/index/updateStatus`,
        {
          message_id: message.message_id,
          status: newStatus
        },
        { withCredentials: true }
      );

      onStatusChange(message.message_id, newStatus);
      setStatusDropdownOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error updating status:', axiosError.message);
      setError('Failed to update message status');
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) {
      return;
    }

    try {
      setSubmittingReply(true);

      const response = await axios.post<{ reply: MessageReply }>(
        `api/messages/index/addReply`,
        {
          message_id: message.message_id,
          reply_text: replyText.trim()
        },
        { withCredentials: true }
      );

      setReplies(prev => [...prev, response.data.reply]);
      setReplyText('');
      onReplyAdded();
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error adding reply:', axiosError.message);
      setError('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 accent-bg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{message.subject}</h2>
            <p className="mt-1 text-sm text-gray-100">
              From: {message.sender?.full_name || 'Unknown'}
            </p>
            {message.recipient && (
              <p className="text-sm text-gray-100">
                To: {message.recipient.page_name}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(message.status)}`}>
              {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Status Selector */}
        <div className="mt-4 relative inline-block">
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/20 text-white px-4 py-2 text-sm font-medium hover:bg-white/30 transition"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Change Status
            <svg
              className={`h-4 w-4 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}
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
          </button>

          {/* Status Dropdown */}
          {statusDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg z-10">
              {['pending', 'in_progress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full px-4 py-3 text-left text-sm font-medium hover:accent-bg hover:text-white dark:hover:bg-gray-600 transition first:rounded-t-lg last:rounded-b-lg ${
                    message.status === status ? 'accent-bg text-white' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Message Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span>
              {getRelativeTime(message.created_at)}
            </span>
            <span>
              {message.is_read ? 'Read' : 'Unread'}
            </span>
          </div>

          {/* Original Message */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Original Message
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {message.message}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Replies Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Replies ({replies.length})
            </h3>

            {loadingReplies ? (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="h-6 w-6 animate-spin accent-text"
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
              </div>
            ) : replies.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No replies yet</p>
            ) : (
              <div className="space-y-4">
                {replies.map(reply => (
                  <div
                    key={reply.reply_id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {reply.sender?.full_name || 'Unknown'}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {reply.reply_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-6">
        <form onSubmit={handleSubmitReply} className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Add Reply
          </label>

          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-accent focus:ring-1 focus:ring-accent transition"
          />

          <button
            type="submit"
            disabled={submittingReply || !replyText.trim()}
            className="inline-flex items-center gap-2 rounded-lg accent-bg px-6 py-3 font-semibold text-white accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingReply ? (
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
                Send Reply
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}