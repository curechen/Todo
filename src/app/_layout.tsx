import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SnackbarHost } from '@/components/ui/SnackbarHost';
import { bootstrapDatabase } from '@/db';
import { NotificationBootstrap } from '@/notifications/NotificationBootstrap';
import { useSettingsStore } from '@/stores/settings';
import { colors, radius, spacing, typography } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen may already be hidden during Fast Refresh.
});

type BootstrapStatus = 'loading' | 'ready' | 'error';

export default function RootLayout() {
  const [status, setStatus] = useState<BootstrapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    bootstrapDatabase()
      .then(async () => {
        await useSettingsStore.getState().load();
        if (mounted) setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus('error');
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide errors after Fast Refresh.
      });
    }
  }, [status]);

  const handleRetry = () => {
    setErrorMessage(null);
    setStatus('loading');

    bootstrapDatabase()
      .then(async () => {
        await useSettingsStore.getState().load();
        setStatus('ready');
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus('error');
      });
  };

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>初始化失败</Text>
          <Text style={styles.errorMessage}>{errorMessage ?? '数据库初始化失败'}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}>
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <NotificationBootstrap />
        <SnackbarHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  errorCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.heading,
    color: colors.text,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryPressed: {
    opacity: 0.9,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
