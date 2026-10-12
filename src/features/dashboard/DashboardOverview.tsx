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
  Clock,
  CheckSquare,
  Receipt,
  Calendar,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import {
  useDashboardAnalytics,
  TimeframeMode,
  CustomDateRange,
} from './useDashboardAnalytics';
import { MultiRingGauge } from './components/MultiRingGauge';
import { DonutChart } from './components/DonutChart';
import { ActivityBarChart } from './components/ActivityBarChart';
import { ShowcaseCard } from './components/ShowcaseCard';
import { formatCurrency } from '../../utils/currency';
import { offsetDateKey, getTodayKey } from '../../utils/date';

export const DashboardOverview: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { theme, isDark } = useTheme();
  const { selectedDate } = useDateStore();

  const { settings } = useSettingsStore();

  const [timeframe, setTimeframe] = useState<TimeframeMode>('WEEK');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: offsetDateKey(selectedDate, -6),
    endDate: selectedDate,
  });

  const {
    periodLabel,
    daysCount,
    routineAnalytics,
    taskAnalytics,
    expenseAnalytics,
    overallScore,
    multiRings,
  } = useDashboardAnalytics(timeframe, timeframe === 'CUSTOM' ? customRange : undefined);

  const timeframes: { label: string; mode: TimeframeMode }[] = [
    { label: 'Today', mode: 'TODAY' },
    { label: 'This Week', mode: 'WEEK' },
    { label: 'This Month', mode: 'MONTH' },
    { label: 'This Year', mode: 'YEAR' },
    { label: 'Custom Range', mode: 'CUSTOM' },
  ];

  const customPresets = [
    { label: 'Last 7 Days', start: offsetDateKey(getTodayKey(), -6), end: getTodayKey() },
    { label: 'Last 14 Days', start: offsetDateKey(getTodayKey(), -13), end: getTodayKey() },
    { label: 'Last 30 Days', start: offsetDateKey(getTodayKey(), -29), end: getTodayKey() },
    { label: 'Ref Oct 6-8', start: '2026-10-06', end: '2026-10-08' },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header & Timeframe Switcher */}
      <View style={styles.headerSection}>
        <View style={styles.headerTitleRow}>
          <View>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.heroSparkle,
                  { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : '#EEF2FF' },
                ]}
              >
                <Flame size={18} color={theme.primary} />
              </View>
              <Text style={[styles.heroPreTitle, { color: theme.primary }]}>EXECUTIVE PERFORMANCE</Text>
            </View>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>Command Center</Text>
            <Text style={[styles.periodBadgeText, { color: theme.textSecondary }]}>
              Tracking: {periodLabel}
            </Text>
          </View>
        </View>

        {/* Time Horizon Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeframePillsRow}
        >
          {timeframes.map((tf) => {
            const active = timeframe === tf.mode;
            return (
              <TouchableOpacity
                key={tf.mode}
                activeOpacity={0.8}
                onPress={() => setTimeframe(tf.mode)}
                style={[
                  styles.timeframePill,
                  {
                    backgroundColor: active
                      ? (isDark ? '#FAFAFA' : '#18181B')
                      : theme.surface,
                    borderColor: active
                      ? (isDark ? '#FAFAFA' : '#18181B')
                      : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timeframePillText,
                    {
                      color: active
                        ? (isDark ? '#09090B' : '#FFFFFF')
                        : theme.textSecondary,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Custom Range Presets Bar */}
        {timeframe === 'CUSTOM' && (
          <View
            style={[
              styles.customPresetsCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.customPresetHeader}>
              <SlidersHorizontal size={14} color={theme.textMuted} />
              <Text style={[styles.customPresetTitle, { color: theme.textSecondary }]}>
                Select Custom Preset
              </Text>
            </View>
            <View style={styles.customPresetsRow}>
              {customPresets.map((preset) => {
                const isSelected =
                  customRange.startDate === preset.start &&
                  customRange.endDate === preset.end;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    activeOpacity={0.7}
                    onPress={() =>
                      setCustomRange({ startDate: preset.start, endDate: preset.end })
                    }
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF')
                          : theme.surfaceSubtle,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        {
                          color: isSelected ? theme.primary : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* 2. Hero Unified Score & Multi-Ring Gauge */}
      <View
        style={[
          styles.heroScoreCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={[styles.heroContent, isDesktop ? styles.heroContentDesktop : null]}>
          {/* Concentric Multi-Ring */}
          <View style={styles.gaugeWrapper}>
            <MultiRingGauge
              rings={multiRings}
              overallScore={overallScore}
              scoreLabel="Productivity"
              size={190}
              strokeWidth={13}
            />
          </View>

          {/* Quick Insights List */}
          <View style={styles.heroInsightsColumn}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                },
              ]}
            >
              <CheckCircle2 size={14} color="#059669" />
              <Text
                style={[
                  styles.statusPillText,
                  { color: isDark ? '#34D399' : '#059669' },
                ]}
              >
                {overallScore >= 80
                  ? 'Optimal Execution • Consistent Pace'
                  : overallScore >= 50
                  ? 'Steady Progress • Balanced Flow'
                  : 'Action Needed • Low Velocity'}
              </Text>
            </View>

            <View style={styles.insightStatsList}>
              <View
                style={[
                  styles.insightStatRow,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, { color: theme.textMuted }]}>Habits Consistency</Text>
                  <Text style={[styles.insightValue, { color: theme.textPrimary }]}>
                    {routineAnalytics.totalCompleted} of {routineAnalytics.totalScheduled} completed ({routineAnalytics.percentage}%)
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.insightStatRow,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.statDot, { backgroundColor: '#4F46E5' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, { color: theme.textMuted }]}>Task Velocity</Text>
                  <Text style={[styles.insightValue, { color: theme.textPrimary }]}>
                    {taskAnalytics.completed} of {taskAnalytics.total} completed ({taskAnalytics.percentage}%)
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.insightStatRow,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightLabel, { color: theme.textMuted }]}>Financial Spend</Text>
                  <Text style={[styles.insightValue, { color: theme.textPrimary }]}>
                    {formatCurrency(expenseAnalytics.total, settings.currency)} • {expenseAnalytics.needPct}% Needs
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Deep Analytics Visualizations Grid */}
      <View style={[styles.analyticsGrid, isDesktop ? styles.analyticsGridDesktop : null]}>
        {/* Habit Consistency Bar Chart */}
        <View
          style={[
            styles.analyticsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View
                style={[
                  styles.cardIconBadge,
                  {
                    backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
                  },
                ]}
              >
                <Clock size={16} color="#059669" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Habits Activity</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  {routineAnalytics.percentage}% consistency • {daysCount} day interval
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/routine' as any)}
              style={[
                styles.cardActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                },
              ]}
            >
              <Text style={[styles.cardActionText, { color: theme.primary }]}>Schedule</Text>
              <ArrowRight size={13} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartWrapper}>
            <ActivityBarChart
              data={routineAnalytics.barData}
              primaryColor="#10B981"
              secondaryColor={isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5'}
              unitLabel="Completion Velocity"
            />
          </View>
        </View>

        {/* Task Priority Donut Chart */}
        <View
          style={[
            styles.analyticsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View
                style={[
                  styles.cardIconBadge,
                  {
                    backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                  },
                ]}
              >
                <CheckSquare size={16} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Task Priority Share</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  {taskAnalytics.total} total • {taskAnalytics.pending} pending
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/tasks' as any)}
              style={[
                styles.cardActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                },
              ]}
            >
              <Text style={[styles.cardActionText, { color: theme.primary }]}>Board</Text>
              <ArrowRight size={13} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartWrapper}>
            <DonutChart
              segments={taskAnalytics.prioritySegments}
              size={170}
              strokeWidth={18}
              centerTitle={`${taskAnalytics.percentage}%`}
              centerSubtitle="Complete"
            />
          </View>
        </View>

        {/* Expense Needs vs Wants Donut */}
        <View
          style={[
            styles.analyticsCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View
                style={[
                  styles.cardIconBadge,
                  {
                    backgroundColor: isDark ? 'rgba(244,63,94,0.15)' : '#FFF1F2',
                  },
                ]}
              >
                <Receipt size={16} color="#F43F5E" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Spending Composition</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  {formatCurrency(expenseAnalytics.total, settings.currency)} • {expenseAnalytics.count} records
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/expenses' as any)}
              style={[
                styles.cardActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF',
                },
              ]}
            >
              <Text style={[styles.cardActionText, { color: theme.primary }]}>Ledger</Text>
              <ArrowRight size={13} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartWrapper}>
            <DonutChart
              segments={expenseAnalytics.typeSegments}
              size={170}
              strokeWidth={18}
              centerTitle={formatCurrency(expenseAnalytics.total, settings.currency)}
              centerSubtitle="Total Burn"
            />
          </View>
        </View>
      </View>

      {/* 4. Feature Showcase & Smart Deep-Links Hub */}
      <View style={styles.showcaseSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Application Showcase</Text>
          <Text style={[styles.sectionSubheading, { color: theme.textSecondary }]}>
            Instant overview • Tap to open dedicated workspaces
          </Text>
        </View>

        <View style={[styles.showcaseGrid, isDesktop ? styles.showcaseGridDesktop : null]}>
          <ShowcaseCard
            title="Daily Habit Routines"
            subtitle="Recurring daily rhythm & habit consistency"
            tag="Habits"
            tagColor="#059669"
            tagBgColor={isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5'}
            icon={<Clock size={20} color="#059669" />}
            iconBgColor={isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5'}
            metricValue={`${routineAnalytics.totalCompleted} / ${routineAnalytics.totalScheduled}`}
            metricLabel="Habits completed this period"
            ctaText="Open Routine"
            onPress={() => router.push('/routine' as any)}
          />

          <ShowcaseCard
            title="Task Workspace"
            subtitle="Task backlog, priorities, categories & bulk tools"
            tag="Tasks"
            tagColor={theme.primary}
            tagBgColor={isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF'}
            icon={<CheckSquare size={20} color={theme.primary} />}
            iconBgColor={isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF'}
            metricValue={`${taskAnalytics.completed} Done`}
            metricLabel={`${taskAnalytics.pending} pending tasks remaining`}
            ctaText="Open Board"
            onPress={() => router.push('/tasks' as any)}
          />

          <ShowcaseCard
            title="Expense Ledger"
            subtitle="Financial ledger, Needs vs Wants, category split"
            tag="Finance"
            tagColor="#BE123C"
            tagBgColor={isDark ? 'rgba(244,63,94,0.15)' : '#FFF1F2'}
            icon={<Receipt size={20} color="#F43F5E" />}
            iconBgColor={isDark ? 'rgba(244,63,94,0.15)' : '#FFF1F2'}
            metricValue={formatCurrency(expenseAnalytics.total, settings.currency)}
            metricLabel={`Avg: ${formatCurrency(expenseAnalytics.dailyBurnAverage, settings.currency)} / day`}
            ctaText="Open Ledger"
            onPress={() => router.push('/expenses' as any)}
          />

          <ShowcaseCard
            title="Calendar & History"
            subtitle="Month grid, past records, and trend navigation"
            tag="Timeline"
            tagColor="#7C3AED"
            tagBgColor={isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF'}
            icon={<Calendar size={20} color="#7C3AED" />}
            iconBgColor={isDark ? 'rgba(124,58,237,0.15)' : '#F5F3FF'}
            metricValue={`${daysCount} Days`}
            metricLabel="Explored in current horizon"
            ctaText="View Calendar"
            onPress={() => router.push('/calendar' as any)}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  headerSection: {
    gap: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroSparkle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  periodBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  timeframePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  timeframePill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  timeframePillText: {
    fontSize: 12,
  },
  customPresetsCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  customPresetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customPresetTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  customPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  presetChipText: {
    fontSize: 11,
  },
  heroScoreCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  heroContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  heroContentDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInsightsColumn: {
    flex: 1,
    maxWidth: 500,
    width: '100%',
    gap: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightStatsList: {
    gap: 12,
  },
  insightStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  analyticsGrid: {
    flexDirection: 'column',
    gap: 18,
  },
  analyticsGridDesktop: {
    flexDirection: 'row',
  },
  analyticsCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  showcaseSection: {
    marginTop: 8,
    gap: 14,
  },
  sectionTitleRow: {
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 13,
    marginTop: 2,
  },
  showcaseGrid: {
    flexDirection: 'column',
    gap: 14,
  },
  showcaseGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
