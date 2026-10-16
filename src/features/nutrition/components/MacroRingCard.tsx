import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';
import { DayNutritionSummary } from '../../../types/nutrition';
import { Scale, Flame, TrendingDown, TrendingUp, SlidersHorizontal } from 'lucide-react-native';

interface MacroRingCardProps {
  summary: DayNutritionSummary;
  onPressEditGoals?: () => void;
  onPressCalculator?: () => void;
}

export const MacroRingCard: React.FC<MacroRingCardProps> = ({
  summary,
  onPressEditGoals,
  onPressCalculator,
}) => {
  const { theme, isDark } = useTheme();

  const size = 150;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const calRatio = summary.calorieTarget > 0 ? summary.totalCalories / summary.calorieTarget : 0;
  const clampedRatio = Math.min(1, Math.max(0, calRatio));
  const strokeDashoffset = circumference - circumference * clampedRatio;

  // Macro progress percentages
  const proteinRatio = summary.proteinTarget > 0 ? summary.totalProtein / summary.proteinTarget : 0;
  const carbsRatio = summary.carbsTarget > 0 ? summary.totalCarbs / summary.carbsTarget : 0;
  const fatRatio = summary.fatTarget > 0 ? summary.totalFat / summary.fatTarget : 0;

  // Deficit / Surplus calculation
  const isDeficit = summary.deficitVsMaintenance >= 0;
  const deficitAbs = Math.abs(summary.deficitVsMaintenance);

  return (
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
      {/* Top Header Row with Goal Pill and Edit Button */}
      <View style={styles.headerRow}>
        <View style={styles.goalBadgeWrapper}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!onPressCalculator}
            onPress={onPressCalculator}
            style={[
              styles.goalPill,
              {
                backgroundColor: isDeficit
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : '#ECFDF5'
                  : isDark
                  ? 'rgba(245, 158, 11, 0.15)'
                  : '#FFFBEB',
                borderColor: isDeficit
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.3)'
                    : '#A7F3D0'
                  : isDark
                  ? 'rgba(245, 158, 11, 0.3)'
                  : '#FDE68A',
                cursor: onPressCalculator ? ('pointer' as any) : undefined,
              },
            ]}
          >
            {isDeficit ? (
              <TrendingDown size={14} color={isDark ? '#34D399' : '#059669'} />
            ) : (
              <TrendingUp size={14} color={isDark ? '#FBBF24' : '#D97706'} />
            )}
            <Text
              style={[
                styles.goalPillText,
                { color: isDeficit ? (isDark ? '#34D399' : '#047857') : isDark ? '#FBBF24' : '#B45309' },
              ]}
            >
              {isDeficit ? `Deficit: -${deficitAbs} kcal` : `Surplus: +${deficitAbs} kcal`}
            </Text>
            {onPressCalculator && (
              <Scale size={11} color={isDeficit ? (isDark ? '#34D399' : '#059669') : isDark ? '#FBBF24' : '#B45309'} style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>
        </View>

        {onPressEditGoals && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPressEditGoals}
            style={[
              styles.editGoalsBtn,
              { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
            ]}
          >
            <SlidersHorizontal size={13} color={theme.textSecondary} />
            <Text style={[styles.editGoalsText, { color: theme.textSecondary }]}>Targets</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Row: SVG Calorie Ring + Stats */}
      <View style={styles.mainRow}>
        {/* Calorie Ring */}
        <View style={styles.ringWrapper}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {/* Background Track */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={isDark ? '#27272A' : '#F4F4F5'}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress Track */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={
                  calRatio > 1.05
                    ? '#F43F5E' // Red if over
                    : '#4F46E5' // Indigo primary
                }
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </G>
          </Svg>

          <View style={styles.ringCenterText}>
            <Flame
              size={18}
              color={calRatio > 1.05 ? '#F43F5E' : '#4F46E5'}
              style={{ marginBottom: 2 }}
            />
            <Text style={[styles.consumedCals, { color: theme.textPrimary }]}>
              {summary.totalCalories}
            </Text>
            <Text style={[styles.calsUnit, { color: theme.textMuted }]}>
              / {summary.calorieTarget} kcal
            </Text>
          </View>
        </View>

        {/* Right Info: Consumed, Target, Remaining */}
        <View style={styles.infoColumn}>
          <View style={[styles.metricTile, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
            <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>Remaining</Text>
            <Text
              style={[
                styles.metricTileValue,
                {
                  color:
                    summary.remainingCalories >= 0
                      ? isDark
                        ? '#34D399'
                        : '#059669'
                      : '#F43F5E',
                },
              ]}
            >
              {summary.remainingCalories >= 0
                ? `${summary.remainingCalories} kcal`
                : `${Math.abs(summary.remainingCalories)} over`}
            </Text>
          </View>

          <View style={[styles.metricTile, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
            <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>Daily Target</Text>
            <Text style={[styles.metricTileValue, { color: theme.textPrimary }]}>
              {summary.calorieTarget} kcal
            </Text>
          </View>

          <View style={[styles.metricTile, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
            <Text style={[styles.metricTileLabel, { color: theme.textMuted }]}>Deficit Status</Text>
            <Text style={[styles.metricTileValue, { color: isDark ? '#A5B4FC' : '#4F46E5' }]}>
              {isDeficit ? '🔥 Fat Loss Pace' : '⚡ Surplus Mode'}
            </Text>
          </View>
        </View>
      </View>

      {/* Macro Split Progress Meters */}
      <View style={[styles.macroSection, { borderTopColor: theme.border }]}>
        <View style={styles.macroHeaderRow}>
          <Text style={[styles.macroSectionTitle, { color: theme.textSecondary }]}>
            Macronutrient Distribution
          </Text>
          <View style={styles.macroRatioBadges}>
            <Text style={[styles.ratioText, { color: '#10B981' }]}>
              {summary.macroPercentages.proteinPct}% P
            </Text>
            <Text style={[styles.ratioDot, { color: theme.textMuted }]}>•</Text>
            <Text style={[styles.ratioText, { color: '#F59E0B' }]}>
              {summary.macroPercentages.carbsPct}% C
            </Text>
            <Text style={[styles.ratioDot, { color: theme.textMuted }]}>•</Text>
            <Text style={[styles.ratioText, { color: '#EC4899' }]}>
              {summary.macroPercentages.fatPct}% F
            </Text>
          </View>
        </View>

        <View style={styles.macroBarsRow}>
          {/* Protein Bar */}
          <View style={styles.macroBarCard}>
            <View style={styles.macroCardHeader}>
              <View style={[styles.macroColorIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.macroName, { color: theme.textPrimary }]}>Protein</Text>
            </View>
            <Text style={[styles.macroValues, { color: theme.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{Math.round(summary.totalProtein)}g</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}> / {summary.proteinTarget}g</Text>
            </Text>
            <View style={[styles.barTrack, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, Math.round(proteinRatio * 100))}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.macroPctLabel,
                { color: proteinRatio >= 1 ? '#10B981' : theme.textMuted },
              ]}
            >
              {Math.round(proteinRatio * 100)}%
              {proteinRatio < 1 && (
                <Text style={{ color: '#F59E0B', fontSize: 10 }}> ({Math.round(summary.proteinTarget - summary.totalProtein)}g left)</Text>
              )}
            </Text>
          </View>

          {/* Carbs Bar */}
          <View style={styles.macroBarCard}>
            <View style={styles.macroCardHeader}>
              <View style={[styles.macroColorIndicator, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.macroName, { color: theme.textPrimary }]}>Carbs</Text>
            </View>
            <Text style={[styles.macroValues, { color: theme.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{Math.round(summary.totalCarbs)}g</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}> / {summary.carbsTarget}g</Text>
            </Text>
            <View style={[styles.barTrack, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, Math.round(carbsRatio * 100))}%`,
                    backgroundColor: '#F59E0B',
                  },
                ]}
              />
            </View>
            <Text style={[styles.macroPctLabel, { color: theme.textMuted }]}>
              {Math.round(carbsRatio * 100)}%
            </Text>
          </View>

          {/* Fat Bar */}
          <View style={styles.macroBarCard}>
            <View style={styles.macroCardHeader}>
              <View style={[styles.macroColorIndicator, { backgroundColor: '#EC4899' }]} />
              <Text style={[styles.macroName, { color: theme.textPrimary }]}>Fats</Text>
            </View>
            <Text style={[styles.macroValues, { color: theme.textPrimary }]}>
              <Text style={{ fontWeight: '800' }}>{Math.round(summary.totalFat)}g</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}> / {summary.fatTarget}g</Text>
            </Text>
            <View style={[styles.barTrack, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, Math.round(fatRatio * 100))}%`,
                    backgroundColor: '#EC4899',
                  },
                ]}
              />
            </View>
            <Text style={[styles.macroPctLabel, { color: theme.textMuted }]}>
              {Math.round(fatRatio * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  goalBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  goalPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editGoalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  editGoalsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  ringWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedCals: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  calsUnit: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  infoColumn: {
    flex: 1,
    gap: 8,
  },
  metricTile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricTileLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricTileValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  macroSection: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  macroSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  macroRatioBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratioText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratioDot: {
    fontSize: 10,
  },
  macroBarsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroBarCard: {
    flex: 1,
    gap: 4,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroValues: {
    fontSize: 12,
    marginTop: 2,
  },
  barTrack: {
    height: 7,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  macroPctLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
