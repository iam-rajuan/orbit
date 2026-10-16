import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  Receipt,
  ArrowRight,
} from 'lucide-react-native';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import {
  formatDateKey,
  parseDateKey,
  formatDisplayDate,
  getTodayKey,
} from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { AppButton } from '../../components/ui/AppButton';

export const CalendarView: React.FC = () => {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { selectedDate, setSelectedDate, goToToday } = useDateStore();
  const { getRoutineProgress } = useRoutineStore();
  const { tasks, getTaskProgress } = useTaskStore();
  const { expenses, getDailySummary } = useExpenseStore();
  const { settings } = useSettingsStore();

  const [currentMonthDate, setCurrentMonthDate] = useState(() =>
    parseDateKey(selectedDate)
  );

  const prevMonth = () => setCurrentMonthDate(subMonths(currentMonthDate, 1));
  const nextMonth = () => setCurrentMonthDate(addMonths(currentMonthDate, 1));

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const allCalendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Data for the currently selected date
  const selectedProgress = getRoutineProgress(selectedDate);
  const selectedTasks = getTaskProgress(selectedDate);
  const selectedExpenses = getDailySummary(selectedDate);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Month Navigator Header Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.monthHeader}>
          <View style={styles.monthTitleGroup}>
            <CalendarIcon size={15} color={theme.primary} strokeWidth={2.2} />
            <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
              {format(currentMonthDate, 'MMMM yyyy')}
            </Text>
          </View>
          <View style={styles.monthControls}>
            <TouchableOpacity
              onPress={prevMonth}
              style={[
                styles.monthArrow,
                { backgroundColor: theme.surfaceSubtle },
              ]}
            >
              <ChevronLeft size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <AppButton
              title="Today"
              size="sm"
              variant="outline"
              onPress={() => {
                goToToday();
                setCurrentMonthDate(new Date());
              }}
            />
            <TouchableOpacity
              onPress={nextMonth}
              style={[
                styles.monthArrow,
                { backgroundColor: theme.surfaceSubtle },
              ]}
            >
              <ChevronRight size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Days of week */}
        <View style={[styles.weekRow, { borderBottomColor: theme.border }]}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekHeaderCell}>
              <Text style={[styles.weekHeaderText, { color: theme.textMuted }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.grid}>
          {allCalendarDays.map((day) => {
            const dateKey = formatDateKey(day);
            const isSelected = dateKey === selectedDate;
            const isCurrentMonth = isSameMonth(day, currentMonthDate);
            const isToday = dateKey === getTodayKey();

            // Activity indicators for this day
            const dayTaskCount = tasks.filter((t) => t.date === dateKey).length;
            const dayExp = expenses.filter((e) => e.date === dateKey);
            const dayExpTotal = dayExp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const routineData = getRoutineProgress(dateKey);

            return (
              <TouchableOpacity
                key={dateKey}
                activeOpacity={0.7}
                onPress={() => setSelectedDate(dateKey)}
                style={[
                  styles.dayCell,
                  { borderColor: theme.border },
                  !isCurrentMonth && {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
                  },
                  isSelected && {
                    backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF',
                    borderColor: theme.primary,
                    borderRadius: 10,
                  },
                  isToday && !isSelected && {
                    borderColor: theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    { color: theme.textPrimary },
                    !isCurrentMonth && { color: theme.textMuted },
                    isSelected && { color: theme.primary, fontWeight: '800' },
                    isToday && !isSelected && { color: theme.primary, fontWeight: '700' },
                  ]}
                >
                  {format(day, 'd')}
                </Text>

                {/* Day Activity Pills */}
                <View style={styles.dotRow}>
                  {routineData.completed > 0 && (
                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  )}
                  {dayTaskCount > 0 && (
                    <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                  )}
                  {dayExpTotal > 0 && (
                    <View style={[styles.dot, { backgroundColor: '#F43F5E' }]} />
                  )}
                </View>

                {dayExpTotal > 0 && isCurrentMonth && (
                  <Text numberOfLines={1} style={styles.miniExpenseText}>
                    {formatCurrency(dayExpTotal, settings.currency)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Day Quick Summary Card */}
      <View
        style={[
          styles.selectedDayCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.selectedDayHeader}>
          <View>
            <Text style={[styles.selectedDayTitle, { color: theme.textPrimary }]}>
              {formatDisplayDate(selectedDate)}
            </Text>
            <Text style={[styles.selectedDaySub, { color: theme.textSecondary }]}>Selected Date Overview</Text>
          </View>
          <AppButton
            title="Open Day Dashboard"
            variant="primary"
            size="sm"
            icon={<ArrowRight size={15} color="#ffffff" />}
            iconPosition="right"
            onPress={() => router.push('/dashboard' as any)}
          />
        </View>

        <View style={styles.selectedMetricsRow}>
          <View
            style={[
              styles.metricItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' },
              ]}
            >
              <Clock size={16} color="#059669" />
            </View>
            <View>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Routine Habits</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
                {selectedProgress.completed} / {selectedProgress.total} ({selectedProgress.percentage}%)
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.metricItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' },
              ]}
            >
              <CheckSquare size={16} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Tasks Completed</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
                {selectedTasks.completed} / {selectedTasks.total} ({selectedTasks.pending} pending)
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.metricItem,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.metricIcon,
                { backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : '#FFF1F2' },
              ]}
            >
              <Receipt size={16} color="#F43F5E" />
            </View>
            <View>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Daily Expenses</Text>
              <Text style={[styles.metricVal, { color: theme.textPrimary }]}>
                {formatCurrency(selectedExpenses.total, settings.currency)} ({selectedExpenses.count} items)
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthArrow: {
    padding: 6,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 8,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    minHeight: 72,
    padding: 4,
    borderWidth: 1,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  miniExpenseText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F43F5E',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedDayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  selectedDaySub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
