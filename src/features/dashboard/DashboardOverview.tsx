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
  Sparkles,
  TrendingUp,
  Activity,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  PieChart,
  BarChart3,
  Layers,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
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
  const isTablet = width >= 768 && width < 1024;

  const { selectedDate, setSelectedDate } = useDateStore();
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
              <View style={styles.heroSparkle}>
                <Flame size={18} color="#4F46E5" />
              </View>
              <Text style={styles.heroPreTitle}>EXECUTIVE PERFORMANCE</Text>
            </View>
            <Text style={styles.heroTitle}>Command Center</Text>
            <Text style={styles.periodBadgeText}>Tracking: {periodLabel}</Text>
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
                style={[styles.timeframePill, active && styles.timeframePillActive]}
              >
                <Text
                  style={[
                    styles.timeframePillText,
                    active && styles.timeframePillTextActive,
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
          <View style={styles.customPresetsCard}>
            <View style={styles.customPresetHeader}>
              <SlidersHorizontal size={14} color="#71717A" />
              <Text style={styles.customPresetTitle}>Select Custom Preset</Text>
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
                      isSelected && styles.presetChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextActive,
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
      <View style={styles.heroScoreCard}>
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
            <View style={styles.statusPill}>
              <CheckCircle2 size={14} color="#059669" />
              <Text style={styles.statusPillText}>
                {overallScore >= 80
                  ? 'Optimal Execution • Consistent Pace'
                  : overallScore >= 50
                  ? 'Steady Progress • Balanced Flow'
                  : 'Action Needed • Low Velocity'}
              </Text>
            </View>

            <View style={styles.insightStatsList}>
              <View style={styles.insightStatRow}>
                <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightLabel}>Habits Consistency</Text>
                  <Text style={styles.insightValue}>
                    {routineAnalytics.totalCompleted} of {routineAnalytics.totalScheduled} completed ({routineAnalytics.percentage}%)
                  </Text>
                </View>
              </View>

              <View style={styles.insightStatRow}>
                <View style={[styles.statDot, { backgroundColor: '#4F46E5' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightLabel}>Task Velocity</Text>
                  <Text style={styles.insightValue}>
                    {taskAnalytics.completed} of {taskAnalytics.total} completed ({taskAnalytics.percentage}%)
                  </Text>
                </View>
              </View>

              <View style={styles.insightStatRow}>
                <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightLabel}>Financial Spend</Text>
                  <Text style={styles.insightValue}>
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
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.cardIconBadge, { backgroundColor: '#ECFDF5' }]}>
                <Clock size={16} color="#059669" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Habits Activity</Text>
                <Text style={styles.cardSub}>
                  {routineAnalytics.percentage}% consistency • {daysCount} day interval
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/routine' as any)}
              style={styles.cardActionBtn}
            >
              <Text style={styles.cardActionText}>Schedule</Text>
              <ArrowRight size={13} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          <View style={styles.chartWrapper}>
            <ActivityBarChart
              data={routineAnalytics.barData}
              primaryColor="#10B981"
              secondaryColor="#ECFDF5"
              unitLabel="Completion Velocity"
              onSelectBar={(point) => {
                if (point.subLabel) {
                  // user tapped a day
                }
              }}
            />
          </View>
        </View>

        {/* Task Priority Donut Chart */}
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.cardIconBadge, { backgroundColor: '#EEF2FF' }]}>
                <CheckSquare size={16} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Task Priority Share</Text>
                <Text style={styles.cardSub}>
                  {taskAnalytics.total} total • {taskAnalytics.pending} pending
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/tasks' as any)}
              style={styles.cardActionBtn}
            >
              <Text style={styles.cardActionText}>Board</Text>
              <ArrowRight size={13} color="#4F46E5" />
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
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.cardIconBadge, { backgroundColor: '#FFF1F2' }]}>
                <Receipt size={16} color="#F43F5E" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Spending Composition</Text>
                <Text style={styles.cardSub}>
                  {formatCurrency(expenseAnalytics.total, settings.currency)} • {expenseAnalytics.count} records
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/expenses' as any)}
              style={styles.cardActionBtn}
            >
              <Text style={styles.cardActionText}>Ledger</Text>
              <ArrowRight size={13} color="#4F46E5" />
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
          <Text style={styles.sectionHeading}>Application Showcase</Text>
          <Text style={styles.sectionSubheading}>
            Instant overview • Tap to open dedicated workspaces
          </Text>
        </View>

        <View style={[styles.showcaseGrid, isDesktop ? styles.showcaseGridDesktop : null]}>
          <ShowcaseCard
            title="Daily Habit Routines"
            subtitle="Recurring daily rhythm & habit consistency"
            tag="Habits"
            tagColor="#059669"
            tagBgColor="#ECFDF5"
            icon={<Clock size={20} color="#059669" />}
            iconBgColor="#ECFDF5"
            metricValue={`${routineAnalytics.totalCompleted} / ${routineAnalytics.totalScheduled}`}
            metricLabel="Habits completed this period"
            ctaText="Open Routine"
            onPress={() => router.push('/routine' as any)}
          />

          <ShowcaseCard
            title="Task Workspace"
            subtitle="Task backlog, priorities, categories & bulk tools"
            tag="Tasks"
            tagColor="#4F46E5"
            tagBgColor="#EEF2FF"
            icon={<CheckSquare size={20} color="#4F46E5" />}
            iconBgColor="#EEF2FF"
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
            tagBgColor="#FFF1F2"
            icon={<Receipt size={20} color="#F43F5E" />}
            iconBgColor="#FFF1F2"
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
            tagBgColor="#F5F3FF"
            icon={<Calendar size={20} color="#7C3AED" />}
            iconBgColor="#F5F3FF"
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
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#18181B',
    letterSpacing: -0.6,
  },
  periodBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    cursor: 'pointer' as any,
  },
  timeframePillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  timeframePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  timeframePillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  customPresetsCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
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
    color: '#71717A',
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F4F4F5',
    cursor: 'pointer' as any,
  },
  presetChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#52525B',
  },
  presetChipTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  heroScoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 24,
    shadowColor: '#18181B',
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
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  insightStatsList: {
    gap: 12,
  },
  insightStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F4F4F5',
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
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    padding: 18,
    shadowColor: '#18181B',
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
    color: '#18181B',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
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
    color: '#18181B',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#71717A',
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
