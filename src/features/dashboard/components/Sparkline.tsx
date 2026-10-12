import React, { useId, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showGradient?: boolean;
  label?: string;
  value?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  style?: ViewStyle;
}

/**
 * A compact sparkline chart for use inside stat/metric cards.
 * Shows a tiny line graph with optional gradient fill, trend arrow, and value.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 32,
  color,
  showGradient = true,
  label,
  value,
  trend,
  trendValue,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const reactId = useId();
  const lineColor = color || theme.primary;
  const gradientId = `spark_${lineColor.replace('#', '')}_${reactId.replace(/:/g, '')}`;

  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '' };

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const pad = 2;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const step = innerW / (data.length - 1);

    const points = data.map((v, i) => ({
      x: pad + i * step,
      y: pad + innerH - ((v - min) / range) * innerH,
    }));

    // Catmull-Rom to Bezier
    let line = `M ${points[0].x} ${points[0].y}`;
    const smoothing = 0.18;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) * smoothing;
      const cp1y = p1.y + (p2.y - p0.y) * smoothing;
      const cp2x = p2.x - (p3.x - p1.x) * smoothing;
      const cp2y = p2.y - (p3.y - p1.y) * smoothing;

      line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const area = `${line} L ${last.x} ${height - pad} L ${first.x} ${height - pad} Z`;

    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  const trendColor =
    trend === 'up'
      ? isDark
        ? '#34D399'
        : '#059669'
      : trend === 'down'
        ? isDark
          ? '#FB7185'
          : '#E11D48'
        : theme.textMuted;

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <View style={[styles.container, style]}>
      {(label || value) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={[styles.label, { color: theme.textMuted }]} numberOfLines={1}>
              {label}
            </Text>
          )}
          <View style={styles.valueRow}>
            {value && (
              <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
            )}
            {trendValue && (
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor:
                      trend === 'up'
                        ? isDark
                          ? 'rgba(16,185,129,0.15)'
                          : '#ECFDF5'
                        : trend === 'down'
                          ? isDark
                            ? 'rgba(244,63,94,0.15)'
                            : '#FFF1F2'
                          : theme.surfaceSubtle,
                  },
                ]}
              >
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {trendArrow} {trendValue}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {data.length >= 2 && (
        <Svg width={width} height={height}>
          {showGradient && (
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
                <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
          )}
          {showGradient && areaPath && (
            <Path d={areaPath} fill={`url(#${gradientId})`} />
          )}
          {linePath && (
            <Path
              d={linePath}
              stroke={lineColor}
              strokeWidth={1.5}
              fill="transparent"
              strokeLinecap="round"
            />
          )}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
