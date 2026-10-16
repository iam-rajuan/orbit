import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { useDateStore } from '../../../stores/useDateStore';
import { ActivityBarChart, BarDataPoint } from '../../dashboard/components/ActivityBarChart';
import { DonutChart, DonutSegment } from '../../dashboard/components/DonutChart';
import { offsetDateKey, formatCompactDate } from '../../../utils/date';
import {
  Calendar,
  Flame,
  Dumbbell,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react-native';

export const NutritionAnalyticsView: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { selectedDate, setSelectedDate } = useDateStore();
  const { goals, getPeriodAnalytics, loggedEntries, mealSlots } = useNutritionStore();

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-10-08');

  // Compute date ranges based on period
  const { startDate, endDate } = useMemo(() => {
    if (period === 'day') {
      return { startDate: selectedDate, endDate: selectedDate };
    }
    if (period === 'week') {
      return {
        startDate: offsetDateKey(selectedDate, -6),
        endDate: selectedDate,
      };
    }
    if (period === 'month') {
      return {
        startDate: offsetDateKey(selectedDate, -29),
        endDate: selectedDate,
      };
    }
    // Custom
    return {
      startDate: customStart || offsetDateKey(selectedDate, -7),
      endDate: customEnd || selectedDate,
    };
  }, [period, selectedDate, customStart, customEnd]);

  // Retrieve calculated period analytics
  const analytics = useMemo(() => {
    return getPeriodAnalytics(startDate, endDate);
  }, [startDate, endDate, getPeriodAnalytics]);

  // Format data for ActivityBarChart
  const barChartData: BarDataPoint[] = useMemo(() => {
    return analytics.days.map((d) => {
      const dateParts = d.date.split('-');
      const dayNum = dateParts[2] || '';
      const isSelected = d.date === selectedDate;

      return {
        label: dayNum,
        value: d.calories,
        secondaryValue: d.calorieTarget,
        displayValue: d.calories > 0 ? `${d.calories}` : undefined,
        isHighlighted: isSelected,
      };
    });
  }, [analytics.days, selectedDate]);

  // Macro Donut Segments
  const macroSegments: DonutSegment[] = useMemo(() => {
    const pKcal = analytics.avgProtein * 4;
    const cKcal = analytics.avgCarbs * 4;
    const fKcal = analytics.avgFat * 9;
    const total = pKcal + cKcal + fKcal || 1;

    return [
      {
        label: `Protein (${Math.round(analytics.avgProtein)}g)`,
        value: pKcal,
        color: '#10B981',
        formattedValue: `${Math.round((pKcal / total) * 100)}%`,
      },
      {
        label: `Carbs (${Math.round(analytics.avgCarbs)}g)`,
        value: cKcal,
        color: '#F59E0B',
        formattedValue: `${Math.round((cKcal / total) * 100)}%`,
      },
      {
        label: `Fat (${Math.round(analytics.avgFat)}g)`,
        value: fKcal,
        color: '#EC4899',
        formattedValue: `${Math.round((fKcal / total) * 100)}%`,
      },
    ];
  }, [analytics.avgProtein, analytics.avgCarbs, analytics.avgFat]);

  // Meal slot calorie distribution
  const mealDistribution = useMemo(() => {
    const rangeEntries = loggedEntries.filter(
      (e) => e.date >= startDate && e.date <= endDate
    );
    const totalCals = rangeEntries.reduce((sum, e) => sum + (e.calories || 0), 0) || 1;

    return mealSlots.map((slot) => {
      const slotEntries = rangeEntries.filter((e) => e.mealSlotId === slot.id);
      const slotCals = slotEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
      const pct = Math.round((slotCals / totalCals) * 100);

      return {
        name: slot.name,
        calories: slotCals,
        percentage: pct,
      };
    });
  }, [loggedEntries, startDate, endDate, mealSlots]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector Tabs */}
      <View
        style={[
          styles.periodSwitcher,
          { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
        ]}
      >
        {(['day', 'week', 'month', 'custom'] as const).map((p) => {
          const isActive = period === p;
          return (
            <TouchableOpacity
              key={p}
              activeOpacity={0.7}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodBtn,
                isActive && {
                  backgroundColor: theme.surface,
                  shadowColor: theme.shadowColor,
                  shadowOpacity: theme.shadowOpacity,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  { color: isActive ? theme.primary : theme.textMuted },
                  isActive && styles.periodBtnTextActive,
                ]}
              >
                {p === 'day'
                  ? 'Day'
                  : p === 'week'
                  ? '7 Days'
                  : p === 'month'
                  ? '30 Days'
                  : 'Custom'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date Range Subheader */}
      <View style={styles.dateRangeHeader}>
        <Calendar size={14} color={theme.textMuted} />
        <Text style={[styles.dateRangeText, { color: theme.textSecondary }]}>
          {formatCompactDate(startDate)} → {formatCompactDate(endDate)}
        </Text>
      </View>

      {/* Custom Range Inputs if custom selected */}
      {period === 'custom' && (
        <View
          style={[
            styles.customRangeBox,
            { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
          ]}
        >
          <View style={styles.customInputGroup}>
            <Text style={[styles.customInputLabel, { color: theme.textMuted }]}>
              Start Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.customTextInput,
                { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
              ]}
              value={customStart}
              onChangeText={setCustomStart}
            />
          </View>
          <View style={styles.customInputGroup}>
            <Text style={[styles.customInputLabel, { color: theme.textMuted }]}>
              End Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.customTextInput,
                { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border },
              ]}
              value={customEnd}
              onChangeText={setCustomEnd}
            />
          </View>
        </View>
      )}

      {/* KPI Summary Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* KPI 1: Avg Daily Calories */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.kpiHeader}>
            <Flame size={15} color="#4F46E5" />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Daily Avg Cals</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
            {analytics.avgCalories}{' '}
            <Text style={[styles.kpiUnit, { color: theme.textMuted }]}>kcal</Text>
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            Target: {goals.calorieTarget} kcal
          </Text>
        </View>

        {/* KPI 2: Avg Daily Protein */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.kpiHeader}>
            <Dumbbell size={15} color="#10B981" />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Daily Avg Protein</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
            {analytics.avgProtein}{' '}
            <Text style={[styles.kpiUnit, { color: theme.textMuted }]}>g</Text>
          </Text>
          <Text style={[styles.kpiSub, { color: '#10B981' }]}>
            Target: {goals.proteinTarget}g
          </Text>
        </View>

        {/* KPI 3: Total Deficit & Fat Loss */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.kpiHeader}>
            <TrendingDown size={15} color="#059669" />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Net Deficit</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>
            {analytics.totalDeficit >= 0 ? `-${analytics.totalDeficit}` : `+${Math.abs(analytics.totalDeficit)}`}{' '}
            <Text style={[styles.kpiUnit, { color: theme.textMuted }]}>kcal</Text>
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            ≈ {analytics.estimatedKgFatLoss} kg fat loss
          </Text>
        </View>

        {/* KPI 4: Target Adherence Rate */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.kpiHeader}>
            <CheckCircle2 size={15} color="#F59E0B" />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Adherence</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.textPrimary }]}>
            {analytics.adherenceRatePct}%
          </Text>
          <Text style={[styles.kpiSub, { color: theme.textSecondary }]}>
            Within target range
          </Text>
        </View>
      </View>

      {/* Calorie Trend Chart */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
            Calorie Intake Trend
          </Text>
          <Text style={[styles.chartLegend, { color: theme.textMuted }]}>
            Daily Intake (kcal)
          </Text>
        </View>

        <ActivityBarChart
          data={barChartData}
          height={140}
          primaryColor="#4F46E5"
          maxExpectedValue={goals.calorieTarget * 1.2}
          onSelectBar={(point) => {
            const match = analytics.days.find((d) => d.date.endsWith(`-${point.label}`));
            if (match) setSelectedDate(match.date);
          }}
        />
      </View>

      {/* Macro Split Donut Chart */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.chartTitle, { color: theme.textPrimary, marginBottom: 14 }]}>
          Average Macro Split Breakdown
        </Text>
        <DonutChart
          segments={macroSegments}
          size={160}
          strokeWidth={16}
          centerTitle={`${analytics.avgCalories}`}
          centerSubtitle="AVG KCAL"
          showLegend={true}
        />
      </View>

      {/* Meal Slot Distribution */}
      <View
        style={[
          styles.chartCard,
          { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 30 },
        ]}
      >
        <Text style={[styles.chartTitle, { color: theme.textPrimary, marginBottom: 12 }]}>
          Meal Calorie Distribution
        </Text>
        <View style={styles.distributionList}>
          {mealDistribution.map((slot, index) => (
            <View key={index} style={styles.distItem}>
              <View style={styles.distHeader}>
                <Text style={[styles.distName, { color: theme.textPrimary }]}>
                  {slot.name}
                </Text>
                <Text style={[styles.distValue, { color: theme.textSecondary }]}>
                  {slot.calories} kcal ({slot.percentage}%)
                </Text>
              </View>
              <View style={[styles.distBarTrack, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
                <View
                  style={[
                    styles.distBarFill,
                    {
                      width: `${slot.percentage}%`,
                      backgroundColor:
                        index === 0
                          ? '#F59E0B'
                          : index === 1
                          ? '#4F46E5'
                          : index === 2
                          ? '#10B981'
                          : '#EC4899',
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  periodSwitcher: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 10,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  periodBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodBtnTextActive: {
    fontWeight: '800',
  },
  dateRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customRangeBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  customInputGroup: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  customTextInput: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chartLegend: {
    fontSize: 11,
    fontWeight: '500',
  },
  distributionList: {
    gap: 10,
  },
  distItem: {
    gap: 4,
  },
  distHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distName: {
    fontSize: 12,
    fontWeight: '700',
  },
  distValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  distBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
