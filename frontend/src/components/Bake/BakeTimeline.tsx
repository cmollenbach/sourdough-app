// BakeTimeline.tsx - Comprehensive timeline for active bakes

import React, { useState, useEffect, useMemo } from 'react';
import { BakeTimingManager, type BakeTimeline, type BakeTimingEvent } from '../../utils/bakeTimingUtils';
import { useAlarmNotifications } from '../Recipe/TimingSchedule';
import type { BakeStep } from '../../types/bake';

interface BakeTimelineProps {
  bakeSteps: BakeStep[];
  bakeStartTime: Date;
  onSetAlarm?: (event: BakeTimingEvent) => void;
  className?: string;
}

export const BakeTimelineDisplay: React.FC<BakeTimelineProps> = ({
  bakeSteps,
  bakeStartTime,
  onSetAlarm,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { scheduleNotification } = useAlarmNotifications();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const timeline = useMemo(() => {
    return BakeTimingManager.generateBakeTimeline(bakeSteps, bakeStartTime);
  }, [bakeSteps, bakeStartTime]);

  const upcomingEvents = useMemo(() => {
    return BakeTimingManager.getUpcomingEvents(timeline, 5);
  }, [timeline, currentTime]);

  const overdueEvents = useMemo(() => {
    return BakeTimingManager.getOverdueEvents(timeline);
  }, [timeline, currentTime]);

  const timeUntilNext = BakeTimingManager.getTimeUntilNextEvent(timeline);

  const handleSetAlarm = (event: BakeTimingEvent) => {
    // Schedule browser notification
    if (event.originalEvent) {
      scheduleNotification(event.originalEvent, event.scheduledTime);
    }
    
    // Call parent handler if provided
    onSetAlarm?.(event);
  };

  const getEventIcon = (event: BakeTimingEvent): string => {
    switch (event.type) {
      case 'step-start': return '▶️';
      case 'step-complete': return '✅';
      case 'fold': return '🤲';
      case 'alarm': return '⏰';
      case 'milestone': return '🎯';
      default: return '📍';
    }
  };

  const getEventColor = (event: BakeTimingEvent): string => {
    switch (event.status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'skipped': return 'text-gray-500 bg-gray-50 border-gray-200';
      default: return 'text-gray-700 bg-white border-gray-200';
    }
  };

  if (timeline.events.length === 0) {
    return (
      <div className={`text-center text-gray-500 py-8 ${className}`}>
        No timing events found for this bake
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-blue-900">📅 Bake Timeline</h3>
          <div className="text-sm text-blue-700">
            Started: {bakeStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded p-3">
            <div className="font-medium text-gray-900">Next Event</div>
            <div className="text-blue-600">
              {timeline.nextEvent ? (
                <>
                  {timeline.nextEvent.description}
                  <br />
                  <span className="text-xs">
                    {timeUntilNext !== null ? (
                      timeUntilNext > 0 ? `in ${timeUntilNext}min` : 'now'
                    ) : 'No upcoming events'}
                  </span>
                </>
              ) : (
                'All events completed'
              )}
            </div>
          </div>

          <div className="bg-white rounded p-3">
            <div className="font-medium text-gray-900">Total Duration</div>
            <div className="text-gray-600">
              {timeline.totalDuration ? `${Math.floor(timeline.totalDuration / 60)}h ${timeline.totalDuration % 60}m` : 'Unknown'}
            </div>
          </div>

          <div className="bg-white rounded p-3">
            <div className="font-medium text-gray-900">Progress</div>
            <div className="text-gray-600">
              {timeline.events.filter(e => e.status === 'completed').length} / {timeline.events.length} events
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Events Alert */}
      {overdueEvents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">⚠️ Overdue Events</h4>
          <div className="space-y-2">
            {overdueEvents.map(event => (
              <div key={event.id} className="text-sm text-red-700">
                <span className="font-medium">{event.description}</span>
                <span className="ml-2 text-red-500">
                  ({BakeTimingManager.formatRelativeTime(event.scheduledTime, currentTime)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-3">🔜 Upcoming Events</h4>
        <div className="space-y-3">
          {upcomingEvents.slice(0, 5).map(event => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-white border border-green-200 rounded"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getEventIcon(event)}</span>
                <div>
                  <div className="font-medium text-gray-900">{event.description}</div>
                  <div className="text-sm text-gray-600">
                    {event.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    <span className="ml-2 text-green-600">
                      ({BakeTimingManager.formatRelativeTime(event.scheduledTime, currentTime)})
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleSetAlarm(event)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                title={`Set alarm for ${event.scheduledTime.toLocaleTimeString()}`}
              >
                🔔 Alarm
              </button>
            </div>
          ))}
          
          {upcomingEvents.length === 0 && (
            <div className="text-sm text-green-700 italic">No upcoming events</div>
          )}
        </div>
      </div>

      {/* Complete Timeline */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">📋 Complete Timeline</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {timeline.events.map((event, index) => (
            <div
              key={event.id}
              className={`flex items-center justify-between p-2 rounded border ${getEventColor(event)}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                <span className="text-sm">{getEventIcon(event)}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{event.description}</div>
                  <div className="text-xs opacity-75">
                    {event.scheduledTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {event.actualTime && (
                      <span className="ml-2">
                        (actual: {event.actualTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  event.status === 'completed' ? 'bg-green-100 text-green-800' :
                  event.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  event.status === 'skipped' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {event.status}
                </span>
                
                {event.status === 'pending' && (
                  <button
                    onClick={() => handleSetAlarm(event)}
                    className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                  >
                    🔔
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
