// bakeTimingUtils.ts - Enhanced timing system for active bakes

import { TimingParser, type FoldEvent, type TimingSchedule } from './timingParser';
import type { BakeStep } from '../types/bake';

export interface BakeTimingEvent {
  id: string;
  type: 'step-start' | 'step-complete' | 'fold' | 'alarm' | 'milestone';
  stepId?: number;
  stepName: string;
  description: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  isAlarmSet?: boolean;
  foldNumber?: number;
  originalEvent?: FoldEvent; // For S&F events
}

export interface BakeTimeline {
  events: BakeTimingEvent[];
  startTime: Date;
  estimatedEndTime?: Date;
  totalDuration?: number; // in minutes
  currentEventIndex: number;
  nextEvent?: BakeTimingEvent;
}

export class BakeTimingManager {
  
  /**
   * Generate comprehensive timeline when bake is started
   */
  static generateBakeTimeline(
    bakeSteps: BakeStep[], 
    startTime: Date = new Date()
  ): BakeTimeline {
    const events: BakeTimingEvent[] = [];
    let currentTime = new Date(startTime);

    for (const [index, step] of bakeSteps.entries()) {
      // Add step start event
      events.push({
        id: `step-${step.id}-start`,
        type: 'step-start',
        stepId: step.id,
        stepName: step.recipeStep?.stepTemplate?.name || `Step ${index + 1}`,
        description: `Begin ${step.recipeStep?.stepTemplate?.name || 'step'}`,
        scheduledTime: new Date(currentTime),
        status: 'pending'
      });

      // Parse timing plan for S&F events if this is a bulk fermentation step
      const timingPlan = this.extractTimingPlan(step);
      if (timingPlan) {
        const sfSchedule = TimingParser.parseTimingPlan(timingPlan);
        const sfEvents = this.generateSFEvents(step, sfSchedule, new Date(currentTime));
        events.push(...sfEvents);
      }

      // Estimate step duration and add completion event
      const stepDuration = this.estimateStepDuration(step);
      currentTime = new Date(currentTime.getTime() + stepDuration * 60 * 1000);

      events.push({
        id: `step-${step.id}-complete`,
        type: 'step-complete',
        stepId: step.id,
        stepName: step.recipeStep?.stepTemplate?.name || `Step ${index + 1}`,
        description: `Complete ${step.recipeStep?.stepTemplate?.name || 'step'}`,
        scheduledTime: new Date(currentTime),
        status: 'pending'
      });
    }

    // Sort events by scheduled time
    events.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

    return {
      events,
      startTime,
      estimatedEndTime: currentTime,
      totalDuration: Math.round((currentTime.getTime() - startTime.getTime()) / (1000 * 60)),
      currentEventIndex: 0,
      nextEvent: events.find(e => e.status === 'pending')
    };
  }

  /**
   * Extract timing plan from step parameter values
   */
  private static extractTimingPlan(step: BakeStep): string | null {
    const timingParam = step.parameterValues.find(pv => 
      pv.parameter?.name === 'Timing Plan' || 
      pv.parameter?.name === 'Custom Fold Schedule'
    );
    
    return timingParam?.plannedValue as string || null;
  }

  /**
   * Generate S&F events from parsed schedule
   */
  private static generateSFEvents(
    step: BakeStep, 
    schedule: TimingSchedule, 
    stepStartTime: Date
  ): BakeTimingEvent[] {
    return schedule.events.map((event, index) => ({
      id: `step-${step.id}-sf-${event.id}`,
      type: 'fold' as const,
      stepId: step.id,
      stepName: step.recipeStep?.stepTemplate?.name || 'Bulk Ferment',
      description: event.description,
      scheduledTime: new Date(stepStartTime.getTime() + event.timeMinutes * 60 * 1000),
      status: 'pending' as const,
      foldNumber: index + 1,
      originalEvent: event
    }));
  }

  /**
   * Estimate step duration based on step type and parameters
   */
  private static estimateStepDuration(step: BakeStep): number {
    const stepName = step.recipeStep?.stepTemplate?.name;

    // Get duration from step parameters
    const durationParam = step.parameterValues.find(pv => 
      pv.parameter?.name?.toLowerCase().includes('duration') ||
      pv.parameter?.name?.toLowerCase().includes('time')
    );

    if (durationParam?.plannedValue) {
      const duration = Number(durationParam.plannedValue);
      if (!isNaN(duration)) return duration;
    }

    // Default durations based on step name patterns
    if (stepName?.toLowerCase().includes('autolyse')) return 30;
    if (stepName?.toLowerCase().includes('mix')) return 15;
    if (stepName?.toLowerCase().includes('bulk')) return 240; // 4 hours default
    if (stepName?.toLowerCase().includes('shape')) return 20;
    if (stepName?.toLowerCase().includes('proof')) return 120; // 2 hours default
    if (stepName?.toLowerCase().includes('bake')) return 45;
    if (stepName?.toLowerCase().includes('rest')) return 60;
    
    return 30; // Default fallback
  }

  /**
   * Update timeline based on actual step timing
   */
  static updateTimelineProgress(
    timeline: BakeTimeline, 
    stepId: number, 
    eventType: 'start' | 'complete',
    actualTime: Date = new Date()
  ): BakeTimeline {
    const updatedEvents = timeline.events.map(event => {
      if (event.stepId === stepId && event.type === `step-${eventType}`) {
        return {
          ...event,
          actualTime,
          status: 'completed' as const
        };
      }
      return event;
    });

    // Update S&F events if step is completed
    if (eventType === 'complete') {
      updatedEvents.forEach(event => {
        if (event.stepId === stepId && event.type === 'fold' && event.status === 'pending') {
          // Mark past S&F events as skipped if step is completed
          if (event.scheduledTime <= actualTime) {
            event.status = 'skipped';
          }
        }
      });
    }

    const currentEventIndex = updatedEvents.findIndex(e => e.status === 'pending');
    const nextEvent = updatedEvents.find(e => e.status === 'pending');

    return {
      ...timeline,
      events: updatedEvents,
      currentEventIndex: currentEventIndex >= 0 ? currentEventIndex : timeline.currentEventIndex,
      nextEvent
    };
  }

  /**
   * Get upcoming events (next 3-5 events)
   */
  static getUpcomingEvents(timeline: BakeTimeline, count: number = 5): BakeTimingEvent[] {
    const now = new Date();
    return timeline.events
      .filter(event => event.status === 'pending' && event.scheduledTime > now)
      .slice(0, count);
  }

  /**
   * Get overdue events that should have happened
   */
  static getOverdueEvents(timeline: BakeTimeline): BakeTimingEvent[] {
    const now = new Date();
    return timeline.events.filter(event => 
      event.status === 'pending' && 
      event.scheduledTime <= now
    );
  }

  /**
   * Calculate time until next event
   */
  static getTimeUntilNextEvent(timeline: BakeTimeline): number | null {
    if (!timeline.nextEvent) return null;
    
    const now = new Date();
    const timeDiff = timeline.nextEvent.scheduledTime.getTime() - now.getTime();
    return Math.max(0, Math.round(timeDiff / (1000 * 60))); // minutes
  }

  /**
   * Format relative time (e.g., "in 15 minutes", "2 hours ago")
   */
  static formatRelativeTime(date: Date, now: Date = new Date()): string {
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins === 0) return 'now';
    if (diffMins > 0) {
      if (diffMins < 60) return `in ${diffMins}min`;
      const hours = Math.round(diffMins / 60);
      return `in ${hours}h`;
    } else {
      if (diffMins > -60) return `${Math.abs(diffMins)}min ago`;
      const hours = Math.round(Math.abs(diffMins) / 60);
      return `${hours}h ago`;
    }
  }
}
