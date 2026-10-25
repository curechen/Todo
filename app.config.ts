import type { ExpoConfig } from 'expo/config';

const EXTRA_PROGUARD_RULES = `
-keep class androidx.work.** { *; }
-keep class * extends androidx.work.ListenableWorker { *; }
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keep class androidx.room.** { *; }
-keep class androidx.startup.** { *; }
-dontwarn androidx.work.**
`;

const config: ExpoConfig = {
  name: '小陈待办',
  slug: 'xiaochen-todo',
  description: '小陈待办 - 本地待办事项 App',
  version: '0.5.1',
  orientation: 'portrait',
  scheme: 'todoapp',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.curechen.todo',
  },
  android: {
    package: 'com.curechen.todo',
    versionCode: 7,
    permissions: [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ],
    blockedPermissions: ['android.permission.SYSTEM_ALERT_WINDOW'],
    adaptiveIcon: {
      backgroundColor: '#1E78F5',
      foregroundImage: './assets/images/adaptive-icon-foreground.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'server',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    '@react-native-community/datetimepicker',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F6F7F9',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 31,
          extraProguardRules: EXTRA_PROGUARD_RULES,
        },
      },
    ],
    './plugins/withNotificationIcon',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
