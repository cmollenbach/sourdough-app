// timingParser.ts - Parse natural language timing plans into actionable schedules

export interface FoldEvent {
  id: string;
  type: 'fold' | 'mix' | 'shape' | 'bake' | 'other';
  timeMinutes: number;
  description: string;
  isRelative: boolean; // true for "30min after start", false for "2:30 PM"
}

export interface TimingSchedule {
  events: FoldEvent[];
  totalDuration?: number;
  startTime?: Date;
  warnings: string[];
}

export class TimingParser {
  
  /**
   * Parse natural language timing plan into structured schedule
   */
  static parseTimingPlan(text: string): TimingSchedule {
    const schedule: TimingSchedule = {
      events: [],
      warnings: []
    };

    if (!text?.trim()) {
      return schedule;
    }

    const lines = text.toLowerCase().split('\n').map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      // Parse different timing patterns
      this.parseTimeIntervals(line, schedule);
      this.parseSpecificTimes(line, schedule);
      this.parseSchedulePatterns(line, schedule);
      this.parseAbsoluteTimes(line, schedule);
    }

    // Sort events by time
    schedule.events.sort((a, b) => a.timeMinutes - b.timeMinutes);
    
    // Calculate total duration
    if (schedule.events.length > 0) {
      schedule.totalDuration = Math.max(...schedule.events.map(e => e.timeMinutes));
    }

    return schedule;
  }

  /**
   * Parse "S&F at 30, 60, 90, 120 minutes" patterns
   */
  private static parseTimeIntervals(line: string, schedule: TimingSchedule) {
    // Pattern: "30, 60, 90, 120" or "folds at 30, 60, 90"
    const intervalMatch = line.match(/(?:s&f|fold|folds).*?(?:at\s+)?(\d+(?:\s*,\s*\d+)*)/);
    if (intervalMatch) {
      const times = intervalMatch[1].split(',').map(t => parseInt(t.trim()));
      times.forEach((time, index) => {
        if (!isNaN(time)) {
          schedule.events.push({
            id: `fold-${time}`,
            type: 'fold',
            timeMinutes: time,
            description: `Stretch & Fold ${index + 1}`,
            isRelative: true
          });
        }
      });
    }
  }

  /**
   * Parse "every 30min for 4 folds" patterns
   */
  private static parseSchedulePatterns(line: string, schedule: TimingSchedule) {
    // Pattern: "every 30min for 4 folds" or "hourly folds for 3hrs"
    const everyMatch = line.match(/every\s+(\d+)\s*min(?:ute)?s?\s+for\s+(\d+)/);
    if (everyMatch) {
      const interval = parseInt(everyMatch[1]);
      const count = parseInt(everyMatch[2]);
      
      for (let i = 1; i <= count; i++) {
        schedule.events.push({
          id: `fold-${i * interval}`,
          type: 'fold',
          timeMinutes: i * interval,
          description: `Stretch & Fold ${i}`,
          isRelative: true
        });
      }
    }

    // Pattern: "hourly folds" or "folds every hour"
    const hourlyMatch = line.match(/(?:hourly|every\s+hour)/);
    if (hourlyMatch) {
      // Default to 4 folds if not specified
      const durationMatch = line.match(/(\d+)\s*hrs?/);
      const hours = durationMatch ? parseInt(durationMatch[1]) : 4;
      
      for (let i = 1; i <= hours; i++) {
        schedule.events.push({
          id: `fold-${i * 60}`,
          type: 'fold',
          timeMinutes: i * 60,
          description: `Hourly Stretch & Fold ${i}`,
          isRelative: true
        });
      }
    }
  }

  /**
   * Parse specific times like "mix at 8am, bulk until 12pm"
   */
  private static parseAbsoluteTimes(line: string, schedule: TimingSchedule) {
    // Pattern: "8am", "2:30pm", "12:00"
    const timeMatch = line.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/g);
    if (timeMatch) {
      timeMatch.forEach((timeStr, index) => {
        const parsed = this.parseAbsoluteTime(timeStr);
        if (parsed) {
          const action = this.inferActionFromContext(line, index);
          schedule.events.push({
            id: `time-${parsed.hours}-${parsed.minutes}`,
            type: action.type,
            timeMinutes: parsed.hours * 60 + parsed.minutes,
            description: action.description,
            isRelative: false
          });
        }
      });
    }
  }

  /**
   * Parse specific minute markers "first fold after 30min"
   */
  private static parseSpecificTimes(line: string, schedule: TimingSchedule) {
    // Pattern: "start at 30min" or "first fold after 45min"
    const startMatch = line.match(/(?:start|first|begin).*?(?:at|after)\s+(\d+)\s*min/);
    if (startMatch) {
      const startTime = parseInt(startMatch[1]);
      schedule.events.push({
        id: `start-${startTime}`,
        type: 'fold',
        timeMinutes: startTime,
        description: 'First Stretch & Fold',
        isRelative: true
      });
    }

    // Pattern: "bulk 4hrs" or "ferment for 3 hours"
    const durationMatch = line.match(/(?:bulk|ferment).*?(\d+)\s*hrs?/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      schedule.totalDuration = hours * 60;
    }
  }

  /**
   * Convert absolute time string to hours/minutes
   */
  private static parseAbsoluteTime(timeStr: string): {hours: number, minutes: number} | null {
    const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3]?.toLowerCase();

    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  /**
   * Infer what action is happening based on context
   */
  private static inferActionFromContext(line: string, index: number): {type: FoldEvent['type'], description: string} {
    if (line.includes('mix')) return { type: 'mix', description: 'Mix dough' };
    if (line.includes('shape')) return { type: 'shape', description: 'Shape loaves' };
    if (line.includes('bake')) return { type: 'bake', description: 'Start baking' };
    if (line.includes('fold') || line.includes('s&f')) return { type: 'fold', description: `Stretch & Fold ${index + 1}` };
    
    return { type: 'other', description: 'Scheduled action' };
  }

  /**
   * Generate alarm times for notifications
   */
  static generateAlarms(schedule: TimingSchedule, startTime: Date = new Date()): Array<{time: Date, event: FoldEvent}> {
    return schedule.events.map(event => ({
      time: new Date(startTime.getTime() + event.timeMinutes * 60 * 1000),
      event
    }));
  }

  /**
   * Format schedule for display
   */
  static formatSchedule(schedule: TimingSchedule): string {
    if (schedule.events.length === 0) {
      return 'No timing events parsed';
    }

    const lines = schedule.events.map(event => {
      const timeStr = event.isRelative 
        ? `${event.timeMinutes}min`
        : `${Math.floor(event.timeMinutes / 60)}:${(event.timeMinutes % 60).toString().padStart(2, '0')}`;
      
      return `• ${timeStr}: ${event.description}`;
    });

    if (schedule.totalDuration) {
      lines.push(`\nTotal duration: ${Math.floor(schedule.totalDuration / 60)}h ${schedule.totalDuration % 60}m`);
    }

    if (schedule.warnings.length > 0) {
      lines.push('\nWarnings:', ...schedule.warnings.map(w => `⚠️ ${w}`));
    }

    return lines.join('\n');
  }
}
