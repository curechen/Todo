import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
} from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { TodoRow } from '@/components/todo/TodoRow';
import { listCalendarTodos, type TodoListItem } from '@/db';
import { useDataVersion } from '@/stores/data-version';
import { colors, radius, spacing, typography } from '@/theme';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const WEEKDAY_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const DAY_KEY = 'yyyy-MM-dd';

function renderMonthWeeks(month: Date): Array<Array<Date | null>> {
  const firstDay = startOfMonth(month);
  const daysInMonth = endOfMonth(month).getDate();
  const leading = (getDay(firstDay) + 6) % 7;
  const cells: Array<Date | null> = [];

  for (let index = 0; index < leading; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(addDays(firstDay, day - 1));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<Date | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export default function CalendarScreen() {
  const router = useRouter();
  const version = useDataVersion((state) => state.version);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [todos, setTodos] = useState<TodoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    listCalendarTodos(month.getTime(), addMonths(month, 1).getTime())
      .then((rows) => {
        if (mounted) setTodos(rows);
      })
      .catch(() => {
        if (mounted) setTodos([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [month, version]);

  const todosByDay = useMemo(() => {
    const map = new Map<string, TodoListItem[]>();

    for (const todo of todos) {
      if (todo.dueAt == null) continue;
      const key = format(new Date(todo.dueAt), DAY_KEY);
      const existing = map.get(key);

      if (existing) {
        existing.push(todo);
      } else {
        map.set(key, [todo]);
      }
    }

    return map;
  }, [todos]);

  const weeks = useMemo(() => renderMonthWeeks(month), [month]);

  const selectedKey = selectedDate ? format(selectedDate, DAY_KEY) : null;
  const selectedTodos = selectedKey ? todosByDay.get(selectedKey) ?? [] : [];

  const openTodo = (todo: TodoListItem) => {
    setSelectedDate(null);
    router.push({ pathname: '/todo/[id]', params: { id: todo.id, from: 'pending' } });
  };

  return (
    <Screen>
      <PageHeader onBack={() => router.back()} title="日历" />

      <View style={styles.monthNav}>
        <Pressable
          accessibilityLabel="上个月"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setMonth((current) => addMonths(current, -1))}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <ChevronLeft color={colors.text} size={22} strokeWidth={2} />
        </Pressable>

        <Text style={styles.monthTitle}>{format(month, 'yyyy年M月')}</Text>

        <Pressable
          accessibilityLabel="下个月"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setMonth((current) => addMonths(current, 1))}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
          <ChevronRight color={colors.text} size={22} strokeWidth={2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setMonth(startOfMonth(new Date()))}
          style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}>
          <Text style={styles.todayText}>今天</Text>
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return <View key={`blank-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
              }

              const key = format(day, DAY_KEY);
              const dayTodos = todosByDay.get(key) ?? [];
              const overdue = dayTodos.some(
                (todo) => todo.dueAt != null && todo.dueAt < Date.now()
              );
              const selected = selectedDate != null && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <Pressable
                  accessibilityLabel={`${format(day, 'M月d日')}，${dayTodos.length} 条待完成`}
                  accessibilityRole="button"
                  key={key}
                  onPress={() => setSelectedDate(day)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.dayNumberWrap, today && styles.todayCircle]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        today && styles.todayNumber,
                        overdue && styles.overdueDayNumber,
                      ]}>
                      {day.getDate()}
                    </Text>
                  </View>

                  {dayTodos.length > 0 ? (
                    <View
                      style={[
                        styles.countBadge,
                        overdue && styles.countBadgeOverdue,
                      ]}>
                      <Text style={styles.countText}>{dayTodos.length}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}

      <Sheet
        onClose={() => setSelectedDate(null)}
        title={
          selectedDate
            ? `${format(selectedDate, 'M月d日')} ${WEEKDAY_FULL[getDay(selectedDate)]}`
            : '当天待完成'
        }
        visible={selectedDate != null}>
        {selectedTodos.length === 0 ? (
          <Text style={styles.emptyText}>当天没有待完成的待办</Text>
        ) : (
          <FlatList
            contentContainerStyle={styles.sheetContent}
            data={selectedTodos}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TodoRow onPress={() => openTodo(item)} todo={item} />
            )}
            showsVerticalScrollIndicator={false}
            style={styles.sheetList}
          />
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.xs,
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  todayText: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    minHeight: 58,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    margin: 2,
    borderRadius: radius.md,
  },
  dayCellSelected: {
    backgroundColor: colors.primarySoft,
  },
  dayNumberWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayNumber: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.text,
  },
  todayNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  overdueDayNumber: {
    color: colors.danger,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeOverdue: {
    backgroundColor: colors.danger,
  },
  countText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    color: colors.white,
  },
  loading: {
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  sheetList: {
    maxHeight: 420,
  },
  sheetContent: {
    paddingBottom: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
});
