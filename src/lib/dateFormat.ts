'use client';

const DEFAULT_LOCALE = 'en-US';

export function formatDate(date: string | number | Date, locale: string = DEFAULT_LOCALE) {
  const value = new Date(date);
  return value.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: string | number | Date, locale: string = DEFAULT_LOCALE) {
  const value = new Date(date);
  return value
    .toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
    .replace(' ', '');
}

export function formatDateTime(
  date: string | number | Date,
  locale: string = DEFAULT_LOCALE,
) {
  return `${formatDate(date, locale)} • ${formatTime(date, locale)}`;
}

/**
 * Format date as "X min ago" → "X days ago" → actual date
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Less than 1 hour: show "X min ago"
  if (diffMinutes < 60) {
    if (diffMinutes < 1) {
      return "just now";
    }
    return `${diffMinutes} min ago`;
  }

  // Less than 24 hours: show "X hours ago"
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }

  // Less than 30 days: show "X days ago"
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }

  // 30+ days: show actual date
  return then.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}



