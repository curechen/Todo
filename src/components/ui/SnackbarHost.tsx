import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDataVersion } from '@/stores/data-version';
import { useToastStore } from '@/stores/toast';
import { useUndoStore } from '@/stores/undo';
import { colors, radius, spacing, typography } from '@/theme';

export function SnackbarHost() {
  const insets = useSafeAreaInsets();
  const undo = useUndoStore();
  const toast = useToastStore();
  const bump = useDataVersion((state) => state.bump);

  const undoAction = undo.action;
  const toastAction = toast.toast;

  if (!undoAction && !toastAction) return null;

  const isUndo = undoAction != null;
  const message = isUndo ? undoAction.message : toastAction?.message;
  const actionLabel = isUndo ? '撤销' : toastAction?.actionLabel;

  const handleUndo = async () => {
    if (!undoAction) return;
    const restore = undoAction.restore;
    undo.dismiss();

    try {
      await restore();
      bump();
    } catch {
      toast.show({ message: '撤销失败，请重试' });
    }
  };

  const handleAction = () => {
    if (isUndo) {
      void handleUndo();
      return;
    }

    const action = toastAction?.onAction;
    toast.dismiss();
    action?.();
  };

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 84 }]}>
      <View style={styles.bar}>
        <Text numberOfLines={2} style={styles.message}>
          {message}
        </Text>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#202532',
  },
  message: {
    ...typography.caption,
    color: colors.white,
    flex: 1,
  },
  action: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionText: {
    ...typography.captionStrong,
    color: '#9DBDFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
