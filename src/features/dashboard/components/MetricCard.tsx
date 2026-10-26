import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  accentColor?: string;
  footer?: string;
  onPress?: () => void;
  ctaLabel?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Premium metric card for the dashboard.
 * Displays a key metric with icon, optional sparkline (via children),
 * and a smart CTA link to the dedicated feature tab.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  subtitle,
  value,
  icon,
  iconBgColor,
  accentColor,
  footer,
  onPress,
  ctaLabel,
  children,
  style,
}) => {
  const { theme, isDark } = useTheme();

  const effectiveAccent = accentColor || theme.primary;
  const effectiveIconBg =
    iconBgColor || (isDark ? `${effectiveAccent}22` : `${effectiveAccent}12`);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(28, 28, 32, 0.75)' : 'rgba(255, 255, 255, 0.82)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.70)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.05,
          shadowRadius: 16,
          elevation: 2,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(25px) saturate(190%)',
                WebkitBackdropFilter: 'blur(25px) saturate(190%)',
              } as any)
            : {}),
        },
        style,
      ]}
    >
      {/* Header row: icon + title + CTA */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: effectiveIconBg }]}>{icon}</View>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {onPress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={[
              styles.ctaButton,
              {
                backgroundColor: isDark
                  ? `${effectiveAccent}18`
                  : `${effectiveAccent}10`,
              },
            ]}
          >
            <Text style={[styles.ctaText, { color: effectiveAccent }]}>
              {ctaLabel || 'View'}
            </Text>
            <ArrowRight size={12} color={effectiveAccent} />
          </TouchableOpacity>
        )}
      </View>

      {/* Value */}
      <View style={styles.valueSection}>
        <Text style={[styles.value, { color: theme.textPrimary }]}>{value}</Text>
      </View>

      {/* Chart / Sparkline (passed as children) */}
      {children && <View style={styles.chartSection}>{children}</View>}

      {/* Footer */}
      {footer && (
        <Text style={[styles.footer, { color: theme.textMuted }]} numberOfLines={1}>
          {footer}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  valueSection: {
    // empty row to hold value
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  chartSection: {
    marginTop: -4,
  },
  footer: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -4,
  },
});
