# 🎉 Capacitor Setup Complete - Next Steps

## ✅ What's Been Done

1. **✅ Capacitor Installed**
   - Core packages: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
   - Plugins: `@capacitor/local-notifications`, `@capacitor/preferences`

2. **✅ Project Configured**
   - `capacitor.config.ts` created with proper settings
   - Android platform added (`frontend/android/` directory)
   - Permissions configured in `AndroidManifest.xml`

3. **✅ Notification Service Created**
   - `frontend/src/services/CapacitorNotificationService.ts` 
   - Full notification scheduling, cancellation, permission handling
   - Works on both web (logs) and native (actual notifications)

4. **✅ Test Page Added**
   - `frontend/src/components/NotificationTestPage.tsx`
   - Accessible at `/test/notifications` after login
   - Test immediate, delayed, and multiple notifications

5. **✅ App Built & Synced**
   - Frontend compiled to `dist/`
   - Assets copied to Android project
   - Ready to run!

---

## 📱 Next Step: Run in Android Studio

### Option 1: Open Android Studio (Recommended)

1. **Open Android Studio:**
   ```powershell
   cd c:\Sourdough-app\sourdough-app\frontend
   npx cap open android
   ```
   
   OR manually:
   - Open Android Studio
   - File → Open → Select `c:\Sourdough-app\sourdough-app\frontend\android`

2. **Wait for Gradle Sync** (2-5 minutes first time)
   - Progress bar at bottom of Android Studio
   - It's downloading Android dependencies

3. **Select a Device:**
   - Top toolbar → Device dropdown
   - **Option A:** Physical Android phone (USB debugging enabled)
   - **Option B:** Create emulator: Tools → Device Manager → Create Device

4. **Click Run ▶️**
   - Green play button in toolbar
   - First build takes 3-5 minutes
   - Subsequent builds: 30-60 seconds

5. **App Should Launch!**
   - Login with your credentials
   - Navigate to: http://localhost:5173/test/notifications (in the app)
   - Or use navigation menu if available

---

## 🧪 Testing Notifications

Once the app is running:

1. **Navigate to Test Page:**
   - In the app, go to Settings or manually type URL
   - Or modify navigation to add "Notification Test" link

2. **Request Permission:**
   - Click "Request Permission" button
   - Android will show permission dialog
   - Grant notification permission

3. **Test Immediate Notification:**
   - Click "Test Immediate (2 sec delay)"
   - Notification appears in 2 seconds
   - ✅ If you see it, notifications work!

4. **Test Delayed Notification:**
   - Click "Test 1 Minute Delay"
   - Wait 1 minute (or lock phone)
   - Notification should appear even if app is closed

5. **Test Multiple:**
   - Click "Test Multiple (1, 2, 3 min)"
   - Schedules 3 notifications at 1-minute intervals
   - Good test for bake step notifications

---

## 🐛 Troubleshooting

### "Gradle sync failed"
```
Solution: Wait for it to complete, can take 5-10 minutes first time
If still fails: File → Invalidate Caches → Restart
```

### "Device not found"
```
For Physical Device:
1. Enable Developer Options on phone (tap Build Number 7 times in Settings → About)
2. Enable USB Debugging in Developer Options
3. Connect via USB and allow debugging when prompted

For Emulator:
1. Tools → Device Manager
2. Create Device → Choose phone model (e.g., Pixel 6)
3. Download system image when prompted
4. Click Play button to start emulator
```

### "App crashes on launch"
```
1. Check Logcat in Android Studio (bottom panel)
2. Look for red error messages
3. Common issue: API URL not set
   - Verify environment variables in capacitor.config.ts
```

### "Notifications not working"
```
1. Verify permission was granted (check test page status)
2. Check Android version (must be API 23+, ideally 33+)
3. Check Logcat for errors
4. Try test immediate notification first (simplest test)
```

---

## 📂 Project Structure

```
frontend/
├── android/                           # Native Android project 🆕
│   ├── app/
│   │   └── src/main/
│   │       ├── AndroidManifest.xml    # Permissions
│   │       ├── assets/public/         # Your web app
│   │       ├── java/                  # Native Java/Kotlin
│   │       └── res/                   # Android resources
│   └── build.gradle                   # Build configuration
│
├── src/
│   ├── services/
│   │   └── CapacitorNotificationService.ts  # Notification logic 🆕
│   └── components/
│       └── NotificationTestPage.tsx         # Test UI 🆕
│
├── capacitor.config.ts               # Capacitor configuration 🆕
└── dist/                             # Built web app
```

---

## 🔄 Development Workflow

### Making Changes to Code

```powershell
# 1. Edit your React code
# 2. Rebuild
cd frontend
npm run build

# 3. Sync to native
npx cap sync

# 4. In Android Studio, click Run ▶️
```

**Shortcut for live development:**
```powershell
# Run dev server
npm run dev

# In capacitor.config.ts, add:
server: {
  url: 'http://192.168.1.100:5173',  # Your local IP
  cleartext: true
}

# Sync and run - app will load from dev server
npx cap sync
# Then Run in Android Studio
```

---

## 🎯 Next Features to Implement

### 1. Integrate with Actual Bakes (Next Priority)

Edit `frontend/src/store/useBakeStore.ts`:

```typescript
import { notificationService } from '../services/CapacitorNotificationService';

// In startBake function:
const response = await api.post('/bakes', { recipeId, notes });
const bake = response.data;

// Schedule notifications for bake steps
const steps = bake.steps.map((step, index) => ({
  name: step.name,
  delayMinutes: index * 30  // Example: every 30 minutes
}));

await notificationService.scheduleBakeNotifications(bake.id, steps);
```

### 2. Cancel Notifications on Bake Completion

```typescript
// In completeBake function:
await notificationService.cancelAllNotifications();
```

### 3. Replace localStorage with Capacitor Preferences

```typescript
import { Preferences } from '@capacitor/preferences';

// Instead of:
localStorage.setItem('token', token);

// Use:
await Preferences.set({ key: 'token', value: token });

// Instead of:
const token = localStorage.getItem('token');

// Use:
const { value } = await Preferences.get({ key: 'token' });
```

---

## 📱 Building for Production

### Debug APK (for testing)

```powershell
cd frontend/android
.\gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (for distribution)

```powershell
.\gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (for Play Store)

```powershell
.\gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📊 Current Status

**Phase 1-5: COMPLETE** ✅
- [x] Install Capacitor
- [x] Initialize project
- [x] Configure settings
- [x] Create notification service
- [x] Add test page
- [x] Build and sync

**Phase 6: IN PROGRESS** 🔄
- [ ] Run in Android Studio
- [ ] Test notifications work
- [ ] Verify all app features work on mobile

**Phase 7: TODO** ⏳
- [ ] Integrate notifications with real bake flow
- [ ] Replace localStorage with Preferences
- [ ] Build production APK
- [ ] Test on multiple devices
- [ ] Submit to Play Store

---

## 🎉 You're Almost There!

1. **Open Android Studio** (if not already open)
2. **Wait for Gradle sync** to complete
3. **Click Run ▶️**
4. **Login to app**
5. **Navigate to** `/test/notifications`
6. **Test notifications!**

**Need help?** Check:
- [CAPACITOR_SETUP_GUIDE.md](./CAPACITOR_SETUP_GUIDE.md) - Full detailed guide
- [SharedHooksReference.md](./SharedHooksReference.md) - Using shared hooks

---

**You now have a native Android app!** 📱🎉
