# 📱 Sourdough App - React Native Mobile Deployment Plan

**Goal:** Deploy reliable Android (and iOS) app with proper alarm/notification support for sourdough timing

**Timeline:** 2-3 weeks  
**Current Status:** Web app deployed (Frontend: Netlify, Backend: Render)  
**Target:** Android APK → Google Play Store

---

## 🎯 Why React Native (Not PWA)

**Critical Requirements:**
- ✅ **Reliable alarms** - Fermentation timers need to fire even after device reboot
- ✅ **Overnight notifications** - Must wake user for morning baking
- ✅ **Exact scheduling** - Stretch & fold timers every 30 minutes
- ✅ **Background sync** - Update bake status while app is closed
- ✅ **Offline support** - View recipes without internet

**PWA Limitations:**
- ❌ No reliable alarms after device sleep/reboot
- ❌ Cannot override Do Not Disturb
- ❌ Limited background task execution
- ❌ Unreliable for 6-12 hour fermentation timers

---

## 📋 Phase-by-Phase Implementation Plan

### **Phase 1: Project Setup & Configuration (Days 1-2)**

#### 1.1 Initialize React Native Project

```bash
# Navigate to workspace root
cd C:\Sourdough-app

# Create React Native app using Expo (recommended for easier setup)
npx create-expo-app sourdough-mobile --template

# Or use React Native CLI for more control
npx react-native init SourdoughMobile --template react-native-template-typescript
```

**Choose between:**
- **Expo** (Recommended): Easier setup, managed workflow, faster development
- **React Native CLI**: More control, native modules, smaller bundle size

**Recommendation:** Start with **Expo** for speed, then eject if you need native features

#### 1.2 Project Structure

```
sourdough-app/
├── backend/           # Existing Express backend
├── frontend/          # Existing React web app
├── mobile/            # NEW - React Native app
│   ├── app/           # Expo Router pages (if using Expo)
│   ├── components/    # Shared components
│   ├── screens/       # Screen components
│   ├── services/      # API client, notification service
│   ├── utils/         # Timing parser (reuse from web)
│   ├── assets/        # Images, icons
│   ├── app.json       # Expo config
│   └── package.json
└── docs/
```

#### 1.3 Install Essential Dependencies

```bash
cd mobile

# Core navigation
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Notifications & alarms
npm install react-native-push-notification
npm install @react-native-community/push-notification-ios # iOS support
npm install react-native-android-local-notification # Scheduled alarms

# Background tasks
npm install react-native-background-timer
npm install react-native-background-fetch

# API & state management
npm install axios
npm install @tanstack/react-query # or Redux Toolkit
npm install @react-native-async-storage/async-storage

# Date/time handling
npm install date-fns # or moment.js

# UI components
npm install react-native-paper # Material Design
# or
npm install native-base # Alternative UI library
```

---

### **Phase 2: Code Migration & Shared Logic (Days 3-5)**

#### 2.1 Create Shared Code Directory

Move reusable code to a shared location:

```
sourdough-app/
├── shared/            # NEW - Code shared between web and mobile
│   ├── types/         # TypeScript interfaces (User, Recipe, Bake, etc.)
│   ├── utils/         # timingParser.ts, api.ts
│   ├── hooks/         # Custom React hooks
│   └── constants/     # API URLs, config
```

#### 2.2 Files to Migrate from Web App

**Copy & adapt these:**
- ✅ `frontend/src/types/` → `shared/types/`
- ✅ `frontend/src/utils/timingParser.ts` → `shared/utils/`
- ✅ `frontend/src/utils/api.ts` → `shared/utils/api.ts` (adapt for React Native)
- ✅ `frontend/src/hooks/` → `shared/hooks/`
- ✅ Component logic (but re-style for mobile)

**Key differences for mobile:**
```typescript
// Web version (frontend/src/utils/api.ts)
import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL;

// Mobile version (shared/utils/api.ts)
import axios from 'axios';
import { API_BASE_URL } from '../constants';
const baseURL = API_BASE_URL; // 'https://sourdough-backend-onrender-com.onrender.com/api'
```

#### 2.3 Update package.json to use shared code

```json
// mobile/package.json
{
  "dependencies": {
    "@sourdough/shared": "file:../shared"
  }
}
```

---

### **Phase 3: Core Features Implementation (Days 6-10)**

#### 3.1 Authentication (Google OAuth)

**Challenge:** Google OAuth flow differs on mobile

```typescript
// mobile/services/auth.service.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // From Google Cloud Console
  offlineAccess: true,
});

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  
  // Send idToken to your backend
  const response = await api.post('/auth/oauth/google', {
    idToken: userInfo.idToken,
  });
  
  return response.data;
};
```

**Required setup:**
1. Add SHA-1 fingerprint to Google Cloud Console
2. Download `google-services.json`
3. Add to `android/app/`

#### 3.2 Navigation Structure

```typescript
// mobile/navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Auth screens */}
      <Stack.Screen name="Login" component={LoginScreen} />
      
      {/* Main app screens */}
      <Stack.Screen name="RecipeList" component={RecipeListScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="BakeTimer" component={BakeTimerScreen} />
      <Stack.Screen name="ActiveBake" component={ActiveBakeScreen} />
      
      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
```

#### 3.3 Recipe Display (Adapt from Web)

```typescript
// mobile/screens/RecipeListScreen.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { useRecipes } from '@sourdough/shared/hooks/useRecipes';

export default function RecipeListScreen({ navigation }) {
  const { data: recipes, isLoading } = useRecipes();

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
        >
          <View style={styles.recipeCard}>
            <Text style={styles.recipeName}>{item.name}</Text>
            <Text style={styles.recipeDescription}>{item.description}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
```

---

### **Phase 4: Alarm & Notification System (Days 11-14)** 🔔

**This is the CRITICAL feature for sourdough timing**

#### 4.1 Notification Service Setup

```typescript
// mobile/services/notification.service.ts
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

export class NotificationService {
  
  static initialize() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'sourdough-timers',
        channelName: 'Sourdough Timers',
        channelDescription: 'Alerts for stretch & folds, fermentation, baking',
        playSound: true,
        soundName: 'default',
        importance: 4, // High importance
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  /**
   * Schedule a single notification
   */
  static scheduleNotification(
    id: string,
    title: string,
    message: string,
    fireDate: Date,
    data?: any
  ) {
    PushNotification.localNotificationSchedule({
      id: id,
      channelId: 'sourdough-timers',
      title: title,
      message: message,
      date: fireDate,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      userInfo: data,
      importance: 'high',
      allowWhileIdle: true, // Fire even in battery saver mode
      invokeApp: false, // Don't open app automatically
    });
  }

  /**
   * Schedule multiple stretch & fold reminders
   */
  static scheduleStretchAndFolds(bakeId: number, startTime: Date, intervals: number[]) {
    intervals.forEach((minutes, index) => {
      const fireDate = new Date(startTime.getTime() + minutes * 60000);
      
      this.scheduleNotification(
        `bake-${bakeId}-fold-${index}`,
        `Stretch & Fold ${index + 1}`,
        `Time for stretch & fold #${index + 1}`,
        fireDate,
        { bakeId, type: 'fold', foldNumber: index + 1 }
      );
    });
  }

  /**
   * Schedule fermentation completion alarm
   */
  static scheduleFermentationComplete(bakeId: number, completionTime: Date) {
    this.scheduleNotification(
      `bake-${bakeId}-fermentation-complete`,
      '🍞 Fermentation Complete!',
      'Your dough is ready for shaping',
      completionTime,
      { bakeId, type: 'fermentation-complete' }
    );
  }

  /**
   * Cancel all notifications for a bake
   */
  static cancelBakeNotifications(bakeId: number) {
    // Get all scheduled notifications
    PushNotification.getScheduledLocalNotifications((notifications) => {
      notifications.forEach((notification) => {
        if (notification.data?.bakeId === bakeId) {
          PushNotification.cancelLocalNotification(notification.id);
        }
      });
    });
  }

  /**
   * Cancel specific notification
   */
  static cancelNotification(id: string) {
    PushNotification.cancelLocalNotification(id);
  }
}
```

#### 4.2 Bake Timer Screen with Live Updates

```typescript
// mobile/screens/BakeTimerScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { NotificationService } from '../services/notification.service';
import { TimingParser } from '@sourdough/shared/utils/timingParser';

export default function BakeTimerScreen({ route, navigation }) {
  const { bake } = route.params;
  const [activeTimer, setActiveTimer] = useState(null);

  const startBake = () => {
    const startTime = new Date();
    
    // Parse timing plan from recipe
    const schedule = TimingParser.parseTimingPlan(bake.recipe.timingPlan);
    
    // Schedule all notifications
    const foldIntervals = schedule.events
      .filter(e => e.type === 'fold')
      .map(e => e.timeMinutes);
    
    NotificationService.scheduleStretchAndFolds(bake.id, startTime, foldIntervals);
    
    // Schedule fermentation complete (e.g., 6 hours later)
    const fermentationEnd = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
    NotificationService.scheduleFermentationComplete(bake.id, fermentationEnd);
    
    // Update bake status in backend
    api.patch(`/bakes/${bake.id}`, {
      status: 'in_progress',
      startedAt: startTime.toISOString(),
    });
    
    navigation.navigate('ActiveBake', { bakeId: bake.id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.recipeName}>{bake.recipe.name}</Text>
      <Text style={styles.timingPlan}>{bake.recipe.timingPlan}</Text>
      
      <Button title="Start Bake" onPress={startBake} />
    </View>
  );
}
```

#### 4.3 Android Manifest Permissions

```xml
<!-- mobile/android/app/src/main/AndroidManifest.xml -->
<manifest>
  <!-- Notification permissions -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
  
  <!-- Wake lock to ensure alarms fire -->
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  
  <!-- Internet for API calls -->
  <uses-permission android:name="android.permission.INTERNET" />
  
  <application>
    <!-- Boot receiver to reschedule alarms after reboot -->
    <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>
  </application>
</manifest>
```

---

### **Phase 5: Android Build Configuration (Days 15-16)**

#### 5.1 Generate App Icons & Splash Screen

**Tools:**
- https://icon.kitchen/ (free icon generator)
- https://www.appicon.co/ (alternative)

**Required sizes:**
- `mipmap-mdpi`: 48x48
- `mipmap-hdpi`: 72x72
- `mipmap-xhdpi`: 96x96
- `mipmap-xxhdpi`: 144x144
- `mipmap-xxxhdpi`: 192x192

**Place in:** `mobile/android/app/src/main/res/mipmap-*/ic_launcher.png`

#### 5.2 Update App Configuration

```gradle
// mobile/android/app/build.gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.sourdough.loafly" // Your unique app ID
        minSdkVersion 24  // Android 7.0+
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
    
    signingConfigs {
        release {
            storeFile file('your-upload-key.keystore')
            storePassword 'your-keystore-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
}
```

#### 5.3 Generate Signing Key

```bash
# Generate upload keystore
cd mobile/android/app

keytool -genkeypair -v -storetype PKCS12 \
  -keystore sourdough-upload-key.keystore \
  -alias sourdough-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (SAVE THIS!)
# - Key password (SAVE THIS!)
# - Your name, organization, etc.
```

**CRITICAL:** Store these passwords in a password manager!

#### 5.4 Build APK for Testing

```bash
cd mobile/android

# Debug build (for testing)
./gradlew assembleDebug

# APK location:
# mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Install on connected Android device
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### 5.5 Build AAB for Play Store

```bash
# Production build (Android App Bundle - required for Play Store)
cd mobile/android
./gradlew bundleRelease

# AAB location:
# mobile/android/app/build/outputs/bundle/release/app-release.aab
```

---

### **Phase 6: Google Play Store Submission (Days 17-18)**

#### 6.1 Create Google Play Developer Account

1. Go to: https://play.google.com/console
2. Pay one-time $25 registration fee
3. Complete developer profile

#### 6.2 Prepare Store Assets

**Screenshots (Required):**
- Phone: 2-8 screenshots (16:9 or 9:16)
- 7-inch tablet: 1-2 screenshots
- 10-inch tablet: 1-2 screenshots

**Sizes:**
- Phone: 1080x1920 or 1080x2340 (portrait)
- Tablet 7": 1200x1920 (portrait)
- Tablet 10": 1600x2560 (portrait)

**Feature Graphic:**
- 1024x500 PNG
- Used in Play Store listing

**App Icon:**
- 512x512 PNG (32-bit with alpha)

#### 6.3 Write Store Listing

**App Name:** "Loafly - Sourdough Baking Timer"

**Short Description (80 chars):**
```
Perfect sourdough with timed stretch & folds and fermentation alerts
```

**Full Description (4000 chars max):**
```
🍞 NEVER MISS A STRETCH & FOLD AGAIN

Loafly is the essential companion app for sourdough bakers. Set precise timers for:

✓ Stretch & Fold Reminders - Get alerts every 30, 45, or 60 minutes
✓ Fermentation Tracking - Know exactly when your dough is ready
✓ Bulk Fermentation - Monitor temperature and time
✓ Overnight Alarms - Wake up to perfectly proofed dough
✓ Recipe Management - Save your favorite recipes with timing plans

FEATURES:

⏰ Reliable Alarms
• Notifications work even when app is closed
• Alarms survive device reboots
• Custom sounds and vibrations
• Override Do Not Disturb (optional)

📝 Recipe Builder
• Create custom recipes with timing plans
• Natural language timing ("S&F at 30, 60, 90, 120 min")
• Temperature and hydration tracking
• Step-by-step instructions

📊 Bake Tracking
• Log every bake with photos and notes
• Track success rate and improvements
• Rate your final loaves
• Build your baking history

🔄 Sync Across Devices
• Access recipes on web and mobile
• Backup to cloud
• Share recipes with friends

Perfect for beginners learning sourdough or experienced bakers managing multiple loaves!

Download Loafly today and bake your best bread yet! 🍞
```

**Category:** Food & Drink

**Tags:**
- sourdough
- baking
- bread
- timer
- cooking
- recipe
- fermentation

#### 6.4 Complete Content Rating Questionnaire

- Violence: No
- Sexual Content: No
- Profanity: No
- Controlled Substances: No
- User-Generated Content: Yes (recipe sharing)

**Result:** Rated E (Everyone)

#### 6.5 Privacy Policy (Required)

Create a simple privacy policy and host it:

```markdown
# Loafly Privacy Policy

## Data We Collect
- Email address (for account creation)
- Recipe data (stored on our servers)
- Bake logs and photos (optional)

## How We Use Data
- To provide app functionality
- To sync data across devices
- To improve our services

## Data Sharing
We do NOT sell or share your data with third parties.

## Contact
Email: privacy@loafly.app
```

Host at: `https://loafly.app/privacy`

#### 6.6 Upload App Bundle

1. Create new app in Play Console
2. Create production release
3. Upload `app-release.aab`
4. Fill in release notes:

```
Initial release of Loafly!

Features:
• Reliable stretch & fold timers
• Fermentation tracking
• Recipe management
• Bake logging with photos
• Google sign-in
```

5. Review and publish

**Timeline:**
- Review takes 1-3 days (sometimes up to 7 days)
- App will be "Pending publication" during review

---

### **Phase 7: Testing & Quality Assurance (Days 19-21)**

#### 7.1 Testing Checklist

**Functionality:**
- [ ] User can sign in with Google
- [ ] User can create/edit recipes
- [ ] User can start a bake
- [ ] Notifications fire at correct times
- [ ] Notifications work when app is closed
- [ ] Notifications work after device reboot
- [ ] User can log bake results
- [ ] Photos upload successfully
- [ ] Data syncs with backend

**Edge Cases:**
- [ ] Airplane mode handling
- [ ] Low battery mode
- [ ] Do Not Disturb mode
- [ ] Multiple concurrent bakes
- [ ] App backgrounded during timer
- [ ] Device restarted during timer
- [ ] Notification tapped behavior

**Performance:**
- [ ] App opens in < 3 seconds
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Battery usage is reasonable

#### 7.2 Beta Testing

Use Google Play Internal Testing:

1. Create internal testing track
2. Add testers via email
3. Share testing link
4. Collect feedback
5. Iterate

**Beta testers:** 5-10 sourdough bakers

---

## 📦 Final Deliverables Checklist

### Code & Assets
- [ ] React Native app code
- [ ] Android build configuration
- [ ] App icons (all sizes)
- [ ] Screenshots (phone, tablet)
- [ ] Feature graphic
- [ ] Signing keystore (backed up securely!)

### Documentation
- [ ] README.md for mobile development
- [ ] API integration guide
- [ ] Build instructions
- [ ] Release notes template

### Store Listing
- [ ] App name and description
- [ ] Privacy policy (hosted)
- [ ] Content rating completed
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded

### Testing
- [ ] Internal testing completed
- [ ] Beta testing feedback addressed
- [ ] All critical bugs fixed
- [ ] Performance optimized

### Deployment
- [ ] Production AAB built
- [ ] Release notes written
- [ ] App bundle uploaded to Play Console
- [ ] Submitted for review

---

## 🔧 Development Tools & Resources

### Required Software
- **Node.js** 18+ (already installed)
- **Android Studio** (for Android SDK and emulator)
- **Java JDK** 17 (required for Android builds)
- **Watchman** (optional, for better file watching on Windows)

### Useful VS Code Extensions
- React Native Tools
- ES7+ React/Redux/React-Native snippets
- React-Native/React/Redux snippets
- Prettier - Code formatter

### Testing Devices
- **Physical Android device** (recommended for notification testing)
- **Android Emulator** (for UI testing)

### Documentation
- React Native: https://reactnative.dev/
- React Navigation: https://reactnavigation.org/
- Push Notifications: https://github.com/zo0r/react-native-push-notification
- Google Play Console: https://support.google.com/googleplay/android-developer

---

## 💰 Cost Breakdown

### One-Time Costs
- Google Play Developer Account: **$25**
- Signing certificate: **Free** (self-generated)

### Ongoing Costs
- **$0** - You already have backend/database on Render
- **$0** - Hosting costs unchanged (backend handles both web and mobile)

### Optional Costs
- App icon design: **$0-50** (use free tools or hire designer)
- Beta testing incentives: **$0** (friends/community)

**Total to launch:** **$25-75**

---

## ⚡ Quick Start Commands

```bash
# 1. Install Expo CLI globally
npm install -g expo-cli

# 2. Create new Expo app
cd C:\Sourdough-app
npx create-expo-app mobile --template blank-typescript

# 3. Install dependencies
cd mobile
npm install @react-navigation/native @react-navigation/stack
npm install react-native-push-notification
npm install axios @tanstack/react-query

# 4. Link shared code
npm install file:../shared

# 5. Start development server
npx expo start

# 6. Run on Android
# Press 'a' in terminal or scan QR code with Expo Go app
```

---

## 🎯 Success Metrics

### Week 1 (Setup)
- [ ] Project created and running on emulator
- [ ] Basic navigation working
- [ ] Can connect to backend API

### Week 2 (Core Features)
- [ ] Authentication working
- [ ] Recipe list displaying
- [ ] Can start a bake

### Week 3 (Polish & Deploy)
- [ ] Notifications firing correctly
- [ ] App built and tested on device
- [ ] Submitted to Play Store

---

## 🚨 Common Pitfalls & Solutions

### Problem: Notifications not firing when app closed
**Solution:** 
- Ensure `allowWhileIdle: true` in notification config
- Add `SCHEDULE_EXACT_ALARM` permission
- Test on physical device (not emulator)

### Problem: Build fails with "SDK not found"
**Solution:**
- Install Android Studio
- Set `ANDROID_HOME` environment variable
- Accept SDK licenses: `sdkmanager --licenses`

### Problem: Google Sign-In not working
**Solution:**
- Add SHA-1 fingerprint to Firebase console
- Download latest `google-services.json`
- Ensure webClientId matches Google Console

### Problem: App crashes on startup
**Solution:**
- Check logs: `adb logcat`
- Clear cache: `cd android && ./gradlew clean`
- Rebuild: `./gradlew assembleDebug`

---

## 📞 Next Steps

**Ready to start?** Here's what to do:

1. **Install Android Studio** (if not already installed)
2. **Create Expo project** (run commands above)
3. **Set up shared code directory**
4. **Migrate timingParser.ts** (easiest first step)
5. **Build first screen** (RecipeList)

Would you like me to:
- [ ] Create the initial project structure?
- [ ] Write the notification service code?
- [ ] Set up the shared code directory?
- [ ] Generate the Android build configuration?

**Let me know which part you'd like to tackle first, and I'll provide detailed step-by-step guidance!** 🚀
