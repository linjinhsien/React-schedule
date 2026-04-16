import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { getNextMonth, getDaysInMonth } from '../rules/monthRules';
import { fetchHolidays, HolidayInfo } from '../api/holidays';
import { DayCell } from '../components/DayCell';
import { toggleScheduleSlot } from '../api/firestore';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export function EmployeePage() {
  const { user } = useAuth();
  const { year, month, monthId } = getNextMonth();
  const days = getDaysInMonth(year, month);
  
  const [holidays, setHolidays] = useState<Map<string, HolidayInfo>>(new Map());
  const [schedule, setSchedule] = useState<Record<string, any>>({});
  const [myDaysCount, setMyDaysCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHolidays(year).then(setHolidays);
  }, [year]);

  useEffect(() => {
    if (!user) return;

    // Listen to the days collection for the month
    const daysRef = collection(db, 'months', monthId, 'days');
    const unsubDays = onSnapshot(daysRef, (snapshot) => {
      const newSchedule: Record<string, any> = {};
      snapshot.forEach(doc => {
        newSchedule[doc.id] = doc.data();
      });
      setSchedule(newSchedule);
    });

    // Listen to my stats
    const statsRef = doc(db, 'months', monthId, 'employeeStats', user.uid);
    const unsubStats = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setMyDaysCount(doc.data().daysCount || 0);
      } else {
        setMyDaysCount(0);
      }
    });

    return () => {
      unsubDays();
      unsubStats();
    };
  }, [monthId, user]);

  const handleToggle = async (dateISO: string) => {
    if (!user || loading) return;
    
    setError('');
    setLoading(true);
    try {
      await toggleScheduleSlot({
        monthId,
        dateISO,
        uid: user.uid
      });
    } catch (err: any) {
      if (err.message === 'DAY_FULL') {
        setError('該日排班已滿');
      } else if (err.message === 'MAX_DAYS_REACHED') {
        setError('本月排班已達上限 (15天)');
      } else {
        setError('排班發生錯誤，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate padding for the first day of the month
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          排班表 - {year}年{month}月
        </h2>
        
        <div className="flex items-center justify-between mb-6 bg-blue-50 p-4 rounded-md">
          <div>
            <p className="text-sm text-gray-600">本月已排天數</p>
            <p className={`text-2xl font-bold ${myDaysCount < 6 ? 'text-red-600' : myDaysCount > 15 ? 'text-red-600' : 'text-green-600'}`}>
              {myDaysCount} <span className="text-sm font-normal text-gray-500">/ 15 天</span>
            </p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>最少需排 6 天</p>
            <p>最多可排 15 天</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {paddingDays.map(i => (
            <div key={`pad-${i}`} className="bg-gray-50 min-h-[100px]" />
          ))}
          
          {days.map(dateISO => {
            const dayData = schedule[dateISO] || { slot1: null, slot2: null };
            const holiday = holidays.get(dateISO);
            
            return (
              <DayCell
                key={dateISO}
                dateISO={dateISO}
                isHoliday={holiday?.isHoliday || false}
                holidayName={holiday?.name}
                slot1={dayData.slot1}
                slot2={dayData.slot2}
                slot1Name={dayData.slot1 === user?.uid ? user.name : (dayData.slot1 ? '同事' : undefined)}
                slot2Name={dayData.slot2 === user?.uid ? user.name : (dayData.slot2 ? '同事' : undefined)}
                currentUid={user?.uid}
                onToggle={handleToggle}
                isBossView={false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
