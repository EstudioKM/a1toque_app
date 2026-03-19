
/**
 * Parses a YYYY-MM-DD string into a Date object at noon local time
 * to avoid timezone shifts during comparisons.
 */
export const parseArgentinaDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  
  // If it's an ISO string (contains T), parse it directly
  if (dateStr.includes('T')) {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Formats a date string (YYYY-MM-DD) to a localized string in Argentina time (UTC-3)
 * without the day shift caused by UTC parsing.
 */
export const formatArgentinaDate = (dateStr: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }) => {
  if (!dateStr) return '';
  
  // Parse YYYY-MM-DD manually to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create date in local time
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-AR', options).toUpperCase();
};

/**
 * Formats a date string (YYYY-MM-DD) to a full date string (DD/MM/YY)
 */
export const formatFullDate = (dateStr: string) => {
  return formatArgentinaDate(dateStr, { day: '2-digit', month: '2-digit', year: '2-digit' });
};

/**
 * Formats a timestamp (ISO string or Date) to Argentina time (UTC-3)
 */
export const formatArgentinaTimestamp = (timestamp: string | number | Date, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-AR', { ...options, timeZone: 'America/Argentina/Buenos_Aires' }).toUpperCase();
};

/**
 * Formats a timestamp to Argentina time (HH:MM)
 */
export const formatArgentinaTime = (timestamp: string | number | Date) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
};
