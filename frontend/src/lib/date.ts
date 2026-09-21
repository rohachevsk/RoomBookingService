/* Date helpers (single source of truth — local midnight, no TZ shifts). */

export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
