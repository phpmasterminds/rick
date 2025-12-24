/**
 * Date Formatting Utilities
 * Location: utils/dateFormat.ts
 * 
 * Custom date formatting functions to replace formatDistanceToNow
 */

/**
 * Format date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
};

/**
 * Format date as readable string (e.g., "Dec 24, 2025 3:45 PM")
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format date as short date only (e.g., "Dec 24, 2025")
 */
export const formatDateShort = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format date as time only (e.g., "3:45 PM")
 */
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  return dateObj.toLocaleTimeString('en-US', options);
};

/**
 * Format date with time (e.g., "3:45 PM on Dec 24, 2025")
 */
export const formatDateWithTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDateShort(dateObj);
  const timeStr = formatTime(dateObj);
  
  return `${timeStr} on ${dateStr}`;
};

/**
 * Get date group label (e.g., "Today", "Yesterday", "This week", "This month")
 */
export const getDateGroupLabel = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Reset time to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  
  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return 'This week';
  } else if (diffDays < 30) {
    return 'This month';
  } else if (diffDays < 365) {
    return 'This year';
  } else {
    return 'Older';
  }
};

/**
 * ISO timestamp (e.g., "2025-12-24T15:45:00Z")
 */
export const formatISO = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
};

/**
 * Usage Examples:
 * 
 * getRelativeTime("2025-12-24T15:45:00")
 * // Returns: "2 hours ago"
 * 
 * formatDate("2025-12-24T15:45:00")
 * // Returns: "Dec 24, 2025 3:45 PM"
 * 
 * formatDateShort("2025-12-24T15:45:00")
 * // Returns: "Dec 24, 2025"
 * 
 * formatTime("2025-12-24T15:45:00")
 * // Returns: "3:45 PM"
 * 
 * formatDateWithTime("2025-12-24T15:45:00")
 * // Returns: "3:45 PM on Dec 24, 2025"
 * 
 * getDateGroupLabel("2025-12-24T15:45:00")
 * // Returns: "Today" or "This week" etc.
 */