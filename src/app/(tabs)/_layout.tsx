import { Tabs } from 'expo-router';
import { CircleCheck, ListTodo, User } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => (
          <Pressable
            accessibilityLabel={props.accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={props.accessibilityState}
            onLongPress={props.onLongPress}
            onPress={props.onPress}
            style={[props.style, styles.tabButton]}
            testID={props.testID}>
            {props.children}
          </Pressable>
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '待完成',
          tabBarIcon: ({ color, size }) => (
            <ListTodo color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="completed"
        options={{
          title: '已完成',
          tabBarIcon: ({ color, size }) => (
            <CircleCheck color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
