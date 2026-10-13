/**
 * Date formatting utilities.
 * Uses the browser's Intl API — no external dependency required.
 */

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return DATE_FORMAT.format(new Date(dateStr));
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return DATETIME_FORMAT.format(new Date(dateStr));
  } catch {
    return String(dateStr);
  }
}

export function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
