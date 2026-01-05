// Utility functions for time formatting

export const formatRelativeTime = (timestamp: string | Date): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1min ago' : `${diffInMinutes}min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1hr ago' : `${diffInHours}hrs ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1d ago' : `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1w ago' : `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1mo ago' : `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1y ago' : `${diffInYears}y ago`;
};

export const formatMessageStatus = (
  isFromMe: boolean,
  isRead: boolean,
  timestamp: string | Date
): string => {
  if (!isFromMe) {
    return ''; // Don't show status for received messages
  }

  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isRead) {
    if (diffInSeconds < 60) {
      return 'Seen just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? 'Seen 1min ago' : `Seen ${diffInMinutes}min ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? 'Seen 1hr ago' : `Seen ${diffInHours}hrs ago`;
    }

    return formatRelativeTime(timestamp).replace('ago', 'ago').replace(/^\w+/, 'Seen');
  } else {
    if (diffInSeconds < 60) {
      return 'Sent now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? 'Sent 1min ago' : `Sent ${diffInMinutes}min ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? 'Sent 1hr ago' : `Sent ${diffInHours}hrs ago`;
    }

    return formatRelativeTime(timestamp).replace('ago', 'ago').replace(/^\w+/, 'Sent');
  }
};

export const formatChatListTime = (timestamp: string | Date): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return 'now';
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  // For older messages, show the date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};
