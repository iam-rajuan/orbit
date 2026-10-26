import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  CheckSquare,
  Receipt,
  Calendar,
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  Target,
} from 'lucide-react-native';
import { useDateStore } from '../../stores/useDateStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTheme } from '../../theme/ThemeContext';
import {
  useDashboardAnalytics,
  TimeframeMode,
  CustomDateRange,
} from './useDashboardAnalytics';
import { ScoreOverview } from './components/ScoreOverview';
import { AreaChart } from './components/AreaChart';
import { Sparkline } from './components/Sparkline';
import { MetricCard } from './components/MetricCard';
import { formatCurrency } from '../../utils/currency';
import { offsetDateKey, getTodayKey } from '../../utils/date';

export const DashboardOverview: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

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
  } = useDashboardAnalytics(timeframe, timeframe === 'CUSTOM' ? customRange : undefined);

  const timeframes: { label: string; mode: TimeframeMode }[] = [
    { label: 'Today', mode: 'TODAY' },
    { label: 'Week', mode: 'WEEK' },
    { label: 'Month', mode: 'MONTH' },
    { label: 'Year', mode: 'YEAR' },
    { label: 'Custom', mode: 'CUSTOM' },
  ];

  const customPresets = [
    { label: 'Last 7 Days', start: offsetDateKey(getTodayKey(), -6), end: getTodayKey() },
    { label: 'Last 14 Days', start: offsetDateKey(getTodayKey(), -13), end: getTodayKey() },
    { label: 'Last 30 Days', start: offsetDateKey(getTodayKey(), -29), end: getTodayKey() },
  ];

  // Score feedback
  const scoreStatus =
    overallScore >= 80
      ? { text: 'Excellent Performance', color: isDark ? '#34D399' : '#059669' }
      : overallScore >= 50
        ? { text: 'Steady Progress', color: isDark ? '#FBBF24' : '#D97706' }
        : { text: 'Needs Attention', color: isDark ? '#FB7185' : '#E11D48' };


  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { maxWidth: isDesktop ? 1200 : undefined },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Section 1: Header ───────────────────────────── */}
      <View style={styles.headerSection}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>
            DASHBOARD
          </Text>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            Overview
          </Text>
        </View>

        {/* Timeframe Pills - Authentic Apple Segmented Control */}
        <View
          style={[
            styles.pillContainer,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(118, 118, 128, 0.12)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        >
          {timeframes.map((tf) => {
            const active = timeframe === tf.mode;
            return (
              <TouchableOpacity
                key={tf.mode}
                activeOpacity={0.8}
                onPress={() => setTimeframe(tf.mode)}
                style={[
                  styles.pill,
                  active && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.35 : 0.10,
                    shadowRadius: 6,
                    elevation: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: active ? theme.textPrimary : theme.textMuted,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Presets */}
        {timeframe === 'CUSTOM' && (
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
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Period label */}
        <Text style={[styles.periodLabel, { color: theme.textMuted }]}>
          {periodLabel}
        </Text>
      </View>

      {/* ── Section 2: Overall Score & Progress ────── */}
      <View
        style={[
          styles.scoreSection,
          {
            backgroundColor: isDark ? 'rgba(28, 28, 32, 0.75)' : 'rgba(255, 255, 255, 0.82)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.70)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.05,
            shadowRadius: 16,
            elevation: 2,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(25px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(25px) saturate(190%)',
                } as any)
              : {}),
          },
        ]}
      >
        <ScoreOverview
          score={overallScore}
          scoreLabel="Productivity"
          statusText={scoreStatus.text}
          statusColor={scoreStatus.color}
          metrics={[
            {
              label: 'Habits',
              value: routineAnalytics.percentage,
              color: '#10B981',
              displayValue: `${routineAnalytics.totalCompleted}/${routineAnalytics.totalScheduled} • ${routineAnalytics.percentage}%`,
            },
            {
              label: 'Tasks',
              value: taskAnalytics.percentage,
              color: theme.primary,
              displayValue: `${taskAnalytics.completed}/${taskAnalytics.total} • ${taskAnalytics.percentage}%`,
            },
            {
              label: 'Budget Health',
              value: expenseAnalytics.needPct,
              color: '#F59E0B',
              displayValue: `${formatCurrency(expenseAnalytics.total, settings.currency)} • ${expenseAnalytics.needPct}% needs`,
            },
          ]}
        />
      </View>

      {/* ── Section 3: Trend Charts ──────────────────── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Activity size={16} color={theme.textMuted} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Trends
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Performance across {daysCount} days
        </Text>
      </View>

      <View style={[styles.chartsGrid, (isDesktop || isTablet) && styles.chartsGridWide]}>
        {/* Habit Consistency Chart */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: isDark ? 'rgba(28, 28, 32, 0.75)' : 'rgba(255, 255, 255, 0.82)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.70)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.05,
              shadowRadius: 16,
              elevation: 2,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(25px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(25px) saturate(190%)',
                  } as any)
                : {}),
            },
            (isDesktop || isTablet) && styles.chartCardHalf,
          ]}
        >
          <View style={styles.chartCardHeader}>
            <View style={styles.chartCardTitleRow}>
              <View
                style={[
                  styles.chartIconBadge,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5' },
                ]}
              >
                <Clock size={14} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                  Habit Consistency
                </Text>
                <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
                  {routineAnalytics.totalCompleted} of {routineAnalytics.totalScheduled} completed
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/routine' as any)}
              style={[
                styles.chartCta,
                { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5' },
              ]}
            >
              <ArrowRight size={14} color="#10B981" />
            </TouchableOpacity>
          </View>

          <AreaChart
            data={routineAnalytics.trendData}
            height={140}
            color="#10B981"
            gradientOpacity={isDark ? 0.15 : 0.2}
            yAxisSuffix="%"
          />
        </View>

        {/* Task Completion Chart */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: isDark ? 'rgba(28, 28, 32, 0.75)' : 'rgba(255, 255, 255, 0.82)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.70)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.05,
              shadowRadius: 16,
              elevation: 2,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(25px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(25px) saturate(190%)',
                  } as any)
                : {}),
            },
            (isDesktop || isTablet) && styles.chartCardHalf,
          ]}
        >
          <View style={styles.chartCardHeader}>
            <View style={styles.chartCardTitleRow}>
              <View
                style={[
                  styles.chartIconBadge,
                  { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF' },
                ]}
              >
                <CheckSquare size={14} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                  Task Completion
                </Text>
                <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
                  {taskAnalytics.percentage}% completion rate
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/tasks' as any)}
              style={[
                styles.chartCta,
                { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF' },
              ]}
            >
              <ArrowRight size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <AreaChart
            data={taskAnalytics.trendData}
            height={140}
            color={theme.primary}
            gradientOpacity={isDark ? 0.15 : 0.2}
          />
        </View>

        {/* Spending Trend Chart (Full Width) */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: isDark ? 'rgba(28, 28, 32, 0.75)' : 'rgba(255, 255, 255, 0.82)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.70)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.35 : 0.05,
              shadowRadius: 16,
              elevation: 2,
              ...(Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(25px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(25px) saturate(190%)',
                  } as any)
                : {}),
            },
          ]}
        >
          <View style={styles.chartCardHeader}>
            <View style={styles.chartCardTitleRow}>
              <View
                style={[
                  styles.chartIconBadge,
                  { backgroundColor: isDark ? 'rgba(244,63,94,0.12)' : '#FFF1F2' },
                ]}
              >
                <Receipt size={14} color="#F43F5E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
                  Spending Trend
                </Text>
                <Text style={[styles.chartSubtitle, { color: theme.textMuted }]}>
                  {formatCurrency(expenseAnalytics.total, settings.currency)} total • {expenseAnalytics.needPct}% essentials
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/expenses' as any)}
              style={[
                styles.chartCta,
                { backgroundColor: isDark ? 'rgba(244,63,94,0.12)' : '#FFF1F2' },
              ]}
            >
              <ArrowRight size={14} color="#F43F5E" />
            </TouchableOpacity>
          </View>

          <AreaChart
            data={expenseAnalytics.trendData}
            height={140}
            color="#F43F5E"
            gradientOpacity={isDark ? 0.12 : 0.18}
          />

          {/* Needs vs Wants inline bar */}
          <View style={styles.needsWantsRow}>
            <View style={styles.needsWantsBar}>
              <View
                style={[
                  styles.needsFill,
                  {
                    width: `${expenseAnalytics.needPct}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
              <View
                style={[
                  styles.wantsFill,
                  {
                    width: `${expenseAnalytics.wantPct}%`,
                    backgroundColor: '#6366F1',
                  },
                ]}
              />
            </View>
            <View style={styles.needsWantsLabels}>
              <View style={styles.needsWantsLabelItem}>
                <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.needsWantsText, { color: theme.textSecondary }]}>
                  Needs {expenseAnalytics.needPct}%
                </Text>
              </View>
              <View style={styles.needsWantsLabelItem}>
                <View style={[styles.miniDot, { backgroundColor: '#6366F1' }]} />
                <Text style={[styles.needsWantsText, { color: theme.textSecondary }]}>
                  Wants {expenseAnalytics.wantPct}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Section 4: Quick Metrics with Sparklines ── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Zap size={16} color={theme.textMuted} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Key Metrics
          </Text>
        </View>
      </View>

      <View style={[styles.metricsGrid, (isDesktop || isTablet) && styles.metricsGridWide]}>
        <MetricCard
          title="Habit Consistency"
          subtitle={`${routineAnalytics.totalCompleted} completed`}
          value={`${routineAnalytics.percentage}%`}
          icon={<Clock size={16} color="#10B981" />}
          accentColor="#10B981"
          footer={`${routineAnalytics.totalScheduled} scheduled this period`}
          onPress={() => router.push('/routine' as any)}
          ctaLabel="Routine"
          style={(isDesktop || isTablet) ? styles.metricCardHalf : undefined}
        >
          <Sparkline
            data={routineAnalytics.sparklineData}
            color="#10B981"
            width={120}
            height={28}
          />
        </MetricCard>

        <MetricCard
          title="Task Velocity"
          subtitle={`${taskAnalytics.pending} pending`}
          value={`${taskAnalytics.completed} / ${taskAnalytics.total}`}
          icon={<Target size={16} color={theme.primary} />}
          accentColor={theme.primary}
          footer={`${taskAnalytics.percentage}% completion rate`}
          onPress={() => router.push('/tasks' as any)}
          ctaLabel="Board"
          style={(isDesktop || isTablet) ? styles.metricCardHalf : undefined}
        >
          <Sparkline
            data={taskAnalytics.sparklineData}
            color={theme.primary}
            width={120}
            height={28}
          />
        </MetricCard>

        <MetricCard
          title="Daily Spend"
          subtitle={`${expenseAnalytics.count} transactions`}
          value={formatCurrency(expenseAnalytics.dailyBurnAverage, settings.currency)}
          icon={<Receipt size={16} color="#F43F5E" />}
          accentColor="#F43F5E"
          footer={`Total: ${formatCurrency(expenseAnalytics.total, settings.currency)}`}
          onPress={() => router.push('/expenses' as any)}
          ctaLabel="Ledger"
          style={(isDesktop || isTablet) ? styles.metricCardHalf : undefined}
        >
          <Sparkline
            data={expenseAnalytics.sparklineData}
            color="#F43F5E"
            width={120}
            height={28}
          />
        </MetricCard>

        <MetricCard
          title="Calendar Range"
          subtitle="Days explored in period"
          value={`${daysCount} Days`}
          icon={<Calendar size={16} color="#7C3AED" />}
          accentColor="#7C3AED"
          footer={periodLabel}
          onPress={() => router.push('/calendar' as any)}
          ctaLabel="Calendar"
          style={(isDesktop || isTablet) ? styles.metricCardHalf : undefined}
        />
      </View>

      {/* ── Section 5: Feature Navigator ────────────── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <TrendingUp size={16} color={theme.textMuted} />
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Workspaces
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          Navigate to dedicated feature tabs
        </Text>
      </View>

      <View style={[styles.navGrid, (isDesktop || isTablet) && styles.navGridWide]}>
        {[
          {
            title: 'Daily Routines',
            desc: 'Recurring habits & consistency tracking',
            icon: <Clock size={18} color="#10B981" />,
            iconBg: isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5',
            metric: `${routineAnalytics.percentage}%`,
            metricLabel: 'consistency',
            route: '/routine',
            accentColor: '#10B981',
          },
          {
            title: 'Task Board',
            desc: 'Priority-based task management',
            icon: <CheckSquare size={18} color={theme.primary} />,
            iconBg: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF',
            metric: `${taskAnalytics.completed}`,
            metricLabel: 'completed',
            route: '/tasks',
            accentColor: theme.primary,
          },
          {
            title: 'Expense Tracker',
            desc: 'Financial insights & categorization',
            icon: <Receipt size={18} color="#F43F5E" />,
            iconBg: isDark ? 'rgba(244,63,94,0.12)' : '#FFF1F2',
            metric: formatCurrency(expenseAnalytics.total, settings.currency),
            metricLabel: 'total spend',
            route: '/expenses',
            accentColor: '#F43F5E',
          },
          {
            title: 'Calendar',
            desc: 'Timeline & historical records',
            icon: <Calendar size={18} color="#7C3AED" />,
            iconBg: isDark ? 'rgba(124,58,237,0.12)' : '#F5F3FF',
            metric: `${daysCount}`,
            metricLabel: 'days tracked',
            route: '/calendar',
            accentColor: '#7C3AED',
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.title}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
            style={[
              styles.navCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              (isDesktop || isTablet) && styles.navCardHalf,
            ]}
          >
            <View style={styles.navCardTop}>
              <View style={[styles.navIcon, { backgroundColor: item.iconBg }]}>
                {item.icon}
              </View>
              <ArrowRight size={16} color={theme.textMuted} />
            </View>
            <Text style={[styles.navTitle, { color: theme.textPrimary }]}>
              {item.title}
            </Text>
            <Text
              style={[styles.navDesc, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {item.desc}
            </Text>
            <View style={[styles.navDivider, { backgroundColor: theme.border }]} />
            <View style={styles.navMetricRow}>
              <Text style={[styles.navMetricValue, { color: theme.textPrimary }]}>
                {item.metric}
              </Text>
              <Text style={[styles.navMetricLabel, { color: theme.textMuted }]}>
                {item.metricLabel}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom spacer for tab bar */}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    gap: 20,
    alignSelf: 'center',
    width: '100%',
  },

  // ── Header ──
  headerSection: {
    gap: 12,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 12,
  },
  customPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Score Section ──
  scoreSection: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },

  // ── Section Headers ──
  sectionHeader: {
    gap: 2,
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 22,
  },

  // ── Charts Grid ──
  chartsGrid: {
    gap: 14,
  },
  chartsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    width: '100%',
  },
  chartCardHalf: {
    width: '48.5%',
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chartIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  chartSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  chartCta: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Needs vs Wants bar ──
  needsWantsRow: {
    gap: 6,
  },
  needsWantsBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  needsFill: {
    height: '100%',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  wantsFill: {
    height: '100%',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  needsWantsLabels: {
    flexDirection: 'row',
    gap: 16,
  },
  needsWantsLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  needsWantsText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Metrics Grid ──
  metricsGrid: {
    gap: 12,
  },
  metricsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCardHalf: {
    width: '48.5%',
  },

  // ── Nav Grid ──
  navGrid: {
    gap: 12,
  },
  navGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  navCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    width: '100%',
  },
  navCardHalf: {
    width: '48.5%',
  },
  navCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  navDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  navDivider: {
    height: 1,
    marginVertical: 4,
  },
  navMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  navMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
