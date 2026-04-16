export function getNextMonth(): { year: number; month: number; monthId: string } {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 2; // getMonth is 0-indexed, so +1 is current month, +2 is next month

  if (month > 12) {
    month = 1;
    year += 1;
  }

  const monthId = `${year}-${month.toString().padStart(2, '0')}`;
  return { year, month, monthId };
}

export function getDaysInMonth(year: number, month: number): string[] {
  const date = new Date(year, month - 1, 1);
  const days: string[] = [];
  
  while (date.getMonth() === month - 1) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    date.setDate(date.getDate() + 1);
  }
  
  return days;
}
