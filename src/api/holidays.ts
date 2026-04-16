interface HolidayData {
  date: string; // YYYYMMDD
  isHoliday: boolean;
  description: string;
}

export interface HolidayInfo {
  isHoliday: boolean;
  name: string;
}

const holidayCache = new Map<number, Map<string, HolidayInfo>>();

export async function fetchHolidays(year: number): Promise<Map<string, HolidayInfo>> {
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  try {
    const response = await fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch holidays');
    }
    const data: HolidayData[] = await response.json();
    
    const yearMap = new Map<string, HolidayInfo>();
    data.forEach(item => {
      // Convert YYYYMMDD to YYYY-MM-DD
      const formattedDate = `${item.date.substring(0, 4)}-${item.date.substring(4, 6)}-${item.date.substring(6, 8)}`;
      yearMap.set(formattedDate, {
        isHoliday: item.isHoliday,
        name: item.description
      });
    });
    
    holidayCache.set(year, yearMap);
    return yearMap;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    // Return empty map on error to prevent crashing
    return new Map();
  }
}

export function isWeekend(dateISO: string): boolean {
  const date = new Date(dateISO);
  const day = date.getDay();
  return day === 0 || day === 6;
}
