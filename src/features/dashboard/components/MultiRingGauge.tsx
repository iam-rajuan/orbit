import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

export interface RingData {
  label: string;
  percentage: number;
  color: string;
  bgColor: string;
  valueDisplay: string;
}

interface MultiRingGaugeProps {
  rings: [RingData, RingData, RingData];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  overallScore?: number;
  scoreLabel?: string;
  style?: ViewStyle;
}

export const MultiRingGauge: React.FC<MultiRingGaugeProps> = ({
  rings,
  size = 200,
  strokeWidth = 14,
  gap = 4,
  overallScore,
  scoreLabel = 'Score',
  style,
}) => {
  const { theme, isDark } = useTheme();
  const center = size / 2;

  // Radius for the 3 concentric rings (outer, middle, inner)
  const radii = [
    center - strokeWidth / 2 - 2,
    center - strokeWidth / 2 - (strokeWidth + gap),
    center - strokeWidth / 2 - (strokeWidth + gap) * 2,
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {rings.map((ring, idx) => {
              const r = radii[idx];
              const circumference = 2 * Math.PI * r;
              const pct = Math.min(100, Math.max(0, ring.percentage));
              const strokeDashoffset = circumference - (circumference * pct) / 100;
              const effectiveTrackColor = isDark ? 'rgba(255,255,255,0.06)' : ring.bgColor;

              return (
                <React.Fragment key={idx}>
                  {/* Track ring */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={r}
                    stroke={effectiveTrackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Progress ring */}
                  <Circle
                    cx={center}
                    cy={center}
                    r={r}
                    stroke={ring.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </React.Fragment>
              );
            })}
          </G>
        </Svg>

        {/* Center Score */}
        <View style={styles.centerContainer}>
          <Text style={[styles.scoreText, { color: theme.textPrimary }]}>
            {overallScore !== undefined ? `${overallScore}%` : '—'}
          </Text>
          <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>{scoreLabel}</Text>
        </View>
      </View>

      {/* Ring Legend Pills */}
      <View style={styles.legendContainer}>
        {rings.map((ring, i) => (
          <View
            key={i}
            style={[
              styles.legendPill,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={[styles.colorBar, { backgroundColor: ring.color }]} />
            <View>
              <Text style={[styles.ringLabel, { color: theme.textSecondary }]}>{ring.label}</Text>
              <Text style={[styles.ringVal, { color: theme.textPrimary }]}>{ring.valueDisplay}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  colorBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  ringLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  ringVal: {
    fontSize: 13,
    fontWeight: '800',
  },
});
