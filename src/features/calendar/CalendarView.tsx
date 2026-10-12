import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
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
  isSameDay,
} from 'date-fns';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
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
      <View style={styles.card}>
        <View style={styles.monthHeader}>
          <View style={styles.monthTitleGroup}>
            <CalendarIcon size={20} color="#4F46E5" />
            <Text style={styles.monthTitle}>
              {format(currentMonthDate, 'MMMM yyyy')}
            </Text>
          </View>
          <View style={styles.monthControls}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
              <ChevronLeft size={18} color="#52525B" />
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
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
              <ChevronRight size={18} color="#52525B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Days of week */}
        <View style={styles.weekRow}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekHeaderCell}>
              <Text style={styles.weekHeaderText}>{day}</Text>
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
                  !isCurrentMonth && styles.dayCellOutside,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    !isCurrentMonth && styles.dayNumberOutside,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
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
                    <View style={[styles.dot, { backgroundColor: '#4F46E5' }]} />
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
      <View style={styles.selectedDayCard}>
        <View style={styles.selectedDayHeader}>
          <View>
            <Text style={styles.selectedDayTitle}>
              {formatDisplayDate(selectedDate)}
            </Text>
            <Text style={styles.selectedDaySub}>Selected Date Overview</Text>
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
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#ECFDF5' }]}>
              <Clock size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.metricLabel}>Routine Habits</Text>
              <Text style={styles.metricVal}>
                {selectedProgress.completed} / {selectedProgress.total} ({selectedProgress.percentage}%)
              </Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#EEF2FF' }]}>
              <CheckSquare size={16} color="#4F46E5" />
            </View>
            <View>
              <Text style={styles.metricLabel}>Tasks Completed</Text>
              <Text style={styles.metricVal}>
                {selectedTasks.completed} / {selectedTasks.total} ({selectedTasks.pending} pending)
              </Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#FFF1F2' }]}>
              <Receipt size={16} color="#F43F5E" />
            </View>
            <View>
              <Text style={styles.metricLabel}>Daily Expenses</Text>
              <Text style={styles.metricVal}>
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 20,
    shadowColor: '#18181B',
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
    color: '#18181B',
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
    backgroundColor: '#F4F4F5',
    cursor: 'pointer' as any,
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
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
    color: '#71717A',
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
    borderColor: '#F4F4F5',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  dayCellOutside: {
    backgroundColor: '#FAFAFA',
  },
  dayCellSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderRadius: 10,
  },
  dayCellToday: {
    borderColor: '#C7D2FE',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  dayNumberOutside: {
    color: '#D4D4D8',
  },
  dayNumberSelected: {
    color: '#4338CA',
    fontWeight: '800',
  },
  dayNumberToday: {
    color: '#4F46E5',
    fontWeight: '700',
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
    color: '#BE123C',
    marginTop: 4,
    textAlign: 'center',
  },
  selectedDayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 20,
    gap: 16,
    shadowColor: '#18181B',
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
    color: '#18181B',
    letterSpacing: -0.3,
  },
  selectedDaySub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
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
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F4F4F5',
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
    color: '#71717A',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
    marginTop: 2,
  },
});
