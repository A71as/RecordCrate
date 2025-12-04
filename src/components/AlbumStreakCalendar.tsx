import React, { useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

type CompletionStatus = 'completed' | 'pending' | 'empty';

export interface AlbumStreakCalendarEntry {
  date: string;
  status: CompletionStatus;
}

interface AlbumStreakCalendarProps {
  month: Date;
  entries: AlbumStreakCalendarEntry[];
  title?: string;
  description?: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (value: Date): string =>
  value.toISOString().split('T')[0] ?? '';

export const AlbumStreakCalendar: React.FC<AlbumStreakCalendarProps> = ({
  month,
  entries,
  title = 'Album of the Day',
  description,
}) => {
  const targetYear = month.getFullYear();
  const targetMonth = month.getMonth();

  const completions = useMemo(() => {
    const map = new Map<string, CompletionStatus>();
    entries.forEach(({ date, status }) => {
      if (date) {
        map.set(date, status);
      }
    });
    return map;
  }, [entries]);

  const daysInMonth = useMemo(() => {
    const totalDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    const today = toDateKey(new Date());
    return Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const currentDate = new Date(targetYear, targetMonth, day);
      const key = toDateKey(currentDate);
      const status = completions.get(key) ?? 'empty';
      return {
        day,
        key,
        status,
        isToday: key === today,
      };
    });
  }, [targetMonth, targetYear, completions]);

  const leadingEmptyCells = new Date(targetYear, targetMonth, 1).getDay();
  const completionCount = entries.filter((entry) => entry.status === 'completed').length;
  const totalDays = daysInMonth.length;

  return (
    <div className="album-streak-calendar">
      <div className="streak-header">
        <div className="streak-title">
          <CalendarIcon size={18} />
          <span>{title}</span>
        </div>
        <div className="streak-summary">
          {month.toLocaleString(undefined, { month: 'long', year: 'numeric' })} ·{' '}
          <strong>{completionCount}</strong> of {totalDays} days logged
        </div>
      </div>
      {description && <p className="streak-description">{description}</p>}
      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="weekday-label">
            {label}
          </div>
        ))}
        {Array.from({ length: leadingEmptyCells }).map((_, index) => (
          <div key={`empty-${index}`} className="day-cell empty-cell" />
        ))}
        {daysInMonth.map(({ day, key, status, isToday }) => (
          <div
            key={key}
            className={`day-cell ${status}-cell ${isToday ? 'today-cell' : ''}`}
            title={`${key}${status === 'completed' ? ' · logged' : status === 'pending' ? ' · awaiting log' : ''}`}
          >
            <span className="day-number">{day}</span>
          </div>
        ))}
      </div>
      <div className="streak-footer">
        <div className="legend-item">
          <span className="legend-box completed-legend" />
          <span className="legend-text">Logged recommendation</span>
        </div>
        <div className="legend-item">
          <span className="legend-box pending-legend" />
          <span className="legend-text">Awaiting log</span>
        </div>
      </div>
    </div>
  );
};

export default AlbumStreakCalendar;
