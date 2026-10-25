import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';

interface UnsavedGuardOptions {
  title?: string;
  message?: string;
}

export function useUnsavedChangesGuard(
  isDirty: boolean,
  options: UnsavedGuardOptions = {}
) {
  const router = useRouter();
  const bypassRef = useRef(false);
  const title = options.title ?? '放弃修改？';
  const message = options.message ?? '当前修改尚未保存。';

  const showDiscardAlert = () => {
    Alert.alert(title, message, [
      { text: '继续编辑', style: 'cancel' },
      {
        text: '放弃',
        style: 'destructive',
        onPress: () => {
          bypassRef.current = true;
          router.back();
        },
      },
    ]);
  };

  const attemptBack = () => {
    if (bypassRef.current || !isDirty) {
      router.back();
      return;
    }
    showDiscardAlert();
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (bypassRef.current || !isDirty) return false;
      showDiscardAlert();
      return true;
    });

    return () => subscription.remove();
  }, [isDirty, message, title]);

  return {
    attemptBack,
    bypass: () => {
      bypassRef.current = true;
    },
  };
}
