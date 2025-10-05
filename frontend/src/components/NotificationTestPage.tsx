import React, { useState, useEffect } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonList } from '@ionic/react';
import { notificationService } from '../services/CapacitorNotificationService';
import { Capacitor } from '@capacitor/core';

/**
 * Test component for Capacitor notifications
 * Add this to your app temporarily to test notifications
 */
export const NotificationTestPage: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsNative(Capacitor.isNativePlatform());
    const permission = await notificationService.checkPermissions();
    setHasPermission(permission);
    
    const pending = await notificationService.getPendingNotifications();
    setPendingCount(pending.length);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    if (!granted) {
      alert('Permission denied. Please enable notifications in app settings.');
    }
  };

  const testImmediate = async () => {
    await notificationService.sendTestNotification();
  };

  const testDelayed = async () => {
    try {
      const id = await notificationService.scheduleStepNotification(
        1,
        'Test Step - 1 Minute',
        1 // 1 minute from now
      );
      if (id) {
        const scheduledTime = new Date();
        scheduledTime.setMinutes(scheduledTime.getMinutes() + 1);
        alert(`✅ Notification scheduled for ${scheduledTime.toLocaleTimeString()} (ID: ${id})\n\nCheck if it fires in 1 minute!`);
        await checkStatus();
      } else {
        alert('❌ Failed to schedule notification. Check console for errors.');
      }
    } catch (error) {
      alert(`Error scheduling notification: ${error}`);
      console.error('Schedule error:', error);
    }
  };

  const testMultiple = async () => {
    try {
      const steps = [
        { name: 'Notification #1', delayMinutes: 1 },
        { name: 'Notification #2', delayMinutes: 2 },
        { name: 'Notification #3', delayMinutes: 3 },
      ];
      
      const ids = await notificationService.scheduleBakeNotifications(1, steps);
      const now = new Date();
      const times = steps.map(s => {
        const t = new Date(now);
        t.setMinutes(t.getMinutes() + s.delayMinutes);
        return t.toLocaleTimeString();
      }).join(', ');
      
      alert(`✅ Scheduled ${ids.length} notifications\n\nTimes: ${times}\n\nIDs: ${ids.join(', ')}`);
      await checkStatus();
    } catch (error) {
      alert(`Error scheduling notifications: ${error}`);
      console.error('Schedule error:', error);
    }
  };

  const cancelAll = async () => {
    await notificationService.cancelAllNotifications();
    alert('All notifications cancelled');
    await checkStatus();
  };

  const viewPending = async () => {
    const pending = await notificationService.getPendingNotifications();
    if (pending.length === 0) {
      alert('No pending notifications');
    } else {
      const details = pending.map((n: any) => 
        `ID: ${n.id}\nTitle: ${n.title}\nSchedule: ${n.schedule ? new Date(n.schedule.at).toLocaleString() : 'N/A'}`
      ).join('\n\n');
      alert(`Pending Notifications (${pending.length}):\n\n${details}`);
    }
  };

  return (
    <div className="p-4">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>📱 Notification Test Panel</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonLabel>
                <h2>Platform</h2>
                <p>{isNative ? '✅ Native (Android/iOS)' : '⚠️ Web Browser'}</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel>
                <h2>Permission Status</h2>
                <p>{hasPermission ? '✅ Granted' : '❌ Not Granted'}</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonLabel>
                <h2>Pending Notifications</h2>
                <p>{pendingCount} scheduled</p>
              </IonLabel>
            </IonItem>
          </IonList>

          <div className="mt-4 space-y-2">
            {!hasPermission && (
              <IonButton expand="block" onClick={requestPermission}>
                Request Permission
              </IonButton>
            )}

            <IonButton 
              expand="block" 
              onClick={testImmediate}
              disabled={!isNative}
            >
              Test Immediate (2 sec delay)
            </IonButton>

            <IonButton 
              expand="block" 
              onClick={testDelayed}
              disabled={!isNative || !hasPermission}
              color="secondary"
            >
              Test 1 Minute Delay
            </IonButton>

            <IonButton 
              expand="block" 
              onClick={testMultiple}
              disabled={!isNative || !hasPermission}
              color="tertiary"
            >
              Test Multiple (1, 2, 3 min)
            </IonButton>

            <IonButton 
              expand="block" 
              onClick={cancelAll}
              disabled={!isNative || pendingCount === 0}
              color="danger"
            >
              Cancel All ({pendingCount})
            </IonButton>

            <IonButton 
              expand="block" 
              onClick={viewPending}
              disabled={!isNative}
              color="medium"
            >
              View Pending Notifications
            </IonButton>

            <IonButton 
              expand="block" 
              onClick={checkStatus}
              fill="outline"
            >
              Refresh Status
            </IonButton>
          </div>

          {!isNative && (
            <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900 rounded">
              <p className="text-sm">
                ⚠️ You're in web mode. Build and run on Android/iOS to test notifications.
              </p>
            </div>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};
