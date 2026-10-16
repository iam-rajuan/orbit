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
  Flame,
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
} from 'lucide-react-native';

const CALORIES_PER_KG_FAT = 7700;
const CALORIES_PER_LB_FAT = 3500;

export const FatLossCalculatorView: React.FC = () => {
  const { theme, isDark } = useTheme();

  const { goals, updateGoals } = useNutritionStore();

  // Unit toggle: kg or lbs
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');

  // Mode: byDeficit (input daily calorie deficit -> output weight burn)
  // or byGoal (input target weight to lose -> output required deficit & timeline)
  const [mode, setMode] = useState<'byDeficit' | 'byGoal'>('byDeficit');

  // By Deficit inputs
  const [dailyDeficit, setDailyDeficit] = useState<number>(
    goals.targetDeficit > 0 ? goals.targetDeficit : 500
  );
  const [maintenanceTdee, setMaintenanceTdee] = useState<number>(
    goals.maintenanceCalories > 0 ? goals.maintenanceCalories : 2400
  );
  const [horizonDays, setHorizonDays] = useState<number>(90); // 3-month forecast default

  // By Goal inputs
  const [targetWeight, setTargetWeight] = useState<number>(unit === 'kg' ? 5 : 11);
  const [goalTimeframeType, setGoalTimeframeType] = useState<'days' | 'pace'>('days');
  const [targetDays, setTargetDays] = useState<number>(60);
  const [weeklyPace, setWeeklyPace] = useState<number>(unit === 'kg' ? 0.5 : 1.1);

  // Expanded science cards
  const [expandedTopic, setExpandedTopic] = useState<string | null>('7700rule');

  // Toast notice for applied goals
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Conversion helpers
  const caloriesPerUnit = unit === 'kg' ? CALORIES_PER_KG_FAT : CALORIES_PER_LB_FAT;

  // Mode 1: By Deficit Calculations
  const dailyBurnGrams = (dailyDeficit / CALORIES_PER_KG_FAT) * 1000;
  const dailyBurnLbs = dailyDeficit / CALORIES_PER_LB_FAT;
  const weeklyLoss = (dailyDeficit * 7) / caloriesPerUnit;
  const monthlyLoss = (dailyDeficit * 30) / caloriesPerUnit;
  const horizonLoss = (dailyDeficit * horizonDays) / caloriesPerUnit;
  const horizonTotalCalories = dailyDeficit * horizonDays;
  const suggestedIntake = Math.max(1200, maintenanceTdee - dailyDeficit);

  // Mode 2: By Goal Calculations
  const totalCaloriesToBurn = targetWeight * caloriesPerUnit;
  let requiredDailyDeficit = 0;
  let computedDays = 0;

  if (goalTimeframeType === 'days') {
    computedDays = Math.max(1, targetDays);
    requiredDailyDeficit = Math.round(totalCaloriesToBurn / computedDays);
  } else {
    // By pace
    const weeklyCalories = weeklyPace * caloriesPerUnit;
    requiredDailyDeficit = Math.round(weeklyCalories / 7);
    computedDays = Math.round((targetWeight / Math.max(0.1, weeklyPace)) * 7);
  }

  const requiredWeeklyDeficit = requiredDailyDeficit * 7;
  const requiredMonthlyDeficit = requiredDailyDeficit * 30;
  const goalSuggestedIntake = Math.max(1200, maintenanceTdee - requiredDailyDeficit);
  const goalWeeklyPace = (targetWeight / (computedDays / 7)).toFixed(2);

  // Deficit safety evaluator
  const getSafetyProfile = (deficitVal: number) => {
    if (deficitVal <= 350) {
      return {
        label: 'Mild & Highly Sustainable',
        color: '#10B981',
        desc: 'Gentle fat loss with virtually zero hunger or metabolic slowdown.',
        badge: 'Easy',
      };
    }
    if (deficitVal <= 650) {
      return {
        label: 'Optimal & Recommended',
        color: '#0EA5E9',
        desc: 'The gold standard for athletic fat loss. Maximizes fat oxidation while sparing muscle.',
        badge: 'Recommended',
      };
    }
    if (deficitVal <= 900) {
      return {
        label: 'Aggressive Cut',
        color: '#F59E0B',
        desc: 'Fast results. High protein (1.8g+/kg) and heavy resistance training are essential.',
        badge: 'Aggressive',
      };
    }
    return {
      label: 'Extreme / Metabolic Risk',
      color: '#EF4444',
      desc: 'High risk of muscle catabolism, lethargy, and thyroid downregulation. Keep brief.',
      badge: 'High Risk',
    };
  };

  const currentSafety = getSafetyProfile(
    mode === 'byDeficit' ? dailyDeficit : requiredDailyDeficit
  );

  // Apply to Store Goals handler
  const handleApplyToGoals = async (deficitVal: number, intakeVal: number) => {
    await updateGoals({
      ...goals,
      calorieTarget: Math.round(intakeVal),
      maintenanceCalories: Math.round(maintenanceTdee),
      targetDeficit: Math.round(deficitVal),
      goalType: 'cut',
    });
    setAppliedNotice(
      `Applied! Daily Target: ${Math.round(intakeVal)} kcal (-${Math.round(deficitVal)} kcal deficit)`
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

      {/* Top Hero Science Banner */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isDark ? 'rgba(79, 70, 229, 0.12)' : '#EEF2FF',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : '#C7D2FE',
          },
        ]}
      >
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleRow}>
            <View style={styles.flameBadge}>
              <Flame size={18} color="#4F46E5" />
            </View>
            <View>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                The Science of Fat Loss
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                Thermodynamic facts, calorie mathematics & customizable burn calculator
              </Text>
            </View>
          </View>
        </View>

        {/* Fact Pills Row */}
        <View style={styles.factsRow}>
          <View
            style={[
              styles.factPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Scale size={14} color="#0EA5E9" />
            <Text style={[styles.factPillBold, { color: theme.textPrimary }]}>
              1 kg Fat ≈ 7,700 kcal
            </Text>
            <Text style={[styles.factPillSub, { color: theme.textMuted }]}>
              (87% lipids + 13% water)
            </Text>
          </View>

          <View
            style={[
              styles.factPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Scale size={14} color="#8B5CF6" />
            <Text style={[styles.factPillBold, { color: theme.textPrimary }]}>
              1 lb Fat ≈ 3,500 kcal
            </Text>
            <Text style={[styles.factPillSub, { color: theme.textMuted }]}>
              (500 kcal/day = 1 lb/wk)
            </Text>
          </View>

          <View
            style={[
              styles.factPill,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Zap size={14} color="#10B981" />
            <Text style={[styles.factPillBold, { color: theme.textPrimary }]}>
              Safe Pace: 0.5–1% / wk
            </Text>
            <Text style={[styles.factPillSub, { color: theme.textMuted }]}>
              (Preserves 100% muscle)
            </Text>
          </View>
        </View>
      </View>

      {/* Calculator Container */}
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
        {/* Unit and Mode Controls */}
        <View style={styles.controlsRow}>
          {/* Mode Switcher */}
          <View
            style={[
              styles.modeSegment,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('byDeficit')}
              style={[
                styles.modeBtn,
                mode === 'byDeficit' && {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Flame
                size={13}
                color={mode === 'byDeficit' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'byDeficit' ? theme.primary : theme.textSecondary },
                  mode === 'byDeficit' && styles.modeBtnTextActive,
                ]}
              >
                By Calorie Deficit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('byGoal')}
              style={[
                styles.modeBtn,
                mode === 'byGoal' && {
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Target
                size={13}
                color={mode === 'byGoal' ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === 'byGoal' ? theme.primary : theme.textSecondary },
                  mode === 'byGoal' && styles.modeBtnTextActive,
                ]}
              >
                By Weight Goal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Unit Toggle (kg vs lbs) */}
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
                  setWeeklyPace(0.5);
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
                  setWeeklyPace(1.1);
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

        {/* Maintenance TDEE Base Setup */}
        <View style={styles.tdeeRow}>
          <View style={styles.tdeeLabelGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Estimated Maintenance TDEE:
            </Text>
            <Text style={[styles.inputHint, { color: theme.textMuted }]}>
              (Calories you burn daily to stay the same weight)
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

        {/* MODE 1: BY DEFICIT INTERFACE */}
        {mode === 'byDeficit' ? (
          <View style={styles.calculatorSection}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              1. Choose Daily Calorie Deficit
            </Text>

            {/* Quick Presets */}
            <View style={styles.presetsGrid}>
              {[
                { label: 'Mild (-300)', val: 300, sub: 'Easy & Gentle' },
                { label: 'Optimal (-500)', val: 500, sub: 'Recommended' },
                { label: 'Aggressive (-750)', val: 750, sub: 'Fast Results' },
                { label: 'Intense (-1,000)', val: 1000, sub: 'Max Cut' },
              ].map((p) => {
                const active = dailyDeficit === p.val;
                return (
                  <TouchableOpacity
                    key={p.val}
                    activeOpacity={0.7}
                    onPress={() => setDailyDeficit(p.val)}
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

            {/* Custom Deficit Stepper */}
            <View style={styles.customDeficitRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Custom Daily Deficit:
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setDailyDeficit(Math.max(100, dailyDeficit - 50))}
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
                    value={dailyDeficit.toString()}
                    onChangeText={(v) => {
                      const n = parseInt(v, 10);
                      if (!isNaN(n)) setDailyDeficit(Math.max(50, n));
                    }}
                  />
                  <Text style={[styles.unitSuffix, { color: theme.textMuted }]}>kcal/day</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setDailyDeficit(dailyDeficit + 50)}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.textPrimary }]}>+50</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Horizon Selection */}
            <View style={styles.horizonRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Forecast Projection Horizon:
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
                  Projected Fat & Weight Burn
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

              {/* Grid of Results: Day, Week, Month, Horizon */}
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
                  <Text style={[styles.metricValue, { color: '#0EA5E9' }]}>
                    {unit === 'kg'
                      ? `${Math.round(dailyBurnGrams)} g`
                      : `${dailyBurnLbs.toFixed(2)} lbs`}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    -{dailyDeficit} kcal burn
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
                  <Text style={[styles.metricValue, { color: '#10B981' }]}>
                    {weeklyLoss.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    -{(dailyDeficit * 7).toLocaleString()} kcal
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
                  <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                    {monthlyLoss.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    -{(dailyDeficit * 30).toLocaleString()} kcal
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
                    {horizonLoss.toFixed(2)} {unit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textSecondary }]}>
                    -{horizonTotalCalories.toLocaleString()} total kcal
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
                      {suggestedIntake.toLocaleString()}{' '}
                      <Text style={styles.intakeUnit}>kcal/day</Text>
                    </Text>
                    <Text style={[styles.intakeFormula, { color: theme.textMuted }]}>
                      ({maintenanceTdee} TDEE - {dailyDeficit} deficit)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleApplyToGoals(dailyDeficit, suggestedIntake)}
                  style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                >
                  <Sparkles size={14} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>Apply Target</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* MODE 2: BY WEIGHT GOAL INTERFACE */
          <View style={styles.calculatorSection}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              1. How Much Weight Do You Want to Lose?
            </Text>

            {/* Target Weight Stepper */}
            <View style={styles.customDeficitRow}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Target Fat/Weight Loss:
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

            {/* Timeframe selector: by Days or by Weekly Pace */}
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
                onPress={() => setGoalTimeframeType('days')}
                style={[
                  styles.timeframeTypeBtn,
                  {
                    backgroundColor:
                      goalTimeframeType === 'days'
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                    borderColor:
                      goalTimeframeType === 'days' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Clock
                  size={14}
                  color={goalTimeframeType === 'days' ? theme.primary : theme.textMuted}
                />
                <Text
                  style={[
                    styles.timeframeTypeText,
                    {
                      color:
                        goalTimeframeType === 'days'
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
                onPress={() => setGoalTimeframeType('pace')}
                style={[
                  styles.timeframeTypeBtn,
                  {
                    backgroundColor:
                      goalTimeframeType === 'pace'
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF'
                        : theme.surfaceSubtle,
                    borderColor:
                      goalTimeframeType === 'pace' ? theme.primary : theme.border,
                  },
                ]}
              >
                <Scale
                  size={14}
                  color={goalTimeframeType === 'pace' ? theme.primary : theme.textMuted}
                />
                <Text
                  style={[
                    styles.timeframeTypeText,
                    {
                      color:
                        goalTimeframeType === 'pace'
                          ? theme.primary
                          : theme.textSecondary,
                    },
                  ]}
                >
                  Set Weekly Pace (e.g. 0.5 {unit}/wk)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Timeframe Input Controls */}
            {goalTimeframeType === 'days' ? (
              <View style={styles.horizonRow}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Desired Days to Reach Goal:
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
                  Weekly Weight Burn Pace:
                </Text>
                <View style={styles.horizonPills}>
                  {(unit === 'kg' ? [0.25, 0.5, 0.75, 1.0] : [0.5, 1.0, 1.5, 2.0]).map(
                    (p) => (
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
                    )
                  )}
                </View>
              </View>
            )}

            {/* GOAL RESULTS DASHBOARD */}
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
                  Required Calorie Burn Strategy
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

              {/* Caution if deficit is excessive */}
              {requiredDailyDeficit > 900 && (
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
                    This timeline requires a massive deficit of -{requiredDailyDeficit} kcal/day. Consider extending your timeframe to protect metabolic rate and prevent muscle loss.
                  </Text>
                </View>
              )}

              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                {/* Total Energy */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    TOTAL DEFICIT TO BURN
                  </Text>
                  <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                    {totalCaloriesToBurn.toLocaleString()}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    Total kcal to lose {targetWeight} {unit}
                  </Text>
                </View>

                {/* Required Daily Deficit */}
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
                    REQUIRED DAILY DEFICIT
                  </Text>
                  <Text style={[styles.metricValueLarge, { color: theme.primary }]}>
                    -{requiredDailyDeficit}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textSecondary }]}>
                    kcal below TDEE every day
                  </Text>
                </View>

                {/* Weekly Deficit */}
                <View
                  style={[
                    styles.metricCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                    WEEKLY & MONTHLY DEFICIT
                  </Text>
                  <Text style={[styles.metricValue, { color: '#0EA5E9' }]}>
                    -{requiredWeeklyDeficit.toLocaleString()}
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    ~{goalWeeklyPace} {unit}/wk (-{requiredMonthlyDeficit.toLocaleString()} /mo)
                  </Text>
                </View>

                {/* Time to Complete */}
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
                    {computedDays} Days
                  </Text>
                  <Text style={[styles.metricSub, { color: theme.textMuted }]}>
                    ~{(computedDays / 7).toFixed(1)} weeks
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
                      ({maintenanceTdee} TDEE - {requiredDailyDeficit} deficit)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    handleApplyToGoals(requiredDailyDeficit, goalSuggestedIntake)
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

      {/* EDUCATIONAL SCIENCE SECTION */}
      <View style={styles.scienceSection}>
        <View style={styles.scienceSectionHeader}>
          <Info size={16} color={theme.primary} />
          <Text style={[styles.scienceSectionTitle, { color: theme.textPrimary }]}>
            Informative Fat Loss Truths & Principles
          </Text>
        </View>

        {/* Accordion 1: Why 7,700 kcal? */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === '7700rule' ? null : '7700rule')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>01</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                Why does 1 kg of fat require 7,700 kcal to burn?
              </Text>
            </View>
            {expandedTopic === '7700rule' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === '7700rule' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                Pure dietary triglyceride fat provides 9 kcal per gram. However, human body adipose tissue is not 100% pure oil — it consists of approximately <Text style={styles.boldText}>87% stored triglycerides</Text> and <Text style={styles.boldText}>13% intracellular water, connective collagen, and enzymes</Text>.
              </Text>
              <Text style={[styles.accordionFormula, { color: theme.primary }]}>
                Calculation: 1,000 g × 0.87 lipids × 9.0 kcal/g ≈ 7,830 kcal (standardized to ~7,700 kcal in clinical sports nutrition).
              </Text>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                In imperial units: 1 lb = 0.4536 kg × 7,700 kcal ≈ <Text style={styles.boldText}>3,500 kcal per pound</Text>.
              </Text>
            </View>
          )}
        </View>

        {/* Accordion 2: The Water Weight & Glycogen Trap */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === 'waterweight' ? null : 'waterweight')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>02</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                Why does weight drop fast in week 1, then slow down?
              </Text>
            </View>
            {expandedTopic === 'waterweight' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === 'waterweight' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                Your body stores 400g to 600g of carbohydrates as glycogen in muscles and liver. <Text style={styles.boldText}>Each gram of stored glycogen binds 3 to 4 grams of water.</Text>
              </Text>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                When you initiate a calorie deficit or reduce carbs, your body burns stored glycogen, dumping up to 1.5–3 kg (3–6 lbs) of water weight in the first 5 days. Once glycogen stabilizes, the scale reflects true fat loss, matching the steady 7,700 kcal / kg thermodynamic curve.
              </Text>
            </View>
          )}
        </View>

        {/* Accordion 3: Muscle Preservation & Protein */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === 'protein' ? null : 'protein')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>03</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                How to ensure you burn pure fat instead of muscle
              </Text>
            </View>
            {expandedTopic === 'protein' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === 'protein' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                When in a deficit, your body can synthesize energy from either body fat or muscle amino acids. To force your body to spare muscle:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
                  • <Text style={styles.boldText}>High Protein:</Text> Consume 1.6 to 2.2 grams of protein per kg of body weight (0.8–1.0 g/lb).
                </Text>
                <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
                  • <Text style={styles.boldText}>Resistance Training:</Text> Lifting weights sends an anabolic signal that muscle tissue is actively required.
                </Text>
                <Text style={[styles.bulletItem, { color: theme.textSecondary }]}>
                  • <Text style={styles.boldText}>Keep Deficit Moderate:</Text> Extreme deficits (&gt;1,000 kcal) cause the liver to convert muscle proteins to glucose via gluconeogenesis.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Accordion 4: Adaptive Thermogenesis & Plateaus */}
        <View
          style={[
            styles.accordionCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setExpandedTopic(expandedTopic === 'neat' ? null : 'neat')
            }
            style={styles.accordionHeader}
          >
            <View style={styles.accordionTitleRow}>
              <Text style={[styles.accordionNumber, { color: theme.primary }]}>04</Text>
              <Text style={[styles.accordionTitle, { color: theme.textPrimary }]}>
                What causes weight loss plateaus? (Adaptive Thermogenesis)
              </Text>
            </View>
            {expandedTopic === 'neat' ? (
              <ChevronUp size={16} color={theme.textMuted} />
            ) : (
              <ChevronDown size={16} color={theme.textMuted} />
            )}
          </TouchableOpacity>

          {expandedTopic === 'neat' && (
            <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                As you lose weight, two things happen: (1) A smaller body requires fewer calories to move, and (2) your subconscious NEAT (fidgeting, walking speed, posture) drops to conserve energy.
              </Text>
              <Text style={[styles.accordionText, { color: theme.textSecondary }]}>
                To break plateaus: Track daily steps (maintain 8,000–10,000 steps), take a 1-week maintenance diet break every 8–12 weeks to reset leptin and thyroid hormones, and recalculate your TDEE as your body mass decreases.
              </Text>
            </View>
          )}
        </View>
      </View>
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
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  heroHeader: {
    marginBottom: 12,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  factsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  factPillBold: {
    fontSize: 11,
    fontWeight: '700',
  },
  factPillSub: {
    fontSize: 10,
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
