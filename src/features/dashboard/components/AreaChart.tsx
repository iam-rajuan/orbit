import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

export interface AreaDataPoint {
  label: string;
  value: number;
  displayValue?: string;
}

interface AreaChartProps {
  data: AreaDataPoint[];
  height?: number;
  color?: string;
  gradientOpacity?: number;
  showGrid?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  yAxisSuffix?: string;
  style?: ViewStyle;
}

/**
 * Compute smooth cubic bezier path from points.
 * Creates a visually appealing curve through all data points.
 */
function computeSmoothPath(
  points: { x: number; y: number }[],
  smoothing: number = 0.2
): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * smoothing;
    const cp1y = p1.y + (p2.y - p0.y) * smoothing;
    const cp2x = p2.x - (p3.x - p1.x) * smoothing;
    const cp2y = p2.y - (p3.y - p1.y) * smoothing;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 160,
  color,
  gradientOpacity = 0.15,
  showGrid = true,
  showDots = true,
  showLabels = true,
  yAxisSuffix = '',
  style,
}) => {
  const { theme, isDark } = useTheme();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const chartColor = color || theme.primary;

  const paddingLeft = 0;
  const paddingRight = 0;
  const paddingTop = 24;
  const paddingBottom = showLabels ? 28 : 8;
  const chartHeight = height - paddingTop - paddingBottom;
  const gradientId = `areaGradient_${chartColor.replace('#', '')}`;

  // Compute chart dimensions and points
  const { points, chartWidth } = useMemo(() => {
    if (data.length === 0) return { points: [], chartWidth: 300 };

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    // We'll use 100% width via viewBox
    const w = 300;
    const step = data.length > 1 ? (w - paddingLeft - paddingRight) / (data.length - 1) : 0;

    const pts = data.map((d, i) => ({
      x: paddingLeft + i * step,
      y: paddingTop + chartHeight - ((d.value - min) / range) * chartHeight,
    }));

    return { points: pts, chartWidth: w };
  }, [data, chartHeight, paddingTop, paddingLeft, paddingRight]);

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No data available</Text>
        </View>
      </View>
    );
  }

  const linePath = computeSmoothPath(points);

  // Area path = line path + close to bottom
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x} ${paddingTop + chartHeight} L ${firstPoint.x} ${paddingTop + chartHeight} Z`;

  // Grid lines (3 horizontal)
  const gridLines = [0, 0.5, 1].map((ratio) => paddingTop + chartHeight * (1 - ratio));

  // Determine how many labels to show based on data count
  const labelInterval = data.length > 12 ? Math.ceil(data.length / 7) : data.length > 7 ? 2 : 1;

  return (
    <View style={[styles.container, { height }, style]}>
      {/* SVG chart — pure rendering, no touch handlers on SVG elements */}
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={chartColor} stopOpacity={gradientOpacity} />
            <Stop offset="1" stopColor={chartColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {showGrid &&
          gridLines.map((y, i) => (
            <Line
              key={`grid-${i}`}
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}

        {/* Gradient fill area */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Main line */}
        <Path
          d={linePath}
          stroke={chartColor}
          strokeWidth={2}
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots &&
          points.map((pt, i) => (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={activeIdx === i ? 5 : 2.5}
              fill={activeIdx === i ? chartColor : (isDark ? '#FAFAFA' : '#FFFFFF')}
              stroke={chartColor}
              strokeWidth={activeIdx === i ? 2 : 1.5}
            />
          ))}
      </Svg>

      {/* Native touch overlay — positioned absolutely on top of SVG */}
      <View style={[StyleSheet.absoluteFill, styles.touchOverlay]} pointerEvents="box-none">
        {points.map((_, i) => {
          const step = data.length > 1 ? 100 / (data.length - 1) : 100;
          const leftPercent = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
          const halfStep = step / 2;
          return (
            <TouchableOpacity
              key={`touch-${i}`}
              activeOpacity={1}
              onPress={() => setActiveIdx(activeIdx === i ? null : i)}
              style={{
                position: 'absolute',
                left: `${Math.max(0, leftPercent - halfStep)}%`,
                width: `${step}%`,
                top: 0,
                bottom: 0,
              }}
            />
          );
        })}
      </View>

      {/* X Axis Labels */}
      {showLabels && (
        <View style={styles.labelsRow}>
          {data.map((d, i) => {
            if (i % labelInterval !== 0 && i !== data.length - 1) return null;
            const leftPercent = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
            return (
              <Text
                key={`label-${i}`}
                numberOfLines={1}
                style={[
                  styles.xLabel,
                  {
                    color: activeIdx === i ? theme.textPrimary : theme.textMuted,
                    fontWeight: activeIdx === i ? '700' : '500',
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    transform: [{ translateX: -16 }],
                  },
                ]}
              >
                {d.label}
              </Text>
            );
          })}
        </View>
      )}

      {/* Active Tooltip */}
      {activeIdx !== null && data[activeIdx] && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: isDark ? '#27272A' : '#18181B',
              left: `${data.length > 1 ? (activeIdx / (data.length - 1)) * 100 : 50}%`,
              transform: [{ translateX: -40 }],
            },
          ]}
        >
          <Text style={styles.tooltipValue}>
            {data[activeIdx].displayValue || `${data[activeIdx].value}${yAxisSuffix}`}
          </Text>
          <Text style={styles.tooltipLabel}>{data[activeIdx].label}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  touchOverlay: {
    flexDirection: 'row',
  },
  labelsRow: {
    position: 'relative',
    height: 20,
    marginTop: -24,
  },
  xLabel: {
    fontSize: 10,
    textAlign: 'center',
    width: 32,
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tooltipLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
});
