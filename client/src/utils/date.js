/**
 * Safely parses date/time strings from the database to prevent timezone shifting.
 * 
 * - Date-only strings ("YYYY-MM-DD") are parsed as local midnight (no shifting).
 * - Datetime strings ("YYYY-MM-DD HH:MM:SS") from MySQL (which are in UTC) 
 *   are forced to parse as UTC by appending 'Z' if no timezone is specified.
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  const str = String(dateStr).trim();
  
  // 1. Date-only format: "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // 2. Datetime format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
    const isoStr = str.replace(' ', 'T');
    const hasTimezone = isoStr.endsWith('Z') || isoStr.includes('+') || (isoStr.includes('-') && isoStr.indexOf('-', 10) !== -1);
    return new Date(hasTimezone ? isoStr : `${isoStr}Z`);
  }
  
  return new Date(str);
}

/**
 * Formats a date string to a local date string (e.g. DD/MM/YYYY or DD MMM YYYY).
 */
export function formatLocalDate(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '—';
  return d.toLocaleDateString();
}

/**
 * Formats a datetime string to local date and time string.
 */
export function formatLocalDateTime(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '—';
  return d.toLocaleString();
}

/**
 * Safely converts any date/time string to local YYYY-MM-DD format for HTML date inputs.
 */
export function getLocalDateString(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

