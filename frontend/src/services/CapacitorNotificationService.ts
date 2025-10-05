import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Capacitor Notification Service for Loafly
 * Handles scheduling notifications for bake timing events
 */

export class CapacitorNotificationService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Request notification permissions (Android 13+)
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) {
      console.log('Not running on native platform, skipping notification permissions');
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async checkPermissions(): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }

    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Generate a safe notification ID for Android (Java int max: 2,147,483,647)
   * Uses a counter-based approach instead of timestamp
   */
  private generateNotificationId(): number {
    // Use a random number between 1 and 2 billion (well under int max)
    return Math.floor(Math.random() * 2000000000) + 1;
  }

  /**
   * Schedule a notification for a bake step
   * @param bakeId - ID of the bake session
   * @param stepName - Name of the step (e.g., "Stretch & Fold")
   * @param delayMinutes - How many minutes from now
   */
  async scheduleStepNotification(
    bakeId: number,
    stepName: string,
    delayMinutes: number
  ): Promise<number | null> {
    if (!this.isNative) {
      console.log(`[Web] Would schedule notification for "${stepName}" in ${delayMinutes} minutes`);
      return null;
    }

    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.warn('No notification permission, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          console.error('Notification permission denied');
          return null;
        }
      }

      const notificationTime = new Date();
      notificationTime.setMinutes(notificationTime.getMinutes() + delayMinutes);

      const notificationId = this.generateNotificationId(); // Use safe ID generator

      const options: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: `🍞 ${stepName}`,
            body: 'Time to continue your bake!',
            schedule: {
              at: notificationTime,
              allowWhileIdle: true, // Fire even if device is idle
            },
            extra: {
              bakeId,
              stepName,
            },
            sound: undefined, // Use default notification sound
            smallIcon: 'ic_launcher',
            largeIcon: undefined,
            iconColor: '#F59E0B', // Loafly amber
          },
        ],
      };

      await LocalNotifications.schedule(options);
      console.log(`Scheduled notification ${notificationId} for "${stepName}" at ${notificationTime.toLocaleTimeString()}`);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Schedule multiple notifications at once
   * Useful for scheduling all step notifications when starting a bake
   */
  async scheduleBakeNotifications(
    bakeId: number,
    steps: Array<{ name: string; delayMinutes: number }>
  ): Promise<number[]> {
    if (!this.isNative) {
      console.log(`[Web] Would schedule ${steps.length} notifications for bake ${bakeId}`);
      return [];
    }

    const notificationIds: number[] = [];

    for (const step of steps) {
      const id = await this.scheduleStepNotification(bakeId, step.name, step.delayMinutes);
      if (id) {
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  /**
   * Cancel a specific notification
   */
  async cancelNotification(notificationId: number): Promise<void> {
    if (!this.isNative) {
      console.log(`[Web] Would cancel notification ${notificationId}`);
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log(`Cancelled notification ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all pending notifications
   * Useful when completing or canceling a bake
   */
  async cancelAllNotifications(): Promise<void> {
    if (!this.isNative) {
      console.log('[Web] Would cancel all notifications');
      return;
    }

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
        console.log(`Cancelled ${pending.notifications.length} pending notifications`);
      }
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get list of pending notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    if (!this.isNative) {
      return [];
    }

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  /**
   * Test notification - fires immediately
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isNative) {
      console.log('[Web] Would send test notification');
      alert('Test notification (web mode - no actual notification)');
      return;
    }

    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          alert('Notification permission denied');
          return;
        }
      }

      const now = new Date();
      now.setSeconds(now.getSeconds() + 2); // 2 seconds from now

      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999999,
            title: '🍞 Loafly Test',
            body: 'Notifications are working!',
            schedule: {
              at: now,
            },
            sound: undefined,
            smallIcon: 'ic_launcher',
            iconColor: '#F59E0B',
          },
        ],
      });

      alert('Test notification scheduled for 2 seconds from now');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert(`Error: ${error}`);
    }
  }
}

// Export singleton instance
export const notificationService = new CapacitorNotificationService();
