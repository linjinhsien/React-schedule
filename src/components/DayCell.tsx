import React from 'react';
import { isWeekend } from '../api/holidays';

interface DayCellProps {
  dateISO: string;
  isHoliday: boolean;
  holidayName?: string;
  slot1: string | null;
  slot2: string | null;
  slot1Name?: string;
  slot2Name?: string;
  currentUid?: string;
  onToggle?: (dateISO: string) => void;
  isBossView?: boolean;
}

export const DayCell: React.FC<DayCellProps> = ({
  dateISO,
  isHoliday,
  holidayName,
  slot1,
  slot2,
  slot1Name,
  slot2Name,
  currentUid,
  onToggle,
  isBossView = false
}) => {
  const date = new Date(dateISO);
  const dayNum = date.getDate();
  const weekend = isWeekend(dateISO);
  const disabled = weekend || isHoliday;
  
  const isFull = slot1 !== null && slot2 !== null;
  const iAmScheduled = slot1 === currentUid || slot2 === currentUid;
  
  // For employee view, disable if it's full and I'm not scheduled
  const canToggle = !isBossView && !disabled && (!isFull || iAmScheduled);

  return (
    <div 
      className={`
        min-h-[100px] p-2 border border-gray-200 flex flex-col
        ${disabled ? 'bg-gray-100' : 'bg-white'}
        ${!isBossView && canToggle ? 'cursor-pointer hover:bg-blue-50' : ''}
        ${iAmScheduled ? 'ring-2 ring-inset ring-blue-500' : ''}
      `}
      onClick={() => {
        if (canToggle && onToggle) {
          onToggle(dateISO);
        }
      }}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-medium ${weekend ? 'text-red-500' : 'text-gray-700'}`}>
          {dayNum}
        </span>
        {holidayName && (
          <span className="text-xs text-red-600 font-semibold truncate max-w-[70%]" title={holidayName}>
            {holidayName}
          </span>
        )}
      </div>

      <div className="mt-auto space-y-1 pt-2">
        {!disabled && (
          <>
            <div className={`text-xs p-1 rounded ${slot1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'}`}>
              {slot1 ? (slot1Name || '已排班') : '空缺'}
            </div>
            <div className={`text-xs p-1 rounded ${slot2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'}`}>
              {slot2 ? (slot2Name || '已排班') : '空缺'}
            </div>
          </>
        )}
        {disabled && (
          <div className="text-xs text-gray-500 text-center mt-2">
            不可排班
          </div>
        )}
      </div>
    </div>
  );
}
