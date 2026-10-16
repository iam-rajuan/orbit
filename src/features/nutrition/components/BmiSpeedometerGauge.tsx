import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polygon, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../../theme/ThemeContext';

interface BmiSpeedometerGaugeProps {
  bmi: number; // e.g. 22.4
  category: {
    label: string;
    color: string;
    sublabel: string;
  };
  size?: number;
}

export const BmiSpeedometerGauge: React.FC<BmiSpeedometerGaugeProps> = ({
  bmi,
  category,
  size = 280,
}) => {
  const { theme, isDark } = useTheme();

  // Dimensions
  const width = size;
  const height = size * 0.62; // semi-circle aspect ratio
  const cx = width / 2;
  const cy = height - 16;
  const radius = width * 0.38;
  const strokeWidth = 14;

  // Scale: BMI 14 to 38 mapped to 180 degrees (180° = left, 0° = right)
  const minBmi = 14;
  const maxBmi = 38;

  const bmiToAngle = (val: number): number => {
    const clamped = Math.min(maxBmi, Math.max(minBmi, val));
    const fraction = (clamped - minBmi) / (maxBmi - minBmi);
    return 180 - fraction * 180;
  };

  // Helper to convert polar coordinates to Cartesian
  const polarToCartesian = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  // Helper to build SVG arc path
  const createArc = (startAngle: number, endAngle: number, r: number) => {
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const angleDiff = Math.abs(startAngle - endAngle);
    const largeArc = angleDiff > 180 ? 1 : 0;
    // sweep 1 goes clockwise (angles decrease from 180 to 0)
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // Key thresholds in BMI:
  // Underweight: 14 -> 18.5
  // Normal: 18.5 -> 25.0
  // Overweight: 25.0 -> 30.0
  // Obese: 30.0 -> 38.0
  const angleStart = 180;
  const angle18_5 = bmiToAngle(18.5);
  const angle25_0 = bmiToAngle(25.0);
  const angle30_0 = bmiToAngle(30.0);
  const angleEnd = 0;

  // Arc paths for each zone
  const arcUnderweight = createArc(angleStart, angle18_5, radius);
  const arcNormal = createArc(angle18_5, angle25_0, radius);
  const arcOverweight = createArc(angle25_0, angle30_0, radius);
  const arcObese = createArc(angle30_0, angleEnd, radius);

  // Background full track (faded)
  const arcBackground = createArc(angleStart, angleEnd, radius);

  // Needle calculation
  const needleAngle = bmiToAngle(bmi);
  const needleLength = radius - 8;
  const tip = polarToCartesian(needleAngle, needleLength);
  const baseL = polarToCartesian(needleAngle + 90, 7);
  const baseR = polarToCartesian(needleAngle - 90, 7);
  const needlePoints = `${tip.x},${tip.y} ${baseL.x},${baseL.y} ${baseR.x},${baseR.y}`;

  // Ticks at 18.5, 25, 30
  const ticks = [
    { bmiVal: 18.5, angle: angle18_5, label: '18.5' },
    { bmiVal: 25.0, angle: angle25_0, label: '25' },
    { bmiVal: 30.0, angle: angle30_0, label: '30' },
  ];

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Background Track Arc */}
        <Path
          d={arcBackground}
          fill="none"
          stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Zone 1: Underweight (Blue/Cyan) */}
        <Path
          d={arcUnderweight}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Zone 2: Normal Weight (Emerald Green) */}
        <Path
          d={arcNormal}
          fill="none"
          stroke="#10B981"
          strokeWidth={strokeWidth}
        />

        {/* Zone 3: Overweight (Amber/Yellow) */}
        <Path
          d={arcOverweight}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={strokeWidth}
        />

        {/* Zone 4: Obese (Red/Rose) */}
        <Path
          d={arcObese}
          fill="none"
          stroke="#EF4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Tick markers */}
        {ticks.map((t, idx) => {
          const innerP = polarToCartesian(t.angle, radius - strokeWidth / 2 - 3);
          const outerP = polarToCartesian(t.angle, radius + strokeWidth / 2 + 3);
          const labelP = polarToCartesian(t.angle, radius - strokeWidth - 10);
          return (
            <React.Fragment key={idx}>
              <Line
                x1={innerP.x}
                y1={innerP.y}
                x2={outerP.x}
                y2={outerP.y}
                stroke={isDark ? '#FFFFFF' : '#18181B'}
                strokeWidth={1.5}
                opacity={0.6}
              />
              <SvgText
                x={labelP.x}
                y={labelP.y}
                fill={theme.textMuted}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
              >
                {t.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Speedometer Needle (Tapered Polygon) */}
        <Polygon
          points={needlePoints}
          fill={category.color}
          opacity={0.95}
        />

        {/* Needle Pivot Outer Cap */}
        <Circle
          cx={cx}
          cy={cy}
          r={10}
          fill={theme.surface}
          stroke={category.color}
          strokeWidth={3}
        />

        {/* Needle Pivot Inner Dot */}
        <Circle
          cx={cx}
          cy={cy}
          r={4}
          fill={category.color}
        />
      </Svg>

      {/* Digital Readout & Status beneath the speedometer */}
      <View style={styles.digitalReadout}>
        <View style={styles.numberRow}>
          <Text style={[styles.bmiNumber, { color: category.color }]}>
            {bmi > 0 ? bmi.toFixed(1) : '--'}
          </Text>
          <Text style={[styles.bmiUnit, { color: theme.textMuted }]}>BMI</Text>
        </View>

        {/* Status Pill Badge */}
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: `${category.color}18`,
              borderColor: `${category.color}40`,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: category.color }]} />
          <Text style={[styles.categoryText, { color: category.color }]}>
            {category.label}
          </Text>
        </View>

        <Text style={[styles.sublabelText, { color: theme.textSecondary }]}>
          {category.sublabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  digitalReadout: {
    alignItems: 'center',
    marginTop: -8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bmiNumber: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bmiUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sublabelText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
