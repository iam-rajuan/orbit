import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerTitle?: string;
  centerSubtitle?: string;
  style?: ViewStyle;
  showLegend?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  size = 180,
  strokeWidth = 20,
  centerTitle,
  centerSubtitle,
  style,
  showLegend = true,
}) => {
  const { theme, isDark } = useTheme();
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <View style={[styles.container, style]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G transform={`rotate(-90 ${center} ${center})`}>
            {/* Background track circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isDark ? '#27272A' : '#F4F4F5'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {total > 0 &&
              segments.map((segment, index) => {
                if (segment.value <= 0) return null;
                const percent = segment.value / total;
                const strokeDasharray = `${circumference * percent} ${circumference}`;
                const strokeDashoffset = -circumference * accumulatedPercent;
                accumulatedPercent += percent;

                return (
                  <Circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    strokeLinecap="round"
                  />
                );
              })}
          </G>
        </Svg>

        {/* Center Text */}
        <View style={styles.centerTextContainer}>
          {centerTitle ? (
            <Text style={[styles.centerTitle, { color: theme.textPrimary }]}>{centerTitle}</Text>
          ) : null}
          {centerSubtitle ? (
            <Text style={[styles.centerSubtitle, { color: theme.textMuted }]}>{centerSubtitle}</Text>
          ) : null}
        </View>
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          {segments.map((seg, i) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <View
                key={i}
                style={[
                  styles.legendItem,
                  {
                    backgroundColor: theme.surfaceSubtle,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                <Text style={[styles.legendLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  {seg.label}
                </Text>
                <Text style={[styles.legendVal, { color: theme.textPrimary }]}>
                  {seg.formattedValue ? seg.formattedValue : `${pct}%`}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  centerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendVal: {
    fontSize: 12,
    fontWeight: '700',
  },
});
