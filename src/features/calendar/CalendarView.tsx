import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
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

  const formatCompactCurrency = (amount: number, symbol: string) => {
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      const val = amount / 1000;
      return `${symbol}${val >= 10 ? val.toFixed(0) : val.toFixed(1)}k`;
    }
    return `${symbol}${Math.round(amount)}`;
  };

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
                    {formatCompactCurrency(dayExpTotal, settings.currency)}
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
            backgroundColor: isDark ? 'rgba(24, 24, 28, 0.76)' : 'rgba(255, 255, 255, 0.88)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: theme.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.shadowOpacity,
            shadowRadius: 14,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(24px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(190%)',
                } as any)
              : {}),
          },
        ]}
      >
        <View style={styles.selectedDayHeader}>
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.calendarBadge,
                { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF' },
              ]}
            >
              <CalendarIcon size={16} color={theme.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[styles.selectedDayTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {formatDisplayDate(selectedDate)}
              </Text>
              <Text style={[styles.selectedDaySub, { color: theme.textSecondary }]} numberOfLines={1}>
                Selected Date Overview
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/dashboard' as any)}
            style={[styles.openDashboardBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.openDashboardBtnText}>Open Day</Text>
            <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        {/* 2-Column Split: Habits & Tasks Progress Tiles */}
        <View style={styles.splitCardsRow}>
          {/* Habits Tile */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/routine' as any)}
            style={[
              styles.metricTile,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
              },
            ]}
          >
            <View style={styles.tileHeaderRow}>
              <View style={styles.tileHeaderLeft}>
                <Clock size={12} color="#10B981" strokeWidth={2.4} />
                <Text style={[styles.tileHeaderLabel, { color: isDark ? '#6EE7B7' : '#059669' }]}>
                  ROUTINES
                </Text>
              </View>
              <View style={[styles.percentBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                <Text style={[styles.percentBadgeText, { color: isDark ? '#34D399' : '#047857' }]}>
                  {selectedProgress.percentage}%
                </Text>
              </View>
            </View>

            <Text style={[styles.tileHeroValue, { color: isDark ? '#34D399' : '#059669' }]}>
              {selectedProgress.completed} / {selectedProgress.total}
            </Text>

            {/* Mini Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, selectedProgress.percentage))}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            </View>

            <Text style={[styles.tileSubText, { color: theme.textSecondary }]} numberOfLines={1}>
              {selectedProgress.percentage === 100
                ? 'All completed'
                : `${selectedProgress.total - selectedProgress.completed} remaining`}
            </Text>
          </TouchableOpacity>

          {/* Tasks Tile */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/tasks' as any)}
            style={[
              styles.metricTile,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.05)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
          >
            <View style={styles.tileHeaderRow}>
              <View style={styles.tileHeaderLeft}>
                <CheckSquare size={12} color={theme.primary} strokeWidth={2.4} />
                <Text style={[styles.tileHeaderLabel, { color: theme.primary }]}>
                  TASKS
                </Text>
              </View>
              <View style={[styles.percentBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                <Text style={[styles.percentBadgeText, { color: theme.primary }]}>
                  {selectedTasks.percentage}%
                </Text>
              </View>
            </View>

            <Text style={[styles.tileHeroValue, { color: theme.primary }]}>
              {selectedTasks.completed} / {selectedTasks.total}
            </Text>

            {/* Mini Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, selectedTasks.percentage))}%`,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>

            <Text style={[styles.tileSubText, { color: theme.textSecondary }]} numberOfLines={1}>
              {selectedTasks.pending} pending
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full-Width Expenses Tile */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/expenses' as any)}
          style={[
            styles.expenseCard,
            {
              backgroundColor: isDark ? 'rgba(244, 63, 94, 0.08)' : 'rgba(244, 63, 94, 0.05)',
              borderColor: isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.2)',
            },
          ]}
        >
          <View style={styles.expenseLeft}>
            <View
              style={[
                styles.expenseIconCircle,
                { backgroundColor: isDark ? 'rgba(244, 63, 94, 0.18)' : '#FFF1F2' },
              ]}
            >
              <Receipt size={16} color="#F43F5E" strokeWidth={2.4} />
            </View>
            <View style={styles.expenseTextCol}>
              <Text style={[styles.expenseLabel, { color: isDark ? '#FDA4AF' : '#E11D48' }]}>
                DAILY EXPENSES
              </Text>
              <Text style={[styles.expenseSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {selectedExpenses.count} items recorded • Need: {formatCurrency(selectedExpenses.needTotal, settings.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.expenseRight}>
            <Text style={[styles.expenseAmount, { color: isDark ? '#FDA4AF' : '#E11D48' }]}>
              {formatCurrency(selectedExpenses.total, settings.currency)}
            </Text>
            <ChevronRight size={14} color={isDark ? '#FDA4AF' : '#E11D48'} strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
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
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  calendarBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  selectedDayTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  selectedDaySub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  openDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9999,
    flexShrink: 0,
    cursor: 'pointer' as any,
  },
  openDashboardBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  splitCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    cursor: 'pointer' as any,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  tileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tileHeaderLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  percentBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  tileHeroValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  tileSubText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    cursor: 'pointer' as any,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  expenseIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTextCol: {
    flex: 1,
    minWidth: 0,
  },
  expenseLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  expenseSub: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});
