/**
 * Format date to yyyy/mm/dd with zero-leading
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "2024/01/05")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0].replace(/-/g, '/');
}
