import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

export interface BarDataPoint {
  label: string; // e.g. "Mon", "Tue", "Jan", etc.
  subLabel?: string; // e.g. "06", "07"
  value: number; // primary value, e.g. 80
  secondaryValue?: number; // e.g. 100 (total target)
  displayValue?: string; // e.g. "80%", "$450"
  isHighlighted?: boolean;
}

interface ActivityBarChartProps {
  data: BarDataPoint[];
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  maxExpectedValue?: number;
  unitLabel?: string;
  onSelectBar?: (point: BarDataPoint, index: number) => void;
  style?: ViewStyle;
}

export const ActivityBarChart: React.FC<ActivityBarChartProps> = ({
  data,
  height = 130,
  primaryColor = '#4F46E5',
  secondaryColor = '#EEF2FF',
  maxExpectedValue,
  unitLabel,
  onSelectBar,
  style,
}) => {
  const calculatedMax = Math.max(
    ...data.map((d) => Math.max(d.value, d.secondaryValue || 0)),
    maxExpectedValue || 1
  );

  return (
    <View style={[styles.container, style]}>
      {unitLabel && <Text style={styles.unitText}>{unitLabel}</Text>}

      <View style={[styles.barsContainer, { height }]}>
        {data.map((point, idx) => {
          const fillRatio = calculatedMax > 0 ? point.value / calculatedMax : 0;
          const barHeightPercent = Math.min(100, Math.max(8, fillRatio * 100));

          const targetRatio =
            point.secondaryValue && calculatedMax > 0
              ? point.secondaryValue / calculatedMax
              : 0;
          const trackHeightPercent = Math.min(100, Math.max(barHeightPercent, targetRatio * 100));

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => onSelectBar?.(point, idx)}
              style={styles.barColumn}
            >
              {/* Optional tooltip / display value above bar */}
              {point.displayValue ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.displayValueText,
                    point.isHighlighted && styles.displayValueHighlighted,
                  ]}
                >
                  {point.displayValue}
                </Text>
              ) : null}

              {/* Bar track + fill */}
              <View style={styles.barTrackWrapper}>
                <View
                  style={[
                    styles.barTrack,
                    {
                      height: `${trackHeightPercent || 100}%`,
                      backgroundColor: secondaryColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${(barHeightPercent / (trackHeightPercent || 100)) * 100}%`,
                        backgroundColor: point.isHighlighted ? '#18181B' : primaryColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Bar bottom label */}
              <View style={styles.labelWrapper}>
                <Text
                  style={[
                    styles.barLabel,
                    point.isHighlighted && styles.barLabelHighlighted,
                  ]}
                >
                  {point.label}
                </Text>
                {point.subLabel ? (
                  <Text style={styles.barSubLabel}>{point.subLabel}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 16,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  displayValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717A',
    marginBottom: 4,
    textAlign: 'center',
  },
  displayValueHighlighted: {
    color: '#18181B',
  },
  barTrackWrapper: {
    width: '100%',
    maxWidth: 24,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  labelWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  barLabelHighlighted: {
    color: '#18181B',
    fontWeight: '800',
  },
  barSubLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    marginTop: 1,
  },
});
