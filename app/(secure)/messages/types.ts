/**
 * Shared Types for Messages Module
 * Location: app/(secure)/messages/types.ts
 * 
 * This is the single source of truth for all Message-related types
 * Import this file in all message components to avoid type conflicts
 */

export type MessageStatus = 'pending' | 'completed' | 'in_progress';

/**
 * API Response Structure - matches actual backend API
 */
export interface MessageAPIResponse {
  message_id: string | number;
  page_id: string | number;
  page_user_id: string | number;
  user_id: string | number;
  sender_page_id: string | number;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  read_at?: string | null;
  is_read: string | number;
  full_name: string;
  user_name: string;
  user_image?: string | null;
  page_title: string;
  page_image?: string;
  page_url?: string;
}

/**
 * Frontend Message Structure - normalized for UI
 */
export interface Message {
  message_id: number;
  page_id: number;
  user_id: number;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  read_at?: string;
  is_read: number;
  full_name: string;
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

/**
 * Message Reply Structure
 */
export interface MessageReply {
  reply_id: number;
  message_id: number;
  user_id: number;
  reply_text: string;
  created_at: string;
  full_name: string;
  sender?: {
    user_id: number;
    full_name: string;
    user_name: string;
    user_image?: string;
  };
}

/**
 * API Response Wrappers
 */
export interface MessagesResponse {
  status: string;
  data: {
    messages: MessageAPIResponse[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
  error: null;
}

export interface MessageDetailResponse {
  status: 'success' | 'error';
  data: {
    message: Message & { replies: MessageReply[] };
  };
}

/**
 * Filter State for Messages List
 */
export interface FilterState {
  status: string;
  sort: string;
  search: string;
}

/**
 * Helper function to get safe status with default
 * Prevents undefined status values
 */
export const getSafeStatus = (status: any): MessageStatus => {
  if (status === 'completed' || status === 'in_progress' || status === 'pending') {
    return status;
  }
  return 'pending'; // Default status
};

/**
 * Helper function to get status badge CSS classes
 */
export const getStatusBadgeClass = (status: string): string => {
  const safeStatus = getSafeStatus(status);
  switch (safeStatus) {
    case 'completed':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'in_progress':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
    case 'pending':
    default:
      return 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300';
  }
};

/**
 * Helper function to format status for display
 */
export const getStatusDisplayText = (status: any): string => {
  const safeStatus = getSafeStatus(status);
  return safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
};