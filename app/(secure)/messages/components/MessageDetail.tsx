/**
 * Message Detail Component - Themed Version (UPDATED)
 * Location: components/messages/MessageDetail.tsx
 * 
 * Updated with Next.js API routes and accent-bg, accent-hover, full dark mode support
 * ✅ Now imports types from shared types file
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getRelativeTime, formatDate } from '@/utils/dateFormat';
import axios, { AxiosError } from 'axios';
import type { Message, MessageReply, MessageDetailResponse } from '../types';

interface MessageDetailProps {
  message: Message;
  onStatusChange: (messageId: number, newStatus: string) => void;
  onReplyAdded: () => void;
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

// ✅ Helper function to format text with line breaks - converts \n escape sequences to HTML
const formatMessageText = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Split by literal \n and actual newlines
  return text.split(/\\n|\n/).map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

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

  // ✅ UPDATED: Fetch message replies using Next.js API route
  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setLoadingReplies(true);
        const response = await axios.get<any>(
          `/api/business/messages/${message.message_id}`, // ✅ Updated to Next.js route
          {
            withCredentials: true
          }
        );

        console.log('API Response full structure:', response.data);

        // ✅ Defensive: Handle multiple possible API response structures
        let repliesData: any[] = [];

        // Try different possible paths where replies might be
        if (response.data?.data?.message?.replies) {
          // Path 1: data.message.replies (array)
          repliesData = response.data.data.message.replies;
          console.log('Found replies at path: data.message.replies');
        } else if (response.data?.data?.replies) {
          // Path 2: data.replies (array)
          repliesData = response.data.data.replies;
          console.log('Found replies at path: data.replies');
        } else if (response.data?.data?.message) {
          // Path 3: message itself might be the replies or have replies
          const msgData = response.data.data.message;
          if (Array.isArray(msgData)) {
            repliesData = msgData;
            console.log('Found replies at path: data.message (array)');
          }
        }

        // ✅ Ensure it's an array and filter out invalid entries
        const validReplies = Array.isArray(repliesData)
          ? repliesData.filter((r: any) => r && typeof r === 'object' && Object.keys(r).length > 0)
          : [];
        
        console.log('Processed replies:', validReplies);
        console.log('Valid replies count:', validReplies.length);
        setReplies(validReplies);
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching replies:', axiosError.message);
        console.error('Error response:', (error as any).response?.data);
        setError('Failed to load message replies');
      } finally {
        setLoadingReplies(false);
      }
    };

    if (message.message_id) {
      fetchReplies();
    }
  }, [message.message_id]);

  // ✅ UPDATED: Handle status change using Next.js API route
  const handleStatusChange = async (newStatus: string) => {
    try {
      await axios.put(
        `/api/business/messages`, // ✅ Updated to Next.js route
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

  // ✅ UPDATED: Handle reply submission using Next.js API route
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) {
      return;
    }

    try {
      setSubmittingReply(true);

      const response = await axios.post<any>(
        `/api/business/messages/${message.message_id}/replies`, // ✅ Updated to Next.js route
        {
          user_id: getUserId(), // ✅ NOTE: Get current user_id from your auth context/store
          reply_text: replyText.trim()
        },
        { withCredentials: true }
      );

      console.log('Reply response:', response.data);
      
      // ✅ Defensive: Extract reply data from response with multiple fallback paths
      let newReply: MessageReply | null = null;
      
      if (response.data?.data?.reply) {
        newReply = response.data.data.reply;
      } else if (response.data?.reply) {
        newReply = response.data.reply;
      } else if (response.data?.data && typeof response.data.data === 'object') {
        // If data itself looks like a reply object, use it
        const dataKeys = Object.keys(response.data.data);
        if (dataKeys.includes('reply_id') || dataKeys.includes('reply_text')) {
          newReply = response.data.data as MessageReply;
        }
      }

      if (newReply) {
        console.log('Adding new reply to list:', newReply);
        setReplies(prev => [...prev, newReply]);
        setReplyText('');
        onReplyAdded();
      } else {
        console.warn('Could not extract reply from response, refetching...');
        // If we can't find the reply in response, refetch the entire message
        const refetchResponse = await axios.get<any>(
          `/api/business/messages/${message.message_id}`,
          { withCredentials: true }
        );
        
        // Extract replies from refetch
        let repliesData: any[] = [];
        if (refetchResponse.data?.data?.message?.replies) {
          repliesData = refetchResponse.data.data.message.replies;
        } else if (refetchResponse.data?.data?.replies) {
          repliesData = refetchResponse.data.data.replies;
        }
        
        const validReplies = Array.isArray(repliesData)
          ? repliesData.filter((r: any) => r && typeof r === 'object' && Object.keys(r).length > 0)
          : [];
        
        setReplies(validReplies);
        setReplyText('');
        onReplyAdded();
      }
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
              From: {message.full_name || 'Unknown'}
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
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {formatMessageText(message.message)}
            </div>
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
              Replies ({replies?.length || 0})
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
            ) : !replies || replies.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No replies yet</p>
            ) : (
              <div className="space-y-4">
                {replies && Array.isArray(replies) && replies.length > 0 ? (
                  replies.map((reply, index) => {
                    // Comprehensive defensive check: ensure reply exists and has required properties
                    if (!reply || typeof reply !== 'object') {
                      console.warn('Invalid reply object at index', index, reply);
                      return null;
                    }

                    const replyId = reply?.reply_id || `reply-${message.message_id}-${index}`;
                    const replyName = reply?.full_name || reply?.sender?.full_name || 'Unknown User';
                    const replyText = reply?.reply_text || '';
                    const replyTime = reply?.created_at || new Date().toISOString();
                    
                    return (
                      <div
                        key={replyId}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {replyName}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getRelativeTime(replyTime)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {formatMessageText(replyText)}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No replies found</p>
                )}
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