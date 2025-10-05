import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loafly.sourdough',
  appName: 'Loafly',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow cleartext (HTTP) traffic for development/localhost
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',  // Use app launcher icon for notifications
      iconColor: '#F59E0B',  // Loafly amber color
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
