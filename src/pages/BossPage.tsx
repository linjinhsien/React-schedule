import React, { useState, useEffect } from 'react';
import { getNextMonth, getDaysInMonth } from '../rules/monthRules';
import { fetchHolidays, HolidayInfo } from '../api/holidays';
import { DayCell } from '../components/DayCell';
import { getEmployeeYearlyStats } from '../api/firestore';
import { db } from '../firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { AppUser } from '../auth/useAuth';

export function BossPage() {
  const { year, month, monthId } = getNextMonth();
  const days = getDaysInMonth(year, month);
  
  const [holidays, setHolidays] = useState<Map<string, HolidayInfo>>(new Map());
  const [schedule, setSchedule] = useState<Record<string, any>>({});
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [monthStats, setMonthStats] = useState<Record<string, number>>({});
  const [yearStats, setYearStats] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchHolidays(year).then(setHolidays);
    
    // Fetch all users to map UID to Name
    getDocs(collection(db, 'users')).then(snap => {
      const usersMap: Record<string, AppUser> = {};
      snap.forEach(doc => {
        usersMap[doc.id] = { uid: doc.id, ...doc.data() } as AppUser;
      });
      setUsers(usersMap);
    });
  }, [year]);

  useEffect(() => {
    // Listen to the days collection for the month
    const daysRef = collection(db, 'months', monthId, 'days');
    const unsubDays = onSnapshot(daysRef, (snapshot) => {
      const newSchedule: Record<string, any> = {};
      snapshot.forEach(doc => {
        newSchedule[doc.id] = doc.data();
      });
      setSchedule(newSchedule);
    });

    // Listen to employee stats for the month
    const statsRef = collection(db, 'months', monthId, 'employeeStats');
    const unsubStats = onSnapshot(statsRef, (snapshot) => {
      const newStats: Record<string, number> = {};
      snapshot.forEach(doc => {
        newStats[doc.id] = doc.data().daysCount || 0;
      });
      setMonthStats(newStats);
    });

    return () => {
      unsubDays();
      unsubStats();
    };
  }, [monthId]);

  // Fetch yearly stats when users or monthStats change (to keep it somewhat updated)
  useEffect(() => {
    const fetchYearly = async () => {
      const newYearStats: Record<string, number> = {};
      for (const uid of Object.keys(users)) {
        if (users[uid].role === 'employee') {
          newYearStats[uid] = await getEmployeeYearlyStats(year, uid);
        }
      }
      setYearStats(newYearStats);
    };
    
    if (Object.keys(users).length > 0) {
      fetchYearly();
    }
  }, [users, monthStats, year]);

  // Calculate leaderboard
  const leaderboard = Object.keys(monthStats)
    .map(uid => ({
      uid,
      name: users[uid]?.name || 'Unknown',
      days: monthStats[uid]
    }))
    .sort((a, b) => b.days - a.days);

  // Calculate padding for the first day of the month
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Calendar */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            總班表 - {year}年{month}月
          </h2>
          
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
                  slot1Name={dayData.slot1 ? users[dayData.slot1]?.name : undefined}
                  slot2Name={dayData.slot2 ? users[dayData.slot2]?.name : undefined}
                  isBossView={true}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              本月排班排行榜
            </h3>
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-gray-500">尚無排班資料</p>
              ) : (
                leaderboard.map((item, index) => (
                  <div key={item.uid} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{item.days} 天</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              員工年度統計 ({year}年)
            </h3>
            <div className="space-y-4">
              {Object.keys(users).filter(uid => users[uid].role === 'employee').length === 0 ? (
                <p className="text-sm text-gray-500">尚無員工資料</p>
              ) : (
                Object.keys(users)
                  .filter(uid => users[uid].role === 'employee')
                  .map(uid => (
                    <div key={uid} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-gray-700">{users[uid].name}</span>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">本月: {monthStats[uid] || 0} 天</div>
                        <div className="text-sm font-semibold text-gray-900">全年: {yearStats[uid] || 0} 天</div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
