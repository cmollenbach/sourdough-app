// TimingSchedule.tsx - Display parsed timing schedule with alarms

import React, { useMemo, useState } from 'react';
import { TimingParser, type TimingSchedule, type FoldEvent } from '../../utils/timingParser';

interface TimingScheduleProps {
  timingPlan: string;
  onSetAlarm?: (event: FoldEvent, alarmTime: Date) => void;
  initialStartTime?: Date; // For pre-setting the start time (e.g., step start time)
  isActive?: boolean; // To highlight active schedules
}

export const TimingScheduleDisplay: React.FC<TimingScheduleProps> = ({ 
  timingPlan, 
  onSetAlarm,
  initialStartTime,
  isActive = false
}) => {
  const [startTime, setStartTime] = useState<string>(() => {
    // Use initialStartTime if provided, otherwise default to current time
    const baseTime = initialStartTime || new Date();
    return `${baseTime.getHours().toString().padStart(2, '0')}:${baseTime.getMinutes().toString().padStart(2, '0')}`;
  });

  const schedule = useMemo(() => {
    return TimingParser.parseTimingPlan(timingPlan || '');
  }, [timingPlan]);

  const alarms = useMemo(() => {
    if (!startTime) return [];
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    
    return TimingParser.generateAlarms(schedule, start);
  }, [schedule, startTime]);

  if (!timingPlan?.trim() || schedule.events.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Enter a timing plan above to see the schedule and set alarms
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 mt-2 ${
      isActive 
        ? 'bg-green-50 border-green-300' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-medium flex items-center gap-2 ${
          isActive ? 'text-green-900' : 'text-blue-900'
        }`}>
          ⏰ Stretch & Fold Schedule
          {isActive && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">ACTIVE</span>}
        </h4>
        <div className="flex items-center gap-2">
          <label htmlFor="start-time" className={`text-sm ${
            isActive ? 'text-green-700' : 'text-blue-700'
          }`}>Start time:</label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
              isActive 
                ? 'border-green-300 focus:ring-green-500' 
                : 'border-blue-300 focus:ring-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Timeline Display */}
      <div className="space-y-2 mb-4">
        {schedule.events.map((event, index) => {
          const alarm = alarms.find(a => a.event.id === event.id);
          const timeDisplay = event.isRelative 
            ? `+${event.timeMinutes}min`
            : alarm?.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          return (
            <div 
              key={event.id}
              className={`flex items-center justify-between p-3 bg-white border rounded ${
                isActive ? 'border-green-200' : 'border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                  isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{event.description}</div>
                  <div className="text-sm text-gray-600">
                    {timeDisplay} {alarm && `(${alarm.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`}
                  </div>
                </div>
              </div>
              
              {alarm && onSetAlarm && (
                <button
                  onClick={() => onSetAlarm(event, alarm.time)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  title={`Set alarm for ${alarm.time.toLocaleTimeString()}`}
                >
                  🔔 Set Alarm
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="text-sm text-blue-700 border-t border-blue-200 pt-3">
        <div className="flex justify-between">
          <span>{schedule.events.length} events scheduled</span>
          {schedule.totalDuration && (
            <span>Total: {Math.floor(schedule.totalDuration / 60)}h {schedule.totalDuration % 60}m</span>
          )}
        </div>
      </div>

      {/* Warnings */}
      {schedule.warnings.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            {schedule.warnings.map((warning, i) => (
              <div key={i}>⚠️ {warning}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for managing browser notifications
export const useAlarmNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  const scheduleNotification = (event: FoldEvent, time: Date) => {
    if (permission !== 'granted') {
      requestPermission();
      return;
    }

    const now = new Date();
    const delay = time.getTime() - now.getTime();

    if (delay <= 0) {
      // Immediate notification
      new Notification(`🍞 ${event.description}`, {
        body: `Time for your next baking step!`,
        icon: '/favicon.svg'
      });
    } else {
      // Scheduled notification
      setTimeout(() => {
        new Notification(`🍞 ${event.description}`, {
          body: `Time for your next baking step!`,
          icon: '/favicon.svg'
        });
      }, delay);
    }
  };

  return { permission, requestPermission, scheduleNotification };
};
