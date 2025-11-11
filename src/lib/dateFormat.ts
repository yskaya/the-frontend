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


