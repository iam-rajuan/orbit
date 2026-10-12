import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  subDays,
} from 'date-fns';
import { useDateStore } from '../../stores/useDateStore';
import { useRoutineStore } from '../../stores/useRoutineStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useExpenseStore } from '../../stores/useExpenseStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import {
  parseDateKey,
  formatDateKey,
  isRoutineScheduledForDate,
} from '../../utils/date';
import { BarDataPoint } from './components/ActivityBarChart';
import { DonutSegment } from './components/DonutChart';
import { RingData } from './components/MultiRingGauge';
import { AreaDataPoint } from './components/AreaChart';
import { formatCurrency } from '../../utils/currency';

export type TimeframeMode = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export function useDashboardAnalytics(
  timeframe: TimeframeMode,
  customRange?: CustomDateRange
) {
  const { selectedDate } = useDateStore();
  const { routines, completions } = useRoutineStore();
  const { tasks } = useTaskStore();
  const { expenses } = useExpenseStore();
  const { settings } = useSettingsStore();

  const referenceDate = useMemo(() => parseDateKey(selectedDate), [selectedDate]);

  // Compute date interval based on timeframe
  const { startDate, endDate, periodLabel } = useMemo(() => {
    switch (timeframe) {
      case 'TODAY': {
        const d = referenceDate;
        return {
          startDate: d,
          endDate: d,
          periodLabel: format(d, 'EEEE, dd MMM yyyy'),
        };
      }
      case 'WEEK': {
        const s = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday start
        const e = endOfWeek(referenceDate, { weekStartsOn: 1 });
        return {
          startDate: s,
          endDate: e,
          periodLabel: `${format(s, 'dd MMM')} – ${format(e, 'dd MMM yyyy')}`,
        };
      }
      case 'MONTH': {
        const s = startOfMonth(referenceDate);
        const e = endOfMonth(referenceDate);
        return {
          startDate: s,
          endDate: e,
          periodLabel: format(referenceDate, 'MMMM yyyy'),
        };
      }
      case 'YEAR': {
        const s = startOfYear(referenceDate);
        const e = endOfYear(referenceDate);
        return {
          startDate: s,
          endDate: e,
          periodLabel: format(referenceDate, 'yyyy'),
        };
      }
      case 'CUSTOM': {
        const s = customRange ? parseDateKey(customRange.startDate) : subDays(referenceDate, 6);
        const e = customRange ? parseDateKey(customRange.endDate) : referenceDate;
        return {
          startDate: s,
          endDate: e,
          periodLabel: `${format(s, 'dd MMM yyyy')} – ${format(e, 'dd MMM yyyy')}`,
        };
      }
    }
  }, [timeframe, referenceDate, customRange]);

  // Generate array of day strings in period
  const daysInPeriod = useMemo(() => {
    try {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map((d) => formatDateKey(d));
    } catch {
      return [selectedDate];
    }
  }, [startDate, endDate, selectedDate]);

  // Filter tasks in period
  const periodTasks = useMemo(() => {
    const daySet = new Set(daysInPeriod);
    return tasks.filter((t) => daySet.has(t.date));
  }, [tasks, daysInPeriod]);

  // Filter expenses in period
  const periodExpenses = useMemo(() => {
    const daySet = new Set(daysInPeriod);
    return expenses.filter((e) => daySet.has(e.date));
  }, [expenses, daysInPeriod]);

  // ─── Daily Breakdowns for Trend Charts ────────────────────────────────

  /**
   * Compute daily breakdown data, intelligently chunked for large ranges.
   * Returns data points for both bar charts and area/line charts.
   */
  const buildChunkedData = useMemo(() => {
    const shouldChunk =
      timeframe === 'YEAR' || (timeframe === 'MONTH' && daysInPeriod.length > 14) ||
      (timeframe === 'CUSTOM' && daysInPeriod.length > 14);

    if (shouldChunk) {
      // Chunk by weeks for MONTH, by months for YEAR
      const chunkSize =
        timeframe === 'YEAR'
          ? Math.max(1, Math.ceil(daysInPeriod.length / 12))
          : Math.max(1, Math.ceil(daysInPeriod.length / 7));

      const chunks: string[][] = [];
      for (let i = 0; i < daysInPeriod.length; i += chunkSize) {
        chunks.push(daysInPeriod.slice(i, i + chunkSize));
      }
      return { chunks, isChunked: true };
    }

    return {
      chunks: daysInPeriod.map((d) => [d]),
      isChunked: false,
    };
  }, [daysInPeriod, timeframe]);

  // ─── Routine Analytics ────────────────────────────────────────────────

  const routineAnalytics = useMemo(() => {
    let totalScheduled = 0;
    let totalCompleted = 0;

    daysInPeriod.forEach((dayKey) => {
      const scheduledToday = routines.filter((r) =>
        isRoutineScheduledForDate(r.repeatDays, dayKey)
      );
      totalScheduled += scheduledToday.length;

      const completedToday = completions.filter(
        (c) => c.date === dayKey && c.completed
      );
      totalCompleted += completedToday.length;
    });

    const percentage =
      totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    // Daily breakdown for Bar Chart (preserved)
    let barData: BarDataPoint[] = [];

    if (timeframe === 'TODAY' || timeframe === 'WEEK' || (timeframe === 'CUSTOM' && daysInPeriod.length <= 14)) {
      barData = daysInPeriod.map((dayKey) => {
        const d = parseDateKey(dayKey);
        const scheduled = routines.filter((r) =>
          isRoutineScheduledForDate(r.repeatDays, dayKey)
        ).length;
        const done = completions.filter((c) => c.date === dayKey && c.completed).length;
        const pct = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;

        return {
          label: format(d, 'EEE'),
          subLabel: format(d, 'dd'),
          value: done,
          secondaryValue: scheduled,
          displayValue: `${pct}%`,
          isHighlighted: dayKey === selectedDate,
        };
      });
    } else {
      const chunkSize = Math.max(1, Math.floor(daysInPeriod.length / 7));
      for (let i = 0; i < daysInPeriod.length; i += chunkSize) {
        const slice = daysInPeriod.slice(i, i + chunkSize);
        let sCount = 0;
        let cCount = 0;
        slice.forEach((dk) => {
          sCount += routines.filter((r) => isRoutineScheduledForDate(r.repeatDays, dk)).length;
          cCount += completions.filter((c) => c.date === dk && c.completed).length;
        });
        const pct = sCount > 0 ? Math.round((cCount / sCount) * 100) : 0;
        const firstDay = parseDateKey(slice[0]);

        barData.push({
          label: format(firstDay, timeframe === 'YEAR' ? 'MMM' : 'dd MMM'),
          value: cCount,
          secondaryValue: sCount,
          displayValue: `${pct}%`,
        });
      }
    }

    // Area chart trend data (chunked)
    const trendData: AreaDataPoint[] = buildChunkedData.chunks.map((chunk) => {
      let sCount = 0;
      let cCount = 0;
      chunk.forEach((dk) => {
        sCount += routines.filter((r) => isRoutineScheduledForDate(r.repeatDays, dk)).length;
        cCount += completions.filter((c) => c.date === dk && c.completed).length;
      });
      const pct = sCount > 0 ? Math.round((cCount / sCount) * 100) : 0;
      const firstDay = parseDateKey(chunk[0]);

      const label = buildChunkedData.isChunked
        ? format(firstDay, timeframe === 'YEAR' ? 'MMM' : 'dd MMM')
        : format(firstDay, 'EEE');

      return { label, value: pct, displayValue: `${pct}%` };
    });

    // Sparkline data (just percentages array)
    const sparklineData = trendData.map((t) => t.value);

    return {
      totalScheduled,
      totalCompleted,
      percentage,
      barData,
      trendData,
      sparklineData,
    };
  }, [routines, completions, daysInPeriod, timeframe, selectedDate, buildChunkedData]);

  // ─── Task Analytics ───────────────────────────────────────────────────

  const taskAnalytics = useMemo(() => {
    const total = periodTasks.length;
    const completed = periodTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Priority breakdown
    const high = periodTasks.filter((t) => t.priority === 'High').length;
    const medium = periodTasks.filter((t) => t.priority === 'Medium').length;
    const low = periodTasks.filter((t) => t.priority === 'Low').length;

    const prioritySegments: DonutSegment[] = [
      { label: 'High Priority', value: high, color: '#F43F5E', formattedValue: `${high}` },
      { label: 'Medium Priority', value: medium, color: '#F59E0B', formattedValue: `${medium}` },
      { label: 'Low Priority', value: low, color: '#71717A', formattedValue: `${low}` },
    ];

    // Category distribution
    const categoryMap: Record<string, number> = {};
    periodTasks.forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
    });

    // Area chart: daily completion count
    const trendData: AreaDataPoint[] = buildChunkedData.chunks.map((chunk) => {
      const daySet = new Set(chunk);
      const chunkTasks = periodTasks.filter((t) => daySet.has(t.date));
      const done = chunkTasks.filter((t) => t.completed).length;
      const firstDay = parseDateKey(chunk[0]);

      const label = buildChunkedData.isChunked
        ? format(firstDay, timeframe === 'YEAR' ? 'MMM' : 'dd MMM')
        : format(firstDay, 'EEE');

      return { label, value: done, displayValue: `${done} done` };
    });

    const sparklineData = trendData.map((t) => t.value);

    return {
      total,
      completed,
      pending,
      percentage,
      prioritySegments,
      categoryMap,
      trendData,
      sparklineData,
    };
  }, [periodTasks, buildChunkedData, timeframe]);

  // ─── Expense Analytics ────────────────────────────────────────────────

  const expenseAnalytics = useMemo(() => {
    const total = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const needTotal = periodExpenses
      .filter((e) => e.type === 'Need')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const wantTotal = periodExpenses
      .filter((e) => e.type === 'Want')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const needPct = total > 0 ? Math.round((needTotal / total) * 100) : 0;
    const wantPct = total > 0 ? Math.round((wantTotal / total) * 100) : 0;

    const typeSegments: DonutSegment[] = [
      {
        label: 'Needs (Essential)',
        value: needTotal,
        color: '#10B981',
        formattedValue: formatCurrency(needTotal, settings.currency),
      },
      {
        label: 'Wants (Discretionary)',
        value: wantTotal,
        color: '#6366F1',
        formattedValue: formatCurrency(wantTotal, settings.currency),
      },
    ];

    // Category distribution
    const categoryTotals: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (Number(e.amount) || 0);
    });

    const categoryList = Object.entries(categoryTotals)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: total > 0 ? Math.round((amt / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const dailyBurnAverage = daysInPeriod.length > 0 ? total / daysInPeriod.length : total;

    // Area chart: daily spending
    const trendData: AreaDataPoint[] = buildChunkedData.chunks.map((chunk) => {
      const daySet = new Set(chunk);
      const chunkExpenses = periodExpenses.filter((ex) => daySet.has(ex.date));
      const chunkTotal = chunkExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const firstDay = parseDateKey(chunk[0]);

      const label = buildChunkedData.isChunked
        ? format(firstDay, timeframe === 'YEAR' ? 'MMM' : 'dd MMM')
        : format(firstDay, 'EEE');

      return {
        label,
        value: Math.round(chunkTotal * 100) / 100,
        displayValue: formatCurrency(chunkTotal, settings.currency),
      };
    });

    const sparklineData = trendData.map((t) => t.value);

    return {
      total,
      needTotal,
      wantTotal,
      needPct,
      wantPct,
      typeSegments,
      categoryList,
      dailyBurnAverage,
      count: periodExpenses.length,
      trendData,
      sparklineData,
    };
  }, [periodExpenses, daysInPeriod, settings.currency, buildChunkedData, timeframe]);

  // ─── Overall Score ────────────────────────────────────────────────────

  const overallScore = useMemo(() => {
    const habitScore = routineAnalytics.percentage;
    const taskScore = taskAnalytics.percentage;
    const budgetScore = expenseAnalytics.total > 0 ? Math.min(100, Math.max(20, expenseAnalytics.needPct)) : 100;

    const weighted = Math.round(habitScore * 0.45 + taskScore * 0.45 + budgetScore * 0.1);
    return Math.min(100, Math.max(0, weighted));
  }, [routineAnalytics, taskAnalytics, expenseAnalytics]);

  // ─── MultiRing Gauge ──────────────────────────────────────────────────

  const multiRings: [RingData, RingData, RingData] = useMemo(() => {
    return [
      {
        label: 'Habits',
        percentage: routineAnalytics.percentage,
        color: '#10B981',
        bgColor: '#ECFDF5',
        valueDisplay: `${routineAnalytics.percentage}%`,
      },
      {
        label: 'Tasks',
        percentage: taskAnalytics.percentage,
        color: '#4F46E5',
        bgColor: '#EEF2FF',
        valueDisplay: `${taskAnalytics.percentage}%`,
      },
      {
        label: 'Needs Ratio',
        percentage: expenseAnalytics.needPct,
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        valueDisplay: `${expenseAnalytics.needPct}%`,
      },
    ];
  }, [routineAnalytics, taskAnalytics, expenseAnalytics]);

  return {
    periodLabel,
    daysCount: daysInPeriod.length,
    routineAnalytics,
    taskAnalytics,
    expenseAnalytics,
    overallScore,
    multiRings,
  };
}
