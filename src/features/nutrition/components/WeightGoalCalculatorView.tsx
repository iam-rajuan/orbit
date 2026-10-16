import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Zap,
  Activity,
} from 'lucide-react-native';
import { BmiCalculatorModal } from './BmiCalculatorModal';

const CALORIES_PER_KG_ENERGY = 7700;
const CALORIES_PER_LB_ENERGY = 3500;

export const WeightGoalCalculatorView: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { goals, updateGoals } = useNutritionStore();

  // Primary Goal Direction: 'lose' (Deficit) vs 'gain' (Surplus)
  const [goalDirection, setGoalDirection] = useState<'lose' | 'gain'>(
    goals.goalType === 'bulk' ? 'gain' : 'lose'
  );

  // Unit toggle: kg or lbs
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  // Mode: byCalories (choose daily calorie deficit/surplus -> see weight change)
  // or byWeight (choose target weight to change -> see required daily calories & timeline)
  const [mode, setMode] = useState<'byCalories' | 'byWeight'>('byCalories');

  // Baseline maintenance TDEE
  const [maintenanceTdee, setMaintenanceTdee] = useState<number>(
    goals.maintenanceCalories > 0 ? goals.maintenanceCalories : 2400
  );

  // Daily calorie delta (positive number for deficit or surplus)
  const [dailyDelta, setDailyDelta] = useState<number>(
    goals.targetDeficit !== 0 ? Math.abs(goals.targetDeficit) : goalDirection === 'lose' ? 500 : 300
  );

  // Projection Horizon (30, 60, 90, 180 days)
  const [horizonDays, setHorizonDays] = useState<number>(90);

  // By Weight Goal inputs
  const [targetWeight, setTargetWeight] = useState<number>(
    goalDirection === 'lose' ? (unit === 'kg' ? 5 : 11) : (unit === 'kg' ? 3 : 7)
  );
  const [timeframeType, setTimeframeType] = useState<'days' | 'pace'>('days');
  const [targetDays, setTargetDays] = useState<number>(60);
  const [weeklyPace, setWeeklyPace] = useState<number>(
    goalDirection === 'lose' ? (unit === 'kg' ? 0.5 : 1.1) : (unit === 'kg' ? 0.25 : 0.6)
  );

  // Expanded educational science accordion
  const [expandedTopic, setExpandedTopic] = useState<string | null>('science7700');

  // Toast feedback
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // BMI Speedometer Modal state
  const [bmiModalOpen, setBmiModalOpen] = useState(false);

  // When goalDirection changes, update default presets cleanly in event handler
  const handleSelectGoalDirection = (dir: 'lose' | 'gain') => {
    setGoalDirection(dir);
    if (dir === 'lose') {
      if (dailyDelta < 300 || dailyDelta > 1000) setDailyDelta(500);
      if (weeklyPace < 0.3) setWeeklyPace(unit === 'kg' ? 0.5 : 1.1);
    } else {
      if (dailyDelta > 600 || dailyDelta < 200) setDailyDelta(300);
      if (weeklyPace > 0.6) setWeeklyPace(unit === 'kg' ? 0.25 : 0.6);
    }
  };

  // Calories per unit
  const caloriesPerUnit = unit === 'kg' ? CALORIES_PER_KG_ENERGY : CALORIES_PER_LB_ENERGY;

  // MODE 1: BY CALORIES CALCULATIONS
  const isLoss = goalDirection === 'lose';
  const dailyBurnGrams = (dailyDelta / CALORIES_PER_KG_ENERGY) * 1000;
  const dailyBurnLbs = dailyDelta / CALORIES_PER_LB_ENERGY;
  const weeklyWeightChange = (dailyDelta * 7) / caloriesPerUnit;
  const monthlyWeightChange = (dailyDelta * 30) / caloriesPerUnit;
  const horizonWeightChange = (dailyDelta * horizonDays) / caloriesPerUnit;
  const horizonTotalCalories = dailyDelta * horizonDays;
  const calculatedIntake = isLoss
    ? Math.max(1200, maintenanceTdee - dailyDelta)
    : maintenanceTdee + dailyDelta;

  // MODE 2: BY WEIGHT GOAL CALCULATIONS
  const totalCaloriesRequired = targetWeight * caloriesPerUnit;
  let requiredDailyDelta = 0;
  let computedDurationDays = 0;

  if (timeframeType === 'days') {
    computedDurationDays = Math.max(1, targetDays);
    requiredDailyDelta = Math.round(totalCaloriesRequired / computedDurationDays);
  } else {
    const weeklyCalories = weeklyPace * caloriesPerUnit;
    requiredDailyDelta = Math.round(weeklyCalories / 7);
    computedDurationDays = Math.round((targetWeight / Math.max(0.1, weeklyPace)) * 7);
  }

  const requiredWeeklyCalories = requiredDailyDelta * 7;
  const requiredMonthlyCalories = requiredDailyDelta * 30;
  const goalSuggestedIntake = isLoss
    ? Math.max(1200, maintenanceTdee - requiredDailyDelta)
    : maintenanceTdee + requiredDailyDelta;
  const goalWeeklyPace = (targetWeight / (computedDurationDays / 7)).toFixed(2);

  // Safety profile
  const getSafetyAssessment = (deltaVal: number) => {
    if (isLoss) {
      if (deltaVal <= 350) {
        return {
          label: 'Mild & Sustainable',
          color: '#10B981',
          desc: 'Gentle fat loss with zero hunger or metabolic resistance.',
        };
      }
      if (deltaVal <= 650) {
        return {
          label: 'Optimal Fat Loss',
          color: '#0EA5E9',
          desc: 'Recommended gold standard. Maximizes fat oxidation while sparing muscle.',
        };
      }
      if (deltaVal <= 900) {
        return {
          label: 'Aggressive Cut',
          color: '#F59E0B',
          desc: 'Fast fat loss. Ensure high protein (1.8g+/kg) and resistance training.',
        };
      }
      return {
        label: 'Extreme Cut / Muscle Risk',
        color: '#EF4444',
        desc: 'Risk of muscle loss and metabolic slowdown. Keep duration brief.',
      };
    } else {
      // Gain / Surplus
      if (deltaVal <= 300) {
        return {
          label: 'Lean Muscle Bulk (Clean)',
          color: '#10B981',
          desc: 'Ideal for maximizing muscle protein synthesis while keeping fat gain near zero.',
        };
      }
      if (deltaVal <= 500) {
        return {
          label: 'Standard Athletic Bulk',
          color: '#0EA5E9',
          desc: 'Great for steady muscle growth and strength progression.',
        };
      }
      if (deltaVal <= 750) {
        return {
          label: 'Aggressive Mass Gain',
          color: '#F59E0B',
          desc: 'Fast weight gain. Beneficial for underweight individuals or hardgainers.',
        };
      }
      return {
        label: 'Excessive Surplus / High Fat Gain',
        color: '#EF4444',
        desc: 'Muscle building has a biological speed limit. Excess calories will store as fat.',
      };
    }
  };

  const currentSafety = getSafetyAssessment(
    mode === 'byCalories' ? dailyDelta : requiredDailyDelta
  );

  // Apply to Store Goals
  const handleApplyToGoals = async (deltaVal: number, intakeVal: number) => {
    const isCut = goalDirection === 'lose';
    await updateGoals({
      ...goals,
      calorieTarget: Math.round(intakeVal),
      maintenanceCalories: Math.round(maintenanceTdee),
      targetDeficit: isCut ? Math.round(deltaVal) : -Math.round(deltaVal),
      goalType: isCut ? 'cut' : 'bulk',
    });
    setAppliedNotice(
      `Saved! Daily Target: ${Math.round(intakeVal)} kcal (${isCut ? `-${Math.round(deltaVal)} deficit` : `+${Math.round(deltaVal)} surplus`})`
    );
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Toast Notification */}
      {appliedNotice && (
        <View style={[styles.toast, { backgroundColor: '#10B981' }]}>
          <CheckCircle2 size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{appliedNotice}</Text>
        </View>
      )}

      {/* TOP GOAL SELECTOR: LOSE WEIGHT vs GAIN WEIGHT */}
      <View
        style={[
          styles.goalSelectorCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
            shadowOpacity: theme.shadowOpacity,
          },
        ]}
      >
        <View style={styles.cardHeaderTopRow}>
          <Text style={[styles.cardHeaderTitle, { color: theme.textSecondary }]}>
            WHAT IS YOUR PRIMARY GOAL?
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setBmiModalOpen(true)}
            style={[
              styles.bmiTriggerBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <Activity size={12} color="#10B981" />
            <Text style={[styles.bmiTriggerBtnText, { color: theme.textPrimary }]}>
              BMI Speedometer
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalButtonRow}>
          {/* LOSE WEIGHT TAB */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectGoalDirection('lose')}
            style={[
              styles.goalDirectionBtn,
              {
                backgroundColor:
                  goalDirection === 'lose'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.18)'
                      : '#ECFDF5'
                    : theme.surfaceSubtle,
                borderColor:
                  goalDirection === 'lose' ? '#10B981' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.goalIconCircle,
                {
                  backgroundColor:
                    goalDirection === 'lose' ? '#10B981' : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            >
              <TrendingDown size={18} color="#FFFFFF" />
            </View>
            <View style={styles.goalTextGroup}>
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color:
                      goalDirection === 'lose'
                        ? isDark
                          ? '#34D399'
                          : '#059669'
                        : theme.textPrimary,
                  },
                ]}
              >
                Lose Weight / Fat
              </Text>
              <Text style={[styles.goalSubtitle, { color: theme.textMuted }]}>
                Calorie Deficit Strategy
              </Text>
            </View>
          </TouchableOpacity>

          {/* GAIN WEIGHT TAB */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSelectGoalDirection('gain')}
            style={[
              styles.goalDirectionBtn,
              {
                backgroundColor:
                  goalDirection === 'gain'
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.18)'
                      : '#EEF2FF'
                    : theme.surfaceSubtle,
                borderColor:
                  goalDirection === 'gain' ? '#6366F1' : theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.goalIconCircle,
                {
                  backgroundColor:
                    goalDirection === 'gain' ? '#6366F1' : 'rgba(150, 150, 150, 0.2)',
                },
              ]}
            >
              <TrendingUp size={18} color="#FFFFFF" />
            </View>
            <View style={styles.goalTextGroup}>
              <Text
                style={[
                  styles.goalTitle,
                  {
                    color:
                      goalDirection === 'gain'
                        ? isDark
                          ? '#818CF8'
                          : '#4F46E5'
                        : theme.textPrimary,
                  },
                ]}
              >
                Gain Weight / Muscle
              </Text>
              <Text style={[styles.goalSubtitle, { color: theme.textMuted }]}>
                Calorie Surplus Strategy
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK SCIENCE TRUTH BANNER */}
      <View
        style={[
          styles.scienceBanner,
          {
            backgroundColor:
              goalDirection === 'lose'
                ? isDark
                  ? 'rgba(16, 185, 129, 0.1)'
                  : '#F0FDF4'
                : isDark
                ? 'rgba(99, 102, 241, 0.1)'
                : '#F5F3FF',
            borderColor:
              goalDirection === 'lose'
                ? isDark
                  ? 'rgba(16, 185, 129, 0.25)'
                  : '#BBF7D0'
                : isDark
                ? 'rgba(99, 102, 241, 0.25)'
                : '#DDD6FE',
          },
        ]}
      >
        <View style={styles.scienceBannerHeader}>
          <Zap
            size={16}
            color={goalDirection === 'lose' ? '#10B981' : '#6366F1'}
          />
          <Text
            style={[
              styles.scienceBannerTitle,
              {
                color:
                  goalDirection === 'lose'
                    ? isDark
                      ? '#34D399'
                      : '#15803D'
                    : isDark
                    ? '#A5B4FC'
                    : '#4338CA',
              },
            ]}
          >
            {goalDirection === 'lose'
              ? 'The Fat Loss Rule: 1 kg Fat ≈ 7,700 kcal Deficit (1 lb ≈ 3,500 kcal)'
              : 'The Muscle Gain Rule: 1 kg Muscle Mass ≈ 7,700 kcal Surplus + Protein'}
          </Text>
        </View>
        <Text style={[styles.scienceBannerDesc, { color: theme.textSecondary }]}>
          {goalDirection === 'lose'
            ? 'To burn 1 kg of stored fat, create an accumulated 7,700 kcal deficit. Burning ~500 kcal/day loses 0.45 kg (1 lb) of fat per week sustainably without muscle loss.'
            : 'To build 1 kg of muscle tissue, your body requires ~7,700 kcal of net surplus energy to fuel protein synthesis and tissue synthesis. A lean +250–400 kcal/day surplus maximizes muscle while avoiding excess fat.'}
        </Text>
      </View>

      {/* MAIN CALCULATOR CARD */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
            shadowOpacity: theme.shadowOpacity,
          },
        ]}
      >
        {/* Sub-Header: Mode Switcher & Unit Toggle */}
        <View style={styles.controlsRow}>
          {/* Method Switcher */}
          <View
            style={[
              styles.modeSegment,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('byCalories')}
              style={[
                styles.modeBtn,
                mode === 'byCalories' && {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Zap
                size={13}
                color={mode === 'byCalories' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'byCalories' ? theme.primary : theme.textSecondary },
                  mode === 'byCalories' && styles.modeBtnTextActive,
                ]}
              >
                {goalDirection === 'lose' ? 'By Daily Deficit' : 'By Daily Surplus'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('byWeight')}
              style={[
                styles.modeBtn,
                mode === 'byWeight' && {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Target
                size={13}
                color={mode === 'byWeight' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'byWeight' ? theme.primary : theme.textSecondary },
                  mode === 'byWeight' && styles.modeBtnTextActive,
                ]}
              >
                By Target Weight
              </Text>
            </TouchableOpacity>
          </View>

          {/* Unit Toggle */}
          <View
            style={[
              styles.unitToggle,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (unit !== 'kg') {
                  setUnit('kg');
                  setTargetWeight(Math.max(1, Math.round(targetWeight / 2.2)));
                  setWeeklyPace(goalDirection === 'lose' ? 0.5 : 0.25);
                }
              }}
              style={[
                styles.unitBtn,
                unit === 'kg' && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  { color: unit === 'kg' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (unit !== 'lbs') {
                  setUnit('lbs');
                  setTargetWeight(Math.max(2, Math.round(targetWeight * 2.2)));
                  setWeeklyPace(goalDirection === 'lose' ? 1.1 : 0.6);
                }
              }}
              style={[
                styles.unitBtn,
                unit === 'lbs' && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  { color: unit === 'lbs' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Maintenance TDEE Base Row */}
        <View style={styles.tdeeRow}>
          <View style={styles.tdeeLabelGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Estimated Maintenance TDEE:
            </Text>
            <Text style={[styles.inputHint, { color: theme.textMuted }]}>
              Calories you burn daily to maintain current weight
            </Text>
          </View>
          <View
            style={[
              styles.numberInputBox,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.numberInput, { color: theme.textPrimary }]}
              keyboardType="numeric"
              value={maintenanceTdee.toString()}
              onChangeText={(val) => {
                const n = parseInt(val, 10);
                if (!isNaN(n)) setMaintenanceTdee(Math.max(1000, n));
              }}
            />
            <Text style={[styles.unitSuffix, { color: theme.textMuted }]}>kcal</Text>
          </View>
        </View>

        {/* METHOD 1: BY DAILY CALORIES (DEFICIT OR SURPLUS) */}
        {mode === 'byCalories' ? (
          <View style={styles.calculatorSection}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              {goalDirection === 'lose'
                ? '1. Select Your Daily Calorie Deficit'
                : '1. Select Your Daily Calorie Surplus'}
            </Text>

            {/* Presets based on direction */}
            <View style={styles.presetsGrid}>
              {(goalDirection === 'lose'
                ? [
                    { label: 'Mild (-300)', val: 300, sub: 'Easy & Gentle' },
                    { label: 'Optimal (-500)', val: 500, sub: 'Recommended' },
                    { label: 'Aggressive (-750)', val: 750, sub: 'Fast Cut' },
                    { label: 'Intense (-1,000)', val: 1000, sub: 'Max Safe Cut' },
                  ]
                : [
                    { label: 'Lean Bulk (+250)', val: 250, sub: 'Pure Muscle' },
                    { label: 'Optimal (+400)', val: 400, sub: 'Recommended' },
                    { label: 'Fast Gain (+600)', val: 600, sub: 'Hardgainer' },
                    { label: 'Heavy Mass (+800)', val: 800, sub: 'Rapid Growth' },
                  ]
              ).map((p) => {
                const active = dailyDelta === p.val;
                return (
                  <TouchableOpacity
                    key={p.val}
                    activeOpacity={0.7}
                    onPress={() => setDailyDelta(p.val)}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: active
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.2)'
                            : '#EEF2FF'
                          : theme.surfaceSubtle,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetTitle,
                        { color: active ? theme.primary : theme.textPrimary },
                      ]}
                    >
                      {p.label}
                    </Text>
                    <Text style={[styles.presetSub, { color: theme.textMuted }]}>
                      {p.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Stepper */}
            <View style={styles.customDeficitRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                {goalDirection === 'lose' ? 'Custom Daily Deficit:' : 'Custom Daily Surplus:'}
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setDailyDelta(Math.max(50, dailyDelta - 50))}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-50</Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.numberInputBox,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    style={[styles.numberInput, { color: theme.textPrimary }]}
                    keyboardType="numeric"
                    value={dailyDelta.toString()}
                    onChangeText={(v) => {
                      const n = parseInt(v, 10);
                      if (!isNaN(n)) setDailyDelta(Math.max(50, n));
                    }}
                  />
                  <Text style={[styles.unitSuffix, { color: theme.textMuted }]}>kcal/day</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setDailyDelta(dailyDelta + 50)}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Projection Horizon Selector */}
            <View style={styles.horizonRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Forecast Horizon:
              </Text>
              <View style={styles.horizonPills}>
                {[30, 60, 90, 180].map((days) => (
                  <TouchableOpacity
                    key={days}
                    activeOpacity={0.7}
                    onPress={() => setHorizonDays(days)}
                    style={[
                      styles.horizonPill,
                      {
                        backgroundColor:
                          horizonDays === days ? theme.primary : theme.surfaceSubtle,
                        borderColor:
                          horizonDays === days ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.horizonPillText,
                        { color: horizonDays === days ? '#FFFFFF' : theme.textSecondary },
                      ]}
                    >
                      {days === 30 ? '1 Month' : days === 60 ? '2 Months' : days === 90 ? '3 Months' : '6 Months'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* RESULTS DASHBOARD */}
            <View
              style={[
                styles.resultsContainer,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsHeaderTitle, { color: theme.textPrimary }]}>
                  {goalDirection === 'lose' ? 'Projected Weight Burn' : 'Projected Weight Gain'}
                </Text>
                <View
                  style={[
                    styles.safetyBadge,
                    {
                      backgroundColor: `${currentSafety.color}20`,
                      borderColor: `${currentSafety.color}40`,
                    },
                  ]}
                >
                  <Text style={[styles.safetyBadgeText, { color: currentSafety.color }]}>
                    {currentSafety.label}
                  </Text>
                </View>
              </View>

              <Text style={[styles.safetyDesc, { color: theme.textSecondary }]}>
                {currentSafety.desc}
              </Text>

              {/* 4 Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Daily */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    PER DAY
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: goalDirection === 'lose' ? '#0EA5E9' : '#8B5CF6' },
                    ]}
                  >
                    {isLoss ? '-' : '+'}
                    {unit === 'kg'
                      ? `${Math.round(dailyBurnGrams)} g`
                      : `${dailyBurnLbs.toFixed(2)} lbs`}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    {isLoss ? `-${dailyDelta} kcal burn` : `+${dailyDelta} kcal surplus`}
                  </Text>
                </View>

                {/* Weekly */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    PER WEEK (7 DAYS)
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: goalDirection === 'lose' ? '#10B981' : '#4F46E5' },
                    ]}
                  >
                    {isLoss ? '-' : '+'}
                    {weeklyWeightChange.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    {isLoss ? '-' : '+'}
                    {(dailyDelta * 7).toLocaleString()} kcal
                  </Text>
                </View>

                {/* Monthly */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    PER MONTH (30 DAYS)
                  </Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: goalDirection === 'lose' ? '#8B5CF6' : '#10B981' },
                    ]}
                  >
                    {isLoss ? '-' : '+'}
                    {monthlyWeightChange.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    {isLoss ? '-' : '+'}
                    {(dailyDelta * 30).toLocaleString()} kcal
                  </Text>
                </View>

                {/* Horizon Total */}
                <View
                  style={[
                    styles.metricCard,
                    styles.metricCardHighlight,
                    {
                      backgroundColor: isDark
                        ? 'rgba(79, 70, 229, 0.15)'
                        : '#EEF2FF',
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.primary }]}>
                    IN {horizonDays} DAYS TOTAL
                  </Text>
                  <Text style={[styles.metricValueLarge, { color: theme.primary }]}>
                    {isLoss ? '-' : '+'}
                    {horizonWeightChange.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textSecondary }]}>
                    {isLoss ? '-' : '+'}
                    {horizonTotalCalories.toLocaleString()} total kcal
                  </Text>
                </View>
              </View>

              {/* Suggested Daily Intake Bar */}
              <View
                style={[
                  styles.intakeRecommendationRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.intakeTextGroup}>
                  <Text style={[styles.intakeLabel, { color: theme.textMuted }]}>
                    SUGGESTED DAILY FOOD INTAKE:
                  </Text>
                  <View style={styles.intakeNumbersRow}>
                    <Text style={[styles.intakeBigNumber, { color: theme.textPrimary }]}>
                      {calculatedIntake.toLocaleString()}{' '}
                      <Text style={styles.intakeUnit}>kcal/day</Text>
                    </Text>
                    <Text style={[styles.intakeFormula, { color: theme.textMuted }]}>
                      ({maintenanceTdee} TDEE {isLoss ? `- ${dailyDelta} deficit` : `+ ${dailyDelta} surplus`})
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleApplyToGoals(dailyDelta, calculatedIntake)}
                  style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                >
                  <Sparkles size={14} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>Apply Target</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* METHOD 2: BY TARGET WEIGHT GOAL */
          <View style={styles.calculatorSection}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              {goalDirection === 'lose'
                ? '1. How Much Weight Do You Want to Lose?'
                : '1. How Much Weight Do You Want to Gain?'}
            </Text>

            {/* Target Weight Stepper */}
            <View style={styles.customDeficitRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Target Weight:
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setTargetWeight(Math.max(1, targetWeight - 1))}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>-1</Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.numberInputBox,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    style={[styles.numberInput, { color: theme.textPrimary }]}
                    keyboardType="numeric"
                    value={targetWeight.toString()}
                    onChangeText={(v) => {
                      const n = parseFloat(v);
                      if (!isNaN(n)) setTargetWeight(Math.max(0.5, n));
                    }}
                  />
                  <Text style={[styles.unitSuffix, { color: theme.textMuted }]}>{unit}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setTargetWeight(targetWeight + 1)}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+1</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Timeline Strategy */}
            <Text
              style={[
                styles.sectionHeading,
                { color: theme.textPrimary, marginTop: 12 },
              ]}
            >
              2. Timeline Strategy
            </Text>

            <View style={styles.timeframeToggleRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTimeframeType('days')}
                style={[
                  styles.timeframeTypeBtn,
                  {
                    backgroundColor:
                      timeframeType === 'days'
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                    borderColor:
                      timeframeType === 'days' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Clock
                  size={14}
                  color={timeframeType === 'days' ? theme.primary : theme.textMuted}
                />
                <Text
                  style={[
                    styles.timeframeTypeText,
                    {
                      color:
                        timeframeType === 'days'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Set Target Days (e.g. 60 days)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setTimeframeType('pace')}
                style={[
                  styles.timeframeTypeBtn,
                  {
                    backgroundColor:
                      timeframeType === 'pace'
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                    borderColor:
                      timeframeType === 'pace' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Scale
                  size={14}
                  color={timeframeType === 'pace' ? theme.primary : theme.textMuted}
                />
                <Text
                  style={[
                    styles.timeframeTypeText,
                    {
                      color:
                        timeframeType === 'pace'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Set Weekly Pace ({unit}/wk)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Timeframe Controls */}
            {timeframeType === 'days' ? (
              <View style={styles.horizonRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Days to Reach Target:
                </Text>
                <View style={styles.horizonPills}>
                  {[30, 45, 60, 90, 120].map((d) => (
                    <TouchableOpacity
                      key={d}
                      activeOpacity={0.7}
                      onPress={() => setTargetDays(d)}
                      style={[
                        styles.horizonPill,
                        {
                          backgroundColor:
                            targetDays === d ? theme.primary : theme.surfaceSubtle,
                          borderColor:
                            targetDays === d ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.horizonPillText,
                          { color: targetDays === d ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {d} Days
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.horizonRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Target Weekly Pace:
                </Text>
                <View style={styles.horizonPills}>
                  {(goalDirection === 'lose'
                    ? unit === 'kg'
                      ? [0.25, 0.5, 0.75, 1.0]
                      : [0.5, 1.0, 1.5, 2.0]
                    : unit === 'kg'
                    ? [0.15, 0.25, 0.4, 0.6]
                    : [0.3, 0.5, 0.8, 1.3]
                  ).map((p) => (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.7}
                      onPress={() => setWeeklyPace(p)}
                      style={[
                        styles.horizonPill,
                        {
                          backgroundColor:
                            weeklyPace === p ? theme.primary : theme.surfaceSubtle,
                          borderColor:
                            weeklyPace === p ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.horizonPillText,
                          { color: weeklyPace === p ? '#FFFFFF' : theme.textSecondary },
                        ]}
                      >
                        {p} {unit}/wk
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* RESULTS DASHBOARD */}
            <View
              style={[
                styles.resultsContainer,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsHeaderTitle, { color: theme.textPrimary }]}>
                  {goalDirection === 'lose' ? 'Required Calorie Deficit Plan' : 'Required Calorie Surplus Plan'}
                </Text>
                <View
                  style={[
                    styles.safetyBadge,
                    {
                      backgroundColor: `${currentSafety.color}20`,
                      borderColor: `${currentSafety.color}40`,
                    },
                  ]}
                >
                  <Text style={[styles.safetyBadgeText, { color: currentSafety.color }]}>
                    {currentSafety.label}
                  </Text>
                </View>
              </View>

              {/* Caution if delta is too aggressive */}
              {requiredDailyDelta > 850 && (
                <View
                  style={[
                    styles.warningNotice,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#FEF2F2',
                      borderColor: '#EF4444',
                    },
                  ]}
                >
                  <AlertTriangle size={15} color="#EF4444" />
                  <Text style={[styles.warningText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                    {goalDirection === 'lose'
                      ? `This timeline requires a massive deficit of -${requiredDailyDelta} kcal/day. Consider extending your timeframe to protect metabolic rate and muscle.`
                      : `A surplus of +${requiredDailyDelta} kcal/day exceeds muscle synthesis speed and will lead to significant unwanted fat gain. Aim for +300 to +500 kcal.`}
                  </Text>
                </View>
              )}

              {/* 4 Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Total Energy */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    TOTAL CALORIES NEEDED
                  </Text>
                  <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                    {isLoss ? '-' : '+'}
                    {totalCaloriesRequired.toLocaleString()}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    To {isLoss ? 'lose' : 'gain'} {targetWeight} {unit}
                  </Text>
                </View>

                {/* Required Daily Delta */}
                <View
                  style={[
                    styles.metricCard,
                    styles.metricCardHighlight,
                    {
                      backgroundColor: isDark
                        ? 'rgba(79, 70, 229, 0.15)'
                        : '#EEF2FF',
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.primary }]}>
                    {isLoss ? 'REQUIRED DAILY DEFICIT' : 'REQUIRED DAILY SURPLUS'}
                  </Text>
                  <Text style={[styles.metricValueLarge, { color: theme.primary }]}>
                    {isLoss ? `-${requiredDailyDelta}` : `+${requiredDailyDelta}`}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textSecondary }]}>
                    kcal {isLoss ? 'below' : 'above'} TDEE per day
                  </Text>
                </View>

                {/* Weekly & Monthly */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    WEEKLY & MONTHLY PACE
                  </Text>
                  <Text style={[styles.metricValue, { color: '#0EA5E9' }]}>
                    {isLoss ? '-' : '+'}
                    {requiredWeeklyCalories.toLocaleString()}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    ~{goalWeeklyPace} {unit}/wk ({isLoss ? '-' : '+'}
                    {requiredMonthlyCalories.toLocaleString()} /mo)
                  </Text>
                </View>

                {/* Estimated Duration */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    ESTIMATED DURATION
                  </Text>
                  <Text style={[styles.metricValue, { color: '#10B981' }]}>
                    {computedDurationDays} Days
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    ~{(computedDurationDays / 7).toFixed(1)} weeks
                  </Text>
                </View>
              </View>

              {/* Suggested Daily Intake Bar */}
              <View
                style={[
                  styles.intakeRecommendationRow,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.intakeTextGroup}>
                  <Text style={[styles.intakeLabel, { color: theme.textMuted }]}>
                    TARGET DAILY CALORIE INTAKE:
                  </Text>
                  <View style={styles.intakeNumbersRow}>
                    <Text style={[styles.intakeBigNumber, { color: theme.textPrimary }]}>
                      {goalSuggestedIntake.toLocaleString()}{' '}
                      <Text style={styles.intakeUnit}>kcal/day</Text>
                    </Text>
                    <Text style={[styles.intakeFormula, { color: theme.textMuted }]}>
                      ({maintenanceTdee} TDEE {isLoss ? `- ${requiredDailyDelta} deficit` : `+ ${requiredDailyDelta} surplus`})
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    handleApplyToGoals(requiredDailyDelta, goalSuggestedIntake)
                  }
                  style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                >
                  <Sparkles size={14} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>Apply Target</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* EDUCATIONAL SCIENCE ACCORDION */}
      <View style={styles.scienceSection}>
        <View style={styles.scienceSectionHeader}>
          <Info size={16} color={theme.primary} />
          <Text style={[styles.scienceSectionTitle, { color: theme.textPrimary }]}>
            {goalDirection === 'lose'
              ? 'Fat Loss Principles & Thermodynamics'
              : 'Muscle Hypertrophy & Weight Gain Principles'}
          </Text>
        </View>

        {/* Card 1 */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === 'science7700' ? null : 'science7700')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>01</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                {goalDirection === 'lose'
                  ? 'Why 1 kg of Fat = 7,700 kcal (and 1 lb = 3,500 kcal)'
                  : 'The Energy Cost of Muscle Synthesis (Why 7,700 kcal/kg?)'}
              </Text>
            </View>
            {expandedTopic === 'science7700' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === 'science7700' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              {goalDirection === 'lose' ? (
                <>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    Human adipose tissue consists of approximately <Text style={styles.boldText}>87% stored triglycerides</Text> and <Text style={styles.boldText}>13% intracellular water and structural matrix</Text>.
                  </Text>
                  <Text style={[styles.accordionFormula, { color: theme.primary }]}>
                    Formula: 1,000g × 0.87 lipids × 9.0 kcal/g ≈ 7,700 kcal per kg (or 3,500 kcal per lb).
                  </Text>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    Therefore, burning 500 kcal below your maintenance daily burns exactly 3,500 kcal in a week, equating to ~0.45 kg (1 lb) of body fat.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    Building 1 kg of skeletal muscle tissue requires not just raw building blocks, but heavy metabolic energy to power myofibrillar protein synthesis (MPS) and glycogen storage.
                  </Text>
                  <Text style={[styles.accordionFormula, { color: theme.primary }]}>
                    Synthesizing 1 kg of lean contractile muscle requires an accumulated surplus of approximately 7,700 kcal energy above maintenance.
                  </Text>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    If you eat at maintenance or in deficit, muscle protein synthesis cannot overcome breakdown, stalling hypertrophy.
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Card 2 */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === 'leanVsDirty' ? null : 'leanVsDirty')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>02</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                {goalDirection === 'lose'
                  ? 'Water Weight vs. Pure Fat (The Scale Trap)'
                  : 'Lean Bulking vs. Dirty Bulking: The Muscle Speed Limit'}
              </Text>
            </View>
            {expandedTopic === 'leanVsDirty' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === 'leanVsDirty' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              {goalDirection === 'lose' ? (
                <>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    Every gram of stored glycogen in muscles binds <Text style={styles.boldText}>3 to 4 grams of water</Text>. In the first 5 days of a deficit, your body dumps glycogen stores, shedding 1.5–3 kg of water weight rapidly.
                  </Text>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    After week 1, the scale slows down to your true biological fat loss rate (0.3–0.9 kg/wk). Do not get discouraged when the drop slows—that is when pure fat oxidation begins!
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    Natural muscle growth has a biological ceiling: for intermediate lifters, maximum pure muscle growth is roughly <Text style={styles.boldText}>0.5 kg to 1.0 kg (1–2 lbs) per month</Text>.
                  </Text>
                  <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                    A controlled surplus of <Text style={styles.boldText}>+250 to +400 kcal/day</Text> provides 100% of the energy needed for muscle synthesis. Gaining weight faster than 1.5 kg/month simply deposits excess calories into fat cells without speeding up muscle growth.
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Card 3 */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === 'proteinRule' ? null : 'proteinRule')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>03</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                {goalDirection === 'lose'
                  ? 'How to Prevent Muscle Loss in a Deficit'
                  : 'Protein & Progressive Overload Synergy'}
              </Text>
            </View>
            {expandedTopic === 'proteinRule' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === 'proteinRule' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                {goalDirection === 'lose'
                  ? 'To force your body to burn fat instead of muscle tissue:'
                  : 'To ensure excess calories convert into muscle instead of adipose fat:'}
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
                  • <Text style={styles.boldText}>Optimal Protein:</Text> Consume 1.6–2.2 grams of protein per kg of bodyweight (0.8–1.0 g/lb).
                </Text>
                <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
                  • <Text style={styles.boldText}>Resistance Training:</Text> Heavy compound lifts send the anabolic signal that muscle tissue is essential.
                </Text>
                <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
                  • <Text style={styles.boldText}>Hydration & Sleep:</Text> Sleep releases 70% of daily human growth hormone (HGH) for cellular repair.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Speedometer BMI Calculator Modal */}
      <BmiCalculatorModal
        visible={bmiModalOpen}
        onClose={() => setBmiModalOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  goalSelectorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bmiTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  bmiTriggerBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  goalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  goalDirectionBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
    cursor: 'pointer' as any,
  },
  goalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTextGroup: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  goalSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  scienceBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  scienceBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scienceBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  scienceBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  modeSegment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'transparent',
    cursor: 'pointer' as any,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    fontWeight: '700',
  },
  unitToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    cursor: 'pointer' as any,
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tdeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  tdeeLabelGroup: {
    flex: 1,
    minWidth: 180,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputHint: {
    fontSize: 10,
    marginTop: 2,
  },
  numberInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  numberInput: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  unitSuffix: {
    fontSize: 11,
    marginLeft: 4,
  },
  calculatorSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetSub: {
    fontSize: 10,
    marginTop: 2,
  },
  customDeficitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  stepperBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  horizonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  horizonPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  horizonPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  horizonPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeframeToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeframeTypeBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  timeframeTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultsContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  resultsHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  safetyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  safetyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  safetyDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricCardHighlight: {
    borderWidth: 1.5,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricValueLarge: {
    fontSize: 20,
    fontWeight: '900',
  },
  metricSub: {
    fontSize: 10,
    marginTop: 2,
  },
  intakeRecommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  intakeTextGroup: {
    flex: 1,
    minWidth: 180,
  },
  intakeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  intakeNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  intakeBigNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  intakeUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  intakeFormula: {
    fontSize: 11,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scienceSection: {
    marginBottom: 30,
    gap: 10,
  },
  scienceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scienceSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  accordionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    cursor: 'pointer' as any,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  accordionNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  accordionBody: {
    borderTopWidth: 1,
    padding: 14,
    gap: 8,
  },
  accordionText: {
    fontSize: 12,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
  accordionFormula: {
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 2,
  },
  bulletList: {
    gap: 4,
    marginTop: 2,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 18,
  },
});
