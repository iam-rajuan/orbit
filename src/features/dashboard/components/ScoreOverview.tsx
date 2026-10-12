import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ProgressMetric {
  label: string;
  value: number; // percentage 0-100
  color: string;
  displayValue: string;
}

interface ScoreOverviewProps {
  score: number;
  scoreLabel?: string;
  statusText?: string;
  statusColor?: string;
  metrics: ProgressMetric[];
  style?: ViewStyle;
}

/**
 * A premium linear progress-based score overview.
 * Replaces circular ring gauges with clean horizontal progress bars
 * and a large score display — inspired by Linear, Stripe, and Vercel dashboards.
 */
export const ScoreOverview: React.FC<ScoreOverviewProps> = ({
  score,
  scoreLabel = 'Productivity',
  statusText,
  statusColor,
  metrics,
  style,
}) => {
  const { theme, isDark } = useTheme();

  const effectiveStatusColor = statusColor || theme.success;

  return (
    <View style={[styles.container, style]}>
      {/* Score Display */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreValueRow}>
          <Text style={[styles.scoreValue, { color: theme.textPrimary }]}>
            {score}
          </Text>
          <Text style={[styles.scorePercent, { color: theme.textMuted }]}>
            %
          </Text>
        </View>
        <View style={styles.scoreMeta}>
          <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
            {scoreLabel}
          </Text>
          {statusText && (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark
                    ? `${effectiveStatusColor}18`
                    : `${effectiveStatusColor}14`,
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: effectiveStatusColor }]}
              />
              <Text style={[styles.statusText, { color: effectiveStatusColor }]}>
                {statusText}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Overall progress bar */}
      <View style={styles.overallBarContainer}>
        <View
          style={[
            styles.overallBarTrack,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
            },
          ]}
        >
          <View
            style={[
              styles.overallBarFill,
              {
                width: `${Math.min(100, Math.max(0, score))}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Individual Metrics */}
      <View style={styles.metricsContainer}>
        {metrics.map((metric, idx) => (
          <View key={idx} style={styles.metricRow}>
            <View style={styles.metricHeader}>
              <View style={styles.metricLabelRow}>
                <View
                  style={[styles.metricDot, { backgroundColor: metric.color }]}
                />
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  {metric.label}
                </Text>
              </View>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                {metric.displayValue}
              </Text>
            </View>
            <View
              style={[
                styles.metricBarTrack,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                },
              ]}
            >
              <View
                style={[
                  styles.metricBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, metric.value))}%`,
                    backgroundColor: metric.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 52,
  },
  scorePercent: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    marginLeft: 2,
  },
  scoreMeta: {
    flex: 1,
    paddingBottom: 6,
    gap: 6,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overallBarContainer: {
    marginTop: -6,
  },
  overallBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricsContainer: {
    gap: 14,
  },
  metricRow: {
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  metricBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
