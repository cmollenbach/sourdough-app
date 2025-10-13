# 📱 Capacitor Setup Guide - Loafly Mobile

**Strategy:** Wrap existing React + Ionic web app with Capacitor for native Android/iOS deployment

**Goal:** Transform `frontend/` into a cross-platform app (web + mobile) with 85% code reuse

**Timeline:** 1-2 weeks to production Android app

---

## 🎯 Why Capacitor for Loafly

### Perfect Fit for Our Use Case:
1. ✅ **Ionic already installed** - Frontend has `@ionic/react: ^8.6.0`
2. ✅ **Maximum code reuse** - Same React components work on web and mobile
3. ✅ **Reliable notifications** - `@capacitor/local-notifications` for sourdough timers
4. ✅ **Single codebase** - One app, multiple platforms
5. ✅ **Fast iteration** - Fix bugs once, deploy everywhere

### Capacitor Architecture:
```
┌───────────────────────────────────┐
│   React App (Ionic Components)   │ ← Your existing frontend
│   - RecipeBuilder, BakeView, etc │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│      Capacitor Bridge Layer       │ ← Native API access
│   - LocalNotifications plugin     │
│   - BackgroundRunner plugin       │
└───────────────────────────────────┘
              ↓
┌────────────┬──────────────────────┐
│  Browser   │   Native WebView     │
│  (Web)     │   (Android/iOS)      │
└────────────┴──────────────────────┘
```

---

## 📋 Step-by-Step Setup

### Prerequisites

**Install required software:**
1. **Android Studio**: https://developer.android.com/studio
   - Includes Android SDK
   - Includes Android Emulator
   - Required for building APK/AAB

2. **Java JDK 17**:
   ```powershell
   # Check if already installed
   java -version
   
   # If not, download from:
   # https://adoptium.net/temurin/releases/?version=17
   ```

3. **Verify Node.js & npm** (already have these):
   ```powershell
   node -v  # Should be 18+
   npm -v   # Should be 9+
   ```

---

### Phase 1: Install Capacitor (15 minutes)

#### Step 1.1: Navigate to Frontend

```powershell
cd c:\Sourdough-app\sourdough-app\frontend
```

#### Step 1.2: Install Core Packages

```powershell
npm install @capacitor/core @capacitor/cli
```

**What this does:**
- `@capacitor/core` - Runtime bridge between web and native
- `@capacitor/cli` - Command-line tools for building/syncing

#### Step 1.3: Install Platform Packages

```powershell
npm install @capacitor/android @capacitor/ios
```

**Note:** iOS package optional for now, focus on Android first

#### Step 1.4: Install Essential Plugins

```powershell
# Notifications - CRITICAL for sourdough timers
npm install @capacitor/local-notifications

# Background tasks - Update bake status when app closed
npm install @capacitor/background-runner

# Utility plugins
npm install @capacitor/app           # App lifecycle events
npm install @capacitor/haptics       # Vibration feedback
npm install @capacitor/status-bar    # Status bar styling
npm install @capacitor/splash-screen # App launch screen
npm install @capacitor/toast         # Native toast messages
```

**Verification:**
```powershell
npm list | findstr capacitor
```

Should show all installed Capacitor packages.

---

### Phase 2: Initialize Capacitor (10 minutes)

#### Step 2.1: Initialize Project

```powershell
npx cap init
```

**Prompts (answer as shown):**
```
? What is the name of your app? → Loafly
? What should be the Package ID for your app? → com.loafly.sourdough
? What is the web asset directory for your app? → dist
```

**What this creates:**
- `capacitor.config.ts` - Main Capacitor configuration
- Updates `package.json` with Capacitor info

#### Step 2.2: Verify Configuration

Open `capacitor.config.ts`, should look like:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loafly.sourdough',
  appName: 'Loafly',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

#### Step 2.3: Add Android Platform

```powershell
npx cap add android
```

**What this does:**
- Creates `android/` directory in frontend
- Generates Android project structure
- Configures Gradle build files
- Sets up AndroidManifest.xml

**Takes:** 2-3 minutes

**Verify:**
```powershell
dir android  # Should see Android project files
```

---

### Phase 3: Configure Capacitor (20 minutes)

#### Step 3.1: Update Capacitor Config

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loafly.sourdough',
  appName: 'Loafly',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development, allow localhost connections
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_notification",  // Must create this icon
      iconColor: "#F59E0B",          // Loafly brand color (amber)
      sound: "beep.wav"              // Custom notification sound (optional)
    },
    SplashScreen: {
      launchShowDuration: 2000,      // 2 seconds
      backgroundColor: "#FFFFFF",     // White background
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      backgroundColor: "#F59E0B",    // Amber status bar
      style: "dark"                  // Dark text on light background
    }
  }
};

export default config;
```

#### Step 3.2: Update Android Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Add these permissions BEFORE <application> tag -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Notification permissions (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Exact alarm permissions (CRITICAL for sourdough timers) -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    
    <!-- Background execution -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    
    <!-- Vibration for notifications -->
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <!-- Existing content -->
    </application>
</manifest>
```

#### Step 3.3: Update Vite Config for Capacitor

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow Capacitor to access dev server from device
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // Ensure compatibility with mobile WebView
    target: 'es2015',
    outDir: 'dist',
    // Generate sourcemaps for debugging on device
    sourcemap: false,
    // Optimize for mobile
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ionic: ['@ionic/react', '@ionic/react-router']
        }
      }
    }
  },
})
```

---

### Phase 4: Create Notification Service (30 minutes)

Create `src/services/capacitorNotificationService.ts`:

```typescript
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class CapacitorNotificationService {
  private isInitialized = false;

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<boolean> {
    // Only works on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('[Notifications] Not available on web platform');
      return false;
    }

    try {
      // Check current permission status
      const permStatus = await LocalNotifications.checkPermissions();
      
      if (permStatus.display === 'granted') {
        this.isInitialized = true;
        return true;
      }

      // Request permission
      const result = await LocalNotifications.requestPermissions();
      this.isInitialized = result.display === 'granted';
      
      if (!this.isInitialized) {
        console.warn('[Notifications] Permission denied');
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error('[Notifications] Initialization error:', error);
      return false;
    }
  }

  /**
   * Schedule stretch & fold notifications
   * Example: intervals = [30, 60, 90, 120] (minutes from now)
   */
  async scheduleStretchAndFold(
    bakeId: number,
    intervals: number[]
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[Notifications] Service not initialized');
      return;
    }

    const notifications: LocalNotificationSchema[] = intervals.map((minutes, index) => ({
      id: bakeId * 1000 + index,
      title: '🍞 Stretch & Fold Time!',
      body: `Time for stretch & fold #${index + 1}`,
      schedule: {
        at: new Date(Date.now() + minutes * 60 * 1000),
        allowWhileIdle: true, // Fire even if device sleeping
      },
      sound: 'beep.wav',
      smallIcon: 'ic_notification',
      iconColor: '#F59E0B',
      extra: {
        bakeId,
        type: 'stretch-fold',
        index,
      },
    }));

    try {
      await LocalNotifications.schedule({ notifications });
      console.log(`[Notifications] Scheduled ${notifications.length} S&F reminders for bake ${bakeId}`);
    } catch (error) {
      console.error('[Notifications] Error scheduling S&F:', error);
    }
  }

  /**
   * Schedule bulk fermentation completion notification
   */
  async scheduleBulkFermentation(
    bakeId: number,
    durationMinutes: number
  ): Promise<void> {
    if (!this.isInitialized) return;

    const notification: LocalNotificationSchema = {
      id: bakeId * 1000 + 999, // Special ID for bulk completion
      title: '🎉 Bulk Fermentation Complete!',
      body: 'Your dough is ready to shape',
      schedule: {
        at: new Date(Date.now() + durationMinutes * 60 * 1000),
        allowWhileIdle: true,
      },
      sound: 'beep.wav',
      smallIcon: 'ic_notification',
      iconColor: '#F59E0B',
      extra: {
        bakeId,
        type: 'bulk-complete',
      },
    };

    try {
      await LocalNotifications.schedule({ notifications: [notification] });
      console.log(`[Notifications] Scheduled bulk fermentation for bake ${bakeId} (${durationMinutes} min)`);
    } catch (error) {
      console.error('[Notifications] Error scheduling bulk:', error);
    }
  }

  /**
   * Cancel all notifications for a specific bake
   */
  async cancelBakeNotifications(bakeId: number): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      
      const bakeNotificationIds = pending.notifications
        .filter((n) => n.extra?.bakeId === bakeId)
        .map((n) => ({ id: n.id }));

      if (bakeNotificationIds.length > 0) {
        await LocalNotifications.cancel({ notifications: bakeNotificationIds });
        console.log(`[Notifications] Cancelled ${bakeNotificationIds.length} notifications for bake ${bakeId}`);
      }
    } catch (error) {
      console.error('[Notifications] Error cancelling:', error);
    }
  }

  /**
   * Cancel ALL pending notifications
   */
  async cancelAll(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
        console.log(`[Notifications] Cancelled all ${pending.notifications.length} notifications`);
      }
    } catch (error) {
      console.error('[Notifications] Error cancelling all:', error);
    }
  }

  /**
   * Get all pending notifications (for debugging)
   */
  async getPending(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('[Notifications] Error getting pending:', error);
      return [];
    }
  }
}

// Singleton instance
export const capacitorNotificationService = new CapacitorNotificationService();
```

---

### Phase 5: Integrate Notifications (30 minutes)

#### Step 5.1: Initialize on App Load

Edit `src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { capacitorNotificationService } from './services/capacitorNotificationService'
import { Capacitor } from '@capacitor/core'

// Initialize notifications on native platforms
if (Capacitor.isNativePlatform()) {
  capacitorNotificationService.initialize().then((success) => {
    if (success) {
      console.log('✅ Notifications initialized');
    } else {
      console.warn('⚠️ Notifications not available');
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### Step 5.2: Use in Bake Component

Edit `src/components/Bake/BakeView.tsx` (example integration):

```typescript
import { capacitorNotificationService } from '../../services/capacitorNotificationService';
import { parseTimingPlan } from '@sourdough/shared';
import { Capacitor } from '@capacitor/core';

// In your component:
const handleStartBake = async (timingPlan: string) => {
  // ... existing bake creation logic ...
  
  // Schedule notifications (only on mobile)
  if (Capacitor.isNativePlatform()) {
    const intervals = parseTimingPlan(timingPlan);
    
    if (intervals.stretchAndFoldIntervals?.length > 0) {
      await capacitorNotificationService.scheduleStretchAndFold(
        bake.id,
        intervals.stretchAndFoldIntervals
      );
    }
    
    if (intervals.bulkFermentationMinutes) {
      await capacitorNotificationService.scheduleBulkFermentation(
        bake.id,
        intervals.bulkFermentationMinutes
      );
    }
  }
};

const handleCompleteBake = async () => {
  // Cancel notifications when bake is completed/cancelled
  if (Capacitor.isNativePlatform()) {
    await capacitorNotificationService.cancelBakeNotifications(bake.id);
  }
  
  // ... rest of completion logic ...
};
```

---

### Phase 6: Build & Run (20 minutes)

#### Step 6.1: Build Frontend

```powershell
npm run build
```

**Verify:** Check that `dist/` folder contains built files

#### Step 6.2: Sync with Android

```powershell
npx cap sync android
```

**What this does:**
- Copies `dist/` contents to `android/app/src/main/assets/public/`
- Updates Android project with latest plugins
- Configures AndroidManifest.xml with plugin permissions

#### Step 6.3: Open in Android Studio

```powershell
npx cap open android
```

**Android Studio will open. Wait for:**
1. Gradle sync to complete (2-5 minutes first time)
2. "BUILD SUCCESSFUL" message
3. No errors in bottom panel

#### Step 6.4: Run on Device/Emulator

**Option A: Physical Device (Recommended)**
1. Enable USB Debugging on Android phone
2. Connect via USB
3. Click green ▶️ "Run" button in Android Studio
4. Select your device from list

**Option B: Emulator**
1. Click "Device Manager" in Android Studio
2. Create new virtual device (Pixel 6, API 33)
3. Click green ▶️ "Run" button
4. Select emulator from list

**App should launch!** 🎉

---

### Phase 7: Testing Checklist

#### ✅ Basic Functionality
- [ ] App opens successfully
- [ ] Can navigate between screens
- [ ] Login with Google OAuth works
- [ ] Can view recipe list
- [ ] Can create a recipe
- [ ] Can start a bake

#### ✅ Notifications (CRITICAL)
- [ ] Notification permission requested on first launch
- [ ] Can schedule a notification (test with 1 minute delay)
- [ ] Notification appears at correct time
- [ ] Tapping notification opens app
- [ ] Can schedule multiple notifications
- [ ] Notifications survive app being closed
- [ ] **Notifications survive device reboot** (most critical test)

#### ✅ Performance
- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling
- [ ] No lag when opening screens
- [ ] Acceptable battery usage (check after 1 hour)

---

## 🛠️ Development Workflow

### Daily Development:

```powershell
# 1. Make changes to React code
# 2. Test in browser first (faster)
npm run dev
# Open http://localhost:5173

# 3. When ready to test on device:
npm run build
npx cap sync android
npx cap run android  # Opens Android Studio + runs on device
```

### Live Reload on Device:

```powershell
# 1. Start Vite dev server
npm run dev

# 2. Update capacitor.config.ts temporarily:
server: {
  url: 'http://192.168.1.100:5173',  # Your computer's IP
  cleartext: true
}

# 3. Sync and run
npx cap sync android
npx cap run android

# Now changes appear instantly on device!
```

**Find your IP:**
```powershell
ipconfig  # Look for "IPv4 Address" on your WiFi adapter
```

---

## 📦 Building for Production

### Step 1: Build Optimized Frontend

```powershell
npm run build
npx cap sync android
```

### Step 2: Generate Signing Key

```powershell
cd android/app

keytool -genkeypair -v -storetype PKCS12 \
  -keystore loafly-upload-key.keystore \
  -alias loafly-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

**Save the passwords!**

### Step 3: Configure Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('loafly-upload-key.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'loafly-key'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build AAB for Play Store

```powershell
cd android
.\gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

**This file is ready for Google Play Store upload!**

---

## 🐛 Troubleshooting

### Issue: "Gradle build failed"
**Solution:**
```powershell
cd android
.\gradlew clean
.\gradlew build
```

### Issue: "App crashes on launch"
**Solution:**
- Check Android Studio Logcat for errors
- Verify `dist/` folder has built files
- Run `npx cap sync android` again

### Issue: "Notifications not appearing"
**Solution:**
- Check permission was granted
- Verify AndroidManifest.xml has notification permissions
- Test on physical device (emulator can be unreliable)
- Check Android Settings → Apps → Loafly → Notifications

### Issue: "Cannot connect to localhost API"
**Solution:**
- Update API URL in `.env`:
  ```
  VITE_API_BASE_URL=https://sourdough-backend-onrender-com.onrender.com/api
  ```
- Rebuild: `npm run build && npx cap sync android`

---

## ✅ Success Checklist

Before considering Capacitor setup complete:

- [ ] App runs on physical Android device
- [ ] Notifications fire at correct times
- [ ] Notifications survive app being closed
- [ ] Notifications survive device reboot
- [ ] Can create and start a bake
- [ ] OAuth login works
- [ ] Performance is acceptable
- [ ] Battery usage is reasonable
- [ ] Produced a signed AAB for Play Store

---

## 📚 Next Steps

After completing this guide:

1. **Create Play Store listing** - Screenshots, description, icons
2. **Beta testing** - Test with 5-10 real sourdough bakers
3. **Polish** - Fix any issues found in testing
4. **Submit to Play Store** - Upload AAB, wait for review (1-7 days)
5. **Launch!** 🚀

---

## 📖 Helpful Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Ionic React Docs:** https://ionicframework.com/docs/react
- **Local Notifications Plugin:** https://capacitorjs.com/docs/apis/local-notifications
- **Android Studio Guide:** https://developer.android.com/studio/intro

---

**Last Updated:** October 5, 2025  
**Status:** Ready for implementation  
**Estimated Time:** 1-2 weeks to production Android app
